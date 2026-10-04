import { listRequests } from "@ames/core/site/repository.mjs";
import { endpoint, json, requireAdmin } from "../../../../server/admin-http.js";
export const runtime = "nodejs";
export const GET = endpoint(async (request) => {
  await requireAdmin(request);
  return json({
    requests: await listRequests(),
  });
});
