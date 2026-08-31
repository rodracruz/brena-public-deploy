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

test("homepage renders the owner-approved copy from the local reference", () => {
  const home = artifacts.get("index.html");
  for (const statement of [
    "Conversación confidencial",
    "Respuesta clara",
    "Cuando una propiedad empieza a acumular costos, trámites o incertidumbre, necesitas entender tus alternativas antes de tomar una decisión.",
    "El dividendo o las obligaciones asociadas a la propiedad se volvieron difíciles de sostener.",
    "Propiedad desocupada",
    "La casa o departamento está vacío, deteriorándose o generando gastos todos los meses.",
    "Tu prioridad es tener una evaluación realista y avanzar sin meses de incertidumbre.",
    "Solo pedimos información básica para entender la propiedad, tu objetivo y el nivel de urgencia.",
    "El equipo Brena ordena la información y determina qué antecedentes hacen falta para evaluar alternativas reales.",
    "Te explicamos si podemos ayudarte, qué camino vemos y cuáles serían los próximos pasos. Tú decides si avanzar.",
    "Una mirada completa",
    "Una propiedad es más que un precio de publicación.",
    "También son deudas, costos mensuales, estado legal, tiempo disponible y las decisiones de las personas que están detrás.",
    "En Brena reunimos esos factores para comprender el caso completo. La primera conversación no te obliga a vender ni reemplaza asesoría legal o financiera independiente: te permite saber si existe un camino que valga la pena evaluar.",
    "Sin juicios",
    "Escuchamos la situación tal como es.",
    "Sin presión",
    "Tú decides si quieres continuar.",
    "Sin falsas certezas",
    "Evaluamos antes de prometer.",
    "Si tu pregunta no aparece aquí, puedes incluirla en el formulario. Revisaremos el contexto antes de responder.",
    "Brena Gestión Inmobiliaria.",
  ]) {
    assert.equal(home.toLocaleLowerCase("es-CL").includes(statement.toLocaleLowerCase("es-CL")), true, statement);
  }

  for (const route of [
    "/vender-propiedad-rapido",
    "/vender-propiedad-con-deudas",
    "/vender-propiedad-en-mal-estado",
  ]) assert.match(home, new RegExp(`href="${route}"`), route);

  assert.equal((home.match(/class="principles"/g) || []).length, 1);
  assert.equal((home.match(/<div><span>0[1-3]<\/span><strong>/g) || []).length, 3);
  assert.match(home, /<div class="image-caption"><span>Brena<\/span> Gestión inmobiliaria<\/div>/);
  assert.match(home, /<h3>Gracias por confiar en Brena\.<\/h3>/);
  assert.match(home, /<strong>Responsable:<\/strong> Brena Gestión Inmobiliaria\./);
  assert.match(home, /© <span data-current-year>2026<\/span> Brena Gestión Inmobiliaria\./);

  for (const prohibited of [
    /\bRUT\b|razón social|años de experiencia|certificad[oa]|testimonio/i,
    /mailto:|href="tel:|whatsapp/i,
    /Evaluación caso a caso|Sin promesas previas/i,
    /Evaluación inmobiliaria con una mirada económica y constructiva/i,
    /BRENA evalúa cada propiedad y, según sus condiciones/i,
  ]) assert.doesNotMatch(home, prohibited);
});

test("all pages preserve BRENA machine identity while homepage uses the local visible brand copy", () => {
  for (const page of PAGES) {
    const html = artifacts.get(page.outputFile);
    assert.match(html, /<meta property="og:site_name" content="BRENA">/);
    assert.match(html, /aria-label="BRENA, inicio"/);
    assert.equal((html.match(/alt="BRENA"/g) || []).length, 2);
    if (page.route === "/") {
      assert.match(html, /<h3>Gracias por confiar en Brena\.<\/h3>/);
      assert.match(html, /<strong>Responsable:<\/strong> Brena Gestión Inmobiliaria\./);
      assert.match(html, /© <span data-current-year>2026<\/span> Brena Gestión Inmobiliaria\./);
    } else {
      assert.match(html, /<h3>Gracias por confiar en BRENA\.<\/h3>/);
      assert.match(html, /<strong>Responsable:<\/strong> BRENA\./);
      assert.match(html, /© <span data-current-year>2026<\/span> BRENA\./);
    }
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
