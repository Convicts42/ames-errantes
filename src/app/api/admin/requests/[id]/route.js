import {
  updateRequest,
  deleteRequest,
} from "../../../../../server/repository.mjs";
import { record } from "../../../../../server/validation.mjs";
import {
  body,
  endpoint,
  json,
  requireAdmin,
  sameOrigin,
} from "../../../../../server/http";
export const runtime = "nodejs";
export const PATCH = endpoint(async (request, { params }) => {
  requireAdmin(request);
  const { id } = await params;
  updateRequest(id, record(await body(request)).status);
  return json({ ok: true });
});
export const DELETE = endpoint(async (request, { params }) => {
  requireAdmin(request);
  sameOrigin(request);
  const { id } = await params;
  deleteRequest(id);
  return json({ ok: true });
});
