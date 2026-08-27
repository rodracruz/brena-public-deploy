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

test("the production package builds a readable workbook without workspace-only tools", async (t) => {
  const projectDir = path.join(__dirname, "..");
  const packageJson = JSON.parse(await fs.readFile(path.join(projectDir, "package.json"), "utf8"));
  assert.match(packageJson.dependencies?.exceljs || "", /^\^?4\./);

  const dockerfile = await fs.readFile(path.join(projectDir, "Dockerfile"), "utf8");
  assert.match(dockerfile, /RUN npm ci --omit=dev/);

  const builderSource = await fs.readFile(
    path.join(projectDir, "scripts", "build-leads-workbook.mjs"),
    "utf8",
  );
  assert.doesNotMatch(builderSource, /^import .*@oai\/artifact-tool/m);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "brena-portable-workbook-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const workbookPath = path.join(directory, "Leads-Brena.xlsx");
  const writeWorkbook = createWorkbookWriter({
    nodeExecutable: process.execPath,
    scriptPath: path.join(projectDir, "scripts", "build-leads-workbook.mjs"),
  });
  await writeWorkbook({
    workbookPath,
    records: [{
      submissionId: "lead-portable",
      receivedAt: "2026-08-27T12:00:00.000Z",
      preview: false,
      lead: {
        nombre_propietario: "María Pérez",
        telefono: "+56912345678",
        problema_principal: "herencia",
        property: { comuna: "Ñuñoa" },
        privacy: { consent: true },
      },
    }],
  });

  const signature = await fs.readFile(workbookPath);
  assert.equal(signature.subarray(0, 2).toString("ascii"), "PK");
  const ExcelJS = require("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const sheet = workbook.getWorksheet("Leads");
  assert.equal(sheet.getCell("B5").value, "María Pérez");
  assert.equal(sheet.getCell("J5").value, "Ñuñoa");
  assert.equal(sheet.getCell("N5").value, "lead-portable");
});
