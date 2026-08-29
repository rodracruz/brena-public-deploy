"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { once } = require("node:events");

const { createServer } = require("../src/server");

const publicDir = path.join(__dirname, "..", "frontend", "public");

async function withServer(run) {
  const server = createServer({
    publicDir,
    trustProxy: true,
    logger: { info() {}, warn() {}, error() {} },
    brenaClient: { submit: async () => ({ accepted: true, id: "lead-seo", preview: true }) },
    leadArchive: { save: async () => ({ workbookUpdated: true }) },
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const edgeHeaders = Object.freeze({
  host: "brena-public-deploy.onrender.com",
  "x-forwarded-host": "brena.cl",
  "x-forwarded-proto": "https",
});

test("the canonical host serves the homepage with HTTPS-only security headers", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`, { headers: edgeHeaders, redirect: "manual" });
    const csp = response.headers.get("content-security-policy");

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("strict-transport-security"), "max-age=15552000");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin");
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /form-action 'self'/);
    assert.equal(csp.includes("*"), false);
    assert.equal(csp.includes("unsafe-eval"), false);
    assert.equal(csp.includes("google-analytics.com"), false);
    assert.equal(csp.includes("googletagmanager.com"), false);
  });
});

test("the origin redirects public documents but leaves technical health traffic available", async () => {
  await withServer(async (baseUrl) => {
    const directOrigin = await fetch(
      `${baseUrl}/?utm_source=manual&email=persona%40example.cl&phone=%2B56912345678`,
      {
        headers: {
          host: "brena-public-deploy.onrender.com",
          "x-forwarded-proto": "https",
        },
        redirect: "manual",
      },
    );
    const healthcheck = await fetch(`${baseUrl}/healthcheck`, {
      headers: { host: "brena-public-deploy.onrender.com" },
      redirect: "manual",
    });

    assert.equal(directOrigin.status, 308);
    assert.equal(directOrigin.headers.get("location"), "https://brena.cl/?utm_source=manual");
    assert.equal(directOrigin.headers.get("strict-transport-security"), "max-age=15552000");
    assert.equal(healthcheck.status, 200);
  });
});

test("the origin removes index.html in one redirect and does not emit HSTS over HTTP", async () => {
  await withServer(async (baseUrl) => {
    const canonicalIndex = await fetch(
      `${baseUrl}/index.html?utm_medium=email&address=Los%20Aromos%20123`,
      { headers: edgeHeaders, redirect: "manual" },
    );
    const plainHttp = await fetch(`${baseUrl}/`, {
      headers: {
        host: "brena-public-deploy.onrender.com",
        "x-forwarded-host": "brena.cl",
        "x-forwarded-proto": "http",
      },
      redirect: "manual",
    });

    assert.equal(canonicalIndex.status, 308);
    assert.equal(canonicalIndex.headers.get("location"), "https://brena.cl/?utm_medium=email");
    assert.equal(canonicalIndex.headers.get("strict-transport-security"), "max-age=15552000");
    assert.equal(plainHttp.status, 200);
    assert.equal(plainHttp.headers.get("strict-transport-security"), null);
  });
});
