import Link from "next/link";
export default function PageContent() {
  return (
    <>
      <article className="reading-page shell">
        <div className="reading-header">
          <span className="eyebrow">{"LE JOURNAL · 3 MIN DE LECTURE"}</span>
          <h1>
            {"Un nouveau foyer,"}
            <br />
            <em>{"en douceur."}</em>
          </h1>
          <p className="reading-intro">
            {
              "Un nouvel environnement représente beaucoup de découvertes. Un accueil calme et des repères réguliers laissent à votre compagnon la liberté de trouver sa place."
            }
          </p>
        </div>
        <div className="reading-photo">
          <img
            src="/assets/cat-portrait.webp"
            alt="Portrait illustratif d’un chat tigré et blanc près d’une fenêtre"
            width="1536"
            height="1024"
          />
        </div>
        <div className="reading-body">
          <section data-reveal="">
            <span className="reading-number">{"01"}</span>
            <div>
              <h2>{"Un petit coin rien qu’à lui."}</h2>
              <p>
                {
                  "Préparez un endroit calme où il peut se retirer. Il doit pouvoir s’y reposer sans être sollicité."
                }
              </p>
            </div>
          </section>
          <section data-reveal="">
            <span className="reading-number">{"02"}</span>
            <div>
              <h2>{"De la tranquillité pour commencer."}</h2>
              <p>
                {
                  "Limitez les visites au début. Laissez-le explorer et venir vers vous à son rythme, sans forcer le contact."
                }
              </p>
            </div>
          </section>
          <section data-reveal="">
            <span className="reading-number">{"03"}</span>
            <div>
              <h2>{"Des repères, jour après jour."}</h2>
              <p>
                {
                  "Gardez des horaires réguliers pour les repas et les moments partagés. Demandez quelles habitudes lui sont déjà familières."
                }
              </p>
            </div>
          </section>
          <section data-reveal="">
            <span className="reading-number">{"04"}</span>
            <div>
              <h2>{"Du temps pour la confiance."}</h2>
              <p>
                {
                  "Ne cherchez pas à tout faire dès le premier jour. Observez et laissez votre relation se construire progressivement."
                }
              </p>
            </div>
          </section>
          <blockquote>
            {"La plus belle des habitudes,"}
            <br />
            {"c’est d’apprendre à se connaître."}
          </blockquote>
          <Link className="button" href="/adopter">
            {"Préparer une adoption"}
          </Link>
          <Link className="text-link back-journal" href="/blog">
            {"Revenir au journal"}
          </Link>
        </div>
      </article>
    </>
  );
}
