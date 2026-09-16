import { initializeI18n, t } from "./i18n.js";
import { applyPreferences } from "./preferences.js";
import type { StudioSettingsContext } from "../settings.js";
import "../style.css";
import "../settings.css";

try {
  await initializeI18n();
  applyPreferences();
  const response = await fetch("/__studio/settings/context", { cache: "no-store" });
  if (response.status === 401) { window.location.replace("/login"); throw new Error(); }
  if (!response.ok) throw new Error();
  const context = await response.json() as StudioSettingsContext;
  if (!window.location.hash && context.example) window.history.replaceState(null, "", "#settings/guide");
  if (context.hasRun) await import("./main.js");
  else {
    const { createSettings } = await import("./settings.js");
    const app = document.querySelector<HTMLElement>("#app")!;
    app.innerHTML = '<header class="settings-topbar"><strong>Hypit <span>Studio</span></strong><span data-project></span></header>';
    app.querySelector("[data-project]")!.textContent = context.project.split(/[\\/]/u).at(-1) ?? "";
    const settings = createSettings(false);
    app.append(settings.element);
    const show = () => { void settings.activate(true); };
    window.addEventListener("hashchange", show);
    show();
  }
} catch {
  const app = document.querySelector<HTMLElement>("#app")!;
  app.classList.add("settings-start-error");
  const title = document.createElement("h1"); title.textContent = "Hypit Studio";
  const message = document.createElement("p"); message.textContent = t("settings.load-error");
  const retry = document.createElement("button"); retry.textContent = t("settings.retry");
  retry.addEventListener("click", () => window.location.reload());
  app.replaceChildren(title, message, retry);
}
