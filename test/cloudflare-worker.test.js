const test = require("node:test");
const assert = require("node:assert/strict");

async function loadWorker() {
  return (await import(`../cloudflare/worker.mjs?test=${Date.now()}-${Math.random()}`)).default;
}

async function loadWorkerModule() {
  return import(`../cloudflare/worker.mjs?module=${Date.now()}-${Math.random()}`);
}

test("the Worker route tables match the four-page catalog", async () => {
  const { CANONICAL_PAGE_PATHS, PAGE_ALIAS_PATHS } = await loadWorkerModule();
  const { PAGES } = require("../src/public-pages/catalog");
  assert.deepEqual([...CANONICAL_PAGE_PATHS], PAGES.map(({ route }) => route));
  assert.deepEqual(Object.fromEntries(PAGE_ALIAS_PATHS), {
    "/index.html": "/",
    "/vender-propiedad-rapido.html": "/vender-propiedad-rapido",
    "/vender-propiedad-rapido/": "/vender-propiedad-rapido",
    "/vender-propiedad-con-deudas.html": "/vender-propiedad-con-deudas",
    "/vender-propiedad-con-deudas/": "/vender-propiedad-con-deudas",
    "/vender-propiedad-en-mal-estado.html": "/vender-propiedad-en-mal-estado",
    "/vender-propiedad-en-mal-estado/": "/vender-propiedad-en-mal-estado",
  });
});

test("the Worker canonicalizes commercial aliases in one safe redirect", async () => {
  const worker = await loadWorker();
  for (const input of [
    "http://www.brena.cl/vender-propiedad-rapido.html?utm_source=google&email=ana%40example.cl",
    "https://brena.cl/vender-propiedad-con-deudas/?utm_medium=cpc&phone=%2B56912345678",
    "http://brena.cl/vender-propiedad-en-mal-estado/?utm_campaign=campaign-sale-2026&name=Ana",
  ]) {
    const response = await worker.fetch(new Request(input));
    const source = new URL(input);
    const expectedPath = source.pathname.replace(/\.html$|\/$/g, "") || "/";
    const expectedQuery = [...source.searchParams].find(([key]) => key.startsWith("utm_"));
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), `https://brena.cl${expectedPath}?${expectedQuery[0]}=${encodeURIComponent(expectedQuery[1])}`);
    assert.equal(response.headers.get("strict-transport-security"), source.protocol === "https:" ? "max-age=15552000" : null);
  }
});

test("the Cloudflare worker redirects www to the canonical domain", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request(
    "https://www.brena.cl/contacto?utm_source=google&email=persona%40example.cl&via=web",
  ));

  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://brena.cl/contacto?utm_source=google");
  assert.equal(response.headers.get("strict-transport-security"), "max-age=15552000");
});

test("the Cloudflare worker redirects HTTP to one canonical HTTPS URL without HSTS", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request(
    "http://brena.cl/index.html?utm_campaign=venta&name=Ana&phone=%2B56912345678",
  ));

  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://brena.cl/?utm_campaign=venta");
  assert.equal(response.headers.get("strict-transport-security"), null);
});

test("the Cloudflare worker keeps the legacy success path but removes unsafe query data", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request(
    "http://brena.cl/success.html?utm_medium=email&address=Los%20Aromos%20123",
  ));

  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://brena.cl/success.html?utm_medium=email");
});

test("the Cloudflare worker proxies an already canonical request without a redirect loop", async (t) => {
  const worker = await loadWorker();
  const originalFetch = global.fetch;
  let forwardedRequest;
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async (request) => {
    forwardedRequest = request;
    return new Response("ok", { status: 200 });
  };

  const response = await worker.fetch(new Request("https://brena.cl/?utm_source=google"));

  assert.equal(response.status, 200);
  assert.equal(forwardedRequest.url, "https://brena-public-deploy.onrender.com/?utm_source=google");
  assert.equal(response.headers.get("strict-transport-security"), "max-age=15552000");
  assert.equal(response.headers.get("location"), null);
});

test("the Cloudflare worker preserves functional queries for assets and technical GET routes", async (t) => {
  const worker = await loadWorker();
  const originalFetch = global.fetch;
  const forwardedUrls = [];
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async (request) => {
    forwardedUrls.push(request.url);
    return new Response("ok", { status: 200 });
  };

  const asset = await worker.fetch(new Request("https://brena.cl/styles.css?v=2.0.1"));
  const healthcheck = await worker.fetch(new Request("https://brena.cl/healthcheck?probe=ready"));

  assert.equal(asset.status, 200);
  assert.equal(healthcheck.status, 200);
  assert.deepEqual(forwardedUrls, [
    "https://brena-public-deploy.onrender.com/styles.css?v=2.0.1",
    "https://brena-public-deploy.onrender.com/healthcheck?probe=ready",
  ]);
});

test("the Cloudflare worker redirects alternate HTTPS ports to the exact canonical origin", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("https://brena.cl:8443/"));

  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://brena.cl/");
});

test("the Cloudflare worker proxies requests to Render and rewrites origin redirects", async (t) => {
  const worker = await loadWorker();
  const originalFetch = global.fetch;
  let forwardedRequest;
  t.after(() => { global.fetch = originalFetch; });

  global.fetch = async (request) => {
    forwardedRequest = request;
    return new Response(null, {
      status: 302,
      headers: { location: "https://brena-public-deploy.onrender.com/gracias?ok=1" },
    });
  };

  const response = await worker.fetch(new Request(
    "https://brena.cl/api/leads?source=public&email=persona%40example.cl",
    {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.20",
    },
    body: JSON.stringify({ technical: true }),
    },
  ));

  assert.equal(forwardedRequest.url, "https://brena-public-deploy.onrender.com/api/leads");
  assert.equal(forwardedRequest.method, "POST");
  assert.equal(forwardedRequest.headers.get("x-forwarded-host"), "brena.cl");
  assert.equal(forwardedRequest.headers.get("x-forwarded-proto"), "https");
  assert.equal(forwardedRequest.headers.get("x-forwarded-for"), "203.0.113.20");
  assert.deepEqual(await forwardedRequest.json(), { technical: true });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://brena.cl/gracias?ok=1");
});
