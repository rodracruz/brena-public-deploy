const test = require("node:test");
const assert = require("node:assert/strict");

async function loadWorker() {
  return (await import(`../cloudflare/worker.mjs?test=${Date.now()}-${Math.random()}`)).default;
}

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

  const response = await worker.fetch(new Request("https://brena.cl/api/leads?source=public", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.20",
    },
    body: JSON.stringify({ technical: true }),
  }));

  assert.equal(forwardedRequest.url, "https://brena-public-deploy.onrender.com/api/leads?source=public");
  assert.equal(forwardedRequest.method, "POST");
  assert.equal(forwardedRequest.headers.get("x-forwarded-host"), "brena.cl");
  assert.equal(forwardedRequest.headers.get("x-forwarded-proto"), "https");
  assert.equal(forwardedRequest.headers.get("x-forwarded-for"), "203.0.113.20");
  assert.deepEqual(await forwardedRequest.json(), { technical: true });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://brena.cl/gracias?ok=1");
});
