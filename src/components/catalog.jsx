"use client";

import Link from "next/link";
import { useState } from "react";
import { animalStatuses } from "../data/form-options";

const filters = [
  ["tous", "Tous les compagnons"],
  ["chien", "Les chiens"],
  ["chat", "Les chats"],
];

export function Catalog({ animals }) {
  const [filter, setFilter] = useState("tous");
  const entries = animals.map((animal) => [animal.slug, animal]);
  const count = entries.filter(
    ([, animal]) => filter === "tous" || filter === animal.type.toLowerCase(),
  ).length;
  return (
    <section className="catalog shell" aria-label="Catalogue des compagnons">
      <div className="catalog-toolbar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Filtrer les compagnons"
        >
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "selected" : undefined}
              data-filter={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="catalog-count" role="status">
          {count} {count > 1 ? "portraits" : "portrait"} à découvrir
        </p>
      </div>
      <div className="animal-grid">
        {entries.map(([slug, animal]) => (
          <article
            key={slug}
            className="animal-card"
            data-animal={animal.type.toLowerCase()}
            hidden={filter !== "tous" && filter !== animal.type.toLowerCase()}
          >
            <Link
              className="animal-image"
              href={`/${slug}`}
              aria-label={`Découvrir ${animal.name}${animal.demo ? ", fiche d’exemple" : ""}`}
            >
              <img
                src={animal.image}
                alt={animal.alt}
                width={1536}
                height={1024}
                loading="lazy"
              />
              <span className="badge">
                {animal.demo
                  ? "Portrait illustratif"
                  : animalStatuses[animal.status]}
              </span>
              <span className="photo-name" aria-hidden="true">
                {animal.name}
              </span>
            </Link>
            <div className="animal-description">
              <div className="animal-title">
                <h2>{animal.name}</h2>
                <span>{animal.type}</span>
              </div>
              <div className="tags">
                {animal.traits.map((trait) => (
                  <span key={trait}>{trait}</span>
                ))}
              </div>
              <p>{animal.copy}</p>
              <Link className="text-link" href={`/${slug}`}>
                Faire connaissance
              </Link>
            </div>
          </article>
        ))}
      </div>
      {count === 0 && (
        <p role="status">
          Aucun compagnon ne correspond à ce filtre pour le moment.
        </p>
      )}
      {animals.some((animal) => animal.demo) && (
        <p className="sample-note">
          Les fiches signalées comme exemples utilisent des portraits générés et
          ne sont pas des annonces d’adoption réelles.
        </p>
      )}
    </section>
  );
}
