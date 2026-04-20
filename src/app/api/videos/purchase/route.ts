import { NextResponse } from "next/server";

// Legacy PPV stub — superseded by /api/ppv/purchase. Kept as a soft alias so
// older clients (or feature-flagged paths) keep working without a redirect
// dance. Forwards the body and returns the same shape ({ url }).
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  // Forward to the new endpoint using the same incoming cookies for auth.
  const cookieHeader = request.headers.get("cookie") ?? "";

  const url = new URL("/api/ppv/purchase", request.url);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
