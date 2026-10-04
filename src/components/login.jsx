"use client";
import { useState } from "react";
import { api } from "./api";
import { Icon } from "./icons";

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Icon name="paw" size={25} />
      </span>
      <span>
        <strong>Âmes errantes</strong>
        <small>NOTRE ESPACE DE TRAVAIL</small>
      </span>
    </span>
  );
}
export function Login({ setupRequired, onLogin }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const input = Object.fromEntries(new FormData(event.currentTarget));
      const result = await api(setupRequired ? "setup" : "login", {
        method: "POST",
        body: input,
      });
      onLogin(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-story">
        <Brand />
        <div>
          <span className="eyebrow light">
            UN PROJET À CONSTRUIRE, ENSEMBLE
          </span>
          <h1>
            Un lieu pour eux.
            <br />
            <em>Un cap pour nous.</em>
          </h1>
          <p>
            Les idées, les décisions et les prochaines étapes d’Âmes errantes,
            réunies au même endroit.
          </p>
          <div className="story-line">
            <Icon name="paw" />
            <span>Chiens & chats · Adoption & accueil durable</span>
          </div>
        </div>
        <small>
          <Icon name="lock" size={14} /> Un espace réservé à votre équipe
        </small>
      </div>
      <main className="login-main">
        <div className="login-card">
          <span className="eyebrow">BIENVENUE CHEZ ÂMES ERRANTES</span>
          <h2>
            {setupRequired ? "Faisons connaissance." : "On reprend le fil ?"}
          </h2>
          <p>
            {setupRequired
              ? "Créez votre compte pour retrouver le dossier et inviter votre mère."
              : "Connectez-vous pour retrouver le projet et travailler ensemble."}
          </p>
          <form onSubmit={submit}>
            {setupRequired && (
              <>
                <label>
                  Code d’installation
                  <input
                    name="token"
                    autoComplete="off"
                    required
                    placeholder="Le code dans votre fichier d’accès"
                  />
                </label>
                <label>
                  Votre prénom
                  <input
                    name="name"
                    autoComplete="given-name"
                    required
                    maxLength={80}
                  />
                </label>
              </>
            )}
            <label>
              Identifiant
              <input
                name="username"
                autoComplete="username"
                required
                minLength={setupRequired ? 3 : 1}
                maxLength={60}
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <label>
              Mot de passe
              <input
                name="password"
                type="password"
                autoComplete={
                  setupRequired ? "new-password" : "current-password"
                }
                required
                minLength={setupRequired ? 12 : 1}
                maxLength={128}
              />
            </label>
            {setupRequired && (
              <small>
                Au moins 12 caractères. Vous pourrez créer un second compte dans
                « Mon compte ».
              </small>
            )}
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy}>
              {busy
                ? "Un instant…"
                : setupRequired
                  ? "Créer mon espace"
                  : "Entrer dans notre espace"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
          <p className="login-foot">
            <Icon name="shield" size={16} /> Vos dossiers sont accessibles après
            connexion.
          </p>
        </div>
      </main>
    </div>
  );
}
