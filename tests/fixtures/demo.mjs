import { seedAnimals } from "../../packages/core/src/site/seed.mjs";
import { saveAnimal } from "../../packages/core/src/site/repository.mjs";
import {
  createDocument,
  updateDocument,
  saveTask,
} from "../../packages/core/src/workspace/store.mjs";

// Synthetic data only: no real account, document or private export.
const team = { name: "Équipe fictive" };

export async function seedDemo(db) {
  for (const animal of seedAnimals) await saveAnimal(animal, null, db);
  const documents = [];
  for (let i = 1; i <= 15; i++) {
    const draft = await createDocument(
      {
        title: `Dossier fictif ${i}`,
        category: "projet",
        status: "draft",
        html: "<p>Ancienne version fictive</p>",
      },
      team,
      db,
    );
    documents.push(
      await updateDocument(
        draft.id,
        { ...draft, html: `<p>Contenu fictif ${i} — à vérifier.</p>` },
        team,
        db,
      ),
    );
  }
  await saveTask(
    null,
    {
      title: "Point fictif à préparer",
      status: "pending",
      document_id: documents[0].id,
    },
    team,
    db,
  );
}
