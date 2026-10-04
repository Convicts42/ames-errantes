"use client";
import { useState } from "react";
export function WhatsappOptin({ enabled, id = "whatsapp", disabled = false }) {
  const [checked, setChecked] = useState(false);
  if (!enabled) return null;
  return (
    <div className="whatsapp-optin">
      <label className="consent">
        <input
          type="checkbox"
          name="whatsappConsent"
          disabled={disabled}
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        Je souhaite recevoir un accusé de réception de cette demande sur
        WhatsApp (facultatif).
      </label>
      {checked && (
        <label htmlFor={`${id}-phone`}>
          Mon numéro WhatsApp, avec l’indicatif du pays
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+33612345678"
            pattern="\+[1-9][0-9]{7,14}"
            maxLength={20}
            required
            disabled={disabled}
          />
        </label>
      )}
      <p className="form-note">
        Seuls votre numéro et la référence de votre demande sont transmis à
        Meta. Aucun message publicitaire. Vous pouvez retirer cet accord auprès
        de l’équipe ou répondre STOP.
      </p>
    </div>
  );
}
