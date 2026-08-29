"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildArtifacts } = require("../src/public-pages/render");

const outputDirectory = path.resolve(process.argv[2] || path.join(__dirname, "..", "frontend", "public"));
const artifacts = buildArtifacts();
fs.mkdirSync(outputDirectory, { recursive: true });
for (const [filename, contents] of artifacts) {
  fs.writeFileSync(path.join(outputDirectory, filename), contents, "utf8");
}
