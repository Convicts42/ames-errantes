import Link from "next/link";
import { listAnimals } from "@ames/core/site/repository.mjs";
import { Hero } from "../hero";

const steps = [
  [
    "Faisons connaissance",
    "Votre rythme, votre logement, vos envies : on en parle d’abord.",
  ],
  [
    "Laissons le lien se créer",
    "Observer, poser vos questions, laisser l’animal venir à son rythme.",
  ],
  [
    "Préparons un nouveau départ",
    "Un endroit calme, quelques repères et du temps disponible.",
  ],
];

const helpLinks = [
  ["/nous-aider", "Soutenir notre mission", "Un don ponctuel ou régulier."],
  ["/benevolat", "Devenir bénévole", "Donner un peu de son temps."],
  [
    "/famille-accueil",
    "Devenir famille d’accueil",
    "Ouvrir sa porte le temps d’une transition.",
  ],
];

export default async function PageContent() {
  const animals = (await listAnimals()).slice(0, 3);
  return (
    <>
      <Hero>
        <div className="hero-content">
          <span className="eyebrow">{"DES RENCONTRES QUI CHANGENT TOUT"}</span>
          <h1 id="hero-title">
            {"Chaque âme"}
            <br />
            <em>{"mérite un foyer."}</em>
          </h1>
          <p>
            {
              "Un peu de douceur, beaucoup d’amour, et la promesse d’un nouveau départ pour les chiens et les chats que nous accompagnons."
            }
          </p>
          <div className="hero-actions">
            <Link className="button" href="/animaux">
              <svg aria-hidden="true">
                <use href="#paw" />
              </svg>
              {"Rencontrer nos compagnons"}
            </Link>
            <Link className="button button-outline" href="/association">
              {"Découvrir notre mission"}
            </Link>
          </div>
          <span className="hero-signature">
            {"Une seconde chance commence avec vous."}
          </span>
        </div>
        <figure className="hero-figure">
          <img
            src="/assets/companions.webp"
            alt="Un chien et un chat blottis ensemble dans la lumière dorée du soleil couchant"
            width="1672"
            height="941"
            fetchPriority="high"
          />
          <figcaption>
            <span>{"Protéger · Accompagner · Réunir"}</span>
            <strong>{"Trois engagements, un refuge."}</strong>
          </figcaption>
        </figure>
      </Hero>

      <section className="home-band" aria-labelledby="home-animals-title">
        <div className="shell home-animals">
          <div className="home-heading">
            <div>
              <span className="eyebrow">{"ILS ATTENDENT UNE RENCONTRE"}</span>
              <h2 id="home-animals-title">
                {"Et si votre histoire commençait ici ?"}
              </h2>
            </div>
            <Link className="text-link" href="/animaux">
              {"Voir tous les compagnons"}
            </Link>
          </div>
          <div className="home-animal-grid">
            {animals.map((animal) => (
              <Link
                key={animal.slug}
                className="home-animal"
                href={`/${animal.slug}`}
              >
                <img
                  src={animal.image}
                  alt={animal.alt}
                  width={1536}
                  height={1024}
                  loading="lazy"
                />
                <span className="home-animal-title">
                  <strong>{animal.name}</strong>
                  <span>{animal.type}</span>
                </span>
                <span className="home-animal-traits">
                  {animal.traits.join(", ")}
                </span>
              </Link>
            ))}
            <div className="home-animal-next">
              <strong>{"Le coup de cœur, et après ?"}</strong>
              <p>
                {
                  "Les étapes pour préparer une rencontre et accueillir un compagnon."
                }
              </p>
              <Link className="text-link" href="/adopter">
                {"Comprendre l’adoption"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="shell home-steps" aria-labelledby="home-steps-title">
        <div>
          <span className="eyebrow">
            {"PRENDRE LE TEMPS DE BIEN SE CHOISIR"}
          </span>
          <h2 id="home-steps-title">
            {"Une rencontre."}
            <br />
            <em>{"Un engagement pour la vie."}</em>
          </h2>
          <p>
            {
              "Un coup de cœur compte. Un quotidien compatible aussi. L’adoption commence par une conversation."
            }
          </p>
        </div>
        <ol>
          {steps.map(([title, text], index) => (
            <li key={title}>
              <span aria-hidden="true">{`0${index + 1}`}</span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="shell home-help" aria-labelledby="home-help-title">
        <div>
          <h2 id="home-help-title">{"Faire la différence."}</h2>
          <p>{"Un don, du temps ou une porte ouverte."}</p>
        </div>
        {helpLinks.map(([href, title, text]) => (
          <Link key={title} href={href}>
            <strong>{title}</strong>
            <span>{text}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
