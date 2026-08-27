const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { once } = require("node:events");
const { spawn } = require("node:child_process");

function runPowerShell(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy", "Bypass",
      "-File", scriptPath,
      ...args,
    ], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("the Windows sync downloads an authenticated workbook atomically", async (t) => {
  const syncScript = path.join(__dirname, "..", "ops", "sync-render-leads.ps1");
  const installScript = path.join(__dirname, "..", "ops", "install-lead-sync.ps1");
  assert.equal(await fs.access(syncScript).then(() => true, () => false), true);
  assert.equal(await fs.access(installScript).then(() => true, () => false), true);
  const installer = await fs.readFile(installScript, "utf8");
  assert.match(installer, /RepetitionInterval/);
  assert.match(installer, /sync-render-leads\.ps1/);
  assert.doesNotMatch(installer, /-Token\s+/);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "brena-sync-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const token = "test-sync-token-with-at-least-32-characters";
  const tokenPath = path.join(directory, "token.txt");
  const destinationPath = path.join(directory, "Leads-Brena.xlsx");
  const workbookBytes = Buffer.from("PK\u0003\u0004remote-workbook");
  await fs.writeFile(tokenPath, token, "utf8");

  const server = http.createServer((request, response) => {
    assert.equal(request.headers.authorization, `Bearer ${token}`);
    response.writeHead(200, {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-length": workbookBytes.length,
    });
    response.end(workbookBytes);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const port = server.address().port;

  const result = await runPowerShell(syncScript, [
    "-ExportUrl", `http://127.0.0.1:${port}/admin/leads.xlsx`,
    "-TokenPath", tokenPath,
    "-DestinationPath", destinationPath,
  ]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.deepEqual(await fs.readFile(destinationPath), workbookBytes);
  assert.equal(await fs.access(`${destinationPath}.tmp`).then(() => true, () => false), false);
});

test("the Windows sync resolves its default paths under Windows PowerShell", async (t) => {
  const sourceScript = path.join(__dirname, "..", "ops", "sync-render-leads.ps1");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "brena-sync-defaults-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));

  const opsDirectory = path.join(root, "app", "ops");
  const runtimeDirectory = path.join(opsDirectory, "runtime");
  const copiedScript = path.join(opsDirectory, "sync-render-leads.ps1");
  const expectedWorkbook = path.join(root, "outputs", "01a03663-35f2-70e2-848d-af024af190de", "Leads-Brena.xlsx");
  const token = "test-default-token-with-at-least-32-characters";
  const workbookBytes = Buffer.from("PK\u0003\u0004default-path-workbook");

  await fs.mkdir(runtimeDirectory, { recursive: true });
  await fs.copyFile(sourceScript, copiedScript);
  await fs.writeFile(path.join(runtimeDirectory, "render-export-token.txt"), token, "utf8");

  const server = http.createServer((request, response) => {
    assert.equal(request.headers.authorization, `Bearer ${token}`);
    response.writeHead(200, {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-length": workbookBytes.length,
    });
    response.end(workbookBytes);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const result = await runPowerShell(copiedScript, [
    "-ExportUrl", `http://127.0.0.1:${server.address().port}/admin/leads.xlsx`,
  ]);
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.deepEqual(await fs.readFile(expectedWorkbook), workbookBytes);
});
