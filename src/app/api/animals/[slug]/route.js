import { getAnimal } from "../../../../server/repository.mjs";
import { endpoint, json } from "../../../../server/http";
export const runtime = "nodejs";
export const GET = endpoint(async (_request, { params }) => {
  const { slug } = await params;
  const animal = getAnimal(slug);
  return animal
    ? json({ animal })
    : json({ error: "Compagnon introuvable." }, 404);
});
