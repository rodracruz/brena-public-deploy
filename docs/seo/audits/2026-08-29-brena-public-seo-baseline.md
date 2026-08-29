# BRENA-WEB-SEO-001 — Línea base SEO de la web pública

Fecha de auditoría: 2026-08-29

Alcance: diagnóstico read-only de `https://brena.cl`; sin rediseño, implementación SEO, cambios de producto, despliegue ni intervención en BRENA-V2.

Base auditada: `deploy/main` en `3da29836f41573ecd3ab76f624dc285861a52143`.

## Resumen ejecutivo

La web pública de BRENA está operativa, contiene una propuesta de valor comprensible, entrega el contenido principal en HTML estático, tiene un formulario funcional protegido por validación, honeypot y rate limiting, y parte desde una base de rendimiento y accesibilidad de laboratorio favorable. No existe todavía un sistema SEO administrable y medible: falta normalizar HTTPS y URLs canónicas, controlar sitemap/robots desde el proyecto, retirar o gobernar una página de confirmación legacy, resolver la analítica Cloudflare bloqueada por CSP, implementar conversiones y definir una arquitectura de contenidos basada en investigación real.

El hallazgo más urgente es de seguridad y canonicalización: `http://brena.cl/` responde `200` y sirve el formulario de datos personales sin redirigir a HTTPS; tampoco se entrega HSTS. La prioridad recomendada es `BRENA-WEB-SEO-002: Fundación técnica`, con una primera subfase estricta de HTTPS/canonicalización/rastreo antes de cualquier expansión de contenidos.

Resultado agregado:

- Documentos HTML públicos distintos: **2** (`/` y `/success.html`).
- Alias/duplicados comprobados: `/index.html`, origen Render y versión HTTP de `/`.
- Hallazgos: **1 Critical, 8 Important, 6 Improvement**.
- Lighthouse 13.4.1, laboratorio: móvil 97/100 performance, 100/100 accessibility, 92/100 best practices, 100/100 SEO; escritorio 96/100, 100/100, 92/100 y 100/100 respectivamente. Estos scores no detectan varias fallas de arquitectura descritas en este informe.
- Estado de producto: no se modificó ningún archivo de producto.

## 1. Identificación inequívoca del repositorio

### Repositorio y checkout

| Campo | Evidencia verificada |
|---|---|
| Checkout fuente inspeccionado | `C:\Users\rodra\Documents\ChatGPT\Brena public Web` |
| Proyecto fuente dentro del checkout | `C:\Users\rodra\Documents\ChatGPT\Brena public Web\brena-main` |
| Nombre del paquete | `brena-public-web` 2.0.0 (`package.json:2-3`) |
| Remote fuente | `origin = https://github.com/rodracruz/brena-public-web.git` |
| Remote de producción | `deploy = https://github.com/rodracruz/brena-public-deploy.git` |
| Rama remota de producción | `deploy/main` |
| HEAD remoto de producción | `3da29836f41573ecd3ab76f624dc285861a52143` |
| Worktree del diagnóstico | `C:\Users\rodra\Documents\ChatGPT\.codex-worktrees\brena-public-web-seo-001` |
| Rama documental | `codex/brena-web-seo-001-diagnostico`, siguiendo `deploy/main` |

El checkout fuente tenía al comenzar la rama `codex/BRENA-SEO` en `a18d076d7a76e7b4b11ef23c5f6b19c38ef05d1a`, coincidente con `origin/master`, y dos entradas preexistentes no versionadas (`Brena-publica-v2.0.0.zip` y `outputs/`). No se tocaron. El remote de producción contiene el mismo árbol funcional aplanado: `git diff a18d076 deploy/main` mostró únicamente renombres 100% desde `brena-main/*` a la raíz, sin cambios de contenido.

### Prueba de correspondencia con `brena.cl`

La atribución al repositorio de producción no depende de un solo indicio:

1. `cloudflare/worker.mjs:1-2` declara `https://brena-public-deploy.onrender.com` como origen y `https://brena.cl` como canonical.
2. `cloudflare/worker.mjs:17-24` implementa el `301` de `www.brena.cl` al apex; producción respondió exactamente `301 Location: https://brena.cl/`.
3. DNS actual de `brena.cl` y `www.brena.cl` resolvió a direcciones anycast de Cloudflare; las respuestas incluyeron `Server: cloudflare` y `CF-Ray`.
4. La raíz productiva incluyó `x-render-origin-server: Render`; el origen declarado respondió `200` en `https://brena-public-deploy.onrender.com/`.
5. `index.html`, `styles.css`, `scripts.js`, `favicon.svg` y `social-card.svg` descargados desde producción coincidieron byte a byte y por SHA-256 con el checkout.
6. El Dockerfile que Render consume usa Node 22 Alpine, `npm ci --omit=dev`, copia `src`, `scripts` y `frontend/public`, expone 3011 y ejecuta `node src/app.js` (`Dockerfile:1-22`).
7. Evidencia histórica de despliegue del 2026-08-27 registró a Render clonando `https://github.com/rodracruz/brena-public-deploy`, rama `main`; la igualdad actual de assets demuestra que producción ya contiene el HEAD auditado. Esa evidencia histórica no sustituye una revisión futura de la cuenta Render.

Conclusión: el repositorio que alimenta Render es **`rodracruz/brena-public-deploy`**, rama **`main`**. El checkout `Brena public Web` es su fuente de trabajo; no es BRENA-V2.

### Framework, runtime y package manager

- Arquitectura: servidor HTTP de Node.js sin framework web, HTML/CSS/JavaScript vanilla y enhancement cliente.
- Runtime declarado: Node `>=20.18.0` (`package.json:14-15`); contenedor de producción `node:22-alpine` (`Dockerfile:1`).
- Runtime de esta auditoría: Node 24.16.0 y npm 11.13.0.
- Package manager efectivo: npm, porque existe `package-lock.json` y el Dockerfile ejecuta `npm ci`. También existe `yarn.lock`, pero no participa en la imagen; la coexistencia es una fuente de deriva.
- Dependencia runtime declarada: `exceljs ^4.4.0` (`package.json:17-18`).
- No hay React, Next.js, WordPress, SSR ni generador estático. El servidor entrega archivos existentes (`src/server.js:89-130`).

### Sistema de despliegue y dominio

- Origen: servicio Docker en Render, hostname público `brena-public-deploy.onrender.com`.
- Edge: Cloudflare Worker proxy (`cloudflare/worker.mjs`) y DNS proxied.
- Canonical deseado en código: `https://brena.cl`.
- `www`: redirect 301 al apex implementado por Worker.
- `robots.txt`: contenido administrado por Cloudflare, no por el repositorio.
- Web Analytics de Cloudflare: el edge inyecta un beacon, pero CSP lo bloquea; no se expone ningún identificador en este informe.
- No existe `wrangler.toml/json`, workflow CI/CD ni manifiesto Render versionado; rutas del Worker, auto-deploy, variables, disco y configuración de zona requieren cuenta humana para confirmarse.

## 2. Estado de instalación, build y pruebas

| Comando | Exit | Resultado | Observaciones |
|---|---:|---|---|
| `npm ci` | 0 | 97 paquetes instalados; 0 vulnerabilidades | Advertencias de paquetes transitivos deprecados: `inflight`, `lodash.isequal`, `rimraf@2`, `glob@7`, `fstream`. |
| `npm test` | 0 | 45 tests, 45 pass, 0 fail | Incluye servidor, seguridad, Cloudflare Worker, formulario, contrato de leads, rate limiting, archivo local y workbook. |
| `npm audit --audit-level=low` | 0 | 0 vulnerabilidades | Foto al 2026-08-29. |
| `npm run check:production` sin variables | 1 | Falla esperada: exige `NODE_ENV=production` | El worktree no contiene ni debe contener secretos/configuración live. |
| `npm run check:production` con configuración sintética segura `local` | 0 | `ok:true`, host `0.0.0.0`, puerto 3011, proxy confiable | Prueba el gate, no demuestra las variables actuales de Render. |
| Build de aplicación | N/A | No existe script `build` | La imagen Docker es el artefacto de build. No se construyó imagen para evitar ampliar el ticket. |
| Typecheck | N/A | No existe script/configuración | JavaScript sin TypeScript. |
| Lint | N/A | No existe script/configuración | Brecha de gate, no fallo de esta ejecución. |

`npm ci` produjo inicialmente una marca de cambio por normalización de line endings en `yarn.lock`; se inspeccionó y se restauró únicamente ese efecto generado por la instalación. El worktree volvió a quedar limpio antes de redactar este documento.

## 3. Inventario de páginas y rutas

Solo existen dos archivos HTML. Por esa cantidad no se creó el CSV opcional.

| URL | Archivo responsable | HTTP actual | Indexabilidad actual | Metadata y encabezados | Render inicial | CTA/enlaces | Imágenes y duplicados |
|---|---|---:|---|---|---|---|---|
| `https://brena.cl/` | `frontend/public/index.html`; `/` se resuelve a `index.html` en `src/server.js:97` | 200 | Indexable: `meta robots=index, follow`; sin canonical ni X-Robots-Tag | Title y description presentes (`index.html:6-9`); 1 H1 y jerarquía H2/H3 coherente; OG parcial; Twitter solo `card` | **Estático**: propuesta, FAQ, proceso y formulario están en el HTML inicial. JS solo añade interacción y envío. | CTA principal `#conversemos`; 15 enlaces, todos internos al mismo documento mediante fragmentos. Entradas: `www` 301, logo/menú/CTA internos. | `brena.png`, `casa1.jpg` eager/high priority, `casa2.jpg` lazy. `/index.html`, HTTP, UTM y origen Render entregan contenido equivalente sin canonical. |
| `https://brena.cl/success.html` | `frontend/public/success.html` | 200 | Indexable por omisión; sin meta robots ni X-Robots-Tag | Title genérico `Formulario Enviado`; sin description, canonical, OG/Twitter ni H1; solo H2 (`success.html:6-16`) | **Estático**, no SSR ni dependencia de estado real | Sin CTA y sin enlaces entrantes/salientes: página huérfana | Solicita `brena.jpg`, inexistente y 404. La confirmación real del flujo actual ocurre dentro de `/`, por lo que esta página es legacy y puede afirmar éxito sin envío. |

Rutas/alias comprobados:

- `https://brena.cl/index.html` → 200 con el mismo documento que `/`.
- `http://brena.cl/` → 200, sin redirect.
- `https://www.brena.cl/` → 301 a `https://brena.cl/`.
- `https://brena-public-deploy.onrender.com/` → 200 con el mismo sitio.
- `https://brena.cl/success` y una ruta aleatoria → 404 JSON real.
- `https://brena.cl/INDEX.html` → 404; el filesystem de producción es sensible a mayúsculas.
- `https://brena.cl//` → 500 de Cloudflare Worker, error 1101.
- Parámetros UTM → 200 y son capturados por el cliente; no existe canonical que consolide señales.

Endpoints no documentales:

- `GET /healthcheck` → 200 JSON, `no-store` (`src/server.js:209-212`).
- `POST /api/leads` → validación, rate limiting, envío y/o archivo (`src/server.js:221-284`).
- `GET|HEAD /admin/leads.xlsx` → existe solo si hay export configurado; producción respondió 401 sin credenciales, `no-store`.
- Rutas desconocidas → 404 JSON (`src/server.js:287-292`).

No se encontró evidencia de URLs históricas indexadas mediante las búsquedas públicas realizadas. “Sin resultados” no demuestra ausencia en Google; Search Console es la fuente necesaria.

## 4. Auditoría técnica

### A. Rastreo e indexación

- `robots.txt` responde 200, pero no existe en el repositorio. Cloudflare entrega un archivo administrado que permite `search=yes` y `Allow: /` para `User-agent: *`, bloqueando algunos crawlers de IA. Es configuración externa y puede variar sin commit.
- `sitemap.xml` responde 404.
- La home declara `index, follow`; `success.html` queda indexable por omisión.
- No existe X-Robots-Tag en HTML, JSON ni assets.
- No existe canonical en ninguna página.
- No se detectó `noindex` accidental en la home.
- Los únicos enlaces rastreables de la home son fragmentos de la misma URL. `success.html` es huérfana.
- El contenido principal y todos los textos comerciales están en HTML inicial, por lo que no dependen de ejecución JavaScript para ser comprendidos por un crawler.

### B. Dominio y URLs

- HTTPS funciona, pero HTTP no redirige y sirve el formulario completo.
- `www` redirige correctamente al apex en un salto.
- `/index.html` y el origen Render duplican la home.
- No hay canonical para consolidar HTTP/HTTPS, `/index.html`, parámetros ni origen.
- La ruta doble `//` causa 500 en el Worker.
- 404 aleatoria, `/success` y `/INDEX.html` devuelven 404 real; no hay soft 404 general.
- No se observaron cadenas ni loops en `www → apex`.
- No se pudo enumerar URLs antiguas desde Search Console porque requiere acceso del propietario.

### C. Metadata, headings e imágenes

Home:

- Title, description, idioma `es-CL`, favicon y un único H1 están presentes.
- Jerarquía observada: H1 → H2 por sección → H3 en pasos/estado de éxito.
- OG: type, locale, title, description e image; faltan `og:url` y `og:site_name`.
- `og:image` es relativa y SVG. Conviene validar compatibilidad social y migrar a un asset raster de dimensiones declaradas en un ticket futuro.
- Twitter solo declara `summary_large_image`; faltan title, description e image explícitos.
- Las cuatro imágenes de la home tienen `alt`; las de contenido declaran dimensiones y `casa2.jpg` usa lazy loading.

`success.html` carece de la mayoría de estos elementos y apunta a una imagen inexistente.

### D. Datos estructurados

- No existe ningún bloque `application/ld+json` ni microdata identificable.
- No hay `Organization`, `WebSite`, `BreadcrumbList` ni `LocalBusiness`.
- `Organization` y `WebSite` pueden evaluarse con datos validados. `LocalBusiness` queda prohibido hasta que Rodrigo confirme nombre legal/comercial, presencia pública, área/dirección y contactos aplicables.
- No corresponde agregar `BreadcrumbList` mientras exista una sola arquitectura comercial sin jerarquía real.

### E. Rendimiento

Lighthouse se ejecutó contra producción con Chrome y Lighthouse 13.4.1. Ambos JSON son válidos, tienen `runtimeError` vacío y fecha/URL correctas. El proceso CLI terminó con exit 1 únicamente al intentar borrar perfiles temporales bloqueados por Windows (`EPERM`) después de escribir los reportes; los resultados se aceptan como laboratorio y se documenta la limitación.

| Métrica | Móvil | Escritorio | Lectura |
|---|---:|---:|---|
| Performance | 97 | 96 | Base favorable de laboratorio. |
| FCP | 1.7 s | 0.9 s | Correcto en esta corrida. |
| LCP | 2.2 s | 1.1 s | Dentro de umbral “good” de laboratorio; no equivale a CrUX. |
| Speed Index | 3.3 s | 1.4 s | Principal descuento de performance. |
| TBT | 0 ms | 0 ms | JavaScript ligero. |
| CLS | 0 | 0 | Dimensiones de imágenes ayudan. |
| Respuesta documento | 966 ms | 484 ms | Variación de origen; vigilar cold starts de Render. |
| Transferencia total | 122 KiB | 228 KiB | Escritorio carga además `casa2.jpg`; móvil la mantiene lazy. |

INP no está disponible en esta auditoría: requiere interacción representativa o datos de campo. TBT 0 ms es un proxy de laboratorio, no un reemplazo de INP.

Desglose móvil: documento 7.2 KiB transferidos, CSS 6.3 KiB, JS propio 3.6 KiB, imágenes 106.8 KiB. Escritorio: imágenes 215.2 KiB. El repositorio contiene además imágenes no referenciadas de 1.8–3.5 MB; aumentan imagen Docker/contexto, no el peso inicial de la página.

Fortalezas:

- gzip activo para HTML/CSS/JS.
- `casa2.jpg` lazy; `casa1.jpg` se descubre en HTML y tiene `fetchpriority=high`.
- Sin JS/CSS no utilizado reportado por Lighthouse.
- TBT y CLS en cero.

Oportunidades verificadas:

- CSS render-blocking: ahorro estimado móvil 275 ms.
- Caché de assets en Cloudflare: 4 horas; Lighthouse estimó 78 KiB reutilizables con TTL más largo.
- Imágenes: ahorro estimado 18 KiB; logo sobredimensionado para su display y `casa1.jpg` puede usar formato/compresión moderna.
- En móvil el logo fue elemento LCP en la corrida y no tiene `fetchpriority=high`; esto debe validarse antes de cambiar prioridades para no competir con la imagen hero.

### F. Accesibilidad relacionada con SEO

Lighthouse obtuvo 100/100 en el estado inicial móvil y escritorio. La home usa `header`, `nav`, `main`, `footer`, enlace de salto, 1 H1, fieldsets/legends, labels reales, estados `role=status/alert`, foco en errores y soporte `prefers-reduced-motion` (`scripts.js:48-70`, `102-112`, `155-160`). No se detectó overflow horizontal en el viewport auditado.

Limitaciones:

- Lighthouse inicial no cubre por completo el paso 2 ni todos los estados dinámicos.
- Los mensajes específicos se escriben en elementos visualmente cercanos, pero los campos no reciben `aria-describedby`; sí reciben `aria-invalid` (`scripts.js:115-132`). Requiere prueba con lector de pantalla.
- `success.html` no tiene landmarks, H1 ni navegación.
- La página legacy solicita Google Fonts pero CSP permite solo `style-src 'self'` y `font-src 'self'`; además su logo falla. No forma parte del flujo actual.

### G. Seguridad y privacidad

Controles existentes:

- CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, Permissions Policy y Referrer Policy (`src/server.js:26-32`).
- Payload máximo 16 KiB, JSON obligatorio, validación server-side, honeypot y rate limiting (`src/server.js:11`, `221-252`).
- El token de BRENA-V2 permanece server-side (`src/config.js:25-26`; `src/brena-client.js:29-62`).
- El export de leads exige Bearer token y producción respondió 401 sin él.
- Escaneo de patrones comunes no encontró secretos versionados. Solo `.env.template` está trackeado. No se inspeccionaron ni expusieron valores de entornos reales.

Riesgos:

- HTTP sin redirect/HSTS expone el formulario a transporte no cifrado entre navegador y edge.
- El `<form>` no declara `method` ni `action` (`index.html:229`). Si JavaScript no carga, el fallback nativo es GET a la página y puede colocar datos personales en URL, historial y logs.
- El cliente captura `window.location.href` y `document.referrer` completos (`scripts.js:193-197`); el servidor valida el esquema pero conserva query strings (`lead-contract.js:147-165`). Parámetros no UTM con PII podrían quedar archivados.
- El hostname Render es público y sirve el sitio/API directamente. El Worker es la capa prevista, pero el origen no está bloqueado ni redirige al canonical. Si producción usa `TRUST_PROXY=1`, el servidor confía en `cf-connecting-ip` sin comprobar procedencia (`src/server.js:79-86`), lo que crea un riesgo condicional de evasión del rate limit por acceso directo. La configuración live no se infirió.
- No se observó CAPTCHA. El honeypot/rate limit puede ser suficiente inicialmente, pero debe medirse el spam antes de introducir fricción.

## 5. Medición y conversiones

| Capacidad | Estado comprobado | Implementable por código | Acción manual/externa |
|---|---|---|---|
| Google Search Console | No verificable; no hay tag/archivo de verificación y no existe sitemap | Generar sitemap, canonical y documentación de verificación | Crear/verificar propiedad de dominio, asignar accesos, enviar sitemap y revisar cobertura |
| Google Analytics 4 | Ausente en código/DOM | Añadir loader consent-aware y eventos acordados | Crear propiedad/stream, custodiar ID y validar DebugView/Realtime |
| Google Tag Manager | Ausente | Integrar contenedor si se elige GTM | Crear/publicar contenedor y gestionar permisos/versiones |
| Meta Pixel | Ausente | Integrable solo con base legal/consentimiento definidos | Crear pixel, configurar dominio/eventos y validar en cuenta |
| Cloudflare Web Analytics | Beacon inyectado por edge, bloqueado por CSP; Lighthouse best practices 92 | Alinear CSP o desactivar inyección y documentar alternativa | Confirmar setting, propiedad y recepción de datos en dashboard Cloudflare |
| Eventos de conversión | Ausentes | Emitir eventos de inicio, paso completado, error y lead aceptado sin PII | Definir nombres, conversiones y reporting en GA/GTM/Meta |
| Captura UTM | Implementada: allowlist de 5 claves (`scripts.js:3-18`) y normalización server-side | Mantener/testear; definir persistencia/reportes | Acordar nomenclatura de campañas |
| Formulario | Respuesta visual solo después de HTTP `response.ok` (`scripts.js:219-243`) | Instrumentar resultado y correlation ID no sensible | Validar destino real mediante prueba controlada y acceso al sistema receptor |
| WhatsApp/teléfono/correo | No existen CTAs públicos | Añadir solo cuando datos/canales sean confirmados | Entregar canales, horarios, responsables y política de atención |

La confirmación visible demuestra que el servidor público respondió éxito. El código solo responde éxito después de que el `brenaClient` del modo configurado acepta el payload y el archivo habilitado intenta guardarse (`src/server.js:255-283`). No prueba por sí sola que BRENA-V2 haya recibido un lead: el modo `local` acepta y archiva sin llamar a BRENA-V2 (`src/brena-client.js:29-31`). Evidencia histórica del 2026-08-27 mostró Render en modo `local`; como no se revisó hoy la cuenta ni se envió un lead real, el modo actual y la llegada end-to-end quedan **no verificados**.

## 6. Contenido y posicionamiento

### Ya presente

- Propuesta visible: soluciones para propietarios con deudas, propiedad desocupada, herencia/copropiedad, gastos o necesidad de vender pronto (`index.html:42-51`, `239-244`).
- Público objetivo implícito: propietarios/personas que controlan una propiedad en situación compleja.
- Proceso de tres pasos y expectativas prudentes: contar contexto, revisión y respuesta.
- FAQ con seis objeciones reales y sin promesas absolutas (`index.html:174-205`).
- Mensajes de confianza: conversación confidencial, sin obligación, sin documentos iniciales.
- Aviso de privacidad breve y consentimiento explícito (`index.html:336-364`).

### Ausente o insuficiente

- No existe investigación de palabras clave, mapa keyword→intención→URL ni evidencia de posiciones/volúmenes.
- No hay páginas comerciales por problema/intención/localidad; todos los enlaces quedan en la única landing.
- No hay contenidos informativos independientes ni estrategia editorial.
- No hay presentación verificable de empresa, razón social, equipo, experiencia, metodología detallada, casos reales, testimonios o reseñas.
- No hay enlaces externos a fuentes/credenciales ni enlazado interno entre documentos.
- `success.html` es contenido genérico y duplicable, sin utilidad de búsqueda.

Riesgos de afirmaciones que requieren respaldo operativo/legal:

- “Información tratada de forma confidencial”.
- “La información no se entrega a terceros para fines publicitarios”.
- “No se utiliza para decisiones automatizadas”.
- Plazo implícito de revisión/contacto, si se agrega en el futuro.

No se afirma que estas frases sean falsas. Antes de amplificarlas en SEO deben contrastarse con hosting, archivo, analítica, receptor de leads, proveedores y práctica real.

## 7. SEO local

| Dato/activo | Estado en sitio | Clasificación de acción |
|---|---|---|
| Nombre comercial | `Brena Gestión Inmobiliaria` aparece en alt, privacidad y footer | Codex puede normalizarlo cuando Rodrigo confirme forma oficial |
| Razón social | Ausente | Debe entregarla Rodrigo y validar si corresponde publicarla |
| Área de servicio | No declarada; el formulario lista las 16 regiones, lo que no demuestra cobertura real | Rodrigo debe definirla; Codex puede reflejarla después |
| Dirección pública | Ausente | Solo publicar si existe atención física y Rodrigo lo autoriza |
| Teléfono/correo | Ausentes | Rodrigo entrega canales; Codex implementa y mide CTAs |
| Horarios | Ausentes | Rodrigo define horario/capacidad real |
| Redes sociales | Sin enlaces; existe `ig.png` no utilizado | Rodrigo confirma perfiles oficiales; Codex enlaza |
| Google Business Profile | No verificable desde código | Acción manual: crear/reclamar, verificar, categorías, servicios y accesos |
| Schema local | Ausente | Codex implementa solo con datos reales y correspondencia visible |
| Consistencia NAP | No evaluable por falta de NAP | Requiere inventario externo y datos oficiales |

Separación operativa:

- **Codex:** HTML visible, metadata/schema validados, sitemap, enlaces, CTAs y tests.
- **Google/propietario:** propiedad Search Console, Business Profile, verificación, categorías, horarios, servicios y gestión de reseñas.
- **Rodrigo:** identidad publicable, área, canales, horarios, equipo, experiencia, casos y permisos.
- **Validación física:** fotografías propias, evidencia de oficina si se publica dirección, video/postal de Google si se solicita y obtención ética de reseñas reales.

## 8. Matriz contra la cotización

| Ítem | Estado | ¿Codex? | Dependencia externa/humana | Evidencia | Recomendación |
|---|---|---|---|---|---|
| 1. Desarrollo/preparación de página | **Parcial / redundante como “nueva web”** | Sí, para evolución puntual | Datos de empresa y decisiones de cuenta | Sitio existente, desplegado y funcional; 2 páginas | No reconstruir. Corregir fundación y extender solo tras keyword map. |
| 2. Auditoría SEO | **Implementado en línea base** | Sí | GSC/GA/Cloudflare para completar datos de campo | Este documento + Lighthouse/HTTP/git | Repetir tras 002/003 y mensualmente en formato reducido. |
| 3. Investigación de palabras clave | **Ausente** | Parcial: investigación/síntesis | Fuentes actuales, GSC, objetivos comerciales y aprobación | No hay documentos ni mapa en repo | Ejecutar 004 sin inventar volúmenes; conservar fuentes y fecha. |
| 4. SEO On-Page | **Parcial** | Sí | Keyword map y datos reales | Title/description/H1/FAQ presentes; canonical/schema faltan | Fundación en 002; optimización por intención después de 004. |
| 5. SEO de contenidos | **Parcial** | Sí | Casos, experiencia, revisión experta y aprobaciones | Landing + FAQ; sin páginas/artículos | Diseñar arquitectura en 005, no producir artículos en masa. |
| 6. SEO técnico | **Parcial** | Sí | Cloudflare/Render manual para edge/origen | Rendimiento bueno; HTTP/canonical/sitemap/analytics fallan | 002 primero. |
| 7. SEO local | **Ausente salvo nombre comercial** | Parcial | Datos, GBP, fotos, reseñas y validación física | Sin NAP, área, GBP ni schema | 006 después de datos oficiales. |
| 8. Seguimiento y medición | **Ausente / Cloudflare parcial roto** | Parcial | Cuentas, accesos y governance | Beacon bloqueado; sin GA/GTM/eventos/reporte | 003 para instrumentación; 007 para operación mensual. |

## 9. Hallazgos priorizados

### C-01 — El formulario se sirve por HTTP sin redirect ni HSTS

1. **Severidad:** Critical.
2. **Superficie:** dominio, privacidad, conversión e indexación.
3. **Esperado:** todo HTTP redirige 301/308 en un salto a `https://brena.cl`; HTTPS declara HSTS cuando la cobertura esté validada.
4. **Actual:** `http://brena.cl/` responde 200 y entrega el formulario; HTTPS no incluye `Strict-Transport-Security`.
5. **Evidencia:** `curl` 2026-08-29; Worker solo ramifica por hostname `www` (`cloudflare/worker.mjs:16-25`).
6. **Impacto:** datos personales pueden viajar sin TLS navegador→edge; duplicación HTTP/HTTPS; pérdida de confianza y señales.
7. **Recomendación:** redirect en edge, prueba de todos los hosts/rutas y HSTS gradual después de confirmar subdominios.
8. **Dependencias:** acceso Cloudflare; inventario de subdominios antes de `includeSubDomains`/preload.
9. **Ticket:** BRENA-WEB-SEO-002.
10. **Criterio de éxito:** matriz HTTP/HTTPS/www/apex retorna un único canonical sin loops; formulario nunca carga por HTTP.

### I-01 — Canonicalización incompleta y origen Render indexable

1. **Severidad:** Important.
2. **Superficie:** `/`, `/index.html`, UTM, HTTP y `onrender.com`.
3. **Esperado:** una URL indexable por contenido; aliases/origen redirigen o declaran canonical inequívoco.
4. **Actual:** `/`, `/index.html`, HTTP y origen Render responden 200 con contenido equivalente; no hay canonical.
5. **Evidencia:** respuestas live; `index.html:3-18` sin canonical; `cloudflare/worker.mjs:1-2` expone origen/canonical deseado.
6. **Impacto:** señales divididas, duplicados y bypass del edge.
7. **Recomendación:** canonical absoluto, redirects de `/index.html`, política de parámetros y protección/redirect del origen.
8. **Dependencias:** Render y Cloudflare; mantener healthchecks y API.
9. **Ticket:** BRENA-WEB-SEO-002.
10. **Criterio de éxito:** solo `https://brena.cl/` devuelve 200 indexable para la home.

### I-02 — Sitemap ausente y robots fuera de control de versión

1. **Severidad:** Important.
2. **Superficie:** rastreo y governance.
3. **Esperado:** sitemap válido, robots reproducible y referenciado, ambos probados.
4. **Actual:** `/sitemap.xml` 404; Cloudflare genera `robots.txt` sin archivo en repo.
5. **Evidencia:** HTTP live; ausencia en `frontend/public`; robots contiene marcador “Cloudflare Managed Content”.
6. **Impacto:** descubrimiento/gobierno manual y drift sin revisión de código.
7. **Recomendación:** versionar política deseada, acordar interacción con Managed Robots y publicar sitemap solo con URLs canónicas.
8. **Dependencias:** decisión de contenido Cloudflare; acceso GSC para envío.
9. **Ticket:** BRENA-WEB-SEO-002.
10. **Criterio de éxito:** robots y sitemap 200, sintácticamente válidos, coherentes y testeados.

### I-03 — `success.html` es huérfana, indexable, rota y no representa una conversión real

1. **Severidad:** Important.
2. **Superficie:** página de confirmación.
3. **Esperado:** confirmación ligada a un envío real; noindex o ruta transaccional gobernada; navegación/metadata válidas.
4. **Actual:** acceso directo 200 afirma envío; no tiene H1/canonical/robots/links; `brena.jpg` da 404; el flujo actual no navega allí.
5. **Evidencia:** `success.html:1-21`, `/brena.jpg` 404, `scripts.js:239-243` usa estado inline.
6. **Impacto:** thin/orphan content, falsa confirmación y experiencia rota.
7. **Recomendación:** retirar/redirigir o convertir en estado transaccional noindex con prueba de correlation ID; decidir una sola confirmación.
8. **Dependencias:** definición de medición de conversión.
9. **Ticket:** BRENA-WEB-SEO-002 y/o 003.
10. **Criterio de éxito:** no puede mostrarse éxito sin aceptación; no existe URL indexable rota.

### I-04 — No existe medición fiable de adquisición y conversiones

1. **Severidad:** Important.
2. **Superficie:** Cloudflare Analytics, GA/GTM/Meta, formulario y CTAs.
3. **Esperado:** pageviews y funnel medidos sin PII, con eventos versionados y validación en dashboards.
4. **Actual:** sin GA4/GTM/Meta/eventos; beacon Cloudflare inyectado pero bloqueado por `script-src 'self'`.
5. **Evidencia:** búsqueda de código sin trackers; Lighthouse `errors-in-console` e `inspector-issues` por beacon; CSP en `server.js:26-32`.
6. **Impacto:** no se puede atribuir tráfico, pérdidas del funnel ni retorno de mejoras.
7. **Recomendación:** elegir stack, resolver CSP de manera mínima, definir eventos/consentimiento y validar recepción.
8. **Dependencias:** cuentas y política de privacidad/cookies.
9. **Ticket:** BRENA-WEB-SEO-003.
10. **Criterio de éxito:** eventos de visita, pasos, errores y lead aceptado visibles en entorno de prueba sin PII.

### I-05 — Riesgo de PII en URL por fallback GET y captura de URLs completas

1. **Severidad:** Important.
2. **Superficie:** formulario, logs, historial y archivo de lead.
3. **Esperado:** degradación segura sin JS y atribución reducida a claves permitidas.
4. **Actual:** form sin method/action; `href` y referrer completos se envían y conservan con query strings.
5. **Evidencia:** `index.html:229`; `scripts.js:191-197`; `lead-contract.js:147-165`.
6. **Impacto:** datos introducidos o incluidos en URLs pueden persistir fuera de los campos previstos.
7. **Recomendación:** fallback POST seguro o bloqueo explícito, sanitización de URL a origen/path + allowlist UTM y pruebas de PII.
8. **Dependencias:** política de atribución y retención.
9. **Ticket:** BRENA-WEB-SEO-003, con hardening posible en 002.
10. **Criterio de éxito:** ningún dato de contacto aparece en URL/referrer archivado ni en navegación sin JS.

### I-06 — Origen Render público puede eludir controles del edge

1. **Severidad:** Important.
2. **Superficie:** `brena-public-deploy.onrender.com`, API y rate limiting.
3. **Esperado:** origen autenticado/restringido o normalizado al canonical; headers de cliente solo confiables desde Cloudflare.
4. **Actual:** origen 200 público; riesgo condicional si Render usa `TRUST_PROXY=1`.
5. **Evidencia:** HTTP live; `worker.mjs:27-47`; `server.js:79-86`; modo live no inspeccionado.
6. **Impacto:** duplicación, bypass de reglas Cloudflare y posible spoof del bucket de rate limit.
7. **Recomendación:** evaluar Authenticated Origin Pulls/secret de origen/host allowlist y modelo de proxy confiable.
8. **Dependencias:** capacidades Render/Cloudflare y healthcheck.
9. **Ticket:** BRENA-WEB-SEO-002.
10. **Criterio de éxito:** acceso directo no sirve contenido/API público o aplica controles equivalentes sin romper Render.

### I-07 — Arquitectura de contenidos limitada a una landing sin mapa de demanda

1. **Severidad:** Important.
2. **Superficie:** contenido comercial e informativo.
3. **Esperado:** cada URL responde a una intención validada y enlaza coherentemente.
4. **Actual:** una landing con anchors; sin keyword research, páginas comerciales ni contenidos independientes.
5. **Evidencia:** inventario de 2 HTML; 15 enlaces de home, todos fragmentos.
6. **Impacto:** cobertura temática y capacidad de posicionar intenciones específicas limitadas.
7. **Recomendación:** investigar primero; diseñar arquitectura solo con evidencia y capacidad real del negocio.
8. **Dependencias:** GSC, fuentes de keywords, objetivos y validación de Rodrigo.
9. **Ticket:** 004 antes de 005.
10. **Criterio de éxito:** mapa intención→URL aprobado, sin canibalización ni contenido inventado.

### I-08 — Falta identidad verificable y datos para confianza/SEO local

1. **Severidad:** Important.
2. **Superficie:** empresa, contacto y local.
3. **Esperado:** identidad y canales consistentes, visibles y respaldados.
4. **Actual:** solo nombre comercial; sin razón social, equipo, área, teléfono, correo, horario, redes, dirección, casos o reseñas.
5. **Evidencia:** HTML completo y tabla SEO local.
6. **Impacto:** menor confianza, E-E-A-T demostrable y elegibilidad/local relevance.
7. **Recomendación:** levantar datos oficiales y publicar solo lo verificable; gestionar GBP manualmente si aplica.
8. **Dependencias:** Rodrigo, fotografías, reseñas y posible validación física.
9. **Ticket:** BRENA-WEB-SEO-006.
10. **Criterio de éxito:** datos visibles consistentes con perfiles externos y schema, sin afirmaciones no demostradas.

### M-01 — No existen datos estructurados

1. **Severidad:** Improvement.
2. **Superficie:** home y futura arquitectura.
3. **Esperado:** schema mínimo válido y coincidente con contenido visible.
4. **Actual:** 0 bloques JSON-LD.
5. **Evidencia:** DOM y fuente.
6. **Impacto:** menor claridad de entidad y elegibilidad para enriquecimientos aplicables.
7. **Recomendación:** `Organization`/`WebSite` tras validar datos; no forzar `LocalBusiness`.
8. **Dependencias:** identidad oficial.
9. **Ticket:** 006 (o base mínima en 002).
10. **Criterio de éxito:** validación sintáctica y correspondencia campo por campo con contenido visible.

### M-02 — Metadata social incompleta

1. **Severidad:** Improvement.
2. **Superficie:** previews sociales.
3. **Esperado:** OG/Twitter completos, URLs absolutas y asset compatible/dimensionado.
4. **Actual:** sin `og:url/site_name`; Twitter incompleto; imagen OG relativa SVG.
5. **Evidencia:** `index.html:10-15`.
6. **Impacto:** previews inconsistentes.
7. **Recomendación:** completar con valores reales y probar en validadores.
8. **Dependencias:** asset aprobado.
9. **Ticket:** 002.
10. **Criterio de éxito:** preview estable en validadores principales.

### M-03 — Caché, respuesta e imágenes admiten optimización secundaria

1. **Severidad:** Improvement.
2. **Superficie:** home y edge.
3. **Esperado:** assets versionados con TTL largo, imágenes dimensionadas/modernas y TTFB estable.
4. **Actual:** TTL 4 h; móvil TTFB 966 ms; 18 KiB de ahorro de imagen estimado.
5. **Evidencia:** Lighthouse 13.4.1 y headers live.
6. **Impacto:** velocidad de repetición y variabilidad de LCP.
7. **Recomendación:** fingerprint/immutable, formatos modernos y monitoreo de cold start.
8. **Dependencias:** política de deploy/cache y plan Render.
9. **Ticket:** 002.
10. **Criterio de éxito:** presupuesto de transferencia y cache audit sin regresión de LCP/CLS.

### M-04 — Mensajes dinámicos del formulario requieren prueba accesible ampliada

1. **Severidad:** Improvement.
2. **Superficie:** formulario multipaso.
3. **Esperado:** cada error relacionado programáticamente y anunciado; teclado/lector cubren ambos pasos.
4. **Actual:** `aria-invalid` y resumen con foco existen; falta `aria-describedby` específico.
5. **Evidencia:** `scripts.js:115-160`; Lighthouse inicial 100.
6. **Impacto:** usuarios de lector pueden recibir resumen genérico sin asociación detallada.
7. **Recomendación:** IDs/describedby y pruebas de estados, no solo carga inicial.
8. **Dependencias:** ninguna externa.
9. **Ticket:** 003.
10. **Criterio de éxito:** navegación solo teclado y lector de pantalla pasan ambos pasos/errores/éxito.

### M-05 — Gates de calidad incompletos y doble lockfile

1. **Severidad:** Improvement.
2. **Superficie:** entrega y mantenibilidad.
3. **Esperado:** un package manager, lint y smoke/build reproducible en CI.
4. **Actual:** npm es efectivo pero `yarn.lock` coexiste; no hay build/lint/typecheck/CI; transitivos deprecados.
5. **Evidencia:** `package.json:8-18`, Dockerfile y salida `npm ci`.
6. **Impacto:** deriva y regresiones no cubiertas, aunque 45 tests pasan.
7. **Recomendación:** decidir lockfile, añadir lint/smokes SEO sin convertir el sitio a otro framework.
8. **Dependencias:** política de repositorio.
9. **Ticket:** 002.
10. **Criterio de éxito:** gates documentados y ejecutables con exit 0 desde checkout limpio.

### M-06 — Doble slash provoca error de Worker

1. **Severidad:** Improvement.
2. **Superficie:** URLs anómalas en edge.
3. **Esperado:** normalización/404 controlada, nunca 500.
4. **Actual:** `https://brena.cl//` devuelve Cloudflare 1101/500.
5. **Evidencia:** HTTP live; construcción de upstream en `worker.mjs:27`.
6. **Impacto:** errores ante enlaces mal formados y ruido de rastreo.
7. **Recomendación:** normalizar pathname y añadir matriz de tests.
8. **Dependencias:** Worker.
9. **Ticket:** 002.
10. **Criterio de éxito:** variantes de slash nunca generan 5xx.

## 10. Dependencias manuales y riesgos

### Acciones que Codex no puede completar autónomamente

- Confirmar/crear propiedades y permisos en Search Console, GA4, GTM, Meta y Cloudflare.
- Verificar que el beacon Cloudflare recibe datos después de una decisión de CSP.
- Consultar cobertura, consultas, posiciones, CWV de campo y conversiones históricas sin acceso a cuentas.
- Confirmar variables/modo actual de Render y recepción end-to-end sin una prueba autorizada que cree un lead técnico.
- Reclamar/verificar Google Business Profile.
- Inventar razón social, área, dirección, contactos, horario, equipo, casos, testimonios, reseñas, experiencia o metas.
- Producir fotografías reales, validación física o reseñas.
- Dar validación legal definitiva del aviso de privacidad o claims.

### Riesgos de proyecto

- Optimizar contenido antes del keyword map produciría canibalización o páginas sin demanda demostrada.
- Abrir CSP para “hacer funcionar analytics” sin allowlist estricta degradaría la postura de seguridad.
- Publicar schema local sin datos visibles/reales sería engañoso.
- Integrar directamente el navegador con BRENA-V2 expondría contratos/credenciales internas.
- Cambiar de framework o reconstruir el sitio no está justificado por esta línea base.
- Render sigue siendo origen operativo; suspensión/cold start afectan `brena.cl` aunque Cloudflare esté sano.

## 11. Propuesta de tickets

No se implementa ninguno en este diagnóstico.

### BRENA-WEB-SEO-002 — Fundación técnica

- **Objetivo:** asegurar HTTPS/canonicalización, rastreo controlado, metadata base, edge/origen y gates SEO sin rediseñar.
- **Dependencias:** acceso Cloudflare/Render; inventario de subdominios; decisión sobre `success.html` y Managed Robots.
- **Archivos probables:** `cloudflare/worker.mjs`, `src/server.js`, `frontend/public/index.html`, `frontend/public/success.html`, nuevos `frontend/public/robots.txt`/`sitemap.xml`, tests y `package.json`.
- **Pruebas:** matriz HTTP/HTTPS/www/apex/origin/slashes/index/404; canonical/robots/sitemap; headers; Lighthouse; tests actuales.
- **Cierre:** C-01, I-01, I-02, I-03, I-06 y M-02/M-03/M-05/M-06 resueltos o explícitamente aceptados, sin regresión 45/45.
- **Riesgo:** alto en routing/edge; medio en metadata/cache.
- **Fuera:** keywords, nuevas páginas, analytics de negocio, GBP e integración BRENA-V2.

### BRENA-WEB-SEO-003 — Medición y conversiones

- **Objetivo:** instrumentar un funnel sin PII y confirmar la aceptación real del lead.
- **Dependencias:** elección GA4/GTM/Cloudflare/Meta, IDs gestionados externamente, consentimiento y definición de conversiones.
- **Archivos probables:** `frontend/public/index.html`, `frontend/public/scripts.js`, `src/server.js`, `src/lead-contract.js`, tests y documentación de variables/eventos.
- **Pruebas:** eventos sin PII, CSP, consentimiento, UTM, estados de error/éxito, no-JS, accesibilidad dinámica y verificación en DebugView/dashboard.
- **Cierre:** funnel visible y versionado; envío técnico trazable desde página a destino autorizado; sin datos personales en analítica/URL.
- **Riesgo:** alto en privacidad y doble conteo; medio en CSP.
- **Fuera:** estrategia de keywords, artículos, scoring interno y cambios en BRENA-V2.

### BRENA-WEB-SEO-004 — Investigación y mapa de palabras clave

- **Objetivo:** construir demanda/intenciones/competencia y mapa keyword→URL con fuentes fechadas.
- **Dependencias:** objetivos/comunas/servicios reales, Search Console si existe y herramientas/fuentes aprobadas.
- **Archivos probables:** documentación nueva bajo `docs/seo/` y exportes no sensibles; sin producto inicialmente.
- **Pruebas:** trazabilidad de fuente/fecha, deduplicación, intención, canibalización y revisión humana.
- **Cierre:** mapa aprobado que distingue evidencia, estimaciones y términos descartados.
- **Riesgo:** medio por datos de terceros/estacionalidad.
- **Fuera:** escribir páginas o artículos, inventar volúmenes/posiciones.

### BRENA-WEB-SEO-005 — Arquitectura y páginas comerciales

- **Objetivo:** crear solo páginas justificadas por 004, con enlazado y mensajes respaldados.
- **Dependencias:** 002 cerrado, 004 aprobado, capacidades/servicios reales.
- **Archivos probables:** nuevos HTML bajo `frontend/public`, `index.html`, navegación, sitemap, server/redirects y tests.
- **Pruebas:** metadata/H1/canonical/schema por ruta, HTML inicial, enlaces, 404, responsive, accesibilidad y Lighthouse.
- **Cierre:** cada URL tiene intención única, CTA y evidencia; sin duplicación/canibalización.
- **Riesgo:** medio-alto en copy, routing y conversión.
- **Fuera:** blog masivo, rediseño, migración WordPress y claims no demostrados.

### BRENA-WEB-SEO-006 — Confianza y SEO local

- **Objetivo:** publicar identidad/confianza/local solo con datos y activos verificables.
- **Dependencias:** datos de Rodrigo, revisión legal, GBP, fotos/reseñas reales.
- **Archivos probables:** home/páginas de empresa/contacto, assets aprobados, schema y sitemap.
- **Pruebas:** consistencia NAP, schema validators, links de contacto/redes, accesibilidad y correspondencia visible.
- **Cierre:** entidad coherente sitio↔GBP↔perfiles, sin propiedades schema no visibles.
- **Riesgo:** alto reputacional/legal si los datos son incorrectos.
- **Fuera:** crear reseñas, simular oficina/equipo/casos o completar verificación física por Rodrigo.

### BRENA-WEB-SEO-007 — Reporte mensual

- **Objetivo:** cadencia reproducible de cobertura, consultas, landing pages, CWV y conversiones.
- **Dependencias:** 003, accesos GSC/GA/Cloudflare y definiciones KPI.
- **Archivos probables:** plantilla/versiones en `docs/seo/reports/` y scripts de importación sin credenciales.
- **Pruebas:** reconciliación entre fuentes, ventanas comparables, control de PII, evidencia y caveats.
- **Cierre:** primer reporte con baseline, cambios, causas demostradas, acciones y owner.
- **Riesgo:** medio por definiciones/datos incompletos.
- **Fuera:** automatizar decisiones o inventar causalidad/posiciones.

### BRENA-WEB-SEO-008 — Integración segura con BRENA-V2

- **Objetivo:** enviar leads públicos al contrato interno mediante servidor, con idempotencia/observabilidad/privacidad.
- **Dependencias:** 003, contrato BRENA-V2 aprobado, autenticación, ambientes y política de reintentos/retención.
- **Archivos probables públicos:** `src/brena-client.js`, `src/config.js`, `src/lead-contract.js`, `src/server.js` y tests. Cualquier cambio BRENA-V2 debe vivir en ticket/repositorio separado y explícitamente autorizado.
- **Pruebas:** contrato, auth server-side, timeouts, idempotencia, redacción, fallos parciales, rate limit, E2E autorizado y rollback.
- **Cierre:** lead técnico aparece una vez en destino, con correlation ID y sin secretos en cliente/logs.
- **Riesgo:** alto por datos personales y acoplamiento entre productos.
- **Fuera:** acceso directo browser→BRENA-V2, entidad Project nueva, cambios 009A/009B/010/TiketVisual y analítica con PII.

## 12. Orden recomendado y criterios globales

1. **002 Fundación técnica:** elimina exposición HTTP y estabiliza URLs/rastreo.
2. **003 Medición y conversiones:** establece una línea de datos antes de expandir.
3. **004 Investigación:** determina demanda real y vocabulario.
4. **005 Arquitectura/páginas:** implementa solo lo justificado.
5. **006 Confianza/local:** usa datos y activos oficiales.
6. **007 Reporte mensual:** opera mejora continua.
7. **008 Integración BRENA-V2:** avanza solo con contrato y autorización independientes; puede prepararse en paralelo después de 003, pero no debe bloquear el SEO público.

Criterios transversales: evidencia fechada, ninguna afirmación inventada, tests de rutas/metadata/headers, HTML inicial rastreable, accesibilidad de estados, ausencia de PII en analítica/logs/URLs, no regresión del formulario y separación estricta de BRENA-V2.

## 13. Cierre del diagnóstico

- Todos los hallazgos incluyen evidencia de código, git, HTTP, navegador o Lighthouse.
- Las inferencias condicionales están marcadas como tales; no se presenta el modo actual de Render, la existencia de GSC/GBP ni la recepción en BRENA-V2 como hechos.
- No se accedió a secretos ni se muestran identificadores de analítica/credenciales.
- No se modificó BRENA-V2 ni worktrees/ramas 009A, 009B, 010 o TiketVisual.
- No se modificó producto; el único cambio previsto es este documento.
- No se hizo push, PR, merge, rebase, squash ni despliegue.
- No se inició BRENA-WEB-SEO-002.
