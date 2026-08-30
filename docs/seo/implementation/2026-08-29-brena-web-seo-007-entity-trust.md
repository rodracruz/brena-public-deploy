# BRENA-WEB-SEO-007 — Entidad y confianza

Fecha: 2026-08-29  
Base productiva: `adf8f23478e9e8017a03c33185a0f77b4c17dbc7`  
Rama: `codex/brena-web-seo-007-entity-trust`

## Objetivo y alcance

SEO-007 incorpora una identidad pública mínima, verificable y consistente para BRENA, junto con datos estructurados ligados al HTML visible. No crea nuevas URLs, no cambia el modelo comercial, el formulario, analytics, routing, Worker ni sitemap.

La identidad pública sigue siendo la marca independiente `BRENA`. No se publican razón social, RUT, personas responsables, dirección, teléfono, correo, horario, redes sociales, cifras, años, certificaciones, testimonios ni un área de servicio rígida.

## Arquitectura

- `src/public-pages/site-identity.js` es la fuente central e inmutable de los seis datos autorizados: nombre, URL, identificadores estables de `WebSite` y `Organization`, logo y descripción.
- `src/public-pages/catalog.js` mantiene las cuatro páginas existentes y añade una etiqueta de breadcrumb específica a cada página P1.
- `src/public-pages/render.js` consume ambas fuentes y genera Microdata determinista dentro del HTML estático visible.
- Los cuatro HTML versionados se regeneran con `npm run build`; no existe renderizado de presentación en runtime.

## Structured data

La homepage contiene:

- un `WebSite` con `@id` equivalente `https://brena.cl/#website`, `url` y `name`;
- un `Organization` mínimo, enlazado como `publisher`, con `@id` equivalente `https://brena.cl/#organization`, `name`, `url`, `logo` y `description`.

Cada página P1 contiene un `BreadcrumbList` visible de dos posiciones: `Inicio` y la página actual. Homepage y `success.html` no contienen breadcrumbs estructurados.

Se mantuvo Microdata porque liga los datos al contenido visible y no requiere scripts inline, hashes CSP, `unsafe-inline`, `unsafe-eval` ni orígenes externos. No se añadieron `LocalBusiness`, `FAQPage`, `Service`, `Review`, `AggregateRating`, `Person` ni propiedades de identidad no autorizadas.

El Schema Markup Validator oficial procesó los cuatro HTML generados con cero errores y cero advertencias. Reconoció `WebSite` en homepage y `BreadcrumbList` en cada página P1; `Organization` queda anidada como `publisher` del sitio.

## Confianza e identidad visible

La homepage incorpora una sección institucional breve que comunica únicamente decisiones aprobadas:

- evaluación económica y constructiva caso a caso;
- alternativas que pueden incluir inversión directa, mejoramiento, remodelación o comercialización;
- experiencia directa general en construcción, mejoramiento y remodelación;
- posibilidad de visita presencial cuando la evaluación la requiere;
- recepción de solicitudes desde distintas regiones, con viabilidad confirmada individualmente;
- ausencia de garantías de compra, venta, precio, plazo o valorización.

La marca visible se normalizó a `BRENA` en accesibilidad del header, logos, mensaje de éxito, aviso de privacidad y footer. Las cuatro páginas incluyen `og:site_name="BRENA"`.

## CSP y seguridad

La política continúa sin cambios:

`default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'; upgrade-insecure-requests`

No se agregaron scripts inline, hashes, comodines, `unsafe-inline`, `unsafe-eval` ni dominios externos. También permanecen sin cambios Worker, servidor, analytics, contrato de leads, formulario compartido, robots, sitemap y `success.html`.

## Pruebas y validación

Los contratos añadidos comprueban:

- fuente central exacta, cerrada e inmutable;
- un solo `WebSite` y un solo `Organization` mínimo en homepage;
- ausencia de duplicación de entidad en páginas interiores y success;
- un `BreadcrumbList` visible y correcto por página P1;
- ausencia de tipos y propiedades schema no autorizados;
- copy institucional dentro de los límites aprobados;
- normalización de señales compartidas de marca;
- build determinista y artefactos sincronizados.

La revisión local en navegador cubrió las cuatro rutas a 1440×900 y 390×844. No se observó overflow horizontal ni errores o advertencias de consola; header, CTA, breadcrumb, formulario y footer conservaron el sistema visual vigente.

## Límites y acciones futuras

- `LocalBusiness` y Google Business Profile permanecen diferidos.
- El formulario sigue siendo el único canal público de contacto.
- La identidad debe reevaluarse cuando BRENA formalice razón social, responsables y canales empresariales.
- No se creó `/sobre-brena` ni se modificaron las cuatro URLs canónicas del sitemap.
- Activación externa o despliegue no forman parte del cierre local de este ticket.

## Criterio de cierre

GREEN local exige build determinista, suite completa y auditoría de dependencias aprobadas, CSP sin regresión, validación schema sin errores, revisión visual mínima aprobada, revisión independiente sin findings Critical o Important, y working tree limpio después de los commits.
