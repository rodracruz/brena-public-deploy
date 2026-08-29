const test = require("node:test");
const assert = require("node:assert/strict");

const {
  collectAttribution,
  buildSubmission,
  initializeCtaTracking,
  initializeFormStartTracking,
  trackPageViewOnce,
  submitLead,
  submitValidatedLead,
} = require("../frontend/public/scripts.js");

test("collects only allowlisted campaign parameters", () => {
  const attribution = collectAttribution("?utm_source=google&utm_campaign=venta%20casa&gclid=secret&utm_medium=cpc");

  assert.deepEqual(attribution, {
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "venta casa",
  });
});

test("builds the public API submission with boolean consent and page context", () => {
  const submission = buildSubmission({
    name: "Ana Silva",
    phone: "+56 9 8765 4321",
    email: "ana@example.cl",
    region: "valparaiso",
    commune: "Viña del Mar",
    propertyType: "departamento",
    situation: "necesita_vender_rapido",
    urgency: "proximo_mes",
    message: "Quiero conversar",
    consent: "on",
    website: "",
  }, {
    href: "https://ana:secret@brena.cl/?utm_source=instagram&utm_content=video-a&email=ana%40example.cl#formulario",
    referrer: "https://instagram.com/campana?phone=%2B56912345678#perfil",
    search: "?utm_source=instagram&utm_content=video-a",
  });

  assert.deepEqual(submission, {
    name: "Ana Silva",
    phone: "+56 9 8765 4321",
    email: "ana@example.cl",
    region: "valparaiso",
    commune: "Viña del Mar",
    propertyType: "departamento",
    situation: "necesita_vender_rapido",
    urgency: "proximo_mes",
    message: "Quiero conversar",
    consent: true,
    website: "",
    pageUrl: "https://brena.cl/",
    referrer: "https://instagram.com/campana",
    attribution: {
      utm_source: "instagram",
      utm_content: "video-a",
    },
  });
});

test("drops invalid or non-HTTP page context instead of forwarding it", () => {
  const submission = buildSubmission({}, {
    href: "javascript:alert(document.cookie)",
    referrer: "not a URL",
    search: "",
  });

  assert.equal(submission.pageUrl, "");
  assert.equal(submission.referrer, "");
});

test("tracks a landing page view only once even if initialization repeats", () => {
  const calls = [];
  const analytics = { track: (eventName, payload) => calls.push({ eventName, payload }) };

  trackPageViewOnce(analytics);
  trackPageViewOnce(analytics);

  assert.deepEqual(calls, [{ eventName: "page_view", payload: { page_type: "landing" } }]);
});

test("CTA tracking uses only declarative stable identifiers", () => {
  const listeners = [];
  const elements = [
    {
      dataset: { analyticsCtaId: "hero_form", analyticsCtaLocation: "hero", ignored: "ana@example.cl" },
      addEventListener: (eventName, handler) => listeners.push({ eventName, handler }),
    },
  ];
  const calls = [];

  initializeCtaTracking({
    documentObject: { querySelectorAll: () => elements },
    analytics: { track: (eventName, payload) => calls.push({ eventName, payload }) },
  });
  listeners[0].handler();

  assert.equal(listeners[0].eventName, "click");
  assert.deepEqual(calls, [{
    eventName: "cta_click",
    payload: { cta_id: "hero_form", cta_location: "hero" },
  }]);
});

test("form start is emitted once on real input or change, never at setup", () => {
  const listeners = new Map();
  const calls = [];
  const form = {
    addEventListener: (eventName, handler) => listeners.set(eventName, handler),
    removeEventListener: (eventName) => listeners.delete(eventName),
  };

  initializeFormStartTracking(form, {
    track: (eventName, payload) => calls.push({ eventName, payload }),
  });
  assert.deepEqual(calls, []);
  listeners.get("input")();
  listeners.get("change")?.();

  assert.deepEqual(calls, [{ eventName: "form_start", payload: {} }]);
});

test("valid submit records attempt before request and conversion only after confirmed creation", async () => {
  const order = [];
  const analytics = {
    track(eventName, payload) { order.push({ type: "event", eventName, payload }); },
  };
  const fetchImpl = async (url, options) => {
    order.push({ type: "request", url, options });
    return {
      ok: true,
      status: 201,
      json: async () => ({ ok: true, submissionId: "lead-private-id", preview: false }),
    };
  };

  const result = await submitLead({ submission: { consent: true }, fetchImpl, analytics });

  assert.equal(result.confirmed, true);
  assert.equal(order[0].eventName, "form_submit_attempt");
  assert.equal(order[1].type, "request");
  assert.deepEqual(order[2], {
    type: "event",
    eventName: "generate_lead",
    payload: { submission_status: "created" },
  });
  assert.equal(JSON.stringify(order[2]).includes("lead-private-id"), false);
});

test("local validation failure stops before submit attempt and network request", async () => {
  const calls = [];
  const result = await submitValidatedLead({
    submission: { name: "" },
    hasLocalErrors: true,
    analytics: { track: (eventName, payload) => calls.push({ eventName, payload }) },
    fetchImpl: async () => { throw new Error("request must not happen"); },
  });

  assert.deepEqual(result, { skipped: true, confirmed: false });
  assert.deepEqual(calls, [{ eventName: "form_error", payload: { error_type: "validation" } }]);
});

test("2xx without creation evidence and 4xx or 5xx never generate a lead event", async () => {
  for (const responseFixture of [
    { ok: true, status: 202, body: { ok: true, message: "accepted" } },
    { ok: false, status: 400, body: { ok: false, errors: { name: "required" } } },
    { ok: false, status: 500, body: { ok: false } },
  ]) {
    const calls = [];
    const result = await submitLead({
      submission: { consent: true },
      analytics: { track: (eventName, payload) => calls.push({ eventName, payload }) },
      fetchImpl: async () => ({
        ok: responseFixture.ok,
        status: responseFixture.status,
        json: async () => responseFixture.body,
      }),
    });

    assert.equal(result.confirmed, false);
    assert.equal(calls.some(({ eventName }) => eventName === "generate_lead"), false);
    if (!responseFixture.ok) {
      assert.deepEqual(calls.at(-1), {
        eventName: "form_error",
        payload: { error_type: responseFixture.status < 500 ? "validation" : "server" },
      });
    }
  }
});

test("network failure is categorized without leaking its message and remains throwable to the UI", async () => {
  const calls = [];
  await assert.rejects(
    submitLead({
      submission: { consent: true },
      analytics: { track: (eventName, payload) => calls.push({ eventName, payload }) },
      fetchImpl: async () => { throw new Error("ana@example.cl could not connect"); },
    }),
    /could not connect/,
  );
  assert.deepEqual(calls, [
    { eventName: "form_submit_attempt", payload: {} },
    { eventName: "form_error", payload: { error_type: "network" } },
  ]);
});
