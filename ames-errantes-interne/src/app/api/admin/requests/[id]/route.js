import { updateRequest, deleteRequest } from "@ames/core/site/repository.mjs";
import { record } from "@ames/core/site/validation.mjs";
import {
  body,
  endpoint,
  json,
  requireAdmin,
  sameOrigin,
} from "../../../../../server/admin-http.js";
export const runtime = "nodejs";
export const PATCH = endpoint(async (request, { params }) => {
  const admin = await requireAdmin(request);
  const { id } = await params;
  await updateRequest(
    id,
    record(await body(request)),
    undefined,
    admin.username,
  );
  return json({
    ok: true,
  });
});
export const DELETE = endpoint(async (request, { params }) => {
  await requireAdmin(request);
  sameOrigin(request);
  const { id } = await params;
  await deleteRequest(id);
  return json({
    ok: true,
  });
});
