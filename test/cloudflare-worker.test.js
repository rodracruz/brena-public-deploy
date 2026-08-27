const test = require("node:test");
const assert = require("node:assert/strict");

async function loadWorker() {
  return (await import(`../cloudflare/worker.mjs?test=${Date.now()}-${Math.random()}`)).default;
}

test("the Cloudflare worker redirects www to the canonical domain", async () => {
  const worker = await loadWorker();
  const response = await worker.fetch(new Request("https://www.brena.cl/contacto?via=web"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://brena.cl/contacto?via=web");
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
