# Brena Local Server and Excel Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Brena from this PC through Cloudflare while durably capturing every questionnaire response in a migratable local journal and Excel workbook.

**Architecture:** The existing Node server runs in a production-safe `local` intake mode that does not require BrenaV2. Each validated questionnaire is appended to JSONL before a formatted workbook is rebuilt; Cloudflare Quick Tunnel supplies public HTTPS without opening a router port.

**Tech Stack:** Node.js 20+, Node test runner, PowerShell, Cloudflare Tunnel, `@oai/artifact-tool` spreadsheet runtime.

**Spec:** `docs/superpowers/specs/2026-08-26-brena-local-server-design.md`

## Global Constraints

- Publish only Brena; do not modify or run the CRCB deployment.
- Keep the Excel and JSONL files local and never expose them over HTTP.
- Do not lose an accepted questionnaire when the workbook is open or locked.
- Bind the origin to `127.0.0.1:3011`; do not add an inbound firewall or router rule.
- Preserve the complete journal and workbook during migration.

---

### Task 1: Production-local lead mode

**Files:**
- Modify: `test/brena-client.test.js`
- Modify: `test/production-config.test.js`
- Modify: `src/brena-client.js`
- Modify: `src/config.js`

**Interfaces:**
- Produces: `createBrenaClient({ mode: "local" }).submit(payload) -> { accepted: true, id: "local-...", preview: false }`
- Produces: `runtimeConfig(env)` accepting production local mode only with `BRENA_LOCAL_EXCEL_ENABLED=1`.

- [ ] Add a test proving local mode returns a durable local identity without calling `fetch`.
- [ ] Add configuration tests proving production local mode requires the Excel archive and no BrenaV2 credentials.
- [ ] Run the focused tests and confirm failures caused by unsupported `local` mode.
- [ ] Implement the smallest local-mode branches and rerun the focused tests.

### Task 2: Journal-first workbook resilience

**Files:**
- Modify: `test/local-lead-archive.test.js`
- Modify: `src/local-lead-archive.js`
- Modify: `src/server.js`
- Modify: `src/app.js`

**Interfaces:**
- Produces: `leadArchive.save(record) -> { journalSaved: true, workbookUpdated: boolean }`.
- Produces: `leadArchive.sync() -> { workbookUpdated: boolean }` for startup recovery.

- [ ] Change the locked-workbook test to require a successful durable append and a reported stale projection.
- [ ] Add a test proving `sync()` rebuilds the workbook from existing journal rows.
- [ ] Run the archive tests and confirm the current rejection/missing method failures.
- [ ] Separate durable append from workbook projection, serialize both, and log projection failures without returning an HTTP error after the journal succeeds.
- [ ] Rerun archive and server integration tests.

### Task 3: Proxy-aware abuse controls

**Files:**
- Modify: `test/server.test.js`
- Modify: `src/server.js`

**Interfaces:**
- Consumes: `cf-connecting-ip`, `x-forwarded-for`, and socket address.

- [ ] Add an integration test showing two Cloudflare client addresses receive independent rate-limit buckets.
- [ ] Run it and confirm the second address is incorrectly grouped before the change.
- [ ] Prefer the validated Cloudflare header only when proxy trust is enabled, then rerun server tests.

### Task 4: Windows operation and migration

**Files:**
- Create: `ops/start-brena-server.ps1`
- Create: `ops/stop-brena-server.ps1`
- Create: `ops/check-brena-server.ps1`
- Create: `ops/install-user-startup.ps1`
- Create: `ops/MIGRACION.md`
- Modify: `.gitignore`
- Modify: `README.md`

**Interfaces:**
- Produces: `ops/runtime/PUBLIC-LINK.txt`, logs, and exact process identifiers.

- [ ] Validate the explicit Node, spreadsheet dependency, Cloudflare, application, and data paths before launch.
- [ ] Start the application hidden in production-local mode and require a healthy localhost response.
- [ ] Start Cloudflare hidden, extract the generated HTTPS address, and require a public health response.
- [ ] Install a current-user logon launcher and document replacement-PC path rebinding.

### Task 5: End-to-end verification

**Files:**
- Modify only when a verified defect requires a test-first fix.

**Interfaces:**
- Consumes the public HTTPS address and produces browser, HTTP, journal, and workbook evidence.

- [ ] Run the full test suite and production-local configuration check.
- [ ] Submit a uniquely marked test questionnaire through Cloudflare and verify it in JSONL.
- [ ] Import, inspect, scan, and render the resulting workbook.
- [ ] Exercise the public form in a real browser at desktop and mobile sizes.
- [ ] Confirm the link remains healthy after the verification sequence.
