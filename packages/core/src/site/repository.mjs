import { consumeRate } from "../rate-limit.mjs";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getDatabase, transaction } from "../database.mjs";
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
        ...row.content,
        slug: row.slug,
        status: row.status,
        published: Boolean(row.published),
        version: row.version,
      }
    : null;
}
export async function listAnimals(
  { admin = false, available = false } = {},
  db = getDatabase(),
) {
  const conditions = [];
  if (!admin) conditions.push("published = 1");
  if (available) conditions.push("status = 'available'");
  return (
    await db.query(
      `SELECT * FROM animals ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY created_at, slug`,
      [],
    )
  ).rows.map(readAnimal);
}
export async function getAnimal(
  slug,
  { admin = false } = {},
  db = getDatabase(),
) {
  return readAnimal(
    (
      await db.query(
        `SELECT * FROM animals WHERE slug = $1 ${admin ? "" : "AND published = 1"}`,
        [slug],
      )
    ).rows[0],
  );
}
export async function saveAnimal(
  input,
  existingSlug = null,
  db = getDatabase(),
) {
  const animal = animalInput(input);
  for (const image of [animal.image, ...animal.photos]) {
    const found = image.startsWith("/media/")
      ? (await db.query("SELECT id FROM media WHERE id=$1", [image.slice(7)]))
          .rows[0]
      : existsSync(
          /* turbopackIgnore: true */ resolve(
            process.env.PUBLIC_ASSETS_ROOT || "public",
            image.slice(1),
          ),
        );
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
  return await transaction(db, async () => {
    if (existingSlug) {
      if (animal.slug !== existingSlug)
        throw new HttpError(
          400,
          "L’adresse d’une fiche existante ne peut pas être modifiée.",
        );
      if (!Number.isSafeInteger(input.version))
        throw new HttpError(400, "Version manquante. Rechargez la fiche.");
      const changed = await db.query(
        "UPDATE animals SET content = $1, published = $2, status = $3, version = version + 1, updated_at = CURRENT_TIMESTAMP WHERE slug = $4 AND version = $5",
        [
          JSON.stringify(animal),
          Number(animal.published),
          animal.status,
          existingSlug,
          input.version,
        ],
      );
      if (!changed.rowCount)
        throw new HttpError(
          409,
          "La fiche a changé. Rechargez-la avant de recommencer.",
        );
    } else {
      if (
        await getAnimal(
          animal.slug,
          {
            admin: true,
          },
          db,
        )
      )
        throw new HttpError(409, "Cette adresse est déjà utilisée.");
      await db.query(
        "INSERT INTO animals(slug,content,published,status) VALUES($1,$2,$3,$4)",
        [
          animal.slug,
          JSON.stringify(animal),
          Number(animal.published),
          animal.status,
        ],
      );
    }
    return await getAnimal(
      animal.slug,
      {
        admin: true,
      },
      db,
    );
  });
}
// Persistent counters also work across server restarts. Never trust forwarded IPs.
export const consumeLimit = consumeRate;
export async function submitRequest(input, key, db = getDatabase()) {
  if (typeof key !== "string" || !/^[a-zA-Z0-9-]{20,80}$/.test(key))
    throw new HttpError(400, "Identifiant d’envoi invalide.");
  const payload = requestInput(input);
  const fingerprint = hash(JSON.stringify(payload));
  return await transaction(db, async () => {
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      key,
    ]);
    const existing = (
      await db.query(
        "SELECT id,payload_hash FROM requests WHERE idempotency_key = $1",
        [key],
      )
    ).rows[0];
    if (existing) {
      if (existing.payload_hash !== fingerprint)
        throw new HttpError(
          409,
          "Ce message a déjà été envoyé avec un autre contenu. Rechargez la page pour une nouvelle demande.",
        );
      return {
        id: existing.id,
        duplicate: true,
      };
    }
    if (payload.kind === "meeting") {
      const animal = await getAnimal(payload.animal, {}, db);
      if (!animal || animal.status !== "available")
        throw new HttpError(
          409,
          "Ce compagnon n’est plus disponible pour une demande. Actualisez la page.",
        );
      payload.animalName = animal.name;
      payload.demo = animal.demo;
    }
    await consumeLimit("requests:global", 120, 3600000, db);
    await consumeLimit(`requests:${hash(payload.email)}`, 5, 3600000, db);
    if (payload.whatsappConsent)
      await consumeLimit(`whatsapp:${hash(payload.phone)}`, 3, 86400000, db);
    const id = randomUUID();
    await db.query(
      "INSERT INTO requests(id,idempotency_key,payload_hash,kind,animal_slug,payload) VALUES($1,$2,$3,$4,$5,$6)",
      [
        id,
        key,
        fingerprint,
        payload.kind,
        payload.animal || null,
        JSON.stringify(payload),
      ],
    );
    const settings = await getSettings(db);
    await db.query("INSERT INTO request_followup(request_id) VALUES($1)", [id]);
    if (
      settings.whatsappEnabled &&
      settings.whatsappTeamConsent &&
      !payload.demo
    ) {
      const enqueue = (...values) =>
        db.query(
          "INSERT INTO notifications(request_id,audience,recipient) VALUES($1,$2,$3)",
          values,
        );
      await enqueue(id, "team", settings.whatsappTeam);
      if (payload.whatsappConsent)
        await enqueue(id, "applicant", payload.phone);
    }
    return {
      id,
      duplicate: false,
    };
  });
}
export async function listRequests(db = getDatabase()) {
  return await Promise.all(
    (
      await db.query(
        "SELECT id,kind,payload,status,created_at FROM requests ORDER BY created_at DESC LIMIT 500",
        [],
      )
    ).rows.map(async (row) => {
      const followup = (
        await db.query("SELECT * FROM request_followup WHERE request_id=$1", [
          row.id,
        ])
      ).rows[0];
      return {
        ...row,
        payload: row.payload,
        followup: {
          stage: "received",
          assignee: "",
          notes: "",
          nextAction: "",
          appointment: "",
          followupDate: "",
          ...(followup ? followup.content : {}),
          version: followup?.version || 0,
        },
        events: (
          await db.query(
            "SELECT actor,description,created_at FROM request_events WHERE request_id=$1 ORDER BY id DESC LIMIT 20",
            [row.id],
          )
        ).rows.map((event) => ({
          ...event,
        })),
      };
    }),
  );
}
export async function updateRequest(
  id,
  input,
  db = getDatabase(),
  actor = "Équipe",
) {
  const data =
    typeof input === "string"
      ? {
          status: input,
        }
      : record(input);
  const status = requestStatus(data.status);
  return await transaction(db, async () => {
    const existing = (
      await db.query("SELECT status FROM requests WHERE id=$1", [id])
    ).rows[0];
    if (!existing) throw new HttpError(404, "Demande introuvable.");
    await db.query(
      "INSERT INTO request_followup(request_id) VALUES($1) ON CONFLICT DO NOTHING",
      [id],
    );
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
        !(
          await db.query(
            "UPDATE request_followup SET content=$1,version=version+1 WHERE request_id=$2 AND version=$3",
            [JSON.stringify(content), id, f.version || 1],
          )
        ).rowCount
      )
        throw new HttpError(
          409,
          "Ce dossier a changé. Actualisez avant de réessayer.",
        );
    } else
      await db.query(
        "UPDATE request_followup SET version=version+1 WHERE request_id=$1",
        [id],
      );
    await db.query(
      "UPDATE request_followup SET closed_at = CASE WHEN $1='closed' THEN coalesce(closed_at,CURRENT_TIMESTAMP) ELSE NULL END WHERE request_id=$2",
      [status, id],
    );
    await db.query("UPDATE requests SET status=$1 WHERE id=$2", [status, id]);
    await db.query(
      "INSERT INTO request_events(request_id,actor,description) VALUES($1,$2,$3)",
      [
        id,
        actor,
        data.followup
          ? `Suivi enregistré · ${workflowStages[data.followup.stage]}`
          : `État : ${status}`,
      ],
    );
  });
}
export async function deleteRequest(id, db = getDatabase()) {
  if (!(await db.query("DELETE FROM requests WHERE id = $1", [id])).rowCount)
    throw new HttpError(404, "Demande introuvable.");
}
