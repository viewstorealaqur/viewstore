// =============================================================================
// proxy.ts — Next.js Proxy (previously middleware.ts)
// Project: MobiGear WhatsApp Store
//
// Purpose:
//   1. Refresh the Supabase session cookie on every request so tokens
//      don't expire mid-session (required by @supabase/ssr).
//   2. Protect /admin routes: redirect unauthenticated visitors to /admin/login.
//   3. Redirect already-authenticated users away from /admin/login.
//
// SECURITY NOTE:
//   Proxy provides a convenient redirect for UX, but it does NOT replace
//   server-side authorization. Every admin Server Component, Server Action, and
//   Route Handler ALSO calls requireOwner() from lib/auth.ts to verify the
//   session independently. Proxy can be bypassed by direct API calls.
//
// Migration note: renamed from middleware.ts per Next.js 16 deprecation.
//   "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
//   See: https://nextjs.org/docs/messages/middleware-to-proxy
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Start with an unmodified response; we may add Set-Cookie headers below.
  let response = NextResponse.next({ request });

  // Build an SSR Supabase client that can read and refresh cookies.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // First apply cookies to the outgoing request (so the client reads them).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Re-create the response so Next.js keeps the updated cookies.
          response = NextResponse.next({ request });
          // Then copy all cookies to the response so the browser receives them.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: always call getUser() (not getSession()) — this validates the
  // token against the Supabase Auth server, not just the local cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  // Unauthenticated user tries to access /admin/** (except /admin/login)
  if (isAdminRoute && !isLoginPage && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("redirected", "1");
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visits /admin/login → send them to the dashboard
  if (isLoginPage && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/admin";
    dashboardUrl.searchParams.delete("redirected");
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  // Run proxy on all /admin routes. Exclude Next.js internals and static
  // assets so we don't unnecessarily call Supabase on every image request.
  matcher: ["/admin/:path*"],
};
