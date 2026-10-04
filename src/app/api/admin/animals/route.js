import { listAnimals, saveAnimal } from "../../../../server/repository.mjs";
import { body, endpoint, json, requireAdmin } from "../../../../server/http";
export const runtime = "nodejs";
export const GET = endpoint((request) => {
  requireAdmin(request);
  return json({ animals: listAnimals({ admin: true }) });
});
export const POST = endpoint(async (request) => {
  requireAdmin(request);
  return json({ animal: saveAnimal(await body(request)) }, 201);
});
