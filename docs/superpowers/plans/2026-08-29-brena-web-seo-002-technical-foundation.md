# BRENA-WEB-SEO-002 Technical Foundation Implementation Plan

> **For Codex:** Execute this plan in the current approved session using strict RED-GREEN-REFACTOR cycles. Do not start BRENA-WEB-SEO-003.

**Goal:** Make `https://brena.cl/` the only indexable public homepage, prevent personal data from propagating through URLs, and establish versioned crawl/security contracts without changing the public design or commercial content.

**Architecture:** Cloudflare Worker is the canonical public edge and performs one-hop protocol, host, path, and safe-query normalization before proxying. The Node origin remains the application/static server and provides defense in depth: it distinguishes canonical traffic forwarded by Cloudflare from direct Render document requests, applies request-aware security headers, and never makes the Render hostname a second indexable website. Versioned HTML, `robots.txt`, and `sitemap.xml` express the crawl contract. Client and server both strip URL credentials, query strings, and fragments from captured page/referrer metadata while UTM attribution remains in its existing allowlisted fields.

**Tech Stack:** Node.js 20+, built-in Node test runner and HTTP server, Cloudflare Worker module, static HTML/XML/text assets, npm lockfile.

---

## Task 1: Canonical edge routing and HSTS

**Files:**
- Modify: `test/cloudflare-worker.test.js`
- Modify: `cloudflare/worker.mjs`

- [ ] Add behavior tests proving HTTP, `www`, and `/index.html` converge directly to `https://brena.cl/` with status 308.
- [ ] Cover a safe UTM query that is retained and PII/unknown parameters that are discarded.
- [ ] Prove an already canonical HTTPS request is proxied without a redirect loop.
- [ ] Prove HSTS is added only to HTTPS responses and contains neither `includeSubDomains` nor `preload`.
- [ ] Run the focused test and record RED.
- [ ] Implement a single canonical-target calculation before proxying.
- [ ] Keep API methods/bodies intact and preserve existing origin `Location` rewriting.
- [ ] Run focused test GREEN, full suite, and inspect diff.
- [ ] Commit the coherent edge-routing change.

## Task 2: Origin defense, security-header policy, and HTTP contracts

**Files:**
- Create: `src/security-headers.js`
- Modify: `src/server.js`
- Modify: `test/server.test.js`
- Create: `test/seo-http-contract.test.js`

- [ ] Add integration tests proving canonical forwarded requests serve `/` as 200 while direct Render document requests redirect to the public domain.
- [ ] Prove `/index.html` redirects in one hop, safe attribution is retained, and PII-like query keys are discarded.
- [ ] Prove healthcheck/API paths remain usable for Render/Cloudflare operation.
- [ ] Prove HSTS is conditional on a trusted HTTPS signal, never emitted on HTTP, and the referrer policy is privacy-safe.
- [ ] Prove CSP has no wildcard, `unsafe-eval`, or speculative analytics domains and still permits current self-hosted assets/forms.
- [ ] Run focused tests RED.
- [ ] Centralize the header policy and implement request-aware headers.
- [ ] Add the minimum document-host canonicalization required to prevent an indexable Render copy without redirecting technical endpoints.
- [ ] Run focused tests GREEN, full suite, and inspect diff.
- [ ] Commit the coherent origin/security change.

## Task 3: Versioned crawl and document metadata contracts

**Files:**
- Modify: `frontend/public/index.html`
- Modify: `frontend/public/success.html`
- Create: `frontend/public/sitemap.xml`
- Create: `frontend/public/robots.txt`
- Modify: `test/seo-http-contract.test.js`
- Modify: `test/server.test.js`

- [ ] Add tests for exact absolute homepage canonical and canonical Open Graph URL.
- [ ] Add tests for UTF-8 HTML language/viewport/robots consistency.
- [ ] Add HTTP/parser tests for `robots.txt` and `sitemap.xml`, including correct media types and exactly one indexable URL.
- [ ] Add tests proving `/success.html` remains reachable for compatibility, is `noindex,follow`, and is absent from the sitemap.
- [ ] Run focused tests RED.
- [ ] Add the minimum metadata and static crawl files; do not invent `lastmod`.
- [ ] Run focused tests GREEN, full suite, and inspect diff.
- [ ] Commit the coherent crawl-contract change.

## Task 4: Remove personal data from URL context

**Files:**
- Modify: `test/frontend-behavior.test.js`
- Modify: `test/lead-contract.test.js`
- Modify: `test/seo-http-contract.test.js`
- Modify: `frontend/public/scripts.js`
- Modify: `frontend/public/index.html`
- Modify: `src/lead-contract.js`

- [ ] Add client test proving page/referrer metadata loses credentials, queries, and fragments while existing UTM fields remain separately allowlisted.
- [ ] Add server-contract test proving hostile or legacy clients cannot persist URL queries/fragments in lead metadata.
- [ ] Add document test proving the non-JavaScript fallback uses POST rather than GET.
- [ ] Run focused tests RED.
- [ ] Implement a small context-URL sanitizer in client and server and set explicit form method/action without changing the JavaScript JSON submission path.
- [ ] Run focused tests GREEN, exercise a real HTTP lead submission, run full suite, and inspect diff.
- [ ] Commit the coherent privacy change.

## Task 5: Documentation and controlled verification

**Files:**
- Create: `docs/seo/implementation/2026-08-29-brena-web-seo-002-technical-foundation.md`
- Modify only if necessary: tests above

- [ ] Document objective, scope, modified architecture, HTTPS/HSTS decisions, Render treatment, crawl files, success behavior, PII controls, CSP, tests, risks, and exact post-deploy checks.
- [ ] Run the Node server locally and issue controlled requests varying protocol signals, `Host`, forwarded host, paths, and safe/unsafe queries.
- [ ] Record which Cloudflare/Render behaviors remain `REQUIERE VERIFICACIÓN POST-DEPLOY` without deploying.
- [ ] Inspect the complete diff for scope, secrets, accidental files, and BRENA-V2 references.
- [ ] Commit documentation.

## Task 6: Independent review and final verification

- [ ] Load and use `superpowers:requesting-code-review` for an independent diff review focused on loops, open redirects, query handling, canonical/robots/sitemap consistency, success indexability, PII, CSP, host coupling, form regression, Worker/server divergence, and unrealistic mocks.
- [ ] For every valid finding, add or adapt a failing test, observe RED, implement the minimum correction, and observe GREEN.
- [ ] Run `npm test`, `npm audit`, all focused HTTP contract tests, `git diff`, and `git status` fresh.
- [ ] Verify branch, base, HEAD, commits, clean status, and absence of push/PR/deploy.
- [ ] Classify the result as GREEN only if production-dependent checks are unnecessary; otherwise use `GREEN con verificación post-deploy pendiente` and enumerate them.
