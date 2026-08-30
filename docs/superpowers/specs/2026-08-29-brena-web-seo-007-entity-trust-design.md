# BRENA-WEB-SEO-007 — Entidad, confianza y SEO local

Fecha: 2026-08-29

Estado: diseño aprobado por Rodrigo; pendiente de revisión documental antes de planificación

Base productiva: `adf8f23478e9e8017a03c33185a0f77b4c17dbc7`

Repositorio de despliegue: `rodracruz/brena-public-deploy`

## 1. Objetivo

Establecer una identidad pública mínima, coherente y verificable para BRENA, añadir señales de confianza respaldadas por decisiones de negocio y expresar esa entidad mediante datos estructurados seguros en las cuatro páginas canónicas existentes.

SEO-007 no crea nuevas páginas, no redefine el modelo comercial y no anticipa una identidad empresarial que todavía no corresponde publicar.

## 2. Decisiones vinculantes

- El nombre público y canónico es `BRENA`.
- BRENA se presenta temporalmente como marca independiente, sin publicar razón social ni nombres de responsables.
- El formulario existente es el único canal público oficial.
- BRENA puede realizar visitas presenciales a propiedades o clientes cuando el caso lo requiere, pero no tiene una ubicación permanente abierta al público que deba comunicarse como oficina.
- BRENA recibe solicitudes desde distintas regiones de Chile y confirma la viabilidad caso a caso según ubicación, características de la propiedad y alternativa requerida.
- BRENA puede declarar experiencia directa en construcción, mejoramiento y remodelación, sin años, cifras, credenciales específicas ni resultados garantizados.
- La identidad estructurada permitida se limita a `WebSite` y `Organization` en la homepage, y `BreadcrumbList` en las tres páginas comerciales P1.
- No se implementan `LocalBusiness`, `FAQPage`, `Service`, `Review`, `AggregateRating` ni `Person`.
- Google Business Profile queda diferido y fuera de SEO-007.
- El sitemap mantiene exactamente cuatro URLs.
- Formulario, analytics, rutas, Worker y modelo comercial permanecen funcionalmente sin cambios.
- No se relaja la Content Security Policy.

Estas decisiones fueron aprobadas expresamente por Rodrigo durante el diseño de SEO-007 el 2026-08-29.

## 3. Diagnóstico de identidad actual

### 3.1 Confirmado

| Dato | Estado | Uso autorizado |
|---|---|---|
| Nombre de marca | CONFIRMADO | `BRENA` como nombre canónico visible y legible por máquinas |
| Dominio | CONFIRMADO | `https://brena.cl/` |
| Logo | CONFIRMADO | `https://brena.cl/brena.png` |
| Propuesta de valor | CONFIRMADO | evaluación económica de alternativas según cada propiedad |
| Experiencia constructiva | CONFIRMADO | experiencia directa general en construcción, mejoramiento y remodelación |
| Atención presencial | CONFIRMADO | visitas a propiedades o clientes cuando el caso lo requiere |
| Cobertura | CONFIRMADO | solicitudes desde distintas regiones; viabilidad caso a caso |
| Contacto | CONFIRMADO | formulario público existente hacia `/api/leads` |
| Oficina abierta al público | NO CONFIRMADO / NO PUBLICAR | no declarar dirección ni storefront |

El logo contiene visualmente el descriptor “Gestión Inmobiliaria”. Este descriptor puede permanecer como elemento gráfico o explicativo del servicio, pero no constituye `legalName`, razón social ni una segunda identidad canónica. En metadata, datos estructurados y referencias institucionales, el nombre será `BRENA`.

### 3.2 No confirmado o temporalmente prohibido

- razón social;
- RUT o `taxID`;
- nombres, cargos o datos personales de responsables;
- dirección comercial o de atención;
- teléfono o WhatsApp empresarial;
- correo empresarial;
- horario;
- área de servicio rígida;
- perfiles sociales oficiales;
- fecha de fundación;
- años, número de proyectos, clientes, propiedades o metros cuadrados;
- certificaciones y credenciales específicas;
- testimonios, reseñas, casos, ratings o resultados históricos.

Ninguno de estos datos puede inferirse desde información personal de Rodrigo, otras empresas, proveedores, el formulario de leads ni fuentes externas no autorizadas.

## 4. Alcance

### 4.1 Incluido

- fuente central y cerrada de identidad pública;
- normalización del nombre canónico `BRENA` en señales de entidad;
- `og:site_name="BRENA"` en las cuatro páginas canónicas;
- `WebSite` y `Organization` mínimos en la homepage;
- `BreadcrumbList` en las tres páginas P1;
- breadcrumbs visibles y específicos por página P1;
- evolución de una sección existente de la homepage hacia una sección institucional breve de identidad y confianza;
- pruebas de estructura, contenido, seguridad, generación y regresión;
- documentación de implementación de SEO-007.

### 4.2 Fuera de alcance

- nueva página `/sobre-brena` o cualquier nueva URL;
- nuevas landing pages, artículos, páginas por comuna o contenido masivo;
- `LocalBusiness` y cualquier NAP inventado;
- creación, verificación o edición de Google Business Profile;
- publicación de teléfono, email, WhatsApp, dirección, horario o área de servicio;
- razón social, responsables, equipo, cargos o identidad personal;
- testimonios, casos, estadísticas, certificaciones, ratings o reseñas;
- cambios al contrato de leads, formulario, backend o analytics;
- cambios de routing, redirects, Worker, Render, sitemap o robots;
- activación de GA4;
- rediseño;
- push, deploy o BRENA-WEB-SEO-008.

## 5. Fuente central de identidad

Se incorporará un módulo único `src/public-pages/site-identity.js`. Será la fuente de verdad para los datos públicos reutilizados por el renderer y las pruebas.

El módulo expondrá una estructura inmutable equivalente a:

```js
{
  name: 'BRENA',
  siteUrl: 'https://brena.cl/',
  websiteId: 'https://brena.cl/#website',
  organizationId: 'https://brena.cl/#organization',
  logoUrl: 'https://brena.cl/brena.png',
  description: 'BRENA evalúa propiedades complejas y estructura alternativas según las condiciones de cada caso.'
}
```

La descripción debe aparecer también de forma visible en la sección institucional de la homepage. El módulo no aceptará extensiones dinámicas, variables de entorno ni valores provenientes de contenido de usuario.

No contendrá campos opcionales vacíos. Incorporar en el futuro teléfono, email, dirección, redes sociales, área de servicio o identidad legal requerirá una decisión de negocio explícita, una modificación deliberada de esta allowlist y nuevas pruebas.

## 6. Estrategia de datos estructurados y CSP

### 6.1 Alternativas evaluadas

| Alternativa | Seguridad | Complejidad | Decisión |
|---|---|---|---|
| JSON-LD inline con hashes CSP exactos | segura si los hashes se mantienen sincronizados | acopla cada bloque y cambio editorial a la política CSP; exige manifiesto y pruebas de hash | no elegida |
| JSON-LD inline sin hash o con `unsafe-inline` | relaja la política y contradice SEO-002 | baja | rechazada |
| JSON-LD externo mediante `src` | no exige inline, pero no es una entrega equivalente y fiable para los consumidores de structured data | media | rechazada |
| Microdata sobre HTML estático y visible | no ejecuta scripts ni requiere cambios CSP | baja; se integra al renderer existente | elegida |

### 6.2 Decisión

SEO-007 expresará la entidad mediante Microdata de schema.org. Es una sintaxis admitida por Google para `WebSite`, `Organization` y `BreadcrumbList`, aprovecha el HTML estático ya generado y elimina la necesidad de agregar scripts inline.

Consecuencias de la decisión:

- `src/security-headers.js` y la CSP productiva no cambian;
- no se agregan hashes, nonces, `unsafe-inline`, `unsafe-eval`, comodines ni orígenes externos;
- `@type` se expresa mediante `itemtype` y `@id` mediante `itemid`;
- los valores públicos se anotan sobre contenido visible o referencias deterministas a recursos visibles;
- renderer, HTML generado y pruebas se mantienen sincronizados por `npm run build`;
- si en el futuro se migra a JSON-LD, será una decisión separada y deberá incluir una estrategia CSP explícita.

El trade-off aceptado es que Microdata acopla parte de la semántica al markup de presentación. Se mitiga con la fuente central de identidad, helpers de render dedicados y pruebas estructurales que analicen el árbol HTML en lugar de validar solo strings aislados.

## 7. Structured data de homepage

### 7.1 `WebSite`

La homepage declarará un único nodo `WebSite`:

| Propiedad semántica | Valor exacto |
|---|---|
| `@type` | `WebSite` |
| `@id` | `https://brena.cl/#website` |
| `url` | `https://brena.cl/` |
| `name` | `BRENA` |

El nodo se asociará al documento principal sin alterar headings, navegación o layout. No se agregará `SearchAction`, porque el sitio no tiene búsqueda interna.

### 7.2 `Organization`

La homepage declarará un único nodo `Organization` con exactamente estas propiedades:

| Propiedad semántica | Valor exacto o fuente |
|---|---|
| `@type` | `Organization` |
| `@id` | `https://brena.cl/#organization` |
| `name` | `BRENA` |
| `url` | `https://brena.cl/` |
| `logo` | `https://brena.cl/brena.png` |
| `description` | fuente central y texto visible equivalente |

Quedan expresamente excluidos `legalName`, `taxID`, `address`, `telephone`, `email`, `contactPoint`, `openingHours`, `sameAs`, `founder`, `employee`, `foundingDate`, `aggregateRating`, `review` y `areaServed`.

El nodo Organization quedará relacionado con `WebSite` como su `publisher`. Esta relación no amplía los datos de Organization ni declara una entidad legal.

No habrá `Organization` duplicado en las páginas P1. Todas sus señales de identidad apuntarán al dominio y nombre canónicos por metadata, enlaces y breadcrumbs.

## 8. Breadcrumbs y `BreadcrumbList`

Las tres páginas P1 tendrán breadcrumbs visibles específicos y un único `BreadcrumbList` construido sobre ese mismo markup:

| Página | Breadcrumb visible | URL final |
|---|---|---|
| `/vender-propiedad-rapido` | `Inicio` → `Vender propiedad rápido` | `https://brena.cl/vender-propiedad-rapido` |
| `/vender-propiedad-con-deudas` | `Inicio` → `Vender propiedad con deudas` | `https://brena.cl/vender-propiedad-con-deudas` |
| `/vender-propiedad-en-mal-estado` | `Inicio` → `Vender propiedad en mal estado` | `https://brena.cl/vender-propiedad-en-mal-estado` |

Cada lista contendrá exactamente dos `ListItem`:

1. posición `1`, nombre `Inicio`, item `https://brena.cl/`;
2. posición `2`, nombre específico de la página, item igual a su canonical.

El primer elemento será un enlace HTML real. El segundo identificará la página actual sin crear un enlace redundante. El nombre visible y el nombre estructurado serán iguales. No se usará el breadcrumb genérico `Evaluación`.

La homepage y `success.html` no tendrán `BreadcrumbList`.

## 9. Sección institucional y confianza

SEO-007 evolucionará la sección existente de perspectiva de la homepage, conservando su lugar, componentes, imágenes y lenguaje gráfico. No añadirá una superficie repetitiva ni rediseñará la página.

La sección tendrá el siguiente contrato editorial:

- eyebrow visible: `BRENA`;
- H2: `Evaluación inmobiliaria con una mirada económica y constructiva.`;
- descripción de entidad: `BRENA evalúa propiedades complejas y estructura alternativas según las condiciones de cada caso.`;
- explicación: según el caso, la alternativa puede incluir inversión directa, mejoramiento o remodelación previa a la venta y otras vías de comercialización;
- experiencia: BRENA cuenta con experiencia directa en construcción, mejoramiento y remodelación;
- atención: cuando la evaluación lo requiere, BRENA puede coordinar una visita presencial a la propiedad;
- cobertura prudente: BRENA recibe solicitudes desde distintas regiones de Chile y confirma la viabilidad según ubicación, características y alternativa requerida;
- límites visibles: BRENA no garantiza compra, venta, precio, plazo ni valorización; completar el formulario no obliga a continuar.

La sección no incluirá integrantes, biografías, cifras, credenciales, testimonios, casos ni fotografías presentadas como proyectos acreditados.

La referencia pública del aviso de privacidad se normalizará a `BRENA` como marca responsable del canal, sin presentarla como razón social. No se añadirán teléfono, email o dirección y no se convertirá el aviso breve en una política legal ficticia. El formulario seguirá siendo la vía disponible para solicitudes relacionadas con privacidad.

## 10. Metadata e identidad visible

Las cuatro páginas canónicas incorporarán:

```html
<meta property="og:site_name" content="BRENA">
```

Se conservan sus title, meta description, H1, canonical, `og:title`, `og:description` y `og:url` propios de SEO-005. `og:site_name` no reemplaza ni homogeneiza esos valores.

Referencias textuales de entidad en alt, aria-labels y footer usarán `BRENA` cuando nombran a la marca. Los titles y copy comercial aprobados no se reescriben de manera masiva; la normalización se limita a señales de identidad inequívocas.

El descriptor visual “Gestión Inmobiliaria” puede permanecer en el logo, pero no se publicará como razón social, `legalName` ni nombre estructurado alternativo.

## 11. LocalBusiness y Google Business Profile

### 11.1 `LocalBusiness`

No corresponde implementarlo en SEO-007.

BRENA no es exclusivamente online porque puede desplazarse a propiedades o clientes. Sin embargo, actualmente no existen todos los datos públicos estables necesarios para representar responsablemente una entidad local: ubicación base no pública, teléfono empresarial, email empresarial, horario, categoría operativa confirmada y área de servicio declarable.

La ausencia de `LocalBusiness` no bloquea indexación ni invalida `Organization` o `WebSite`.

### 11.2 Google Business Profile

Un perfil como service-area business podría ser técnicamente evaluable en el futuro, pero no es verificable ni recomendable hoy. Queda diferido hasta que BRENA cuente con:

- inicio formal de actividades y revisión de identidad pública;
- categoría de negocio aprobada;
- canales empresariales propios;
- ubicación base verificable aunque se oculte públicamente conforme a las reglas de Google;
- área de servicio y horario operativos reales;
- capacidad de completar las acciones manuales de verificación y mantenimiento.

SEO-007 no crea, reclama, edita ni verifica un Google Business Profile.

## 12. Arquitectura de generación

La implementación extenderá el generador estático existente sin agregar dependencias ni runtime de presentación.

Archivos probables:

- `src/public-pages/site-identity.js`: fuente central de identidad;
- `src/public-pages/catalog.js`: labels específicos de breadcrumb y metadata existente;
- `src/public-pages/render.js`: helpers de Microdata, `og:site_name`, sección institucional y breadcrumbs;
- `frontend/public/index.html`: salida generada de homepage;
- `frontend/public/vender-propiedad-rapido.html`: salida generada P1;
- `frontend/public/vender-propiedad-con-deudas.html`: salida generada P1;
- `frontend/public/vender-propiedad-en-mal-estado.html`: salida generada P1;
- pruebas específicas de identidad, structured data, contenido y regresión;
- documentación de implementación SEO-007.

No se prevén cambios en:

- `cloudflare/worker.mjs`;
- servidor o routing;
- `frontend/public/sitemap.xml`;
- `frontend/public/robots.txt`;
- `src/security-headers.js`;
- formulario, `/api/leads`, analytics o contrato de leads;
- `success.html`.

Si la implementación demuestra que uno de esos archivos debe cambiar, se detendrá y se corregirá esta spec antes de ampliar el alcance.

## 13. Seguridad y privacidad

- La CSP debe permanecer funcionalmente idéntica a SEO-005.
- No se añaden scripts inline ni externos.
- No se usan `unsafe-inline`, `unsafe-eval`, comodines, nonces improvisados ni nuevos dominios.
- Los datos estructurados no incluyen canales privados ni datos recibidos por formulario.
- Ningún valor de schema se deriva de query strings, sessionStorage, analytics, variables de entorno o input del usuario.
- El formulario conserva honeypot, consentimiento, validaciones, límites, endpoint y protección PII existentes.
- GA4 continúa deshabilitado.
- No se exponen secretos, tokens de Search Console, DNS ni identificadores operativos.

## 14. Accesibilidad y presentación

- La sección institucional reutiliza componentes y estilos actuales.
- No cambia el orden del H1 ni introduce un segundo H1.
- Los breadcrumbs conservan `nav` con nombre accesible y lista ordenada.
- El elemento actual del breadcrumb se distingue semánticamente con `aria-current="page"`.
- Structured data no sustituye texto visible.
- Logo y referencias de marca mantienen nombres accesibles coherentes.
- No se añaden interacciones, animaciones ni controles.
- Desktop y móvil deben conservar navegación, tipografía, colores, foco, formulario, footer y ausencia de overflow.

## 15. Estrategia de pruebas TDD

La implementación comenzará con tests RED de comportamiento y estructura real del HTML.

### 15.1 Fuente de identidad

- exporta exactamente los campos aprobados;
- mantiene nombre, URLs e identificadores canónicos exactos;
- es inmutable;
- no contiene teléfono, email, dirección, horario, redes sociales, área de servicio, identidad legal ni personas;
- no acepta campos arbitrarios.

### 15.2 Structured data

- homepage contiene un único `WebSite` con `name`, `url` e identificador exactos;
- homepage contiene un único `Organization` con solo las seis propiedades autorizadas;
- descripción estructurada corresponde a contenido visible;
- logo y URL son absolutos, HTTPS y canónicos;
- no existe `Organization` duplicado en páginas P1;
- cada P1 contiene un único `BreadcrumbList` válido con dos items y su canonical;
- nombres estructurados y visibles de breadcrumb coinciden;
- homepage y `success.html` no contienen `BreadcrumbList`;
- ninguna página contiene `LocalBusiness`, `FAQPage`, `Service`, `Review`, `AggregateRating` o `Person`;
- parser y validación comprueban el árbol Microdata, no solo presencia de palabras.

### 15.3 Identidad y confianza

- las cuatro páginas tienen `og:site_name="BRENA"`;
- la homepage contiene la sección institucional y sus límites aprobados;
- no aparecen razón social, RUT, responsables, teléfono, email, dirección, horario ni cobertura garantizada;
- no aparecen estadísticas, años, testimonios, ratings, credenciales o resultados garantizados;
- el único canal público de contacto sigue siendo el formulario;
- el aviso breve de privacidad identifica la marca sin inventar entidad legal o canales.

### 15.4 Regresión

- `npm run build` produce artefactos deterministas y sincronizados;
- las cuatro URLs y su sitemap permanecen sin cambios de alcance;
- canonical, robots y metadata SEO-005 se conservan;
- formulario y opciones son estructuralmente idénticos en las cuatro superficies;
- analytics conserva los cuatro `page_type`, pathname separado y protección PII;
- routing, aliases, Worker y headers conservan sus contratos;
- CSP no cambia y continúa sin `unsafe-inline`, `unsafe-eval`, comodines o dominios nuevos;
- navegación, enlaces, CTA, accesibilidad básica y responsive no sufren regresión;
- `npm test` y `npm audit` pasan.

### 15.5 Validación externa controlada

Antes del cierre se validará el HTML generado con:

- Schema Markup Validator para sintaxis y estructura schema.org;
- Rich Results Test cuando el tipo sea reconocido por la herramienta;
- inspección del HTML inicial sin ejecución de JavaScript;
- revisión visual desktop y móvil.

La ausencia de un rich result específico para `WebSite` u `Organization` no se tratará como fallo si el schema es válido y corresponde al contenido visible.

## 16. Baseline y portabilidad de build

En el worktree documental, `npm ci` y `npm audit` pasan con cero vulnerabilidades. La suite heredada reproduce `108/109` tests: falla únicamente la comparación byte a byte de artefactos generados por diferencias LF/CRLF bajo Windows con `core.autocrlf=true`. El contenido generado es equivalente y el fallo precede cualquier cambio de SEO-007.

La planificación deberá incluir como gate inicial una corrección mínima y aislada de portabilidad de la prueba o una política explícita de finales de línea. No se permitirá ocultar divergencias reales, regenerar artefactos de forma accidental ni mezclar esa corrección con cambios editoriales. El criterio de cierre sigue siendo la suite completa en GREEN.

## 17. Criterios de aceptación

SEO-007 podrá considerarse GREEN cuando:

- existe una única fuente central de identidad con nombre canónico `BRENA`;
- homepage declara `WebSite` y `Organization` mínimos y válidos;
- Organization contiene exclusivamente las propiedades autorizadas;
- las tres P1 tienen `BreadcrumbList` y breadcrumbs visibles específicos;
- `og:site_name="BRENA"` existe en las cuatro páginas;
- la sección institucional comunica identidad, experiencia, presencialidad, cobertura prudente y límites sin afirmaciones inventadas;
- no existe `LocalBusiness` ni un schema no autorizado;
- no se publican razón social, responsables, teléfono, email, dirección, horario ni área de servicio;
- no se crea Google Business Profile;
- sitemap mantiene exactamente las cuatro URLs;
- formulario, analytics, routing, Worker y modelo comercial no cambian;
- CSP permanece restrictiva y sin ampliaciones;
- HTML generado, pruebas y artefactos versionados están sincronizados;
- suite completa y `npm audit` pasan;
- revisión independiente final no deja findings Critical o Important.

## 18. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Declarar una entidad legal inexistente | nombre estructurado limitado a la marca `BRENA`; excluir `legalName`, RUT y responsables |
| Convertir el descriptor del logo en razón social | tratar “Gestión Inmobiliaria” solo como descriptor visual |
| Schema con datos no visibles o no demostrados | fuente central cerrada y equivalencia con contenido institucional visible |
| Microdata diverge del contenido | helpers de renderer y pruebas sobre el árbol HTML |
| Structured data abre la CSP | Microdata sin scripts; CSP sin cambios |
| Señales locales inventan NAP | no implementar `LocalBusiness` ni Google Business Profile |
| Experiencia constructiva se exagera | prohibir años, cifras, credenciales, porcentajes y resultados |
| Cobertura parece nacional garantizada | lenguaje caso a caso, sin `areaServed` |
| El formulario deja de ser el único contacto | pruebas que impiden publicar teléfono, email o canales alternativos |
| Homepage gana contenido repetitivo | evolucionar la sección existente en lugar de agregar una sección paralela |
| Cambio de identidad altera SEO-005 | conservar titles, H1, canonicals, rutas, sitemap, formulario y analytics |
| Build difiere por finales de línea | resolver portabilidad explícitamente antes del cierre, sin normalizar silenciosamente producto |

## 19. Fuentes técnicas

- Google Search Central, Site names: `https://developers.google.com/search/docs/appearance/site-names`
- Google Search Central, Organization structured data: `https://developers.google.com/search/docs/appearance/structured-data/organization`
- Google Search Central, Breadcrumb structured data: `https://developers.google.com/search/docs/appearance/structured-data/breadcrumb`
- Google Search Central, Structured data policies: `https://developers.google.com/search/docs/appearance/structured-data/sd-policies`
- Google Business Profile, eligibility and guidelines: `https://support.google.com/business/answer/3038177`
- Schema.org, `WebSite`: `https://schema.org/WebSite`
- Schema.org, `Organization`: `https://schema.org/Organization`
- Schema.org, `BreadcrumbList`: `https://schema.org/BreadcrumbList`

Estas fuentes justifican sintaxis y elegibilidad técnica. No sustituyen las decisiones de negocio ni autorizan datos que BRENA no ha confirmado.

## 20. Planificación y cierre documental

Después de que Rodrigo apruebe esta spec se podrá invocar `superpowers:writing-plans`. El plan deberá descomponer la implementación mediante RED → GREEN, preservar la generación estática y solicitar revisión independiente antes del cierre.

Este documento no autoriza implementación, push ni deploy. SEO-008 no debe iniciarse.
