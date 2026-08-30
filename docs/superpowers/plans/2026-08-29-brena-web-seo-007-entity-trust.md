# BRENA-WEB-SEO-007 Entity and Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a minimal, verifiable BRENA entity and trust layer in the four existing static pages using visible Microdata without changing routes, lead handling, analytics, sitemap scope, or CSP.

**Architecture:** A frozen `SITE_IDENTITY` module supplies the only machine-readable entity values. The existing static renderer adds `WebSite` and `Organization` Microdata to the homepage, page-specific visible `BreadcrumbList` Microdata to the three P1 pages, and shared brand metadata to all four pages. Tests parse generated HTML as a tree so they protect structure and parent-child semantics rather than merely searching strings.

**Tech Stack:** Node.js 20+, CommonJS, Node test runner, deterministic static HTML generator, schema.org Microdata, existing CSS and HTTP contract tests.

**Spec:** `docs/superpowers/specs/2026-08-29-brena-web-seo-007-entity-trust-design.md`

## Global Constraints

- Canonical public name is exactly `BRENA`.
- Homepage schema is limited to `WebSite` and one minimal `Organization`.
- P1 schema is limited to one `BreadcrumbList` per page.
- Never add `LocalBusiness`, `FAQPage`, `Service`, `Review`, `AggregateRating`, or `Person`.
- Never publish a legal name, RUT, responsible person, address, telephone, email, hours, `sameAs`, or rigid service area.
- Keep the existing form as the only public contact channel.
- Use Microdata on deterministic static HTML; do not migrate to JSON-LD.
- Do not add inline scripts, CSP hashes, `unsafe-inline`, `unsafe-eval`, wildcard sources, or external domains.
- Do not change routes, redirects, Worker behavior, lead contracts, analytics contracts, `page_type`, robots, or sitemap membership.
- The sitemap must contain exactly the four current canonical URLs.
- Do not add dependencies, pages, testimonials, statistics, years, cases, certifications, or a Google Business Profile.
- Preserve the LF portability contract from `c291887863bb452029135b06fe938fd851c9bed7`.
- No push, deploy, or BRENA-WEB-SEO-008 work.

## File Map

**Create:**

- `src/public-pages/site-identity.js` — frozen allowlisted entity values.
- `test/helpers/html-tree.js` — dependency-free test parser for structural Microdata assertions.
- `test/public-pages-entity.test.js` — identity, Microdata, brand, prohibited-schema, and trust contracts.
- `docs/seo/implementation/2026-08-29-brena-web-seo-007-entity-trust.md` — implementation evidence.

**Modify:**

- `src/public-pages/catalog.js` — exact P1 breadcrumb labels and validation.
- `src/public-pages/render.js` — identity metadata, Microdata, visible breadcrumbs, institutional section, and brand normalization.
- `test/public-pages-catalog.test.js` — breadcrumb catalog contract.
- `test/public-pages-content.test.js` — visible trust and prohibited-claim coverage.
- `test/public-pages-render.test.js` — generated markup and synchronization coverage.
- the four generated HTML files under `frontend/public/`.

**Must remain unchanged:** `src/security-headers.js`, `cloudflare/worker.mjs`, `src/server.js`, `frontend/public/sitemap.xml`, `frontend/public/robots.txt`, `frontend/public/success.html`, analytics, scripts, form fragment, and lead contracts.

---

### Task 1: Central identity and breadcrumb catalog contract

**Files:**

- Create: `src/public-pages/site-identity.js`
- Modify: `src/public-pages/catalog.js:1-120`
- Create: `test/public-pages-entity.test.js`
- Modify: `test/public-pages-catalog.test.js`

**Interfaces:**

- Produces: frozen `SITE_IDENTITY` with exactly `name`, `siteUrl`, `websiteId`, `organizationId`, `logoUrl`, and `description`.
- Produces: `page.breadcrumbLabel`, `null` for `/` and exact text for each P1 page.

- [ ] **Step 1: Write the failing identity test**

```js
test("site identity exposes only approved immutable public fields", () => {
  const { SITE_IDENTITY } = require("../src/public-pages/site-identity");
  assert.deepEqual(Object.keys(SITE_IDENTITY), [
    "name", "siteUrl", "websiteId", "organizationId", "logoUrl", "description",
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
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/public-pages-entity.test.js`

Expected: FAIL because `site-identity.js` does not exist.

- [ ] **Step 3: Implement the minimal source**

```js
"use strict";

const SITE_IDENTITY = Object.freeze({
  name: "BRENA",
  siteUrl: "https://brena.cl/",
  websiteId: "https://brena.cl/#website",
  organizationId: "https://brena.cl/#organization",
  logoUrl: "https://brena.cl/brena.png",
  description: "BRENA evalúa propiedades complejas y estructura alternativas según las condiciones de cada caso.",
});

module.exports = { SITE_IDENTITY };
```

- [ ] **Step 4: Verify identity GREEN**

Run: `node --test test/public-pages-entity.test.js`

Expected: PASS.

- [ ] **Step 5: Write failing catalog tests**

```js
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
```

- [ ] **Step 6: Verify catalog RED**

Run: `node --test test/public-pages-catalog.test.js`

Expected: FAIL because labels are absent and invalid labels are accepted.

- [ ] **Step 7: Add the four labels and validation**

```js
if (page.route === "/") {
  if (page.breadcrumbLabel !== null) throw new Error("homepage breadcrumbLabel must be null");
} else if (typeof page.breadcrumbLabel !== "string" || !page.breadcrumbLabel.trim()) {
  throw new Error(`breadcrumbLabel is required for ${page.route}`);
}
const labels = pages.filter(({ route }) => route !== "/").map(({ breadcrumbLabel }) => breadcrumbLabel);
if (new Set(labels).size !== labels.length) throw new Error("breadcrumbLabel must be unique");
```

- [ ] **Step 8: Verify and commit Task 1**

Run: `node --test test/public-pages-entity.test.js test/public-pages-catalog.test.js`

```bash
git add src/public-pages/site-identity.js src/public-pages/catalog.js test/public-pages-entity.test.js test/public-pages-catalog.test.js
git commit -m "feat: define BRENA public entity identity"
```

---

### Task 2: Structural parser and homepage entity Microdata

**Files:**

- Create: `test/helpers/html-tree.js`
- Modify: `test/public-pages-entity.test.js`
- Modify: `src/public-pages/render.js:1-165`

**Interfaces:**

- Produces test-only `parseHtml`, `findAll`, and `textContent`.
- Produces one homepage `WebSite` and one nested publisher `Organization`.

- [ ] **Step 1: Create the dependency-free test parser**

```js
"use strict";
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
function attributes(source) {
  const result = {};
  for (const match of source.matchAll(/([^\s=/>]+)(?:\s*=\s*"([^"]*)")?/g)) result[match[1]] = match[2] ?? true;
  return result;
}
function parseHtml(html) {
  const root = { tag: "#document", attrs: {}, children: [] };
  const stack = [root];
  for (const token of html.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+/g) || []) {
    if (token.startsWith("<!--") || token.startsWith("<!")) continue;
    if (token.startsWith("</")) { const tag = token.slice(2, -1).trim().toLowerCase(); while (stack.length > 1 && stack.at(-1).tag !== tag) stack.pop(); if (stack.length > 1) stack.pop(); continue; }
    if (token.startsWith("<")) { const match = token.match(/^<([a-zA-Z][^\s/>]*)([\s\S]*?)\/?\s*>$/); if (!match) continue; const node = { tag: match[1].toLowerCase(), attrs: attributes(match[2]), children: [] }; stack.at(-1).children.push(node); if (!VOID.has(node.tag) && !token.endsWith("/>")) stack.push(node); continue; }
    stack.at(-1).children.push({ tag: "#text", attrs: {}, children: [], value: token });
  }
  return root;
}
function findAll(node, predicate, found = []) { if (predicate(node)) found.push(node); for (const child of node.children || []) findAll(child, predicate, found); return found; }
function textContent(node) { return node.tag === "#text" ? node.value : (node.children || []).map(textContent).join("").replace(/\s+/g, " ").trim(); }
module.exports = { findAll, parseHtml, textContent };
```

- [ ] **Step 2: Write failing tree-based entity tests**

Parse `renderPage(PAGES[0])`, locate nodes by exact `itemtype`, and assert:

```js
assert.equal(nodesByType(root, "WebSite").length, 1);
assert.equal(nodesByType(root, "WebSite")[0].attrs.itemid, "https://brena.cl/#website");
assert.equal(nodesByType(root, "Organization").length, 1);
assert.equal(nodesByType(root, "Organization")[0].attrs.itemid, "https://brena.cl/#organization");
assert.deepEqual([...new Set(itemProperties(organization))].sort(), ["description", "logo", "name", "url"]);
assert.match(textContent(organization), /BRENA evalúa propiedades complejas/);
```

`itemProperties(organization)` must traverse the Organization children, not the Organization root itself: `itemprop="publisher"` belongs to the parent WebSite relationship and is not an Organization field. The assertion therefore checks only the Organization's own descendant properties.

Also assert zero `WebSite` and `Organization` nodes in P1 pages and `success.html`.

- [ ] **Step 3: Verify RED**

Run: `node --test test/public-pages-entity.test.js`

Expected: FAIL because renderer has no schema.org scopes.

- [ ] **Step 4: Implement homepage Microdata and site-name metadata**

Import `SITE_IDENTITY`. Add `og:site_name="BRENA"` to `renderHead`. On homepage only, add these attributes to `<body>`:

```html
itemscope itemtype="https://schema.org/WebSite" itemid="https://brena.cl/#website"
```

Immediately inside homepage `<body>`, render:

```html
<link itemprop="url" href="https://brena.cl/">
<meta itemprop="name" content="BRENA">
```

Annotate the existing perspective section as the WebSite `publisher`:

```html
<section class="perspective section" itemprop="publisher" itemscope
  itemtype="https://schema.org/Organization" itemid="https://brena.cl/#organization">
  <link itemprop="url" href="https://brena.cl/">
  <link itemprop="logo" href="https://brena.cl/brena.png">
  <p class="eyebrow"><span></span> <span itemprop="name">BRENA</span></p>
  <p class="large-copy" itemprop="description">BRENA evalúa propiedades complejas y estructura alternativas según las condiciones de cada caso.</p>
</section>
```

All values must come from `SITE_IDENTITY` through `escapeHtml()`.

- [ ] **Step 5: Verify and commit Task 2**

Run: `node --test test/public-pages-entity.test.js test/public-pages-render.test.js`

Mutation gate: wrong itemid, duplicated Organization, missing description, or added telephone must fail.

```bash
git add test/helpers/html-tree.js test/public-pages-entity.test.js src/public-pages/render.js
git commit -m "feat: add minimal BRENA entity microdata"
```

---

### Task 3: Visible page-specific BreadcrumbList

**Files:**

- Modify: `test/public-pages-entity.test.js`
- Modify: `src/public-pages/render.js:66-84`

**Interfaces:** Produces `renderBreadcrumb(page)`, no breadcrumb for `/`, and a visible two-item `BreadcrumbList` for each P1 page.

- [ ] **Step 1: Write failing structural breadcrumb tests**

For each literal route/label/canonical tuple, parse the rendered tree and require one `BreadcrumbList`, two `ListItem` nodes, positions `1` and `2`, visible names `Inicio` and the literal page label, homepage link `https://brena.cl/`, current-page item equal to canonical, and `aria-current="page"`. Require zero BreadcrumbList nodes in homepage and `success.html`.

- [ ] **Step 2: Verify RED**

Run: `node --test test/public-pages-entity.test.js`

Expected: FAIL because current breadcrumbs say `Evaluación` and have no Microdata.

- [ ] **Step 3: Implement `renderBreadcrumb(page)`**

```js
function renderBreadcrumb(page) {
  if (page.route === "/") return "<!-- página principal -->";
  return `<nav class="breadcrumb" aria-label="Migas de pan" itemscope itemtype="https://schema.org/BreadcrumbList"><ol>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><a itemprop="item" href="${escapeHtml(SITE_IDENTITY.siteUrl)}"><span itemprop="name">Inicio</span></a><meta itemprop="position" content="1"></li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"><span itemprop="name" aria-current="page">${escapeHtml(page.breadcrumbLabel)}</span><link itemprop="item" href="${escapeHtml(page.canonical)}"><meta itemprop="position" content="2"></li>
  </ol></nav>`;
}
```

Replace the inline hero breadcrumb with `renderBreadcrumb(page)`.

- [ ] **Step 4: Verify and commit Task 3**

Run: `node --test test/public-pages-entity.test.js test/public-pages-content.test.js`

```bash
git add src/public-pages/render.js test/public-pages-entity.test.js
git commit -m "feat: add structured P1 breadcrumbs"
```

---

### Task 4: Visible trust section and canonical brand signals

**Files:**

- Modify: `test/public-pages-content.test.js`
- Modify: `test/public-pages-entity.test.js`
- Modify: `src/public-pages/render.js:51-150`

**Interfaces:** Produces approved visible trust copy and shared BRENA identity labels without changing commercial metadata or forms.

- [ ] **Step 1: Write failing visible-content tests**

Require these exact concepts in homepage HTML: `Evaluación inmobiliaria con una mirada económica y constructiva.`, the exact `SITE_IDENTITY.description`, direct construction/improvement/remodeling experience, possible in-person property visit, requests from different Chilean regions with case-by-case viability, and no guarantees of purchase, sale, price, time, or valuation.

Require all four pages to contain `og:site_name="BRENA"`, header `aria-label="BRENA, inicio"`, logo `alt="BRENA"`, privacy responsible `BRENA`, and footer copyright `BRENA`. Reject `mailto:`, `tel:`, WhatsApp, `LocalBusiness`, legal name, RUT, testimonials, credentials, and years of experience.

- [ ] **Step 2: Verify RED**

Run: `node --test test/public-pages-content.test.js test/public-pages-entity.test.js`

Expected: FAIL on missing trust statements and legacy shared brand labels.

- [ ] **Step 3: Replace only the existing perspective copy**

Keep the existing image, section location, classes, and responsive layout. Render:

```html
<p class="eyebrow"><span></span> <span itemprop="name">BRENA</span></p>
<h2 id="perspective-title">Evaluación inmobiliaria con una mirada económica y constructiva.</h2>
<p class="large-copy" itemprop="description">BRENA evalúa propiedades complejas y estructura alternativas según las condiciones de cada caso.</p>
<p>Según el caso, la alternativa puede incluir inversión directa, mejoramiento o remodelación previa a la venta y otras vías de comercialización.</p>
<p>BRENA cuenta con experiencia directa en construcción, mejoramiento y remodelación. Cuando la evaluación lo requiere, puede coordinar una visita presencial a la propiedad.</p>
<p>BRENA recibe solicitudes desde distintas regiones de Chile. La viabilidad se confirma individualmente según la ubicación, las características de la propiedad y la alternativa requerida.</p>
<p>BRENA no garantiza compra, venta, precio, plazo ni valorización. Completar el formulario no obliga a continuar.</p>
```

- [ ] **Step 4: Normalize only shared identity signals**

Change header aria-label and header/footer alt to `BRENA`, success heading to `Gracias por confiar en BRENA.`, privacy responsible and purpose to `BRENA`, and footer copyright to `BRENA`. Do not rewrite page titles, descriptions, H1, catalog copy, or FAQ content wholesale.

- [ ] **Step 5: Verify and commit Task 4**

Run: `node --test test/public-pages-content.test.js test/public-pages-entity.test.js test/public-pages-render.test.js`

```bash
git add src/public-pages/render.js test/public-pages-content.test.js test/public-pages-entity.test.js
git commit -m "feat: add BRENA trust and identity signals"
```

---

### Task 5: Generated artifacts and regression boundaries

**Files:**

- Modify: `test/public-pages-entity.test.js`
- Modify: `test/public-pages-render.test.js`
- Generate: four HTML files under `frontend/public/`

- [ ] **Step 1: Protect prohibited schema and properties**

Add a tree-based test over every page rejecting the six prohibited schema types and these item properties: `legalName`, `taxID`, `address`, `telephone`, `email`, `contactPoint`, `openingHours`, `sameAs`, `founder`, `employee`, `foundingDate`, `aggregateRating`, `review`, `areaServed`.

- [ ] **Step 2: Generate and inspect the exact diff**

Run:

```bash
npm run build
git diff -- frontend/public/index.html frontend/public/vender-propiedad-rapido.html frontend/public/vender-propiedad-con-deudas.html frontend/public/vender-propiedad-en-mal-estado.html
git diff --exit-code -- frontend/public/sitemap.xml frontend/public/robots.txt frontend/public/success.html
```

Expected: only intended identity, Microdata, breadcrumb, and trust changes in the four HTML files. No form field, option, analytics attribute, script, canonical, title, description, H1, or link change.

- [ ] **Step 3: Verify CSP, HTTP, form, and analytics boundaries**

Run:

```bash
node --test test/seo-http-contract.test.js test/server.test.js test/cloudflare-worker.test.js
node --test test/frontend-behavior.test.js test/analytics.test.js test/analytics-config.test.js test/lead-contract.test.js
git diff --exit-code c291887 -- src/security-headers.js cloudflare/worker.mjs src/server.js frontend/public/analytics.js frontend/public/scripts.js src/lead-contract.js
```

Expected: PASS and no boundary-file diff.

- [ ] **Step 4: Commit generated artifacts and final automated contracts**

```bash
git add test/public-pages-entity.test.js test/public-pages-render.test.js frontend/public/index.html frontend/public/vender-propiedad-rapido.html frontend/public/vender-propiedad-con-deudas.html frontend/public/vender-propiedad-en-mal-estado.html
git commit -m "test: protect BRENA entity markup contracts"
```

---

### Task 6: Controlled schema and visual validation

**Files:** No product changes expected; evidence goes in the implementation report.

- [ ] **Step 1: Start the existing server in its safe local/preview configuration**

Confirm `/healthcheck` is 200. Do not enable analytics or print secrets.

- [ ] **Step 2: Inspect all four initial HTML responses**

Verify 200, existing canonical/H1/metadata, `og:site_name`, homepage-only WebSite/Organization, P1-only BreadcrumbList, unchanged `/api/leads` form action, and no preselected option.

- [ ] **Step 3: Validate Microdata**

Use Schema Markup Validator when network access permits. Use Rich Results Test for BreadcrumbList. Record syntax errors separately from optional warnings; lack of a WebSite/Organization rich preview is not a failure.

- [ ] **Step 4: Review desktop and mobile**

Check homepage and one representative P1 at desktop/mobile, then spot-check other P1 breadcrumbs. Verify identity, typography, colors, image treatment, form, footer, wrapping, zero overflow, console, links, CTA targets, and no GA4 request.

- [ ] **Step 5: Stop the server and remove no tracked data**

Confirm no logs, captures, environment files, or runtime artifacts entered Git.

---

### Task 7: Implementation report, full verification, and independent review

**Files:**

- Create: `docs/seo/implementation/2026-08-29-brena-web-seo-007-entity-trust.md`

- [ ] **Step 1: Write the implementation report**

Record objective, scope, base/branch/HEAD, identity allowlist, Microdata/CSP decision, output per page, trust copy, deferred LocalBusiness/GBP, files changed/unchanged, RED/GREEN evidence, schema/visual evidence, risks, and no-deploy status.

- [ ] **Step 2: Run complete verification**

```bash
npm ci
npm run build
npm test
npm audit
git diff --check
git status --short
```

Expected: install/build pass; 109 inherited plus new tests pass; audit 0; generated artifacts synchronized; only intended uncommitted report before commit.

- [ ] **Step 3: Commit the report**

```bash
git add docs/seo/implementation/2026-08-29-brena-web-seo-007-entity-trust.md
git commit -m "docs: record BRENA SEO-007 implementation"
```

- [ ] **Step 4: Request independent code review**

Use `superpowers:requesting-code-review` from base `c291887863bb452029135b06fe938fd851c9bed7` to current HEAD. Review fabricated identity, unauthorized types/properties, Microdata tree validity, visible/schema mismatch, breadcrumbs/canonicals, duplicate entities, CSP, contact channels, sitemap/routing/form/analytics regressions, responsive behavior, and superficial tests.

Fix every valid Critical or Important finding through fresh RED → GREEN and commit separately. Fix in-scope Minor findings or document why they are non-actionable.

- [ ] **Step 5: Run fresh final verification**

```bash
npm run build
npm test
npm audit
git diff --check
git status --short
git log --oneline c291887..HEAD
```

SEO-007 is locally GREEN only with zero open Critical/Important findings, clean worktree, unchanged boundaries, and no push/deploy.

## Closure Criteria

- One immutable six-field identity source.
- Homepage has one valid WebSite and one minimal Organization matching visible content.
- Each P1 has one visible valid BreadcrumbList; homepage and success have none.
- All four pages have `og:site_name="BRENA"`.
- Shared identity signals use BRENA without mass copy rewriting.
- Homepage trust copy includes approved experience, visits, case-by-case geography, and non-guarantees.
- No prohibited type/property, NAP, person, testimonial, metric, credential, or new contact channel.
- CSP, Worker, server, routing, form, analytics, robots, success, and sitemap scope unchanged.
- Deterministic build remains synchronized under LF policy.
- Schema and responsive validation show no blocker.
- Full tests/audit pass and independent review has no Critical/Important finding.
- Git is clean; no push, deploy, or SEO-008 work.
