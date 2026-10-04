import Link from "next/link";

import { Dialog, PortraitLink } from "../dialog";
export default function PageContent() {
  return (
    <>
      <section className="profile-layout shell">
        <div className="profile-gallery">
          <PortraitLink
            href="/assets/dog-portrait.webp"
            className="profile-photo portrait-open"
            label="Voir le portrait de Soleil en grand"
          >
            <img
              src="/assets/dog-portrait.webp"
              alt="Portrait illustratif de Soleil, chien dans une lumière douce"
              width="1536"
              height="1024"
              fetchPriority="high"
            />
            <span className="badge">{"Portrait illustratif"}</span>
            <span className="photo-name">{"Soleil"}</span>
            <span className="photo-expand">{"↗ Voir le portrait"}</span>
          </PortraitLink>

          <p className="gallery-caption">
            {"Une personnalité à découvrir."}
            <br />
            <em>{"Une histoire à écrire ensemble."}</em>
          </p>
        </div>

        <div className="profile-story">
          <span className="eyebrow">{"PORTRAIT D’EXEMPLE · CHIEN"}</span>
          <h1>
            {"Bonjour,"}
            <br />
            <em>{"moi c’est Soleil."}</em>
          </h1>
          <div className="tags">
            <span>{"Curieux"}</span>
            <span>{"Joueur"}</span>
            <span>{"Sociable"}</span>
          </div>
          <p className="profile-lede">
            {
              "Le bonheur des balades, une balle à retrouver et une place tout près de vous."
            }
          </p>

          <div className="profile-facts">
            <h2>{"Avant de se rencontrer."}</h2>
            <dl>
              <div>
                <dt>{"Âge et sexe"}</dt>
                <dd>{"À renseigner"}</dd>
              </div>
              <div>
                <dt>{"Entente avec les animaux"}</dt>
                <dd>{"À confirmer"}</dd>
              </div>
              <div>
                <dt>{"Vie avec des enfants"}</dt>
                <dd>{"À échanger"}</dd>
              </div>
              <div>
                <dt>{"Disponibilité"}</dt>
                <dd>{"Profil de démonstration"}</dd>
              </div>
            </dl>
            <p>
              {
                "Ces informations seront précisées par l’association pour chaque annonce réelle."
              }
            </p>
          </div>

          <Link
            className="button profile-meeting"
            href="/rencontre?animal=soleil"
          >
            <svg className="" aria-hidden="true">
              <use href="#heart" />
            </svg>
            {"Je souhaite rencontrer Soleil"}
          </Link>
          <p className="sample-note">
            {
              "Soleil est un personnage fictif avec un portrait généré. Vous pouvez essayer le parcours ; aucune demande d’adoption n’est envoyée."
            }
          </p>
        </div>
      </section>

      <section className="profile-chapters shell">
        <article className="profile-chapter" data-reveal="">
          <span className="eyebrow">{"01 / SON PETIT UNIVERS"}</span>
          <h2>
            {"Une présence."}
            <br />
            <em>{"Tout un caractère."}</em>
          </h2>
          <p>
            {
              "Dans cette histoire imaginée, Soleil est le compagnon des petits départs : une promenade qui devient une aventure, un jeu dans le jardin, puis un moment tranquille à vos côtés. On imagine un chien qui aime partager, autant les activités que les pauses."
            }
          </p>
        </article>
        <article className="profile-chapter needs-chapter" data-reveal="">
          <span className="eyebrow">{"02 / AU QUOTIDIEN"}</span>
          <h2>
            {"Les petites attentions"}
            <br />
            <em>{"qui comptent."}</em>
          </h2>
          <ul>
            <li>{"Des sorties et des jeux chaque jour."}</li>
            <li>{"Des repères réguliers et du temps partagé."}</li>
            <li>{"Une organisation pour les moments de solitude."}</li>
          </ul>
        </article>
        <article className="profile-chapter" data-reveal="">
          <span className="eyebrow">{"03 / SON FUTUR FOYER"}</span>
          <h2>
            {"Une vie qui vous"}
            <br />
            <em>{"ressemble, ensemble."}</em>
          </h2>
          <p>
            {
              "Un foyer qui aime sortir, jouer et garder du temps pour les moments calmes. Le rythme de toute la famille doit pouvoir lui faire une place."
            }
          </p>
        </article>
      </section>

      <section className="profile-conversation shell" data-reveal="">
        <div>
          <span className="eyebrow">{"UNE RENCONTRE SE PRÉPARE"}</span>
          <h2>
            {"Vos questions"}
            <br />
            <em>{"ont leur place."}</em>
          </h2>
          <p>{"Le lien commence aussi par une conversation."}</p>
        </div>
        <ul>
          <li>{"Quel est son rythme de promenade habituel ?"}</li>
          <li>{"Comment vit-il les absences ?"}</li>
          <li>{"Quelles rencontres prévoir avec les animaux du foyer ?"}</li>
        </ul>
      </section>

      <aside className="closing-cta shell" data-reveal="">
        <div>
          <h2>{"Et si vous faisiez connaissance avec Soleil ?"}</h2>
          <p>
            {
              "Quelques repères sur votre quotidien pour préparer un premier échange."
            }
          </p>
        </div>
        <Link className="button" href="/rencontre?animal=soleil">
          {"Préparer une rencontre"}
        </Link>
      </aside>

      <Dialog
        id="portrait-dialog"
        className="portrait-dialog"
        labelledBy="portrait-title"
      >
        <h2 id="portrait-title">{"Le portrait de Soleil"}</h2>
        <img
          src="/assets/dog-portrait.webp"
          alt="Portrait illustratif de Soleil en grand"
          width="1536"
          height="1024"
        />
        <p>{"Illustration générée · Personnage de démonstration"}</p>
      </Dialog>
    </>
  );
}
