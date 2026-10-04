import Link from "next/link";

import { DialogButton } from "../dialog";

export default function PageContent() {
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">{"CHACUN PEUT FAIRE UNE DIFFÉRENCE"}</span>
          <h1>
            {"Les petits gestes"}
            <br />
            <em>{"font les grandes histoires."}</em>
          </h1>
        </div>
        <p className="intro-copy">
          {
            "On peut aider de mille façons. Avec du temps, de l’attention ou une porte ouverte. La vôtre compte."
          }
        </p>
      </div>
      <section className="support-grid shell">
        <article className="support-card featured" data-reveal="">
          <span className="support-icon">
            <svg className="" aria-hidden="true">
              <use href="#heart" />
            </svg>
          </span>
          <span className="eyebrow">{"SOUTENIR"}</span>
          <h2>
            {"Un don."}
            <br />
            {"De nouvelles possibilités."}
          </h2>
          <p>
            {
              "Contribuer à l’accueil, à l’alimentation et aux soins. Un soutien à la hauteur de vos possibilités."
            }
          </p>
          <DialogButton className="button button-cream" dialogId="don">
            {"Faire un don"}
          </DialogButton>
          <span className="support-fineprint">
              {"Un soutien à la hauteur de vos possibilités."}
          </span>
        </article>
        <article className="support-card" data-reveal="">
          <span className="support-icon">
            <svg className="" aria-hidden="true">
              <use href="#paw" />
            </svg>
          </span>
          <span className="eyebrow">{"ACCUEILLIR"}</span>
          <h2>
            {"Une place chez vous."}
            <br />
            {"Le temps de se reconstruire."}
          </h2>
          <p>
            {
              "Offrir un environnement calme et une présence rassurante, avant un foyer définitif."
            }
          </p>
          <Link className="button" href="/famille-accueil">
            {"Proposer un accueil"}
          </Link>
        </article>
        <article className="support-card" data-reveal="">
          <span className="support-icon">
            <svg className="" aria-hidden="true">
              <use href="#sun" />
            </svg>
          </span>
          <span className="eyebrow">{"S’IMPLIQUER"}</span>
          <h2>
            {"Un peu de votre temps."}
            <br />
            {"Beaucoup de sens."}
          </h2>
          <p>
            {
              "Votre énergie, vos idées et vos compétences peuvent faire avancer la mission."
            }
          </p>
          <Link className="button" href="/benevolat">
            {"Devenir bénévole"}
          </Link>
        </article>
      </section>
      <div className="support-note shell" data-reveal="">
        <span aria-hidden="true">{"♡"}</span>
        <p>
          {"Pas besoin de tout changer."}
          <br />
          <strong>{"Il suffit parfois de faire une petite place."}</strong>
        </p>
      </div>
    </>
  );
}
