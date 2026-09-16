import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { readStudioBody } from "./host.js";
import type { StudioHost, StudioMiddleware, StudioModule } from "./host.js";
import { loadStudioPassword, studioLoginPage } from "./personal-auth.js";
import { studioTokenHeader } from "./request-policy.js";

type Session = { csrf: string; expires: number; streams: Set<ServerResponse> };
export function studioProductionOrigin(value: string): URL {
  const origin = new URL(value);
  if (origin.origin !== value || origin.username || origin.password
    || (origin.protocol !== "https:" && !(origin.protocol === "http:"
      && ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname)))) {
    throw new Error("--origin must be an HTTPS origin without a path, or a loopback HTTP origin.");
  }
  return origin;
}

export async function createStudioProductionServer(options: {
  origin: string; passwordFile: string; assetRoot: string; modules: readonly StudioModule[];
  /** Injectable clock for expiry tests. */
  now?: () => number;
}) {
  const origin = studioProductionOrigin(options.origin);
  const secure = origin.protocol === "https:";
  const cookieName = secure ? "__Host-hypit-session" : "hypit-session";
  const verify = await loadStudioPassword(options.passwordFile);
  const root = await realpath(options.assetRoot).catch(() => { throw new Error("Studio production assets are missing. Run hypit studio --build first."); });
  const html = await readFile(resolve(root, "index.html"), "utf8");
  const now = options.now ?? Date.now;
  const sessions = new Map<string, Session>();
  const middleware: StudioMiddleware[] = [];
  let loginAttempts: number[] = [];
  let verifying = false;
  const revoke = (id: string, session: Session) => {
    for (const stream of session.streams) stream.end();
    sessions.delete(id);
  };
  const prune = () => { for (const [id, session] of sessions) if (session.expires <= now()) revoke(id, session); };
  const send = (res: ServerResponse, status: number, body: string, type = "text/plain; charset=utf-8") => {
    res.writeHead(status, { "content-type": type }); res.end(body);
  };
  const setCookie = (res: ServerResponse, id: string, age = 43200) => res.setHeader("set-cookie",
    `${cookieName}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure ? "; Secure" : ""}`);
  const redirect = (res: ServerResponse, path: string) => { res.writeHead(303, { location: path }); res.end(); };
  const readSession = (req: IncomingMessage) => {
    const values = (req.headers.cookie ?? "").split(";").map(part => part.trim()).filter(part => part.startsWith(`${cookieName}=`));
    if (values.length !== 1) return;
    const id = values[0]!.slice(cookieName.length + 1);
    if (!/^[a-f0-9]{64}$/u.test(id)) return;
    const session = sessions.get(id);
    return session === undefined ? undefined : { id, session };
  };
  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    res.setHeader("cache-control", "private, no-store");
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("x-frame-options", "SAMEORIGIN");
    res.setHeader("referrer-policy", "same-origin");
    res.setHeader("content-security-policy", "frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
    // All content (including media) is private; individual routes cannot opt into shared caching.
    const setHeader = res.setHeader.bind(res);
    res.setHeader = (name, value) => setHeader(name, name.toLowerCase() === "cache-control" ? "private, no-store" : value);
    if (secure) res.setHeader("strict-transport-security", "max-age=31536000");
    const hostCount = req.rawHeaders.filter((_, i) => i % 2 === 0 && req.rawHeaders[i]!.toLowerCase() === "host").length;
    if (hostCount !== 1 || req.headers.host?.toLowerCase() !== origin.host
      || !req.url?.startsWith("/") || req.url.startsWith("//") || req.url.includes("\\")
      || (req.headers.origin !== undefined && req.headers.origin !== origin.origin)
      || (req.headers["sec-fetch-site"] !== undefined && !["same-origin", "none"].includes(String(req.headers["sec-fetch-site"])))) {
      send(res, 403, "Studio request rejected"); return;
    }
    const url = new URL(req.url, origin);
    const read = req.method === "GET" || req.method === "HEAD";
    if (!read && req.headers.origin !== origin.origin) { send(res, 403, "Studio request rejected"); return; }
    if (url.pathname === "/healthz" && read) { send(res, 200, "ok\n"); return; }
    prune();
    const auth = readSession(req);
    if (url.pathname === "/login" && read) {
      if (auth) redirect(res, "/"); else send(res, 200, req.method === "HEAD" ? "" : studioLoginPage(), "text/html; charset=utf-8");
      return;
    }
    if (url.pathname === "/__studio/auth/login" && req.method === "POST") {
      loginAttempts = loginAttempts.filter(time => time > now() - 15 * 60_000);
      if (loginAttempts.length >= 10 || verifying) {
        res.setHeader("retry-after", "900");
        send(res, 429, studioLoginPage("尝试次数过多，请 15 分钟后重试。"), "text/html; charset=utf-8"); return;
      }
      if (req.headers["content-type"]?.split(";", 1)[0] !== "application/x-www-form-urlencoded") { send(res, 415, "Unsupported content type"); return; }
      loginAttempts.push(now()); verifying = true;
      try {
        const params = new URLSearchParams(await readStudioBody(req, 8192));
        if (params.getAll("password").length !== 1 || !await verify(params.get("password") ?? "")) {
          send(res, 401, studioLoginPage("密码不正确，请重试。"), "text/html; charset=utf-8"); return;
        }
        loginAttempts = [];
        if (auth) revoke(auth.id, auth.session);
        if (sessions.size >= 8) { const first = sessions.entries().next().value!; revoke(first[0], first[1]); }
        const id = randomBytes(32).toString("hex");
        sessions.set(id, { csrf: randomBytes(32).toString("hex"), expires: now() + 12 * 60 * 60_000, streams: new Set() });
        setCookie(res, id); redirect(res, "/");
      } finally { verifying = false; }
      return;
    }
    if (!auth) {
      if (url.pathname === "/" && read) redirect(res, "/login");
      else send(res, 401, JSON.stringify({ error: "authentication-required" }), "application/json");
      return;
    }
    if (!read) {
      const token = req.headers[studioTokenHeader];
      if (typeof token !== "string" || Buffer.byteLength(token) !== 64 || !timingSafeEqual(Buffer.from(token), Buffer.from(auth.session.csrf))) {
        send(res, 403, "Studio request rejected"); return;
      }
      if (req.headers["content-type"]?.split(";", 1)[0]?.trim() !== "application/json") { send(res, 415, "JSON required"); return; }
    }
    if (url.pathname === "/__studio/auth/logout" && req.method === "POST") {
      revoke(auth.id, auth.session); setCookie(res, "", 0); send(res, 200, "{}"); return;
    }
    if (url.pathname === "/__studio/events" && req.method === "GET") {
      if (auth.session.streams.size >= 8) { send(res, 429, "Too many connections"); return; }
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "private, no-store", "x-accel-buffering": "no" });
      auth.session.streams.add(res);
      res.write("event: studio:connected\ndata: {}\n\n");
      const timer = setInterval(() => {
        if (auth.session.expires <= now()) { revoke(auth.id, auth.session); return; }
        if (res.writableLength > 16 * 1024 * 1024) res.destroy();
        else res.write(": heartbeat\n\n");
      }, 15_000);
      res.once("close", () => { clearInterval(timer); auth.session.streams.delete(res); });
      return;
    }
    let index = 0;
    const next = () => {
      const handler = middleware[index++];
      if (handler) handler(req, res, next);
      else void serve().catch(() => { if (!res.headersSent) send(res, 404, "Not found"); else res.destroy(); });
    };
    const serve = async () => {
      if (!read) { send(res, 405, "Method not allowed"); return; }
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const page = html.replace("</head>", `<meta name="hypit-studio-token" content="${auth.session.csrf}"><meta name="hypit-studio-production" content="true"></head>`);
        send(res, 200, req.method === "HEAD" ? "" : page, "text/html; charset=utf-8"); return;
      }
      // Only built assets are served. Never expose workspace files, /@fs, or source modules.
      const path = decodeURIComponent(url.pathname);
      if (!path.startsWith("/assets/") || path.includes("\\") || path.includes("\0")) { send(res, 404, "Not found"); return; }
      const file = await realpath(resolve(root, `.${path}`));
      const rel = relative(root, file);
      if (rel.startsWith("..") || isAbsolute(rel) || !(await stat(file)).isFile()) { send(res, 404, "Not found"); return; }
      const types: Record<string, string> = { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf" };
      const type = types[extname(file)];
      if (!type) { send(res, 404, "Not found"); return; }
      res.setHeader("content-type", type);
      res.end(req.method === "HEAD" ? undefined : await readFile(file));
    };
    next();
  };
  const server = createServer({ requestTimeout: 30_000, headersTimeout: 15_000, maxHeaderSize: 16 * 1024 }, (req, res) => {
    void handle(req, res).catch(() => { if (!res.headersSent) send(res, 400, "Request rejected"); else res.destroy(); });
  });
  server.keepAliveTimeout = 5000;
  const host: StudioHost = { httpServer: server, middlewares: { use(handler) { middleware.push(handler); } },
    ws: { send(message) {
      prune();
      const event = `event: ${message.event}\ndata: ${JSON.stringify(message.data ?? {})}\n\n`;
      for (const session of sessions.values()) for (const stream of session.streams) {
        // A large preview legitimately exceeds the stream high-water mark. Let it drain;
        // disconnect only clients that accumulate multiple megabytes of unsent events.
        if (stream.writableLength > 16 * 1024 * 1024) stream.destroy();
        else stream.write(event);
      }
    } },
  };
  for (const module of options.modules) module.install(host);
  let closing: Promise<void> | undefined;
  return { server, close(): Promise<void> {
    return closing ??= (async () => {
      for (const [id, session] of sessions) revoke(id, session);
      const stopped = new Promise<void>(resolveClose => server.close(() => resolveClose()));
      server.closeIdleConnections();
      const deadline = setTimeout(() => server.closeAllConnections(), 10_000);
      deadline.unref();
      try { await stopped; } finally { clearTimeout(deadline); }
      for (const module of options.modules) await module.closeBundle?.();
    })();
  } };
}
