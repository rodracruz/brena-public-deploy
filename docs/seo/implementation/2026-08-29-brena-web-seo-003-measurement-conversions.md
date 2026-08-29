# BRENA-WEB-SEO-003 — Medición y conversiones

Fecha: 2026-08-29

Repositorio: `rodracruz/brena-public-deploy`

Base: `b3c47fa9801a8aaf5f34144fa609a7ca7e41ef35`

Estado de entrega: infraestructura implementada con proveedor externo deshabilitado.

## Objetivo y alcance

Este ticket incorpora medición centralizada de adquisición, CTA y funnel del formulario sin exponer PII. No activa GA4 en producción, no crea cookies, no reutiliza el consentimiento de contacto, no cambia diseño o contenido comercial y no modifica BRENA-V2.

## Arquitectura

La solución tiene tres límites explícitos:

1. `src/analytics-config.js` valida la configuración runtime. Solo un flag explícito y un Measurement ID con formato GA4 habilitan el proveedor.
2. `src/server.js` entrega `/analytics-config.js` como JavaScript same-origin, `no-store`, y `src/security-headers.js` deriva una CSP acorde al modo efectivo.
3. `frontend/public/analytics.js` es la única API analítica. Posee schemas, saneamiento, atribución de sesión y adaptador GA4. `frontend/public/scripts.js` solo emite eventos semánticos mediante esa API.

No existen llamadas directas a `gtag`, `dataLayer` ni endpoints de Google fuera del adaptador.

## Proveedor

Se eligió GA4 como primer adaptador porque permite analizar adquisición, landing, CTA y conversión con una taxonomía conocida, sin introducir la gobernanza adicional de un contenedor GTM. Cloudflare Web Analytics no se usa como proveedor de funnel porque no cubre estos eventos personalizados.

GA4 queda deshabilitada por defecto. Con la configuración actual:

- `/analytics-config.js` publica `enabled:false`, `provider:none` e ID vacío;
- no se crea `dataLayer`;
- no se carga `gtag.js`;
- no se envía tráfico externo;
- la CSP conserva exactamente sus orígenes de SEO-002.

El adaptador configurado usa `send_page_view:false`; la única page view procede de la capa central para evitar doble conteo.

Antes de `config` se encolan `ad_storage`, `ad_user_data`, `ad_personalization` y `analytics_storage` como `denied`. La configuración también deshabilita señales publicitarias, ignora el referrer automático y reemplaza `page_location` por `https://brena.cl` más el pathname saneado, sin query ni fragment. Esto deja el modo futuro sin cookies analíticas persistentes ni URLs completas; Google recibirá únicamente mediciones cookieless cuando Rodrigo autorice la activación externa.

## Eventos y payloads

Los campos de contexto `pathname` y UTM se agregan dentro de la capa central. Los callsites no construyen dimensiones arbitrarias.

| Evento | Condición | Payload emitido permitido |
|---|---|---|
| `page_view` | Inicialización real de la landing, una vez | `pathname`, `page_type`, cinco UTM, `referrer_domain` |
| `cta_click` | Click en elemento con identificadores declarativos | `pathname`, `cta_id`, `cta_location`, cinco UTM |
| `form_start` | Primer evento `input` o `change`, una vez | `pathname`, cinco UTM |
| `form_submit_attempt` | Validación local superada, inmediatamente antes del POST | `pathname`, cinco UTM |
| `generate_lead` | 2xx + `ok:true` + confirmación inequívoca de creación | `pathname`, `submission_status=created`, cinco UTM |
| `form_error` | Error local, de red o servidor | `pathname`, `error_type` (`validation`, `network`, `server`), cinco UTM |

Una clave desconocida invalida el evento completo. El fallo se absorbe y no afecta el producto.

No se implementan eventos de WhatsApp, teléfono ni correo porque esos CTA no existen.

## Confirmación de conversión

`form_submit_attempt` no ocurre si falla la validación local. El helper de envío lo registra antes del `fetch` real y clasifica los resultados:

- 4xx: `form_error=validation`;
- 5xx: `form_error=server`;
- excepción de red: `form_error=network`;
- 2xx sin evidencia de creación: no genera conversión;
- 2xx con confirmación: `generate_lead`.

La respuesta señuelo del honeypot es 2xx, pero carece de confirmación de creación y no cuenta como lead. Las respuestas `preview:true` tampoco cuentan. Se exige `preview:false`; el `submissionId` se consulta únicamente para distinguir esa confirmación, pero no se copia, transforma ni envía a analytics.

## Atribución

La estrategia es **last-touch de sesión**.

- Solo se consideran `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` y `utm_term`.
- Una URL con al menos una UTM válida reemplaza la atribución de sesión.
- Una navegación sin UTM reutiliza la atribución segura existente.
- La persistencia usa únicamente `sessionStorage` bajo una clave versionada.
- No se usan cookies ni `localStorage`.
- Storage malformado, con claves extrañas o valores inseguros se elimina.
- `utm_source` usa un vocabulario cerrado: `bing`, `facebook`, `google`, `instagram`, `linkedin`, `manual` o `newsletter`.
- `utm_medium` usa un vocabulario cerrado: `affiliate`, `cpc`, `display`, `email`, `organic`, `referral` o `social`.
- Campaña, contenido y término deben ser códigos ASCII no semánticos de 6 a 24 caracteres tras los prefijos `cmp_`, `cnt_` y `trm_` respectivamente.
- Valores como nombres, direcciones, correos ofuscados, teléfonos o texto libre se descartan en vez de sanearse parcialmente.
- Parámetros desconocidos, email, teléfono, nombre, `gclid` y cualquier otra query no entran al estado analítico.

El referrer se reduce a hostname HTTP(S) en minúsculas, sin `www`, credenciales, puerto, path, query ni fragment.

## Protección de PII

Los schemas no contienen campos para nombre, email, teléfono, dirección, RUT, deuda, monto, situación, texto libre, mensaje de error, URL completa, referrer completo o identificador de submission.

Las defensas son acumulativas:

1. allowlist de evento;
2. igualdad exacta de claves de entrada;
3. validadores enumerados o tokens acotados;
4. atribución construida solo dentro del módulo;
5. referrer derivado, nunca reenviado;
6. proveedor accesible solo después de validación central;
7. excepciones absorbidas.

La casilla actual del formulario autoriza contacto y tratamiento del lead. No se interpreta como consentimiento analítico.

## Configuración

Variables públicas necesarias para una activación futura:

```text
BRENA_ANALYTICS_ENABLED=1
BRENA_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

En el cierre de SEO-003 `BRENA_ANALYTICS_ENABLED` debe permanecer en `0` o ausente y no debe existir un ID inventado.

Una configuración incompleta o inválida degrada a modo deshabilitado sin impedir que el servidor arranque ni que el formulario opere.

## CSP

Modo deshabilitado, sin cambios respecto de SEO-002:

- `script-src 'self'`;
- `connect-src 'self'`.

Modo GA4 válido y explícito:

- añade solo `https://www.googletagmanager.com` a `script-src`;
- añade solo `https://www.google-analytics.com` y `https://region1.google-analytics.com` a `connect-src`.

No se añaden `*`, `unsafe-eval`, Meta, Cloudflare beacon ni dominios preventivos. El resto de directivas y headers permanece intacto.

## Search Console

No se encontró un token real y no se agregó metadata ni archivo ficticio.

La propiedad recomendada es de dominio para `brena.cl`. La acción manual será crear o confirmar la propiedad, verificarla mediante el método entregado por Google, conceder acceso operativo y enviar `https://brena.cl/sitemap.xml`.

## Pruebas TDD

Los ciclos RED demostraron antes de implementar:

- módulo/config endpoint ausentes;
- configuración inválida no gobernada;
- GA4 adapter y bootstrap inexistentes;
- page view, CTA, form start y submit helpers ausentes;
- ausencia de scripts y atributos declarativos en HTML;
- falta de un límite ejecutable entre validación local y request.

La suite prueba dataflow real de los módulos y limita los dobles al proveedor externo o al límite de red. Cubre configuración, CSP, payloads, PII semántica en UTM, storage contaminado, referrer, Consent Mode, proveedor caído, conteo único, validación local, preview, 2xx/4xx/5xx/red, honeypot, assets HTTP y las 58 pruebas heredadas.

## Automático por Codex

- Capa central y schemas.
- Adaptador GA4 deshabilitado.
- Configuración runtime segura.
- Atribución de sesión.
- Eventos de page/CTA/formulario.
- CSP condicional.
- Pruebas y documentación.

## Requiere Rodrigo

1. Crear o confirmar la propiedad y stream web GA4.
2. Entregar el Measurement ID real por el canal de configuración de Render, no por un commit.
3. Confirmar explícitamente la decisión de consentimiento/cookies aplicable. SEO-003 mantiene siempre `analytics_storage=denied`; cualquier futura habilitación de cookies o mecanismo de consentimiento interactivo requiere un ticket y aprobación separados antes de cambiar este contrato.
4. Activar ambas variables solo después del punto anterior.
5. Verificar `page_view`, CTA, funnel y `generate_lead` en DebugView/Realtime con un lead sintético.
6. Crear/verificar Search Console y enviar el sitemap.

## Riesgos y verificaciones futuras

- GA4 no puede validarse en DebugView sin un ID y una activación autorizados.
- La decisión jurídica sobre consentimiento/cookies no la determina el código.
- La nomenclatura de campañas debe respetar los códigos opacos documentados; ampliar vocabularios o formatos requiere revisión de privacidad y pruebas.
- Cualquier nuevo CTA o evento requiere ampliar su schema y pruebas; no debe enviar texto del DOM.

## Revisión independiente

La primera revisión del rango completo encontró 2 Critical, 2 Important y 1 Minor: cookies GA4 por defecto, UTM con texto potencialmente personal, conversión en preview, validación local incompleta y CSP abierta ante un objeto inválido. Cada caso se reprodujo con una prueba RED y se corrigió mediante Consent Mode denegado, ubicación/referrer gobernados, taxonomía UTM cerrada, `preview:false`, validación equivalente y un único validador efectivo de configuración.

## Fuera de alcance

Activación productiva, deploy, cookies analíticas, banner/gestor de consentimiento, GTM, Meta Pixel, campañas, keyword research, nuevas páginas, cambios de diseño, BRENA-V2 y BRENA-WEB-SEO-004.
