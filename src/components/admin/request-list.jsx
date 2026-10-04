"use client";

import { useState } from "react";
import { requestStatuses } from "../../data/form-options";
import { api } from "../api-client";
import { FollowupEditor } from "./followup-editor";

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
  const [search, setSearch] = useState("");
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
    (request) =>
      (filter === "all" || request.status === filter) &&
      `${request.id} ${request.payload.name} ${request.payload.email} ${request.followup.assignee} ${request.payload.subject || request.payload.animalName || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <section aria-label="Demandes reçues">
      <div className="admin-toolbar">
        <h2>Les demandes</h2>
        <button
          className="text-link"
          disabled={!!pending}
          onClick={async () => {
            try {
              await onChanged();
              setError("");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Actualiser les demandes
        </button>
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
      <label>
        Rechercher un dossier
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom, référence, e-mail ou responsable"
        />
      </label>
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
                {request.payload.phone && (
                  <p>WhatsApp : {request.payload.phone}</p>
                )}
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
              {["location", "availability", "experience", "housing"].map(
                (key) =>
                  request.payload[key] && (
                    <p key={key}>
                      <strong>
                        {
                          {
                            location: "Localisation",
                            availability: "Disponibilités",
                            experience: "Expérience",
                            housing: "Accueil proposé",
                          }[key]
                        }{" "}
                        :
                      </strong>{" "}
                      {request.payload[key]}
                    </p>
                  ),
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
            {request.followup.nextAction && (
              <p>
                <strong>Prochaine action :</strong>{" "}
                {request.followup.nextAction}
              </p>
            )}
            <FollowupEditor
              request={request}
              pending={pending === request.id}
              onSave={(data) => change(request.id, "PATCH", data)}
            />
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
