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
    server.closeIdleConnections?.();
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

test("the homepage declares one exact canonical URL and matching Open Graph URL", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`, { headers: edgeHeaders });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<html lang="es-CL" data-page-type="homepage">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/brena\.cl\/">/);
    assert.match(html, /<meta property="og:url" content="https:\/\/brena\.cl\/">/);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
    assert.match(html, /<form id="lead-form" method="post" action="\/api\/leads" novalidate>/);
  });
});

test("commercial pages serve canonical extensionless routes and redirect aliases without PII", async () => {
  await withServer(async (baseUrl) => {
    for (const route of [
      "/vender-propiedad-rapido",
      "/vender-propiedad-con-deudas",
      "/vender-propiedad-en-mal-estado",
    ]) {
      const canonical = await fetch(`${baseUrl}${route}`, { headers: edgeHeaders, redirect: "manual" });
      const alias = await fetch(`${baseUrl}${route}.html?utm_source=manual&email=persona%40example.cl`, { headers: edgeHeaders, redirect: "manual" });
      const slash = await fetch(`${baseUrl}${route}/?utm_campaign=campaign-sale-2026&phone=%2B56912345678`, { headers: edgeHeaders, redirect: "manual" });
      assert.equal(canonical.status, 200, route);
      assert.match(await canonical.text(), new RegExp(`<link rel="canonical" href="https://brena\\.cl${route}">`));
      assert.equal(alias.status, 308);
      assert.equal(alias.headers.get("location"), `https://brena.cl${route}?utm_source=manual`);
      assert.equal(slash.status, 308);
      assert.equal(slash.headers.get("location"), `https://brena.cl${route}?utm_campaign=campaign-sale-2026`);
    }
  });
});

test("direct Render commercial documents redirect while technical routes remain available", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/vender-propiedad-rapido?utm_medium=cpc&name=Ana`, {
      headers: { host: "brena-public-deploy.onrender.com", "x-forwarded-proto": "https" },
      redirect: "manual",
    });
    assert.equal(response.status, 308);
    assert.equal(response.headers.get("location"), "https://brena.cl/vender-propiedad-rapido?utm_medium=cpc");
  });
});

test("robots allows the public site and references the canonical sitemap", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/robots.txt`, { headers: edgeHeaders });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/plain/);
    assert.match(body, /^User-agent: \*$/m);
    assert.match(body, /^Allow: \/$/m);
    assert.match(body, /^Sitemap: https:\/\/brena\.cl\/sitemap\.xml$/m);
    assert.doesNotMatch(body, /^Disallow: \/$/m);
  });
});

test("the sitemap contains exactly the four canonical indexable pages", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/sitemap.xml`, { headers: edgeHeaders });
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^application\/xml/);
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.deepEqual(locations, [
      "https://brena.cl/",
      "https://brena.cl/vender-propiedad-rapido",
      "https://brena.cl/vender-propiedad-con-deudas",
      "https://brena.cl/vender-propiedad-en-mal-estado",
    ]);
    assert.equal(xml.includes("index.html"), false);
    assert.equal(xml.includes("success.html"), false);
    assert.equal(xml.includes("<lastmod>"), false);
  });
});

test("the legacy success document stays functional but cannot be indexed", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/success.html`, { headers: edgeHeaders });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<html lang="es-CL">/);
    assert.match(html, /<meta name="robots" content="noindex, follow">/);
    assert.match(html, /src="\/brena\.png"/);
    assert.equal(html.includes("fonts.googleapis.com"), false);
    assert.equal(html.includes("rel=\"canonical\""), false);
  });
});

test("the disabled analytics bundle is delivered same-origin without relaxing CSP", async () => {
  await withServer(async (baseUrl) => {
    const [page, config, analytics, product] = await Promise.all([
      fetch(`${baseUrl}/`, { headers: edgeHeaders }),
      fetch(`${baseUrl}/analytics-config.js`, { headers: edgeHeaders }),
      fetch(`${baseUrl}/analytics.js?v=3.1.0`, { headers: edgeHeaders }),
      fetch(`${baseUrl}/scripts.js?v=3.1.0`, { headers: edgeHeaders }),
    ]);
    const html = await page.text();
    const configSource = await config.text();
    const csp = page.headers.get("content-security-policy");

    assert.equal(page.status, 200);
    assert.equal(config.status, 200);
    assert.equal(analytics.status, 200);
    assert.equal(product.status, 200);
    assert.equal(config.headers.get("cache-control"), "no-store");
    assert.equal(
      configSource,
      'window.__BRENA_ANALYTICS_CONFIG__ = Object.freeze({"enabled":false,"provider":"none","measurementId":""});\n',
    );
    assert.match(html, /<script src="\/analytics-config\.js" defer><\/script>/);
    assert.match(html, /<script src="\/analytics\.js\?v=3\.1\.0" defer><\/script>/);
    assert.match(html, /<script src="\/scripts\.js\?v=3\.1\.0" defer><\/script>/);
    assert.equal(csp.includes("googletagmanager.com"), false);
    assert.equal(csp.includes("google-analytics.com"), false);
    assert.equal(csp.includes("*"), false);
    assert.equal(csp.includes("unsafe-eval"), false);
  });
});
