"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const { PAGES } = require("../src/public-pages/catalog");
const { buildArtifacts, renderLeadForm, renderPage, renderSitemap } = require("../src/public-pages/render");

const expectedFiles = [
  "index.html",
  "vender-propiedad-rapido.html",
  "vender-propiedad-con-deudas.html",
  "vender-propiedad-en-mal-estado.html",
  "sitemap.xml",
];

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

test("renderer builds exactly four indexable pages and the sitemap", () => {
  const artifacts = buildArtifacts(PAGES);
  assert.deepEqual([...artifacts.keys()], expectedFiles);
  for (const page of PAGES) {
    const html = artifacts.get(page.outputFile);
    assert.match(html, new RegExp(`<html lang="es-CL" data-page-type="${page.pageType}">`));
    assert.match(html, new RegExp(`<title>${page.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</title>`));
    assert.match(html, new RegExp(`<link rel="canonical" href="${page.canonical}">`));
    assert.match(html, new RegExp(`<meta property="og:url" content="${page.canonical}">`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.equal((html.match(/id="lead-form"/g) || []).length, 1);
    assert.doesNotMatch(html, /<input[^>]+type="radio"[^>]+checked/i);
  }
});

test("homepage emphasizes only solución while preserving the complete heading text", () => {
  const artifacts = buildArtifacts(PAGES);
  const homepageHeading = artifacts.get("index.html").match(/<h1 id="hero-title">([\s\S]*?)<\/h1>/);
  assert.ok(homepageHeading);
  assert.equal(homepageHeading[1].replace(/<[^>]+>/g, ""), "Tu propiedad puede volver a ser una solución.");
  assert.equal((homepageHeading[1].match(/<em>/g) || []).length, 1);
  assert.match(homepageHeading[1], /una <em>solución\.<\/em>$/);

  for (const page of PAGES.slice(1)) {
    const heading = artifacts.get(page.outputFile).match(/<h1 id="hero-title">([\s\S]*?)<\/h1>/);
    assert.ok(heading, page.route);
    assert.doesNotMatch(heading[1], /<em>/, page.route);
  }
});

test("lead form is rendered from one source and hints never select an option", () => {
  const base = renderLeadForm({ relatedSituation: null });
  const fast = renderLeadForm({ relatedSituation: "necesita_vender_rapido" });
  const debt = renderLeadForm({ relatedSituation: "mora_hipotecaria" });
  const normalize = (markup) => markup.replace(/\s*<small class="choice-context">Relacionado con esta página<\/small>/g, "");

  assert.equal(normalize(fast), base);
  assert.equal(normalize(debt), base);
  assert.equal((fast.match(/choice-context/g) || []).length, 1);
  assert.equal((debt.match(/choice-context/g) || []).length, 1);
  assert.match(fast, /value="necesita_vender_rapido"[^>]*><span>Necesito vender pronto<\/span><small class="choice-context">/);
  assert.match(debt, /value="mora_hipotecaria"[^>]*><span>Deuda hipotecaria<\/span><small class="choice-context">/);
  for (const markup of [base, fast, debt]) {
    assert.doesNotMatch(markup, /\bchecked\b|aria-selected/);
    assert.match(markup, /method="post" action="\/api\/leads"/);
    assert.match(markup, /name="website"/);
    assert.match(markup, /name="consent"/);
  }
});

test("sitemap contains only the exact canonical catalog URLs", () => {
  const xml = renderSitemap(PAGES);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, PAGES.map(({ canonical }) => canonical));
  assert.equal(xml.includes("success.html"), false);
  assert.equal(xml.includes("index.html"), false);
  assert.equal(xml.includes("onrender.com"), false);
  assert.equal(xml.includes("<lastmod>"), false);
});

test("CLI generation is deterministic and tracked artifacts stay synchronized", () => {
  const first = fs.mkdtempSync(path.join(os.tmpdir(), "brena-pages-a-"));
  const second = fs.mkdtempSync(path.join(os.tmpdir(), "brena-pages-b-"));
  const script = path.join(__dirname, "..", "scripts", "build-public-pages.js");
  execFileSync(process.execPath, [script, first]);
  execFileSync(process.execPath, [script, second]);
  for (const filename of expectedFiles) {
    const a = fs.readFileSync(path.join(first, filename), "utf8");
    const b = fs.readFileSync(path.join(second, filename), "utf8");
    assert.equal(hash(a), hash(b), `${filename} must be deterministic`);
    assert.equal(a, fs.readFileSync(path.join(__dirname, "..", "frontend", "public", filename), "utf8"), `${filename} must be generated`);
  }
});

test("renderPage refuses definitions outside the validated catalog", () => {
  assert.throws(() => renderPage({ ...PAGES[0], pageType: "success" }, PAGES), /pageType/i);
});
