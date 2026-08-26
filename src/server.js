"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const { validateLeadSubmission, toBrenaLead } = require("./lead-contract");
const { createRateLimiter } = require("./rate-limiter");

const MAX_BODY_BYTES = 16 * 1024;

const MIME_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
});

const SECURITY_HEADERS = Object.freeze({
  "content-security-policy": "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'; upgrade-insecure-requests",
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
});

function writeJson(response, status, body, extraHeaders = {}) {
  const payload = Buffer.from(JSON.stringify(body));
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "content-length": payload.length,
    ...extraHeaders,
  });
  response.end(payload);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;

    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (tooLarge) {
        const error = new Error("Payload too large");
        error.status = 413;
        reject(error);
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        const error = new Error("Invalid JSON");
        error.status = 400;
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function clientAddress(request, trustProxy) {
  if (trustProxy) {
    const cloudflare = request.headers["cf-connecting-ip"];
    if (typeof cloudflare === "string" && cloudflare.trim()) return cloudflare.trim();
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  }
  return request.socket.remoteAddress || "unknown";
}

function safePublicFile(publicDir, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const root = path.resolve(publicDir);
  const candidate = path.resolve(root, relative);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
  return candidate;
}

async function serveStatic(request, response, publicDir, pathname) {
  const filePath = safePublicFile(publicDir, pathname);
  if (!filePath) return false;

  let stat;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const shouldRevalidate = [".html", ".css", ".js"].includes(extension);
  response.writeHead(200, {
    ...SECURITY_HEADERS,
    "cache-control": shouldRevalidate ? "no-cache" : "public, max-age=3600",
    "content-type": contentType,
    "content-length": stat.size,
  });
  if (request.method === "HEAD") {
    response.end();
    return true;
  }
  fs.createReadStream(filePath).pipe(response);
  return true;
}

function createServer({
  publicDir,
  brenaClient,
  leadArchive,
  rateLimiter = createRateLimiter({ windowMs: 60_000, max: 5 }),
  trustProxy = false,
  now = () => new Date(),
  logger = console,
} = {}) {
  if (!publicDir) throw new Error("publicDir is required");
  if (!brenaClient || typeof brenaClient.submit !== "function") {
    throw new Error("brenaClient.submit is required");
  }
  if (!leadArchive || typeof leadArchive.save !== "function") {
    throw new Error("leadArchive.save is required");
  }

  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    const { pathname } = requestUrl;

    try {
      if (request.method === "GET" && pathname === "/healthcheck") {
        writeJson(response, 200, { status: "ok" });
        return;
      }

      if (request.method === "POST" && pathname === "/api/leads") {
        const rate = rateLimiter.consume(clientAddress(request, trustProxy));
        if (!rate.allowed) {
          writeJson(response, 429, {
            ok: false,
            message: "Recibimos varias solicitudes. Intenta nuevamente en un momento.",
          }, { "retry-after": String(rate.retryAfter) });
          return;
        }

        const contentType = String(request.headers["content-type"] || "").split(";")[0].trim();
        if (contentType !== "application/json") {
          writeJson(response, 415, { ok: false, message: "El formato enviado no es compatible." });
          return;
        }

        const input = await readJsonBody(request);
        const validation = validateLeadSubmission(input);
        if (validation.spam) {
          writeJson(response, 202, {
            ok: true,
            message: "Recibimos tus datos. El equipo Brena revisará tu caso.",
          });
          return;
        }
        if (!validation.ok) {
          writeJson(response, 400, {
            ok: false,
            message: "Revisa los datos marcados.",
            errors: validation.errors,
          });
          return;
        }

        const submittedAt = now().toISOString();
        const payload = toBrenaLead(validation.data, {
          submittedAt,
          pageUrl: input.pageUrl,
          referrer: input.referrer,
        });
        const result = await brenaClient.submit(payload);
        const archiveResult = await leadArchive.save({
          submissionId: result.id,
          receivedAt: submittedAt,
          preview: result.preview,
          lead: payload,
        });
        if (archiveResult?.workbookUpdated === false) {
          logger.warn?.("local lead workbook update deferred", {
            submissionId: result.id,
            name: archiveResult.workbookError?.name || "Error",
          });
        }
        logger.info?.("public lead accepted", {
          submissionId: result.id,
          preview: result.preview,
        });
        writeJson(response, result.preview ? 202 : 201, {
          ok: true,
          submissionId: result.id,
          preview: result.preview,
          message: "Recibimos tus datos. El equipo Brena revisará tu caso.",
        });
        return;
      }

      if (["GET", "HEAD"].includes(request.method)) {
        const served = await serveStatic(request, response, publicDir, pathname);
        if (served) return;
      }

      writeJson(response, 404, { ok: false, message: "No encontramos esta página." });
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : 500;
      if (status >= 500) {
        logger.error?.("public request failed", {
          name: error?.name || "Error",
          status,
        });
      }
      writeJson(response, status, {
        ok: false,
        message: status === 413
          ? "La solicitud supera el tamaño permitido."
          : status >= 500
            ? "No pudimos recibir tus datos en este momento. Intenta nuevamente."
            : "No pudimos procesar la solicitud.",
      });
    }
  });
}

module.exports = { createServer, MAX_BODY_BYTES };
