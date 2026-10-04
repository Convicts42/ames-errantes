"use client";
import { workflowStages } from "@ames/core/data/settings.js";
function localDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export function FollowupEditor({ request, pending, onSave }) {
  const f = request.followup;
  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ["appointment", "followupDate"])
      data[key] = data[key] ? new Date(data[key]).toISOString() : "";
    onSave({
      status: request.status,
      followup: { ...data, version: f.version },
    });
  }
  return (
    <details className="followup-details">
      <summary>Suivi du dossier · {workflowStages[f.stage]}</summary>
      <form onSubmit={submit} key={f.version}>
        <fieldset className="plain-fieldset" disabled={pending}>
          <div className="admin-form-grid">
            <label>
              Étape
              <select name="stage" defaultValue={f.stage}>
                {Object.entries(workflowStages).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Responsable
              <input
                name="assignee"
                maxLength={100}
                defaultValue={f.assignee}
              />
            </label>
            <label>
              Rendez-vous (heure de cet appareil)
              <input
                type="datetime-local"
                name="appointment"
                defaultValue={localDate(f.appointment)}
              />
            </label>
            <label>
              Prochain suivi (heure de cet appareil)
              <input
                type="datetime-local"
                name="followupDate"
                defaultValue={localDate(f.followupDate)}
              />
            </label>
          </div>
          <label>
            Prochaine action
            <input
              name="nextAction"
              maxLength={500}
              defaultValue={f.nextAction}
            />
          </label>
          <label>
            Notes privées
            <textarea
              name="notes"
              rows={4}
              maxLength={5000}
              defaultValue={f.notes}
            />
          </label>
          <p className="form-note">
            Notes réservées à l’équipe. Ne consignez que les informations utiles
            au traitement du dossier.
          </p>
          <button className="button button-light">Enregistrer le suivi</button>
        </fieldset>
      </form>
      {request.events.length > 0 && (
        <>
          <h4>Dernières modifications</h4>
          <ul>
            {request.events.map((event, index) => (
              <li key={index}>
                {new Date(event.created_at).toLocaleString("fr-FR", {
                  timeZone: "Europe/Paris",
                })}{" "}
                · {event.actor} · {event.description}
              </li>
            ))}
          </ul>
        </>
      )}
    </details>
  );
}
