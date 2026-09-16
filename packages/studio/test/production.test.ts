import assert from "node:assert/strict";
import { request } from "node:http";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";
import { createStudioProductionServer, studioProductionOrigin } from "../src/production.js";
import { hashStudioPassword, loadStudioPassword } from "../src/personal-auth.js";
import { studioFeedbackPlugin } from "../src/feedback-server.js";
import { studioLocalizationPlugin } from "../src/localization-node.js";
import { prepareStudioExample } from "../src/examples.js";
import { studioModule } from "../src/host.js";
import { studioTokenHeader } from "../src/request-policy.js";

const password = "test-only-personal-password";
async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), "hypit-personal-"));
  const assets = join(root, "dist");
  await mkdir(join(assets, "assets"), { recursive: true });
  await writeFile(join(assets, "index.html"), "<html><head></head><body>Studio</body></html>");
  await writeFile(join(assets, "assets", "index-test.js"), "export const ready = true;");
  const secret = join(root, "password");
  await writeFile(secret, await hashStudioPassword(password));
  let time = Date.now();
  const host = await createStudioProductionServer({ origin: "https://studio.example.com", assetRoot: assets,
    passwordFile: secret, now: () => time, modules: [studioFeedbackPlugin(root, join(root, "main.svrun")), studioLocalizationPlugin([]),
      studioModule("test-large-preview", host => host.middlewares.use((req, res, next) => {
        if (req.url !== "/test-large-preview") { next(); return; }
        host.ws.send({ type: "custom", event: "studio:test-large", data: "x".repeat(256 * 1024) });
        res.end("ok");
      }))] });
  await new Promise<void>(resolve => host.server.listen(0, "127.0.0.1", resolve));
  t.after(async () => { await host.close(); await rm(root, { force: true, recursive: true }); });
  const address = host.server.address();
  assert.ok(address && typeof address !== "string");
  const send = (path: string, method = "GET", headers: Record<string, string> = {}, body?: string) =>
    new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; body: string }>((resolve, reject) => {
      const req = request({ hostname: "127.0.0.1", port: address.port, path, method,
        headers: { host: "studio.example.com", ...headers } }, res => {
        let text = ""; res.setEncoding("utf8"); res.on("data", value => { text += value; });
        res.on("end", () => resolve({ status: res.statusCode!, headers: res.headers, body: text }));
      });
      req.on("error", reject); req.end(body);
    });
  const loginHeaders = { origin: "https://studio.example.com", "content-type": "application/x-www-form-urlencoded" };
  const login = async () => {
    const response = await send("/__studio/auth/login", "POST", loginHeaders, new URLSearchParams({ password }).toString());
    assert.equal(response.status, 303);
    const cookie = response.headers["set-cookie"]![0]!.split(";")[0]!;
    const page = await send("/", "GET", { cookie });
    const csrf = /name="hypit-studio-token" content="([a-f0-9]{64})"/u.exec(page.body)?.[1];
    assert.ok(csrf);
    return { cookie, csrf, setCookie: response.headers["set-cookie"]![0]! };
  };
  return { root, assets, secret, host, address, send, login, loginHeaders, advance(ms: number) { time += ms; } };
}

test("production fails closed: authentication covers APIs, source paths, assets and events", async t => {
  const { send, login, root, assets } = await fixture(t);
  assert.equal((await send("/")).headers.location, "/login");
  assert.equal((await send("/healthz")).status, 200);
  assert.match((await send("/login")).body, /type="password"/u);
  for (const path of ["/__studio/feedback", "/__studio/locales", "/__studio/events", "/assets/index-test.js", "/@fs/etc/passwd", "/src/ui/app.ts"]) {
    assert.equal((await send(path)).status, 401);
  }
  const auth = await login();
  assert.match(auth.setCookie, /HttpOnly; SameSite=Strict; Max-Age=43200; Secure/u);
  const headers = { cookie: auth.cookie };
  assert.equal((await send("/assets/index-test.js", "GET", headers)).status, 200);
  assert.equal((await send("/__studio/locales", "GET", headers)).status, 200);
  assert.equal((await send("/", "GET", headers)).headers["cache-control"], "private, no-store");
  for (const path of ["/@vite/client", "/src/ui/app.ts", "/@fs/etc/passwd", "/assets/%2e%2e/password", "/assets/%2f..%2f..%2fpassword"]) {
    assert.equal((await send(path, "GET", headers)).status, 404);
  }
  if (process.platform !== "win32") {
    await writeFile(join(root, "outside.js"), "private");
    await symlink(join(root, "outside.js"), join(assets, "assets", "escape.js"));
    assert.equal((await send("/assets/escape.js", "GET", headers)).status, 404);
  }
  for (const invalid of [{ host: "evil.example" }, { origin: "https://evil.example" }, { "sec-fetch-site": "same-site" }]) {
    assert.equal((await send("/__studio/locales", "GET", { ...headers, ...invalid })).status, 403);
  }
  assert.equal((await send("http://evil.example/", "GET", headers)).status, 403);
  assert.equal((await send("/__studio/locales", "GET", { host: "evil.example", "x-forwarded-host": "studio.example.com", ...headers })).status, 403);
});

test("production writes require per-session CSRF; logout and expiry revoke access and streams", async t => {
  const { send, login, root, advance, address } = await fixture(t);
  const auth = await login();
  const other = await login();
  const body = JSON.stringify({ type: "add", comment: { id: "one", run: "main.svrun", at: 0, text: "Personal review" } });
  const headers = { cookie: auth.cookie, origin: "https://studio.example.com", "content-type": "application/json", [studioTokenHeader]: auth.csrf };
  for (const invalid of [{ ...headers, [studioTokenHeader]: "" }, { ...headers, [studioTokenHeader]: other.csrf },
    { ...headers, origin: "https://evil.example" }, { cookie: auth.cookie, [studioTokenHeader]: auth.csrf, "content-type": "application/json" }]) {
    assert.equal((await send("/__studio/feedback", "POST", invalid, body)).status, 403);
  }
  await assert.rejects(readFile(join(root, "FEEDBACK.json")), { code: "ENOENT" });
  const events: string[] = [];
  const req = request({ hostname: "127.0.0.1", port: address.port, path: "/__studio/events", headers: { host: "studio.example.com", cookie: auth.cookie } });
  let finish!: () => void;
  const ended = new Promise<void>(resolve => { finish = resolve; });
  await new Promise<void>((resolve, reject) => {
    req.on("error", reject); req.on("response", res => {
      res.setEncoding("utf8"); res.on("data", chunk => { events.push(String(chunk)); resolve(); }); res.on("end", finish);
    }); req.end();
  });
  t.after(() => req.destroy());
  assert.equal((await send("/__studio/feedback", "POST", headers, body)).status, 200);
  assert.equal(JSON.parse(await readFile(join(root, "FEEDBACK.json"), "utf8")).comments[0].text, "Personal review");
  assert.equal((await send("/test-large-preview", "GET", { cookie: auth.cookie })).status, 200);
  assert.equal((await send("/__studio/auth/logout", "POST", headers, "{}")).status, 200);
  await ended;
  assert.match(events.join(""), /studio:feedback-changed/u);
  assert.ok(events.join("").includes(`data: "${"x".repeat(256 * 1024)}"\n\n`), "large preview events drain completely without truncation");
  assert.equal((await send("/__studio/feedback", "GET", { cookie: auth.cookie })).status, 401);
  assert.equal((await send("/__studio/feedback", "GET", { cookie: other.cookie })).status, 200);
  advance(12 * 60 * 60_000 + 1);
  assert.equal((await send("/__studio/feedback", "GET", { cookie: other.cookie })).status, 401);
});

test("passwords use salted hashes and login attempts are bounded", async t => {
  const { send, loginHeaders, secret, advance } = await fixture(t);
  const record = await readFile(secret, "utf8");
  assert.ok(!record.includes(password));
  assert.notEqual(record, await hashStudioPassword(password));
  assert.equal(await (await loadStudioPassword(secret))(password), true);
  await assert.rejects(hashStudioPassword("short"));
  assert.equal((await send("/__studio/auth/login", "POST", { "content-type": "application/x-www-form-urlencoded" }, "password=bad")).status, 403);
  assert.equal((await send("/__studio/auth/login", "POST", loginHeaders, `password=${"x".repeat(9000)}`)).status, 400);
  for (let i = 0; i < 9; i++) assert.equal((await send("/__studio/auth/login", "POST", loginHeaders, "password=wrong")).status, 401);
  assert.equal((await send("/__studio/auth/login", "POST", loginHeaders, new URLSearchParams({ password }).toString())).status, 429);
  advance(15 * 60_000 + 1);
  assert.equal((await send("/__studio/auth/login", "POST", loginHeaders, new URLSearchParams({ password }).toString())).status, 303);
});

test("production origins require TLS except on loopback and examples survive restarts", async t => {
  for (const value of ["http://example.com", "https://example.com/path", "https://example.com/", "https://user:pass@example.com", "https://example.com?x=1"]) {
    assert.throws(() => studioProductionOrigin(value));
  }
  assert.equal(studioProductionOrigin("http://127.0.0.1:5179").host, "127.0.0.1:5179");
  const root = await mkdtemp(join(tmpdir(), "hypit-personal-example-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = await prepareStudioExample(root, true);
  const source = join(run, "..", "scene.svml");
  await writeFile(source, "my saved edit");
  assert.equal(await prepareStudioExample(root, true), run);
  assert.equal(await readFile(source, "utf8"), "my saved edit");
});
