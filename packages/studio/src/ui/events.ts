type Listener = (value: unknown) => void;
const listeners = new Map<string, Set<Listener>>();
let stream: EventSource | undefined;
export function stopStudioEvents(): void { stream?.close(); }
export function isPersonalStudio(): boolean {
  return document.querySelector('meta[name="hypit-studio-production"]') !== null;
}
export function onStudioEvent(event: string, listener: Listener): void {
  if (!isPersonalStudio()) {
    (import.meta as ImportMeta & { hot?: { on(event: string, listener: Listener): void } }).hot?.on(event, listener);
    return;
  }
  if (!stream) {
    stream = new EventSource("/__studio/events");
    stream.onerror = () => {
      void fetch("/__studio/settings/context", { cache: "no-store" }).then(response => {
        if (response.status === 401) { stream?.close(); window.location.replace("/login"); }
      }).catch(() => { /* EventSource retries transient network failures. */ });
    };
    // Re-read state on every connection, including after a dropped connection.
    stream.addEventListener("studio:connected", () => {
      void fetch("/__studio/session", { cache: "no-store" }).then(async response => {
        if (response.status === 401) { window.location.replace("/login"); return; }
        const name = response.ok ? "studio:snapshot" : "studio:error";
        const value: unknown = await response.json();
        for (const callback of listeners.get(name) ?? []) callback(value);
        for (const callback of listeners.get("studio:feedback-changed") ?? []) callback({});
      }).catch(() => { /* A subsequent connection retries. */ });
    });
    window.addEventListener("pagehide", () => stream?.close(), { once: true });
    window.addEventListener("pageshow", event => { if (event.persisted) window.location.reload(); });
  }
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
    stream.addEventListener(event, (message: MessageEvent<string>) => {
      const value: unknown = JSON.parse(message.data);
      for (const callback of listeners.get(event) ?? []) callback(value);
    });
  }
  listeners.get(event)!.add(listener);
}
