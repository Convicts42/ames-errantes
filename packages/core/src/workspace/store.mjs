import { randomUUID } from "node:crypto";
import { getDatabase, transaction } from "../database.mjs";
import { AppError, text, choice, version } from "./errors.mjs";
import { cleanHtml, plainText } from "./content.mjs";
import {
  categories,
  documentStatuses,
  taskStatuses,
} from "../shared/project.js";
const now = () => new Date().toISOString();
async function snapshot(db, d) {
  await db.query(
    "INSERT INTO revisions(document_id,version,title,category,status,html,author,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      d.id,
      d.version,
      d.title,
      d.category,
      d.status,
      d.html,
      d.updated_by,
      d.updated_at,
    ],
  );
}
export async function listDocuments(db = getDatabase()) {
  return (
    await db.query(
      "SELECT id,title,category,status,version,updated_at,updated_by,substr(search_text,1,180) AS excerpt FROM documents ORDER BY lower(title)",
      [],
    )
  ).rows;
}
export async function searchDocuments(query, db = getDatabase()) {
  const q = text(query, "Recherche", 200, 0);
  return (
    await db.query(
      "SELECT id,title,category,status,version,updated_at,updated_by,substr(search_text,1,180) AS excerpt FROM documents WHERE strpos(lower(title),lower($1))>0 OR strpos(lower(search_text),lower($2))>0 ORDER BY title",
      [q, q],
    )
  ).rows;
}
export async function getDocument(id, db = getDatabase()) {
  const d = (
    await db.query(
      "SELECT id,title,category,status,html,version,updated_at,updated_by FROM documents WHERE id=$1",
      [id],
    )
  ).rows[0];
  if (!d) throw new AppError(404, "Ce dossier est introuvable.");
  return d;
}
function validatedDocument(input) {
  return {
    title: text(input.title, "Le titre", 180),
    category: choice(
      input.category,
      categories.map((c) => c.id),
      "Le dossier",
    ),
    status: choice(input.status, Object.keys(documentStatuses), "Le statut"),
    html: cleanHtml(input.html),
  };
}
export async function createDocument(input, user, db = getDatabase()) {
  const d = validatedDocument(input),
    id = randomUUID();
  return await transaction(db, async () => {
    await db.query(
      "INSERT INTO documents(id,title,category,status,html,search_text,updated_at,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
      [
        id,
        d.title,
        d.category,
        d.status,
        d.html,
        plainText(d.html),
        now(),
        user.name,
      ],
    );
    const saved = await getDocument(id, db);
    await snapshot(db, saved);
    return saved;
  });
}
export async function updateDocument(id, input, user, db = getDatabase()) {
  const expected = version(input.version),
    d = validatedDocument(input);
  return await transaction(db, async () => {
    await db.query("SELECT id FROM documents WHERE id=$1 FOR UPDATE", [id]);
    const current = await getDocument(id, db);
    if (current.version !== expected)
      throw new AppError(
        409,
        "Ce dossier a été modifié ailleurs. Votre texte est conservé : consultez la dernière version avant de réessayer.",
      );
    await db.query(
      "UPDATE documents SET title=$1,category=$2,status=$3,html=$4,search_text=$5,version=version+1,updated_at=$6,updated_by=$7 WHERE id=$8",
      [
        d.title,
        d.category,
        d.status,
        d.html,
        plainText(d.html),
        now(),
        user.name,
        id,
      ],
    );
    const saved = await getDocument(id, db);
    await snapshot(db, saved);
    return saved;
  });
}
export async function listRevisions(id, db = getDatabase()) {
  await getDocument(id, db);
  return (
    await db.query(
      "SELECT id,version,title,author,created_at FROM revisions WHERE document_id=$1 ORDER BY version DESC",
      [id],
    )
  ).rows;
}
export async function getRevision(id, revision, db = getDatabase()) {
  const row = (
    await db.query("SELECT * FROM revisions WHERE document_id=$1 AND id=$2", [
      id,
      Number(revision),
    ])
  ).rows[0];
  if (!row) throw new AppError(404, "Version introuvable.");
  return row;
}
export async function restoreRevision(id, input, user, db = getDatabase()) {
  const revision = await getRevision(id, input.revisionId, db);
  return await updateDocument(
    id,
    {
      ...revision,
      version: input.version,
    },
    user,
    db,
  );
}
export async function listTasks(db = getDatabase()) {
  return (
    await db.query(
      "SELECT tasks.*, users.name AS assignee_name FROM tasks LEFT JOIN users ON users.id=tasks.assignee ORDER BY tasks.updated_at DESC, tasks.id",
      [],
    )
  ).rows;
}
export async function saveTask(id, input, user, db = getDatabase()) {
  const title = text(input.title, "Le titre", 200),
    note = text(input.note || "", "La note", 4000, 0);
  const status = choice(input.status, Object.keys(taskStatuses), "Le statut");
  const assignee = input.assignee || null,
    doc = input.document_id || null;
  if (
    assignee &&
    !(
      await db.query("SELECT id FROM users WHERE id=$1 AND active=1", [
        assignee,
      ])
    ).rows[0]
  )
    throw new AppError(400, "Membre introuvable.");
  if (doc) await getDocument(doc, db);
  return await transaction(db, async () => {
    if (id) {
      const current = (
        await db.query("SELECT version FROM tasks WHERE id=$1 FOR UPDATE", [id])
      ).rows[0];
      if (!current) throw new AppError(404, "Point introuvable.");
      if (current.version !== version(input.version))
        throw new AppError(
          409,
          "Ce point a changé. Actualisez la liste avant de réessayer.",
        );
      await db.query(
        "UPDATE tasks SET title=$1,note=$2,status=$3,assignee=$4,document_id=$5,version=version+1,updated_at=$6,updated_by=$7 WHERE id=$8",
        [title, note, status, assignee, doc, now(), user.name, id],
      );
    } else {
      id = randomUUID();
      await db.query(
        "INSERT INTO tasks(id,title,note,status,assignee,document_id,updated_at,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, title, note, status, assignee, doc, now(), user.name],
      );
    }
    return (await db.query("SELECT * FROM tasks WHERE id=$1", [id])).rows[0];
  });
}
export async function exportProject(db = getDatabase()) {
  return {
    format: "ames-errantes-project",
    version: 1,
    exportedAt: now(),
    documents: (await db.query("SELECT * FROM documents", [])).rows,
    revisions: (await db.query("SELECT * FROM revisions", [])).rows,
    tasks: (await listTasks(db)).map(({ assignee, ...t }) => t),
  };
}
