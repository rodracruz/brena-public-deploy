const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { createLocalLeadArchive } = require("../src/local-lead-archive");

function record(id, name) {
  return {
    submissionId: id,
    receivedAt: "2026-08-26T16:00:00.000Z",
    preview: true,
    lead: {
      nombre_propietario: name,
      telefono: "+56900000000",
      email: `${id}@example.test`,
      source: "web_publica",
      property: { region: "Región Metropolitana de Santiago", comuna: "Ñuñoa" },
      attribution: { channel: "website" },
    },
  };
}

async function tempPaths(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "brena-leads-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return {
    journalPath: path.join(directory, "Leads-Brena.jsonl"),
    workbookPath: path.join(directory, "Leads-Brena.xlsx"),
  };
}

test("appends every accepted lead and rebuilds the workbook from the complete journal", async (t) => {
  const paths = await tempPaths(t);
  const snapshots = [];
  const archive = createLocalLeadArchive({
    ...paths,
    workbookWriter: async (input) => snapshots.push(input),
  });

  await Promise.all([
    archive.save(record("lead-1", "Ana")),
    archive.save(record("lead-2", "Luis")),
  ]);

  const rows = (await fs.readFile(paths.journalPath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.deepEqual(rows.map((row) => row.submissionId), ["lead-1", "lead-2"]);
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[1].workbookPath, paths.workbookPath);
  assert.deepEqual(snapshots[1].records.map((row) => row.lead.nombre_propietario), ["Ana", "Luis"]);
});

test("keeps the lead in the journal when workbook generation fails and recovers on the next save", async (t) => {
  const paths = await tempPaths(t);
  let attempts = 0;
  const archive = createLocalLeadArchive({
    ...paths,
    workbookWriter: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("workbook locked");
    },
  });

  const first = await archive.save(record("lead-1", "Ana"));
  const second = await archive.save(record("lead-2", "Luis"));

  const journal = await fs.readFile(paths.journalPath, "utf8");
  assert.match(journal, /"submissionId":"lead-1"/);
  assert.match(journal, /"submissionId":"lead-2"/);
  assert.equal(first.journalSaved, true);
  assert.equal(first.workbookUpdated, false);
  assert.match(first.workbookError.message, /workbook locked/);
  assert.deepEqual(second, { journalSaved: true, workbookUpdated: true });
  assert.equal(attempts, 2);
});

test("synchronizes an existing journal into the workbook during startup", async (t) => {
  const paths = await tempPaths(t);
  await fs.writeFile(
    paths.journalPath,
    `${JSON.stringify(record("lead-existing", "Paula"))}\n`,
    "utf8",
  );
  let snapshot;
  const archive = createLocalLeadArchive({
    ...paths,
    workbookWriter: async (input) => {
      snapshot = input;
    },
  });

  assert.deepEqual(await archive.sync(), { workbookUpdated: true });
  assert.equal(snapshot.workbookPath, paths.workbookPath);
  assert.deepEqual(snapshot.records.map((row) => row.submissionId), ["lead-existing"]);
});
