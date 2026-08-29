const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { once } = require("node:events");

const { createServer } = require("../src/server");
const { createRateLimiter } = require("../src/rate-limiter");

const publicDir = path.join(__dirname, "..", "frontend", "public");

const validLead = {
  name: "María Pérez",
  phone: "+56912345678",
  email: "maria@example.cl",
  region: "metropolitana",
  commune: "Ñuñoa",
  propertyType: "casa",
  situation: "herencia",
  urgency: "proximo_mes",
  message: "Quiero conversar.",
  consent: true,
  website: "",
};

async function withServer(options, run) {
  const server = createServer({
    publicDir,
    logger: { info() {}, error() {} },
    brenaClient: { submit: async () => ({ accepted: true, id: "lead-test", preview: true }) },
    leadArchive: { save: async () => {} },
    ...options,
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("serves a minimal healthcheck without caching it", async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthcheck`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

test("serves the lead workbook only with the configured bearer token", async (t) => {
  const directory = await require("node:fs/promises").mkdtemp(path.join(require("node:os").tmpdir(), "brena-export-"));
  t.after(() => require("node:fs/promises").rm(directory, { recursive: true, force: true }));
  const workbookPath = path.join(directory, "Leads-Brena.xlsx");
  const workbookBytes = Buffer.from("PK\u0003\u0004brena-workbook");
  await require("node:fs/promises").writeFile(workbookPath, workbookBytes);

  await withServer({
    adminExport: {
      token: "test-export-token-with-at-least-32-characters",
      workbookPath,
    },
  }, async (baseUrl) => {
    const unauthorized = await fetch(`${baseUrl}/admin/leads.xlsx`);
    assert.equal(unauthorized.status, 401);
    assert.equal(unauthorized.headers.get("www-authenticate"), "Bearer");

    const authorized = await fetch(`${baseUrl}/admin/leads.xlsx`, {
      headers: { authorization: "Bearer test-export-token-with-at-least-32-characters" },
    });
    assert.equal(authorized.status, 200);
    assert.equal(
      authorized.headers.get("content-type"),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    assert.equal(authorized.headers.get("cache-control"), "no-store");
    assert.match(authorized.headers.get("content-disposition"), /attachment; filename="Leads-Brena.xlsx"/);
    assert.deepEqual(Buffer.from(await authorized.arrayBuffer()), workbookBytes);
  });
});

test("does not expose an admin export route when it is not configured", async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/admin/leads.xlsx`, {
      headers: { authorization: "Bearer any-token" },
    });
    assert.equal(response.status, 404);
  });
});

test("serves the website and static assets with browser security headers", async () => {
  await withServer({}, async (baseUrl) => {
    const page = await fetch(`${baseUrl}/`);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /^text\/html/);
    assert.match(page.headers.get("content-security-policy"), /default-src 'self'/);
    assert.equal(page.headers.get("x-content-type-options"), "nosniff");
    assert.equal(page.headers.get("x-frame-options"), "DENY");
    assert.equal(page.headers.get("referrer-policy"), "strict-origin");
    assert.match(html, /<title>Brena \| Soluciones para propiedades complejas<\/title>/);
    assert.match(html, /<main id="contenido">/);
    assert.match(html, /<form[^>]+id="lead-form"/);
    assert.match(html, /name="situation"/);
    assert.match(html, /name="consent"/);
    assert.match(html, /href="\/styles\.css\?v=2\.0\.1"/);
    assert.match(html, /src="\/analytics-config\.js"/);
    assert.match(html, /src="\/analytics\.js\?v=3\.0\.0"/);
    assert.match(html, /src="\/scripts\.js\?v=3\.0\.0"/);
    assert.match(html, /data-analytics-cta-id="hero_form"/);
    assert.equal(html.includes("fonts.googleapis.com"), false);
    assert.equal(html.includes("NO esperes a quedar marcado en DICOM"), false);

    const css = await fetch(`${baseUrl}/styles.css`);
    assert.equal(css.status, 200);
    assert.match(css.headers.get("content-type"), /^text\/css/);
    assert.equal(css.headers.get("cache-control"), "no-cache");
  });
});

test("serves disabled analytics runtime configuration without opening CSP", async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analytics-config.js`);
    const body = await response.text();
    const csp = response.headers.get("content-security-policy");

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^text\/javascript/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(
      body,
      'window.__BRENA_ANALYTICS_CONFIG__ = Object.freeze({"enabled":false,"provider":"none","measurementId":""});\n',
    );
    assert.equal(csp.includes("googletagmanager.com"), false);
    assert.equal(csp.includes("google-analytics.com"), false);
  });
});

test("exposes only a validated public GA4 ID and minimally extends CSP when enabled", async () => {
  await withServer({
    analyticsConfig: {
      enabled: true,
      provider: "ga4",
      measurementId: "G-ABC1234567",
      attributionAllowlist: {
        utm_source: ["google"],
        utm_medium: ["cpc"],
        utm_campaign: [],
        utm_content: [],
        utm_term: [],
      },
    },
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analytics-config.js`);
    const body = await response.text();
    const csp = response.headers.get("content-security-policy");

    assert.equal(response.status, 200);
    assert.equal(
      body,
      'window.__BRENA_ANALYTICS_CONFIG__ = Object.freeze({"enabled":true,"provider":"ga4","measurementId":"G-ABC1234567","attributionAllowlist":{"utm_source":["google"],"utm_medium":["cpc"],"utm_campaign":[],"utm_content":[],"utm_term":[]}});\n',
    );
    assert.match(csp, /script-src 'self' https:\/\/www\.googletagmanager\.com/);
    assert.match(csp, /connect-src 'self' https:\/\/www\.google-analytics\.com https:\/\/region1\.google-analytics\.com/);
    assert.equal(csp.includes("*"), false);
    assert.equal(csp.includes("unsafe-eval"), false);
  });
});

test("rejects traversal attempts instead of reading outside the public directory", async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/..%2F..%2Fpackage.json`);
    assert.equal(response.status, 404);
  });
});

test("validates and forwards a public lead", async () => {
  let forwarded;
  let archived;
  await withServer({
    brenaClient: {
      submit: async (payload) => {
        forwarded = payload;
        return { accepted: true, id: "lead-456", preview: false };
      },
    },
    leadArchive: {
      save: async (record) => {
        archived = record;
      },
    },
    now: () => new Date("2026-08-26T13:45:00.000Z"),
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validLead),
    });
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {
      ok: true,
      submissionId: "lead-456",
      preview: false,
      message: "Recibimos tus datos. El equipo Brena revisará tu caso.",
    });
    assert.equal(forwarded.nombre_propietario, "María Pérez");
    assert.equal(forwarded.fecha_ingreso, "2026-08-26");
    assert.equal(forwarded.source, "web_publica");
    assert.equal(archived.submissionId, "lead-456");
    assert.equal(archived.receivedAt, "2026-08-26T13:45:00.000Z");
    assert.equal(archived.lead.nombre_propietario, "María Pérez");
  });
});

test("does not claim success when the local archive cannot be updated", async () => {
  await withServer({
    leadArchive: {
      save: async () => {
        throw new Error("workbook locked");
      },
    },
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validLead),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
      ok: false,
      message: "No pudimos recibir tus datos en este momento. Intenta nuevamente.",
    });
  });
});

test("returns field errors for an invalid lead", async () => {
  await withServer({}, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ consent: false }),
    });
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.equal(body.errors.name, "Escribe tu nombre.");
    assert.equal(body.errors.consent, "Necesitamos tu autorización para contactarte.");
  });
});

test("silently accepts honeypot spam without forwarding it", async () => {
  let calls = 0;
  await withServer({
    brenaClient: { submit: async () => { calls += 1; } },
  }, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validLead, website: "bot.example" }),
    });
    assert.equal(response.status, 202);
    assert.equal(calls, 0);
  });
});

test("rejects unsupported media and oversized payloads", async () => {
  await withServer({}, async (baseUrl) => {
    const unsupported = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "hello",
    });
    assert.equal(unsupported.status, 415);

    const oversized = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "x".repeat(17_000) }),
    });
    assert.equal(oversized.status, 413);
  });
});

test("rate limits repeated submissions by client address", async () => {
  await withServer({
    rateLimiter: createRateLimiter({ windowMs: 60_000, max: 1 }),
  }, async (baseUrl) => {
    const first = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validLead),
    });
    const second = await fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validLead),
    });
    assert.equal(first.status, 202);
    assert.equal(second.status, 429);
    assert.equal(second.headers.get("retry-after"), "60");
  });
});

test("uses Cloudflare client addresses for independent trusted-proxy rate limits", async () => {
  await withServer({
    trustProxy: true,
    rateLimiter: createRateLimiter({ windowMs: 60_000, max: 1 }),
  }, async (baseUrl) => {
    const submitFrom = (address) => fetch(`${baseUrl}/api/leads`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": address,
        "x-forwarded-for": "198.51.100.10",
      },
      body: JSON.stringify(validLead),
    });

    const first = await submitFrom("203.0.113.1");
    const second = await submitFrom("203.0.113.2");
    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
  });
});
