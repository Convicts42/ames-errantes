import Link from "next/link";
export default function PageContent() {
  return (
    <>
      <div className="page-intro shell">
        <div>
          <span className="eyebrow">{"LE JOURNAL D’ÂME ERRANTE"}</span>
          <h1>
            {"Une belle vie ensemble,"}
            <br />
            <em>{"ça se prépare."}</em>
          </h1>
        </div>
        <p className="intro-copy">
          {
            "Des idées à lire au calme, des repères à garder et de petites attentions qui changent le quotidien."
          }
        </p>
      </div>
      <section className="shell journal" aria-label="Les articles">
        <div className="journal-grid">
          <article className="journal-card" data-reveal="">
            <Link
              href="/nouveau-foyer"
              className="journal-image"
              aria-label="Lire Un nouveau foyer, en douceur"
            >
              <img
                src="/assets/cat-portrait.webp"
                alt="Portrait illustratif d’un chat tigré et blanc près d’une fenêtre"
                width="1536"
                height="1024"
                loading="lazy"
              />
            </Link>
            <div className="journal-content">
              <span className="eyebrow">{"ACCUEILLIR · 3 MIN DE LECTURE"}</span>
              <h2>
                <Link href="/nouveau-foyer">
                  {"Un nouveau foyer,"}
                  <br />
                  <em>{"en douceur."}</em>
                </Link>
              </h2>
              <p>
                {
                  "Quelques repères simples pour laisser votre compagnon prendre ses marques à son rythme."
                }
              </p>
              <Link href="/nouveau-foyer" className="text-link">
                {"Prendre le temps de lire"}
              </Link>
            </div>
          </article>
          <article className="journal-card" data-reveal="">
            <Link
              href="/avant-adoption"
              className="journal-image"
              aria-label="Lire Les bonnes questions avant d’adopter"
            >
              <img
                src="/assets/dog-portrait.webp"
                alt="Portrait illustratif d’un golden retriever dans un jardin"
                width="1536"
                height="1024"
                loading="lazy"
              />
            </Link>
            <div className="journal-content">
              <span className="eyebrow">{"ADOPTER · 3 MIN DE LECTURE"}</span>
              <h2>
                <Link href="/avant-adoption">
                  {"Avant le coup de cœur,"}
                  <br />
                  <em>{"les bonnes questions."}</em>
                </Link>
              </h2>
              <p>
                {
                  "Temps, présence, organisation : penser au quotidien pour construire une relation qui dure."
                }
              </p>
              <Link href="/avant-adoption" className="text-link">
                {"Prendre le temps de lire"}
              </Link>
            </div>
          </article>
        </div>
      </section>
      <aside className="closing-cta shell" data-reveal="">
        <div>
          <h2>{"Une question vous accompagne ?"}</h2>
          <p>
            {
              "Vous pouvez préparer votre message et nous parler de votre projet."
            }
          </p>
        </div>
        <Link className="button" href="/contact">
          {"Préparer un message"}
        </Link>
      </aside>
    </>
  );
}
