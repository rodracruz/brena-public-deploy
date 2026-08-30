"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { PAGE_TYPES, PAGES, validateCatalog } = require("./catalog");
const { SITE_IDENTITY } = require("./site-identity");

const FORM_SOURCE = fs.readFileSync(path.join(__dirname, "fragments", "lead-form.html"), "utf8").trim();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLeadForm({ relatedSituation = null } = {}) {
  if (relatedSituation === null) return FORM_SOURCE;
  if (!new Set(["necesita_vender_rapido", "mora_hipotecaria"]).has(relatedSituation)) {
    throw new Error(`relatedSituation is not allowed: ${relatedSituation}`);
  }
  const pattern = new RegExp(`(value="${relatedSituation}"[^>]*><span>[^<]+</span>)`);
  return FORM_SOURCE.replace(pattern, '$1<small class="choice-context">Relacionado con esta página</small>');
}

function renderHead(page) {
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="theme-color" content="#f3efe7">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(page.canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_CL">
  <meta property="og:site_name" content="${escapeHtml(SITE_IDENTITY.name)}">
  <meta property="og:title" content="${escapeHtml(page.ogTitle)}">
  <meta property="og:description" content="${escapeHtml(page.ogDescription)}">
  <meta property="og:url" content="${escapeHtml(page.canonical)}">
  <meta property="og:image" content="/social-card.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css?v=3.0.0">
  <script src="/analytics-config.js" defer></script>
  <script src="/analytics.js?v=3.1.0" defer></script>
  <script src="/scripts.js?v=3.1.0" defer></script>
</head>`;
}

function renderHeader(page) {
  const home = page.route === "/";
  return `<header class="site-header" data-header>
    <div class="shell header-inner">
      <a class="brand" href="/" aria-label="Brena, inicio"><img src="/brena.png" width="500" height="115" alt="Brena Gestión Inmobiliaria"></a>
      <nav class="main-nav" aria-label="Navegación principal">
        <a href="${home ? "#situaciones" : "/#situaciones"}">¿Podemos ayudarte?</a>
        <a href="${home ? "#proceso" : "/#proceso"}">Cómo funciona</a>
        <a href="#preguntas">Preguntas</a>
      </nav>
      <a class="button button-small button-dark" href="#conversemos" data-analytics-cta-id="header_form" data-analytics-cta-location="header">Cuéntanos tu caso</a>
    </div>
  </header>`;
}

function renderHero(page) {
  const home = page.route === "/";
  return `<section class="${home ? "hero" : "page-hero"}" id="inicio" aria-labelledby="hero-title">
    <div class="shell ${home ? "hero-grid" : "page-hero-grid"}">
      <div class="hero-copy" data-reveal>
        ${home ? "<!-- página principal -->" : '<nav class="breadcrumb" aria-label="Migas de pan"><ol><li><a href="/">Inicio</a></li><li aria-current="page">Evaluación</li></ol></nav>'}
        <p class="eyebrow"><span></span> ${escapeHtml(page.eyebrow)}</p>
        <h1 id="hero-title">${escapeHtml(page.h1)}</h1>
        <p class="hero-lead">${escapeHtml(page.lead)}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#conversemos" data-analytics-cta-id="hero_form" data-analytics-cta-location="hero">Cuéntanos tu caso <span aria-hidden="true">↗</span></a>
          <a class="text-link" href="${home ? "#proceso" : "/#proceso"}" data-analytics-cta-id="hero_process" data-analytics-cta-location="hero">Conoce el proceso <span aria-hidden="true">↓</span></a>
        </div>
        <ul class="trust-list" aria-label="Características del servicio"><li><span aria-hidden="true">✓</span> Evaluación caso a caso</li><li><span aria-hidden="true">✓</span> Sin obligación</li><li><span aria-hidden="true">✓</span> Sin promesas previas</li></ul>
      </div>
      <div class="hero-visual" data-reveal><div class="hero-image-wrap"><img src="/${home ? "casa1.jpg" : "casa2.jpg"}" width="640" height="853" alt="Fachada de una vivienda" fetchpriority="high"></div><div class="hero-note"><span class="note-mark" aria-hidden="true">B.</span><p><strong>Primero entendemos.</strong><br>Después evaluamos.</p></div></div>
    </div>
  </section>`;
}

function renderHomepageBody() {
  return `<section class="recognition section" id="situaciones" aria-labelledby="situations-title">
    <div class="shell"><div class="section-heading section-heading-split" data-reveal><div><p class="eyebrow"><span></span> Cada propiedad tiene una historia</p><h2 id="situations-title">Hay situaciones que no se resuelven publicando un aviso.</h2></div><p>BRENA evalúa cada propiedad y, según sus condiciones, estructura una alternativa que puede incluir inversión directa, mejoramiento o remodelación previa a la venta y otras vías de comercialización.</p></div>
    <div class="situation-grid" data-reveal>
      <article class="situation-card"><span class="card-number">01</span><h3 class="card-title">Deuda hipotecaria</h3><p class="card-copy">Las obligaciones asociadas necesitan revisarse junto con el valor, los costos y el objetivo.</p><div class="situation-card-actions"><a href="#conversemos" data-select-situation="mora_hipotecaria" data-analytics-cta-id="situation_mortgage" data-analytics-cta-location="situations">Conversar</a><a href="/vender-propiedad-con-deudas">Entender la evaluación</a></div></article>
      <article class="situation-card"><span class="card-number">02</span><h3 class="card-title">Propiedad desocupada o deteriorada</h3><p class="card-copy">El estado y los costos pueden cambiar la alternativa que conviene comparar.</p><div class="situation-card-actions"><a href="#conversemos" data-select-situation="propiedad_abandonada" data-analytics-cta-id="situation_vacant" data-analytics-cta-location="situations">Conversar</a><a href="/vender-propiedad-en-mal-estado">Evaluar su condición</a></div></article>
      <article class="situation-card"><span class="card-number">03</span><h3 class="card-title">Herencia o copropiedad</h3><p class="card-copy">Hay varios propietarios, trámites pendientes o decisiones que necesitan ordenarse.</p><div class="situation-card-actions"><a href="#conversemos" data-select-situation="herencia" data-analytics-cta-id="situation_inheritance" data-analytics-cta-location="situations">Quiero conversar</a></div></article>
      <article class="situation-card"><span class="card-number">04</span><h3 class="card-title">Gastos acumulados</h3><p class="card-copy">Contribuciones, gastos comunes, servicios o reparaciones pesan sobre tu presupuesto.</p><div class="situation-card-actions"><a href="#conversemos" data-select-situation="falta_liquidez" data-analytics-cta-id="situation_expenses" data-analytics-cta-location="situations">Quiero conversar</a></div></article>
      <article class="situation-card"><span class="card-number">05</span><h3 class="card-title">Necesitas vender pronto</h3><p class="card-copy">El plazo importa, pero no debe ocultar costos, obligaciones ni alternativas.</p><div class="situation-card-actions"><a href="#conversemos" data-select-situation="necesita_vender_rapido" data-analytics-cta-id="situation_urgent_sale" data-analytics-cta-location="situations">Conversar</a><a href="/vender-propiedad-rapido">Revisar variables</a></div></article>
      <article class="situation-card situation-card-accent"><span class="card-number">06</span><h3 class="card-title">Tu caso es distinto</h3><p class="card-copy">No necesitas encajar en una categoría. Cuéntanos qué está pasando y lo revisamos contigo.</p><div class="situation-card-actions"><a href="#conversemos" data-select-situation="otro" data-analytics-cta-id="situation_other" data-analytics-cta-location="situations">Contar mi caso</a></div></article>
    </div></div>
  </section>
  <section class="process section" id="proceso" aria-labelledby="process-title"><div class="shell process-grid"><div class="process-intro" data-reveal><p class="eyebrow eyebrow-light"><span></span> Un proceso sin letra chica</p><h2 id="process-title">Claridad antes de cualquier decisión.</h2><p>No todas las propiedades ni todas las situaciones son iguales. Por eso no hacemos promesas antes de revisar los antecedentes básicos.</p><a class="button button-light" href="#conversemos" data-analytics-cta-id="process_form" data-analytics-cta-location="process">Empezar una conversación</a></div><ol class="steps" data-reveal><li><span class="step-number">01</span><div><h3>Nos cuentas qué está pasando</h3><p>Pedimos información básica sobre la propiedad, tu objetivo y el nivel de urgencia.</p></div></li><li><span class="step-number">02</span><div><h3>Revisamos el caso</h3><p>Ordenamos la información y determinamos qué antecedentes hacen falta.</p></div></li><li><span class="step-number">03</span><div><h3>Te damos una respuesta clara</h3><p>Explicamos si podemos ayudar, qué camino vemos y cuáles serían los próximos pasos.</p></div></li></ol></div></section>
  <section class="perspective section" aria-labelledby="perspective-title" itemprop="publisher" itemscope itemtype="https://schema.org/Organization" itemid="${escapeHtml(SITE_IDENTITY.organizationId)}"><link itemprop="url" href="${escapeHtml(SITE_IDENTITY.siteUrl)}"><link itemprop="logo" href="${escapeHtml(SITE_IDENTITY.logoUrl)}"><div class="shell perspective-grid"><div class="perspective-image" data-reveal><img src="/casa2.jpg" width="640" height="853" alt="Vista exterior de una vivienda contemporánea" loading="lazy"></div><div class="perspective-copy" data-reveal><p class="eyebrow"><span></span> <span itemprop="name">${escapeHtml(SITE_IDENTITY.name)}</span></p><h2 id="perspective-title">Una propiedad es más que un precio de publicación.</h2><p class="large-copy" data-page-editorial itemprop="description">${escapeHtml(SITE_IDENTITY.description)}</p><p>BRENA recibe solicitudes de propiedades en distintas regiones de Chile. Cada caso se evalúa individualmente y la viabilidad de intervención se confirma según ubicación, características de la propiedad y alternativa requerida.</p></div></div></section>`;
}

function renderCommercialBody(page) {
  return `<section class="section commercial-content" aria-label="Información para evaluar"><div class="shell content-grid">${page.sections.map((section) => `<article data-page-editorial><h2>${escapeHtml(section.title)}</h2>${(section.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join("")}${section.items ? `<ul class="evaluation-list">${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}</article>`).join("")}</div></section>
  <section class="section related-section" aria-labelledby="related-title"><div class="shell"><h2 id="related-title">Otras variables que pueden influir</h2><div class="alternative-grid">${page.relatedLinks.filter((route) => route !== "/").map((route) => { const related = PAGES.find((candidate) => candidate.route === route); return `<a href="${related.route}"><strong>${escapeHtml(related.h1)}</strong><span>Revisar esta situación</span></a>`; }).join("")}</div><p><a class="text-link" href="/">Volver a la evaluación general de BRENA</a></p></div></section>`;
}

function renderFaq(page) {
  const faqs = page.faqs.length ? page.faqs : [
    { question: "¿Brena compra todas las propiedades?", answer: "No. Primero revisamos la ubicación, el estado de la propiedad, las obligaciones pendientes y tu objetivo. Solo después podemos decirte si el caso encaja con lo que Brena puede resolver." },
    { question: "¿Puedo conversar si la propiedad tiene hipoteca o deudas?", answer: "Sí. Una hipoteca, contribuciones, gastos comunes u otras obligaciones no impiden una primera evaluación. Necesitamos conocerlas para entender correctamente el caso." },
    { question: "¿Tengo que reparar la propiedad antes?", answer: "No para la primera revisión. El estado actual es parte de la evaluación y no debes realizar gastos antes de que conversemos." },
    { question: "¿Cuánto demora el proceso?", answer: "Depende de la propiedad y de sus antecedentes. Evitamos prometer plazos sin información; después de la primera revisión podremos explicarte una ruta y tiempos estimados." },
    { question: "¿Debo enviar documentos ahora?", answer: "No. Para comenzar solo necesitamos los datos básicos del formulario. Si el caso puede avanzar, te diremos qué documentos son útiles y por qué." },
    { question: "¿Completar el formulario me obliga a vender?", answer: "No. El formulario autoriza a Brena a contactarte y revisar la información inicial. Cualquier decisión posterior requiere tu acuerdo expreso." },
  ];
  return `<section class="faq section" id="preguntas" aria-labelledby="faq-title"><div class="shell faq-grid"><div class="faq-intro" data-reveal><p class="eyebrow"><span></span> Antes de conversar</p><h2 id="faq-title">Preguntas honestas. Respuestas directas.</h2><p>La respuesta final depende de los antecedentes de cada propiedad.</p></div><div class="faq-list" data-reveal>${faqs.map((faq) => `<details><summary>${escapeHtml(faq.question)}<span aria-hidden="true">+</span></summary><p>${escapeHtml(faq.answer)}</p></details>`).join("")}${page.officialSource ? `<p class="source-note">Fuente oficial de referencia: <a href="${escapeHtml(page.officialSource.url)}" rel="noopener noreferrer">${escapeHtml(page.officialSource.label)}</a>. Consultada el 29 de agosto de 2026.</p>` : ""}</div></div></section>`;
}

function renderContact(page) {
  return `<section class="contact-section section" id="conversemos" aria-labelledby="contact-title"><div class="shell contact-grid"><div class="contact-copy" data-reveal><p class="eyebrow eyebrow-light"><span></span> Hablemos de tu propiedad</p><h2 id="contact-title">Cuéntanos lo esencial. Nosotros hacemos las preguntas correctas.</h2><p>Completar este formulario toma cerca de dos minutos. No necesitas tener documentos ni cifras exactas para comenzar.</p><ul><li><span aria-hidden="true">✓</span> Información tratada de forma confidencial</li><li><span aria-hidden="true">✓</span> Sin documentos para comenzar</li><li><span aria-hidden="true">✓</span> Sin obligación de continuar</li></ul></div><div class="form-card" data-reveal><div class="form-topline"><span data-step-label>Paso 1 de 2</span><div class="progress-track" aria-hidden="true"><span data-progress></span></div></div><!-- lead-form:start -->${renderLeadForm({ relatedSituation: page.relatedSituation })}<!-- lead-form:end --><div class="success-state" data-success-state tabindex="-1" hidden><span class="success-icon" aria-hidden="true">✓</span><p class="eyebrow"><span></span> Solicitud recibida</p><h3>Gracias por confiar en Brena.</h3><p>Recibimos tus datos. Nuestro equipo revisará la información antes de contactarte.</p><a class="text-link" href="#inicio">Volver al inicio <span aria-hidden="true">↑</span></a></div><details class="privacy-note" id="privacidad"><summary>Aviso de privacidad</summary><div><p><strong>Responsable:</strong> Brena Gestión Inmobiliaria.</p><p><strong>Finalidad:</strong> analizar tu solicitud inmobiliaria y contactarte para explicarte si Brena puede ayudarte. No solicitamos documentos ni datos financieros en esta etapa.</p><p><strong>Tus derechos:</strong> puedes solicitar acceso, rectificación, eliminación u oposición usando este mismo formulario e indicando “Privacidad” en el mensaje.</p><p>La información no se utiliza para decisiones automatizadas ni se entrega a terceros para fines publicitarios.</p></div></details></div></div></section>`;
}

function renderFooter(page) {
  const home = page.route === "/";
  return `<footer class="site-footer"><div class="shell footer-top"><div><img src="/brena.png" width="500" height="115" alt="Brena Gestión Inmobiliaria"><p>Soluciones claras para propiedades complejas.</p></div><nav aria-label="Navegación de pie de página"><a href="${home ? "#situaciones" : "/#situaciones"}">¿Podemos ayudarte?</a><a href="${home ? "#proceso" : "/#proceso"}">Cómo funciona</a><a href="#preguntas">Preguntas frecuentes</a><a href="#privacidad">Privacidad</a></nav></div><div class="shell footer-bottom"><p>© <span data-current-year>2026</span> Brena Gestión Inmobiliaria.</p><p>Chile</p></div></footer>`;
}

function renderPage(page, pages = PAGES) {
  validateCatalog(pages);
  if (!PAGE_TYPES.has(page.pageType) || !pages.some((candidate) => candidate === page)) throw new Error(`pageType or page is outside the validated catalog: ${page.pageType}`);
  return `<!doctype html>
<html lang="es-CL" data-page-type="${page.pageType}">
${renderHead(page)}
<body${page.route === "/" ? ` itemscope itemtype="https://schema.org/WebSite" itemid="${escapeHtml(SITE_IDENTITY.websiteId)}"` : ""}>
  ${page.route === "/" ? `<link itemprop="url" href="${escapeHtml(SITE_IDENTITY.siteUrl)}">
  <meta itemprop="name" content="${escapeHtml(SITE_IDENTITY.name)}">` : ""}
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  ${renderHeader(page)}
  <main id="contenido">${renderHero(page)}${page.route === "/" ? renderHomepageBody() : renderCommercialBody(page)}${renderFaq(page)}${renderContact(page)}</main>
  ${renderFooter(page)}
</body>
</html>
`;
}

function renderSitemap(pages = PAGES) {
  validateCatalog(pages);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${escapeHtml(page.canonical)}</loc></url>`).join("\n")}\n</urlset>\n`;
}

function buildArtifacts(pages = PAGES) {
  validateCatalog(pages);
  const artifacts = new Map();
  for (const page of pages) artifacts.set(page.outputFile, renderPage(page, pages));
  artifacts.set("sitemap.xml", renderSitemap(pages));
  return artifacts;
}

module.exports = { buildArtifacts, escapeHtml, renderLeadForm, renderPage, renderSitemap };
