import Link from "next/link";
import { PageFrame } from "../components/page-frame";

export default function NotFound() {
  return (
    <PageFrame page={{ slug: "404", label: "Page introuvable" }}>
      <section className="page-intro shell">
        <div>
          <span className="eyebrow">PAGE INTROUVABLE</span>
          <h1>
            Retrouvons
            <br />
            <em>notre chemin.</em>
          </h1>
        </div>
        <p>
          Cette page n’existe pas.{" "}
          <Link className="text-link" href="/">
            Revenir à l’accueil
          </Link>
        </p>
      </section>
    </PageFrame>
  );
}
