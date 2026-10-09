"use client";
import { useState } from "react";
import { taskStatuses } from "@ames/core/shared/project.js";
import { api } from "./api";
import { Icon } from "./icons";
import { Dialog } from "./dialog";

export function Tasks({ tasks, documents, users, onChanged, navigate }) {
  const [filter, setFilter] = useState("open"),
    [edit, setEdit] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const visible = tasks.filter(
    (t) =>
      filter === "all" ||
      (filter === "open" && !["done", "parked"].includes(t.status)) ||
      t.status === filter,
  );
  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const input = {
        ...edit,
        ...Object.fromEntries(new FormData(e.currentTarget)),
      };
      await api(edit.id ? `tasks/${edit.id}` : "tasks", {
        method: edit.id ? "PUT" : "POST",
        body: input,
      });
      setEdit(null);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">AVANCER À NOTRE RYTHME</span>
          <h1>Les points à suivre</h1>
          <p>Une question à la fois. Les décisions restent entre vos mains.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setError("");
            setEdit({ status: "pending" });
          }}
        >
          <Icon name="plus" size={18} />
          Ajouter un point
        </button>
      </div>
      <div className="filter-tabs" aria-label="Filtrer les points">
        {[
          ["open", "À traiter"],
          ["parked", "En suspens"],
          ["done", "Terminés"],
          ["all", "Tous"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            className={filter === key ? "selected" : ""}
            onClick={() => setFilter(key)}
          >
            {label}
            <span>
              {
                tasks.filter(
                  (t) =>
                    key === "all" ||
                    (key === "open" &&
                      !["done", "parked"].includes(t.status)) ||
                    t.status === key,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <div className="tasks-list">
        {visible.map((t) => (
          <article className="task-card" key={t.id}>
            <span className={`task-symbol ${t.status}`}>
              <Icon
                name={
                  t.status === "done"
                    ? "check"
                    : t.status === "parked"
                      ? "clock"
                      : "tasks"
                }
              />
            </span>
            <div className="task-info">
              <div className="task-line">
                <h2>{t.title}</h2>
                <span className={`task-status ${t.status}`}>
                  {taskStatuses[t.status]}
                </span>
              </div>
              <p>{t.note}</p>
              <div className="task-footer">
                <span>
                  <Icon name="users" size={14} />
                  {t.assignee_name || "À répartir ensemble"}
                </span>
                {t.document_id && (
                  <button
                    className="text-button"
                    onClick={() => navigate(`/dossiers/${t.document_id}`)}
                  >
                    Ouvrir le dossier
                    <Icon name="external" size={14} />
                  </button>
                )}
              </div>
            </div>
            <button
              className="icon-button"
              aria-label={`Modifier : ${t.title}`}
              onClick={() => {
                setError("");
                setEdit(t);
              }}
            >
              <Icon name="edit" />
            </button>
          </article>
        ))}
        {!visible.length && (
          <div className="empty-state">
            <Icon name="leaf" size={32} />
            <h2>Rien dans cette liste.</h2>
            <p>Vous pouvez ajouter un point ou changer de filtre.</p>
          </div>
        )}
      </div>
      {edit && (
        <Dialog
          title={edit.id ? "Modifier ce point" : "Un nouveau point à suivre"}
          onClose={() => setEdit(null)}
        >
          <form className="dialog-body" onSubmit={save}>
            <label>
              À faire ou à décider
              <input
                name="title"
                defaultValue={edit.title || ""}
                required
                maxLength={200}
                autoFocus
              />
            </label>
            <label>
              Quelques précisions
              <textarea
                name="note"
                defaultValue={edit.note || ""}
                maxLength={4000}
                rows={4}
              />
            </label>
            <div className="form-grid">
              <label>
                État
                <select name="status" defaultValue={edit.status}>
                  {Object.entries(taskStatuses).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Qui s’en occupe ?
                <select name="assignee" defaultValue={edit.assignee || ""}>
                  <option value="">À répartir ensemble</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Dossier associé
              <select name="document_id" defaultValue={edit.document_id || ""}>
                <option value="">Aucun</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button"
                onClick={() => setEdit(null)}
              >
                Annuler
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
