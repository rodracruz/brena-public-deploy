"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ATTRIBUTION_STORAGE_KEY,
  bootstrapBrowserAnalytics,
  createAnalytics,
  createGa4Provider,
  resolveSessionAttribution,
  safeReferrerDomain,
} = require("../frontend/public/analytics.js");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); },
  };
}

test("disabled analytics validates safely without calling a provider", () => {
  const calls = [];
  const analytics = createAnalytics({
    enabled: false,
    provider: { track: (...args) => calls.push(args) },
    location: { pathname: "/", search: "?utm_source=google" },
    storage: memoryStorage(),
  });

  assert.equal(analytics.track("page_view", { page_type: "landing" }), false);
  assert.deepEqual(calls, []);
});

test("page views emit only safe context and last-touch session attribution", () => {
  const calls = [];
  const storage = memoryStorage();
  const analytics = createAnalytics({
    enabled: true,
    provider: { track: (eventName, payload) => calls.push({ eventName, payload }) },
    location: {
      pathname: "/",
      search: "?utm_source=google&utm_medium=cpc&utm_campaign=cmp_sale2026&email=ana%40example.cl&gclid=secret",
    },
    referrer: "https://www.google.com/search?q=deuda&email=ana%40example.cl#result",
    storage,
  });

  assert.equal(analytics.track("page_view", { page_type: "landing" }), true);
  assert.deepEqual(calls, [{
    eventName: "page_view",
    payload: {
      pathname: "/",
      page_type: "landing",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "cmp_sale2026",
      referrer_domain: "google.com",
    },
  }]);
  assert.deepEqual(JSON.parse(storage.snapshot()[ATTRIBUTION_STORAGE_KEY]), {
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "cmp_sale2026",
  });
});

test("last-touch replaces prior attribution only when the current URL has valid UTM", () => {
  const storage = memoryStorage({
    [ATTRIBUTION_STORAGE_KEY]: JSON.stringify({ utm_source: "newsletter", utm_campaign: "cmp_winter2026" }),
  });

  assert.deepEqual(resolveSessionAttribution("", storage), {
    utm_source: "newsletter",
    utm_campaign: "cmp_winter2026",
  });
  assert.deepEqual(resolveSessionAttribution("?utm_source=linkedin&utm_content=cnt_video01", storage), {
    utm_source: "linkedin",
    utm_content: "cnt_video01",
  });
  assert.deepEqual(JSON.parse(storage.snapshot()[ATTRIBUTION_STORAGE_KEY]), {
    utm_source: "linkedin",
    utm_content: "cnt_video01",
  });
});

test("unknown parameters, PII-like campaign values and contaminated storage are discarded", () => {
  const storage = memoryStorage({
    [ATTRIBUTION_STORAGE_KEY]: JSON.stringify({
      utm_source: "newsletter",
      email: "ana@example.cl",
    }),
  });

  assert.deepEqual(resolveSessionAttribution("", storage), {});
  assert.equal(storage.getItem(ATTRIBUTION_STORAGE_KEY), null);
  assert.deepEqual(resolveSessionAttribution(
    "?utm_source=ana%40example.cl&utm_medium=%2B56912345678&utm_campaign=12345678&utm_term=trm_home01&name=Ana",
    storage,
  ), { utm_term: "trm_home01" });
});

test("semantic PII-looking UTM values are rejected while approved campaign codes survive", () => {
  const storage = memoryStorage();
  assert.deepEqual(resolveSessionAttribution(
    "?utm_source=Maria&utm_medium=ana_silva&utm_campaign=Maria%20Perez&utm_content=Los_Aromos_123&utm_term=ana.silva",
    storage,
  ), {});
  assert.equal(storage.getItem(ATTRIBUTION_STORAGE_KEY), null);

  assert.deepEqual(resolveSessionAttribution(
    "?utm_source=google&utm_medium=cpc&utm_campaign=cmp_sale2026&utm_content=cnt_video01&utm_term=trm_home01",
    storage,
  ), {
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "cmp_sale2026",
    utm_content: "cnt_video01",
    utm_term: "trm_home01",
  });
});

test("referrer is reduced to a hostname and rejects unsafe protocols", () => {
  assert.equal(
    safeReferrerDomain("https://ana:secret@WWW.Instagram.com:443/campana?phone=56912345678#perfil"),
    "instagram.com",
  );
  assert.equal(safeReferrerDomain("javascript:alert(document.cookie)"), "");
  assert.equal(safeReferrerDomain("not a url"), "");
});

test("event schemas reject unknown events, unknown keys and direct PII fields", () => {
  const calls = [];
  const analytics = createAnalytics({
    enabled: true,
    provider: { track: (eventName, payload) => calls.push({ eventName, payload }) },
    location: { pathname: "/", search: "" },
    storage: memoryStorage(),
  });

  assert.equal(analytics.track("unknown_event", {}), false);
  assert.equal(analytics.track("cta_click", {
    cta_id: "hero_form",
    cta_location: "hero",
    email: "ana@example.cl",
  }), false);
  assert.equal(analytics.track("form_error", {
    error_type: "network",
    message: "Falló para ana@example.cl",
  }), false);
  assert.deepEqual(calls, []);
});

test("all approved event contracts emit their exact allowlisted payload", () => {
  const calls = [];
  const analytics = createAnalytics({
    enabled: true,
    provider: { track: (eventName, payload) => calls.push({ eventName, payload }) },
    location: { pathname: "/", search: "?utm_source=manual" },
    storage: memoryStorage(),
  });

  assert.equal(analytics.track("cta_click", { cta_id: "hero_form", cta_location: "hero" }), true);
  assert.equal(analytics.track("form_start", {}), true);
  assert.equal(analytics.track("form_submit_attempt", {}), true);
  assert.equal(analytics.track("generate_lead", { submission_status: "created" }), true);
  assert.equal(analytics.track("form_error", { error_type: "server" }), true);

  assert.deepEqual(calls, [
    { eventName: "cta_click", payload: { pathname: "/", cta_id: "hero_form", cta_location: "hero", utm_source: "manual" } },
    { eventName: "form_start", payload: { pathname: "/", utm_source: "manual" } },
    { eventName: "form_submit_attempt", payload: { pathname: "/", utm_source: "manual" } },
    { eventName: "generate_lead", payload: { pathname: "/", submission_status: "created", utm_source: "manual" } },
    { eventName: "form_error", payload: { pathname: "/", error_type: "server", utm_source: "manual" } },
  ]);
});

test("provider failures are contained and never escape into product flow", () => {
  const analytics = createAnalytics({
    enabled: true,
    provider: { track: () => { throw new Error("provider unavailable"); } },
    location: { pathname: "/", search: "" },
    storage: memoryStorage(),
  });

  assert.doesNotThrow(() => analytics.track("form_start", {}));
  assert.equal(analytics.track("form_start", {}), false);
});

test("disabled or invalid GA4 configuration creates no external side effects", () => {
  for (const config of [
    { enabled: false, provider: "none", measurementId: "" },
    { enabled: true, provider: "ga4", measurementId: "invalid" },
  ]) {
    const appended = [];
    const windowObject = {};
    const documentObject = {
      createElement() { throw new Error("must not create a script"); },
      head: { appendChild: (node) => appended.push(node) },
    };
    assert.equal(createGa4Provider({ config, windowObject, documentObject }), null);
    assert.equal(Object.hasOwn(windowObject, "dataLayer"), false);
    assert.deepEqual(appended, []);
  }
});

test("enabled GA4 adapter loads only gtag and suppresses automatic page views", () => {
  const appended = [];
  const windowObject = {
    location: {
      pathname: "/",
      search: "?email=ana%40example.cl&utm_campaign=cmp_sale2026",
      hash: "#ana",
    },
  };
  const documentObject = {
    cookie: "existing_functional_cookie=1",
    referrer: "https://search.example/path?phone=56912345678#result",
    createElement(tagName) { return { tagName }; },
    head: { appendChild: (node) => appended.push(node) },
  };
  const provider = createGa4Provider({
    config: { enabled: true, provider: "ga4", measurementId: "G-ABC1234567" },
    windowObject,
    documentObject,
    now: () => new Date("2026-08-29T12:00:00.000Z"),
  });

  assert.ok(provider);
  assert.deepEqual(appended, [{
    tagName: "script",
    async: true,
    src: "https://www.googletagmanager.com/gtag/js?id=G-ABC1234567",
  }]);
  assert.deepEqual(windowObject.dataLayer, [
    ["consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    }],
    ["js", new Date("2026-08-29T12:00:00.000Z")],
    ["config", "G-ABC1234567", {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      ignore_referrer: true,
      page_location: "https://brena.cl/",
    }],
  ]);
  assert.equal(documentObject.cookie, "existing_functional_cookie=1");

  provider.track("form_start", { pathname: "/" });
  assert.deepEqual(windowObject.dataLayer.at(-1), ["event", "form_start", { pathname: "/" }]);
});

test("browser bootstrap remains a no-op when public configuration is disabled", () => {
  const windowObject = {
    __BRENA_ANALYTICS_CONFIG__: { enabled: false, provider: "none", measurementId: "" },
    location: { pathname: "/", search: "?utm_source=manual" },
    sessionStorage: memoryStorage(),
  };
  const documentObject = { referrer: "https://google.com/search?q=venta" };

  const analytics = bootstrapBrowserAnalytics({ windowObject, documentObject });

  assert.equal(windowObject.brenaAnalytics, analytics);
  assert.equal(analytics.track("page_view", { page_type: "landing" }), false);
  assert.equal(Object.hasOwn(windowObject, "dataLayer"), false);
});
