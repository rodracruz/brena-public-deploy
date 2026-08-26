const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");

const { createBrenaClient } = require("../src/brena-client");

async function withUpstream(handler, run) {
  const server = http.createServer(handler);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}/public/leads`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("preview mode acknowledges a lead without transmitting it", async () => {
  const client = createBrenaClient({
    mode: "preview",
    idFactory: () => "preview-fixed-id",
    fetchImpl: async () => {
      throw new Error("preview must not call fetch");
    },
  });

  assert.deepEqual(await client.submit({ nombre_propietario: "Ana" }), {
    accepted: true,
    id: "preview-fixed-id",
    preview: true,
  });
});

test("local mode accepts a real lead without transmitting it to BrenaV2", async () => {
  const client = createBrenaClient({
    mode: "local",
    idFactory: () => "local-fixed-id",
    fetchImpl: async () => {
      throw new Error("local mode must not call fetch");
    },
  });

  assert.deepEqual(await client.submit({ nombre_propietario: "Ana" }), {
    accepted: true,
    id: "local-fixed-id",
    preview: false,
  });
});

test("local mode generates identifiers that cannot be confused with preview submissions", async () => {
  const client = createBrenaClient({ mode: "local" });

  const result = await client.submit({ nombre_propietario: "Ana" });

  assert.match(result.id, /^local-[0-9a-f-]+$/);
  assert.equal(result.preview, false);
});

test("posts JSON to BrenaV2 using a server-side bearer token", async () => {
  await withUpstream(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    assert.equal(request.method, "POST");
    assert.equal(request.headers.authorization, "Bearer server-secret");
    assert.equal(request.headers["content-type"], "application/json");
    assert.equal(request.headers["x-brena-source"], "public-web");
    assert.deepEqual(JSON.parse(body), { nombre_propietario: "Ana" });
    response.writeHead(201, { "content-type": "application/json" });
    response.end(JSON.stringify({ lead: { id: "lead-123" } }));
  }, async (endpoint) => {
    const client = createBrenaClient({
      mode: "live",
      endpoint,
      token: "server-secret",
      timeoutMs: 500,
    });

    assert.deepEqual(await client.submit({ nombre_propietario: "Ana" }), {
      accepted: true,
      id: "lead-123",
      preview: false,
    });
  });
});

test("returns a redacted upstream error without including the response body", async () => {
  await withUpstream((_request, response) => {
    response.writeHead(503, { "content-type": "application/json" });
    response.end(JSON.stringify({ secret: "database details" }));
  }, async (endpoint) => {
    const client = createBrenaClient({ mode: "live", endpoint, timeoutMs: 500 });

    await assert.rejects(
      () => client.submit({ nombre_propietario: "Ana" }),
      (error) => {
        assert.equal(error.name, "BrenaUpstreamError");
        assert.equal(error.message, "BrenaV2 rechazó temporalmente la solicitud.");
        assert.equal(error.status, 502);
        assert.equal(error.message.includes("database"), false);
        return true;
      },
    );
  });
});

test("bounds how long the public server waits for BrenaV2", async () => {
  await withUpstream((_request, response) => {
    setTimeout(() => {
      response.writeHead(201, { "content-type": "application/json" });
      response.end(JSON.stringify({ id: "too-late" }));
    }, 100);
  }, async (endpoint) => {
    const client = createBrenaClient({ mode: "live", endpoint, timeoutMs: 20 });

    await assert.rejects(
      () => client.submit({ nombre_propietario: "Ana" }),
      (error) => error.name === "BrenaUpstreamError" && error.status === 504,
    );
  });
});
