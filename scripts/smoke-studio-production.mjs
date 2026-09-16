/** Exercise the packaged app with Node's built-ins; never install dependencies or call providers. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { createServer } from "node:net";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const distribution = resolve(process.argv[2] ?? fileURLToPath(new URL("..", import.meta.url)));
const workspace = await mkdtemp(join(tmpdir(), "hypit-package-studio-"));
const salt = randomBytes(16).toString("hex"), password = randomBytes(24).toString("hex");
const passwordFile = join(workspace, "password");
await writeFile(passwordFile, `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}\n`, { mode: 0o600 });
const reservation = createServer();
await new Promise(done => reservation.listen(0, "127.0.0.1", done));
const port = reservation.address().port;
await new Promise(done => reservation.close(done));
const origin = `http://127.0.0.1:${port}`;
let output = "";
const child = spawn(process.execPath, [join(distribution, "bin/hypit.mjs"), "studio", "--production",
  "--workspace", workspace, "--password-file", passwordFile, "--port", String(port)], {
  cwd: workspace, env: { ...process.env, INIT_CWD: workspace }, stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", chunk => { output = (output + chunk).slice(-12000); });
child.stderr.on("data", chunk => { output = (output + chunk).slice(-12000); });
const exited = new Promise(done => child.once("exit", done));
const errors = new Promise((_, reject) => child.once("error", reject));
try {
  await Promise.race([errors, (async () => {
    let ready = false;
    for (let attempt = 0; attempt < 150; attempt++) {
      if (child.exitCode !== null) throw new Error(`Studio exited during startup:\n${output}`);
      try { ready = (await fetch(`${origin}/healthz`, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
      if (ready) break;
      await delay(200);
    }
    assert.ok(ready, `Studio did not become ready:\n${output}`);
    assert.equal((await fetch(`${origin}/__studio/session`)).status, 401);
    assert.equal((await fetch(`${origin}/`, { redirect: "manual" })).headers.get("location"), "/login");
    const login = await fetch(`${origin}/__studio/auth/login`, { method: "POST", redirect: "manual",
      headers: { origin }, body: new URLSearchParams({ password }) });
    assert.equal(login.status, 303);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const headers = { cookie };
    const html = await (await fetch(`${origin}/`, { headers })).text();
    assert.ok(!html.includes("/@vite/client"));
    const asset = /src="(\/assets\/[^"]+\.js)"/u.exec(html)?.[1];
    assert.ok(asset, "built entry module is present");
    assert.equal((await fetch(`${origin}${asset}`, { headers })).status, 200);
    const responses = await Promise.all(Array.from({ length: 4 }, () => fetch(`${origin}/__studio/session`, { headers })));
    assert.ok(responses.every(response => response.status === 200), "concurrent initial preview reads all succeed");
    const snapshots = await Promise.all(responses.map(response => response.json()));
    const snapshot = snapshots[0];
    assert.equal(snapshot.tracks.length, 2);
    const source = await readFile(join(workspace, ".hypit/studio-examples/personal/scene.svml"), "utf8");
    assert.ok(source.includes("Hello, Hypit."));
    for (const name of ["QUICKSTART.zh-CN.md", "SETTINGS.zh-CN.md", "PRODUCTION.zh-CN.md"]) {
      assert.ok((await readFile(join(distribution, name), "utf8")).length > 0);
    }
    console.log("Production package smoke passed: authentication, built assets, bundled example, preview and guides.");
  })()]);
} finally {
  if (child.exitCode === null) child.kill("SIGTERM");
  const deadline = setTimeout(() => child.kill("SIGKILL"), 15000);
  try { await exited; } finally { clearTimeout(deadline); await rm(workspace, { recursive: true, force: true }); }
}
