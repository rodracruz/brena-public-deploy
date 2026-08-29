"use strict";

const REGION_LABELS = Object.freeze({
  arica_parinacota: "Región de Arica y Parinacota",
  tarapaca: "Región de Tarapacá",
  antofagasta: "Región de Antofagasta",
  atacama: "Región de Atacama",
  coquimbo: "Región de Coquimbo",
  valparaiso: "Región de Valparaíso",
  metropolitana: "Región Metropolitana de Santiago",
  ohiggins: "Región del Libertador General Bernardo O’Higgins",
  maule: "Región del Maule",
  nuble: "Región de Ñuble",
  biobio: "Región del Biobío",
  araucania: "Región de La Araucanía",
  los_rios: "Región de Los Ríos",
  los_lagos: "Región de Los Lagos",
  aysen: "Región de Aysén del General Carlos Ibáñez del Campo",
  magallanes: "Región de Magallanes y de la Antártica Chilena",
});

const PROPERTY_TYPES = new Set(["casa", "departamento", "terreno", "otro"]);

const SITUATIONS = Object.freeze({
  mora_hipotecaria: {
    problem: "mora_hipotecaria",
    objective: "Resolver una deuda asociada a la propiedad",
  },
  propiedad_abandonada: {
    problem: "propiedad_abandonada",
    objective: "Resolver una propiedad desocupada o deteriorada",
  },
  herencia: {
    problem: "herencia",
    objective: "Resolver una herencia o copropiedad",
  },
  falta_liquidez: {
    problem: "falta_liquidez",
    objective: "Obtener liquidez a partir de la propiedad",
  },
  necesita_vender_rapido: {
    problem: "necesita_vender_rapido",
    objective: "Evaluar una venta en un plazo acotado",
  },
  otro: {
    problem: "otro",
    objective: "Conversar sobre una situación particular",
  },
});

const URGENCY = Object.freeze({
  sin_apuro: "baja",
  proximos_3_meses: "media",
  proximo_mes: "alta",
  urgente: "critica",
});

const ATTRIBUTION_KEYS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
]);

function text(value, maxLength) {
  if (typeof value !== "string") return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

function normalizePhone(value) {
  const candidate = text(value).replace(/[\s().-]/g, "");
  return /^\+?[0-9]{8,15}$/.test(candidate) ? candidate : "";
}

function normalizeEmail(value) {
  const candidate = text(value, 160).toLowerCase();
  if (!candidate || candidate.length > 160) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(candidate) ? candidate : "";
}

function cleanAttribution(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const key of ATTRIBUTION_KEYS) {
    const cleaned = text(value[key], 120);
    if (cleaned) result[key] = cleaned;
  }
  return result;
}

function validateLeadSubmission(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: { form: "No pudimos leer los datos enviados." } };
  }

  if (text(input.website, 200)) {
    return { ok: false, spam: true, errors: {} };
  }

  const name = text(input.name, 100);
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const region = text(input.region, 40);
  const commune = text(input.commune, 100);
  const propertyType = text(input.propertyType, 30);
  const situation = text(input.situation, 40);
  const urgency = text(input.urgency, 40);
  const rawMessage = typeof input.message === "string" ? input.message.trim() : "";
  const message = text(rawMessage, 1200);
  const consent = input.consent === true;
  const errors = {};

  if (!name) errors.name = "Escribe tu nombre.";
  if (!phone && !email) errors.contact = "Ingresa un teléfono o correo válido.";
  if (!Object.hasOwn(REGION_LABELS, region)) errors.region = "Selecciona una región.";
  if (!commune) errors.commune = "Escribe la comuna de la propiedad.";
  if (!PROPERTY_TYPES.has(propertyType)) errors.propertyType = "Selecciona el tipo de propiedad.";
  if (!Object.hasOwn(SITUATIONS, situation)) {
    errors.situation = "Selecciona la situación que mejor te representa.";
  }
  if (!Object.hasOwn(URGENCY, urgency)) errors.urgency = "Selecciona cuándo necesitas resolverlo.";
  if (rawMessage.length > 1200) errors.message = "El mensaje puede tener hasta 1.200 caracteres.";
  if (!consent) errors.consent = "Necesitamos tu autorización para contactarte.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      phone,
      email,
      region,
      commune,
      propertyType,
      situation,
      urgency,
      message,
      consent,
      attribution: cleanAttribution(input.attribution),
    },
  };
}

function safeMetadataUrl(value) {
  const candidate = text(value, 2048);
  if (!candidate) return "";
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function toBrenaLead(lead, requestMeta = {}) {
  const submittedAt = new Date(requestMeta.submittedAt || Date.now()).toISOString();
  const situation = SITUATIONS[lead.situation];
  const attribution = {
    channel: "website",
    page_url: safeMetadataUrl(requestMeta.pageUrl),
    referrer: safeMetadataUrl(requestMeta.referrer),
    ...cleanAttribution(lead.attribution),
  };

  return {
    nombre_propietario: lead.name,
    telefono: lead.phone,
    email: lead.email,
    origen_lead: "otro",
    fecha_ingreso: submittedAt.slice(0, 10),
    problema_principal: situation.problem,
    problemas_secundarios: [],
    urgencia: URGENCY[lead.urgency],
    estado_pipeline: "nuevo",
    objetivo_propietario: situation.objective,
    observaciones: lead.message,
    source: "web_publica",
    property: {
      region: REGION_LABELS[lead.region],
      comuna: lead.commune,
      direccion_propiedad: "",
      tipo_propiedad: lead.propertyType,
      ocupacion_propiedad: "sin_informacion",
      vive_propietario: null,
      source: "web_publica",
    },
    attribution,
    privacy: {
      consent: true,
      consented_at: submittedAt,
      notice_version: "2026-08-26",
    },
  };
}

module.exports = {
  REGION_LABELS,
  validateLeadSubmission,
  toBrenaLead,
};
