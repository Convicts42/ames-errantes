import { readPhoto } from "@ames/core/site/media.mjs";
import { endpoint, requireUser } from "../../../server/http.mjs";
export const runtime = "nodejs";
export const GET = endpoint(async (request, { params }) => {
  await requireUser(request);
  const { id } = await params;
  const bytes = await readPhoto(id, true);
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
