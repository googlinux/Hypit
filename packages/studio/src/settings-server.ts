import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import type { RuntimeHostCredentialControl, RuntimeHostCredentialStatus } from "@hypit/runtime-host-node";
import { createRuntimeCredentialsFromConfig, parseLocalRuntimeProfile } from "@hypit/runtime-local/config";
import { protectStudioRequests } from "./request-protection.js";
import type { StudioCredential, StudioEndpoint, StudioSettingsContext } from "./settings.js";

type Options = {
  readonly workspaceRoot: string;
  readonly packageRoot: string;
  readonly distributionPackageRoot: string;
  readonly runtimePath?: string;
  readonly hasRun: boolean;
  readonly example?: StudioSettingsContext["example"];
  /** Host-side injection for isolated tests; never selected by an HTTP request. */
  readonly openCredentials?: (endpoint: string) => Promise<RuntimeHostCredentialControl>;
};

class RequestError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}

function send(res: ServerResponse, status: number, value: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(value));
}

async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const bytes = Buffer.from(chunk as Uint8Array);
    length += bytes.length;
    if (length > 32 * 1024) { req.resume(); throw new RequestError(413, "too-large"); }
    chunks.push(bytes);
  }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new RequestError(400, "invalid-request"); }
}

function credential(item: RuntimeHostCredentialStatus): StudioCredential {
  return { slot: item.slot, label: item.label, storage: item.ref.store,
    configured: item.configured, writable: item.writable && item.kind === "secret" };
}

/** Show a destination without leaking URL credentials, signed queries, or config secrets. */
function origin(config: unknown): string | undefined {
  if (!config || typeof config !== "object" || !("baseUrl" in config) || typeof config.baseUrl !== "string") return;
  try {
    const url = new URL(config.baseUrl);
    if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
  } catch { /* Invalid configuration is handled by the runtime, never echoed here. */ }
}

export function studioSettingsPlugin(options: Options): Plugin {
  const context: StudioSettingsContext = {
    hasRun: options.hasRun, project: options.workspaceRoot, platform: process.platform, node: process.version,
    ...(options.example === undefined ? {} : { example: options.example }),
    ...(options.runtimePath === undefined ? {} : { profile: options.runtimePath }),
  };
  const profile = async () => options.runtimePath === undefined ? undefined
    : parseLocalRuntimeProfile(JSON.parse(await readFile(options.runtimePath, "utf8")));
  const open = options.openCredentials ?? (async (endpoint: string) => {
    if (!options.runtimePath) throw new RequestError(409, "no-runtime");
    return await createRuntimeCredentialsFromConfig(options.runtimePath, endpoint, {
      packageRoot: options.packageRoot, distributionPackageRoot: options.distributionPackageRoot,
    });
  });
  // Keychain access and mutations are serialized, including reads following a write.
  let queue: Promise<void> = Promise.resolve();
  return { name: "hypit-studio-settings", configureServer(server) {
    protectStudioRequests(server);
    server.middlewares.use((req, res, next) => {
      const path = req.url?.split("?")[0];
      if (path !== "/__studio/settings" && path !== "/__studio/settings/context" && path !== "/__studio/settings/credential") {
        next(); return;
      }
      const handle = async (): Promise<void> => {
        if (path === "/__studio/settings/context" && req.method === "GET") { send(res, 200, context); return; }
        if (path === "/__studio/settings" && req.method === "GET") {
          const document = await profile();
          const endpoints: StudioEndpoint[] = [];
          for (const item of document?.endpoints ?? []) {
            const destination = origin(item.config);
            const base = { id: item.instance, provider: item.use, ...(destination === undefined ? {} : { origin: destination }) };
            let control: RuntimeHostCredentialControl | undefined;
            try {
              control = await open(item.instance);
              endpoints.push({ ...base, credentials: (await control.credentials(item.instance)).map(credential) });
            } catch {
              endpoints.push({ ...base, credentials: [], unavailable: true });
            } finally { await control?.close(); }
          }
          send(res, 200, { ...context, endpoints }); return;
        }
        if (path !== "/__studio/settings/credential" || (req.method !== "PUT" && req.method !== "DELETE")) {
          throw new RequestError(405, "method-not-allowed");
        }
        const value = await body(req);
        const allowed = req.method === "PUT" ? ["endpoint", "slot", "secret"] : ["endpoint", "slot", "confirm"];
        if (Object.keys(value).some(key => !allowed.includes(key))
          || typeof value.endpoint !== "string" || typeof value.slot !== "string"
          || value.endpoint.length > 256 || value.slot.length > 256) throw new RequestError(400, "invalid-request");
        const document = await profile();
        if (!document) throw new RequestError(409, "no-runtime");
        if (!document.endpoints.some(item => item.instance === value.endpoint)) throw new RequestError(404, "unknown-credential");
        if (req.method === "PUT" && (typeof value.secret !== "string" || value.secret.trim().length === 0
          || Buffer.byteLength(value.secret) > 16 * 1024 || /[\u0000\r\n]/u.test(value.secret))) {
          throw new RequestError(400, "invalid-secret");
        }
        if (req.method === "DELETE" && value.confirm !== true) throw new RequestError(400, "confirmation-required");
        const control = await open(value.endpoint);
        try {
          const item = (await control.credentials(value.endpoint)).find(item => item.slot === value.slot);
          if (!item) throw new RequestError(404, "unknown-credential");
          if (!item.writable || item.kind !== "secret") throw new RequestError(409, "read-only");
          const updated = req.method === "PUT"
            ? await control.putCredential(value.endpoint, value.slot, value.secret as string)
            : (await control.deleteCredential(value.endpoint, value.slot)).credential;
          send(res, 200, { credential: credential(updated) });
        } finally { await control.close(); }
      };
      queue = queue.then(handle).catch((error: unknown) => {
        // Adapter errors can contain credentials. Never serialize or log their messages.
        if (!res.writableEnded) send(res, error instanceof RequestError ? error.status : 503,
          { error: error instanceof RequestError ? error.code : "settings-unavailable" });
      });
    });
  } };
}
