import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import {
  distributionSubprocessBootstrap,
  installDistributionPackageResolution,
  installExternalPackageResolution,
} from "../src/distribution-resolution.js";
import { externalPackageInstallRoot } from "../src/location.js";

test("a disposable process resolves bundled modules and exact machine dependencies without workspace links", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "hypit-subprocess-")));
  try {
    const distribution = join(root, "distribution");
    const machine = join(root, "machine");
    const bundled = join(distribution, "packages", "fixture");
    const dependency = join(externalPackageInstallRoot(machine, "render-fixture", "1.2.3"), "node_modules", "render-fixture");
    await mkdir(bundled, { recursive: true });
    await mkdir(dependency, { recursive: true });
    await writeFile(join(bundled, "package.json"), JSON.stringify({
      name: "@hypit/fixture", type: "module", exports: "./index.mjs",
      dependencies: { "render-fixture": "1.2.3" },
    }));
    await writeFile(join(bundled, "index.mjs"), 'export { value } from "render-fixture";');
    await writeFile(join(dependency, "package.json"), JSON.stringify({
      name: "render-fixture", version: "1.2.3", type: "module", exports: "./index.mjs",
    }));
    await writeFile(join(dependency, "index.mjs"), "export const value = 42;");
    const entry = join(root, "child.mjs");
    await writeFile(entry, 'import { value } from "@hypit/fixture"; process.stdout.write(String(value));');
    installDistributionPackageResolution([distribution]);
    installExternalPackageResolution([machine]);
    const output = execFileSync(process.execPath, [
      "--import", import.meta.resolve("tsx"), "--input-type=module", "--eval",
      distributionSubprocessBootstrap(pathToFileURL(entry)),
    ], { cwd: root, encoding: "utf8", timeout: 15_000 });
    assert.equal(output, "42");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
