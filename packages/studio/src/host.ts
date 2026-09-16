import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { protectStudioRequests } from "./request-protection.js";

export type StudioMiddleware = (request: IncomingMessage, response: ServerResponse, next: () => void) => void;
/** The editor routes depend on HTTP and notifications, not the development server. */
export type StudioHost = {
  middlewares: { use(handler: StudioMiddleware): unknown };
  httpServer: { once(event: "close", listener: () => void): unknown } | null;
  ws: { send(message: { type: "custom"; event: string; data?: unknown }): void };
};

export function studioModule(name: string, install: (host: StudioHost) => void, close?: () => Promise<void>) {
  return {
    name, install,
    configureServer(server: ViteDevServer) { protectStudioRequests(server); install(server); },
    ...(close === undefined ? {} : { closeBundle: close }),
  };
}
export type StudioModule = ReturnType<typeof studioModule>;

/** Limits apply to streamed/chunked requests as well as Content-Length. */
export async function readStudioBody(request: IncomingMessage, limit = 1024 * 1024): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    const bytes = Buffer.from(chunk as Uint8Array);
    size += bytes.length;
    if (size > limit) { request.resume(); throw new Error("Request body is too large"); }
    chunks.push(bytes);
  }
  return Buffer.concat(chunks).toString("utf8");
}
