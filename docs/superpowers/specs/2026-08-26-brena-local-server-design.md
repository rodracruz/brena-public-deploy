# Brena Local Server and Excel Intake — Design Specification

## Objective

Publish only the Brena public website from this Windows PC for a one-week public test, retain every valid questionnaire response locally, and keep a human-readable Excel workbook synchronized with those responses. The deployment must be movable to a replacement PC without changing the application or losing data.

## Public address

The preferred permanent address remains `https://brena.cl`, but this deployment cannot change that Cloudflare zone because no Cloudflare account credentials or origin certificate are available on the PC. The test therefore uses a Cloudflare Quick Tunnel and its generated HTTPS `*.trycloudflare.com` address. The tunnel binds only to `127.0.0.1:3011`; the router and Windows firewall do not expose an inbound port.

The generated address is temporary and remains valid while the tunnel process remains alive. A named tunnel on `brena.cl` is a later migration step once DNS access exists.

## Questionnaire intake

The public form and validation contract stay unchanged. A new `local` lead mode represents a real accepted questionnaire whose durable destination is this PC rather than BrenaV2. It generates a local submission identifier, returns HTTP 201, and writes the same normalized Brena lead payload used by the future BrenaV2 integration.

The append-only JSONL journal is the source of truth. `Leads-Brena.xlsx` is a replaceable projection rebuilt from the complete journal. A response is accepted only after the journal append succeeds. If Excel has the workbook locked, the response remains accepted and the archive retries/rebuilds on the next synchronization; workbook generation failure must never erase the journal.

## Excel workbook

The workbook contains one `Leads` sheet with received timestamp, name, phone, email, situation, objective, urgency, property fields, message, campaign attribution, submission ID, operating mode, consent, and pipeline status. Dates and identifiers retain spreadsheet types and formats. The workbook is local-only and is never exposed through a public HTTP route because it contains personal information.

Workbook generation uses the bundled spreadsheet runtime selected explicitly by the server launcher. The launcher checks the runtime paths before starting so a missing dependency fails visibly instead of accepting forms without the Excel projection being available.

## Operations and migration

PowerShell launchers own the application and Cloudflare processes, logs, PID files, current public link, health checks, and user-logon startup. Configuration uses explicit absolute paths on this PC. The migration package consists of the source checkout, launchers, JSONL journal, and workbook; runtime paths are re-resolved on the replacement PC before launch.

The application listens on localhost only. Cloudflare terminates HTTPS. Proxy-aware rate limiting uses Cloudflare's connecting-IP header when present, then falls back to the standard forwarded address.

## Verification

- Red/green unit and HTTP integration tests for local lead mode, durable journal behavior, and Cloudflare client addresses.
- Full automated test suite and production-local configuration check.
- Public HTTPS health/static/form submission smoke tests through the generated tunnel.
- Import, inspect, formula-error scan, and visual render of the resulting `.xlsx`.
- Browser verification of desktop/mobile presentation and a real questionnaire submission through the public address.
