const ORIGIN = new URL("https://brena-public-deploy.onrender.com");
const CANONICAL_ORIGIN = "https://brena.cl";

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
    if (incomingUrl.hostname === "www.brena.cl") {
      return new Response(null, {
        status: 301,
        headers: {
          location: `${CANONICAL_ORIGIN}${incomingUrl.pathname}${incomingUrl.search}`,
          "cache-control": "public, max-age=3600",
        },
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

    const method = request.method.toUpperCase();
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
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
