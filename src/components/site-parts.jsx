import Link from "next/link";
export function IconDefinitions() {
  return (
    <svg
      className="icon-definitions"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <symbol id="heart" viewBox="0 0 24 24">
          <path
            d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </symbol>

        <symbol id="paw" viewBox="0 0 24 24">
          <ellipse cx="5" cy="9" rx="2.5" ry="3.2"></ellipse>
          <ellipse cx="10" cy="5" rx="2.4" ry="3"></ellipse>
          <ellipse cx="16" cy="5" rx="2.4" ry="3"></ellipse>
          <ellipse cx="21" cy="10" rx="2.4" ry="3"></ellipse>
          <path d="M5.5 19c-1-3 2-5 3.5-7 2-3 5-3 7 0 1.5 2 4.5 4 3.5 7-1 4-4.5 1-7 1s-6 3-7-1Z"></path>
        </symbol>

        <symbol id="sun" viewBox="0 0 24 24">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"></path>
          </g>
        </symbol>
      </defs>
    </svg>
  );
}
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Âme Errante, accueil">
      <span className="brand-mark">
        <svg className="brand-heart" aria-hidden="true">
          <use href="#heart" />
        </svg>
        <svg className="brand-paw" aria-hidden="true">
          <use href="#paw" />
        </svg>
      </span>
      <span>
        <span className="brand-name">{"ÂME ERRANTE"}</span>
        <span className="brand-caption">
          {"Association de protection animale"}
        </span>
      </span>
    </Link>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-top">
        <div>
          <Link href="/" className="brand" aria-label="Âme Errante, accueil">
            <span className="brand-mark">
              <svg className="brand-heart" aria-hidden="true">
                <use href="#heart" />
              </svg>
              <svg className="brand-paw" aria-hidden="true">
                <use href="#paw" />
              </svg>
            </span>
            <span>
              <span className="brand-name">{"ÂME ERRANTE"}</span>
              <span className="brand-caption">
                {"Association de protection animale"}
              </span>
            </span>
          </Link>
          <p>
            {"Un peu de douceur."}
            <br />
            {"Beaucoup d’amour. Une seconde chance."}
          </p>
        </div>
        <div>
          <span className="footer-title">{"Une belle rencontre"}</span>
          <Link href="/animaux">{"Nos compagnons"}</Link>
          <Link href="/adopter">{"Le parcours d’adoption"}</Link>
          <Link href="/blog">{"Nos conseils"}</Link>
        </div>
        <div>
          <span className="footer-title">{"Écrire la suite, ensemble"}</span>
          <Link href="/nous-aider">{"Soutenir notre mission"}</Link>
          <Link href="/contact?subject=Devenir%20b%C3%A9n%C3%A9vole">
            {"Devenir bénévole"}
          </Link>
          <Link href="/contact">{"Nous contacter"}</Link>
        </div>
        <span className="footer-heart" aria-hidden="true">
          {"♡"}
        </span>
      </div>
      <div className="shell footer-bottom">
        <span>{"Âme Errante · Chaque âme mérite un foyer."}</span>
        <span>{"Site de démonstration"}</span>
      </div>
    </footer>
  );
}
