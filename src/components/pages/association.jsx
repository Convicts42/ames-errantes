import Link from "next/link";
export default function PageContent() {
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">{"UNE HISTOIRE DE CŒUR"}</span>
          <h1>
            {"De l’errance"}
            <br />
            <em>{"à la confiance."}</em>
          </h1>
        </div>
        <p className="intro-copy">
          {
            "Il suffit parfois d’une rencontre pour changer toute une vie. Notre mission : faire de cette rencontre un nouveau départ."
          }
        </p>
      </div>
      <section className="mission-feature shell">
        <div className="mission-photo" data-reveal="">
          <img
            src="/assets/companions.webp"
            alt="Un chien et un chat reposent ensemble au soleil couchant"
            width="1672"
            height="941"
          />
          <span className="photo-caption">
            {"Ils méritent tous"}
            <br />
            {"leur place quelque part. ♡"}
          </span>
        </div>
        <div className="mission-story" data-reveal="">
          <span className="eyebrow">{"CE QUI NOUS ANIME"}</span>
          <h2>
            {"Du temps, de l’attention."}
            <br />
            <em>{"Et beaucoup d’humanité."}</em>
          </h2>
          <p>
            {
              "Offrir un foyer commence bien avant une adoption. C’est mettre à l’abri, écouter, comprendre et laisser la confiance revenir."
            }
          </p>
          <div className="values">
            <article>
              <span>{"01"}</span>
              <div>
                <h3>{"Protéger"}</h3>
                <p>
                  {
                    "De la sécurité et de la douceur pour les animaux qui en ont besoin."
                  }
                </p>
              </div>
            </article>
            <article>
              <span>{"02"}</span>
              <div>
                <h3>{"Accompagner"}</h3>
                <p>
                  {
                    "Préparer chaque rencontre en tenant compte de l’animal et de la famille."
                  }
                </p>
              </div>
            </article>
            <article>
              <span>{"03"}</span>
              <div>
                <h3>{"Réunir"}</h3>
                <p>
                  {
                    "Créer un lien durable, à travers un quotidien qui convient à chacun."
                  }
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
      <aside className="closing-cta shell" data-reveal="">
        <div>
          <h2>{"Une histoire qui s’écrit ensemble."}</h2>
          <p>
            {
              "Votre temps, votre accueil ou votre soutien peuvent y contribuer."
            }
          </p>
        </div>
        <Link className="button" href="/nous-aider">
          {"Trouver ma façon d’aider"}
        </Link>
      </aside>
    </>
  );
}
