import { saveAnimal } from "../../../../../server/repository.mjs";
import { body, endpoint, json, requireAdmin } from "../../../../../server/http";
export const runtime = "nodejs";
export const PUT = endpoint(async (request, { params }) => {
  requireAdmin(request);
  const { slug } = await params;
  return json({ animal: saveAnimal(await body(request), slug) });
});
