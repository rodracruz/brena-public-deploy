"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PAGES } = require("../src/public-pages/catalog");
const { buildArtifacts } = require("../src/public-pages/render");

const artifacts = buildArtifacts(PAGES);

test("all pages expose semantic landmarks, accessible form controls and valid internal targets", () => {
  const routeSet = new Set(PAGES.map(({ route }) => route));
  for (const page of PAGES) {
    const html = artifacts.get(page.outputFile);
    for (const landmark of ["header", "nav", "main", "footer"]) assert.match(html, new RegExp(`<${landmark}\\b`), `${page.route} ${landmark}`);
    assert.match(html, /class="skip-link" href="#contenido"/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.doesNotMatch(html, /<(?:a|button)\b[^>]*>\s*<(?:a|button)\b/i);
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      const [route, fragment] = href.split("#");
      if (/\.[a-z0-9]+$/i.test(route)) continue;
      if (route && route !== "/") assert.equal(routeSet.has(route), true, `${page.route} -> ${href}`);
      if ((!route || route === page.route) && fragment) assert.match(html, new RegExp(`id="${fragment}"`), `${href} target`);
    }
  }
});

test("homepage and commercial pages have the approved bidirectional link graph", () => {
  const home = artifacts.get("index.html");
  for (const route of [...PAGES].slice(1).map(({ route }) => route)) assert.match(home, new RegExp(`href="${route}"`));
  for (const page of PAGES.slice(1)) {
    const html = artifacts.get(page.outputFile);
    assert.match(html, /href="\/"/);
    assert.match(html, /href="\/#proceso"/);
  }
});

test("form contract and contextual hints remain exact across all surfaces", () => {
  const expectedNames = ["situation", "propertyType", "region", "commune", "urgency", "name", "phone", "email", "message", "website", "consent"];
  for (const page of PAGES) {
    const html = artifacts.get(page.outputFile);
    const form = html.match(/<!-- lead-form:start -->([\s\S]*?)<!-- lead-form:end -->/)[1];
    const names = [...new Set([...form.matchAll(/\bname="([^"]+)"/g)].map((match) => match[1]))];
    assert.deepEqual(names, expectedNames);
    assert.doesNotMatch(html, /\bchecked\b|aria-selected/);
    assert.equal((html.match(/data-success-state/g) || []).length, 1);
    assert.match(html, /data-success-state tabindex="-1" hidden/);
    assert.equal((html.match(/class="privacy-note"/g) || []).length, 1);
  }
  assert.equal((artifacts.get("vender-propiedad-rapido.html").match(/choice-context/g) || []).length, 1);
  assert.equal((artifacts.get("vender-propiedad-con-deudas.html").match(/choice-context/g) || []).length, 1);
  assert.equal((artifacts.get("vender-propiedad-en-mal-estado.html").match(/choice-context/g) || []).length, 0);
});

test("homepage preserves the established six situations, six FAQs and footer navigation", () => {
  const home = artifacts.get("index.html");
  assert.equal((home.match(/<article class="situation-card/g) || []).length, 6);
  const faq = home.match(/<div class="faq-list"[^>]*>([\s\S]*?)<\/div><\/div><\/section>/)[1];
  assert.equal((faq.match(/<details>/g) || []).length, 6);
  assert.match(home, /class="shell footer-top"/);
  assert.match(home, /aria-label="Navegación de pie de página"/);
  for (const target of ["#situaciones", "#proceso", "#preguntas", "#privacidad"]) assert.match(home, new RegExp(`href="${target}"`));
});

test("homepage trust section states only the approved identity and limits", () => {
  const home = artifacts.get("index.html");
  for (const statement of [
    "Evaluación inmobiliaria con una mirada económica y constructiva.",
    "BRENA evalúa propiedades complejas y estructura alternativas según las condiciones de cada caso.",
    "experiencia directa en construcción, mejoramiento y remodelación",
    "puede coordinar una visita presencial a la propiedad",
    "recibe solicitudes desde distintas regiones de Chile",
    "no garantiza compra, venta, precio, plazo ni valorización",
  ]) {
    assert.equal(home.toLocaleLowerCase("es-CL").includes(statement.toLocaleLowerCase("es-CL")), true, statement);
  }

  for (const prohibited of [
    /\bRUT\b|razón social|años de experiencia|certificad[oa]|testimonio/i,
    /mailto:|href="tel:|whatsapp/i,
  ]) assert.doesNotMatch(home, prohibited);
});

test("all pages use BRENA for canonical shared brand signals", () => {
  for (const page of PAGES) {
    const html = artifacts.get(page.outputFile);
    assert.match(html, /<meta property="og:site_name" content="BRENA">/);
    assert.match(html, /aria-label="BRENA, inicio"/);
    assert.equal((html.match(/alt="BRENA"/g) || []).length, 2);
    assert.match(html, /<h3>Gracias por confiar en BRENA\.<\/h3>/);
    assert.match(html, /<strong>Responsable:<\/strong> BRENA\./);
    assert.match(html, /© <span data-current-year>2026<\/span> BRENA\./);
  }
});

test("commercial content is differentiated and respects approved claim boundaries", () => {
  const fast = artifacts.get("vender-propiedad-rapido.html");
  const debt = artifacts.get("vender-propiedad-con-deudas.html");
  const condition = artifacts.get("vender-propiedad-en-mal-estado.html");
  assert.match(debt, /orientación general/i);
  assert.match(debt, /no reemplaza asesoría legal o financiera/i);
  assert.match(debt, /chileatiende\.gob\.cl/);
  assert.match(debt, /chileatiende\.gob\.cl\/fichas\/12155-cancelacion-de-los-registros-de-hipotecas-y-alzamiento-de-prohibiciones/);
  assert.match(condition, /experiencia directa en construcción, mejoramiento y remodelación/i);
  assert.match(condition, /Vender la propiedad en su estado actual/);
  assert.match(condition, /Realizar mejoras acotadas/);
  assert.match(condition, /remodelación cuando sus costos/);
  for (const html of [fast, debt, condition]) {
    assert.doesNotMatch(html, /venta garantizada|precio garantizado|mejor precio|somos líderes|\b\d+\s+años de experiencia|\b\d+%/i);
  }
  const editorial = [fast, debt, condition].map((html) => [...html.matchAll(/<article data-page-editorial>([\s\S]*?)<\/article>/g)].map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));
  assert.equal(new Set(editorial.flat()).size, editorial.flat().length);
});

test("shared stylesheet provides interior-page, hint, focus and responsive rules", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "frontend", "public", "styles.css"), "utf8");
  for (const selector of [".page-hero", ".breadcrumb", ".content-grid", ".alternative-grid", ".source-note", ".situation-card-actions", ".choice-context"]) {
    assert.match(css, new RegExp(selector.replace(".", "\\.")));
  }
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
