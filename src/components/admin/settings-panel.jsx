"use client";
import { useEffect, useState } from "react";
import { settingFields } from "../../data/settings";
import { api } from "../api-client";

const statuses = {
  pending: "En attente",
  sending: "En cours",
  accepted: "Accepté par Meta",
  sent: "Envoyé",
  delivered: "Livré",
  read: "Lu",
  failed: "Échec",
  unknown: "À vérifier",
  cancelled: "Annulé",
};
const date = (value) =>
  value
    ? new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
    : "Pas encore exécutée";
export function SettingsPanel() {
  const [state, setState] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try {
      setState(await api("/api/admin/settings"));
    } catch (e) {
      setMessage(e.message);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function action(data) {
    if (
      data.action === "retry" &&
      !window.confirm(
        "Vérifiez d’abord WhatsApp : une reprise peut doubler un envoi dont le résultat est inconnu. Relancer ?",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      setState(await api("/api/admin/settings", { method: "POST", data }));
      setMessage(
        data.action === "backup"
          ? "Sauvegarde créée et intégrité vérifiée."
          : "Notification remise en attente.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      ...Object.fromEntries(form),
      version: state.settings.version,
      retentionDays: Number(form.get("retentionDays")),
    };
    for (const key of [
      "purgeEnabled",
      "whatsappEnabled",
      "whatsappTeamConsent",
    ])
      data[key] = form.get(key) === "on";
    if (
      data.purgeEnabled &&
      !state.settings.purgeEnabled &&
      !window.confirm(
        "Activer la suppression automatique des demandes clôturées plus anciennes que la durée choisie ? Cette suppression est définitive dans la base active.",
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      setState(await api("/api/admin/settings", { method: "PUT", data }));
      setMessage("Réglages enregistrés. Les pages publiques sont à jour.");
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  const s = state?.settings;
  return (
    <section aria-label="Réglages du site">
      <div className="admin-toolbar">
        <h2>Association et services</h2>
        <button className="text-link" disabled={busy} onClick={refresh}>
          Actualiser les services
        </button>
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {!s ? (
        <p>Chargement des réglages…</p>
      ) : (
        <>
          <form className="admin-card" onSubmit={save} key={s.version}>
            <fieldset className="plain-fieldset" disabled={busy}>
              <h3>Les informations à publier</h3>
              <p>
                Renseignez uniquement les informations réelles. Les champs vides
                restent indiqués comme non renseignés sur les pages concernées.
              </p>
              <div className="admin-form-grid">
                {settingFields.map(([key, label, max]) => (
                  <label key={key}>
                    {label}
                    {max > 500 ? (
                      <textarea
                        name={key}
                        maxLength={max}
                        rows={3}
                        defaultValue={s[key]}
                      />
                    ) : (
                      <input
                        name={key}
                        maxLength={max}
                        defaultValue={s[key]}
                        type={
                          key === "email"
                            ? "email"
                            : key === "donationUrl"
                              ? "url"
                              : "text"
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
              <h3>Conservation des demandes</h3>
              <label>
                Durée après clôture, en jours
                <input
                  type="number"
                  min="30"
                  max="1095"
                  name="retentionDays"
                  defaultValue={s.retentionDays}
                  required
                />
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  name="purgeEnabled"
                  defaultChecked={s.purgeEnabled}
                />
                Activer la suppression automatique des dossiers clôturés à
                l’expiration de cette durée.
              </label>
              <p className="form-note">
                Les dossiers ouverts ne sont pas supprimés. Choisissez une durée
                adaptée à vos besoins avant d’activer cette règle. Les anciennes
                sauvegardes peuvent encore contenir les données jusqu’à leur
                rotation.
              </p>
              <h3>WhatsApp</h3>
              <p className="notice">
                {state.notifications.ready
                  ? "Connexion serveur configurée."
                  : "WhatsApp attend la configuration du compte Meta."}{" "}
                {state.notifications.webhookReady
                  ? "Le suivi de livraison est configuré."
                  : "Le suivi de livraison et les réponses STOP nécessitent la configuration du webhook."}
              </p>
              <label>
                Numéro WhatsApp de l’équipe
                <input
                  name="whatsappTeam"
                  type="tel"
                  placeholder="+33612345678"
                  defaultValue={s.whatsappTeam}
                  maxLength={20}
                />
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  name="whatsappTeamConsent"
                  defaultChecked={s.whatsappTeamConsent}
                />
                Le destinataire accepte de recevoir les alertes de nouvelles
                demandes.
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  name="whatsappEnabled"
                  defaultChecked={s.whatsappEnabled}
                />
                Activer les notifications après configuration.
              </label>
              <details className="setup-guide">
                <summary>Configurer WhatsApp Business, étape par étape</summary>
                <ol>
                  <li>
                    Créer le compte WhatsApp Business Platform dans Meta et
                    connecter le numéro de l’association.
                  </li>
                  <li>
                    Faire approuver les deux modèles ci-dessous, chacun avec une
                    seule variable de texte : la référence du dossier.
                  </li>
                  <li>
                    Renseigner les accès dans le fichier privé .env.local du
                    serveur, puis redémarrer le site. Aucun secret ne doit être
                    collé dans les champs publics.
                  </li>
                  <li>
                    Sur le site déployé en HTTPS, connecter l’adresse
                    /api/whatsapp/webhook aux événements « messages » de Meta
                    pour connaître les livraisons et traiter STOP.
                  </li>
                  <li>
                    Ajouter le numéro destinataire autorisé dans l’environnement
                    de test Meta, puis vérifier un vrai envoi avant l’ouverture
                    au public.
                  </li>
                </ol>
                <p>
                  <strong>Équipe :</strong> Nouvelle demande reçue. Référence :{" "}
                  {"{{1}}"}. Consultez l’administration.
                </p>
                <p>
                  <strong>Visiteur :</strong> Votre demande a bien été
                  enregistrée. Référence : {"{{1}}"}. L’équipe reviendra vers
                  vous.
                </p>
                <p>
                  Variables encore manquantes :{" "}
                  {state.notifications.missing.join(", ") ||
                    "aucune pour l’envoi"}
                  .
                </p>
                <p>
                  Les noms, e-mails et messages des dossiers ne sont pas envoyés
                  à Meta. Les essais concernant les animaux fictifs ne
                  déclenchent aucun envoi.
                </p>
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Guide officiel Meta ↗
                </a>
              </details>
              <button className="button">Enregistrer les réglages</button>
            </fieldset>
          </form>
          <section className="admin-card service-card">
            <h3>Sauvegardes</h3>
            <p>
              Une sauvegarde quotidienne inclut les dossiers, les réglages et
              les photos importées. Les 14 dernières sauvegardes automatiques
              sont conservées.
            </p>
            <p>Dernière sauvegarde : {date(state.maintenance.lastBackup)}.</p>
            <p>
              Dernier passage du service : {date(state.maintenance.lastRun)}.
            </p>
            <p>
              {state.maintenance.externalBackupConfigured
                ? "Dossier de sauvegarde personnalisé configuré. Vérifiez qu’il se trouve sur un autre support."
                : "Sauvegarde locale uniquement : configurez BACKUP_DIRECTORY vers un disque externe ou un dossier réseau protégé."}
            </p>
            {state.maintenance.backupError && (
              <p role="alert">{state.maintenance.backupError}</p>
            )}
            <button
              className="button button-light"
              disabled={busy}
              onClick={() => action({ action: "backup" })}
            >
              Sauvegarder maintenant
            </button>
          </section>
          <section className="admin-card service-card">
            <h3>Historique WhatsApp</h3>
            <p>
              Les 100 derniers envois. « Accepté par Meta » ne confirme pas la
              livraison. Les nouvelles demandes sont traitées environ chaque
              minute tant que le serveur fonctionne.
            </p>
            {!state.notifications.items.length && (
              <p>Aucun envoi pour le moment.</p>
            )}
            {state.notifications.items.map((n) => (
              <div key={n.id} className="notification-item">
                <p>
                  <strong>{statuses[n.status] || n.status}</strong> ·{" "}
                  {n.audience === "team" ? "Équipe" : "Visiteur"} ·{" "}
                  {date(n.created_at)}
                </p>
                <p>Référence : {n.request_id}</p>
                {n.error && <p>{n.error}</p>}
                {["failed", "unknown"].includes(n.status) && (
                  <button
                    disabled={busy}
                    className="text-link"
                    onClick={() => action({ action: "retry", id: n.id })}
                  >
                    Relancer après vérification
                  </button>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
