import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { VERIFIED_ONLY_PREFIXES } from "@/lib/access";
import { isEnabled, CIVIC_ROUTE_PREFIXES } from "@/lib/feature-flags";

// Routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/admin", "/dashboard", "/claim-your-city"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isVerifiedOnlyRoute(pathname: string): boolean {
  return VERIFIED_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isCivicRoute(pathname: string): boolean {
  return CIVIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, pass through
  if (!url || !url.startsWith("http") || !key || key === "your-supabase-anon-key") {
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;

  // Redirect legacy /verify-address → /claim-your-city (307 temporary)
  if (pathname.startsWith("/verify-address")) {
    const redirectUrl = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    redirectUrl.pathname = "/claim-your-city";
    redirectUrl.search = "";
    if (next) redirectUrl.searchParams.set("next", next);
    return NextResponse.redirect(redirectUrl, { status: 307 });
  }

  // Block civic routes when civic_enabled flag is off → 404
  if (!isEnabled("civic_enabled") && isCivicRoute(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isAdminRoute = pathname.startsWith("/admin");
  const isVerifiedOnly = isVerifiedOnlyRoute(pathname);

  // Unauthenticated access to protected or verified-only routes → login
  if (!user && !isAuthRoute && (isProtectedRoute(pathname) || isVerifiedOnly)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Logged in — redirect away from auth pages
  if (user && isAuthRoute) {
    const redirect = request.nextUrl.searchParams.get("redirect");
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = redirect || "/";
    redirectUrl.searchParams.delete("redirect");
    return NextResponse.redirect(redirectUrl);
  }

  // Check profile for role and suspension (authenticated users on protected routes).
  if (user && (isProtectedRoute(pathname) || isVerifiedOnly)) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("verification_status, role, is_suspended")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Middleware Profile Fetch Error:", profileError);
        if (isAdminRoute || isVerifiedOnly) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/";
          return NextResponse.redirect(redirectUrl);
        }
      }

      if (profile) {
        // Suspended users can only see the suspended page or log out
        if (profile.is_suspended && !pathname.startsWith("/suspended")) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/suspended";
          return NextResponse.redirect(redirectUrl);
        }

        // Admin route: only admin role allowed (city_official / city_ambassador deferred)
        if (isAdminRoute && profile.role !== "admin") {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/";
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (e) {
      console.error("Critical Middleware Error:", e);
    }
  }

  return supabaseResponse;
}
