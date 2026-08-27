const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { runtimeConfig } = require("../src/config");

test("uses a safe preview configuration for local development", () => {
  assert.deepEqual(runtimeConfig({}), {
    environment: "development",
    isProduction: false,
    mode: "preview",
    host: "127.0.0.1",
    port: 3011,
    endpoint: "",
    token: "",
    timeoutMs: 5000,
    trustProxy: false,
    localArchiveEnabled: true,
    leadArchiveDir: path.resolve(__dirname, "..", "..", "outputs", "01a03663-35f2-70e2-848d-af024af190de"),
    spreadsheetNode: process.execPath,
    adminExportToken: "",
  });
});

test("allows the local Excel archive directory to be overridden", () => {
  const config = runtimeConfig({
    BRENA_LOCAL_LEADS_DIR: "C:\\Brena\\Leads",
    BRENA_SPREADSHEET_NODE: "C:\\Node\\node.exe",
    BRENA_ADMIN_EXPORT_TOKEN: "local-export-token",
  });
  assert.equal(config.leadArchiveDir, path.resolve("C:\\Brena\\Leads"));
  assert.equal(config.spreadsheetNode, "C:\\Node\\node.exe");
  assert.equal(config.adminExportToken, "local-export-token");
});

test("production refuses preview mode and missing BrenaV2 credentials", () => {
  assert.throws(
    () => runtimeConfig({ NODE_ENV: "production", BRENA_LEAD_MODE: "preview" }),
    /Production requires BRENA_LEAD_MODE=local or live/,
  );
  assert.throws(
    () => runtimeConfig({ NODE_ENV: "production", BRENA_LEAD_MODE: "live" }),
    /BRENA_V2_LEADS_URL is required/,
  );
  assert.throws(
    () => runtimeConfig({
      NODE_ENV: "production",
      BRENA_LEAD_MODE: "live",
      BRENA_V2_LEADS_URL: "https://app.brena.cl/api/public/leads",
    }),
    /BRENA_V2_API_TOKEN is required/,
  );
});

test("production accepts local intake only when the Excel archive is enabled", () => {
  assert.throws(
    () => runtimeConfig({
      NODE_ENV: "production",
      BRENA_LEAD_MODE: "local",
      BRENA_LOCAL_EXCEL_ENABLED: "0",
    }),
    /Local mode requires BRENA_LOCAL_EXCEL_ENABLED=1/,
  );

  const config = runtimeConfig({
    NODE_ENV: "production",
    BRENA_LEAD_MODE: "local",
    BRENA_LOCAL_EXCEL_ENABLED: "1",
    HOST: "127.0.0.1",
    TRUST_PROXY: "1",
  });
  assert.equal(config.mode, "local");
  assert.equal(config.localArchiveEnabled, true);
  assert.equal(config.endpoint, "");
  assert.equal(config.token, "");
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.trustProxy, true);
});

test("production accepts an HTTPS BrenaV2 intake endpoint", () => {
  const config = runtimeConfig({
    NODE_ENV: "production",
    BRENA_LEAD_MODE: "live",
    BRENA_V2_LEADS_URL: "https://app.brena.cl/api/public/leads",
    BRENA_V2_API_TOKEN: "secret-value",
    PORT: "8080",
    HOST: "0.0.0.0",
    TRUST_PROXY: "1",
    BRENA_V2_TIMEOUT_MS: "4500",
  });

  assert.equal(config.port, 8080);
  assert.equal(config.host, "0.0.0.0");
  assert.equal(config.trustProxy, true);
  assert.equal(config.timeoutMs, 4500);
  assert.equal(config.endpoint, "https://app.brena.cl/api/public/leads");
  assert.equal(config.localArchiveEnabled, false);
});

test("production rejects an insecure remote intake endpoint", () => {
  assert.throws(
    () => runtimeConfig({
      NODE_ENV: "production",
      BRENA_LEAD_MODE: "live",
      BRENA_V2_LEADS_URL: "http://app.brena.cl/api/public/leads",
      BRENA_V2_API_TOKEN: "secret-value",
    }),
    /must use HTTPS/,
  );
});

test("production checker accepts the local Excel intake configuration", () => {
  const result = spawnSync(process.execPath, [
    path.join(__dirname, "..", "scripts", "check-production-config.js"),
  ], {
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      BRENA_LEAD_MODE: "local",
      BRENA_LOCAL_EXCEL_ENABLED: "1",
      BRENA_V2_LEADS_URL: "",
      BRENA_V2_API_TOKEN: "",
      TRUST_PROXY: "1",
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    ok: true,
    mode: "local",
    host: "127.0.0.1",
    port: 3011,
    endpoint: null,
    trustProxy: true,
  });
});
