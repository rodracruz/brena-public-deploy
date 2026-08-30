"use strict";

const PAGE_TYPES = new Set([
  "homepage",
  "commercial_fast_sale",
  "commercial_debt",
  "commercial_property_condition",
]);

const RELATED_SITUATIONS = new Set([null, "necesita_vender_rapido", "mora_hipotecaria"]);

const PAGES = [
  {
    route: "/", outputFile: "index.html", pageType: "homepage", cluster: "BR-01", breadcrumbLabel: null,
    title: "Brena | Soluciones para propiedades complejas",
    description: "¿Tienes una propiedad con deudas, desocupada, heredada o que necesitas vender pronto? Cuéntanos tu caso y descubre si Brena puede ayudarte.",
    h1: "Tu propiedad puede volver a ser una solución.", canonical: "https://brena.cl/",
    ogTitle: "Brena — Tu propiedad puede volver a ser una solución",
    ogDescription: "Revisamos propiedades con situaciones complejas de forma clara, confidencial y sin compromiso.",
    eyebrow: "Soluciones inmobiliarias con criterio",
    lead: "Si tienes deudas, una propiedad desocupada, una herencia compleja o necesitas vender pronto, conversemos. Revisamos tu caso con claridad y te decimos si Brena puede ayudarte.",
    relatedSituation: null,
    sections: [], faqs: [],
    relatedLinks: ["/vender-propiedad-rapido", "/vender-propiedad-con-deudas", "/vender-propiedad-en-mal-estado"],
  },
  {
    route: "/vender-propiedad-rapido", outputFile: "vender-propiedad-rapido.html", pageType: "commercial_fast_sale", cluster: "BR-02", breadcrumbLabel: "Vender propiedad rápido",
    title: "Vender una propiedad rápido: evalúa tus alternativas | Brena",
    description: "Si necesitas vender una propiedad pronto, Brena evalúa ubicación, obligaciones, estado y plazo para estructurar una alternativa realista y sin promesas.",
    h1: "¿Necesitas vender una propiedad pronto? Evalúa antes de decidir.", canonical: "https://brena.cl/vender-propiedad-rapido",
    ogTitle: "Vender una propiedad rápido: evalúa tus alternativas | Brena",
    ogDescription: "Evalúa las variables que afectan el tiempo y las alternativas para una propiedad que necesitas vender pronto.",
    eyebrow: "Decidir con urgencia y con criterio",
    lead: "Acelerar una venta no significa aceptar cualquier alternativa. El plazo importa, pero también las obligaciones, el estado de la propiedad y el resultado económico completo.",
    relatedSituation: "necesita_vender_rapido",
    sections: [
      { title: "Vender pronto empieza por ordenar las variables", paragraphs: ["La urgencia puede venir de costos mensuales, un cambio familiar o la necesidad de obtener liquidez. Antes de elegir una ruta conviene distinguir qué plazo es necesario, qué antecedentes están disponibles y qué condiciones pueden limitar la operación.", "BRENA evalúa cada propiedad y, según sus condiciones, estructura la alternativa más conveniente, que puede incluir inversión directa, mejoramiento o remodelación previa a la venta y otras vías de comercialización."] },
      { title: "Qué evaluamos antes de proponer una alternativa", items: ["Ubicación y características de la propiedad.", "Estado físico y mejoras que podrían ser pertinentes.", "Obligaciones o trámites que puedan condicionar el proceso.", "Plazo real del propietario y costos de mantener la propiedad."] },
      { title: "Rapidez no equivale a una promesa", paragraphs: ["Cada alternativa tiene costos, tiempos y condiciones diferentes. BRENA no garantiza una venta, un precio ni un plazo: primero compara escenarios y explica cuál puede ser viable con la información disponible."] },
    ],
    faqs: [
      { question: "¿BRENA puede asegurar una fecha de venta?", answer: "No. El plazo depende de la propiedad, sus antecedentes y la alternativa evaluada. La revisión inicial permite ordenar una ruta sin prometer un resultado." },
      { question: "¿Debo aceptar la primera alternativa por tener urgencia?", answer: "No. El objetivo de la evaluación es comparar implicancias económicas y prácticas antes de que decidas cómo avanzar." },
    ],
    relatedLinks: ["/", "/vender-propiedad-con-deudas", "/vender-propiedad-en-mal-estado"],
  },
  {
    route: "/vender-propiedad-con-deudas", outputFile: "vender-propiedad-con-deudas.html", pageType: "commercial_debt", cluster: "BR-03", breadcrumbLabel: "Vender propiedad con deudas",
    title: "Vender una propiedad con deudas o hipoteca | Brena",
    description: "Brena evalúa deudas, costos, estado y alternativas de una propiedad. Cada obligación puede requerir confirmación del banco, acreedor o profesional.",
    h1: "Una propiedad con deudas necesita una evaluación completa.", canonical: "https://brena.cl/vender-propiedad-con-deudas",
    ogTitle: "Vender una propiedad con deudas o hipoteca | Brena",
    ogDescription: "Conoce qué antecedentes deben evaluarse y qué materias requieren confirmación del banco, acreedor o profesional.",
    eyebrow: "Obligaciones claras antes de decidir",
    lead: "Una hipoteca u otra obligación asociada no se analiza de forma aislada. Su tipo, saldo, estado y condiciones deben revisarse junto con la propiedad y el objetivo del propietario.",
    relatedSituation: "mora_hipotecaria",
    sections: [
      { title: "No todas las deudas tienen el mismo efecto", paragraphs: ["Para una orientación general es necesario identificar qué obligación existe, quién debe confirmarla y qué antecedentes económicos o documentales faltan. No corresponde asumir que todos los casos siguen el mismo procedimiento.", "BRENA puede ordenar la evaluación económica de la propiedad y comparar alternativas. Los saldos, condiciones de pago, cancelaciones, trámites y efectos jurídicos deben ser confirmados por el banco, acreedor, abogado u otro profesional competente, según corresponda."] },
      { title: "Antecedentes que ayudan a evaluar el caso", items: ["Tipo de obligación asociada a la propiedad.", "Información disponible sobre saldo y estado de pago.", "Costos de mantención y situación física del inmueble.", "Objetivo y plazo del propietario."] },
      { title: "Orientación general, no asesoría individual", paragraphs: ["Esta información es general y no reemplaza asesoría legal o financiera. Una alternativa solo puede estructurarse después de revisar el caso y obtener las confirmaciones externas necesarias."] },
    ],
    faqs: [
      { question: "¿Tener una hipoteca impide conversar con BRENA?", answer: "No. La obligación forma parte de la evaluación inicial, pero su saldo y condiciones deben confirmarse con la entidad correspondiente." },
      { question: "¿BRENA entrega asesoría legal o financiera?", answer: "No. BRENA evalúa alternativas inmobiliarias y económicas. Los asuntos jurídicos, bancarios o crediticios requieren confirmación del profesional o entidad competente." },
    ],
    officialSource: { label: "ChileAtiende: cancelación de hipotecas y alzamiento de prohibiciones", url: "https://www.chileatiende.gob.cl/fichas/12155-cancelacion-de-los-registros-de-hipotecas-y-alzamiento-de-prohibiciones" },
    relatedLinks: ["/", "/vender-propiedad-rapido"],
  },
  {
    route: "/vender-propiedad-en-mal-estado", outputFile: "vender-propiedad-en-mal-estado.html", pageType: "commercial_property_condition", cluster: "BR-04", breadcrumbLabel: "Vender propiedad en mal estado",
    title: "Vender una propiedad en mal estado | Brena",
    description: "Brena compara vender una propiedad como está, realizar mejoras acotadas o remodelar, considerando costos, tiempo y viabilidad de cada caso.",
    h1: "El estado de una propiedad no se evalúa solo por lo que cuesta reparar.", canonical: "https://brena.cl/vender-propiedad-en-mal-estado",
    ogTitle: "Vender una propiedad en mal estado | Brena",
    ogDescription: "Compara vender como está, realizar mejoras acotadas o remodelar según los costos, el tiempo y la viabilidad del caso.",
    eyebrow: "Construcción y decisión económica",
    lead: "Antes de gastar en reparaciones conviene comparar el costo, el tiempo y el efecto posible de cada intervención con la alternativa de vender la propiedad en su estado actual.",
    relatedSituation: null,
    sections: [
      { title: "El deterioro cambia más que la apariencia", paragraphs: ["El estado físico puede afectar costos, tiempos y formas de comercialización. También importa distinguir una reparación necesaria de una mejora opcional y entender si la intervención es coherente con el objetivo del propietario.", "BRENA cuenta con experiencia directa en construcción, mejoramiento y remodelación. Esa experiencia permite evaluar económicamente alternativas sin convertir la revisión inicial en una inspección técnica certificada."] },
      { title: "Tres alternativas que pueden compararse", items: ["Vender la propiedad en su estado actual.", "Realizar mejoras acotadas y priorizadas.", "Evaluar una remodelación cuando sus costos, tiempo y viabilidad lo justifiquen."] },
      { title: "Mejorar no siempre es la respuesta", paragraphs: ["La evaluación no promete un porcentaje de valorización ni un retorno. Busca identificar qué información falta y qué alternativa merece un análisis más profundo antes de comprometer recursos."] },
    ],
    faqs: [
      { question: "¿Debo reparar antes de contactar a BRENA?", answer: "No. Es mejor describir el estado actual y evitar gastos antes de comparar las alternativas disponibles." },
      { question: "¿La evaluación reemplaza una inspección técnica?", answer: "No. La primera evaluación es económica e inmobiliaria. Si el caso requiere informes técnicos, regularización u otra especialidad, debe intervenir el profesional competente." },
    ],
    relatedLinks: ["/", "/vender-propiedad-rapido"],
  },
];

function validateCatalog(pages) {
  if (!Array.isArray(pages) || pages.length !== 4) throw new Error("catalog must contain exactly four pages");
  const required = ["route", "outputFile", "pageType", "cluster", "title", "description", "h1", "canonical", "ogTitle", "ogDescription", "eyebrow", "lead"];
  for (const page of pages) {
    for (const field of required) if (!page[field]) throw new Error(`${field} is required`);
    if (!PAGE_TYPES.has(page.pageType)) throw new Error(`pageType is not allowed: ${page.pageType}`);
    if (!RELATED_SITUATIONS.has(page.relatedSituation)) throw new Error(`relatedSituation is not allowed: ${page.relatedSituation}`);
    if (page.pageType === "homepage") {
      if (page.breadcrumbLabel !== null) throw new Error("homepage pageType breadcrumbLabel must be null");
    } else if (typeof page.breadcrumbLabel !== "string" || !page.breadcrumbLabel.trim()) {
      throw new Error(`breadcrumbLabel is required for ${page.route}`);
    }
    const expectedCanonical = `https://brena.cl${page.route === "/" ? "/" : page.route}`;
    if (page.canonical !== expectedCanonical) throw new Error(`canonical must match route: ${page.canonical}`);
  }
  for (const field of ["route", "outputFile", "pageType", "title", "h1", "canonical"]) {
    if (new Set(pages.map((page) => page[field])).size !== pages.length) throw new Error(`${field} must be unique`);
  }
  const breadcrumbLabels = pages.filter(({ pageType }) => pageType !== "homepage").map(({ breadcrumbLabel }) => breadcrumbLabel);
  if (new Set(breadcrumbLabels).size !== breadcrumbLabels.length) throw new Error("breadcrumbLabel must be unique");
  const routes = new Set(pages.map((page) => page.route));
  for (const page of pages) {
    if (!Array.isArray(page.relatedLinks) || page.relatedLinks.some((route) => !routes.has(route))) {
      throw new Error(`relatedLinks contains an unregistered route for ${page.route}`);
    }
  }
  return true;
}

validateCatalog(PAGES);
for (const page of PAGES) Object.freeze(page);
Object.freeze(PAGES);

module.exports = { PAGE_TYPES, PAGES, validateCatalog };
