import Link from "next/link";
import { publicDocuments } from "@ames/core/publications.mjs";
import { PageFrame } from "../../components/page-frame";
export const dynamic = "force-dynamic";
export const metadata = { title: "Le projet du refuge — Âmes errantes" };
export default async function ProjectPage() {
  const docs = await publicDocuments();
  return (
    <PageFrame page={{ slug: "projet", label: "Le projet du refuge" }}>
      <article className="reading-page shell">
        <span className="eyebrow">CONSTRUIRE LA SUITE</span>
        <h1>Le projet du refuge</h1>
        <p>Les documents que l’équipe a choisi de partager.</p>
        {docs.length ? (
          <div className="published-list">
            {docs.map((d) => (
              <Link key={d.slug} href={`/projet/${d.slug}`}>
                <h2>{d.title}</h2>
                <span>Lire le document →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>Nous préparons les premiers documents à partager ici.</p>
        )}
      </article>
    </PageFrame>
  );
}
