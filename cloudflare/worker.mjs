const ORIGIN = new URL("https://brena-public-deploy.onrender.com");
const CANONICAL_ORIGIN = "https://brena.cl";
const HSTS = "max-age=15552000";
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

function canonicalRedirect(incomingUrl) {
  const target = new URL(CANONICAL_ORIGIN);
  target.pathname = incomingUrl.pathname === "/index.html" ? "/" : incomingUrl.pathname;
  target.search = safeAttributionSearch(incomingUrl.searchParams);
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
    const isNavigation = method === "GET" || method === "HEAD";
    const safeSearch = safeAttributionSearch(incomingUrl.searchParams);
    const needsCanonicalRedirect = incomingUrl.protocol !== "https:"
      || incomingUrl.hostname !== "brena.cl"
      || incomingUrl.pathname === "/index.html"
      || (isNavigation && incomingUrl.search !== safeSearch);

    if (needsCanonicalRedirect) {
      const headers = new Headers({
        location: canonicalRedirect(incomingUrl).toString(),
        "cache-control": "public, max-age=3600",
      });
      withHttpsSecurity(headers, incomingUrl);
      return new Response(null, {
        status: 308,
        headers,
      });
    }

    const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, ORIGIN);
    const headers = new Headers(request.headers);
    const clientIp = headers.get("cf-connecting-ip");

    headers.delete("host");
    headers.delete("content-length");
    if (clientIp) headers.set("x-forwarded-for", clientIp);
    else headers.delete("x-forwarded-for");
    headers.set("x-forwarded-host", incomingUrl.host);
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
