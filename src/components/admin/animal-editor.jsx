"use client";

import { useState } from "react";
import { animalStatuses } from "../../data/form-options";
import { api } from "../api-client";

const fields = [
  ["name", "Nom", 100],
  ["slug", "Adresse de la fiche", 80],
  ["image", "Chemin de la photo", 200],
  ["alt", "Description de la photo", 250],
  ["age", "Âge et sexe", 200],
  ["compatibility", "Entente avec les animaux", 500],
  ["children", "Vie avec des enfants", 500],
];
const paragraphs = [
  ["description", "Description courte", 500],
  ["copy", "Présentation du catalogue", 1000],
  ["lede", "Introduction de la fiche", 1000],
  ["story", "Son histoire", 5000],
  ["home", "Son futur foyer", 2000],
];
const lists = [
  ["traits", "Traits de caractère", 6],
  ["needs", "Besoins au quotidien", 10],
  ["questions", "Questions à préparer", 10],
];

export function AnimalEditor({ animal, onSaved, onCancel }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const editing = !!animal?.version;
  async function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    for (const [key] of lists)
      data[key] = data[key]
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);
    data.demo = data.demo === "on";
    data.published = data.published === "on";
    if (editing) {
      data.slug = animal.slug;
      data.version = animal.version;
    }
    setPending(true);
    setError("");
    try {
      await api(
        editing ? `/api/admin/animals/${animal.slug}` : "/api/admin/animals",
        { method: editing ? "PUT" : "POST", data },
      );
      await onSaved();
    } catch (error) {
      setError(error.message);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="admin-card animal-editor" onSubmit={submit}>
      <h2>{editing ? `La fiche de ${animal.name}` : "Un nouveau compagnon"}</h2>
      <fieldset className="plain-fieldset" disabled={pending}>
        <div className="admin-form-grid">
          {fields.map(([name, label, max]) => (
            <label key={name} htmlFor={`animal-${name}`}>
              {label}
              <input
                id={`animal-${name}`}
                name={name}
                maxLength={max}
                required
                defaultValue={
                  animal?.[name] ||
                  (name === "image" ? "/assets/dog-portrait.webp" : "")
                }
                readOnly={name === "slug" && editing}
              />
            </label>
          ))}
          <label htmlFor="animal-type">
            Espèce
            <select
              id="animal-type"
              name="type"
              defaultValue={animal?.type || "Chien"}
            >
              <option>Chien</option>
              <option>Chat</option>
            </select>
          </label>
          <label htmlFor="animal-status">
            Disponibilité
            <select
              id="animal-status"
              name="status"
              defaultValue={animal?.status || "available"}
            >
              {Object.entries(animalStatuses).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="form-note">
          Adresse : lettres minuscules, chiffres et tirets. Photo : chemin d’une
          image placée dans public/assets, par exemple
          /assets/dog-portrait.webp. Les images d’exemple sont des
          illustrations.
        </p>
        {paragraphs.map(([name, label, max]) => (
          <label key={name} htmlFor={`animal-${name}`}>
            {label}
            <textarea
              id={`animal-${name}`}
              name={name}
              required
              maxLength={max}
              rows={name === "story" ? 5 : 3}
              defaultValue={animal?.[name] || ""}
            />
          </label>
        ))}
        <div className="admin-form-grid">
          {lists.map(([name, label, max]) => (
            <label key={name} htmlFor={`animal-${name}`}>
              {label}{" "}
              <span className="form-note">
                Une ligne par élément, {max} maximum.
              </span>
              <textarea
                id={`animal-${name}`}
                name={name}
                required
                rows={4}
                defaultValue={animal?.[name]?.join("\n") || ""}
              />
            </label>
          ))}
        </div>
        <label className="consent">
          <input
            name="demo"
            type="checkbox"
            defaultChecked={animal?.demo ?? true}
          />
          Profil fictif de démonstration
        </label>
        <label className="consent">
          <input
            name="published"
            type="checkbox"
            defaultChecked={animal?.published ?? false}
          />
          Publier la fiche dans le catalogue
        </label>
        <div className="admin-actions">
          <button className="button">
            {pending ? "Enregistrement…" : "Enregistrer la fiche"}
          </button>
          <button className="text-link" type="button" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
