import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { VERIFIED_ONLY_PREFIXES } from "@/lib/access";

// Routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/admin", "/verify-address"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isVerifiedOnlyRoute(pathname: string): boolean {
  return VERIFIED_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, pass through
  if (!url || !url.startsWith("http") || !key || key === "your-supabase-anon-key") {
    return supabaseResponse;
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

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isAdminRoute = pathname.startsWith("/admin");
  const isVerifyRoute = pathname.startsWith("/verify-address");
  const isVerifiedOnly = isVerifiedOnlyRoute(pathname);

  // Unauthenticated access to verified-only routes → send to login, then
  // onward to /verify-address after sign-in.
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

  // Check profile for verification and role (authenticated users on protected
  // or verified-only routes).
  if (user && (isProtectedRoute(pathname) || isVerifiedOnly)) {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("verification_status, role, is_suspended")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Middleware Profile Fetch Error:", profileError);
        // Fallback: allow the request to proceed if the query fails due to schema issues
        // Unless it's a critical path like /admin or a verified-only overlay.
        if (isAdminRoute || isVerifiedOnly) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/";
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Skip verification check if profile doesn't exist yet (new user) or if there was an error
      if (profile) {
        // Suspended users can only see a suspended page or log out
        if (profile.is_suspended && !pathname.startsWith("/suspended")) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/suspended";
          return NextResponse.redirect(redirectUrl);
        }

        const isUnverified = profile.verification_status === "unverified";

        // Verified-only overlay routes: unverified users get bounced to
        // /verify-address with a next= hint so we can return them after.
        if (isUnverified && isVerifiedOnly) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/verify-address";
          redirectUrl.searchParams.set("next", pathname);
          return NextResponse.redirect(redirectUrl);
        }

        if (isUnverified && !isVerifyRoute && !isAdminRoute && isProtectedRoute(pathname)) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/verify-address";
          return NextResponse.redirect(redirectUrl);
        }

        if (
          isAdminRoute &&
          profile.role !== "admin" &&
          profile.role !== "city_official" &&
          profile.role !== "city_ambassador"
        ) {
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
