import { redirect } from "next/navigation";

/**
 * Legacy per-city entry point. Browse pages no longer scope by city —
 * they show content from every city and let users filter. This route is
 * kept as a passthrough so existing QR codes / SMS links continue to work.
 */
type PageProps = {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ then?: string }>;
};

function safeThen(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw.split("#")[0];
}

export default async function CityLandingPage({ searchParams }: PageProps) {
  const { then } = await searchParams;
  redirect(safeThen(then));
}
