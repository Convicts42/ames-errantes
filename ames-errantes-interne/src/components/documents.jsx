"use client";
import { useEffect, useState } from "react";
import { categories, documentStatuses } from "@ames/core/shared/project.js";
import { api, dateLabel, timeLabel } from "./api";
import { Icon } from "./icons";
import { Dialog } from "./dialog";
import { DocumentEditor } from "./editor";
import { Publication } from "./publication";

export function Status({ value }) {
  return (
    <span className={`status status-${value}`}>
      <span />
      {documentStatuses[value] || value}
    </span>
  );
}
export function DocumentList({ documents, category, navigate, onCreate }) {
  const item = categories.find((c) => c.id === category),
    docs = documents.filter((d) => !category || d.category === category);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LE DOSSIER DU REFUGE</span>
          <h1>{item?.label || "Tous nos dossiers"}</h1>
          <p>
            {item?.description ||
              "Des documents clairs pour construire le projet à deux."}
          </p>
        </div>
        <button className="button primary" onClick={() => onCreate(category)}>
          <Icon name="plus" size={18} />
          Nouveau document
        </button>
      </div>
      <div className="document-list">
        {docs.map((d) => (
          <button
            className="document-row"
            key={d.id}
            onClick={() => navigate(`/dossiers/${d.id}`)}
          >
            <span
              className={`file-icon ${categories.find((c) => c.id === d.category)?.color}`}
            >
              <Icon name="file" />
            </span>
            <span className="document-row-main">
              <strong>{d.title}</strong>
              <small>
                {d.updated_by} · {dateLabel(d.updated_at)}
              </small>
            </span>
            <Status value={d.status} />
            <Icon name="chevron" size={18} />
          </button>
        ))}
        {!docs.length && (
          <div className="empty-state">
            <Icon name="file" size={30} />
            <h2>Une page à écrire.</h2>
            <p>Ajoutez le premier document de ce dossier.</p>
          </div>
        )}
      </div>
      <p className="quiet-note">
        <Icon name="lock" size={15} />
        Tous les documents de cet espace sont privés.
      </p>
    </>
  );
}
export function CreateDocument({ category, onClose, onCreated }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const input = Object.fromEntries(new FormData(e.currentTarget));
      const { document } = await api("documents", {
        method: "POST",
        body: { ...input, status: "draft", html: "<p></p>" },
      });
      onCreated(document);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog title="Nouveau document" onClose={onClose}>
      <form className="dialog-body" onSubmit={submit}>
        <label>
          Titre
          <input
            name="title"
            required
            maxLength={180}
            autoFocus
            placeholder="Par exemple : nos premières idées"
          />
        </label>
        <label>
          Dossier
          <select name="category" defaultValue={category || "projet"}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            Annuler
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Création…" : "Créer le document"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function DocumentView({
  id,
  user,
  onChanged,
  onDirty,
  navigate,
  latestVersion,
}) {
  const [publishing, setPublishing] = useState(false);
  const [doc, setDoc] = useState(null),
    [form, setForm] = useState(null),
    [editing, setEditing] = useState(false),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [history, setHistory] = useState(null),
    [preview, setPreview] = useState(null);
  const draftKey = `ames-draft:${user.id}:${id}`;
  useEffect(() => {
    if (
      !doc ||
      editing ||
      dirty ||
      !latestVersion ||
      latestVersion === doc.version
    )
      return;
    let active = true;
    api(`documents/${id}`)
      .then(({ document: d }) => {
        if (active) {
          setDoc(d);
          setForm(d);
          setNotice(
            "Le document a été actualisé avec les dernières modifications.",
          );
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id, latestVersion, doc?.version, editing, dirty]);
  useEffect(() => {
    let alive = true;
    setDoc(null);
    setError("");
    api(`documents/${id}`)
      .then(({ document: d }) => {
        if (!alive) return;
        setDoc(d);
        setForm(d);
        try {
          const draft = JSON.parse(sessionStorage.getItem(draftKey));
          if (draft?.id === id) {
            setForm(draft);
            setEditing(true);
            setDirty(true);
            setNotice(
              "Votre brouillon non enregistré a été retrouvé sur cet appareil.",
            );
          }
        } catch {}
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id, draftKey]);
  useEffect(() => {
    onDirty(dirty);
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      onDirty(false);
    };
  }, [dirty, onDirty]);
  function change(patch) {
    setForm((current) => {
      const next = { ...current, ...patch };
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(next));
      } catch {}
      return next;
    });
    setDirty(true);
    setNotice("");
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const { document: d } = await api(`documents/${id}`, {
        method: "PUT",
        body: form,
      });
      setDoc(d);
      setForm(d);
      setDirty(false);
      setEditing(false);
      sessionStorage.removeItem(draftKey);
      setNotice("Modifications enregistrées.");
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function cancel() {
    if (
      dirty &&
      !window.confirm("Abandonner les modifications de ce brouillon ?")
    )
      return;
    setForm(doc);
    setDirty(false);
    setEditing(false);
    sessionStorage.removeItem(draftKey);
    setError("");
    setNotice("");
  }
  async function showHistory() {
    try {
      const data = await api(`documents/${id}/history`);
      setHistory(data.revisions);
    } catch (e) {
      setError(e.message);
    }
  }
  async function showRevision(r) {
    try {
      const { revision } = await api(`documents/${id}/history/${r.id}`);
      setPreview(revision);
    } catch (e) {
      setError(e.message);
    }
  }
  async function restore() {
    if (
      !window.confirm(
        "Restaurer cette version ? La version actuelle restera dans l’historique.",
      )
    )
      return;
    setBusy(true);
    try {
      const { document: d } = await api(`documents/${id}/restore`, {
        method: "POST",
        body: { revisionId: preview.id, version: doc.version },
      });
      setDoc(d);
      setForm(d);
      setPreview(null);
      setHistory(null);
      setNotice("Version restaurée. L’historique a été conservé.");
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!doc)
    return (
      <div className="loading-inline">{error || "Ouverture du dossier…"}</div>
    );
  const category = categories.find((c) => c.id === doc.category);
  return (
    <div className="document-page">
      <div className="document-topline">
        <button
          className="text-button"
          onClick={() => navigate(`/dossiers?categorie=${doc.category}`)}
        >
          <Icon name="back" size={16} />
          {category?.label}
        </button>
        <div className="document-actions">
          {!editing && (
            <>
              <button className="button" onClick={() => setPublishing(true)}>
                <Icon name="external" size={17} />
                Publication
              </button>
              <button className="button" onClick={showHistory}>
                <Icon name="history" size={17} />
                Historique
              </button>
              <button
                className="button primary"
                onClick={() => setEditing(true)}
              >
                <Icon name="edit" size={17} />
                Modifier
              </button>
            </>
          )}
          {editing && (
            <>
              <button className="button" disabled={busy} onClick={cancel}>
                Annuler
              </button>
              <button
                className="button primary"
                disabled={busy || !dirty}
                onClick={save}
              >
                <Icon name="save" size={17} />
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </>
          )}
        </div>
      </div>
      <header className="document-heading">
        <div className="document-meta">
          <Status value={doc.status} />
          <span>
            Version {doc.version} · {timeLabel(doc.updated_at)}
          </span>
        </div>
        {editing ? (
          <label className="sr-only-label">
            Titre du document
            <input
              className="document-title-input"
              value={form.title}
              maxLength={180}
              onChange={(e) => change({ title: e.target.value })}
            />
          </label>
        ) : (
          <h1>{doc.title}</h1>
        )}
        <p>Dernière mise à jour par {doc.updated_by}</p>
      </header>
      {notice && (
        <div className="notice success" role="status">
          <Icon name="check" size={18} />
          {notice}
        </div>
      )}
      {error && (
        <div className="notice error-message" role="alert">
          <Icon name="alert" size={18} />
          <div>
            {error}
            {error.includes("modifié ailleurs") && (
              <button
                className="text-button"
                onClick={async () => {
                  try {
                    const { document: d } = await api(`documents/${id}`);
                    setPreview({ ...d, current: true });
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                Consulter la version enregistrée
              </button>
            )}
          </div>
        </div>
      )}
      {editing && (
        <div className="editing-details">
          <label>
            Dossier
            <select
              value={form.category}
              onChange={(e) => change({ category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            État du document
            <select
              value={form.status}
              onChange={(e) => change({ status: e.target.value })}
            >
              {Object.entries(documentStatuses).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <span className="save-state">
            <span className={dirty ? "dot amber" : "dot"} />
            {dirty ? "Modifications non enregistrées" : "Prêt à modifier"}
          </span>
        </div>
      )}
      <article className="paper">
        {editing ? (
          <DocumentEditor
            key={`${id}-${doc.version}`}
            html={form.html}
            onChange={(html) => change({ html })}
          />
        ) : (
          <div
            className="document-content"
            onClick={(e) => {
              const link = e.target.closest("a");
              if (link?.getAttribute("href")?.startsWith("/dossiers/")) {
                e.preventDefault();
                navigate(link.getAttribute("href"));
              }
            }}
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />
        )}
      </article>
      {!editing && (
        <p className="quiet-note">
          « Document de référence » décrit l’usage du document, pas une
          validation juridique ou financière.
        </p>
      )}
      {publishing && (
        <Publication doc={doc} onClose={() => setPublishing(false)} />
      )}
      {history && !preview && (
        <Dialog title="Historique du document" onClose={() => setHistory(null)}>
          <div className="dialog-body history-list">
            <p>
              Chaque enregistrement conserve une version. Vous pouvez relire une
              ancienne version avant de la restaurer.
            </p>
            {history.map((r) => (
              <button key={r.id} onClick={() => showRevision(r)}>
                <span>
                  <strong>
                    Version {r.version}
                    {r.version === doc.version ? " · actuelle" : ""}
                  </strong>
                  <small>
                    {r.author} · {timeLabel(r.created_at)}
                  </small>
                </span>
                <Icon name="chevron" />
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {preview && (
        <Dialog
          title={
            preview.current
              ? "Dernière version enregistrée"
              : `Version ${preview.version}`
          }
          onClose={() => setPreview(null)}
          wide
        >
          <div className="dialog-body">
            <h3>{preview.title}</h3>
            <div
              className="document-content revision-preview"
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
            <div className="form-actions">
              <button className="button" onClick={() => setPreview(null)}>
                Fermer
              </button>
              {!preview.current && preview.version !== doc.version && (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={restore}
                >
                  Restaurer cette version
                </button>
              )}
              {preview.current && (
                <button
                  className="button"
                  onClick={() => {
                    const content = JSON.stringify(form, null, 2);
                    const url = URL.createObjectURL(
                      new Blob([content], { type: "application/json" }),
                    );
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = "mon-brouillon.json";
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Télécharger mon brouillon
                </button>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
