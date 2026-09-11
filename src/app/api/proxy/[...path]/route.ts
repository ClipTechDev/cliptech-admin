import { NextResponse, type NextRequest } from "next/server";

import { stripCookieDomain } from "@/lib/cookies";
import { env } from "@/lib/env";

/**
 * Same-origin door to cliptech-api for the browser.
 *
 * The API authenticates admins with an HttpOnly cookie set on its own origin.
 * A direct cross-origin fetch from this app would need
 * `credentials: "include"` plus a third-party-cookie exemption the browser
 * increasingly won't grant, and the token can't move into JS without giving
 * up HttpOnly. Proxying sidesteps both: to the browser the cookie belongs to
 * this app's origin, and it never touches client code.
 *
 * `/api/proxy/admin/users?page=2` -> `${API_URL}/v1/admin/users?page=2`.
 *
 * Set-Cookie is relayed so login and logout work through here, with the
 * Domain attribute rewritten - see stripCookieDomain.
 */

// Bodies are streamed straight through, so anything the API accepts, this
// accepts - no Next-side body parsing or size ceiling of our own.
async function forward(request: NextRequest, path: string[]) {
  const target = `${env.serverApiUrl}/v1/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  // Only what the API actually reads. Copying the request's headers wholesale
  // would forward Host and the hop-by-hop set, which upstreams reject.
  for (const name of ["cookie", "content-type", "accept", "authorization"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
  });

  const contentType = upstream.headers.get("content-type");
  if (contentType) response.headers.set("content-type", contentType);

  // getSetCookie() keeps multiple cookies separate; the plain get() would
  // join them into one unparseable header.
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append("set-cookie", stripCookieDomain(cookie));
  }

  // CSV exports and anything else that arrives as an attachment.
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) response.headers.set("content-disposition", disposition);

  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;

// The session cookie makes every response admin-specific.
export const dynamic = "force-dynamic";
