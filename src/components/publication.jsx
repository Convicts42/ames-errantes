"use client";
import { useEffect, useState } from "react";
import { Dialog } from "./dialog";
import { api } from "./api";
export function Publication({ doc, onClose }) {
  const [state, setState] = useState(null),
    [slug, setSlug] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api(`documents/${doc.id}/publication`)
      .then((d) => {
        setState(d.publication);
        setSlug(
          d.publication?.slug ||
            doc.title
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 75),
        );
      })
      .then(() => setLoading(false))
      .catch((e) => setError(e.message));
  }, [doc.id]);
  async function submit(remove = false) {
    setBusy(true);
    setError("");
    try {
      const data = await api(
        `documents/${doc.id}/${remove ? "unpublish" : "publish"}`,
        { method: "POST", body: remove ? {} : { version: doc.version, slug } },
      );
      setState(data.publication);
      if (remove) onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Publication sur le site" onClose={onClose}>
      <div className="dialog-body">
        <p>
          {loading
            ? "Lecture de la publication…"
            : state
              ? `La version ${state.version} est visible sur le site.`
              : "Ce document est actuellement privé."}{" "}
          Publier rend le document complet visible aux visiteurs. Les prochaines
          modifications resteront privées jusqu’à une nouvelle publication.
        </p>
        <label>
          Adresse du document sur le site
          <input
            value={slug}
            disabled={loading || busy}
            onChange={(e) => setSlug(e.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={80}
          />
        </label>
        <p>
          Version à publier : {doc.version} — {doc.title}
        </p>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          {state && (
            <button
              className="button"
              disabled={busy}
              onClick={() => submit(true)}
            >
              Retirer du site
            </button>
          )}
          <button
            className="button primary"
            disabled={loading || busy || !slug}
            onClick={() => submit(false)}
          >
            Publier cette version
          </button>
        </div>
      </div>
    </Dialog>
  );
}
