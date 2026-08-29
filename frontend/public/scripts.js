"use strict";

const CAMPAIGN_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];
const REGION_VALUES = new Set([
  "arica_parinacota", "tarapaca", "antofagasta", "atacama", "coquimbo",
  "valparaiso", "metropolitana", "ohiggins", "maule", "nuble", "biobio",
  "araucania", "los_rios", "los_lagos", "aysen", "magallanes",
]);
const PROPERTY_VALUES = new Set(["casa", "departamento", "terreno", "otro"]);
const SITUATION_VALUES = new Set([
  "mora_hipotecaria", "propiedad_abandonada", "herencia", "falta_liquidez",
  "necesita_vender_rapido", "otro",
]);
const URGENCY_VALUES = new Set(["sin_apuro", "proximos_3_meses", "proximo_mes", "urgente"]);

function collectAttribution(search) {
  const params = new URLSearchParams(search || "");
  const attribution = {};
  for (const key of CAMPAIGN_KEYS) {
    const value = (params.get(key) || "").trim().slice(0, 120);
    if (value) attribution[key] = value;
  }
  return attribution;
}

function safeContextUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
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

function buildSubmission(values, pageContext) {
  return {
    name: values.name || "",
    phone: values.phone || "",
    email: values.email || "",
    region: values.region || "",
    commune: values.commune || "",
    propertyType: values.propertyType || "",
    situation: values.situation || "",
    urgency: values.urgency || "",
    message: values.message || "",
    consent: values.consent === "on" || values.consent === true,
    website: values.website || "",
    pageUrl: safeContextUrl(pageContext.href),
    referrer: safeContextUrl(pageContext.referrer),
    attribution: collectAttribution(pageContext.search || ""),
  };
}

const pageViewTracked = new WeakSet();

function trackSafely(analytics, eventName, payload) {
  try {
    return Boolean(analytics?.track?.(eventName, payload));
  } catch {
    return false;
  }
}

function validPhone(value) {
  const candidate = String(value || "").replace(/[\s().-]/g, "");
  return /^\+?[0-9]{8,15}$/.test(candidate);
}

function validEmail(value) {
  const candidate = String(value || "").trim().toLowerCase();
  return candidate.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(candidate);
}

function localSubmissionErrors(submission) {
  const errors = {};
  if (!String(submission.name || "").trim()) errors.name = "Escribe tu nombre.";
  if (!validPhone(submission.phone) && !validEmail(submission.email)) {
    errors.contact = "Ingresa un teléfono o correo válido.";
  }
  if (!REGION_VALUES.has(submission.region)) errors.region = "Selecciona una región.";
  if (!String(submission.commune || "").trim()) errors.commune = "Escribe la comuna de la propiedad.";
  if (!PROPERTY_VALUES.has(submission.propertyType)) errors.propertyType = "Selecciona el tipo de propiedad.";
  if (!SITUATION_VALUES.has(submission.situation)) {
    errors.situation = "Selecciona la situación que mejor te representa.";
  }
  if (!URGENCY_VALUES.has(submission.urgency)) errors.urgency = "Selecciona cuándo necesitas resolverlo.";
  if (String(submission.message || "").trim().length > 1200) {
    errors.message = "El mensaje puede tener hasta 1.200 caracteres.";
  }
  if (submission.consent !== true) errors.consent = "Necesitamos tu autorización para contactarte.";
  return errors;
}

function trackPageViewOnce(analytics) {
  if (!analytics || (typeof analytics !== "object" && typeof analytics !== "function")) return false;
  if (pageViewTracked.has(analytics)) return false;
  pageViewTracked.add(analytics);
  return trackSafely(analytics, "page_view", { page_type: "landing" });
}

function initializeCtaTracking({ documentObject, analytics }) {
  documentObject?.querySelectorAll?.("[data-analytics-cta-id][data-analytics-cta-location]")
    .forEach((element) => {
      element.addEventListener("click", () => {
        trackSafely(analytics, "cta_click", {
          cta_id: element.dataset.analyticsCtaId,
          cta_location: element.dataset.analyticsCtaLocation,
        });
      });
    });
}

function initializeFormStartTracking(form, analytics) {
  if (!form?.addEventListener) return;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    trackSafely(analytics, "form_start", {});
    form.removeEventListener?.("input", start);
    form.removeEventListener?.("change", start);
  };
  form.addEventListener("input", start);
  form.addEventListener("change", start);
}

async function submitLead({ submission, fetchImpl, analytics }) {
  trackSafely(analytics, "form_submit_attempt", {});
  try {
    const response = await fetchImpl("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(submission),
    });
    const body = await response.json().catch(() => ({}));
    const confirmed = response.ok
      && body?.ok === true
      && body.preview === false
      && typeof body.submissionId === "string"
      && Boolean(body.submissionId.trim());
    if (confirmed) {
      trackSafely(analytics, "generate_lead", { submission_status: "created" });
    } else if (!response.ok) {
      trackSafely(analytics, "form_error", {
        error_type: [400, 422].includes(response.status) ? "validation" : "server",
      });
    }
    return { response, body, confirmed };
  } catch (error) {
    trackSafely(analytics, "form_error", { error_type: "network" });
    throw error;
  }
}

async function submitValidatedLead({
  submission,
  hasLocalErrors,
  fetchImpl,
  analytics,
}) {
  if (hasLocalErrors) {
    trackSafely(analytics, "form_error", { error_type: "validation" });
    return { skipped: true, confirmed: false };
  }
  return submitLead({ submission, fetchImpl, analytics });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildSubmission,
    collectAttribution,
    initializeCtaTracking,
    initializeFormStartTracking,
    localSubmissionErrors,
    safeContextUrl,
    submitLead,
    submitValidatedLead,
    trackPageViewOnce,
  };
}

if (typeof document !== "undefined") {
  initializePage();
}

function initializePage() {
  const analytics = window.brenaAnalytics;
  trackPageViewOnce(analytics);
  initializeCtaTracking({ documentObject: document, analytics });
  const header = document.querySelector("[data-header]");
  const revealElements = document.querySelectorAll("[data-reveal]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function updateHeader() {
    if (header) header.dataset.scrolled = window.scrollY > 18 ? "true" : "false";
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealElements.forEach((element) => observer.observe(element));
  }

  document.querySelectorAll(".faq-list details").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      document.querySelectorAll(".faq-list details[open]").forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  initializeLeadForm(analytics);
}

function initializeLeadForm(analytics) {
  const form = document.querySelector("#lead-form");
  if (!form) return;
  initializeFormStartTracking(form, analytics);

  const steps = [...form.querySelectorAll("[data-form-step]")];
  const nextButton = form.querySelector("[data-next-step]");
  const previousButton = form.querySelector("[data-previous-step]");
  const submitButton = form.querySelector("[data-submit-button]");
  const stepLabel = document.querySelector("[data-step-label]");
  const progress = document.querySelector("[data-progress]");
  const status = form.querySelector("[data-form-status]");
  const errorSummary = form.querySelector("[data-error-summary]");
  const successState = document.querySelector("[data-success-state]");

  function showStep(number, focus = true) {
    steps.forEach((step) => {
      step.hidden = step.dataset.formStep !== String(number);
    });
    if (stepLabel) stepLabel.textContent = `Paso ${number} de 2`;
    if (progress) progress.style.width = number === 1 ? "50%" : "100%";
    if (focus) {
      const legend = steps[number - 1]?.querySelector("legend");
      legend?.setAttribute("tabindex", "-1");
      legend?.focus();
    }
  }

  function clearErrors() {
    form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
    form.querySelectorAll("[data-error-for]").forEach((error) => { error.textContent = ""; });
    if (errorSummary) {
      errorSummary.hidden = true;
      errorSummary.textContent = "";
    }
  }

  function markError(name, message) {
    const error = form.querySelector(`[data-error-for="${name}"]`);
    if (error) error.textContent = message;
    const fields = form.querySelectorAll(`[name="${name}"]`);
    fields.forEach((field) => field.setAttribute("aria-invalid", "true"));
    if (name === "contact") {
      form.querySelectorAll("[name='phone'], [name='email']").forEach((field) => field.setAttribute("aria-invalid", "true"));
    }
  }

  function firstStepValid() {
    clearErrors();
    const requiredNames = ["situation", "propertyType", "region", "commune", "urgency"];
    const messages = {
      situation: "Selecciona la situación que mejor te representa.",
      propertyType: "Selecciona el tipo de propiedad.",
      region: "Selecciona una región.",
      commune: "Escribe la comuna de la propiedad.",
      urgency: "Selecciona cuándo necesitas resolverlo.",
    };
    let valid = true;

    requiredNames.forEach((name) => {
      const fields = [...form.querySelectorAll(`[name="${name}"]`)];
      const hasValue = fields.some((field) => field.type === "radio" ? field.checked : Boolean(field.value.trim()));
      if (!hasValue) {
        valid = false;
        markError(name, messages[name]);
      }
    });

    if (!valid) {
      if (errorSummary) {
        errorSummary.textContent = "Completa los datos marcados para continuar.";
        errorSummary.hidden = false;
        errorSummary.focus();
      }
    }
    return valid;
  }

  nextButton?.addEventListener("click", () => {
    if (firstStepValid()) showStep(2);
  });

  previousButton?.addEventListener("click", () => {
    clearErrors();
    showStep(1);
  });

  document.querySelectorAll("[data-select-situation]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.selectSituation;
      const input = form.querySelector(`[name="situation"][value="${value}"]`);
      if (input) input.checked = true;
      document.querySelector("#conversemos")?.scrollIntoView({ behavior: reducedMotionBehavior() });
      window.setTimeout(() => {
        showStep(1, false);
        input?.focus({ preventScroll: true });
      }, 320);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    const submission = buildSubmission(values, {
      href: window.location.href,
      referrer: document.referrer,
      search: window.location.search,
    });

    Object.entries(localSubmissionErrors(submission))
      .forEach(([name, message]) => markError(name, message));

    const localErrors = [...form.querySelectorAll("[data-error-for]")].filter((element) => element.textContent);
    if (localErrors.length > 0) {
      await submitValidatedLead({
        submission,
        hasLocalErrors: true,
        fetchImpl: fetch,
        analytics,
      });
      if (errorSummary) {
        errorSummary.textContent = "Revisa los datos marcados antes de enviar.";
        errorSummary.hidden = false;
        errorSummary.focus();
      }
      return;
    }

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    status.textContent = "Enviando tu solicitud…";

    try {
      const { response, body } = await submitValidatedLead({
        submission,
        hasLocalErrors: false,
        fetchImpl: fetch,
        analytics,
      });

      if (!response.ok) {
        const errors = body.errors && typeof body.errors === "object" ? body.errors : {};
        Object.entries(errors).forEach(([name, message]) => markError(name, String(message)));
        if (errorSummary) {
          errorSummary.textContent = body.message || "No pudimos enviar la solicitud. Revisa los datos marcados.";
          errorSummary.hidden = false;
          errorSummary.focus();
        }
        status.textContent = "";
        return;
      }

      form.hidden = true;
      document.querySelector(".form-topline").hidden = true;
      successState.hidden = false;
      successState.focus();
    } catch {
      if (errorSummary) {
        errorSummary.textContent = "No pudimos conectarnos. Revisa tu conexión e intenta nuevamente.";
        errorSummary.hidden = false;
        errorSummary.focus();
      }
      status.textContent = "";
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }
  });
}

function reducedMotionBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
