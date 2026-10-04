import Link from "next/link";

import { Dialog, PortraitLink } from "../dialog";
export default function PageContent() {
  return (
    <>
      <section className="profile-layout shell">
        <div className="profile-gallery">
          <PortraitLink
            href="/assets/cat-portrait.webp"
            className="profile-photo portrait-open"
            label="Voir le portrait de Plume en grand"
          >
            <img
              src="/assets/cat-portrait.webp"
              alt="Portrait illustratif de Plume, chat dans une lumière douce"
              width="1536"
              height="1024"
              fetchPriority="high"
            />
            <span className="badge">{"Portrait illustratif"}</span>
            <span className="photo-name">{"Plume"}</span>
            <span className="photo-expand">{"↗ Voir le portrait"}</span>
          </PortraitLink>

          <p className="gallery-caption">
            {"Une personnalité à découvrir."}
            <br />
            <em>{"Une histoire à écrire ensemble."}</em>
          </p>
        </div>

        <div className="profile-story">
          <span className="eyebrow">{"PORTRAIT D’EXEMPLE · CHAT"}</span>
          <h1>
            {"Bonjour,"}
            <br />
            <em>{"moi c’est Plume."}</em>
          </h1>
          <div className="tags">
            <span>{"Paisible"}</span>
            <span>{"Observateur"}</span>
            <span>{"Tout en douceur"}</span>
          </div>
          <p className="profile-lede">
            {
              "Un rayon de soleil, un coin de fenêtre et le plaisir de venir vers vous, à son rythme."
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
            href="/rencontre?animal=plume"
          >
            <svg className="" aria-hidden="true">
              <use href="#heart" />
            </svg>
            {"Je souhaite rencontrer Plume"}
          </Link>
          <p className="sample-note">
            {
              "Plume est un personnage fictif avec un portrait généré. Vous pouvez essayer le parcours ; aucune demande d’adoption n’est envoyée."
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
              "Dans cette histoire imaginée, Plume préfère les liens qui se construisent doucement. Un regard depuis sa fenêtre, un jeu qui éveille sa curiosité, une présence qui devient familière. On imagine un chat observateur, à qui l’on laisse le choix du contact."
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
            <li>{"Un espace calme où se retirer."}</li>
            <li>{"Des jeux et des endroits à explorer."}</li>
            <li>{"Du temps pour laisser la confiance s’installer."}</li>
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
              "Un foyer qui respecte ses temps de repos et lui laisse découvrir les lieux sans le presser. Des cachettes, des jeux et une présence attentive à imaginer ensemble."
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
          <li>{"Quels jeux et cachettes lui sont familiers ?"}</li>
          <li>{"Quel environnement connaît-il aujourd’hui ?"}</li>
          <li>{"Comment préparer son arrivée avec les animaux du foyer ?"}</li>
        </ul>
      </section>

      <aside className="closing-cta shell" data-reveal="">
        <div>
          <h2>{"Et si vous faisiez connaissance avec Plume ?"}</h2>
          <p>
            {
              "Quelques repères sur votre quotidien pour préparer un premier échange."
            }
          </p>
        </div>
        <Link className="button" href="/rencontre?animal=plume">
          {"Préparer une rencontre"}
        </Link>
      </aside>

      <Dialog
        id="portrait-dialog"
        className="portrait-dialog"
        labelledBy="portrait-title"
      >
        <h2 id="portrait-title">{"Le portrait de Plume"}</h2>
        <img
          src="/assets/cat-portrait.webp"
          alt="Portrait illustratif de Plume en grand"
          width="1536"
          height="1024"
        />
        <p>{"Illustration générée · Personnage de démonstration"}</p>
      </Dialog>
    </>
  );
}
