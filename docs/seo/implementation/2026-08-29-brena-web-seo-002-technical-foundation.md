# BRENA-WEB-SEO-002 — Fundación técnica

Fecha: 2026-08-29  
Repositorio: `rodracruz/brena-public-deploy`  
Base: `90da5cfa9e1e035bb8b5d0536464c530ae97919e`  
Dominio canónico: `https://brena.cl`

## Objetivo y alcance

Este ticket establece una única superficie pública indexable, contratos versionados de rastreo y controles para evitar que datos personales se propaguen por URLs. No rediseña la web, no cambia el contenido comercial, no incorpora analítica ni keywords, no modifica BRENA-V2 y no despliega.

## Arquitectura modificada

La solución usa dos capas complementarias:

1. `cloudflare/worker.mjs` es la autoridad de borde. Antes de consultar el origen resuelve protocolo, hostname, `/index.html` y parámetros de navegación en un solo redirect permanente.
2. `src/server.js` mantiene Render como origen operativo, pero redirige sus documentos públicos cuando una petición llega directamente. Las peticiones proxied por Cloudflare se reconocen por el contrato existente `X-Forwarded-Host: brena.cl`; `healthcheck`, API y export técnico no se convierten en redirects.

La política de headers quedó centralizada en `src/security-headers.js`. La metadata rastreable vive en HTML y los archivos `robots.txt`/`sitemap.xml` están en control de versión.

## HTTPS y canonicalización

- HTTP, `www`, `/index.html` y cualquier hostname que atraviese el Worker convergen mediante 308 hacia `https://brena.cl`.
- Se preservan exclusivamente `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` y `utm_term`, con 120 caracteres máximos por valor. Queries desconocidas o potencialmente personales se eliminan en redirects de navegación.
- El destino se construye desde una constante; no acepta un host o destino aportado por el usuario, por lo que no introduce un open redirect.
- Una petición ya canónica se entrega al origen sin redirect ni cadena adicional.
- `/index.html` converge directamente en `/`, también en la defensa del servidor.
- La homepage declara un único canonical absoluto y `og:url`, ambos `https://brena.cl/`.

## HSTS

El header es `Strict-Transport-Security: max-age=15552000` (180 días). Es suficientemente largo para establecer protección persistente, pero deja una ventana de reversión prudente antes de considerar un año. No usa `includeSubDomains` ni `preload` porque no existe un inventario validado de todos los subdominios.

El Worker lo agrega solo cuando la solicitud entrante ya usa HTTPS. El servidor lo agrega solo si `TRUST_PROXY=1` y el primer valor de `X-Forwarded-Proto` es `https`. Las respuestas HTTP locales/controladas no contienen HSTS.

## Tratamiento del origen Render

La opción implementada es **A: redirigir documentos públicos al dominio canónico**, manteniendo accesibles los endpoints técnicos requeridos por la arquitectura.

- Acceso directo a `/`, `/index.html` o `/success.html` con `Host: brena-public-deploy.onrender.com` redirige a `https://brena.cl`.
- Cuando Cloudflare llama a ese origen y declara `X-Forwarded-Host: brena.cl`, los documentos se sirven y no se genera un loop.
- `GET /healthcheck`, `POST /api/leads` y el export autenticado conservan su contrato, porque bloquearlos excedería SEO-002 y podría romper healthchecks o integración.

Esta defensa evita una copia indexable ordinaria, pero no equivale a autenticación criptográfica del origen. Restringir el origen de forma absoluta requeriría una credencial edge-origin o una regla de plataforma administrada; no se añadió ni inventó un secreto en este ticket.

## Sitemap y robots

- `GET /sitemap.xml` entrega XML UTF-8 y solo contiene `https://brena.cl/`.
- No incluye redirects, aliases, `success.html`, páginas técnicas ni `lastmod` inventado.
- `GET /robots.txt` entrega texto UTF-8, permite `/` y referencia `https://brena.cl/sitemap.xml`.
- Robots no se usa para proteger secretos y no bloquea CSS ni JavaScript.

## `success.html`

La confirmación actual del formulario es inline; `success.html` no participa en el flujo JavaScript observado. Se conservó por compatibilidad legacy, con `noindex, follow`, fuera del sitemap y sin canonical contradictorio. También se reemplazó la imagen inexistente por `/brena.png` y se retiró la fuente de Google que la CSP bloqueaba.

## PII y URLs

Antes, el formulario no declaraba método y `pageUrl`/`referrer` conservaban query y fragmento. Un fallback sin JavaScript podía serializar campos personales mediante GET y clientes normales podían enviar una URL que incluyera PII.

Después:

- el formulario declara `method="post" action="/api/leads"`;
- JavaScript mantiene su `POST` JSON existente y la confirmación inline;
- cliente y servidor aceptan solo URLs HTTP(S) y eliminan credenciales, query y fragmento de `pageUrl`/`referrer`;
- UTM permanece separada en la allowlist ya existente;
- redirects navegables conservan solo esa allowlist y nunca trasladan nombre, correo, teléfono, dirección u otros parámetros desconocidos.

No se añadió almacenamiento ni se modificó el backend BRENA-V2.

## CSP y headers

La CSP conserva el conjunto restrictivo actual: recursos, conexiones, formularios, scripts y estilos desde `'self'`; imágenes desde `'self'`/`data:`; `object-src 'none'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`. No contiene `*`, `unsafe-eval` ni dominios de GA4, GTM, Meta o Cloudflare añadidos preventivamente.

La fuente quedó centralizada en `src/security-headers.js` junto con:

- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin`, más restrictiva frente a queries;
- `Permissions-Policy` para cámara, geolocalización, micrófono, pagos y USB;
- `X-Frame-Options: DENY` como compatibilidad adicional a `frame-ancestors`.

BRENA-WEB-SEO-003 podrá modificar directivas concretas desde un único módulo después de elegir la herramienta de medición; 002 no habilita analítica.

## Pruebas TDD y verificación controlada

Baseline:

- `npm ci`: exit 0.
- `npm test`: 45/45.
- `npm audit`: 0 vulnerabilidades.

Se agregaron contratos que cubren redirects del Worker, ausencia de loops, HSTS condicionado, host canónico/origen, `/index.html`, canonical/OG, robots, sitemap, success noindex, CSP restrictiva, método del formulario y saneamiento doble de contexto URL. La regresión posterior a la implementación alcanzó 56/56 pruebas.

Además se levantó `src/app.js` localmente en modo preview, sin archivo ni transmisión de leads, y se ejecutaron peticiones HTTP reales con distintos `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto`, paths y queries. Se observaron:

- canonical proxied: 200 con HSTS y CSP;
- origen directo simulado: 308 a `https://brena.cl/`, UTM preservada y PII eliminada;
- `/index.html`: 308 directo a `/`;
- robots y sitemap: 200 con media types esperados;
- señal HTTP: 200 de origen controlado sin HSTS; en producción el Worker debe convertirla en 308 antes de entregar contenido.

## Riesgos y límites

- El repositorio no contiene un manifiesto `render.yaml`; parte de la configuración Render sigue fuera de Git.
- Cloudflare puede reemplazar `robots.txt` mediante su función administrada, según el baseline. El archivo versionado debe prevalecer o la función debe alinearse manualmente.
- El contrato `X-Forwarded-Host` entre Worker y Render está cubierto localmente, pero su propagación real depende de las plataformas.
- HSTS no cubre subdominios y no está en preload por decisión deliberada.
- La CSP continúa bloqueando el beacon analítico previamente inyectado por Cloudflare; resolver medición corresponde a BRENA-WEB-SEO-003.
- El fallback sin JavaScript hace POST a un endpoint JSON y recibirá 415 en lugar de confirmar el lead; su propósito en 002 es impedir PII en URL. Crear una experiencia no-JS completa queda fuera del alcance.

## REQUIERE VERIFICACIÓN POST-DEPLOY

Sin desplegar no puede demostrarse el comportamiento final de las plataformas. Después de un deployment autorizado se debe verificar exactamente:

1. `http://brena.cl/`, `http://brena.cl/index.html` y `http://brena.cl/success.html` responden 308 en un salto, preservan solo UTM segura y nunca entregan HTML/assets.
2. `https://www.brena.cl/...` converge en un salto y no hay loops.
3. HTTPS live contiene HSTS de 180 días; HTTP no lo emite; no aparecen `includeSubDomains` ni `preload`.
4. `https://brena-public-deploy.onrender.com/` y sus documentos redirigen, mientras una solicitud normal a `https://brena.cl/` no entra en loop y permanece 200.
5. El `X-Forwarded-Host` enviado por Worker llega a Node sin ser reemplazado por Render.
6. `robots.txt` live corresponde al archivo versionado y no a una variante administrada incompatible de Cloudflare.
7. `sitemap.xml` live responde 200 XML y solo lista la homepage.
8. La CSP live coincide con la política central, los assets cargan sin errores y el beacon de analítica sigue deliberadamente no habilitado.
9. Un lead sintético autorizado se envía por POST, confirma éxito real y no deja PII en location, history, referrer ni logs deliberados de aplicación.

No se ejecutó ninguna de estas verificaciones mediante deployment en este ticket.
