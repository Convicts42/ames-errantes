import {
  endpoint,
  json,
  requireAdmin,
  sameOrigin,
  readBytes,
} from "../../../../server/admin-http.js";
import { savePhoto } from "@ames/core/site/media.mjs";
import { consumeLimit } from "@ames/core/site/repository.mjs";
export const runtime = "nodejs";
export const POST = endpoint(async (request) => {
  const admin = await requireAdmin(request);
  sameOrigin(request);
  await consumeLimit(`upload:${admin.id}`, 40, 3600000);
  return json(
    {
      url: await savePhoto(await readBytes(request, 8 * 1024 * 1024)),
    },
    201,
  );
});
