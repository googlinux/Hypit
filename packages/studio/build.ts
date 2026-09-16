import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const studioAssetRoot = resolve(dirname(fileURLToPath(import.meta.url)), "dist");
export async function buildStudio(): Promise<void> {
  const { build } = await import("vite");
  const { resolveDistributionPackageImport } = await import("@hypit/package-loader-node");
  const root = dirname(fileURLToPath(import.meta.url));
  await build({ root, configFile: false, base: "/", build: {
    outDir: studioAssetRoot, emptyOutDir: true, target: "esnext", sourcemap: false,
  }, plugins: [{ name: "hypit-distribution-imports", enforce: "pre",
    resolveId(specifier) { return resolveDistributionPackageImport(resolve(root, "../.."), specifier); },
  }] });
}
