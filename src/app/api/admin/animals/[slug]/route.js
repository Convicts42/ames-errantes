import { saveAnimal } from "@ames/core/site/repository.mjs";
import {
  body,
  endpoint,
  json,
  requireAdmin,
} from "../../../../../server/admin-http.js";
export const runtime = "nodejs";
export const PUT = endpoint(async (request, { params }) => {
  await requireAdmin(request);
  const { slug } = await params;
  return json({
    animal: await saveAnimal(await body(request), slug),
  });
});
