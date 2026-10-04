import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getDatabase, transaction } from "./database.mjs";
import { getSettings } from "./settings.mjs";
import { workflowStages } from "../data/settings.js";
import { record, text, choice } from "./validation.mjs";
import {
  HttpError,
  animalInput,
  requestInput,
  requestStatus,
} from "./validation.mjs";

export const hash = (value) => createHash("sha256").update(value).digest("hex");
function readAnimal(row) {
  return row
    ? {
        ...JSON.parse(row.content),
        slug: row.slug,
        status: row.status,
        published: Boolean(row.published),
        version: row.version,
      }
    : null;
}
export function listAnimals(
  { admin = false, available = false } = {},
  db = getDatabase(),
) {
  const conditions = [];
  if (!admin) conditions.push("published = 1");
  if (available) conditions.push("status = 'available'");
  return db
    .prepare(
      `SELECT * FROM animals ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY created_at, rowid`,
    )
    .all()
    .map(readAnimal);
}
export function getAnimal(slug, { admin = false } = {}, db = getDatabase()) {
  return readAnimal(
    db
      .prepare(
        `SELECT * FROM animals WHERE slug = ? ${admin ? "" : "AND published = 1"}`,
      )
      .get(slug),
  );
}
export function saveAnimal(input, existingSlug = null, db = getDatabase()) {
  const animal = animalInput(input);
  for (const image of [animal.image, ...animal.photos]) {
    const found = image.startsWith("/media/")
      ? db.prepare("SELECT id FROM media WHERE id=?").get(image.slice(7))
      : existsSync(resolve("public", image.slice(1)));
    if (!found)
      throw new HttpError(400, "Photo introuvable. Importez-la à nouveau.");
  }
  if (
    animal.adoptionStory &&
    (!animal.storyConsent || animal.status !== "adopted")
  )
    throw new HttpError(
      400,
      "Les nouvelles nécessitent un animal adopté et une autorisation de publication.",
    );
  return transaction(db, () => {
    if (existingSlug) {
      if (animal.slug !== existingSlug)
        throw new HttpError(
          400,
          "L’adresse d’une fiche existante ne peut pas être modifiée.",
        );
      if (!Number.isSafeInteger(input.version))
        throw new HttpError(400, "Version manquante. Rechargez la fiche.");
      const changed = db
        .prepare(
          "UPDATE animals SET content = ?, published = ?, status = ?, version = version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE slug = ? AND version = ?",
        )
        .run(
          JSON.stringify(animal),
          Number(animal.published),
          animal.status,
          existingSlug,
          input.version,
        );
      if (!changed.changes)
        throw new HttpError(
          409,
          "La fiche a changé. Rechargez-la avant de recommencer.",
        );
    } else {
      if (getAnimal(animal.slug, { admin: true }, db))
        throw new HttpError(409, "Cette adresse est déjà utilisée.");
      db.prepare(
        "INSERT INTO animals(slug,content,published,status) VALUES(?,?,?,?)",
      ).run(
        animal.slug,
        JSON.stringify(animal),
        Number(animal.published),
        animal.status,
      );
    }
    return getAnimal(animal.slug, { admin: true }, db);
  });
}
// Persistent counters also work across server restarts. Never trust forwarded IPs.
export function consumeLimit(key, limit, windowMs, db = getDatabase()) {
  const now = Date.now();
  db.prepare("DELETE FROM rate_limits WHERE expires_at < ?").run(now);
  const current = db
    .prepare("SELECT * FROM rate_limits WHERE key = ?")
    .get(key);
  if (current && current.count >= limit)
    throw new HttpError(429, "Trop de tentatives. Réessayez plus tard.");
  db.prepare(
    "INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  ).run(key, now + windowMs);
}
export function submitRequest(input, key, db = getDatabase()) {
  if (typeof key !== "string" || !/^[a-zA-Z0-9-]{20,80}$/.test(key))
    throw new HttpError(400, "Identifiant d’envoi invalide.");
  const payload = requestInput(input);
  const fingerprint = hash(JSON.stringify(payload));
  return transaction(db, () => {
    const existing = db
      .prepare("SELECT id,payload_hash FROM requests WHERE idempotency_key = ?")
      .get(key);
    if (existing) {
      if (existing.payload_hash !== fingerprint)
        throw new HttpError(
          409,
          "Ce message a déjà été envoyé avec un autre contenu. Rechargez la page pour une nouvelle demande.",
        );
      return { id: existing.id, duplicate: true };
    }
    if (payload.kind === "meeting") {
      const animal = getAnimal(payload.animal, {}, db);
      if (!animal || animal.status !== "available")
        throw new HttpError(
          409,
          "Ce compagnon n’est plus disponible pour une demande. Actualisez la page.",
        );
      payload.animalName = animal.name;
      payload.demo = animal.demo;
    }
    consumeLimit("requests:global", 120, 3600000, db);
    consumeLimit(`requests:${hash(payload.email)}`, 5, 3600000, db);
    if (payload.whatsappConsent)
      consumeLimit(`whatsapp:${hash(payload.phone)}`, 3, 86400000, db);
    const id = randomUUID();
    db.prepare(
      "INSERT INTO requests(id,idempotency_key,payload_hash,kind,animal_slug,payload) VALUES(?,?,?,?,?,?)",
    ).run(
      id,
      key,
      fingerprint,
      payload.kind,
      payload.animal || null,
      JSON.stringify(payload),
    );
    const settings = getSettings(db);
    db.prepare("INSERT INTO request_followup(request_id) VALUES(?)").run(id);
    if (
      settings.whatsappEnabled &&
      settings.whatsappTeamConsent &&
      !payload.demo
    ) {
      const enqueue = db.prepare(
        "INSERT INTO notifications(request_id,audience,recipient) VALUES(?,?,?)",
      );
      enqueue.run(id, "team", settings.whatsappTeam);
      if (payload.whatsappConsent) enqueue.run(id, "applicant", payload.phone);
    }
    return { id, duplicate: false };
  });
}
export function listRequests(db = getDatabase()) {
  return db
    .prepare(
      "SELECT id,kind,payload,status,created_at FROM requests ORDER BY created_at DESC LIMIT 500",
    )
    .all()
    .map((row) => {
      const followup = db
        .prepare("SELECT * FROM request_followup WHERE request_id=?")
        .get(row.id);
      return {
        ...row,
        payload: JSON.parse(row.payload),
        followup: {
          stage: "received",
          assignee: "",
          notes: "",
          nextAction: "",
          appointment: "",
          followupDate: "",
          ...(followup ? JSON.parse(followup.content) : {}),
          version: followup?.version || 0,
        },
        events: db
          .prepare(
            "SELECT actor,description,created_at FROM request_events WHERE request_id=? ORDER BY id DESC LIMIT 20",
          )
          .all(row.id)
          .map((event) => ({ ...event })),
      };
    });
}
export function updateRequest(id, input, db = getDatabase(), actor = "Équipe") {
  const data = typeof input === "string" ? { status: input } : record(input);
  const status = requestStatus(data.status);
  return transaction(db, () => {
    const existing = db
      .prepare("SELECT status FROM requests WHERE id=?")
      .get(id);
    if (!existing) throw new HttpError(404, "Demande introuvable.");
    db.prepare(
      "INSERT OR IGNORE INTO request_followup(request_id) VALUES(?)",
    ).run(id);
    if (data.followup) {
      const f = record(data.followup);
      const content = {
        stage: choice(f.stage, Object.keys(workflowStages), "Étape"),
      };
      for (const [key, max] of [
        ["assignee", 100],
        ["notes", 5000],
        ["nextAction", 500],
        ["appointment", 40],
        ["followupDate", 40],
      ])
        content[key] = text(f[key] ?? "", key, max, 0);
      for (const key of ["appointment", "followupDate"])
        if (
          content[key] &&
          (!/^\d{4}-\d{2}-\d{2}T/.test(content[key]) ||
            !Number.isFinite(Date.parse(content[key])))
        )
          throw new HttpError(400, "Date invalide.");
      if (
        !db
          .prepare(
            "UPDATE request_followup SET content=?,version=version+1 WHERE request_id=? AND version=?",
          )
          .run(JSON.stringify(content), id, f.version || 1).changes
      )
        throw new HttpError(
          409,
          "Ce dossier a changé. Actualisez avant de réessayer.",
        );
    } else
      db.prepare(
        "UPDATE request_followup SET version=version+1 WHERE request_id=?",
      ).run(id);
    db.prepare(
      "UPDATE request_followup SET closed_at = CASE WHEN ?='closed' THEN coalesce(closed_at,strftime('%Y-%m-%dT%H:%M:%fZ','now')) ELSE NULL END WHERE request_id=?",
    ).run(status, id);
    db.prepare("UPDATE requests SET status=? WHERE id=?").run(status, id);
    db.prepare(
      "INSERT INTO request_events(request_id,actor,description) VALUES(?,?,?)",
    ).run(
      id,
      actor,
      data.followup
        ? `Suivi enregistré · ${workflowStages[data.followup.stage]}`
        : `État : ${status}`,
    );
  });
}
export function deleteRequest(id, db = getDatabase()) {
  if (!db.prepare("DELETE FROM requests WHERE id = ?").run(id).changes)
    throw new HttpError(404, "Demande introuvable.");
}
