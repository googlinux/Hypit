import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StudioModule } from "./src/host.js";
import type { StudioBuildLibrary } from "./src/build-library.js";
import type { CliIo } from "@hypit/cli";

const here = dirname(fileURLToPath(import.meta.url));

export function writeStudioHelp(io: Pick<CliIo, "write">): void {
  io.write(`hypit studio
Open a Run in the browser to inspect its composition, Sources and Results.

  hypit studio --run <build.svrun> [--runtime <hypit.runtime.json>]
    [--port <number>] [--workspace <directory>] [--package-root <directory>]
    [--locale-pack <./language.json | installed-package/language.json>]...

  hypit studio --settings [--runtime <hypit.runtime.json>] [--workspace <directory>]
    Open settings with a local practice example available in the editor.

  hypit studio [--example first-film] [--workspace <directory>]
    Start the getting-started guide and a provider-free example.
    A new editable copy is saved under .hypit/studio-examples/.

  hypit studio --build
    Build the production browser assets (no server or dependency installation).
  hypit studio --create-password <file>
    Create a private password hash file using a hidden terminal prompt.
  hypit studio --production --password-file <file> [--origin https://studio.example.com]
    [--port 5179] [--run <build.svrun>] [--workspace <directory>]
    Start the personal production server on 127.0.0.1 behind your HTTPS proxy.
    Local use defaults to http://127.0.0.1:<port>. No default password is provided.

  hypit studio --check-locale <./language.json | installed-package/language.json>
    [--package-root <directory>]

Language packs are explicit JSON data. Relative files use the current directory;
package exports resolve from --package-root (the project by default).
--check-locale lists missing translations and unknown IDs without opening a Run.

Relative command-line paths start at the current directory; --workspace selects
the project, without rebasing those paths. Otherwise the nearest package.json
above the current directory defines the project (or the current directory if none).
Without --runtime, Studio uses that project's .hypit/runtime selection.
The server prints its project, Run, Runtime selection and browser URL.
Press Ctrl+C to stop it.
`);
}

function invalidArguments(message: string): never {
  throw new Error(`${message}. See hypit studio --help.`);
}

function argumentsByName(argv: readonly string[]): ReadonlyMap<string, readonly string[]> {
  const accepted = new Set(["run", "example", "runtime", "port", "workspace", "package-root", "locale-pack", "check-locale", "password-file", "origin", "create-password"]);
  const result = new Map<string, string[]>();
  for (let index = 0; index < argv.length; index += 2) {
    if (["--settings", "--production", "--build"].includes(argv[index]!)) { result.set(argv[index]!.slice(2), ["true"]); index -= 1; continue; }
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === undefined || !flag.startsWith("--") || value === undefined || value.startsWith("--")) {
      invalidArguments(`Malformed argument near ${flag ?? "end of command"}`);
    }
    const name = flag.slice(2);
    if (!accepted.has(name)) invalidArguments(`Unknown option --${name}`);
    result.set(name, [...result.get(name) ?? [], value]);
  }
  return result;
}

export async function runStudio(argv: readonly string[], io: Pick<CliIo, "write">): Promise<void> {
  if (argv.includes("--help") || argv.includes("-h")) {
    writeStudioHelp(io);
    return;
  }
  const values = argumentsByName(argv[0] === "--" ? argv.slice(1) : argv);
  const invokedFrom = process.env.INIT_CWD ?? process.cwd();
  const runArgument = values.get("run")?.at(-1);
  if (values.has("build")) {
    if (values.size !== 1) invalidArguments("--build must be used alone");
    await (await import("./build.js")).buildStudio(); return;
  }
  if (values.has("create-password")) {
    if (values.size !== 1) invalidArguments("--create-password must be used alone");
    const path = resolve(invokedFrom, values.get("create-password")!.at(-1)!);
    await (await import("./src/personal-auth.js")).createStudioPasswordFile(path);
    io.write(`Password hash saved to ${path}\n`); return;
  }
  const production = values.has("production");
  if (!production && (values.has("origin") || values.has("password-file"))) invalidArguments("--origin and --password-file require --production");
  const passwordFile = values.get("password-file")?.at(-1) ?? process.env.HYPIT_STUDIO_PASSWORD_FILE;
  if (production && !passwordFile) invalidArguments("--production requires --password-file or HYPIT_STUDIO_PASSWORD_FILE");

  const { findRuntimeProfile, resolveProjectRoot } = await import("@hypit/project-context-node");

  const packageRootArgument = values.get("package-root")?.at(-1);
  const workspaceArgument = values.get("workspace")?.at(-1);
  const requestedWorkspaceRoot = workspaceArgument === undefined
    ? undefined
    : resolve(invokedFrom, workspaceArgument);
  const workspaceRoot = await resolveProjectRoot({
    ...(requestedWorkspaceRoot === undefined ? {} : { workspaceRoot: requestedWorkspaceRoot }),
    cwd: invokedFrom,
  });
  const packageRoot = packageRootArgument === undefined
    ? workspaceRoot
    : resolve(invokedFrom, packageRootArgument);
  const { describeLanguagePack, loadLanguagePack, studioLanguages, studioLocalizationPlugin } = await import("./src/localization-node.js");
  const checkLocale = values.get("check-locale")?.at(-1);
  if (checkLocale !== undefined) {
    io.write(describeLanguagePack(await loadLanguagePack(checkLocale, invokedFrom, packageRoot)) + "\n");
    return;
  }
  const exampleArgument = values.get("example")?.at(-1);
  if (exampleArgument !== undefined && exampleArgument !== "first-film") invalidArguments("Unknown example (choose first-film)");
  if (runArgument !== undefined && (!runArgument.trim() || exampleArgument !== undefined)) invalidArguments("Choose either --run or --example");
  const isExample = runArgument === undefined;
  const port = Number(values.get("port")?.at(-1) ?? "5179");
  if (!Number.isSafeInteger(port) || port <= 0 || port > 65535) invalidArguments("--port must be a positive integer");
  const productionOrigin = values.get("origin")?.at(-1) ?? `http://127.0.0.1:${port}`;
  if (production) {
    (await import("./src/production.js")).studioProductionOrigin(productionOrigin);
    await (await import("./src/personal-auth.js")).loadStudioPassword(resolve(invokedFrom, passwordFile!));
  }
  const runPath = isExample
    ? await (await import("./src/examples.js")).prepareStudioExample(workspaceRoot, production)
    : resolve(invokedFrom, runArgument!);
  const { resolveDistributionPackageImport } = await import("@hypit/package-loader-node");
  const { videoCliDistribution, videoStudioCompanionPackages } = await import("@hypit/video-cli");
  const { studioSettingsPlugin } = await import("./src/settings-server.js");
  const { studioRequestProtectionPlugin } = await import("./src/request-protection.js");
  const languages = await studioLanguages(values.get("locale-pack") ?? [], invokedFrom, packageRoot);
  const runtimeArgument = values.get("runtime")?.at(-1);
  const selectedRuntime = runtimeArgument === undefined
    ? await findRuntimeProfile(workspaceRoot)
    : undefined;
  const runtimePath = runtimeArgument === undefined
    ? selectedRuntime?.profile
    : resolve(invokedFrom, runtimeArgument);
  console.info([
    `  Project            ${workspaceRoot}`,
    `  Run                ${runPath ?? "settings only"}`,
    `  Runtime Profile    ${runtimePath ?? "not selected"}`,
    `  Runtime selection  ${runtimeArgument !== undefined
      ? "command argument (this session only)" : selectedRuntime?.selectionFile ?? "none"}`,
    ...(packageRoot === workspaceRoot ? [] : [`  Package root       ${packageRoot}`]),
    "",
  ].join("\n"));

  const distributionPackageRoot = videoCliDistribution.packageRoot ?? resolve(here, "../..");
  let buildLibrary: StudioBuildLibrary | undefined;
  const runPlugins: StudioModule[] = [];
  if (runPath !== undefined) {
    const { openStudioBuildLibrary } = await import("./src/build-library.js");
    const { loadStudioCompanionRegistry } = await import("./src/companion-assembly.js");
    const { loadStudioDomain } = await import("./src/domain.js");
    const { loadStudioRun } = await import("./src/run.js");
    const { studioPlugin } = await import("./src/server.js");
    const { studioFeedbackPlugin } = await import("./src/feedback-server.js");
    const { inspectStudioRun } = await import("./src/studio-preflight.js");
    const domain = await loadStudioDomain({ run: runPath, workspaceRoot, packageRoot });
    const registry = await loadStudioCompanionRegistry({
      distributionPackageRoot, distributionPackages: videoStudioCompanionPackages, sourcePackages: domain.packages,
    });
    // Practice is local even when the project has selected a paid Provider.
    buildLibrary = await openStudioBuildLibrary(isExample ? undefined : runtimePath, packageRoot, workspaceRoot, distributionPackageRoot);
    try {
      const run = await loadStudioRun({ run: runPath, domain, registry, buildLibrary });
      inspectStudioRun(registry, run.source, run);
      runPlugins.push(studioFeedbackPlugin(workspaceRoot, runPath), studioPlugin({
        source: run.authorSource, runPath, workspaceRoot, domain, registry, buildLibrary,
      }));
    } catch (error) { await buildLibrary.close(); throw error; }
  }
  const distributionImports = {
    name: "hypit-distribution-imports",
    enforce: "pre" as const,
    resolveId(specifier: string): string | undefined {
      return resolveDistributionPackageImport(distributionPackageRoot, specifier);
    },
  };
  const modules = [studioLocalizationPlugin(languages),
    studioSettingsPlugin({ workspaceRoot, packageRoot, distributionPackageRoot, hasRun: true,
      ...(isExample ? { example: { id: "first-film", directory: dirname(runPath) } } : {}),
      ...(runtimePath === undefined ? {} : { runtimePath }) }), ...runPlugins];
  if (production) {
    const { createStudioProductionServer } = await import("./src/production.js");
    const { studioAssetRoot } = await import("./build.js");
    let host: Awaited<ReturnType<typeof createStudioProductionServer>> | undefined;
    try {
      host = await createStudioProductionServer({ origin: productionOrigin,
        passwordFile: resolve(invokedFrom, passwordFile!), assetRoot: studioAssetRoot, modules });
      await new Promise<void>((done, reject) => {
        host!.server.once("error", reject);
        host!.server.listen(port, "127.0.0.1", () => { host!.server.off("error", reject); done(); });
      });
    } catch (error) { await host?.close(); await buildLibrary?.close(); throw error; }
    const shutdown = () => { void host!.close().then(() => process.exit(0), () => process.exit(1)); };
    process.once("SIGINT", shutdown); process.once("SIGTERM", shutdown);
    io.write(`  Personal production Studio  ${productionOrigin}/\n  Health check                ${productionOrigin}/healthz\n`);
    return;
  }
  const { createServer } = await import("vite");
  const server = await createServer({
    configFile: false,
    root: here,
    server: {
      port,
      host: "127.0.0.1",
      // Vite resolves package assets through pnpm's real paths. The package root
      // must therefore be readable for self-hosted fonts and other declared
      // Studio dependencies, while the author workspace remains separately
      // available for Source and material previews.
      fs: { allow: [workspaceRoot, packageRoot, distributionPackageRoot, here] },
    },
    plugins: [studioRequestProtectionPlugin(), distributionImports, ...modules],
  });
  server.httpServer?.once("close", () => {
    void buildLibrary?.close().catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
    });
  });
  await server.listen();
  server.printUrls();
  for (const url of server.resolvedUrls?.local ?? []) {
    io.write(`  Getting started    ${url}#settings/guide\n`);
    if (runPath) io.write(`  Comments           ${url}#comments\n`);
    io.write(`  Settings           ${url}#settings/api-keys\n`);
  }
}
