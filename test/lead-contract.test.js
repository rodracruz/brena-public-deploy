const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateLeadSubmission,
  toBrenaLead,
} = require("../src/lead-contract");

const validInput = {
  name: "  María Pérez  ",
  phone: " +56 9 1234 5678 ",
  email: " MARIA@EXAMPLE.CL ",
  region: "metropolitana",
  commune: "  Ñuñoa ",
  propertyType: "casa",
  situation: "herencia",
  urgency: "proximo_mes",
  message: "  Somos tres herederos y queremos conversar.  ",
  consent: true,
  website: "",
  attribution: {
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "venta urgente",
    unexpected: "discard me",
  },
};

test("normalizes a valid lead without retaining unexpected fields", () => {
  const result = validateLeadSubmission(validInput);

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    name: "María Pérez",
    phone: "+56912345678",
    email: "maria@example.cl",
    region: "metropolitana",
    commune: "Ñuñoa",
    propertyType: "casa",
    situation: "herencia",
    urgency: "proximo_mes",
    message: "Somos tres herederos y queremos conversar.",
    consent: true,
    attribution: {
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "venta urgente",
    },
  });
});

test("requires a name, one valid contact channel, situation, property data and consent", () => {
  const result = validateLeadSubmission({
    name: " ",
    phone: "123",
    email: "not-an-email",
    region: "unknown",
    commune: "",
    propertyType: "castle",
    situation: "",
    urgency: "yesterday",
    consent: false,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, {
    name: "Escribe tu nombre.",
    contact: "Ingresa un teléfono o correo válido.",
    region: "Selecciona una región.",
    commune: "Escribe la comuna de la propiedad.",
    propertyType: "Selecciona el tipo de propiedad.",
    situation: "Selecciona la situación que mejor te representa.",
    urgency: "Selecciona cuándo necesitas resolverlo.",
    consent: "Necesitamos tu autorización para contactarte.",
  });
});

test("accepts email as the only contact channel", () => {
  const result = validateLeadSubmission({
    ...validInput,
    phone: "",
    email: "persona@example.com",
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.phone, "");
  assert.equal(result.data.email, "persona@example.com");
});

test("marks a filled honeypot as spam without exposing validation detail", () => {
  const result = validateLeadSubmission({ ...validInput, website: "https://bot.test" });

  assert.deepEqual(result, { ok: false, spam: true, errors: {} });
});

test("rejects oversized free text instead of truncating silently", () => {
  const result = validateLeadSubmission({ ...validInput, message: "x".repeat(1201) });

  assert.equal(result.ok, false);
  assert.equal(result.errors.message, "El mensaje puede tener hasta 1.200 caracteres.");
});

test("maps a public submission to the existing BrenaV2 lead vocabulary", () => {
  const validated = validateLeadSubmission(validInput).data;
  const payload = toBrenaLead(validated, {
    submittedAt: "2026-08-26T13:45:00.000Z",
    pageUrl: "https://ana:secret@brena.cl/?utm_source=google&email=ana%40example.cl#contacto",
    referrer: "https://www.google.com/search?q=deuda&phone=%2B56912345678#resultado",
  });

  assert.deepEqual(payload, {
    nombre_propietario: "María Pérez",
    telefono: "+56912345678",
    email: "maria@example.cl",
    origen_lead: "otro",
    fecha_ingreso: "2026-08-26",
    problema_principal: "herencia",
    problemas_secundarios: [],
    urgencia: "alta",
    estado_pipeline: "nuevo",
    objetivo_propietario: "Resolver una herencia o copropiedad",
    observaciones: "Somos tres herederos y queremos conversar.",
    source: "web_publica",
    property: {
      region: "Región Metropolitana de Santiago",
      comuna: "Ñuñoa",
      direccion_propiedad: "",
      tipo_propiedad: "casa",
      ocupacion_propiedad: "sin_informacion",
      vive_propietario: null,
      source: "web_publica",
    },
    attribution: {
      channel: "website",
      page_url: "https://brena.cl/",
      referrer: "https://www.google.com/search",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "venta urgente",
    },
    privacy: {
      consent: true,
      consented_at: "2026-08-26T13:45:00.000Z",
      notice_version: "2026-08-26",
    },
  });
});
