import { getDatabase } from "@ames/core/database.mjs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await getDatabase().query("SELECT 1");
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
