import Link from "next/link";
import { PracticalInfo } from "../practical-info";

export default function PageContent() {
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">
            {"PRENDRE LE TEMPS DE BIEN SE CHOISIR"}
          </span>
          <h1>
            {"Une rencontre."}
            <br />
            <em>{"Un engagement pour la vie."}</em>
          </h1>
        </div>
        <p className="intro-copy">
          {
            "Un coup de cœur compte. Un quotidien compatible aussi. L’adoption commence par une conversation."
          }
        </p>
      </div>
      <section className="adoption-layout shell">
        <div className="adoption-visual" data-reveal="">
          <img
            src="/assets/dog-portrait.webp"
            alt="Portrait illustratif d’un golden retriever dans un jardin"
            width="1536"
            height="1024"
          />
          <div className="adoption-quote">
            {"On ne choisit pas seulement"}
            <br />
            {"un animal. On partage une vie."}
          </div>
        </div>
        <div className="adoption-timeline">
          <article data-reveal="">
            <span className="step-number">{"01"}</span>
            <div>
              <span className="eyebrow">{"PARLER"}</span>
              <h2>{"Faisons connaissance."}</h2>
              <p>
                {
                  "Votre rythme, votre logement, vos envies : prendre le temps d’en parler permet de réfléchir au compagnon qui pourrait trouver sa place chez vous."
                }
              </p>
            </div>
          </article>
          <article data-reveal="">
            <span className="step-number">{"02"}</span>
            <div>
              <span className="eyebrow">{"RENCONTRER"}</span>
              <h2>{"Laissons le lien se créer."}</h2>
              <p>
                {
                  "Observer, poser vos questions et laisser l’animal venir à son rythme. La confiance se construit dans les deux sens."
                }
              </p>
            </div>
          </article>
          <article data-reveal="">
            <span className="step-number">{"03"}</span>
            <div>
              <span className="eyebrow">{"ACCUEILLIR"}</span>
              <h2>{"Préparons un nouveau départ."}</h2>
              <p>
                {
                  "Un endroit calme, quelques repères et du temps disponible : préparons ensemble les premiers jours dans son nouveau foyer."
                }
              </p>
            </div>
          </article>
        </div>
      </section>
      <PracticalInfo adoption />
      <section className="faq shell" data-reveal="">
        <span className="eyebrow">{"AVANT DE FAIRE LE PREMIER PAS"}</span>
        <h2>{"Vos questions ont leur place."}</h2>
        <details>
          <summary>{"Comment savoir quel compagnon me correspond ?"}</summary>
          <p>
            {
              "Partez de votre quotidien : présence, activités, environnement et attentes de votre famille. La personnalité et les besoins de l’animal doivent aussi guider le choix."
            }
          </p>
        </details>
        <details>
          <summary>{"Que préparer avant son arrivée ?"}</summary>
          <p>
            {
              "Un espace tranquille, le nécessaire pour son quotidien et une organisation pour vos absences. Renseignez-vous aussi sur les habitudes qui lui sont familières."
            }
          </p>
          <Link className="text-link" href="/nouveau-foyer">
            {"Lire les conseils d’accueil"}
          </Link>
        </details>
      </section>
      <aside className="closing-cta shell" data-reveal="">
        <div>
          <h2>{"Commençons par en parler."}</h2>
          <p>
            {
              "Quelques mots sur votre projet suffisent pour préparer une première conversation."
            }
          </p>
        </div>
        <Link className="button" href="/rencontre">
          {"Préparer mon projet"}
        </Link>
      </aside>
    </>
  );
}
