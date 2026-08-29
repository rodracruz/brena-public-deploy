const ORIGIN = new URL("https://brena-public-deploy.onrender.com");
const CANONICAL_ORIGIN = "https://brena.cl";
const CANONICAL_HOST = "brena.cl";
const HSTS = "max-age=15552000";
export const CANONICAL_PAGE_PATHS = Object.freeze([
  "/",
  "/vender-propiedad-rapido",
  "/vender-propiedad-con-deudas",
  "/vender-propiedad-en-mal-estado",
]);
export const PAGE_ALIAS_PATHS = new Map([
  ["/index.html", "/"],
  ["/vender-propiedad-rapido.html", "/vender-propiedad-rapido"],
  ["/vender-propiedad-rapido/", "/vender-propiedad-rapido"],
  ["/vender-propiedad-con-deudas.html", "/vender-propiedad-con-deudas"],
  ["/vender-propiedad-con-deudas/", "/vender-propiedad-con-deudas"],
  ["/vender-propiedad-en-mal-estado.html", "/vender-propiedad-en-mal-estado"],
  ["/vender-propiedad-en-mal-estado/", "/vender-propiedad-en-mal-estado"],
]);
const QUERY_PRESERVING_EXTENSIONS = new Set([
  ".css",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".png",
  ".svg",
  ".txt",
  ".webp",
  ".xml",
]);
const ATTRIBUTION_KEYS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

function safeAttributionSearch(searchParams) {
  const safe = new URLSearchParams();
  for (const key of ATTRIBUTION_KEYS) {
    const value = searchParams.get(key)?.trim().slice(0, 120);
    if (value) safe.set(key, value);
  }
  const query = safe.toString();
  return query ? `?${query}` : "";
}

function preservesFunctionalQuery(pathname) {
  if (pathname === "/healthcheck") return true;
  const lastSegment = pathname.split("/").pop() || "";
  const dot = lastSegment.lastIndexOf(".");
  return dot >= 0 && QUERY_PRESERVING_EXTENSIONS.has(lastSegment.slice(dot).toLowerCase());
}

function publicQuery(incomingUrl, method) {
  if (incomingUrl.pathname === "/api/leads") return "";
  if (["GET", "HEAD"].includes(method) && !preservesFunctionalQuery(incomingUrl.pathname)) {
    return safeAttributionSearch(incomingUrl.searchParams);
  }
  return incomingUrl.search;
}

function canonicalRedirect(incomingUrl, method) {
  const target = new URL(CANONICAL_ORIGIN);
  target.pathname = PAGE_ALIAS_PATHS.get(incomingUrl.pathname) || incomingUrl.pathname;
  target.search = publicQuery(incomingUrl, method);
  return target;
}

function withHttpsSecurity(headers, incomingUrl) {
  if (incomingUrl.protocol === "https:") headers.set("strict-transport-security", HSTS);
  else headers.delete("strict-transport-security");
}

function rewriteOriginLocation(headers) {
  const location = headers.get("location");
  if (!location) return;

  const target = new URL(location, ORIGIN);
  if (target.origin !== ORIGIN.origin) return;

  headers.set("location", `${CANONICAL_ORIGIN}${target.pathname}${target.search}${target.hash}`);
}

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const method = request.method.toUpperCase();
    const normalizesNavigationQuery = ["GET", "HEAD"].includes(method)
      && !preservesFunctionalQuery(incomingUrl.pathname);
    const expectedQuery = publicQuery(incomingUrl, method);
    const needsCanonicalRedirect = incomingUrl.origin !== CANONICAL_ORIGIN
      || PAGE_ALIAS_PATHS.has(incomingUrl.pathname)
      || (normalizesNavigationQuery && incomingUrl.search !== expectedQuery);

    if (needsCanonicalRedirect) {
      const headers = new Headers({
        location: canonicalRedirect(incomingUrl, method).toString(),
        "cache-control": "public, max-age=3600",
      });
      withHttpsSecurity(headers, incomingUrl);
      return new Response(null, {
        status: 308,
        headers,
      });
    }

    const upstreamUrl = new URL(incomingUrl.pathname, ORIGIN);
    upstreamUrl.search = expectedQuery;
    const headers = new Headers(request.headers);
    const clientIp = headers.get("cf-connecting-ip");

    headers.delete("host");
    headers.delete("content-length");
    if (clientIp) headers.set("x-forwarded-for", clientIp);
    else headers.delete("x-forwarded-for");
    headers.set("x-forwarded-host", CANONICAL_HOST);
    headers.set("x-forwarded-proto", "https");

    const body = method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();
    const upstreamResponse = await fetch(new Request(upstreamUrl, {
      method,
      headers,
      body,
      redirect: "manual",
    }));

    const responseHeaders = new Headers(upstreamResponse.headers);
    rewriteOriginLocation(responseHeaders);
    withHttpsSecurity(responseHeaders, incomingUrl);
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
