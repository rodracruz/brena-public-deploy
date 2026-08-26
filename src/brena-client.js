"use strict";

const crypto = require("node:crypto");

function upstreamError(message, status) {
  const error = new Error(message);
  error.name = "BrenaUpstreamError";
  error.status = status;
  return error;
}

function createBrenaClient({
  mode = "preview",
  endpoint = "",
  token = "",
  timeoutMs = 5_000,
  fetchImpl = globalThis.fetch,
  idFactory,
} = {}) {
  if (!["preview", "local", "live"].includes(mode)) {
    throw new Error("BRENA_LEAD_MODE must be preview, local or live");
  }
  if (mode === "live" && !endpoint) {
    throw new Error("BRENA_V2_LEADS_URL is required in live mode");
  }
  const createLocalId = idFactory || (() => `${mode}-${crypto.randomUUID()}`);

  return {
    async submit(payload) {
      if (mode !== "live") {
        return { accepted: true, id: createLocalId(), preview: mode === "preview" };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const headers = {
          "content-type": "application/json",
          accept: "application/json",
          "x-brena-source": "public-web",
        };
        if (token) headers.authorization = `Bearer ${token}`;

        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw upstreamError("BrenaV2 rechazó temporalmente la solicitud.", 502);
        }

        const body = await response.json().catch(() => ({}));
        const id = body?.lead?.id || body?.id || body?.submission_id;
        if (!id || typeof id !== "string") {
          throw upstreamError("BrenaV2 entregó una respuesta incompleta.", 502);
        }

        return { accepted: true, id, preview: false };
      } catch (error) {
        if (error?.name === "BrenaUpstreamError") throw error;
        if (error?.name === "AbortError" || controller.signal.aborted) {
          throw upstreamError("BrenaV2 no respondió a tiempo.", 504);
        }
        throw upstreamError("No pudimos conectar con BrenaV2.", 502);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

module.exports = { createBrenaClient };
