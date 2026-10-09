import Link from "next/link";
import { Dialog, PortraitLink } from "./dialog";
import { animalStatuses } from "@ames/core/data/form-options.js";
export function AnimalProfile({ animal }) {
  const available = animal.status === "available";
  return (
    <>
      <section className="profile-layout shell">
        <div className="profile-gallery">
          <PortraitLink
            href={animal.image}
            className="profile-photo portrait-open"
            label={`Voir le portrait de ${animal.name} en grand`}
          >
            <img
              src={animal.image}
              alt={animal.alt}
              width="1536"
              height="1024"
              fetchPriority="high"
            />
            <span className="badge">
              {animal.demo
                ? "Portrait illustratif"
                : animalStatuses[animal.status]}
            </span>
            <span className="photo-name">{animal.name}</span>
            <span className="photo-expand">↗ Voir le portrait</span>
          </PortraitLink>
          <p className="gallery-caption">
            Une personnalité à découvrir.
            <br />
            <em>Une histoire à écrire ensemble.</em>
          </p>
          <div className="animal-gallery">
            {(animal.photos || [])
              .filter((url) => url !== animal.image)
              .map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Voir la photo ${index + 2} de ${animal.name} en grand`}
                >
                  <img
                    src={url}
                    alt={`${animal.name} — photo ${index + 2}`}
                    width={600}
                    height={450}
                    loading="lazy"
                  />
                </a>
              ))}
          </div>
        </div>
        <div className="profile-story">
          <span className="eyebrow">
            {animal.demo ? "PORTRAIT D’EXEMPLE" : "FAISONS CONNAISSANCE"} ·{" "}
            {animal.type.toUpperCase()}
          </span>
          <h1>
            Bonjour,
            <br />
            <em>moi c’est {animal.name}.</em>
          </h1>
          <div className="tags">
            {animal.traits.map((trait, index) => (
              <span key={index}>{trait}</span>
            ))}
          </div>
          <p className="profile-lede">{animal.lede}</p>
          <div className="profile-facts">
            <h2>Avant de se rencontrer.</h2>
            <dl>
              {[
                ["size", "Gabarit"],
                ["location", "Localisation"],
                ["health", "Santé et soins"],
              ].map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{animal[key] || "À préciser avec l’équipe"}</dd>
                </div>
              ))}
              <div>
                <dt>Âge et sexe</dt>
                <dd>{animal.age}</dd>
              </div>
              <div>
                <dt>Entente avec les animaux</dt>
                <dd>{animal.compatibility}</dd>
              </div>
              <div>
                <dt>Vie avec des enfants</dt>
                <dd>{animal.children}</dd>
              </div>
              <div>
                <dt>Disponibilité</dt>
                <dd>
                  {animal.demo
                    ? "Profil de démonstration"
                    : animalStatuses[animal.status]}
                </dd>
              </div>
            </dl>
          </div>
          {available ? (
            <Link
              className="button profile-meeting"
              href={`/rencontre?animal=${animal.slug}`}
            >
              <svg aria-hidden="true">
                <use href="#heart" />
              </svg>
              Je souhaite rencontrer {animal.name}
            </Link>
          ) : (
            <p className="notice">
              {animalStatuses[animal.status]} : les demandes de rencontre sont
              fermées pour ce compagnon.
            </p>
          )}
          {animal.demo && (
            <p className="sample-note">
              {animal.name} est un personnage fictif avec un portrait généré.
              Les demandes envoyées depuis cette fiche sont enregistrées comme
              essais.
            </p>
          )}
        </div>
      </section>
      <section className="profile-chapters shell">
        {animal.status === "adopted" &&
          animal.storyConsent &&
          animal.adoptionStory && (
            <article className="profile-chapter">
              <span className="eyebrow">DES NOUVELLES DE SON FOYER</span>
              <h2>La suite de son histoire.</h2>
              <p className="preserve-lines">{animal.adoptionStory}</p>
            </article>
          )}
        <article className="profile-chapter" data-reveal="">
          <span className="eyebrow">01 / SON PETIT UNIVERS</span>
          <h2>
            Une présence.
            <br />
            <em>Tout un caractère.</em>
          </h2>
          <p>{animal.story}</p>
        </article>
        <article className="profile-chapter needs-chapter" data-reveal="">
          <span className="eyebrow">02 / AU QUOTIDIEN</span>
          <h2>
            Les petites attentions
            <br />
            <em>qui comptent.</em>
          </h2>
          <ul>
            {animal.needs.map((need, index) => (
              <li key={index}>{need}</li>
            ))}
          </ul>
        </article>
        <article className="profile-chapter" data-reveal="">
          <span className="eyebrow">03 / SON FUTUR FOYER</span>
          <h2>
            Une vie qui vous
            <br />
            <em>ressemble, ensemble.</em>
          </h2>
          <p>{animal.home}</p>
        </article>
      </section>
      <section className="profile-conversation shell" data-reveal="">
        <div>
          <span className="eyebrow">UNE RENCONTRE SE PRÉPARE</span>
          <h2>
            Vos questions
            <br />
            <em>ont leur place.</em>
          </h2>
          <p>Le lien commence aussi par une conversation.</p>
        </div>
        <ul>
          {animal.questions.map((question, index) => (
            <li key={index}>{question}</li>
          ))}
        </ul>
      </section>
      {available && (
        <aside className="closing-cta shell" data-reveal="">
          <div>
            <h2>Et si vous faisiez connaissance avec {animal.name} ?</h2>
            <p>
              Quelques repères sur votre quotidien pour préparer un premier
              échange.
            </p>
          </div>
          <Link className="button" href={`/rencontre?animal=${animal.slug}`}>
            Préparer une rencontre
          </Link>
        </aside>
      )}
      <Dialog
        id="portrait-dialog"
        className="portrait-dialog"
        labelledBy="portrait-title"
      >
        <h2 id="portrait-title">Le portrait de {animal.name}</h2>
        <img src={animal.image} alt={animal.alt} width="1536" height="1024" />
        {animal.demo && (
          <p>Illustration générée · Personnage de démonstration</p>
        )}
      </Dialog>
    </>
  );
}
