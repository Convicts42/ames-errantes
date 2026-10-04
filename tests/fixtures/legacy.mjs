import { seedAnimals } from "../../packages/core/src/site/seed.mjs";

// Synthetic SQLite-shaped export. No real account, document or private export.
// Return a fresh object because rollback tests deliberately corrupt one record.
export function legacyFixture() {
  const documents = Array.from({ length: 15 }, (_, i) => ({
    id: `fixture-${i + 1}`,
    title: `Dossier fictif ${i + 1}`,
    category: "projet",
    status: "draft",
    html: `<p>Contenu fictif ${i + 1} — à vérifier.</p>`,
    search_text: `Contenu fictif ${i + 1}`,
    version: 2,
    updated_by: "Équipe fictive",
    source_id: `legacy-fixture-${i + 1}`,
    imported_markdown: `Contenu fictif ${i + 1}`,
  }));
  return {
    format: "ames-sqlite-migration-v1",
    site: {
      animals: seedAnimals.map((animal) => ({
        slug: animal.slug,
        content: JSON.stringify(animal),
        published: Number(animal.published),
        status: animal.status,
      })),
    },
    workspace: {
      users: [
        {
          id: "fixture-owner",
          username: "fixture-disabled",
          name: "Compte fictif désactivé",
          password_hash: "disabled-fixture",
          role: "owner",
          active: 0,
        },
      ],
      documents,
      revisions: documents.flatMap((doc, i) =>
        [1, 2].map((version) => ({
          id: i * 2 + version,
          document_id: doc.id,
          version,
          title: doc.title,
          category: doc.category,
          status: doc.status,
          html: version === 2 ? doc.html : "<p>Ancienne version fictive</p>",
          author: "Équipe fictive",
        })),
      ),
      tasks: [
        {
          id: "fixture-task",
          title: "Point fictif à préparer",
          status: "pending",
          document_id: documents[0].id,
          updated_by: "Équipe fictive",
        },
      ],
    },
  };
}
