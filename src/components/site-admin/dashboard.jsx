"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { animalStatuses } from "@ames/core/data/form-options.js";
import { api } from "./api";
import { AnimalEditor } from "./animal-editor";
import { RequestList } from "./request-list";
import { SettingsPanel } from "./settings-panel";

export function Dashboard({ initialAnimals, initialRequests, siteUrl = "" }) {
  const router = useRouter();
  const [animals, setAnimals] = useState(initialAnimals);
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState("requests");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  async function refreshRequests() {
    setRequests((await api("/api/admin/requests")).requests);
  }
  async function refreshAnimals() {
    setAnimals((await api("/api/admin/animals")).animals);
    setEditing(null);
    setNotice("Fiche enregistrée. Le catalogue est à jour.");
    router.refresh();
  }
  return (
    <>
      <div className="admin-stats">
        <div>
          <strong>
            {requests.filter((item) => item.status === "new").length}
          </strong>
          <span>Demandes à lire</span>
        </div>
        <div>
          <strong>{animals.filter((item) => item.published).length}</strong>
          <span>Fiches publiées</span>
        </div>
        <div>
          <strong>{animals.filter((item) => !item.published).length}</strong>
          <span>Brouillons</span>
        </div>
      </div>
      <nav className="filter-tabs admin-tabs" aria-label="Gestion">
        {[
          ["requests", "Demandes"],
          ["animals", "Animaux"],
          ["settings", "Réglages et WhatsApp"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? "selected" : ""}
            aria-pressed={tab === key}
            onClick={() => {
              setTab(key);
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {tab === "requests" && (
        <RequestList requests={requests} onChanged={refreshRequests} />
      )}
      {tab === "settings" && <SettingsPanel />}
      {tab === "animals" &&
        (editing ? (
          <AnimalEditor
            key={editing.slug || "new"}
            animal={editing}
            onSaved={refreshAnimals}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <section aria-label="Gestion des animaux">
            <div className="admin-toolbar">
              <h2>Les compagnons</h2>
              <button className="button" onClick={() => setEditing({})}>
                Ajouter un compagnon
              </button>
            </div>
            <div className="admin-animal-grid">
              {animals.map((animal) => (
                <article className="admin-card" key={animal.slug}>
                  <img
                    src={animal.image}
                    alt={animal.alt}
                    width={400}
                    height={267}
                  />
                  <h3>{animal.name}</h3>
                  <p>
                    {animal.type} · {animal.published ? "Publié" : "Brouillon"}{" "}
                    · {animalStatuses[animal.status]}
                    {animal.demo ? " · Exemple" : ""}
                  </p>
                  <div className="admin-actions">
                    <button
                      className="button button-light"
                      onClick={() => setEditing(animal)}
                    >
                      Modifier {animal.name}
                    </button>
                    {animal.published && (
                      <Link
                        className="text-link"
                        href={`${siteUrl}/${animal.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Voir la fiche
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
