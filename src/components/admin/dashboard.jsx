"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { animalStatuses } from "../../data/form-options";
import { api } from "../api-client";
import { AnimalEditor } from "./animal-editor";
import { RequestList } from "./request-list";
import { SettingsPanel } from "./settings-panel";

export function Dashboard({ username, initialAnimals, initialRequests }) {
  const router = useRouter();
  const [animals, setAnimals] = useState(initialAnimals);
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState("requests");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  async function refreshRequests() {
    setRequests((await api("/api/admin/requests")).requests);
  }
  async function refreshAnimals() {
    setAnimals((await api("/api/admin/animals")).animals);
    setEditing(null);
    setNotice("Fiche enregistrée. Le catalogue est à jour.");
    router.refresh();
  }
  async function logout() {
    setPending(true);
    try {
      await api("/api/admin/logout", { method: "POST" });
      router.refresh();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setPending(false);
    }
  }
  async function password(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (data.password !== data.confirm) {
      setNotice("Les deux nouveaux mots de passe doivent être identiques.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      await api("/api/admin/password", { method: "POST", data });
      router.refresh();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <div className="admin-toolbar">
        <p>
          Connecté : <strong>{username}</strong>
        </p>
        <button
          type="button"
          className="text-link"
          disabled={pending}
          onClick={logout}
        >
          Se déconnecter
        </button>
      </div>
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
          ["account", "Mon compte"],
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
                      <Link className="text-link" href={`/${animal.slug}`}>
                        Voir la fiche
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      {tab === "account" && (
        <form className="admin-card admin-login" onSubmit={password}>
          <h2>Changer le mot de passe</h2>
          <p>
            Après modification, toutes les sessions seront fermées.
            Reconnectez-vous avec votre nouveau mot de passe.
          </p>
          <label htmlFor="current-password">
            Mot de passe actuel
            <input
              id="current-password"
              name="current"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label htmlFor="new-password">
            Nouveau mot de passe
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <label htmlFor="confirm-password">
            Confirmer le nouveau mot de passe
            <input
              id="confirm-password"
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <button className="button" disabled={pending}>
            Enregistrer le mot de passe
          </button>
        </form>
      )}
    </>
  );
}
