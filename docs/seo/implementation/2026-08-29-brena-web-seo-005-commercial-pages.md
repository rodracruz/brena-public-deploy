# BRENA-WEB-SEO-005 — Arquitectura y páginas comerciales P1

Fecha: 2026-08-29  
Base: `5ebc986f862ead06dacf302087bafc7e161f4e9b`  
Rama: `codex/brena-web-seo-005-commercial-pages`

## Objetivo y alcance

SEO-005 incorpora tres páginas comerciales P1 y mantiene la homepage como superficie de evaluación general. El cambio no rediseña BRENA, no incorpora nuevas modalidades comerciales, no crea páginas por comuna, artículos, schema, testimonios ni métricas no demostradas.

Las cuatro rutas indexables son:

- `/` — evaluación de propiedad compleja;
- `/vender-propiedad-rapido` — necesidad de evaluar una venta en plazo reducido;
- `/vender-propiedad-con-deudas` — obligaciones asociadas a la propiedad;
- `/vender-propiedad-en-mal-estado` — comparación entre vender como está, mejorar o remodelar.

`success.html` conserva su función técnica y `noindex, follow`; no pertenece al catálogo, sitemap ni taxonomía comercial.

## Arquitectura implementada

`src/public-pages/catalog.js` es el catálogo cerrado de contenido y metadata. Valida cuatro rutas, cuatro archivos, metadata única, canonical autorreferente, links registrados y solo dos correspondencias contextuales permitidas.

`src/public-pages/render.js` contiene el renderer compartido de head, header, navegación, hero, secciones, FAQ, CTA, formulario y footer. El contrato del formulario vive una sola vez en `src/public-pages/fragments/lead-form.html`, extraído sin cambiar campos, opciones, validaciones, endpoint, honeypot ni consentimiento.

`scripts/build-public-pages.js` produce de forma determinista y sin dependencias:

- cuatro documentos HTML versionados en `frontend/public`;
- `frontend/public/sitemap.xml` con exactamente las cuatro canonical.

El comando reproducible es `npm run build`. Las pruebas comparan dos builds por SHA-256 y también comparan el resultado temporal con los archivos versionados.

## Modelo de negocio y copy

El lenguaje público aprobado describe que BRENA evalúa cada propiedad y puede estructurar alternativas que incluyan inversión directa, mejoramiento o remodelación y otras vías de comercialización según el caso. No se comunica compra universal, modalidad única, cobertura nacional garantizada, venta, precio, valorización o plazo garantizados.

La página de condición usa únicamente la afirmación aprobada de experiencia directa en construcción, mejoramiento y remodelación, sin años, cifras, credenciales o resultados.

La página de deudas delimita orientación general y evaluación económica frente a confirmaciones de banco, acreedor, abogado u otro profesional. No entrega asesoría individual. La referencia oficial usada es [ChileAtiende — Cancelación de los registros de hipotecas y alzamiento de prohibiciones](https://www.chileatiende.gob.cl/fichas/12155-cancelacion-de-los-registros-de-hipotecas-y-alzamiento-de-prohibiciones), verificada y consultada el 29 de agosto de 2026.

## Routing y aliases

El servidor deriva el mapa ruta→archivo desde el catálogo. Las rutas canónicas sirven `200`; los aliases `.html` y trailing slash redirigen permanentemente a la ruta sin extensión. Solo se preservan `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` y `utm_term`; los parámetros arbitrarios o con PII no se propagan.

El Worker declara tablas explícitas equivalentes y las pruebas demuestran paridad con el catálogo. HTTP, `www`, Render directo y aliases convergen al origen canónico sin loops ni open redirects. Assets, `healthcheck`, `success.html` y `/api/leads` conservan su tratamiento técnico.

## Formulario y resaltado contextual

Las cuatro páginas incluyen el mismo formulario y backend `/api/leads`. Ningún radio se genera con `checked`, `selected` o `aria-selected`.

- venta rápida muestra `Relacionado con esta página` junto a `necesita_vender_rapido`;
- deuda muestra el indicador junto a `mora_hipotecaria`;
- homepage y mal estado no muestran indicador.

El indicador es texto auxiliar con estilo propio; no simula ni modifica una selección. El payload sigue dependiendo únicamente de la elección expresa del usuario.

## Analytics, atribución y privacidad

La allowlist `page_view.page_type` contiene exclusivamente:

- `homepage`;
- `commercial_fast_sale`;
- `commercial_debt`;
- `commercial_property_condition`.

Cada HTML declara su valor estático en `data-page-type`; `scripts.js` lo entrega al módulo central y mantiene `pathname` como dato separado. Se preservan last-touch de sesión, cinco UTM allowlisted, referrer reducido, eventos de CTA/formulario y la regla de emitir `generate_lead` solo después de creación confirmada.

Las pruebas heredadas de SEO-003 siguen bloqueando nombre, email, teléfono, dirección, texto libre, identificadores y claves arbitrarias. GA4 permanece deshabilitado; no se agregaron dominios externos ni se relajó CSP.

## SEO on-page e indexabilidad

Cada página tiene title, description, H1, canonical y Open Graph únicos. Los documentos declaran `lang=es-CL`, `index, follow`, charset y viewport. El sitemap no incluye `index.html`, aliases, `success.html`, Render ni `lastmod` inventado. `robots.txt` continúa permitiendo el contenido público y apuntando al sitemap canónico.

## Sistema visual y accesibilidad

Las páginas reutilizan logo, imágenes, paleta, tipografía, shell, botones, cards, formulario, footer, focus visible y reduced motion existentes. Solo se agregaron estilos para hero interior, breadcrumb, grillas editoriales, relaciones, fuente oficial y el indicador contextual.

La revisión controlada comprobó 1440×900 y 390×844: navegación responsive, un H1, landmarks, skip link, formulario único, cero preselecciones, hints correctos y ancho de documento igual al viewport en las cuatro rutas. No se observaron errores ni advertencias de consola.

## Pruebas

Se añadieron contratos para:

- catálogo cerrado y rechazo de definiciones inválidas;
- build determinista y sincronización de artefactos;
- formulario único y resaltado no selectivo;
- metadata, sitemap y contenido diferenciado;
- taxonomía analytics exacta;
- routing canónico en servidor y Worker;
- UTM segura y eliminación de PII en redirects;
- enlaces internos, semántica y estilos responsive.

Resultado final: `109/109` tests PASS y `npm audit` sin vulnerabilidades.

## Revisión independiente

La primera revisión detectó un fallo Critical en la transición visual posterior a un lead exitoso, tres findings Important sobre la privacidad y fidelidad de la homepage, la fuente oficial de la página de deudas y la navegación móvil, y un Minor documental. Las correcciones se implementaron mediante RED→GREEN:

- `showLeadSuccess()` valida el estado de éxito completo antes de ocultar el formulario y conserva un fallback seguro;
- las cuatro páginas recuperan el aviso de privacidad y el estado de éxito compartidos;
- la homepage conserva las seis situaciones, seis FAQ y navegación de footer del producto base;
- la página de deudas usa la ficha oficial vigente de ChileAtiende;
- el footer mantiene acceso navegable a las cuatro superficies en móvil;
- el resultado final fue comprobado en viewport móvil sin overflow ni errores de consola.

La re-revisión final concluyó con `0 Critical`, `0 Important` y `0 Minor` accionables después de actualizar esta evidencia documental.

## Riesgos y exclusiones

- Los cambios de Worker y Render no se despliegan en este ticket.
- El comportamiento productivo de aliases requiere la publicación coordinada posterior de ambos componentes.
- GA4 y Search Console continúan fuera de activación hasta completar las acciones externas ya documentadas en SEO-003.
- SEO-006 no fue iniciado.
