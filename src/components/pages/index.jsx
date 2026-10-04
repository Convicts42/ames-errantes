import Link from "next/link";
import { Hero } from "../hero";

export default function PageContent() {
  return (
    <>
      <Hero>
        <img
          className="hero-photo"
          src="/assets/companions.webp"
          alt="Un chien et un chat blottis ensemble dans la lumière dorée du soleil couchant"
          width="1672"
          height="941"
          fetchPriority="high"
        />
        <canvas className="hero-canvas" aria-hidden="true"></canvas>
        <div className="hero-content">
          <span className="eyebrow">{"DES RENCONTRES QUI CHANGENT TOUT"}</span>
          <h1 id="hero-title">
            {"Chaque âme"}
            <br />
            <em>{"mérite un foyer."}</em>
          </h1>
          <p>
            {"Un peu de douceur. Beaucoup d’amour."}
            <br />
            {"Et la promesse d’un nouveau départ."}
          </p>
          <div className="hero-actions">
            <Link className="button" href="/animaux">
              <svg className="" aria-hidden="true">
                <use href="#paw" />
              </svg>
              {"Rencontrer nos compagnons"}
            </Link>
            <Link className="button button-cream" href="/association">
              {"Découvrir notre mission"}
            </Link>
          </div>
          <span className="hero-signature">
            {"Une seconde chance commence avec vous."}
          </span>
        </div>
        <div className="hero-bottom">
          <span>{"PROTÉGER   ·   ACCOMPAGNER   ·   RÉUNIR"}</span>
        </div>
        <span className="hero-note" aria-hidden="true">
          {"Parfois, une rencontre"}
          <br />
          {"change tout. ♡"}
        </span>
      </Hero>
      <div className="home-doors shell" data-reveal="">
        <Link href="/adopter">
          <span>{"01 / UNE RENCONTRE"}</span>
          <h2>{"Ouvrir votre cœur."}</h2>
          <p>{"Préparer une adoption, pas à pas."}</p>
        </Link>
        <Link href="/nous-aider">
          <span>{"02 / UN PETIT GESTE"}</span>
          <h2>{"Faire la différence."}</h2>
          <p>{"Un don, du temps ou une porte ouverte."}</p>
        </Link>
        <Link href="/blog">
          <span>{"03 / UNE VIE ENSEMBLE"}</span>
          <h2>{"Écrire une belle histoire."}</h2>
          <p>{"Les conseils pour bien commencer."}</p>
        </Link>
      </div>
    </>
  );
}
