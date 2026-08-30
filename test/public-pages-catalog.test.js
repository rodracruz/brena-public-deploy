"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { PAGE_TYPES, PAGES, validateCatalog } = require("../src/public-pages/catalog");

test("catalog contains exactly the four approved commercial surfaces", () => {
  assert.deepEqual([...PAGE_TYPES], [
    "homepage",
    "commercial_fast_sale",
    "commercial_debt",
    "commercial_property_condition",
  ]);
  assert.deepEqual(PAGES.map(({ route }) => route), [
    "/",
    "/vender-propiedad-rapido",
    "/vender-propiedad-con-deudas",
    "/vender-propiedad-en-mal-estado",
  ]);
  assert.equal(PAGES.some(({ pageType }) => pageType === "success"), false);
  assert.equal(validateCatalog(PAGES), true);
});

test("catalog metadata and canonical fields are complete and unique", () => {
  for (const field of ["route", "outputFile", "pageType", "title", "description", "h1", "canonical"]) {
    const values = PAGES.map((page) => page[field]);
    assert.equal(values.every(Boolean), true, `${field} must be complete`);
    assert.equal(new Set(values).size, PAGES.length, `${field} must be unique`);
  }
  for (const page of PAGES) {
    assert.equal(page.canonical, `https://brena.cl${page.route === "/" ? "/" : page.route}`);
  }
});

test("catalog rejects duplicate, unknown and unsafe page definitions", () => {
  const base = PAGES.map((page) => ({ ...page, relatedLinks: [...page.relatedLinks] }));
  for (const field of ["route", "outputFile", "pageType", "title", "h1", "canonical"]) {
    const invalid = base.map((page) => ({ ...page }));
    invalid[1][field] = invalid[0][field];
    assert.throws(() => validateCatalog(invalid), new RegExp(field, "i"));
  }
  assert.throws(() => validateCatalog(base.map((page, index) => index === 1 ? { ...page, pageType: "success" } : page)), /pageType/i);
  assert.throws(() => validateCatalog(base.map((page, index) => index === 1 ? { ...page, relatedSituation: "propiedad_deteriorada" } : page)), /relatedSituation/i);
  assert.throws(() => validateCatalog(base.map((page, index) => index === 1 ? { ...page, description: "" } : page)), /description/i);
  assert.throws(() => validateCatalog(base.map((page, index) => index === 1 ? { ...page, relatedLinks: ["/no-existe"] } : page)), /relatedLinks/i);
});

test("only approved pages receive contextual form hints", () => {
  assert.deepEqual(PAGES.map(({ relatedSituation }) => relatedSituation), [
    null,
    "necesita_vender_rapido",
    "mora_hipotecaria",
    null,
  ]);
});

test("catalog provides exact breadcrumb labels", () => {
  assert.deepEqual(PAGES.map(({ route, breadcrumbLabel }) => [route, breadcrumbLabel]), [
    ["/", null],
    ["/vender-propiedad-rapido", "Vender propiedad rápido"],
    ["/vender-propiedad-con-deudas", "Vender propiedad con deudas"],
    ["/vender-propiedad-en-mal-estado", "Vender propiedad en mal estado"],
  ]);
});

test("catalog rejects invalid breadcrumb labels", () => {
  const missing = PAGES.map((page) => ({ ...page }));
  delete missing[1].breadcrumbLabel;
  assert.throws(() => validateCatalog(missing), /breadcrumbLabel/);

  const homepage = PAGES.map((page) => ({ ...page }));
  homepage[0].breadcrumbLabel = "Inicio";
  assert.throws(() => validateCatalog(homepage), /breadcrumbLabel/);

  const duplicate = PAGES.map((page) => ({ ...page }));
  duplicate[2].breadcrumbLabel = duplicate[1].breadcrumbLabel;
  assert.throws(() => validateCatalog(duplicate), /breadcrumbLabel/);
});
