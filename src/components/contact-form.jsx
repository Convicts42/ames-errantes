"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { QueryPreset } from "./query-preset";
import { copyMessage } from "./copy-message";

const subjects = [
  "Un projet d’adoption",
  "Devenir famille d’accueil",
  "Devenir bénévole",
  "Une autre question",
];

export function ContactForm() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [subject, setSubject] = useState(subjects[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const prepared = useRef(null);
  const preset = useCallback(
    (value) => setSubject(subjects.includes(value) ? value : subjects[0]),
    [],
  );

  function submit(event) {
    event.preventDefault();
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
    setMessage(
      `Objet : ${subject}\n\nBonjour,\n\n${data.get("message").trim()}\n\n${data.get("name").trim()}`,
    );
    setStatus("");
  }

  return (
    <form id="contact-form" className="contact-form" onSubmit={submit}>
      <Suspense>
        <QueryPreset name="subject" onValue={preset} />
      </Suspense>
      <h2>Préparons votre message.</h2>
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
      <button className="button" type="submit" disabled={!ready}>
        Préparer mon message
      </button>
      <noscript>
        <p className="notice">
          Activez JavaScript pour préparer votre message à copier.
        </p>
      </noscript>
      <p className="form-note">
        Ce site prépare un message à copier. Aucun envoi ni stockage n’est
        effectué ; l’adresse de l’association reste à renseigner.
      </p>
      <div id="message-result" hidden={!message}>
        <p role="status">Votre message est prêt.</p>
        <label htmlFor="prepared-message">
          Message préparé
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
