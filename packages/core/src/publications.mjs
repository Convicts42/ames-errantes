import { getDatabase, transaction } from "./database.mjs";
import { AppError, text, version } from "./workspace/errors.mjs";
export async function publishDocument(id, input, user, db = getDatabase()) {
  const slug = text(input.slug, "Adresse publique", 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new AppError(400, "Adresse publique invalide.");
  return transaction(db, async () => {
    const d = (
      await db.query("SELECT * FROM documents WHERE id=$1 FOR UPDATE", [id])
    ).rows[0];
    if (!d) throw new AppError(404, "Document introuvable.");
    if (d.version !== version(input.version))
      throw new AppError(
        409,
        "Le document a changé. Relisez sa dernière version.",
      );
    const rev = (
      await db.query(
        "SELECT id FROM revisions WHERE document_id=$1 AND version=$2",
        [id, d.version],
      )
    ).rows[0];
    await db.query(
      "INSERT INTO document_publications(document_id,revision_id,slug,published_by) VALUES($1,$2,$3,$4) ON CONFLICT(document_id) DO UPDATE SET revision_id=excluded.revision_id,slug=excluded.slug,published_by=excluded.published_by,published_at=now()",
      [id, rev.id, slug, user.name],
    );
    return getPublication(id, db);
  });
}
export async function getPublication(id, db = getDatabase()) {
  return (
    (
      await db.query(
        "SELECT p.*,r.version FROM document_publications p JOIN revisions r ON r.id=p.revision_id WHERE p.document_id=$1",
        [id],
      )
    ).rows[0] || null
  );
}
export async function unpublishDocument(id, db = getDatabase()) {
  await db.query("DELETE FROM document_publications WHERE document_id=$1", [
    id,
  ]);
}
export async function publicDocuments(slug = null, db = getDatabase()) {
  return (
    await db.query(
      `SELECT p.slug,p.published_at,r.title,r.html,r.version FROM document_publications p JOIN revisions r ON r.id=p.revision_id ${slug ? "WHERE p.slug=$1" : ""} ORDER BY p.published_at DESC`,
      slug ? [slug] : [],
    )
  ).rows;
}
export async function activity(db = getDatabase()) {
  return (
    await db.query(
      "SELECT id,actor,entity,entity_id,action,created_at FROM audit_events ORDER BY id DESC LIMIT 100",
    )
  ).rows;
}
