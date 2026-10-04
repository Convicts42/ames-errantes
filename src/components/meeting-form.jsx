"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { companions } from "../data/companions";
import { QueryPreset } from "./query-preset";
import { copyMessage } from "./copy-message";

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

export function MeetingForm() {
  const form = useRef(null);
  const prepared = useRef(null);
  const focusOnChange = useRef(false);
  const [animal, setAnimal] = useState("");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(false);
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const companion = Object.hasOwn(companions, animal)
    ? companions[animal]
    : null;
  const preset = useCallback(
    (value) => setAnimal(Object.hasOwn(companions, value) ? value : ""),
    [],
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
      `Objet : Projet de rencontre avec ${companion.name}\n\nBonjour,\n\nJe m’appelle ${name} et je souhaite échanger sur une rencontre avec ${companion.name}.\n\nMon quotidien\n• Logement : ${data.get("home")}\n• Foyer : ${data.get("household")}\n• Présence : ${data.get("presence")}\n• Animaux à la maison : ${data.get("pets")}\n• Période envisagée : ${data.get("time")}\n\n${copy ? copy + "\n\n" : ""}Merci pour votre retour,\n${name}\n\n[Essai du site : profil fictif, message non envoyé.]`,
    );
    focusOnChange.current = true;
    setResult(true);
    setCopyStatus("");
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
            src={`/assets/${companion?.image || "dog"}-portrait.webp`}
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
            Les profils sont fictifs. Ce parcours prépare un message à copier,
            sans envoi ni stockage.
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
              <option value="soleil">Soleil · Chien</option>
              <option value="plume">Plume · Chat</option>
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
            <span className="eyebrow">ET ENSUITE ?</span>
            <h3>Un échange, puis une rencontre.</h3>
            <p>
              Sur le site final, l’association pourra échanger avec vous et
              convenir d’une rencontre selon les besoins de l’animal. Ici, votre
              récapitulatif reste à copier.
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
            Voici votre message à copier. Il n’a pas été envoyé ; aucune
            rencontre n’est réservée.
          </p>
          <label htmlFor="meeting-prepared">
            Votre récapitulatif
            <textarea
              ref={prepared}
              id="meeting-prepared"
              rows={12}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>
          <div className="meeting-result-actions">
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
