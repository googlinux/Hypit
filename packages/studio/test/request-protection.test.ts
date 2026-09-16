import assert from "node:assert/strict";
import { request } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";
import { createServer } from "vite";
import type { Plugin } from "vite";
import { studioFeedbackPlugin } from "../src/feedback-server.js";
import { studioLocalizationPlugin } from "../src/localization-node.js";
import { studioRequestProtectionPlugin } from "../src/request-protection.js";
import { studioTokenHeader } from "../src/request-policy.js";

async function fixture(t: TestContext, feedbackFirst = false) {
  const root = await mkdtemp(join(tmpdir(), "hypit-studio-http-"));
  await writeFile(join(root, "index.html"), "<!doctype html><html><head></head><body>Studio</body></html>");
  const feedback = studioFeedbackPlugin(root, join(root, "main.svrun"));
  const locales = studioLocalizationPlugin([]);
  const routes: Plugin = { name: "test-studio-resource", configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === "/__studio/artifact") {
        res.statusCode = req.headers.range ? 206 : 200;
        res.end(req.method === "HEAD" ? undefined : "media");
      } else if (req.url?.startsWith("/__studio/")) { res.statusCode = 204; res.end(); }
      else next();
    });
  } };
  const server = await createServer({ root, configFile: false, logLevel: "silent",
    server: { host: "127.0.0.1", port: 0, watch: null },
    plugins: [studioRequestProtectionPlugin(), ...(feedbackFirst ? [feedback, locales] : [locales, feedback]), routes],
  });
  t.after(async () => { await server.close(); await rm(root, { recursive: true, force: true }); });
  await server.listen();
  const address = server.httpServer!.address();
  assert.ok(address !== null && typeof address !== "string");
  const host = `127.0.0.1:${address.port}`, origin = `http://${host}`;
  const html = await server.transformIndexHtml("/", await readFile(join(root, "index.html"), "utf8"));
  const token = /name="hypit-studio-token" content="([a-f0-9]{64})"/u.exec(html)?.[1];
  assert.ok(token, "HTML bootstrap supplies a session token");
  const send = (path: string, method = "GET", headers: Record<string, string> = {}, body?: string) =>
    new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = request({ hostname: "127.0.0.1", port: address.port, path, method, headers: { host, ...headers } }, res => {
        let text = "";
        res.setEncoding("utf8"); res.on("data", value => { text += value; });
        res.on("end", () => resolve({ status: res.statusCode!, body: text }));
      });
      req.on("error", reject); req.end(body);
    });
  return { root, host, origin, token, send };
}

test("all early Studio routes reject foreign hosts/origins and preserve same-origin media reads", async t => {
  const { host, origin, send } = await fixture(t);
  assert.match((await send("/")).body, /name="hypit-studio-token"/u);
  for (const path of ["/__studio/session", "/__studio/library", "/__studio/locales", "/__studio/feedback",
    "/__studio/surface-preview", "/__studio/storyboard/res_one", "/__studio/material/res_one", "/__studio/artifact",
    "/x/../__studio/feedback"]) {
    for (const headers of [{ host: "evil.example:5179" }, { host: "localhost.evil.example:5179" },
      { host: host.replace(/:\d+$/u, ":1") }, { origin: "https://evil.example" }, { origin: "null" },
      { origin: `${origin}/` }, { "sec-fetch-site": "cross-site" }, { "sec-fetch-site": "same-site" }]) {
      assert.equal((await send(path, "GET", headers)).status, 403, `${path} ${JSON.stringify(headers)}`);
    }
  }
  assert.equal((await send("/__studio/locales", "GET", { origin, "sec-fetch-site": "same-origin" })).status, 200);
  assert.equal((await send("/__studio/artifact", "GET", { range: "bytes=0-4" })).status, 206);
  assert.equal((await send("/__studio/artifact", "HEAD")).status, 200);
  for (const path of ["http://evil.example/__studio/feedback", "//evil.example/__studio/feedback", "/\\evil.example"]) {
    assert.equal((await send(path)).status, 403);
  }
});

test("writes require this session's token, exact Origin and JSON before persisting feedback", async t => {
  const { root, origin, token, send } = await fixture(t, true);
  const headers = { origin, [studioTokenHeader]: token, "content-type": "application/json" };
  const note = { id: "one", run: "main.svrun", at: 0, text: "Review note" };
  const body = JSON.stringify({ type: "add", comment: note });
  for (const [path, method] of [["/__studio/feedback", "POST"], ["/__studio/mutation", "POST"],
    ["/__studio/source", "PUT"], ["/__studio/artifact-name", "PUT"]]) {
    for (const rejected of [{ "content-type": "text/plain" }, { ...headers, origin: "https://evil.example" },
      { ...headers, origin: "null" }, { ...headers, [studioTokenHeader]: "0".repeat(64) },
      { [studioTokenHeader]: token, "content-type": "application/json" },
      { origin, "content-type": "application/json" }]) {
      assert.equal((await send(path!, method!, rejected, body)).status, 403);
    }
    assert.equal((await send(path!, method!, { ...headers, "content-type": "text/plain" }, body)).status, 415);
  }
  await assert.rejects(readFile(join(root, "FEEDBACK.json")), { code: "ENOENT" });
  assert.equal((await send("/__studio/feedback", "POST", headers, body)).status, 200);
  assert.deepEqual(JSON.parse(await readFile(join(root, "FEEDBACK.json"), "utf8")).comments, [note]);
  assert.equal((await send("/__studio/feedback")).status, 200);
  const other = await fixture(t);
  assert.notEqual(other.token, token);
  assert.equal((await other.send("/__studio/feedback", "POST", { ...headers, origin: other.origin }, body)).status, 403);
});
