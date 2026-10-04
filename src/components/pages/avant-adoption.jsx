import Link from "next/link";

export default function PageContent() {
  return (
    <>
      <article className="reading-page shell">
        <div className="reading-header">
          <span className="eyebrow">{"LE JOURNAL · 3 MIN DE LECTURE"}</span>
          <h1>
            {"Avant le coup de cœur,"}
            <br />
            <em>{"les bonnes questions."}</em>
          </h1>
          <p className="reading-intro">
            {
              "Une adoption engage toute la famille. Prenez un moment pour imaginer votre quotidien, avec ses joies, ses habitudes et ses contraintes."
            }
          </p>
        </div>
        <div className="reading-photo">
          <img
            src="/assets/dog-portrait.webp"
            alt="Portrait illustratif d’un golden retriever dans un jardin"
            width="1536"
            height="1024"
          />
        </div>
        <div className="reading-body">
          <section data-reveal="">
            <span className="reading-number">{"01"}</span>
            <div>
              <h2>{"Quelle présence au quotidien ?"}</h2>
              <p>
                {
                  "Quel temps pouvez-vous consacrer aux activités, à l’attention et aux besoins de votre compagnon, chaque jour ?"
                }
              </p>
            </div>
          </section>
          <section data-reveal="">
            <span className="reading-number">{"02"}</span>
            <div>
              <h2>{"Une décision partagée ?"}</h2>
              <p>
                {
                  "Tout le foyer est-il prêt à accueillir un animal ? Parlez des attentes de chacun et de l’organisation à prévoir."
                }
              </p>
            </div>
          </section>
          <section data-reveal="">
            <span className="reading-number">{"03"}</span>
            <div>
              <h2>{"Un environnement adapté ?"}</h2>
              <p>
                {
                  "Votre logement et votre rythme correspondent-ils à ses besoins ? Pensez au caractère de l’animal autant qu’à vos préférences."
                }
              </p>
            </div>
          </section>
          <section data-reveal="">
            <span className="reading-number">{"04"}</span>
            <div>
              <h2>{"Et les imprévus ?"}</h2>
              <p>
                {
                  "Prévoyez les dépenses courantes et une marge pour les imprévus. Identifiez aussi qui pourra prendre le relais pendant vos absences."
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
