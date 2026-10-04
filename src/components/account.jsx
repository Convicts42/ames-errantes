"use client";
import { useState } from "react";
import { api, dateLabel } from "./api";
import { Icon } from "./icons";
import { Dialog } from "./dialog";

export function Account({ user, users, backupDay, onChanged, onLogout }) {
  const [adding, setAdding] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function add(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("users", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      setAdding(false);
      setNotice(
        "Compte créé. Transmettez les accès directement à cette personne.",
      );
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function change(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const input = Object.fromEntries(new FormData(e.currentTarget));
    if (input.password !== input.confirm) {
      setError("Les deux nouveaux mots de passe doivent être identiques.");
      setBusy(false);
      return;
    }
    try {
      await api("password", { method: "POST", body: input });
      onLogout(
        "Mot de passe modifié. Reconnectez-vous avec votre nouveau mot de passe.",
      );
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
          <span className="eyebrow">VOTRE ESPACE PRIVÉ</span>
          <h1>Mon compte & l’équipe</h1>
          <p>Chacun ses accès, un projet commun.</p>
        </div>
      </div>
      {notice && (
        <p role="status" className="notice success">
          {notice}
        </p>
      )}
      {error && !adding && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="account-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Les membres</h2>
            <Icon name="users" />
          </div>
          {users.map((u) => (
            <div className="member-row" key={u.id}>
              <span className="avatar">{u.name.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>
                  {u.name}
                  {u.id === user.id ? " · vous" : ""}
                </strong>
                <small>
                  {u.role === "owner"
                    ? "Responsable de l’espace"
                    : "Consultation et modification"}
                </small>
              </span>
            </div>
          ))}
          {user.role === "owner" && (
            <button
              className="button full"
              onClick={() => {
                setError("");
                setAdding(true);
              }}
            >
              <Icon name="plus" size={17} />
              Créer le compte d’un proche
            </button>
          )}
          <p className="help-text">
            Chaque membre peut consulter, modifier et créer des dossiers. Seul
            le responsable peut ajouter des comptes.
          </p>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Garder une copie</h2>
            <Icon name="download" />
          </div>
          <p>
            Téléchargez tous les documents, leurs versions et les points à
            suivre dans un fichier que vous conservez.
          </p>
          <a className="button" href="/api/workspace/export" download>
            <Icon name="download" size={17} />
            Exporter le projet
          </a>
          <div className="backup-note">
            <Icon name="shield" size={18} />
            <span>
              Dernière copie automatique :
              <strong>
                {backupDay
                  ? dateLabel(backupDay)
                  : "Elle sera créée lors de l’utilisation de l’espace."}
              </strong>
            </span>
          </div>
          <p className="help-text">
            Les copies automatiques restent sur le serveur. Conservez aussi une
            copie sur un autre appareil. L’export ne contient pas les mots de
            passe.
          </p>
        </section>
        <section className="panel password-panel">
          <div className="panel-heading">
            <h2>Changer mon mot de passe</h2>
            <Icon name="lock" />
          </div>
          <form onSubmit={change}>
            <label>
              Mot de passe actuel
              <input
                name="current"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
            <div className="form-grid">
              <label>
                Nouveau mot de passe
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                />
              </label>
              <label>
                Confirmer le nouveau mot de passe
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={128}
                />
              </label>
            </div>
            <small>
              Au moins 12 caractères. Ce changement vous déconnectera de tous
              les appareils.
            </small>
            <button className="button primary" disabled={busy}>
              Mettre à jour mon mot de passe
            </button>
          </form>
        </section>
      </div>
      {adding && (
        <Dialog title="Créer un compte privé" onClose={() => setAdding(false)}>
          <form className="dialog-body" onSubmit={add}>
            <p>
              Le nouveau membre pourra lire et modifier tous les dossiers.
              Aucune invitation n’est envoyée automatiquement.
            </p>
            <label>
              Prénom
              <input
                name="name"
                autoComplete="off"
                required
                maxLength={80}
                autoFocus
              />
            </label>
            <label>
              Identifiant
              <input
                name="username"
                autoComplete="off"
                required
                minLength={3}
                maxLength={60}
                pattern="[a-z0-9._-]+"
                placeholder="Par exemple : maman"
              />
            </label>
            <label>
              Mot de passe initial
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </label>
            <small>
              Au moins 12 caractères. Le membre pourra le changer après
              connexion.
            </small>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button"
                onClick={() => setAdding(false)}
              >
                Annuler
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? "Création…" : "Créer le compte"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
