const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { createWorkbookWriter } = require("../src/workbook-writer");

test("passes lead records to the isolated workbook builder through standard input", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "brena-writer-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const scriptPath = path.join(directory, "builder.mjs");
  const capturePath = path.join(directory, "capture.json");
  await fs.writeFile(scriptPath, [
    'import fs from "node:fs/promises";',
    'let input = "";',
    'for await (const chunk of process.stdin) input += chunk;',
    'await fs.writeFile(process.env.CAPTURE_PATH, input);',
  ].join("\n"));

  const writeWorkbook = createWorkbookWriter({
    nodeExecutable: process.execPath,
    scriptPath,
    env: { ...process.env, CAPTURE_PATH: capturePath },
  });
  await writeWorkbook({
    records: [{ submissionId: "lead-1" }],
    workbookPath: path.join(directory, "Leads-Brena.xlsx"),
  });

  assert.deepEqual(JSON.parse(await fs.readFile(capturePath, "utf8")), {
    records: [{ submissionId: "lead-1" }],
    workbookPath: path.join(directory, "Leads-Brena.xlsx"),
  });
});

test("rejects when workbook generation exits unsuccessfully", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "brena-writer-error-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const scriptPath = path.join(directory, "builder.mjs");
  await fs.writeFile(scriptPath, 'process.stderr.write("cannot export"); process.exit(3);');
  const writeWorkbook = createWorkbookWriter({
    nodeExecutable: process.execPath,
    scriptPath,
  });

  await assert.rejects(
    writeWorkbook({ records: [], workbookPath: path.join(directory, "Leads-Brena.xlsx") }),
    /cannot export/,
  );
});
