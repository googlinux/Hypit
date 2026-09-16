import { copyFile, lstat, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const firstFilmFiles = ["preview.svrun", "scene.svml", "styles.svs", "README.zh-CN.md"] as const;
const bundledRoot = fileURLToPath(new URL("../examples/first-film/", import.meta.url));

/** Create a separate, persistent practice copy; never replace a previous exercise. */
export async function prepareStudioExample(workspaceRoot: string, persistent = false): Promise<string> {
  const parent = join(workspaceRoot, ".hypit");
  const destination = join(parent, "studio-examples");
  // The destination is fixed by the host, not supplied by an HTTP request.
  for (const path of [parent, destination]) {
    await mkdir(path, { recursive: true });
    if (!(await lstat(path)).isDirectory()) throw new Error("Studio example directory must be a real directory.");
  }
  const personal = join(destination, "personal");
  const existing = async () => {
    try {
      if (!(await lstat(personal)).isDirectory()) throw new Error("Personal example must be a real directory.");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
    for (const file of firstFilmFiles) {
      if (!(await lstat(join(personal, file))).isFile()) throw new Error("Personal example contains an invalid file.");
    }
    return true;
  };
  if (persistent && await existing()) return join(personal, "preview.svrun");
  const copy = await mkdtemp(join(destination, "first-film-"));
  try {
    for (const file of firstFilmFiles) await copyFile(join(bundledRoot, file), join(copy, file));
    if (persistent) {
      try { await rename(copy, personal); }
      catch (error) { if (!await existing()) throw error; await rm(copy, { recursive: true, force: true }); }
    }
    return join(persistent ? personal : copy, "preview.svrun");
  } catch (error) { await rm(copy, { recursive: true, force: true }); throw error; }
}
