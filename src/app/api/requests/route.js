import { submitRequest } from "../../../server/repository.mjs";
import { body, endpoint, json } from "../../../server/http";
export const runtime = "nodejs";
export const POST = endpoint(async (request) => {
  const result = submitRequest(
    await body(request),
    request.headers.get("idempotency-key"),
  );
  return json(result, result.duplicate ? 200 : 201);
});
