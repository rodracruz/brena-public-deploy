"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const { PAGES } = require("../src/public-pages/catalog");
const { renderPage } = require("../src/public-pages/render");
const { findAll, parseHtml, textContent } = require("./helpers/html-tree");

function nodesByType(root, type) {
  return findAll(root, (node) => node.attrs?.itemtype === `https://schema.org/${type}`);
}

function descendantItemProperties(node) {
  return node.children.flatMap((child) => findAll(child, (candidate) => typeof candidate.attrs?.itemprop === "string"))
    .map((candidate) => candidate.attrs.itemprop);
}

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

test("homepage exposes one WebSite and one minimal visible Organization", () => {
  const root = parseHtml(renderPage(PAGES[0]));
  const websites = nodesByType(root, "WebSite");
  const organizations = nodesByType(root, "Organization");

  assert.equal(websites.length, 1);
  assert.equal(websites[0].attrs.itemid, "https://brena.cl/#website");
  assert.equal(organizations.length, 1);
  assert.equal(organizations[0].attrs.itemid, "https://brena.cl/#organization");
  assert.equal(organizations[0].attrs.itemprop, "publisher");
  assert.deepEqual([...new Set(descendantItemProperties(organizations[0]))].sort(), [
    "description",
    "logo",
    "name",
    "url",
  ]);
  assert.match(textContent(organizations[0]), /BRENA evalúa propiedades complejas/);
});

test("interior and success pages do not duplicate the site entity", () => {
  for (const page of PAGES.slice(1)) {
    const root = parseHtml(renderPage(page));
    assert.equal(nodesByType(root, "Organization").length, 0, page.route);
    assert.equal(nodesByType(root, "WebSite").length, 0, page.route);
  }

  const success = parseHtml(fs.readFileSync("frontend/public/success.html", "utf8"));
  assert.equal(nodesByType(success, "Organization").length, 0);
  assert.equal(nodesByType(success, "WebSite").length, 0);
});
