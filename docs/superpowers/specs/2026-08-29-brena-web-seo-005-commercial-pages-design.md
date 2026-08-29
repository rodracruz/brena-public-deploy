# BRENA-WEB-SEO-005 — Arquitectura y páginas comerciales P1

Fecha: 2026-08-29

Estado: diseño aprobado

Base: `5ebc986f862ead06dacf302087bafc7e161f4e9b`

Repositorio de despliegue: `rodracruz/brena-public-deploy`

## 1. Objetivo

Ampliar la web pública de BRENA con una arquitectura comercial pequeña y coherente compuesta por la homepage existente y tres páginas comerciales P1:

- `/`
- `/vender-propiedad-rapido`
- `/vender-propiedad-con-deudas`
- `/vender-propiedad-en-mal-estado`

Las cuatro superficies deben generarse como HTML estático desde una base común, mantener la identidad visual actual, responder a las intenciones demostradas en SEO-004 y conducir al mismo formulario de evaluación sin inventar servicios, resultados ni credenciales.

## 2. Principios vinculantes

- BRENA evalúa cada propiedad y estructura una alternativa según sus condiciones.
- La alternativa puede combinar inversión directa, mejoramiento o remodelación y otras vías de comercialización.
- BRENA no se comunica como comprador garantizado ni como una corredora de modalidad única.
- No se garantiza compra, venta, precio, plazo, valorización ni resultado.
- BRENA recibe solicitudes desde distintas regiones de Chile; la viabilidad se confirma caso a caso.
- BRENA puede declarar experiencia directa en construcción, mejoramiento y remodelación, sin publicar años, cifras, volumen de proyectos, metros cuadrados ni credenciales no documentadas.
- La página de deudas entrega orientación general respaldada por fuentes oficiales. No sustituye asesoría jurídica o financiera individual.
- Las páginas no existen solo para posicionar keywords: cada una debe resolver una necesidad diferenciada y ofrecer un siguiente paso útil.
- No se crean formularios, contratos de lead ni backends alternativos.
- No se activa GA4 ni se altera la decisión pendiente de consentimiento analítico.

## 3. Contexto de negocio

### 3.1 Confirmado

El sitio y las decisiones de producto permiten declarar lo siguiente:

- BRENA recibe antecedentes iniciales de una propiedad y del objetivo del propietario.
- BRENA evalúa ubicación, características, obligaciones, condición física, costos, plazo y viabilidad de las alternativas.
- Según el caso, la alternativa estructurada puede incluir inversión directa, mejoras o remodelación y comercialización.
- La primera evaluación determina si BRENA puede ayudar y qué antecedentes o pasos adicionales podrían ser necesarios.
- Completar el formulario no obliga a vender ni garantiza que el caso pueda avanzar.
- Para comenzar no se requieren documentos ni cifras exactas.
- El formulario puede recibir solicitudes correspondientes a las 16 regiones, pero esto no representa cobertura garantizada.
- El backend confirma la creación real del lead antes de que analytics emita `generate_lead`.

### 3.2 No confirmado y prohibido en el copy

- Años de experiencia de BRENA.
- Número de clientes, propiedades, ventas, proyectos o metros cuadrados.
- Cobertura física o comercial garantizada en todo Chile.
- Rangos de precio o tipos de propiedad aceptados automáticamente.
- Plazo de respuesta, plazo de venta o plazo de ejecución.
- Porcentajes históricos de valorización o retorno.
- Tasaciones certificadas.
- Certificaciones, credenciales o equipo profesional no documentados.
- Casos, testimonios, reseñas, fotografías de proyectos o estadísticas no autorizados.

### 3.3 Responsabilidades y límites

El propietario aporta información inicial correcta, selecciona expresamente su situación y autoriza el contacto. BRENA ordena los antecedentes, realiza una evaluación inicial y comunica si existe una alternativa que valga la pena desarrollar.

Un banco, acreedor, abogado, tasador u otro profesional debe confirmar aquello que corresponda a su ámbito. BRENA no debe presentar una evaluación económica preliminar como autorización bancaria, resolución jurídica, tasación certificada o recomendación financiera individual.

## 4. Alcance

### 4.1 Incluido

- Generador estático determinista en Node.js y sin dependencias nuevas.
- Fuente única de layout, navegación, formulario, footer, analytics y componentes comunes.
- Contenido específico separado por página e intención.
- Cuatro HTML finales generados y versionados.
- Rutas públicas sin extensión.
- Metadata, canonical, Open Graph y sitemap de las cuatro páginas.
- Enlazado bidireccional entre homepage y páginas P1.
- Enlaces contextuales entre páginas P1 cuando exista una relación útil.
- Reutilización completa del formulario, backend y contratos de SEO-003.
- Taxonomía analítica cerrada por intención.
- Extensión del sistema visual actual sin rediseño.
- Pruebas de generación, routing, SEO, accesibilidad básica, enlaces, formulario, analytics, privacidad y contenido diferenciado.
- Documentación de implementación de SEO-005.

### 4.2 Fuera de alcance

- Páginas por comuna o región.
- `/vender-propiedad-heredada`.
- Artículos, guías P2/P3 o producción masiva de contenido.
- Tasación online o calculadoras.
- Contenido sobre remate, embargo, insolvencia, DICOM, refinanciamiento o leaseback.
- Nuevos campos, valores o modalidades en el contrato de leads.
- Casos, testimonios o prueba social no demostrada.
- Schema `Organization` o `LocalBusiness`.
- Activación de GA4, Search Console, GTM, Meta Pixel o cookies analíticas.
- Integración adicional con BRENA-V2.
- Rediseño, migración tecnológica o renderizado de presentación en runtime.
- Push, PR o despliegue.
- BRENA-WEB-SEO-006.

## 5. Arquitectura de generación estática

### 5.1 Fuentes

La implementación debe separar tres responsabilidades:

1. **Catálogo de páginas:** ruta, archivo generado, metadata, `page_type`, intención, contenido específico y relación opcional con una situación del formulario.
2. **Renderers compartidos:** layout, header, navegación, breadcrumbs, secciones comunes, CTA, formulario, FAQ y footer.
3. **Generador:** valida el catálogo, produce los HTML y comprueba que el resultado sea determinista.

Ubicación propuesta:

- `src/public-pages/catalog.js`
- `src/public-pages/render.js`
- `scripts/build-public-pages.js`

Los nombres pueden ajustarse durante el plan si el repositorio demuestra una convención mejor, pero deben mantenerse estas fronteras.

### 5.2 Salidas versionadas

El generador producirá:

- `frontend/public/index.html`
- `frontend/public/vender-propiedad-rapido.html`
- `frontend/public/vender-propiedad-con-deudas.html`
- `frontend/public/vender-propiedad-en-mal-estado.html`
- `frontend/public/sitemap.xml`

Los HTML son artefactos estáticos normales. Render continuará sirviéndolos mediante el servidor existente. No se generará contenido en cada request.

### 5.3 Comando y determinismo

`package.json` incorporará un script `build` que ejecute el generador con Node.js. No se añadirá una librería de templates.

El generador debe:

- construir todos los resultados en memoria antes de escribir;
- escribir UTF-8 estable;
- ordenar páginas y URLs de forma explícita;
- no incluir timestamps, hashes aleatorios ni datos de entorno;
- fallar ante rutas, archivos, canonicals, titles, H1 o `page_type` duplicados;
- fallar ante campos obligatorios ausentes;
- aceptar solamente contenido editorial confiable incluido en el repositorio;
- permitir una prueba que regenere en un directorio temporal y compare el resultado con los archivos versionados.

Una ejecución repetida sobre la misma base debe producir archivos byte a byte equivalentes.

## 6. Routing y canonicalización

### 6.1 Rutas públicas

El servidor mapeará rutas canónicas sin extensión a los archivos generados:

| Ruta pública | Archivo estático |
|---|---|
| `/` | `index.html` |
| `/vender-propiedad-rapido` | `vender-propiedad-rapido.html` |
| `/vender-propiedad-con-deudas` | `vender-propiedad-con-deudas.html` |
| `/vender-propiedad-en-mal-estado` | `vender-propiedad-en-mal-estado.html` |

### 6.2 Aliases

Los siguientes aliases no deben servir copias indexables:

- `/index.html` → `/`
- `/vender-propiedad-rapido.html` → `/vender-propiedad-rapido`
- `/vender-propiedad-con-deudas.html` → `/vender-propiedad-con-deudas`
- `/vender-propiedad-en-mal-estado.html` → `/vender-propiedad-en-mal-estado`
- cualquier variante con trailing slash de las tres páginas → variante sin trailing slash

Se usarán redirects permanentes. Solo se conservarán las cinco UTM autorizadas y sanitizadas. Nombre, email, teléfono, dirección, texto libre y parámetros arbitrarios deben eliminarse.

### 6.3 Cloudflare y Render

Worker y servidor deben conservar los contratos de SEO-002:

- HTTP y hosts alternativos convergen en `https://brena.cl`;
- el origen Render no sirve una segunda copia pública indexable;
- los redirects de origen se reescriben al host canónico;
- los endpoints técnicos y assets mantienen su funcionamiento;
- no se crean loops;
- las rutas y aliases nuevos quedan cubiertos por pruebas de Cloudflare y servidor.

Las reglas de aliases del Worker pueden ser explícitas y deben tener una prueba de paridad con el catálogo canónico. No se introducirá un bundler ni un import remoto para el Worker.

## 7. Sistema común de componentes

El renderer compartido será la única fuente para:

- `doctype`, `<html>`, `<head>` y orden de metadata;
- header, logo y navegación;
- breadcrumb de páginas interiores;
- contenedor hero y CTA;
- patrones de sección, listas, cards, alternativas y FAQ;
- formulario y estados de envío;
- scripts y assets versionados;
- footer y año dinámico;
- atributos de analytics;
- atributos accesibles comunes.

El contenido de cada intención se mantendrá en el catálogo o en módulos de contenido separados, sin copiar el layout.

`frontend/public/styles.css` seguirá siendo la fuente visual. Solo se incorporarán variantes necesarias para páginas interiores, breadcrumbs, contenido editorial, alternativas y el indicador contextual del formulario. Se mantendrán colores, tipografía, espaciado, botones, bordes, imágenes y responsive actuales.

Las versiones de query de `styles.css`, `scripts.js` y `analytics.js` serán constantes explícitas del renderer. Si cambia un asset, la implementación actualizará su versión de forma coherente en las cuatro páginas generadas para evitar HTML con referencias de caché divergentes.

## 8. Arquitectura de páginas

### 8.1 Homepage `/`

- **Cluster:** BR-01 — evaluación de propiedad compleja.
- **Intención:** determinar si BRENA puede ayudar con una propiedad compleja.
- **Title:** `Brena | Soluciones para propiedades complejas`
- **Meta description:** `¿Tienes una propiedad con deudas, desocupada, heredada o que necesitas vender pronto? Cuéntanos tu caso y descubre si Brena puede ayudarte.`
- **H1:** `Tu propiedad puede volver a ser una solución.`
- **Canonical:** `https://brena.cl/`
- **page_type:** `homepage`
- **CTA principal:** `Cuéntanos tu caso`

La homepage conservará hero, situaciones, proceso, mirada completa, confianza, FAQ y formulario. El copy explicará de forma breve que BRENA puede estructurar alternativas que combinan inversión directa, mejoramiento o remodelación y comercialización, siempre según evaluación.

La sección de situaciones seguirá permitiendo ir al formulario. Para deuda, urgencia y deterioro se añadirá una acción editorial separada hacia la página P1 correspondiente. No se anidarán enlaces dentro de botones: las cards se expresarán con semántica que permita dos controles hermanos y accesibles.

### 8.2 `/vender-propiedad-rapido`

- **Cluster:** BR-02 — venta rápida.
- **Intención:** evaluar una venta en un plazo reducido sin aceptar cualquier alternativa ni asumir un resultado.
- **Title:** `Vender una propiedad rápido: evalúa tus alternativas | Brena`
- **Meta description:** `Si necesitas vender una propiedad pronto, Brena evalúa ubicación, obligaciones, estado y plazo para estructurar una alternativa realista y sin promesas.`
- **H1:** `¿Necesitas vender una propiedad pronto? Evalúa antes de decidir.`
- **Canonical:** `https://brena.cl/vender-propiedad-rapido`
- **page_type:** `commercial_fast_sale`
- **CTA principal:** `Cuéntanos tu caso`

Estructura específica:

1. Qué significa realmente acelerar una venta.
2. Variables que afectan tiempo, resultado y certeza.
3. Diferencia entre urgencia y aceptar cualquier oferta.
4. Cómo BRENA compara inversión, mejoras y comercialización.
5. Alternativas que pueden evaluarse según el caso.
6. Información inicial necesaria.
7. Límites: sin venta, precio o plazo garantizados.
8. FAQ específica.
9. Formulario completo.

### 8.3 `/vender-propiedad-con-deudas`

- **Cluster:** BR-03 — propiedad con deuda o hipoteca.
- **Intención:** comprender qué debe evaluarse cuando existen obligaciones asociadas a la propiedad.
- **Title:** `Vender una propiedad con deudas o hipoteca | Brena`
- **Meta description:** `Brena evalúa deudas, costos, estado y alternativas de una propiedad. Cada obligación puede requerir confirmación del banco, acreedor o profesional.`
- **H1:** `Una propiedad con deudas necesita una evaluación completa.`
- **Canonical:** `https://brena.cl/vender-propiedad-con-deudas`
- **page_type:** `commercial_debt`
- **CTA principal:** `Cuéntanos tu caso`

Estructura específica:

1. Por qué importan el tipo y estado de cada obligación.
2. Antecedentes económicos y documentales que deben conocerse.
3. Qué puede evaluar BRENA.
4. Qué debe confirmar un banco, acreedor, abogado u otro profesional.
5. Alternativas condicionadas al caso.
6. Información inicial necesaria.
7. Límites de la orientación general.
8. FAQ específica y fuentes oficiales.
9. Formulario completo.

Las afirmaciones procesales deben enlazar fuentes oficiales fechadas. No se afirmará que toda propiedad con deuda puede venderse de la misma forma. No se publicará asesoría sobre embargo, remate, insolvencia, DICOM o litigios.

### 8.4 `/vender-propiedad-en-mal-estado`

- **Cluster:** BR-04 — propiedad en mal estado.
- **Intención:** comparar vender en el estado actual, realizar mejoras acotadas o remodelar.
- **Title:** `Vender una propiedad en mal estado | Brena`
- **Meta description:** `Brena compara vender una propiedad como está, realizar mejoras acotadas o remodelar, considerando costos, tiempo y viabilidad de cada caso.`
- **H1:** `El estado de una propiedad no se evalúa solo por lo que cuesta reparar.`
- **Canonical:** `https://brena.cl/vender-propiedad-en-mal-estado`
- **page_type:** `commercial_property_condition`
- **CTA principal:** `Cuéntanos tu caso`

Estructura específica:

1. Cómo el deterioro afecta costos, tiempo y comercialización.
2. Variables constructivas y económicas relevantes.
3. Experiencia directa de BRENA en construcción, mejoramiento y remodelación.
4. Comparación: vender como está, mejorar de forma acotada o remodelar.
5. Información inicial necesaria.
6. Límites: sin porcentajes de valorización, retorno o resultado garantizado.
7. FAQ específica.
8. Formulario completo.

La página no presentará la evaluación inicial como inspección técnica certificada ni confundirá deterioro físico con regularización jurídica o municipal.

## 9. Open Graph y schema

Cada página tendrá `og:type=website`, `og:locale=es_CL`, `og:title`, `og:description` y `og:url` coherentes con su metadata. SEO-005 reutilizará la imagen social actual; no inventará imágenes de casos o proyectos.

No se añadirá schema en este ticket:

- faltan datos suficientes para `Organization` o `LocalBusiness`;
- no se crearán entidades o propiedades no visibles;
- JSON-LD inline requeriría una decisión explícita sobre CSP;
- `WebPage` aislado no aporta información material adicional al HTML semántico y metadata existentes.

Los breadcrumbs serán visibles y rastreables mediante enlaces HTML, sin `BreadcrumbList` en esta fase.

## 10. Formulario compartido

### 10.1 Fuente única

`renderLeadForm()` será la única implementación fuente del formulario. Las cuatro páginas recibirán la misma salida para:

- nombres, tipos y orden de campos;
- opciones de situación, propiedad, región y urgencia;
- atributos `required`, límites, `autocomplete` y honeypot;
- consentimiento y versión del aviso;
- botones, pasos, progreso, errores y estado de éxito;
- endpoint `POST /api/leads`;
- hooks y atributos utilizados por `scripts.js`.

No se introducirán contratos o comportamientos diferentes por página.

### 10.2 Indicación contextual sin selección

El catálogo puede declarar `relatedSituation` solamente para:

- `commercial_fast_sale` → `necesita_vender_rapido`
- `commercial_debt` → `mora_hipotecaria`

Homepage y `commercial_property_condition` no tendrán `relatedSituation`.

Cuando exista correspondencia, el renderer añadirá junto al texto de la opción una indicación como `Relacionado con esta página`. La indicación:

- es visual y orientativa;
- no agrega ni modifica `checked`, `selected`, `value` o datos enviados;
- no usa `aria-selected`;
- no simula el estado visual de un radio marcado;
- incluye texto accesible, por lo que no depende solamente del color;
- desaparece de la semántica del payload: solo se envía la opción elegida por el usuario.

Una prueba debe confirmar que ningún radio está seleccionado en el HTML inicial.

## 11. Analytics y privacidad

### 11.1 Taxonomía cerrada de SEO-005

La allowlist de `page_type` para las cuatro superficies de SEO-005 contiene **únicamente**:

- `homepage`
- `commercial_fast_sale`
- `commercial_debt`
- `commercial_property_condition`

`success.html` no pertenece al catálogo generado, no es una quinta intención comercial y no se añadirá a esta taxonomía. Mantendrá su funcionamiento técnico y `noindex` existentes fuera del contrato de páginas comerciales.

El `page_type` se declarará de forma estática en el HTML generado y será validado nuevamente contra la allowlist. No se aceptarán valores provenientes de query strings, sessionStorage, texto del usuario o atributos arbitrarios.

### 11.2 Eventos

Las cuatro páginas preservarán:

- `page_view` con `pathname` y `page_type` separados;
- `cta_click` con `cta_id` y `cta_location` allowlisted;
- `form_start` una sola vez tras interacción real;
- `form_submit_attempt` solo después de validación local;
- `generate_lead` solo tras confirmación 2xx y evidencia de creación del backend;
- `form_error` con categoría `validation`, `network` o `server`.

`pathname` se obtendrá de `window.location.pathname`; nunca del formulario. La atribución last-touch de sesión y las cinco UTM autorizadas permanecen sin cambios.

### 11.3 Privacidad y proveedor

Nombre, email, teléfono, dirección, comuna, RUT, deuda, monto, texto libre, `submissionId` y URL/referrer completos no pueden formar parte de analytics.

GA4 permanecerá deshabilitado. No se agregarán dominios analíticos a CSP mientras falten Measurement ID real y decisión explícita de consentimiento.

## 12. Enlazado interno y navegación

### 12.1 Header común

- Logo → `/`.
- En homepage: links a `#situaciones`, `#proceso` y `#preguntas`.
- En páginas P1: links a `/#situaciones`, `/#proceso` y `#preguntas` cuando exista FAQ local.
- CTA del header → `#conversemos` de la página actual.

### 12.2 Homepage hacia P1

- Deuda hipotecaria → `/vender-propiedad-con-deudas`.
- Necesidad de vender pronto → `/vender-propiedad-rapido`.
- Propiedad desocupada o deteriorada → `/vender-propiedad-en-mal-estado` mediante un anchor que describa el estado, sin afirmar equivalencia total entre desocupación y deterioro.

Cada card conservará una acción independiente hacia el formulario. No se usarán elementos interactivos anidados.

### 12.3 P1 hacia homepage

Cada página incluirá:

- breadcrumb `Inicio`;
- logo hacia `/`;
- enlace contextual al proceso `/#proceso`;
- CTA local hacia su propio formulario.

### 12.4 Relaciones entre P1

Solo se añadirán enlaces dentro de secciones donde sean útiles:

- venta rápida → deuda, si una obligación puede condicionar la ruta;
- venta rápida → mal estado, si la condición afecta tiempo y estrategia;
- deuda → venta rápida, si el plazo es parte del problema;
- mal estado → venta rápida, si mejorar consume tiempo que el propietario no tiene.

No se creará un bloque sitewide con anchors repetidos hacia todas las páginas.

## 13. Sitemap, robots e indexabilidad

El sitemap generado contendrá exactamente:

1. `https://brena.cl/`
2. `https://brena.cl/vender-propiedad-rapido`
3. `https://brena.cl/vender-propiedad-con-deudas`
4. `https://brena.cl/vender-propiedad-en-mal-estado`

No contendrá `lastmod` sin fuente confiable.

Quedan excluidos:

- `success.html`;
- `index.html`;
- aliases `.html`;
- trailing-slash aliases;
- hostname Render;
- endpoints y rutas técnicas.

`robots.txt` seguirá permitiendo `/` y referenciando `https://brena.cl/sitemap.xml`. Las cuatro páginas usarán `index, follow` y canonical autorreferente.

## 14. Seguridad

- Se conserva la CSP central de SEO-002.
- No se añaden scripts, estilos, fuentes o imágenes de terceros.
- El generador escapa texto y atributos antes de producir HTML.
- El catálogo es código confiable versionado; no procesa contenido del usuario.
- El formulario conserva JSON, límite de 16 KiB, validación servidor, rate limiting, honeypot y errores redactados.
- Los redirects solo se construyen desde rutas conocidas y UTM allowlisted; no existe parámetro de destino ni open redirect.
- Render directo conserva redirección canónica para documentos y acceso a endpoints técnicos necesarios.
- No se exponen secretos ni configuración privada en HTML generado.

## 15. Accesibilidad

- Un H1 único por página.
- Jerarquía H2/H3 sin saltos utilizados solo por estilo.
- Landmarks `header`, `nav`, `main` y `footer` compartidos.
- Skip link funcional.
- Breadcrumb con lista y nombre accesible.
- Links para navegación; buttons para acciones.
- Texto accesible para el indicador contextual del formulario.
- Estados focus visibles y contraste coherente con el sistema existente.
- FAQ mediante `details`/`summary`.
- Fieldsets, legends, labels, errores y foco del formulario preservados.
- Imágenes con dimensiones y alt contextual; decoraciones con alt vacío o `aria-hidden`.
- Movimiento desactivable mediante `prefers-reduced-motion`.
- Revisión móvil sin overflow horizontal.

## 16. Manejo de errores

### 16.1 Generación

El generador debe terminar con código distinto de cero y no dejar salidas parcialmente actualizadas cuando:

- falta un campo requerido;
- una ruta, canonical, title, H1 o `page_type` se repite;
- el `page_type` no pertenece a la allowlist de cuatro valores;
- `relatedSituation` no es `mora_hipotecaria`, `necesita_vender_rapido` o ausencia;
- un enlace interno apunta a una ruta no registrada;
- sitemap y catálogo divergen.

### 16.2 Runtime

- Rutas no registradas → 404 real.
- Analytics ausente o inválido → no-op seguro.
- Fallo analítico → nunca rompe navegación o formulario.
- Validación local → no hace request ni emite `form_submit_attempt`.
- 4xx/5xx o respuesta sin creación confirmada → nunca emite `generate_lead`.
- Errores de red/servidor conservan estados accesibles y mensajes sin PII.

## 17. Estrategia de pruebas TDD

La implementación comenzará con tests RED por comportamiento, no con snapshots ciegos de strings.

### 17.1 Generador

- produce las cuatro páginas y sitemap;
- es determinista;
- rechaza catálogo incompleto o duplicado;
- rechaza `page_type` fuera de la allowlist;
- detecta archivos versionados desactualizados;
- comparte una única salida de formulario en las cuatro páginas.

### 17.2 Routing y HTTP

- `/` y las tres rutas P1 responden 200 en host canónico;
- `.html` y trailing slash redirigen a la ruta correcta;
- HTTP, `www` y Render no sirven copias indexables;
- redirects preservan solo UTM seguras;
- no existen loops ni open redirects;
- assets, `/healthcheck` y `/api/leads` mantienen sus contratos.

### 17.3 SEO on-page

- title, meta description, H1, canonical y `og:url` exactos y únicos;
- cuatro páginas con `index, follow`;
- sitemap contiene solo cuatro URLs canónicas;
- `success.html` y aliases quedan fuera;
- robots no bloquea las páginas;
- todos los enlaces internos resuelven.

### 17.4 Formulario y analytics

- el formulario generado tiene los mismos nombres, opciones, validaciones y endpoint en las cuatro páginas;
- ningún radio está preseleccionado;
- solo venta rápida y deuda muestran indicación contextual correcta;
- la indicación no modifica el payload;
- cada página emite su `page_type` exacto y `pathname` separado;
- valores arbitrarios de `page_type` se rechazan;
- UTM, atribución y eventos existentes no sufren regresión;
- no puede salir PII por analytics;
- `generate_lead` depende de éxito real del backend.

### 17.5 Accesibilidad y contenido

- un H1 y jerarquía de headings válida por página;
- navegación, breadcrumbs, CTA, FAQ y formulario tienen nombres accesibles;
- no hay elementos interactivos anidados;
- el contenido editorial específico no contiene bloques extensos idénticos;
- la comparación de duplicación excluye deliberadamente layout, formulario y footer compartidos;
- no aparecen promesas, porcentajes, cifras, testimonios o credenciales prohibidos.

### 17.6 Regresión

- los 87 tests de la base deben seguir pasando;
- `npm run build`, `npm test` y `npm audit` deben finalizar correctamente;
- revisión local controlada en desktop y móvil debe confirmar navegación, CTA, formulario, foco, overflow y consola;
- cualquier finding válido se corrige mediante RED → GREEN.

## 18. Criterios de aceptación

SEO-005 puede considerarse GREEN cuando:

- las cuatro superficies provienen de la base común y sus HTML están versionados;
- la homepage conserva su intención y lenguaje gráfico;
- las tres páginas P1 tienen contenido sustancial y diferenciado;
- cada página responde al cluster de SEO-004 asignado;
- formulario, validaciones, contrato y backend son idénticos;
- ninguna situación se preselecciona;
- el indicador contextual funciona sin representar selección;
- la allowlist comercial contiene exactamente los cuatro `page_type` aprobados;
- `pathname`, UTM y atribución permanecen separados y seguros;
- canonical, metadata, Open Graph, sitemap y routing son correctos;
- enlaces bidireccionales y CTA funcionan;
- `success.html` continúa fuera del sitemap y de la taxonomía comercial;
- no existen promesas ni afirmaciones no demostradas;
- CSP, PII y contratos de seguridad no sufren regresión;
- suite completa y audit pasan;
- revisión independiente termina sin Critical ni Important.

## 19. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Generated HTML diverge de la fuente | prueba de regeneración determinista contra archivos versionados |
| El formulario se bifurca por página | único `renderLeadForm()` y prueba de contrato estructural |
| Resaltado parece selección | sin `checked`/`aria-selected`, texto explícito y estilos distintos del estado seleccionado |
| Canibalización homepage/P1 | intención y H1 diferenciados; enlaces editoriales con una URL principal por cluster |
| Promesas de compra, plazo o precio | allowlist editorial de claims prohibidos y revisión de copy |
| Asesoría legal implícita | fuentes oficiales, lenguaje condicional y delimitación profesional |
| Experiencia constructiva exagerada | prohibición de años, cifras, credenciales, porcentajes y resultados |
| Aliases indexables | redirects permanentes, canonical autorreferente y pruebas HTTP |
| Worker y servidor divergen | contratos compartidos por tests y matriz de host/protocolo/path |
| Analytics acepta intención arbitraria | allowlist cerrada de cuatro valores en catálogo y analytics |
| PII llega a analytics | conservar schemas SEO-003 y pruebas de dataflow real |
| Copy común se duplica artificialmente | separar chrome/form de contenido editorial en control de duplicación |

## 20. Verificación y cierre

Antes del commit de implementación se deberá ejecutar:

- `npm run build`
- `npm test`
- `npm audit`
- validación de archivos generados;
- matriz HTTP local/controlada;
- revisión del diff completo;
- `git status`;
- revisión independiente mediante `superpowers:requesting-code-review`.

No se hará push ni deploy en SEO-005. La documentación de implementación deberá registrar resultados reales, tests añadidos, decisiones finales, riesgos y cualquier verificación que dependa de producción.
