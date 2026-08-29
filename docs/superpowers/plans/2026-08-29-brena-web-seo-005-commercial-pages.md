# BRENA-WEB-SEO-005 Commercial Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and serve the existing BRENA homepage plus three differentiated P1 commercial pages from one deterministic static source while preserving the lead form, analytics privacy, security and visual system.

**Architecture:** A CommonJS page catalog defines the four canonical pages and their intent-specific content. A dependency-free renderer owns common chrome and the single lead-form source, and a Node CLI generates four versioned HTML files plus the sitemap. The existing server maps extensionless canonical routes to those files; the Cloudflare Worker and server normalize aliases consistently.

**Tech Stack:** Node.js 20.18+, CommonJS modules, built-in `node:test`, static HTML/CSS/JavaScript, existing Node HTTP server, Cloudflare Worker ESM.

**Spec:** `docs/superpowers/specs/2026-08-29-brena-web-seo-005-commercial-pages-design.md`

## Global Constraints

- Work only on `codex/brena-web-seo-005-commercial-pages` from base `5ebc986f862ead06dacf302087bafc7e161f4e9b`.
- Create exactly `/vender-propiedad-rapido`, `/vender-propiedad-con-deudas` and `/vender-propiedad-en-mal-estado`; homepage remains `/`.
- Allowed `page_type` values are exactly `homepage`, `commercial_fast_sale`, `commercial_debt` and `commercial_property_condition`.
- `success.html` remains functional and `noindex`, but is outside the page catalog, sitemap and `page_type` taxonomy.
- Add no npm dependency and no runtime presentation rendering.
- Generated HTML and sitemap are committed; generation contains no timestamp or environment-dependent content.
- Keep one source for header, navigation, form, footer, analytics hooks and common layout.
- Keep the current form fields, option values, validation, `/api/leads`, backend, honeypot, consent and PII protections.
- Never preselect a situation. Only fast-sale and debt pages may show a non-selecting contextual hint.
- Do not add schema, testimonials, statistics, locality pages, inheritance, mass articles or SEO-006 scope.
- Do not promise purchase, sale, price, appreciation, return or deadline.
- Keep GA4 disabled and do not relax CSP.
- Use TDD for every behavior and commit after every task.

---

### Task 1: Lock the Four-Page Catalog

**Files:**
- Create: `src/public-pages/catalog.js`
- Create: `test/public-pages-catalog.test.js`

**Interfaces:**
- Produces: `PAGE_TYPES: ReadonlySet<string>` with exactly four values.
- Produces: `PAGES: ReadonlyArray<PageDefinition>`.
- Produces: `validateCatalog(pages): true`, throwing a descriptive `Error` for invalid catalogs.
- `PageDefinition` fields: `route`, `outputFile`, `pageType`, `cluster`, `title`, `description`, `h1`, `canonical`, `ogTitle`, `ogDescription`, `eyebrow`, `lead`, `relatedSituation`, `sections`, `faqs`, `relatedLinks`.
- Consumers: Tasks 2, 4 and 5.

- [ ] **Step 1: Write the failing catalog contract tests**

Create tests that require `../src/public-pages/catalog` and assert:

```js
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
```

Add negative fixtures for duplicate route, output file, title, H1, canonical and `pageType`; an unknown page type; an invalid `relatedSituation`; missing metadata; and internal links to unregistered routes.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test test/public-pages-catalog.test.js`

Expected: FAIL with `Cannot find module '../src/public-pages/catalog'`.

- [ ] **Step 3: Implement immutable catalog and validation**

Define the exact four-value `PAGE_TYPES`, a `RELATED_SITUATIONS` set containing only `null`, `necesita_vender_rapido` and `mora_hipotecaria`, and the four page definitions from spec section 8. Debt content includes the ChileAtiende mortgage source and separates BRENA evaluation from creditor/professional confirmation.

`validateCatalog()` compares array lengths with `Set` sizes for unique fields, verifies canonical equals `https://brena.cl${route === "/" ? "/" : route}`, restricts related links to catalog routes and freezes the validated definitions.

- [ ] **Step 4: Run focused and full tests**

```powershell
node --test test/public-pages-catalog.test.js
npm test
```

Expected: catalog tests PASS and all 87 inherited tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/public-pages/catalog.js test/public-pages-catalog.test.js
git commit -m "feat: define BRENA commercial page catalog"
```

---

### Task 2: Build the Shared Renderer and Deterministic Generator

**Files:**
- Create: `src/public-pages/render.js`
- Create: `scripts/build-public-pages.js`
- Create: `test/public-pages-render.test.js`
- Modify: `package.json`
- Replace as generated: `frontend/public/index.html`
- Create as generated: `frontend/public/vender-propiedad-rapido.html`
- Create as generated: `frontend/public/vender-propiedad-con-deudas.html`
- Create as generated: `frontend/public/vender-propiedad-en-mal-estado.html`
- Replace as generated: `frontend/public/sitemap.xml`

**Interfaces:**
- Consumes: `PAGES` and `validateCatalog()` from Task 1.
- Produces: `escapeHtml(value)`, `renderLeadForm({ relatedSituation })`, `renderPage(page, pages)`, `renderSitemap(pages)` and `buildArtifacts(pages)`.
- CLI: `node scripts/build-public-pages.js [output-directory]`; no argument writes `frontend/public`.

- [ ] **Step 1: Write failing renderer and generator tests**

Assert the artifact keys are the four HTML outputs plus `sitemap.xml`. For each HTML assert exact `lang`, static `data-page-type`, metadata, H1, common scripts and one current lead form. Assert no radio contains `checked`.

Extract the form between `<!-- lead-form:start -->` and `<!-- lead-form:end -->`, remove only the optional contextual hint, and assert the remaining markup is byte-identical across pages. Assert one hint on fast sale, one on debt and none on homepage/condition; hints do not add `checked` or `aria-selected`.

Run the CLI twice into temporary directories and compare SHA-256 for every file. Compare a fresh temporary build with tracked outputs to detect drift.

- [ ] **Step 2: Run focused test and confirm RED**

Run: `node --test test/public-pages-render.test.js`

Expected: FAIL because `src/public-pages/render.js` does not exist.

- [ ] **Step 3: Implement common layout and single form renderer**

Move the exact current form fields/options from `frontend/public/index.html` into `renderLeadForm()`. Render a hint only for an exact match:

```js
const hint = option.value === relatedSituation
  ? '<small class="choice-context">Relacionado con esta página</small>'
  : "";
```

Implement shared head, header, nav, breadcrumbs, hero, CTA, form, FAQ and footer. Preserve homepage structure/copy while rendering commercial sections from the catalog. Use common asset versions `styles.css?v=3.0.0`, `analytics.js?v=3.1.0` and `scripts.js?v=3.1.0`.

- [ ] **Step 4: Implement deterministic artifact generation**

Build all strings in memory, validate before writing, write UTF-8 in explicit order and include no timestamp/random/environment data. Add to `package.json`:

```json
"build": "node scripts/build-public-pages.js"
```

- [ ] **Step 5: Generate and confirm GREEN**

```powershell
npm run build
node --test test/public-pages-render.test.js
npm test
git diff --check
```

Expected: generated outputs synchronized and all tests PASS after updating only intentional homepage asset/page-type assertions.

- [ ] **Step 6: Commit**

```powershell
git add package.json src/public-pages/render.js scripts/build-public-pages.js test/public-pages-render.test.js frontend/public/index.html frontend/public/vender-propiedad-rapido.html frontend/public/vender-propiedad-con-deudas.html frontend/public/vender-propiedad-en-mal-estado.html frontend/public/sitemap.xml
git commit -m "feat: generate BRENA commercial pages"
```

---

### Task 3: Extend Analytics with the Exact Page Taxonomy

**Files:**
- Modify: `frontend/public/analytics.js`
- Modify: `frontend/public/scripts.js`
- Modify: `test/analytics.test.js`
- Modify: `test/frontend.test.js`
- Regenerate: the four public HTML files

**Interfaces:**
- `page_view.page_type` accepts exactly the four catalog values.
- `trackPageViewOnce(analytics, pageType)` receives the static value rendered on `<html data-page-type>`.
- The form analytics lifecycle and PII/UTM protections remain unchanged.

- [ ] **Step 1: Write failing analytics taxonomy tests**

Assert each approved value is accepted and `success`, `landing`, arbitrary values and PII-like values are rejected. Assert initialization reads `document.documentElement.dataset.pageType`, keeps pathname separate and emits one `page_view`.

- [ ] **Step 2: Run focused tests and confirm RED**

```powershell
node --test test/analytics.test.js test/frontend.test.js
```

Expected: FAIL because commercial page types are not accepted and initialization still hardcodes `landing`.

- [ ] **Step 3: Implement the closed taxonomy**

Replace the prior page-type values with the exact four-value allowlist. Pass the generated `data-page-type` value into `trackPageViewOnce`; never derive it from user input or arbitrary URL text. Keep unknown keys invalid and all existing safe-failure behavior.

- [ ] **Step 4: Regenerate and confirm GREEN**

```powershell
npm run build
node --test test/analytics.test.js test/frontend.test.js
npm test
```

Expected: focused and full suites PASS with inherited PII, UTM and confirmed-lead contracts unchanged.

- [ ] **Step 5: Commit**

```powershell
git add frontend/public/analytics.js frontend/public/scripts.js frontend/public/*.html test/analytics.test.js test/frontend.test.js
git commit -m "feat: classify BRENA commercial page analytics"
```

---

### Task 4: Serve Canonical Extensionless Routes

**Files:**
- Modify: `src/server.js`
- Modify: `test/seo-http-contract.test.js`
- Modify: `test/server.test.js`

**Interfaces:**
- Consumes `PAGES` from the catalog for the canonical route-to-file map.
- Canonical routes return their generated HTML with `200`.
- `.html` and trailing-slash aliases for P1 pages return one permanent redirect to the extensionless canonical URL.
- Redirects preserve only the five sanitized UTM parameters and discard PII or arbitrary query keys.

- [ ] **Step 1: Write failing HTTP contract tests**

Cover the three canonical P1 routes, their `.html` and trailing-slash aliases, combined HTTP/alternate-host aliases, safe UTM preservation, PII query removal, direct Render handling, and unchanged `/api/leads`, assets, `robots.txt`, `sitemap.xml`, `success.html` and health behavior.

- [ ] **Step 2: Run focused tests and confirm RED**

```powershell
node --test test/seo-http-contract.test.js test/server.test.js
```

Expected: FAIL because the P1 paths currently resolve as missing static documents.

- [ ] **Step 3: Implement catalog-driven routing**

Create route maps from `PAGES`; serve only canonical routes as documents and redirect aliases with the existing permanent status. Reuse the established canonical URL and safe-query helpers so no second redirect hop, open redirect or PII propagation is introduced.

- [ ] **Step 4: Confirm GREEN and regression**

```powershell
node --test test/seo-http-contract.test.js test/server.test.js
npm test
```

Expected: all routing contracts PASS without changing backend behavior.

- [ ] **Step 5: Commit**

```powershell
git add src/server.js test/seo-http-contract.test.js test/server.test.js
git commit -m "feat: serve canonical BRENA commercial routes"
```

---

### Task 5: Canonicalize Page Aliases at the Cloudflare Edge

**Files:**
- Modify: `cloudflare/worker.mjs`
- Modify: `test/cloudflare-worker.test.js`

**Interfaces:**
- Worker canonical page paths match the four catalog routes.
- P1 `.html` and trailing-slash aliases normalize to extensionless canonical paths.
- HTTP, `www`, Render and path alias normalization converge without loops or unnecessary chains.

- [ ] **Step 1: Write failing edge-routing tests**

Add parity assertions against the catalog and request tests for every P1 canonical path and alias under HTTPS, HTTP and alternate hosts. Assert one-hop convergence where edge-visible inputs permit it, HSTS only on HTTPS responses, safe UTM preservation and PII query removal.

- [ ] **Step 2: Run focused test and confirm RED**

Run: `node --test test/cloudflare-worker.test.js`

Expected: FAIL because the Worker only knows the legacy `/index.html` alias.

- [ ] **Step 3: Implement the minimal edge route tables**

Export immutable canonical and alias route tables, reuse the existing normalization and security-header code, and keep origin fetch semantics unchanged for canonical routes and technical endpoints.

- [ ] **Step 4: Confirm GREEN and server/edge parity**

```powershell
node --test test/cloudflare-worker.test.js test/seo-http-contract.test.js
npm test
```

Expected: Worker and server contracts PASS with no redirect loop or policy regression.

- [ ] **Step 5: Commit**

```powershell
git add cloudflare/worker.mjs test/cloudflare-worker.test.js
git commit -m "feat: canonicalize BRENA commercial routes at edge"
```

---

### Task 6: Complete Differentiated Content, Linking and Visual Integration

**Files:**
- Create: `test/public-pages-content.test.js`
- Modify: `src/public-pages/catalog.js`
- Modify: `src/public-pages/render.js`
- Modify: `frontend/public/styles.css`
- Regenerate: the four public HTML files

**Interfaces:**
- Homepage links naturally to all P1 pages; each P1 page links to `/` and `/#proceso`.
- Contextual P1-to-P1 links exist only where editorially useful.
- Every page has one H1, coherent heading hierarchy and unique substantive editorial content.
- Existing visual tokens, breakpoints, focus behavior and reduced-motion policy remain the source of truth.

- [ ] **Step 1: Write failing content and accessibility tests**

Parse generated HTML and assert:

- one H1, landmark structure, skip link, accessible nav and explicit form labels;
- all internal links resolve to a catalog route or a real fragment;
- homepage links to all three P1 routes and every P1 returns to homepage/process;
- no nested interactive elements;
- form control names and option values match the inherited contract;
- no option is preselected, and only fast/debt pages contain their approved visual hint;
- debt copy cites the approved official source, says it is general orientation and does not replace legal or financial advice;
- property-condition copy compares selling as-is, limited improvements and remodeling, using only the approved construction-experience statement;
- prohibited promises and unsupported commercial metrics/statistics are absent;
- long editorial blocks marked `data-page-editorial` are not duplicated between pages.

- [ ] **Step 2: Run focused test and confirm RED**

Run: `node --test test/public-pages-content.test.js`

Expected: FAIL on missing completed page structure, links or differentiated content.

- [ ] **Step 3: Implement the minimum catalog, renderer and CSS changes**

Complete the approved copy and shared components. Add only page-oriented classes needed by the shared visual system (`page-hero`, `breadcrumb`, content/evaluation/alternative grids, source note, situation-card actions and contextual choice hint). Reuse existing colors, typography, spacing, `900px`/`640px` breakpoints, focus styles and reduced-motion behavior; add no external asset or redesign.

- [ ] **Step 4: Generate, confirm GREEN and inspect drift**

```powershell
npm run build
node --test test/public-pages-content.test.js test/public-pages-render.test.js
npm test
git diff --check
```

Expected: content, link, form and accessibility contracts PASS and generated files are synchronized.

- [ ] **Step 5: Commit**

```powershell
git add src/public-pages/catalog.js src/public-pages/render.js frontend/public/styles.css frontend/public/*.html test/public-pages-content.test.js
git commit -m "feat: complete BRENA P1 commercial experience"
```

---

### Task 7: Document, Verify and Independently Review SEO-005

**Files:**
- Create: `docs/seo/implementation/2026-08-29-brena-web-seo-005-commercial-pages.md`
- Modify only if review finds a demonstrated defect: relevant source/test/generated files

- [ ] **Step 1: Write the implementation record**

Document scope, business constraints, catalog, generator, generated artifacts, route/alias behavior, form sharing, hints, metadata, sitemap, analytics, privacy, tests, build command, deployment exclusions and any post-deploy checks. Record the official debt-content source without copying extensive text.

- [ ] **Step 2: Run fresh automated verification**

```powershell
npm ci
npm run build
git diff --exit-code -- frontend/public
npm test
npm audit
git diff --check
git status --short
```

Expected: deterministic build clean, full suite PASS, zero vulnerabilities and no accidental files.

- [ ] **Step 3: Exercise the real local HTTP surface**

Start the existing server and verify desktop/mobile rendering plus an HTTP matrix for four canonical pages, aliases, assets, form submission contract, robots, sitemap, headers and absence of redirect loops. Do not submit a real lead or deploy.

- [ ] **Step 4: Request independent final code review**

Review the complete diff from `487a5754db6001256c7e59224673825f6c043e74` through current HEAD for visual divergence, duplicated form source, canibalization, repeated copy, stuffing, promises, improper legal/financial advice, routing/indexable aliases, canonical/sitemap errors, UTM/analytics/PII/CSP regressions and mobile/accessibility issues.

- [ ] **Step 5: Resolve valid findings with TDD**

For every defect, first add a focused failing test, confirm RED, implement the minimum correction, confirm GREEN and rerun the full suite. Commit review corrections separately with a descriptive message.

- [ ] **Step 6: Commit documentation and run final clean verification**

```powershell
git add docs/seo/implementation/2026-08-29-brena-web-seo-005-commercial-pages.md
git commit -m "docs: record BRENA SEO-005 implementation"
npm run build
git diff --exit-code
npm test
npm audit
git status --short
git rev-parse HEAD
```

Expected: 0 Critical and 0 Important open, clean worktree, no push/deploy and no SEO-006 work.
