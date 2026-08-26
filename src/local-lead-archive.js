"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

function createLocalLeadArchive({ journalPath, workbookPath, workbookWriter } = {}) {
  if (!journalPath) throw new Error("journalPath is required");
  if (!workbookPath) throw new Error("workbookPath is required");
  if (typeof workbookWriter !== "function") throw new Error("workbookWriter is required");

  let queue = Promise.resolve();

  async function readRecords() {
    let contents;
    try {
      contents = await fs.readFile(journalPath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") return [];
      throw error;
    }
    return contents
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }

  async function updateWorkbook() {
    const records = await readRecords();
    await workbookWriter({ records, workbookPath });
  }

  async function saveOne(record) {
    await fs.mkdir(path.dirname(journalPath), { recursive: true });
    await fs.appendFile(journalPath, `${JSON.stringify(record)}\n`, "utf8");
    try {
      await updateWorkbook();
      return { journalSaved: true, workbookUpdated: true };
    } catch (workbookError) {
      return { journalSaved: true, workbookUpdated: false, workbookError };
    }
  }

  function enqueue(operation) {
    const result = queue.catch(() => {}).then(operation);
    queue = result;
    return result;
  }

  return {
    save(record) {
      return enqueue(() => saveOne(record));
    },
    sync() {
      return enqueue(async () => {
        try {
          await updateWorkbook();
          return { workbookUpdated: true };
        } catch (workbookError) {
          return { workbookUpdated: false, workbookError };
        }
      });
    },
  };
}

module.exports = { createLocalLeadArchive };
