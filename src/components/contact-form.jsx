"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { subjects } from "../data/form-options";
import { QueryPreset } from "./query-preset";
import { copyMessage } from "./copy-message";
import { api, submissionKey } from "./api-client";

export function ContactForm() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(null);
  const prepared = useRef(null);
  const attempt = useRef(null);
  const preset = useCallback(
    (value) => setSubject(subjects.includes(value) ? value : subjects[0]),
    [],
  );

  async function submit(event) {
    event.preventDefault();
    if (pending || sent) return;
    const form = event.currentTarget;
    for (const name of ["name", "message"]) {
      const field = form.elements[name];
      if (!field.value.trim()) {
        field.setCustomValidity("Veuillez renseigner ce champ.");
        field.reportValidity();
        return;
      }
    }
    const data = new FormData(form);
    const payload = {
      kind: "contact",
      name: data.get("name"),
      email: data.get("email"),
      subject,
      message: data.get("message"),
      consent: data.get("consent") === "on",
    };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.serialized !== serialized)
      attempt.current = { serialized, key: submissionKey() };
    setPending(true);
    setError("");
    try {
      const result = await api("/api/requests", {
        method: "POST",
        data: payload,
        key: attempt.current.key,
      });
      setMessage(
        `Objet : ${subject}\n\nBonjour,\n\n${payload.message.trim()}\n\n${payload.name.trim()}`,
      );
      setSent(result.id);
      setStatus("");
    } catch (error) {
      setError(
        error.message ||
          "Connexion impossible. Votre message est conservé dans le formulaire.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="contact-form" className="contact-form" onSubmit={submit}>
      <Suspense>
        <QueryPreset name="subject" onValue={preset} />
      </Suspense>
      <h2>Parlons de votre projet.</h2>
      <fieldset className="plain-fieldset" disabled={pending || !!sent}>
        <div className="form-row">
          <label htmlFor="name">
            Votre prénom
            <input
              id="name"
              name="name"
              autoComplete="given-name"
              required
              maxLength={100}
              placeholder="Votre prénom"
              onInput={(event) => event.currentTarget.setCustomValidity("")}
            />
          </label>
          <label htmlFor="subject">
            Votre sujet
            <select
              id="subject"
              name="subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {subjects.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <label htmlFor="email">
          Votre adresse e-mail
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="Pour vous répondre"
          />
        </label>
        <label htmlFor="message">
          Quelques mots sur votre projet
          <textarea
            id="message"
            name="message"
            required
            maxLength={5000}
            rows={5}
            placeholder="Votre quotidien, vos envies, vos questions…"
            onInput={(event) => event.currentTarget.setCustomValidity("")}
          />
        </label>
        <label className="consent">
          <input name="consent" type="checkbox" required />
          J’accepte l’enregistrement de mes coordonnées et de mon message pour
          le traitement de cette demande par l’équipe.
        </label>
        <button className="button" type="submit" disabled={!ready}>
          {pending ? "Enregistrement…" : "Envoyer mon message"}
        </button>
      </fieldset>
      <noscript>
        <p className="notice">Activez JavaScript pour envoyer votre message.</p>
      </noscript>
      <p className="form-note">
        Votre demande sera enregistrée et consultable uniquement par l’équipe
        dans son espace protégé. Aucun e-mail automatique n’est envoyé.
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div id="message-result" hidden={!sent}>
        <p role="status">
          Votre message a bien été enregistré. Référence : {sent}
        </p>
        <label htmlFor="prepared-message">
          Copie de votre message
          <textarea
            ref={prepared}
            id="prepared-message"
            readOnly
            rows={6}
            value={message}
          />
        </label>
        <button
          type="button"
          className="button button-light"
          id="copy-message"
          onClick={() => copyMessage(prepared.current, setStatus)}
        >
          Copier le message
        </button>
        <p id="copy-status" role="status">
          {status}
        </p>
      </div>
    </form>
  );
}
