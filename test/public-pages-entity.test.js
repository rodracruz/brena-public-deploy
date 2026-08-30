"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

test("site identity exposes only approved immutable public fields", () => {
  const { SITE_IDENTITY } = require("../src/public-pages/site-identity");

  assert.deepEqual(Object.keys(SITE_IDENTITY), [
    "name",
    "siteUrl",
    "websiteId",
    "organizationId",
    "logoUrl",
    "description",
  ]);
  assert.deepEqual(SITE_IDENTITY, {
    name: "BRENA",
    siteUrl: "https://brena.cl/",
    websiteId: "https://brena.cl/#website",
    organizationId: "https://brena.cl/#organization",
    logoUrl: "https://brena.cl/brena.png",
    description: "BRENA evalúa propiedades complejas y estructura alternativas según las condiciones de cada caso.",
  });
  assert.equal(Object.isFrozen(SITE_IDENTITY), true);
  assert.equal(Reflect.set(SITE_IDENTITY, "telephone", "+56"), false);
});
