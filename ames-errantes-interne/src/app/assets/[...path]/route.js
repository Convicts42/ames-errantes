export async function GET(request, { params }) {
  const { path } = await params;
  if (path.some((p) => p === ".." || !p))
    return new Response(null, { status: 404 });
  const response = await fetch(
    `${process.env.SITE_INTERNAL_URL || "http://site:3000"}/assets/${path.map(encodeURIComponent).join("/")}`,
  );
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
