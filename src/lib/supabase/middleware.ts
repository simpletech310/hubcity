import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/admin", "/verify-address"];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
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

  // Public routes — allow browsing without login
  // Only redirect to login for protected routes (profile, admin, verify-address)
  if (!user && !isAuthRoute && isProtectedRoute(pathname)) {
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

  // Check profile for verification and role (only for authenticated users on protected routes)
  if (user && isProtectedRoute(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status, role, is_suspended")
      .eq("id", user.id)
      .single();

    // Skip verification check if profile doesn't exist yet (new user)
    if (profile) {
      // Suspended users can only see a suspended page or log out
      if (profile.is_suspended && !pathname.startsWith("/suspended")) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/suspended";
        return NextResponse.redirect(redirectUrl);
      }

      if (profile.verification_status === "unverified" && !isVerifyRoute && !isAdminRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/verify-address";
        return NextResponse.redirect(redirectUrl);
      }

      if (
        isAdminRoute &&
        profile.role !== "admin" &&
        profile.role !== "city_official"
      ) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
