import { studioTokenHeader, studioTokenMeta } from "../request-policy.js";

/** Only the same-origin Studio document receives the per-server write capability. */
export function studioJsonHeaders(): Record<string, string> {
  const token = document.querySelector<HTMLMetaElement>(`meta[name="${studioTokenMeta}"]`)?.content;
  if (!token) throw new Error("Studio session is unavailable; reload the page");
  return { "content-type": "application/json", [studioTokenHeader]: token };
}
