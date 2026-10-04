"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { api, submissionKey } from "./api-client";
import { QueryPreset } from "./query-preset";
import { copyMessage } from "./copy-message";
import { PrivacyNote } from "./privacy-note";
import { WhatsappOptin } from "./whatsapp-optin";

const steps = ["Votre quotidien", "Une place pour lui", "Votre message"];

function SelectField({ name, label, options }) {
  return (
    <label htmlFor={`meet-${name}`}>
      {label}
      <select id={`meet-${name}`} name={name} required defaultValue="">
        <option value="">Choisir</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function MeetingForm({ animals, settings, whatsappEnabled = false }) {
  const form = useRef(null);
  const prepared = useRef(null);
  const focusOnChange = useRef(false);
  const [animal, setAnimal] = useState("");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(false);
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const attempt = useRef(null);
  const companion = animals.find((item) => item.slug === animal) || null;
  const preset = useCallback(
    (value) =>
      setAnimal(animals.some((item) => item.slug === value) ? value : ""),
    [animals],
  );

  useEffect(() => {
    if (!focusOnChange.current) return;
    focusOnChange.current = false;
    const target = result
      ? "#meeting-result-title"
      : `[data-meeting-step="${step}"] legend`;
    form.current.querySelector(target)?.focus();
  }, [step, result]);

  function showStep(index) {
    focusOnChange.current = true;
    setStep(index);
    setResult(false);
    setCopyStatus("");
    setError("");
  }

  function validate(index) {
    const fields = form.current.querySelectorAll(
      `[data-meeting-step="${index}"] input, [data-meeting-step="${index}"] select, [data-meeting-step="${index}"] textarea`,
    );
    for (const field of fields) {
      if (field.name === "name")
        field.setCustomValidity(
          field.value.trim() ? "" : "Veuillez renseigner votre prénom.",
        );
      if (!field.checkValidity()) {
        flushSync(() => {
          setStep(index);
          setResult(false);
        });
        field.reportValidity();
        return false;
      }
    }
    return true;
  }

  function submit(event) {
    event.preventDefault();
    if (step < 2) {
      if (validate(step)) showStep(step + 1);
      return;
    }
    for (let index = 0; index < steps.length; index++)
      if (!validate(index)) return;
    const data = new FormData(form.current);
    const name = data.get("name").trim();
    const copy = data.get("message").trim();
    setMessage(
      `Objet : Projet de rencontre avec ${companion.name}\n\nBonjour,\n\nJe m’appelle ${name} et je souhaite échanger sur une rencontre avec ${companion.name}.\n\nMon quotidien\n• Logement : ${data.get("home")}\n• Foyer : ${data.get("household")}\n• Présence : ${data.get("presence")}\n• Animaux à la maison : ${data.get("pets")}\n• Période envisagée : ${data.get("time")}\n\n${copy ? copy + "\n\n" : ""}Merci pour votre retour,\n${name}${companion.demo ? "\n\n[Essai : profil fictif.]" : ""}`,
    );
    focusOnChange.current = true;
    setResult(true);
    setCopyStatus("");
  }

  async function send() {
    if (pending || sent) return;
    if (!consent) {
      setError("Veuillez accepter l’enregistrement de votre demande.");
      return;
    }
    const data = Object.fromEntries(new FormData(form.current));
    const payload = {
      ...data,
      kind: "meeting",
      consent,
      summary: message,
      whatsappConsent: data.whatsappConsent === "on",
    };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.serialized !== serialized)
      attempt.current = { serialized, key: submissionKey() };
    setPending(true);
    setError("");
    try {
      const response = await api("/api/requests", {
        method: "POST",
        data: payload,
        key: attempt.current.key,
      });
      setSent(response.id);
    } catch (error) {
      setError(
        error.message || "Connexion impossible. Vos réponses sont conservées.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="meeting-layout shell">
      <Suspense>
        <QueryPreset name="animal" onValue={preset} />
      </Suspense>
      <aside className="meeting-companion">
        <div className="meeting-photo" id="meeting-photo" hidden={!companion}>
          <img
            id="meeting-image"
            src={companion?.image || "/assets/dog-portrait.webp"}
            alt={
              companion
                ? `Portrait illustratif de ${companion.name}, ${companion.type.toLowerCase()}`
                : "Portrait illustratif du compagnon choisi"
            }
            width={1536}
            height={1024}
          />
        </div>
        <span className="eyebrow">VOTRE PROJET DE RENCONTRE</span>
        <h2 id="meeting-name">{companion?.name || "Une belle rencontre."}</h2>
        <p id="meeting-description">
          {companion?.description ||
            "Choisissez le compagnon dont vous souhaitez parler."}
        </p>
        <Link
          id="meeting-profile"
          className="text-link"
          href={companion ? `/${animal}` : "/animaux"}
        >
          {companion
            ? `Revoir la fiche de ${companion.name}`
            : "Découvrir les portraits"}
        </Link>
        <div className="meeting-reminder">
          <svg aria-hidden="true">
            <use href="#heart" />
          </svg>
          <p>
            {companion?.demo
              ? "Ce profil est fictif. Votre demande sera enregistrée comme un essai."
              : "Votre demande sera enregistrée pour que l’équipe puisse vous répondre. Elle ne réserve pas un animal."}
          </p>
        </div>
      </aside>
      <form
        ref={form}
        id="meeting-form"
        className="meeting-form"
        noValidate
        onSubmit={submit}
      >
        <ol className="meeting-progress" aria-label="Étapes du projet">
          {steps.map((label, index) => (
            <li
              key={label}
              className={result || index < step ? "complete" : undefined}
              aria-current={!result && index === step ? "step" : undefined}
            >
              <span>0{index + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <p id="meeting-status" className="eyebrow" role="status">
          {result ? "Votre récapitulatif est prêt" : `Étape ${step + 1} sur 3`}
        </p>
        <fieldset data-meeting-step="0" hidden={result || step !== 0}>
          <legend tabIndex={-1}>Commençons par vous.</legend>
          <p className="field-intro">Les premiers repères de votre projet.</p>
          {!animals.length && (
            <p className="notice">
              Aucun compagnon n’est actuellement disponible pour une demande.
              Vous pouvez{" "}
              <Link href="/contact" className="text-link">
                nous contacter
              </Link>
              .
            </p>
          )}
          <label htmlFor="meet-animal">
            Le compagnon qui vous intéresse
            <select
              id="meet-animal"
              name="animal"
              required
              value={animal}
              onChange={(event) => setAnimal(event.target.value)}
            >
              <option value="">Choisir un compagnon</option>
              {animals.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name} · {item.type}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="meet-name">
            Votre prénom
            <input
              id="meet-name"
              name="name"
              autoComplete="given-name"
              maxLength={100}
              required
              placeholder="Votre prénom"
              onInput={(event) => event.currentTarget.setCustomValidity("")}
            />
          </label>
          <label htmlFor="meet-email">
            Votre adresse e-mail
            <input
              id="meet-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="Pour vous répondre"
            />
          </label>
          <div className="form-row">
            <SelectField
              name="home"
              label="Votre logement"
              options={["Appartement", "Maison", "Autre logement"]}
            />
            <SelectField
              name="household"
              label="Votre foyer"
              options={[
                "Une personne",
                "Plusieurs adultes",
                "Adultes et enfants",
              ]}
            />
          </div>
        </fieldset>
        <fieldset data-meeting-step="1" hidden={result || step !== 1}>
          <legend tabIndex={-1}>Imaginons la vie ensemble.</legend>
          <p className="field-intro">
            Chaque quotidien est différent. Ces réponses serviront à ouvrir la
            conversation.
          </p>
          <SelectField
            name="presence"
            label="Votre présence habituelle"
            options={[
              "À la maison une grande partie de la journée",
              "Des absences de quelques heures",
              "Des absences pendant une journée de travail",
              "Un rythme variable, à discuter",
            ]}
          />
          <SelectField
            name="pets"
            label="Y a-t-il déjà des animaux chez vous ?"
            options={[
              "Aucun animal",
              "Un ou plusieurs chiens",
              "Un ou plusieurs chats",
              "Plusieurs espèces ou d’autres animaux",
            ]}
          />
          <SelectField
            name="time"
            label="Quand envisagez-vous un accueil ?"
            options={[
              "Quand le projet sera prêt",
              "Dans les prochaines semaines",
              "Dans quelques mois",
              "Je prends simplement des renseignements",
            ]}
          />
          <p className="meeting-tip">
            Un logement ou un rythme ne résume pas un foyer. L’objectif est
            d’échanger sur les besoins du compagnon et votre organisation.
          </p>
        </fieldset>
        <fieldset data-meeting-step="2" hidden={result || step !== 2}>
          <legend tabIndex={-1}>Quelques mots, à votre façon.</legend>
          <p className="field-intro">
            Votre envie de rencontre, l’organisation que vous imaginez ou les
            questions que vous avez.
          </p>
          <label htmlFor="meet-message">
            Votre message <span className="optional">(facultatif)</span>
            <textarea
              id="meet-message"
              name="message"
              rows={5}
              maxLength={3000}
              placeholder="Ce qui vous plaît chez ce compagnon, votre quotidien, vos questions…"
            />
          </label>
          <div className="meeting-next">
            <WhatsappOptin
              enabled={whatsappEnabled && !companion?.demo}
              id="meeting-whatsapp"
              disabled={pending || !!sent}
            />
            <span className="eyebrow">ET ENSUITE ?</span>
            <h3>Un échange, puis une rencontre.</h3>
            <p>
              Relisez le récapitulatif avant de l’envoyer. L’équipe pourra
              ensuite consulter votre demande et vous répondre.{" "}
              {settings?.responseTime &&
                `Délai habituel : ${settings.responseTime}.`}
            </p>
          </div>
        </fieldset>
        <div className="meeting-actions" hidden={result}>
          <button
            id="meeting-back"
            type="button"
            className="text-link"
            hidden={step === 0}
            onClick={() => showStep(step - 1)}
          >
            Revenir
          </button>
          <button
            id="meeting-next"
            type="button"
            className="button"
            hidden={step === 2}
            onClick={() => {
              if (validate(step)) showStep(step + 1);
            }}
          >
            Continuer
          </button>
          <button
            id="meeting-submit"
            type="submit"
            className="button"
            hidden={step !== 2}
          >
            Préparer mon message
          </button>
        </div>
        <noscript>
          <p className="notice">
            Activez JavaScript pour préparer le récapitulatif. Vous pouvez aussi
            revenir sur la fiche et noter les questions que vous souhaitez
            poser.
          </p>
        </noscript>
        <section
          id="meeting-result"
          hidden={!result}
          aria-labelledby="meeting-result-title"
        >
          <span className="eyebrow">LE PREMIER PAS EST PRÊT</span>
          <h2 id="meeting-result-title" tabIndex={-1}>
            Une conversation
            <br />
            <em>peut commencer.</em>
          </h2>
          <p>
            {sent
              ? `Votre demande a bien été enregistrée. Référence : ${sent}`
              : "Relisez votre message, puis confirmez son envoi. Aucune rencontre n’est réservée."}
          </p>
          <label htmlFor="meeting-prepared">
            Votre récapitulatif
            <textarea
              ref={prepared}
              id="meeting-prepared"
              rows={12}
              maxLength={8000}
              readOnly={pending || !!sent}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          {!sent && (
            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                disabled={pending}
                onChange={(event) => setConsent(event.target.checked)}
              />
              J’accepte l’enregistrement de mes coordonnées et de mes réponses
              pour le traitement de cette demande par l’équipe.
            </label>
          )}
          <PrivacyNote settings={settings} />
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {sent && (
            <p role="status">
              Demande enregistrée. Vous pouvez conserver une copie ci-dessous.
            </p>
          )}
          <div className="meeting-result-actions">
            {!sent && (
              <button
                type="button"
                id="meeting-send"
                className="button"
                disabled={pending}
                onClick={send}
              >
                {pending ? "Enregistrement…" : "Envoyer ma demande"}
              </button>
            )}
            <button
              type="button"
              id="meeting-copy"
              className="button"
              onClick={() => copyMessage(prepared.current, setCopyStatus)}
            >
              Copier mon message
            </button>
            <button
              type="button"
              id="meeting-edit"
              hidden={!!sent}
              disabled={pending}
              className="text-link"
              onClick={() => showStep(0)}
            >
              Modifier mes réponses
            </button>
          </div>
          <p id="meeting-copy-status" role="status">
            {copyStatus}
          </p>
        </section>
      </form>
    </div>
  );
}
