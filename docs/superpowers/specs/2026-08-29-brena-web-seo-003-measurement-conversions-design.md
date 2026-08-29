# BRENA-WEB-SEO-003 — Diseño de medición y conversiones

Fecha: 2026-08-29

Estado: aprobado por Rodrigo

Base: `b3c47fa9801a8aaf5f34144fa609a7ca7e41ef35`

## Objetivo

Agregar una capa central, privada por defecto y desacoplada del proveedor que mida adquisición y el funnel del formulario sin enviar datos personales ni alterar el diseño o el contrato operativo de leads.

La infraestructura queda preparada para GA4, pero el proveedor externo permanece deshabilitado hasta que Rodrigo entregue un Measurement ID real y confirme explícitamente la decisión aplicable sobre consentimiento y cookies.

## Decisiones de arquitectura

### Capa central

`frontend/public/analytics.js` será la única API de instrumentación del navegador. Expondrá un contrato equivalente a `analytics.track(eventName, payload)` y contendrá:

- catálogo cerrado de eventos;
- allowlist de campos por evento;
- validación y saneamiento de valores;
- atribución last-touch de sesión;
- reducción segura del referrer;
- adaptación al proveedor;
- captura de errores para que analytics nunca rompa la experiencia.

El código de la página y del formulario no llamará directamente a `gtag`, `dataLayer` ni URLs de Google.

### Configuración runtime

El servidor derivará una configuración pública desde:

- `BRENA_ANALYTICS_ENABLED`;
- `BRENA_GA4_MEASUREMENT_ID`.

El proveedor solo se considera habilitado cuando el flag es exactamente válido y el Measurement ID satisface el formato esperado. Configuración ausente, parcial o inválida produce un modo deshabilitado seguro: no carga scripts externos, no envía eventos y no amplía CSP.

La configuración pública se entregará desde un endpoint JavaScript same-origin sin caché. El Measurement ID no es un secreto, pero nunca se hardcodeará en el repositorio.

### Proveedor

GA4 será el primer adaptador. Cuando esté habilitado:

- crea la cola `dataLayer` antes de cargar la biblioteca;
- configura `send_page_view: false` para evitar doble conteo;
- envía `page_view` exclusivamente mediante la capa central;
- carga `gtag.js` desde el origen oficial exacto;
- nunca incluye campos no aprobados.

En el estado de cierre de este ticket GA4 seguirá deshabilitado. La casilla de autorización de contacto no se reutiliza como consentimiento analítico.

### CSP

La política de SEO-002 permanece byte-for-byte equivalente cuando analytics está deshabilitada. Solo una configuración GA4 válida y expresamente habilitada permite añadir:

- `https://www.googletagmanager.com` a `script-src`;
- los endpoints GA4 estrictamente necesarios a `connect-src`.

No se permiten comodines, `unsafe-eval`, Meta, GTM adicional ni dominios preventivos.

## Contratos de eventos

Todos los eventos rechazan el payload completo si contiene una clave no permitida o un valor inválido. Ningún error de validación o del proveedor se propaga a la interfaz.

| Evento | Momento | Campos permitidos |
|---|---|---|
| `page_view` | Una carga real de la landing | `pathname`, `page_type`, cinco UTM, `referrer_domain` |
| `cta_click` | Activación de un CTA marcado | `cta_id`, `cta_location`, `pathname`, cinco UTM |
| `form_start` | Primera entrada real mediante `input` o `change` | `pathname`, cinco UTM |
| `form_submit_attempt` | Después de validación local y justo antes del POST | `pathname`, cinco UTM |
| `generate_lead` | Solo tras 2xx con confirmación inequívoca del backend | `submission_status`, `pathname`, cinco UTM |
| `form_error` | Validación, error de red o error de servidor | `error_type`, `pathname`, cinco UTM |

No se implementan `whatsapp_click`, `phone_click` ni `email_click` porque esas superficies no existen.

## Atribución

La estrategia es last-touch de sesión:

1. Al cargar, se leen exclusivamente `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` y `utm_term`.
2. Si existe al menos una UTM válida, reemplaza la atribución guardada para esa sesión.
3. Si no existen UTM válidas, se reutiliza la atribución segura ya guardada.
4. Datos malformados o contaminados en `sessionStorage` se descartan.

Los valores se normalizan, limitan en longitud y restringen a caracteres seguros. No se aceptan parámetros arbitrarios, `gclid`, nombres, correos, teléfonos, direcciones, RUT, montos ni texto libre.

El referrer se reduce a hostname normalizado de una URL HTTP(S). Se eliminan path, query, fragment, credenciales y puerto.

## Integración con el formulario

- `form_start` usa un guard local y se emite una sola vez.
- Un submit con errores locales emite `form_error:error_type=validation`, pero no `form_submit_attempt`.
- El intento se registra inmediatamente antes del `fetch` real.
- 4xx/5xx y errores de red nunca generan `generate_lead`.
- Una respuesta 2xx solo genera conversión cuando el cuerpo confirma un lead creado. El `submissionId` puede usarse internamente para reconocer la confirmación, pero jamás forma parte del evento analítico.
- La respuesta señuelo del honeypot no cuenta como conversión.
- Fallos de analytics se aíslan y no cambian estados, mensajes ni navegación del formulario.

## CTA

Los CTA existentes recibirán identificadores declarativos estables mediante atributos `data-analytics-*`, sin cambios visuales. El listener centralizado extraerá solo esos identificadores y su ubicación; nunca texto libre del DOM.

## Privacidad

Queda prohibido en payloads, labels, dimensions y referrers:

- nombre, email, teléfono, dirección o RUT;
- deudas, montos, situación detallada o texto libre;
- `submissionId` u otro identificador correlacionable;
- URL o referrer completo;
- claves arbitrarias.

La persistencia se limita a `sessionStorage` y solo contiene la allowlist UTM saneada. No se crean cookies ni almacenamiento persistente.

## Search Console

No se agregará metadata ni archivo de verificación sin un token real. Rodrigo deberá crear o confirmar la propiedad de dominio `brena.cl`, completar su verificación en Google y enviar `https://brena.cl/sitemap.xml`.

## Pruebas

Las pruebas ejercitarán el dataflow real del módulo y del envío, no búsquedas superficiales de strings. Cubrirán modo deshabilitado, configuración inválida, catálogo de eventos, rechazo de claves, saneamiento de PII, last-touch, storage contaminado, referrer, conteo único, estados del formulario, confirmación real, errores y CSP condicional.

Los 58 tests existentes permanecerán intactos y deberán seguir pasando.

## Límites

Fuera de SEO-003 quedan activación productiva de GA4, decisión legal definitiva, banner o gestor de consentimiento, Search Console manual, Meta/GTM, campañas, nuevos contenidos, cambios de diseño, BRENA-V2 y SEO-004.
