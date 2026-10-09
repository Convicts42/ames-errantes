"use client";
import { useEffect, useState } from "react";
import { Dashboard } from "./site-admin/dashboard";
import "../styles/admin.css";
import { api, timeLabel } from "./api";
export function Management({ siteUrl }) {
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    api("management")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">LE SITE ET LE REFUGE, ENSEMBLE</span>
          <h1>Animaux & demandes</h1>
          <p>
            Les fiches et les réglages enregistrés ici alimentent directement le
            site.
          </p>
        </div>
        <a className="button" href={siteUrl} target="_blank" rel="noreferrer">
          Voir le site
        </a>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {data ? (
        <div className="admin-shell site-management">
          <Dashboard
            initialAnimals={data.animals}
            initialRequests={data.requests}
            siteUrl={siteUrl}
          />
        </div>
      ) : (
        <p>Chargement…</p>
      )}
    </>
  );
}
const entities = {
  documents: "Document",
  tasks: "Point à suivre",
  animals: "Animal",
  settings: "Réglages",
  requests: "Demande",
  request_followup: "Suivi",
  document_publications: "Publication",
};
export function Activity() {
  const [items, setItems] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    const refresh = () =>
      api("activity")
        .then((d) => setItems(d.events))
        .catch((e) => setError(e.message));
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TRAVAILLER AVEC L’IA</span>
          <h1>Activité & Claude</h1>
          <p>
            Chaque modification est attribuée à son auteur, dans une base
            commune.
          </p>
        </div>
      </div>
      <section className="panel">
        <h2>Une conversation, des changements dans le projet</h2>
        <p className="connection-help">
          Dans Claude, demande par exemple : « Relis notre dossier d’accueil,
          puis ajoute les questions manquantes aux points à suivre. » L’IA lit
          les données à jour et conserve les anciennes versions. Les documents
          restent privés tant que leur publication n’est pas demandée.
        </p>
        <p className="quiet-note">
          Connexion MCP « ames-errantes » · Vos dossiers et leur historique sont
          conservés dans la base commune.
        </p>
      </section>
      <h2 className="activity-heading">Derniers changements</h2>
      {error && <p role="alert">{error}</p>}
      <div className="document-list">
        {items.map((item) => (
          <div className="activity-row" key={item.id}>
            <span className="avatar">
              {item.actor.startsWith("IA") ? "IA" : "É"}
            </span>
            <span>
              <strong>
                {entities[item.entity] || item.entity} ·{" "}
                {item.action === "INSERT"
                  ? "Création"
                  : item.action === "DELETE"
                    ? "Retrait"
                    : "Modification"}
              </strong>
              <small>
                {item.actor} · {timeLabel(item.created_at)}
              </small>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
