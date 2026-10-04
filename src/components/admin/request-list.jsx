"use client";

import { useState } from "react";
import { requestStatuses } from "../../data/form-options";
import { api } from "../api-client";

const labels = {
  home: "Logement",
  household: "Foyer",
  presence: "Présence",
  pets: "Animaux",
  time: "Période",
};

export function RequestList({ requests, onChanged }) {
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState(null);
  const [error, setError] = useState("");
  async function change(id, method, data) {
    if (
      method === "DELETE" &&
      !window.confirm(
        "Supprimer définitivement cette demande et ses coordonnées ?",
      )
    )
      return;
    setPending(id);
    setError("");
    try {
      await api(`/api/admin/requests/${id}`, { method, data });
      await onChanged();
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(null);
    }
  }
  const visible = requests.filter(
    (request) => filter === "all" || request.status === filter,
  );
  return (
    <section aria-label="Demandes reçues">
      <div className="admin-toolbar">
        <h2>Les demandes</h2>
        <label htmlFor="request-filter">
          Afficher
          <select
            id="request-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Tous les états</option>
            {Object.entries(requestStatuses).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="form-note">
        Les 500 dernières demandes. Les coordonnées restent dans cet espace
        protégé.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!visible.length && (
        <div className="admin-card">
          <p>Aucune demande dans cette vue pour le moment.</p>
        </div>
      )}
      <div className="request-list">
        {visible.map((request) => (
          <article className="admin-card request-card" key={request.id}>
            <div className="admin-toolbar">
              <div>
                <span className="eyebrow">
                  {request.kind === "meeting" ? "RENCONTRE" : "CONTACT"}
                  {request.payload.demo ? " · ESSAI" : ""}
                </span>
                <h3>{request.payload.name}</h3>
                <p>{request.payload.email}</p>
              </div>
              <time dateTime={request.created_at}>
                {new Date(request.created_at).toLocaleString("fr-FR", {
                  timeZone: "Europe/Paris",
                })}
              </time>
            </div>
            <p>
              <strong>
                {request.payload.animalName || request.payload.subject}
              </strong>
            </p>
            <details>
              <summary>Lire la demande</summary>
              {request.payload.message && (
                <p className="preserve-lines">{request.payload.message}</p>
              )}
              {request.kind === "meeting" && (
                <>
                  <dl className="request-facts">
                    {Object.entries(labels).map(([key, label]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>{request.payload[key]}</dd>
                      </div>
                    ))}
                  </dl>
                  {request.payload.summary && (
                    <p className="preserve-lines">{request.payload.summary}</p>
                  )}
                </>
              )}
              <p className="form-note">Référence : {request.id}</p>
            </details>
            <div className="admin-actions">
              <label htmlFor={`status-${request.id}`}>
                État
                <select
                  id={`status-${request.id}`}
                  value={request.status}
                  disabled={pending === request.id}
                  onChange={(event) =>
                    change(request.id, "PATCH", { status: event.target.value })
                  }
                >
                  {Object.entries(requestStatuses).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="text-link danger"
                disabled={pending === request.id}
                onClick={() => change(request.id, "DELETE")}
              >
                Supprimer la demande
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
