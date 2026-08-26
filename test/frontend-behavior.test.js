const test = require("node:test");
const assert = require("node:assert/strict");

const { collectAttribution, buildSubmission } = require("../frontend/public/scripts.js");

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
    href: "https://brena.cl/?utm_source=instagram&utm_content=video-a",
    referrer: "https://instagram.com/",
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
    pageUrl: "https://brena.cl/?utm_source=instagram&utm_content=video-a",
    referrer: "https://instagram.com/",
    attribution: {
      utm_source: "instagram",
      utm_content: "video-a",
    },
  });
});
