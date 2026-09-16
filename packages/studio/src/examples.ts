import { copyFile, lstat, mkdir, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const firstFilmFiles = ["preview.svrun", "scene.svml", "styles.svs", "README.zh-CN.md"] as const;
const bundledRoot = fileURLToPath(new URL("../examples/first-film/", import.meta.url));

/** Create a separate, persistent practice copy; never replace a previous exercise. */
export async function prepareStudioExample(workspaceRoot: string): Promise<string> {
  const parent = join(workspaceRoot, ".hypit");
  const destination = join(parent, "studio-examples");
  // The destination is fixed by the host, not supplied by an HTTP request.
  for (const path of [parent, destination]) {
    await mkdir(path, { recursive: true });
    if (!(await lstat(path)).isDirectory()) throw new Error("Studio example directory must be a real directory.");
  }
  const copy = await mkdtemp(join(destination, "first-film-"));
  for (const file of firstFilmFiles) await copyFile(join(bundledRoot, file), join(copy, file));
  return join(copy, "preview.svrun");
}
