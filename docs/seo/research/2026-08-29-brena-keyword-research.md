# BRENA-WEB-SEO-004 — Investigación y mapa de palabras clave

Fecha de investigación: 2026-08-29

Sitio: `https://brena.cl/`

Base analizada: `40b9300c5df9ba41f04d9df12c1ddcce26506839`

Alcance: investigación y arquitectura documental; no se modificó producto.

## 1. Resumen ejecutivo

BRENA no debe competir como un portal inmobiliario generalista ni como una fuente de asesoría legal. La oportunidad defendible es ayudar a propietarios en Chile a evaluar una propiedad que se volvió un problema por deuda, urgencia, deterioro, gastos recurrentes o una situación hereditaria, y conducirlos a una conversación inicial sin prometer compra, precio ni plazo.

Se investigaron 66 expresiones: 55 se organizaron en nueve clusters perseguibles y once se registraron en seis familias descartadas. No se dispone de Search Console, Keyword Planner ni una herramienta cuantitativa autorizada; por eso todos los campos de volumen y competencia cuantitativa se declaran `NO DISPONIBLE`. La presencia, composición y recurrencia en SERP se usa solo como evidencia cualitativa de lenguaje e intención, nunca como estimación de demanda.

La arquitectura recomendada es deliberadamente pequeña:

- la homepage conserva la intención amplia de evaluación de propiedades complejas;
- tres páginas comerciales P1 responden a venta rápida, propiedad con deudas y propiedad en mal estado;
- los temas de remodelación, herencia/copropiedad, costos de mantener una propiedad y evaluación económica se abordan después, con condiciones explícitas;
- una guía de proceso de venta queda como apoyo P3;
- no se recomiendan páginas por comuna, promesas de venta en días, asesoría de insolvencia ni productos financieros no demostrados.

## 2. Propuesta de valor reconstruida

La propuesta se reconstruyó exclusivamente desde el contenido y el flujo existentes:

- público declarado: propietarios con atraso hipotecario u otras deudas, gastos acumulados o falta de liquidez, propiedad desocupada o deteriorada, herencia/copropiedad, o necesidad de vender pronto;
- promesa visible y demostrable: BRENA revisa la situación y explica si puede ayudar, considerando deuda, costos mensuales, estado legal, condición del inmueble y tiempo disponible;
- tono de conversión actual: conversación clara, confidencial, sin obligación;
- límite explícito: BRENA no compra todas las propiedades; primero evalúa cada caso.

No está demostrado en el sitio que BRENA compre directamente todos los inmuebles, opere en todo Chile, entregue una oferta en un plazo fijo, haga tasaciones certificadas o preste asesoría legal/financiera. Esas afirmaciones no deben incorporarse a la estrategia sin confirmación y evidencia del negocio.

## 3. Fuentes utilizadas

### 3.1 Fuentes internas

- homepage y formulario productivos: `frontend/public/index.html` y `frontend/public/scripts.js`;
- contrato de leads: `src/lead-contract.js`;
- diagnóstico SEO-001: `docs/seo/audits/2026-08-29-brena-public-seo-baseline.md`;
- fundación técnica SEO-002: `docs/seo/implementation/2026-08-29-brena-web-seo-002-technical-foundation.md`;
- medición SEO-003: `docs/seo/implementation/2026-08-29-brena-web-seo-003-measurement-conversions.md`;
- diseño funcional público: `docs/superpowers/specs/2026-08-26-brena-public-v2-design.md`.

### 3.2 Fuentes públicas primarias y especializadas

- [ChileAtiende: cancelación de hipotecas y alzamiento de prohibiciones](https://www.chileatiende.gob.cl/fichas/12155-cancelacion-de-los-registros-de-hipotecas-y-alzamiento-de-prohibiciones);
- [ChileAtiende: posesión efectiva de herencias intestadas](https://www.chileatiende.gob.cl/fichas/3364-posesion-efectiva-de-herencias-intestadas-sin-testamento);
- [Biblioteca del Congreso Nacional: posesión efectiva sin testamento](https://www.bcn.cl/api-leyfacil/servicio/ObtenerGuiaPublicadaHTML?uri=posesion-efectiva-sin-testamento);
- [Conservador de Bienes Raíces de Santiago: inscripción de posesión efectiva](https://conservador.cl/portal/posesion_efectiva);
- [SII: guía de contribuciones de bienes raíces](https://www.sii.cl/destacados/reavaluo/guiapasoapaso_contribuciones.html);
- [SERVIU Metropolitano: guía para el vendedor de una vivienda usada](https://serviumetropolitana.minvu.gob.cl/wp-content/uploads/2023/08/Guia-para-el-Vendedor-de-una-Vivienda-Usada.pdf).

### 3.3 SERP y lenguaje de usuarios

Se observaron resultados reales de Google Chile el 2026-08-29 con `hl=es`, `gl=cl` y personalización desactivada para cinco consultas semilla: `vender casa con deudas Chile`, `vender casa rápido Chile`, `vender casa en mal estado Chile`, `vender o remodelar antes de vender casa Chile` y `vender propiedad heredada Chile`. Se registraron resultados orgánicos, anuncios, People Also Ask, búsquedas relacionadas, videos y foros.

También se revisó lenguaje de consultas en Reddit (`r/chile`, `r/Santiago` y `r/FinanzasChile`) sobre venta con crédito hipotecario, reparaciones antes de vender, venta urgente, inmuebles difíciles de vender y herencias. Los foros sirven para reconocer formulaciones y dudas; no se usan como autoridad legal ni financiera.

Los resultados cambian por fecha, dispositivo y ubicación. Esta captura es una línea base cualitativa, no un registro de posiciones ni de volumen.

### 3.4 Manifiesto reproducible de evidencia

El texto de `source` en el CSV coincide literalmente con una fila de este manifiesto. `Observada` significa que la formulación o intención apareció en la superficie indicada. `Derivada` significa que es una formulación editorial construida desde problemas demostrados; no se presenta como consulta con demanda comprobada. Las etiquetas que combinan fuentes heredan ambos estados y el detalle se conserva en `notes`.

| Etiqueta exacta en CSV | ID(s) | Estado | Evidencia reproducible |
|---|---|---|---|
| Sitio BRENA | INT-01 | Derivada | `frontend/public/index.html`: hero, sección de situaciones, FAQ y formulario |
| Lenguaje derivado de problemas declarados por BRENA | INT-01 | Derivada | `frontend/public/index.html`: deuda, gastos, deterioro, herencia y urgencia |
| Lenguaje del problema declarado por BRENA | INT-01 | Derivada | `frontend/public/index.html`: gastos acumulados y falta de liquidez |
| Metodología declarada por BRENA | INT-01 | Derivada | `frontend/public/index.html`: deuda, costos mensuales, estado legal y tiempo disponible |
| Sitio BRENA y síntesis SERP | INT-01 + SERP-01..05 | Derivada | fuente interna más cinco consultas Google documentadas debajo |
| Google SERP Chile 2026-08-29 | SERP-01..05 | Observada | consulta correspondiente al cluster, `hl=es`, `gl=cl`, `pws=0` |
| Google SERP Chile y ChileAtiende | SERP-01 + PUB-01 | Observada | SERP deuda más ficha oficial de alzamiento |
| Google búsquedas relacionadas y Reddit r/Santiago | SERP-02 + FORUM-02 | Observada | relacionados de venta rápida y post de urgencia |
| Google SERP y TOCTOC | SERP-02 | Observada | SERP de venta rápida; TOCTOC fue uno de los resultados orgánicos |
| Lenguaje SERP y foros | SERP-02 + FORUM-02 + FORUM-04 | Observada | venta urgente, plazo, precio y propiedad difícil de vender |
| Google People Also Ask y ChileAtiende | SERP-01 + PUB-01 | Observada | preguntas de deuda/hipoteca y ficha oficial |
| Google People Also Ask y SERVIU | SERP-01..05 + PUB-06 | Observada | preguntas de requisitos observadas y guía oficial de venta |
| Reddit r/chile y búsquedas relacionadas | FORUM-01 + SERP-01 | Observada | consulta hipotecaria literal y relacionados de Google |
| Google SERP y FAQ actual de BRENA | SERP-03 + INT-01 | Observada | SERP mal estado más FAQ que permite conversar sin reparar |
| FAQ actual BRENA y SERP | INT-01 + SERP-03 | Observada | misma evidencia, ordenada desde la fuente interna |
| Reddit r/chile y Google SERP | FORUM-03 + SERP-04 | Observada | reparaciones antes de vender y SERP remodelar/vender |
| Google SERP videos y foros | SERP-04 + FORUM-03 | Observada | resultados de video y discusión de reparaciones |
| Google búsquedas relacionadas y Reddit | SERP-05 + FORUM-04 | Observada | herencia/copropiedad y lenguaje de activo difícil de vender |
| Google People Also Ask 2026-08-29 | SERP-01..05 | Observada | pregunta correspondiente a cada cluster en la muestra Google |
| ChileAtiende BCN y Conservador | PUB-02 + PUB-03 + PUB-04 | Observada | fuentes oficiales sobre posesión efectiva e inscripción |
| Sitio BRENA y SERP hereditaria | INT-01 + SERP-05 | Derivada | herencia/copropiedad interna más intención legal/comercial observada |
| Sitio BRENA y SII | INT-01 + PUB-05 | Derivada | problema interno de gastos más guía oficial de contribuciones |
| SII y síntesis de costos del sitio BRENA | PUB-05 + INT-01 | Derivada | contribuciones verificadas; otros costos deben probarse por caso |
| Google SERP herramientas de tasación | SEARCH-01 | Observada | búsqueda web `tasar propiedad online Chile cuánto vale mi casa` |
| Google SERP herramientas y portales | SEARCH-01 | Observada | Tinsa, HousePricing, Calcular.cl y ZonaPropiedades en resultados |
| Síntesis SERP de costos y valoración | SEARCH-01 + SERP-04 | Derivada | intersección editorial de valoración, costos y decisión |
| SERVIU y Google SERP Chile | PUB-06 + SERP-01..05 | Observada | guía oficial y preguntas transversales de venta |
| SERVIU bancos y portales | PUB-06 + SEARCH-02 | Observada | guía oficial y búsqueda web de proceso/documentos |
| SERVIU y Google People Also Ask | PUB-06 + SERP-01..05 | Observada | guía oficial y preguntas de requisitos observadas |
| SERVIU portales y corredores | PUB-06 + SEARCH-02 | Observada | guía oficial y resultados del proceso de venta |
| Portales corredores y SERVIU | SEARCH-02 + PUB-06 | Observada | misma evidencia ordenada desde los resultados comerciales |
| Anuncios y competidores de venta rápida | SERP-02 | Observada | anuncios y resultados comerciales de la muestra de venta rápida |
| Google SERP deuda y búsquedas relacionadas | SERP-01 | Observada | deuda, embargo y consultas relacionadas; se descarta como objetivo legal |
| Lenguaje adyacente en SERP financiera | SERP-01 + SEARCH-03 | Derivada | DICOM/insolvencia apareció como problema adyacente, no servicio BRENA |
| Google SERP bancaria | SEARCH-03 | Observada | búsqueda web `refinanciar crédito hipotecario Chile` |
| Google SERP financiera | SEARCH-03 | Observada | búsqueda web `leaseback inmobiliario Chile` |
| Google SERP inmobiliaria | SEARCH-04 | Observada | búsqueda web `comprar propiedades para invertir Chile` |
| Google SERP remodelación | SERP-04 | Observada | resultados de remodelación y flipping; audiencia inversora descartada |
| Patrón SEO evaluado | QA-01 | Derivada | control anti-doorway de esta investigación; no es demanda observada |
| Lenguaje comercial competidor | SERP-02 | Observada | claims de precio/plazo de competidores; no se recomiendan |

Identificadores y localizadores:

- INT-01: `frontend/public/index.html` y `frontend/public/scripts.js` en la base analizada.
- PUB-01: [ChileAtiende, cancelación de hipotecas](https://www.chileatiende.gob.cl/fichas/12155-cancelacion-de-los-registros-de-hipotecas-y-alzamiento-de-prohibiciones).
- PUB-02: [ChileAtiende, posesión efectiva](https://www.chileatiende.gob.cl/fichas/3364-posesion-efectiva-de-herencias-intestadas-sin-testamento).
- PUB-03: [BCN, posesión efectiva sin testamento](https://www.bcn.cl/api-leyfacil/servicio/ObtenerGuiaPublicadaHTML?uri=posesion-efectiva-sin-testamento).
- PUB-04: [Conservador, inscripción de posesión efectiva](https://conservador.cl/portal/posesion_efectiva).
- PUB-05: [SII, contribuciones](https://www.sii.cl/destacados/reavaluo/guiapasoapaso_contribuciones.html).
- PUB-06: [SERVIU, guía para vender vivienda usada](https://serviumetropolitana.minvu.gob.cl/wp-content/uploads/2023/08/Guia-para-el-Vendedor-de-una-Vivienda-Usada.pdf).
- SERP-01: [Google: vender casa con deudas Chile](https://www.google.com/search?q=vender+casa+con+deudas+Chile&hl=es&gl=cl&pws=0), observado 2026-08-29.
- SERP-02: [Google: vender casa rápido Chile](https://www.google.com/search?q=vender+casa+r%C3%A1pido+Chile&hl=es&gl=cl&pws=0), observado 2026-08-29.
- SERP-03: [Google: vender casa en mal estado Chile](https://www.google.com/search?q=vender+casa+en+mal+estado+Chile&hl=es&gl=cl&pws=0), observado 2026-08-29.
- SERP-04: [Google: vender o remodelar antes de vender casa Chile](https://www.google.com/search?q=vender+o+remodelar+antes+de+vender+casa+Chile&hl=es&gl=cl&pws=0), observado 2026-08-29.
- SERP-05: [Google: vender propiedad heredada Chile](https://www.google.com/search?q=vender+propiedad+heredada+Chile&hl=es&gl=cl&pws=0), observado 2026-08-29.
- SEARCH-01: búsqueda web `tasar propiedad online Chile cuánto vale mi casa`, 2026-08-29.
- SEARCH-02: búsqueda web `documentos pasos costos vender propiedad Chile`, 2026-08-29.
- SEARCH-03: búsquedas web `refinanciar crédito hipotecario Chile` y `leaseback inmobiliario Chile`, 2026-08-29.
- SEARCH-04: búsqueda web `comprar propiedades para invertir Chile`, 2026-08-29.
- FORUM-01: [Reddit: vender una casa que se paga con crédito hipotecario](https://www.reddit.com/r/chile/comments/1331tfl/se_puede_vender_una_casa_que_actualmente_estoy/).
- FORUM-02: [Reddit: vender un departamento de manera urgente](https://www.reddit.com/r/Santiago/comments/1vso10x/necesito_vender_un_departamento_en_providencia_de/).
- FORUM-03: [Reddit: qué reparar antes de vender](https://www.reddit.com/r/chile/comments/1v0607t/al_vender_una_propiedad_casadepto_qu%C3%A9_consideran/).
- FORUM-04: [Reddit: departamento difícil de vender](https://www.reddit.com/r/FinanzasChile/comments/1vx7abg/departamento_invendible/).
- QA-01: checklist de calidad de la fase 12: sin doorways, stuffing, promesas ni una URL por keyword.

## 4. Metodología

1. Se reconstruyó el alcance real de BRENA desde archivos, contratos y contenido actual.
2. Se expandieron seis familias conceptuales con lenguaje observado en SERP, preguntas relacionadas, búsquedas relacionadas y foros.
3. Cada término se clasificó por intención, problema, etapa, proximidad a conversión, ajuste con BRENA, riesgo y necesidad de revisión experta.
4. Se agruparon términos por necesidad y resultado esperado, no por coincidencia léxica.
5. Cada cluster se asignó a una sola página principal candidata para evitar canibalización.
6. La prioridad se determinó cualitativamente por ajuste, intención comercial, proximidad, evidencia observable, capacidad diferencial, dificultad SERP, riesgo y dependencia de autoridad externa.
7. Se descartaron términos que exigen servicios no demostrados, promesas, páginas doorway o asesoría especializada fuera de alcance.

No se creó un score numérico: faltan métricas homogéneas para sostenerlo.

## 5. Familias investigadas

| Familia | Lenguaje observado | Lectura de intención | Decisión |
|---|---|---|---|
| Propiedad con deudas | vender casa hipotecada, vender propiedad con deuda, qué pasa con la hipoteca | informacional con transición a solución comercial | cluster P1, con fuentes y revisión experta |
| Venta rápida | vender casa rápido, necesito vender urgente, empresa que compra casas | transaccional/comercial; SERP con anuncios y compradores directos | cluster P1, sin prometer días ni precio |
| Mal estado | vender casa en mal estado, vender sin remodelar, qué arreglar antes de vender | mezcla comercial y de decisión | página comercial P1 + guía P2 separada |
| Decisión económica | remodelar o vender, cuánto invertir, cuánto vale realmente | investigación comercial/informacional | metodología BRENA; no fingir tasación certificada |
| Liquidez y costos | propiedad desocupada genera gastos, no puedo seguir pagando | problema real declarado por BRENA, evidencia externa limitada | P2 dentro de homepage hasta validar demanda |
| Herencia/copropiedad | vender casa heredada, vender entre hermanos, requisitos | intención alta, SERP legal y de corretaje | P2 condicionado a revisión legal y proceso real |
| Proceso educativo | documentos, costos y pasos para vender | informacional amplio y competido | guía P3 de apoyo |

## 6. Clusters finales

### BR-01 — Evaluar una propiedad que se volvió un problema

- Problema: el propietario no sabe si la deuda, los gastos, el deterioro o el tiempo disponible hacen viable una salida.
- Intención principal: Commercial investigation.
- Keyword primaria candidata: `evaluar opciones para una propiedad con problemas`.
- Variantes: `qué hacer con una propiedad que genera problemas`, `solución para propiedad con deudas y gastos`, `ayuda para vender una propiedad complicada`.
- Pregunta relacionada: `¿qué opciones tengo si mi propiedad dejó de ser sostenible?`.
- Etapas: 2–4; proximidad media-alta.
- Página: homepage `/`.
- CTA: `Cuéntanos tu caso` / solicitud de evaluación inicial.
- Evidencia: propuesta actual de BRENA y combinación recurrente de deuda, costos, condición y tiempo en el formulario.
- Diferenciación: comparación explícita de alternativas con supuestos, costos y restricciones, sin prometer resultado.
- Riesgo: medio; requiere lenguaje cuidadoso para no parecer asesoría financiera.
- Prioridad: P1.

### BR-02 — Vender una propiedad rápido

- Problema: necesidad real de acortar el proceso de venta.
- Intención principal: Transactional.
- Keyword primaria candidata: `vender propiedad rápido`.
- Variantes: `vender casa rápido`, `necesito vender mi casa urgente`, `venta rápida de propiedad`, `cómo vender una propiedad rápido`.
- Preguntas relacionadas: `¿cuánto tarda vender una casa?`, `¿cómo vender rápido sin malvender?`.
- Etapas: 3–5; proximidad alta.
- Página futura: `/vender-propiedad-rapido`.
- CTA: solicitar evaluación del caso y del plazo disponible.
- Evidencia: anuncios y resultados de compradores directos, guías, portales y videos; PAA sobre tiempo de venta; lenguaje explícito en SERP y foros.
- Diferenciación: explicar el intercambio entre plazo, precio, costos, condición y certeza; no usar promesas como 24 horas o siete días.
- Riesgo: medio; la página debe confirmar el modelo real de BRENA y no insinuar compra garantizada.
- Prioridad: P1.

### BR-03 — Vender una propiedad con hipoteca o deudas

- Problema: incertidumbre sobre si se puede vender y cómo se resuelven gravámenes o saldos.
- Intención principal: Commercial investigation.
- Keyword primaria candidata: `vender propiedad con deuda hipotecaria`.
- Variantes: `vender casa hipotecada`, `vender casa con deuda bancaria`, `vender casa que todavía estoy pagando`, `vender propiedad con deudas`.
- Preguntas relacionadas: `¿qué pasa con la hipoteca al vender?`, `¿se puede vender una casa con deudas?`.
- Etapas: 1–4; proximidad media-alta.
- Página futura: `/vender-propiedad-con-deudas`.
- CTA: evaluación preliminar de deuda, costos y alternativas; derivación profesional cuando corresponda.
- Evidencia: Google PAA y búsquedas relacionadas; ChileAtiende; resultados de Portal Inmobiliario, Tinsa, Engel & Völkers, corredores y abogados; consulta recurrente en Reddit.
- Diferenciación: mostrar qué antecedentes se necesitan y comparar saldo, costos y alternativas con fuentes oficiales.
- Riesgo: alto legal/financiero; todo contenido procesal debe revisarse por profesional competente y distinguir orientación general de asesoría.
- Prioridad: P1.

### BR-04 — Vender una propiedad en mal estado

- Problema: el propietario teme que el deterioro impida vender o exija una remodelación que no puede financiar.
- Intención principal: Commercial investigation.
- Keyword primaria candidata: `vender casa en mal estado`.
- Variantes: `vender propiedad en mal estado`, `vender casa sin remodelar`, `vender casa para remodelar`, `vender casa deteriorada`.
- Pregunta relacionada: `¿se puede vender una casa sin arreglarla?`.
- Etapas: 2–5; proximidad alta.
- Página futura: `/vender-propiedad-en-mal-estado`.
- CTA: solicitar revisión del estado y las alternativas.
- Evidencia: SERP mixta con compradores directos, guías, regularización, medios y avisos; la FAQ actual de BRENA dice que no es necesario reparar antes de conversar.
- Diferenciación: separar estado físico, regularización, costo, tiempo y valor recuperable; usar experiencia constructiva solo cuando esté documentada.
- Riesgo: medio-alto; no confundir deterioro con problemas jurídicos o de recepción municipal.
- Prioridad: P1.

### BR-05 — Remodelar o vender tal como está

- Problema: decidir si una inversión previa recuperará costo y tiempo.
- Intención principal: Commercial investigation.
- Keyword primaria candidata: `conviene remodelar antes de vender`.
- Variantes: `remodelar o vender`, `arreglar casa antes de vender`, `qué arreglar antes de vender una casa`, `cuánto invertir antes de vender`.
- Pregunta relacionada: `¿qué reparaciones aumentan realmente el valor de venta?`.
- Etapas: 2–3; proximidad media.
- Página futura: `/guias/remodelar-o-vender-antes-de-vender`.
- CTA: evaluar escenarios, no solicitar una remodelación.
- Evidencia: resultados de corredores, arquitectos, flipping, videos y conversación de usuarios; ausencia de un marco chileno transparente y consistente en la muestra.
- Diferenciación: matriz costo–plazo–valor recuperable–riesgo y escenarios con supuestos visibles.
- Riesgo: medio; los ejemplos deben ser autorizados y no presentarse como retornos garantizados.
- Prioridad: P2.

### BR-06 — Vender una propiedad heredada o en copropiedad

- Problema: múltiples titulares, posesión efectiva, inscripción o falta de acuerdo.
- Intención principal: Commercial investigation; las preguntas jurídicas de apoyo son informacionales.
- Keyword primaria candidata: `vender propiedad heredada en Chile`.
- Variantes: `vender casa heredada`, `vender casa heredada entre hermanos`, `vender parte de una propiedad heredada`, `vender propiedad en copropiedad`.
- Preguntas relacionadas: `¿qué documentos se necesitan?`, `¿se puede vender sin la firma de un heredero?`.
- Etapas: 1–4; proximidad variable.
- Página futura condicional: `/vender-propiedad-heredada`.
- CTA: identificar si el caso está documentalmente habilitado y derivar cuando corresponda.
- Evidencia: ChileAtiende, BCN y Conservador; SERP dominada por abogados, corredores y franquicias; PAA sobre requisitos, impuestos y consentimiento.
- Diferenciación: checklist de preparación y límites claros de lo que BRENA puede evaluar.
- Riesgo: alto legal; publicar solo con revisión profesional, proceso comercial confirmado y fuentes fechadas.
- Prioridad: P2.

### BR-07 — Propiedad desocupada o que genera gastos

- Problema: contribuciones, gastos comunes, mantención y falta de liquidez vuelven insostenible conservar el activo.
- Intención principal: Commercial investigation.
- Keyword primaria candidata: `qué hacer con una propiedad que genera gastos`.
- Variantes: `propiedad desocupada genera gastos`, `no puedo seguir pagando los gastos de mi propiedad`, `vender propiedad por falta de liquidez`.
- Pregunta relacionada: `¿cuánto cuesta mantener una propiedad vacía?`.
- Etapas: 1–3; proximidad media.
- Página: homepage `/` inicialmente; no crear URL propia hasta validar demanda y diferenciación.
- CTA: cuantificar costos y pedir evaluación.
- Evidencia: problema declarado por BRENA; SII documenta contribuciones. La evidencia SERP específica fue más débil y fragmentada que en los clusters P1.
- Diferenciación: inventario mensual de costos de mantener versus alternativas.
- Riesgo: medio; no asumir que todos los costos aplican ni presentar una recomendación financiera individual.
- Prioridad: P2.

### BR-08 — Evaluación económica y valor de la propiedad

- Problema: confundir precio publicado, tasación y resultado neto de la decisión.
- Intención principal: Commercial investigation.
- Keyword primaria candidata: `cómo saber cuánto vale realmente una propiedad`.
- Variantes: `evaluar alternativas para una propiedad`, `calcular resultado de vender una casa`, `diferencia entre tasación y precio de venta`, `cuánto vale mi casa`.
- Pregunta relacionada: `¿qué costos debo descontar del precio de venta?`.
- Etapas: 2–3; proximidad media.
- Página futura: `/guias/evaluar-alternativas-para-una-propiedad`.
- CTA: solicitar evaluación del escenario, no una tasación certificada.
- Evidencia: herramientas y contenidos de Tinsa, TOCTOC, HousePricing, Calcular.cl, ZonaPropiedades y corredores; metodología económica declarada por BRENA.
- Diferenciación: precio probable no equivale a resultado neto; incorporar deuda, costos, reparaciones, plazo e incertidumbre.
- Riesgo: alto financiero/comercial; no llamar tasación a una estimación no certificada ni prometer exactitud.
- Prioridad: P2.

### BR-09 — Proceso, documentos y costos para vender

- Problema: desconocimiento de pasos, antecedentes y costos de una venta inmobiliaria.
- Intención principal: Informational.
- Keyword primaria candidata: `cómo vender una propiedad en Chile`.
- Variantes: `pasos para vender una casa`, `documentos para vender una propiedad`, `costos de vender una propiedad`, `requisitos para vender una casa`.
- Pregunta relacionada: `¿qué revisar antes de publicar una propiedad?`.
- Etapas: 1–3; proximidad baja-media.
- Página futura: `/guias/como-vender-una-propiedad-en-chile`.
- CTA: revisar el caso cuando existan deuda, deterioro, urgencia o costos difíciles de sostener.
- Evidencia: guía de SERVIU, bancos, portales y corredores; PAA transversal en las SERP observadas.
- Diferenciación: checklist verificable y enlaces a fuentes oficiales, conectado a los problemas específicos de BRENA.
- Riesgo: medio-alto por caducidad normativa y variación por caso; requiere actualización y revisión experta.
- Prioridad: P3.

## 7. Análisis de intención y funnel

| Cluster | Intención | Problema | Etapa principal | Proximidad | Ajuste BRENA | Riesgo | Experto |
|---|---|---|---|---|---|---|---|
| BR-01 | Commercial investigation | propiedad compleja | 2–4 | media-alta | alto | medio | recomendable |
| BR-02 | Transactional | urgencia | 3–5 | alta | alto | medio | validación negocio |
| BR-03 | Commercial investigation | deuda/hipoteca | 1–4 | media-alta | alto | alto | legal/financiero obligatorio |
| BR-04 | Commercial investigation | deterioro | 2–5 | alta | alto | medio-alto | constructivo/legal según caso |
| BR-05 | Commercial investigation | remodelar o vender | 2–3 | media | alto | medio | constructivo/financiero |
| BR-06 | Commercial investigation | herencia/copropiedad | 1–4 | variable | medio-alto | alto | legal obligatorio |
| BR-07 | Commercial investigation | gastos/liquidez | 1–3 | media | alto | medio | financiero recomendable |
| BR-08 | Commercial investigation | valor/resultado neto | 2–3 | media | alto | alto | tasación/financiero según afirmación |
| BR-09 | Informational | proceso/documentos | 1–3 | baja-media | medio | medio-alto | legal/editorial |

## 8. Competencia SERP

### 8.1 Muestras observadas

| Consulta | Tipo dominante | Dominios/tipos observados | Qué parece premiar Google | Vacío defendible para BRENA |
|---|---|---|---|---|
| vender casa con deudas Chile | guías + corredores + abogados; anuncios adyacentes | Portal Inmobiliario, Tinsa, Engel & Völkers, Divergente, Superir, estudios jurídicos | explicación de viabilidad, hipoteca, prohibiciones y pasos | integrar deuda, costos, estado y plazo sin dar asesoría individual |
| vender casa rápido Chile | comercial/transaccional | Vendertupropiedad.cl, Compramostucasa.cl, Enapuro, Macal, TOCTOC, HousePricing; videos | respuesta inmediata, oferta/venta rápida, consejos prácticos | explicar trade-offs y criterios sin promesa de días ni precio |
| vender casa en mal estado Chile | comercial + guías + regularización | Resuelve Propiedades, La Casa de Juana, Compara Corredores, medios y regularizadores | venta tal cual, arreglos, problemas legales/municipales | separar condición física de condición jurídica y comparar escenarios |
| vender o remodelar antes de vender casa Chile | guías, videos y foros | César Gómez, Inversión Total, Reddit, Arqglobal, Divergente, Lares | listas de mejoras y opiniones de retorno | marco cuantitativo transparente con supuestos y límites |
| vender propiedad heredada Chile | legal + corretaje | GPremium, Becker Abogados, PyG, RE/MAX, Aguila & Cía., Fuster, ABO | requisitos, impuestos, consentimiento y tramitación | checklist de preparación con fuentes oficiales y derivación experta |

### 8.2 Tipos de competidor observados

- compradores directos y servicios de venta urgente: Compramostucasa.cl, Vendertupropiedad.cl, Enapuro, Cinco Inversiones;
- corredores y franquicias: Engel & Völkers, RE/MAX, Divergente Propiedades, GPremium, Compara Corredores;
- portales y medios: Portal Inmobiliario, TOCTOC, La Tercera;
- bancos y organismos públicos: Santander, ChileAtiende, SII, SERVIU, BCN, Conservador;
- abogados y especialistas hereditarios: Becker Abogados, Aguila & Cía., Fuster, ABO;
- herramientas de precio/tasación: Tinsa, HousePricing, Calcular.cl, ZonaPropiedades;
- videos, redes y foros: YouTube, TikTok, Instagram y Reddit.

La SERP no justifica copiar el formato de los compradores directos. BRENA puede diferenciarse si hace visible una metodología de decisión económica, reconoce incertidumbre y enlaza fuentes oficiales.

## 9. Mapa keyword → página

| Cluster | Decisión | URL candidata | Tipo | Evita canibalizar con |
|---|---|---|---|---|
| BR-01 | A: homepage actual | `/` | comercial amplia | todas las páginas específicas deben volver a la evaluación general |
| BR-02 | B: página comercial futura | `/vender-propiedad-rapido` | comercial | BR-01 y BR-09 |
| BR-03 | B: página comercial futura | `/vender-propiedad-con-deudas` | comercial/educativa | BR-06 y contenido jurídico |
| BR-04 | B: página comercial futura | `/vender-propiedad-en-mal-estado` | comercial | BR-05 |
| BR-05 | C: guía | `/guias/remodelar-o-vender-antes-de-vender` | informativa de decisión | BR-04 |
| BR-06 | B condicional | `/vender-propiedad-heredada` | comercial/educativa | asesoría legal y BR-09 |
| BR-07 | A por ahora | `/` | sección/FAQ de homepage | una página delgada sobre gastos |
| BR-08 | C: guía | `/guias/evaluar-alternativas-para-una-propiedad` | informativa de decisión | homepage y herramientas de tasación |
| BR-09 | C: guía | `/guias/como-vender-una-propiedad-en-chile` | informativa | guías específicas de deuda/herencia |

No se recomienda crear `/como-funciona` solo por arquitectura: la homepage ya explica el proceso y no apareció evidencia suficiente de una intención independiente. Tampoco se recomienda `/preguntas-frecuentes` hasta disponer de preguntas reales suficientes; las FAQ pueden vivir inicialmente dentro de cada página correspondiente.

## 10. Priorización

La prioridad no es un score. Se tomó una decisión editorial usando el conjunto de señales descrito en metodología.

### P1 — construir primero

- BR-01: homepage como puerta de evaluación de una propiedad compleja.
- BR-02: venta rápida, condicionado a describir con exactitud el modelo comercial.
- BR-03: venta con deuda/hipoteca, con revisión legal y financiera.
- BR-04: venta en mal estado, separada de la guía de remodelación.

### P2 — segunda expansión

- BR-05: guía remodelar o vender.
- BR-06: propiedad heredada/copropiedad, solo tras revisión legal y confirmación operativa.
- BR-07: propiedad desocupada o con costos; mantener en homepage hasta obtener demanda propia.
- BR-08: evaluación económica; presentarla como comparación de escenarios, no tasación.

### P3 — apoyo

- BR-09: guía general de proceso, documentos y costos.

## 11. Keywords y familias descartadas

| Familia | Ejemplos | Motivo |
|---|---|---|
| DX-01 insolvencia/remate/embargo | evitar remate, vender casa embargada, salir de DICOM vendiendo | riesgo legal/financiero alto y solución BRENA no demostrada |
| DX-02 productos financieros | refinanciar hipoteca, leaseback inmobiliario | servicios no declarados por BRENA |
| DX-03 inversión genérica | comprar para invertir, flipping inmobiliario | usuario y objetivo distintos |
| DX-04 doorway geográfico | vender casa rápido + cada comuna | no existe evidencia de cobertura ni contenido diferencial por comuna |
| DX-05 promesas | vender en 24 horas, mejor precio garantizado | afirmaciones no demostrables y riesgo de confianza/regulatorio |
| DX-06 herramienta no existente | tasar propiedad online | la intención espera un estimador; BRENA no demuestra esa capacidad |

Una consulta descartada puede revelar el problema de un usuario, pero no debe convertirse automáticamente en una página objetivo. Si BRENA recibe un caso de embargo, herencia o deuda, debe describir sus límites y derivar a un profesional cuando sea necesario.

## 12. Diferenciación por experiencia propia

BRENA puede construir contenido defendible alrededor de:

- una metodología explícita para comparar mantener, reparar, remodelar o vender;
- el resultado neto, incorporando deuda, costos de mantención, reparaciones, plazo e incertidumbre;
- antecedentes mínimos para evaluar un caso sin pedir datos innecesarios;
- criterios de estado constructivo y escenarios de intervención, cuando haya evidencia profesional autorizada;
- preguntas reales recibidas por el equipo, anonimizadas y aprobadas;
- ejemplos reales solo con autorización, fuente y supuestos visibles.

Antes de usar “experiencia constructiva”, casos o resultados, Rodrigo debe aportar evidencia publicable. En ausencia de ella, el contenido debe limitarse al método y a fuentes externas verificables.

## 13. Riesgos y controles de calidad

- Keyword stuffing: una página responde a una intención; las variantes se usan naturalmente, no como bloques repetidos.
- Doorways: no crear páginas por comuna sin servicio, evidencia y contenido verdaderamente local.
- Canibalización: venta en mal estado es comercial; remodelar o vender es una decisión informativa. Deuda/hipoteca se separa de herencia/copropiedad.
- Métricas inventadas: volumen y competencia cuantitativa permanecen `NO DISPONIBLE`.
- Asesoría legal/financiera: deuda, prohibiciones, herencia, impuestos, tasación y retornos requieren fuentes, fecha, límites y revisión experta.
- Promesas: no afirmar compra, plazo, precio, ahorro, rentabilidad ni resultado garantizado.
- Contenido para Google: no producir páginas sin una pregunta humana, una respuesta propia y un siguiente paso útil.
- Datos personales: ejemplos, casos y preguntas deben estar anonimizados; SEO-003 prohíbe enviar PII a analítica.
- Caducidad: documentos, impuestos y procesos deben tener responsable editorial y fecha de revisión.

## 14. Información faltante

### Requiere Rodrigo

- confirmar si BRENA compra directamente, intermedia, invierte, remodela o combina modelos;
- confirmar cobertura geográfica real y restricciones de tipo/valor de inmueble;
- aportar credenciales profesionales, experiencia constructiva y metodología que puedan publicarse;
- aprobar casos, fotografías y resultados reales utilizables;
- definir quién revisará contenido legal, tributario, hipotecario y de tasación;
- habilitar acceso a Search Console y, si procede, Keyword Planner para incorporar demanda propia sin exponer datos sensibles;
- aportar preguntas reales de prospectos de forma anonimizada.

### Implementable por Codex después de aprobación

- convertir clusters aprobados en briefs de página;
- definir titles, H1, estructura, FAQ y enlazado interno;
- instrumentar los eventos de SEO-003 en nuevas páginas;
- validar metadata, schema sustentado y contratos SEO;
- incorporar métricas reales de Search Console cuando exista acceso.

## 15. Recomendación exacta para BRENA-WEB-SEO-005

SEO-005 debe diseñar, no publicar de inmediato, una arquitectura inicial de cuatro superficies: mantener `/` como evaluación general; preparar `/vender-propiedad-rapido`, `/vender-propiedad-con-deudas` y `/vender-propiedad-en-mal-estado`; y definir el enlazado bidireccional entre ellas. Antes de redactar, Rodrigo debe confirmar el modelo comercial, cobertura y revisores expertos. El ticket debe excluir por ahora páginas de herencia, páginas por comuna, herramientas de tasación, artículos masivos y cualquier promesa de plazo o precio.

Los contenidos P2/P3 deben quedar como backlog condicionado a evidencia: primero la guía remodelar versus vender; después herencia/copropiedad y evaluación económica; finalmente la guía general de venta. SEO-005 no debe crear una URL por keyword ni trasladar a la homepage todas las intenciones específicas.

## 16. Criterio de cierre de esta investigación

- 66 keywords candidatas documentadas con fuente y decisión;
- nueve clusters perseguibles con intención, etapa, página, CTA, evidencia, prioridad y riesgo;
- seis familias explícitamente descartadas;
- mapa de página sin duplicación estructural evidente;
- cero métricas cuantitativas inventadas;
- cero cambios de producto.
