import { listAnimals, saveAnimal } from "@ames/core/site/repository.mjs";
import {
  body,
  endpoint,
  json,
  requireAdmin,
} from "../../../../server/admin-http.js";
export const runtime = "nodejs";
export const GET = endpoint(async (request) => {
  await requireAdmin(request);
  return json({
    animals: await listAnimals({
      admin: true,
    }),
  });
});
export const POST = endpoint(async (request) => {
  await requireAdmin(request);
  return json(
    {
      animal: await saveAnimal(await body(request)),
    },
    201,
  );
});
