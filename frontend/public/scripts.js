"use strict";

const CAMPAIGN_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

function collectAttribution(search) {
  const params = new URLSearchParams(search || "");
  const attribution = {};
  for (const key of CAMPAIGN_KEYS) {
    const value = (params.get(key) || "").trim().slice(0, 120);
    if (value) attribution[key] = value;
  }
  return attribution;
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
    pageUrl: pageContext.href || "",
    referrer: pageContext.referrer || "",
    attribution: collectAttribution(pageContext.search || ""),
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { collectAttribution, buildSubmission };
}

if (typeof document !== "undefined") {
  initializePage();
}

function initializePage() {
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

  initializeLeadForm();
}

function initializeLeadForm() {
  const form = document.querySelector("#lead-form");
  if (!form) return;

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

    if (!submission.name.trim()) markError("name", "Escribe tu nombre.");
    if (!submission.phone.trim() && !submission.email.trim()) {
      markError("contact", "Ingresa un teléfono o correo válido.");
    }
    if (!submission.consent) markError("consent", "Necesitamos tu autorización para contactarte.");

    const localErrors = [...form.querySelectorAll("[data-error-for]")].filter((element) => element.textContent);
    if (localErrors.length > 0) {
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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(submission),
      });
      const body = await response.json().catch(() => ({}));

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
