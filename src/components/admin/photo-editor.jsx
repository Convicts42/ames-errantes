"use client";
import { useState } from "react";

export function PhotoEditor({ photos, onChange, onBusy }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(event) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (files.length + photos.length > 8) {
      setError("Huit photos maximum.");
      input.value = "";
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    const added = [...photos];
    try {
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024)
          throw new Error("Chaque photo doit faire moins de 8 Mo.");
        const response = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Import impossible.");
        added.push(result.url);
        onChange([...added]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      onBusy(false);
      input.value = "";
    }
  }
  return (
    <section className="photo-editor" aria-label="Photos du compagnon">
      <h3>Ses photos</h3>
      <p>
        La première photo sert de couverture. JPEG, PNG ou WebP, 8 Mo par photo.
        Les données de localisation sont retirées à l’import.
      </p>
      <div className="photo-grid">
        {photos.map((url, index) => (
          <div key={url}>
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              width="240"
              height="180"
            />
            <div className="admin-actions">
              <button
                type="button"
                className="text-link"
                disabled={busy || index === 0}
                onClick={() =>
                  onChange([url, ...photos.filter((_, i) => i !== index)])
                }
              >
                Couverture
              </button>
              <button
                type="button"
                className="text-link danger"
                disabled={busy}
                onClick={() => onChange(photos.filter((_, i) => i !== index))}
              >
                Retirer la photo {index + 1}
              </button>
            </div>
          </div>
        ))}
      </div>
      <label>
        Ajouter des photos
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={busy || photos.length >= 8}
          onChange={upload}
        />
      </label>
      {busy && (
        <p role="status">
          Import des photos… Attendez la fin avant d’enregistrer la fiche.
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </section>
  );
}
