import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, win32 } from "node:path";
import test from "node:test";
import { assertBuildResultPath } from "@hypit/build-result";
import type { BuildResultFileRef, BuildResultRepository } from "@hypit/build-result";
import { exportBuildResultOutput } from "../src/result-export.js";

test("exports reject non-portable storage paths before opening bytes, including cross-drive paths", async t => {
  const root = await mkdtemp(join(tmpdir(), "hypit-export-security-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const type = { module: { name: "test.export", version: "1" }, name: "Clip" };
  let path = "files/clip.mp4", reads = 0;
  const repository = {
    async read() { return { outputs: { clip: { type } } }; },
    async resolve() {
      return { build: "owner", output: "clip", type, value: { kind: "value", document: {
        format: "hypit.result-value@1", value: { clip: null },
        resources: [{ at: ["clip"], file: { kind: "build-file", path, size: 4, mediaType: "video/mp4" } }],
      } } };
    },
    async describeFile(_build: string, file: BuildResultFileRef) { return file; },
    async openFile() { reads++; return (async function* () { yield Buffer.from("clip"); })(); },
  } as unknown as BuildResultRepository;
  const crossDrive = "C:/hypit-placeholder/new-file.txt";
  assert.equal(win32.isAbsolute(win32.relative("D:\\export", win32.resolve("D:\\export", crossDrive))), true);
  for (path of [crossDrive, "c:relative.txt", "files/clip.mp4:stream", "../escape", "files/../escape",
    "/absolute", "\\\\server\\share\\file", "files\\clip", "files/\0clip", "//server/share", ""]) {
    assert.throws(() => assertBuildResultPath(path, "test"), /Result-relative path/u);
    await assert.rejects(exportBuildResultOutput(repository, "owner", "clip", join(root, "bundle")), /Result-relative path/u);
    assert.equal(reads, 0, `source bytes opened for ${path}`);
    assert.deepEqual(await readdir(root), [], "failed exports leave no partial bundle");
  }
  path = "files/片段.mp4";
  await exportBuildResultOutput(repository, "owner", "clip", join(root, "bundle"));
  assert.equal(await readFile(join(root, "bundle", path), "utf8"), "clip");
  assert.equal(reads, 1);
  await assert.rejects(exportBuildResultOutput(repository, "owner", "clip", join(root, "bundle")), /already exists/u);
});
