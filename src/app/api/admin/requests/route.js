import { listRequests } from "../../../../server/repository.mjs";
import { endpoint, json, requireAdmin } from "../../../../server/http";
export const runtime = "nodejs";
export const GET = endpoint((request) => {
  requireAdmin(request);
  return json({ requests: listRequests() });
});
