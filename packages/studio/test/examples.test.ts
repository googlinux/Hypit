import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import type { TestContext } from "node:test";
import { videoStudioCompanionPackages } from "@hypit/video-cli";
import { prepareStudioExample, firstFilmFiles } from "../src/examples.js";
import { loadStudioDomain } from "../src/domain.js";
import { loadStudioCompanionRegistry } from "../src/companion-assembly.js";
import { loadStudioRun } from "../src/run.js";
import { readStudioSession } from "../src/session.js";

async function workspace(t: TestContext): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "hypit-studio-example-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("bundled first film compiles and produces the complete preview without a runtime or credentials", async t => {
  const root = await workspace(t);
  const runPath = await prepareStudioExample(root);
  const domain = await loadStudioDomain({ run: runPath, workspaceRoot: root, packageRoot: process.cwd() });
  const registry = await loadStudioCompanionRegistry({ distributionPackageRoot: process.cwd(),
    distributionPackages: videoStudioCompanionPackages, sourcePackages: domain.packages });
  const run = await loadStudioRun({ run: runPath, domain, registry });
  // No BuildLibrary or transient execution: any unresolved provider Need fails this preview.
  const { snapshot } = await readStudioSession({ domain, registry, run, revision: 1, workspaceRoot: root,
    sourcePath: relative(root, run.authorSource) });
  assert.equal(snapshot.space.frameCount, 270);
  assert.equal(snapshot.space.canvasWidth, 960);
  assert.equal(snapshot.space.canvasHeight, 540);
  assert.equal(snapshot.tracks.length, 2);
  assert.equal(snapshot.tracks.reduce((count, track) => count + track.clips.length, 0), 7);
  assert.equal(snapshot.preview.kind, "hyperframes");
  assert.ok(snapshot.tracks.flatMap(track => track.clips).some(clip => clip.authoredId === "rose"));
  assert.equal(snapshot.provenance.picture, "resolved");
});

test("new example sessions preserve previous edits and include every file needed to reopen", async t => {
  const root = await workspace(t);
  const first = dirname(await prepareStudioExample(root));
  const original = await readFile(join(first, "scene.svml"), "utf8");
  await writeFile(join(first, "scene.svml"), "my own practice edits");
  const second = dirname(await prepareStudioExample(root));
  assert.notEqual(first, second);
  assert.equal(await readFile(join(first, "scene.svml"), "utf8"), "my own practice edits");
  assert.equal(await readFile(join(second, "scene.svml"), "utf8"), original);
  assert.deepEqual((await readdir(second)).sort(), [...firstFilmFiles].sort());
});

test("example copies reject a redirected .hypit directory", { skip: process.platform === "win32" }, async t => {
  const root = await workspace(t), elsewhere = await workspace(t);
  await symlink(elsewhere, join(root, ".hypit"), "dir");
  await assert.rejects(prepareStudioExample(root), /real directory/u);
  assert.deepEqual(await readdir(elsewhere), []);
});
