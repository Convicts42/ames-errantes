import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { getDatabase } from "./database.mjs";
import { HttpError } from "./validation.mjs";

export async function savePhoto(bytes, db = getDatabase()) {
  if (!bytes.length || bytes.length > 8 * 1024 * 1024)
    throw new HttpError(413, "Photo trop volumineuse (8 Mo maximum).");
  let output;
  try {
    const image = sharp(bytes, { limitInputPixels: 25000000, animated: false });
    const metadata = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format))
      throw new Error("format");
    // Re-encoding strips EXIF, GPS and any embedded payload; no original is served.
    output = await image
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new HttpError(
      400,
      "Choisissez une photo JPEG, PNG ou WebP valide (25 millions de pixels maximum).",
    );
  }
  const id = randomUUID();
  db.prepare("INSERT INTO media(id,bytes) VALUES(?,?)").run(id, output);
  return `/media/${id}`;
}
export function readPhoto(id, admin = false, db = getDatabase()) {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  if (
    !admin &&
    !db
      .prepare(
        "SELECT 1 FROM animals WHERE published=1 AND (json_extract(content,'$.image')=? OR EXISTS(SELECT 1 FROM json_each(animals.content,'$.photos') WHERE value=?))",
      )
      .get(`/media/${id}`, `/media/${id}`)
  )
    return null;
  return (
    db.prepare("SELECT bytes FROM media WHERE id=?").get(id)?.bytes || null
  );
}
