"use strict";

const { spawn } = require("node:child_process");

function createWorkbookWriter({ nodeExecutable, scriptPath, env = process.env } = {}) {
  if (!nodeExecutable) throw new Error("nodeExecutable is required");
  if (!scriptPath) throw new Error("scriptPath is required");

  return function writeWorkbook(input) {
    return new Promise((resolve, reject) => {
      const worker = spawn(nodeExecutable, [scriptPath], {
        env,
        stdio: ["pipe", "ignore", "pipe"],
        windowsHide: true,
      });
      let stderr = "";
      let settled = false;

      worker.stderr.setEncoding("utf8");
      worker.stderr.on("data", (chunk) => {
        if (stderr.length < 8_192) stderr += chunk;
      });
      worker.on("error", (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });
      worker.on("close", (code) => {
        if (settled) return;
        settled = true;
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr.trim() || `Workbook builder exited with code ${code}`));
      });
      worker.stdin.end(JSON.stringify(input));
    });
  };
}

module.exports = { createWorkbookWriter };
