import { notFound } from "next/navigation";
import { publicDocuments } from "@ames/core/publications.mjs";
import { PageFrame } from "../../../components/page-frame";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [d] = await publicDocuments(slug);
  return { title: d ? `${d.title} — Âmes errantes` : "Document introuvable" };
}
export default async function PublishedDocument({ params }) {
  const { slug } = await params;
  const [doc] = await publicDocuments(slug);
  if (!doc) notFound();
  return (
    <PageFrame
      page={{
        slug: "projet",
        label: doc.title,
        parent: ["projet", "Le projet"],
      }}
    >
      <article className="reading-page shell">
        <span className="eyebrow">LE PROJET DU REFUGE</span>
        <h1>{doc.title}</h1>
        <div
          className="published-document"
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </article>
    </PageFrame>
  );
}
