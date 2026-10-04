import {
  endpoint,
  json,
  requireAdmin,
  sameOrigin,
  readBytes,
} from "../../../../server/http";
import { savePhoto } from "../../../../server/media.mjs";
import { consumeLimit } from "../../../../server/repository.mjs";
export const runtime = "nodejs";
export const POST = endpoint(async (request) => {
  const admin = requireAdmin(request);
  sameOrigin(request);
  consumeLimit(`upload:${admin.id}`, 40, 3600000);
  return json(
    { url: await savePhoto(await readBytes(request, 8 * 1024 * 1024)) },
    201,
  );
});
