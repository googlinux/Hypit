import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Plugin, ViteDevServer } from "vite";
import { studioTokenHeader, studioTokenMeta } from "./request-policy.js";

const sessions = new WeakMap<ViteDevServer, string>();

/** Install before any custom route: Vite's own Host check runs after these plugins. */
export function protectStudioRequests(server: ViteDevServer): string {
  const previous = sessions.get(server);
  if (previous !== undefined) return previous;
  const token = randomBytes(32).toString("hex");
  sessions.set(server, token);
  server.middlewares.use((request, response, next) => {
    const deny = (status: number): void => {
      response.writeHead(status, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      response.end("Studio request rejected");
    };
    const host = request.headers.host?.toLowerCase();
    const port = request.socket.localPort;
    const scheme = server.config.server.https ? "https" : "http";
    const defaultPort = scheme === "https" ? 443 : 80;
    const suffix = port === defaultPort ? "" : `:${port}`;
    const hosts = ["localhost", "127.0.0.1", "[::1]"].map(name => `${name}${suffix}`);
    const hostCount = request.rawHeaders.filter((_value, index) => index % 2 === 0
      && request.rawHeaders[index]!.toLowerCase() === "host").length;
    if (port === undefined || host === undefined || hostCount !== 1 || !hosts.includes(host)) return deny(403);
    // Never allow an absolute-form URL to disagree with the validated Host.
    if (!request.url?.startsWith("/") || request.url.startsWith("//") || request.url.includes("\\")) return deny(403);
    const origin = `${scheme}://${host}`;
    if (request.headers.origin !== undefined && request.headers.origin !== origin) return deny(403);
    const site = request.headers["sec-fetch-site"];
    if (site !== undefined && site !== "same-origin" && site !== "none") return deny(403);
    if (request.method !== "GET" && request.method !== "HEAD") {
      if (request.headers.origin !== origin) return deny(403);
      const supplied = request.headers[studioTokenHeader];
      if (typeof supplied !== "string" || Buffer.byteLength(supplied) !== token.length
        || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) return deny(403);
      if (request.headers["content-type"]?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") return deny(415);
    }
    // The bootstrap HTML contains this server's write capability; it must not be cached or framed.
    response.setHeader("cache-control", "no-store");
    response.setHeader("x-frame-options", "SAMEORIGIN");
    next();
  });
  return token;
}

export function studioRequestProtectionPlugin(): Plugin {
  let token: string | undefined;
  return {
    name: "hypit-studio-request-protection",
    enforce: "pre",
    configureServer(server) { token = protectStudioRequests(server); },
    transformIndexHtml() {
      if (token === undefined) throw new Error("Studio request protection is not initialized");
      return [{ tag: "meta", attrs: { name: studioTokenMeta, content: token }, injectTo: "head" }];
    },
  };
}
