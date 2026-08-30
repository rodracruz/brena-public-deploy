"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const { PAGES } = require("../src/public-pages/catalog");
const { renderPage } = require("../src/public-pages/render");
const { SITE_IDENTITY } = require("../src/public-pages/site-identity");
const { findAll, parseHtml, textContent } = require("./helpers/html-tree");

function nodesByType(root, type) {
  return findAll(root, (node) => node.attrs?.itemtype === `https://schema.org/${type}`);
}

function descendantItemProperties(node) {
  return node.children.flatMap((child) => findAll(child, (candidate) => typeof candidate.attrs?.itemprop === "string"))
    .map((candidate) => candidate.attrs.itemprop);
}

function propertyNodes(node, property) {
  return findAll(node, (candidate) => candidate.attrs?.itemprop === property);
}

function ownedItemPropertyNodes(node) {
  const matches = [];
  const visit = (candidate) => {
    if (typeof candidate.attrs?.itemprop === "string") matches.push(candidate);
    if (candidate !== node && Object.hasOwn(candidate.attrs || {}, "itemscope")) return;
    for (const child of candidate.children || []) visit(child);
  };
  for (const child of node.children || []) visit(child);
  return matches;
}

function ownedPropertyNodes(node, property) {
  return ownedItemPropertyNodes(node).filter((candidate) => candidate.attrs.itemprop === property);
}

function assertHomepageEntityContract(html) {
  const root = parseHtml(html);
  const websites = nodesByType(root, "WebSite");
  const organizations = nodesByType(root, "Organization");
  assert.equal(websites.length, 1, "WebSite cardinality must be exact");
  assert.equal(organizations.length, 1, "Organization cardinality must be exact");

  const website = websites[0];
  const organization = organizations[0];
  assert.equal(website.attrs.itemid, SITE_IDENTITY.websiteId, "WebSite id must be exact");
  assert.deepEqual(
    ownedItemPropertyNodes(website).map((node) => node.attrs.itemprop).sort(),
    ["name", "publisher", "url"],
    "WebSite properties must be exact and unique",
  );
  assert.equal(ownedPropertyNodes(website, "name")[0].attrs.content, SITE_IDENTITY.name, "WebSite name must be exact");
  assert.equal(ownedPropertyNodes(website, "url")[0].attrs.href, SITE_IDENTITY.siteUrl, "WebSite url must be exact");
  assert.equal(ownedPropertyNodes(website, "publisher")[0], organization, "WebSite publisher must be the Organization node");

  assert.equal(organization.attrs.itemid, SITE_IDENTITY.organizationId, "Organization id must be exact");
  assert.equal(organization.attrs.itemprop, "publisher", "Organization must belong to WebSite as publisher");
  assert.deepEqual(
    ownedItemPropertyNodes(organization).map((node) => node.attrs.itemprop).sort(),
    ["description", "logo", "name", "url"],
    "Organization properties must be exact and unique",
  );
  assert.equal(textContent(ownedPropertyNodes(organization, "name")[0]), SITE_IDENTITY.name, "Organization name must be exact");
  assert.equal(ownedPropertyNodes(organization, "url")[0].attrs.href, SITE_IDENTITY.siteUrl, "Organization url must be exact");
  assert.equal(ownedPropertyNodes(organization, "logo")[0].attrs.href, SITE_IDENTITY.logoUrl, "Organization logo must be exact");
  assert.equal(textContent(ownedPropertyNodes(organization, "description")[0]), SITE_IDENTITY.description, "Organization description must be exact");
}

test("site identity exposes only approved immutable public fields", () => {
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
  const html = renderPage(PAGES[0]);
  assertHomepageEntityContract(html);
  const root = parseHtml(html);
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

test("homepage entity contract rejects missing, altered and duplicated properties", () => {
  const html = renderPage(PAGES[0]);

  assert.doesNotThrow(() => assertHomepageEntityContract(html));
  assert.throws(
    () => assertHomepageEntityContract(html.replace(/\s*<meta itemprop="name" content="BRENA">/, "")),
    /WebSite (?:properties|name)/,
  );
  assert.throws(
    () => assertHomepageEntityContract(html.replace("https://brena.cl/brena.png", "https://brena.cl/otro-logo.png")),
    /Organization logo/,
  );
  assert.throws(
    () => assertHomepageEntityContract(html.replace('<link itemprop="logo" href="https://brena.cl/brena.png">', '<link itemprop="logo" href="https://brena.cl/brena.png"><link itemprop="logo" href="https://brena.cl/brena.png">')),
    /Organization (?:properties|logo)/,
  );
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

test("each P1 page exposes one visible two-item BreadcrumbList", () => {
  const expected = [
    [PAGES[1], "Vender propiedad rápido"],
    [PAGES[2], "Vender propiedad con deudas"],
    [PAGES[3], "Vender propiedad en mal estado"],
  ];

  for (const [page, label] of expected) {
    const root = parseHtml(renderPage(page));
    const lists = nodesByType(root, "BreadcrumbList");
    assert.equal(lists.length, 1, page.route);
    const items = nodesByType(lists[0], "ListItem");
    assert.equal(items.length, 2, page.route);
    assert.deepEqual(items.map((item) => textContent(propertyNodes(item, "name")[0])), ["Inicio", label]);
    assert.deepEqual(items.map((item) => propertyNodes(item, "position")[0].attrs.content), ["1", "2"]);
    assert.equal(propertyNodes(items[0], "item")[0].attrs.href, "https://brena.cl/");
    assert.equal(propertyNodes(items[1], "item")[0].attrs.href, page.canonical);
    assert.equal(propertyNodes(items[1], "name")[0].attrs["aria-current"], "page");
  }

  assert.equal(nodesByType(parseHtml(renderPage(PAGES[0])), "BreadcrumbList").length, 0);
  const success = parseHtml(fs.readFileSync("frontend/public/success.html", "utf8"));
  assert.equal(nodesByType(success, "BreadcrumbList").length, 0);
});

test("generated pages exclude unapproved schema types and identity properties", () => {
  const forbiddenTypes = ["LocalBusiness", "FAQPage", "Service", "Review", "AggregateRating", "Person"];
  const forbiddenProperties = [
    "legalName", "taxID", "address", "telephone", "email", "contactPoint",
    "openingHours", "sameAs", "founder", "employee", "foundingDate",
    "aggregateRating", "review", "areaServed",
  ];

  for (const page of PAGES) {
    const root = parseHtml(renderPage(page));
    for (const type of forbiddenTypes) assert.equal(nodesByType(root, type).length, 0, `${page.route}: ${type}`);
    for (const property of forbiddenProperties) {
      assert.equal(propertyNodes(root, property).length, 0, `${page.route}: ${property}`);
    }
  }
});
