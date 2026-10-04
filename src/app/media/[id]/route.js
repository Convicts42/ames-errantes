import { readPhoto } from "../../../server/media.mjs";
import { getSession } from "../../../server/auth.mjs";
import { tokenFrom } from "../../../server/http";
export const runtime = "nodejs";
export async function GET(request, { params }) {
  const { id } = await params;
  const bytes = readPhoto(id, !!getSession(tokenFrom(request)));
  if (!bytes) return new Response(null, { status: 404 });
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
