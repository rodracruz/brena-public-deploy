"use strict";

const { runtimeConfig } = require("../src/config");

try {
  const config = runtimeConfig(process.env);
  if (!config.isProduction) throw new Error("NODE_ENV must be production for this check");
  process.stdout.write(JSON.stringify({
    ok: true,
    mode: config.mode,
    host: config.host,
    port: config.port,
    endpoint: config.endpoint ? new URL(config.endpoint).origin : null,
    trustProxy: config.trustProxy,
  }) + "\n");
} catch (error) {
  process.stderr.write(`Production configuration error: ${error.message}\n`);
  process.exitCode = 1;
}
