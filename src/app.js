"use strict";

const path = require("node:path");
const { createServer } = require("./server");
const { createBrenaClient } = require("./brena-client");
const { runtimeConfig } = require("./config");
const { createLocalLeadArchive } = require("./local-lead-archive");
const { createWorkbookWriter } = require("./workbook-writer");

const config = runtimeConfig();

const brenaClient = createBrenaClient({
  mode: config.mode,
  endpoint: config.endpoint,
  token: config.token,
  timeoutMs: config.timeoutMs,
});

const workbookPath = path.join(config.leadArchiveDir, "Leads-Brena.xlsx");
const leadArchive = config.localArchiveEnabled
  ? createLocalLeadArchive({
      journalPath: path.join(config.leadArchiveDir, "Leads-Brena.jsonl"),
      workbookPath,
      workbookWriter: createWorkbookWriter({
        nodeExecutable: config.spreadsheetNode,
        scriptPath: path.join(__dirname, "..", "scripts", "build-leads-workbook.mjs"),
      }),
    })
  : { save: async () => ({}), sync: async () => ({ workbookUpdated: true }) };

const server = createServer({
  publicDir: path.join(__dirname, "..", "frontend", "public"),
  brenaClient,
  leadArchive,
  trustProxy: config.trustProxy,
});

async function start() {
  const archiveStatus = await leadArchive.sync();
  if (archiveStatus.workbookUpdated === false) {
    console.warn("Local lead workbook could not be synchronized at startup; the journal remains authoritative.");
  }
  server.listen(config.port, config.host, () => {
    console.log(`Brena public web listening on http://${config.host}:${config.port} (${config.mode})`);
    if (config.localArchiveEnabled) console.log(`Local lead archive: ${workbookPath}`);
  });
}

start().catch((error) => {
  console.error(`Brena public web failed to start: ${error.message}`);
  process.exitCode = 1;
});

function shutdown(signal) {
  console.log(`${signal} received; closing Brena public web`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
