import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";
import { createServer } from "vite";
import type { RuntimeHostCredentialStatus } from "@hypit/runtime-host-node";
import { studioSettingsPlugin } from "../src/settings-server.js";
import { studioRequestProtectionPlugin } from "../src/request-protection.js";
import { studioTokenHeader } from "../src/request-policy.js";

async function fixture(t: TestContext, options: { profile?: boolean; writable?: boolean; failing?: boolean; real?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), "hypit-settings-test-"));
  const profile = join(root, "runtime.json");
  const original = JSON.stringify({ format: "hypit.runtime-local@1", dataRoot: "./state", credentials: { env: { use: "@hypit/credential-store-env" } },
    endpoints: { cloud: { use: "@hypit/provider-hypihub", config: {
      baseUrl: "https://user:url-password@hypit.ai/private?secret=query-secret", apiKey: { store: "env", key: "HYPIT_NONEXISTENT_TEST_KEY_481" },
    } } } });
  await writeFile(profile, original);
  await writeFile(join(root, "index.html"), "<html><head></head><body>Studio</body></html>");
  let secret: string | undefined;
  let writes = 0, opens = 0, closes = 0;
  const status = (): RuntimeHostCredentialStatus => ({ endpoint: "cloud", slot: "apiKey", label: "API Key", kind: "secret",
    ref: { store: "os", key: "test-only" }, configured: secret !== undefined, writable: options.writable !== false });
  const server = await createServer({ root, configFile: false, logLevel: "silent", server: { host: "127.0.0.1", port: 0, watch: null },
    plugins: [studioRequestProtectionPlugin(), studioSettingsPlugin({ workspaceRoot: root, packageRoot: process.cwd(),
      distributionPackageRoot: process.cwd(), hasRun: false, ...(options.profile === false ? {} : { runtimePath: profile }),
      ...(options.real ? {} : { openCredentials: async () => {
        opens++;
        if (options.failing) throw new Error("must-not-echo-adapter-secret");
        return { credentials: async () => [status()], putCredential: async (_endpoint, _slot, value) => {
          secret = value; writes++; return status();
        }, deleteCredential: async () => { const deleted = secret !== undefined; secret = undefined; writes++; return { deleted, credential: status() }; },
        close: () => { closes++; } };
      } }),
    })],
  });
  await server.listen();
  t.after(async () => { await server.close(); await rm(root, { recursive: true, force: true }); });
  const address = server.httpServer!.address(); assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  const html = await server.transformIndexHtml("/", await readFile(join(root, "index.html"), "utf8"));
  const token = /name="hypit-studio-token" content="([a-f0-9]+)"/u.exec(html)![1]!;
  const auth = { origin, [studioTokenHeader]: token, "content-type": "application/json" };
  const send = (path: string, method = "GET", value?: unknown, headers: Record<string, string> = auth) =>
    new Promise<{ status: number; body: string; cache: string | undefined }>((resolve, reject) => {
      const data = value === undefined ? undefined : JSON.stringify(value);
      const req = request(origin + path, { method, headers: { ...headers, ...(data === undefined ? {} : { "content-length": String(Buffer.byteLength(data)) }) } }, res => {
        let body = ""; res.setEncoding("utf8"); res.on("data", chunk => { body += chunk; });
        res.on("end", () => resolve({ status: res.statusCode!, body, cache: res.headers["cache-control"] }));
      });
      req.on("error", reject); req.end(data);
    });
  return { send, auth, root, profile, original, state: () => ({ secret, writes, opens, closes }) };
}

const route = "/__studio/settings/credential";
test("settings save, replace and delete only declared credentials without exposing or persisting secret values", async t => {
  const f = await fixture(t);
  const context = await f.send("/__studio/settings/context");
  assert.equal(JSON.parse(context.body).hasRun, false); assert.equal(f.state().opens, 0);
  for (const secret of ["test-key-one", "replacement-key-two"]) {
    const response = await f.send(route, "PUT", { endpoint: "cloud", slot: "apiKey", secret });
    assert.equal(response.status, 200); assert.equal(response.cache, "no-store");
    assert.equal(JSON.parse(response.body).credential.configured, true);
    assert.equal(f.state().secret, secret); assert.ok(!response.body.includes(secret));
    const settings = await f.send("/__studio/settings");
    assert.equal(settings.status, 200); assert.ok(!settings.body.includes(secret));
    assert.ok(!settings.body.includes("url-password")); assert.ok(!settings.body.includes("query-secret"));
    assert.equal(JSON.parse(settings.body).endpoints[0].origin, "https://hypit.ai");
    assert.equal(await readFile(f.profile, "utf8"), f.original);
  }
  assert.equal((await f.send(route, "DELETE", { endpoint: "cloud", slot: "apiKey" })).status, 400);
  const deleted = await f.send(route, "DELETE", { endpoint: "cloud", slot: "apiKey", confirm: true });
  assert.equal(deleted.status, 200); assert.equal(JSON.parse(deleted.body).credential.configured, false);
  assert.equal(f.state().secret, undefined); assert.equal(f.state().writes, 3);
  assert.equal(f.state().opens, f.state().closes);
});

test("credential routes reject cross-origin requests, missing tokens, arbitrary targets and invalid secrets before writing", async t => {
  const f = await fixture(t);
  const valid = { endpoint: "cloud", slot: "apiKey", secret: "test-only" };
  for (const headers of [{}, { ...f.auth, origin: "https://evil.example" }, { ...f.auth, [studioTokenHeader]: "wrong" },
    { ...f.auth, host: "evil.example" }]) assert.equal((await f.send(route, "PUT", valid, headers)).status, 403);
  assert.equal((await f.send(route, "PUT", valid, { ...f.auth, "content-type": "text/plain" })).status, 415);
  for (const secret of ["", "   ", "has\nnewline", "nul\0value", "x".repeat(16385), 123, null]) {
    assert.equal((await f.send(route, "PUT", { ...valid, secret })).status, 400);
  }
  assert.equal((await f.send(route, "PUT", { ...valid, endpoint: "../../elsewhere" })).status, 404);
  assert.equal((await f.send(route, "PUT", { ...valid, slot: "unrelated" })).status, 404);
  assert.equal((await f.send(route, "PUT", { ...valid, profile: "/tmp/other" })).status, 400);
  assert.equal((await f.send(route, "GET")).status, 405);
  assert.equal((await f.send(route, "POST", valid)).status, 405);
  assert.equal((await f.send(route, "PUT", { ...valid, secret: "x".repeat(40000) })).status, 413);
  assert.equal(f.state().writes, 0); assert.equal(f.state().opens, f.state().closes);
});

test("missing runtime, read-only stores and adapter failures are actionable without leaking error details", async t => {
  const absent = await fixture(t, { profile: false });
  assert.deepEqual(JSON.parse((await absent.send("/__studio/settings")).body).endpoints, []);
  assert.equal((await absent.send(route, "PUT", { endpoint: "cloud", slot: "apiKey", secret: "test" })).status, 409);
  const readonly = await fixture(t, { writable: false });
  assert.equal((await readonly.send(route, "PUT", { endpoint: "cloud", slot: "apiKey", secret: "test" })).status, 409);
  assert.equal(readonly.state().writes, 0);
  const failed = await fixture(t, { failing: true });
  const read = await failed.send("/__studio/settings");
  assert.equal(JSON.parse(read.body).endpoints[0].unavailable, true);
  assert.ok(!read.body.includes("must-not-echo"));
  const write = await failed.send(route, "PUT", { endpoint: "cloud", slot: "apiKey", secret: "test" });
  assert.equal(write.status, 503); assert.deepEqual(JSON.parse(write.body), { error: "settings-unavailable" });
});

test("settings uses the actual runtime credential declarations and preserves environment stores as read-only", async t => {
  const f = await fixture(t, { real: true });
  const response = await f.send("/__studio/settings");
  assert.equal(response.status, 200);
  const endpoint = JSON.parse(response.body).endpoints[0];
  assert.equal(endpoint.unavailable, undefined);
  assert.equal(endpoint.credentials[0].slot, "apiKey");
  assert.equal(endpoint.credentials[0].writable, false);
  assert.equal(endpoint.credentials[0].storage, "env");
});
