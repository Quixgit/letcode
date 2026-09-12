import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  API_BASE,
  accessCookieOptions,
  refreshCookieOptions,
  refreshTokens,
} from "@/lib/auth-cookies";

type Body = { kind: "none" } | { kind: "text"; value: string; contentType: string } | { kind: "form"; value: FormData };

async function readBody(req: NextRequest): Promise<Body> {
  if (req.method === "GET" || req.method === "HEAD") return { kind: "none" };

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return { kind: "form", value: await req.formData() };
  }
  return { kind: "text", value: await req.text(), contentType: contentType || "application/json" };
}

async function forward(
  targetUrl: string,
  method: string,
  body: Body,
  accessToken: string | undefined
) {
  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (body.kind === "text") headers["Content-Type"] = body.contentType;

  return fetch(targetUrl, {
    method,
    headers,
    body: body.kind === "none" ? undefined : body.value,
  });
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const targetUrl = `${API_BASE}/${path.join("/")}${req.nextUrl.search}`;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  const body = await readBody(req);

  let backendRes = await forward(targetUrl, req.method, body, accessToken);
  let newTokens: { access_token: string; refresh_token: string } | null = null;

  if (backendRes.status === 401 && refreshToken) {
    newTokens = await refreshTokens(refreshToken);
    if (newTokens) {
      backendRes = await forward(targetUrl, req.method, body, newTokens.access_token);
    }
  }

  const responseBody = await backendRes.text();
  const response = new NextResponse(backendRes.status === 204 ? null : responseBody, {
    status: backendRes.status,
    headers: {
      "Content-Type": backendRes.headers.get("content-type") || "application/json",
    },
  });

  if (newTokens) {
    response.cookies.set(ACCESS_COOKIE, newTokens.access_token, accessCookieOptions);
    response.cookies.set(REFRESH_COOKIE, newTokens.refresh_token, refreshCookieOptions);
  } else if (backendRes.status === 401) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
  }

  return response;
}

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
