import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME } from "@/lib/env";

export const LOGIN_PATH = "/login";

/**
 * Sends anonymous requests to the login page instead of letting them render a
 * shell that will only 401 a moment later.
 *
 * This checks that the session cookie is *present*, not that it is valid. It
 * deliberately does not verify the JWT: that needs cliptech-api's signing
 * secret, and copying a signing secret into a second service to duplicate a
 * check the API already performs on every request would widen the blast
 * radius of this app for no security gain. So this is routing, not
 * authorisation - the API remains the only thing that decides what an admin
 * may do, and a stale cookie still gets a 401 that the UI surfaces as an
 * expired session.
 *
 * There is no redirect in the other direction (cookie present -> away from
 * /login) for the same reason: with only presence to go on, a stale cookie
 * would bounce the admin off the one page that can fix it.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(ADMIN_COOKIE_NAME);

  if (hasSession || request.nextUrl.pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);

  // Carry where they were headed, so signing in resumes it. Only the path and
  // query survive - see safeNextPath in the login form, which is what
  // actually decides whether to honour this.
  const next = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (next && next !== "/") {
    loginUrl.searchParams.set("next", next);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Every page except:
     * - /api/proxy   the login POST itself goes through it, and the API is
     *                the right thing to answer 401 for everything else
     * - /_next/*     build output
     * - static files (any path with a file extension)
     */
    "/((?!api/proxy|_next/static|_next/image|.*\\.[^/]*$).*)",
  ],
};
