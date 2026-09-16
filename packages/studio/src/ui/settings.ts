import { isPersonalStudio, stopStudioEvents } from "./events.js";
import type { StudioCredential, StudioEndpoint, StudioSettings } from "../settings.js";
import { icon } from "./icons.js";
import { languageSelect, t, uiLabel, uiText, uiAttr, uiAttribute, type Message } from "./i18n.js";
import { studioJsonHeaders } from "./request.js";
import { motionPreference, resetStudioLayout, setMotionPreference } from "./preferences.js";
import "../settings.css";
import { renderGuide } from "./guide.js";

type Section = "guide" | "general" | "api-keys" | "runtime";
const titles: Record<Section, Message> = { guide: "guide.title", general: "settings.general", "api-keys": "settings.keys", runtime: "settings.runtime" };

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag); element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function label<K extends keyof HTMLElementTagNameMap>(tag: K, message: Message, className = ""): HTMLElementTagNameMap[K] {
  const element = node(tag, className); uiText(element, message); return element;
}
function button(message: Message, className = ""): HTMLButtonElement {
  const element = label("button", message, `settings-button ${className}`); element.type = "button"; return element;
}

/** Native dialog supplies focus containment, Escape, and a deliberate destructive action. */
async function confirmChange(message: Message, action: Message, endpoint: string): Promise<boolean> {
  const dialog = node("dialog", "settings-dialog");
  const heading = label("h2", action); heading.id = "credential-confirm-title";
  dialog.setAttribute("aria-labelledby", heading.id);
  const description = label("p", message); description.id = "credential-confirm-description";
  dialog.setAttribute("aria-describedby", description.id);
  const actions = node("div", "settings-actions");
  const cancel = button("settings.cancel"), confirm = button(action, "danger");
  actions.append(cancel, confirm); dialog.append(heading, node("code", "settings-mono", endpoint), description, actions);
  document.body.append(dialog);
  return await new Promise(resolve => {
    const finish = (accepted: boolean) => { dialog.close(); dialog.remove(); resolve(accepted); };
    cancel.addEventListener("click", () => finish(false));
    confirm.addEventListener("click", () => finish(true));
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
    dialog.showModal(); cancel.focus();
  });
}

export function createSettings(hasRun: boolean): { element: HTMLElement; activate(active: boolean): Promise<void> } {
  const element = node("section", "settings-shell"); element.hidden = true;
  element.innerHTML = `<aside class="settings-sidebar"><h1>${uiLabel("settings.title")}</h1>
    <nav ${uiAttribute("aria-label", "settings.title")}>
      <a href="#settings/guide" data-section="guide">${icon("guide")}${uiLabel("guide.nav")}</a>
      <a href="#settings/general" data-section="general">${icon("tune")}${uiLabel("settings.general")}</a>
      <a href="#settings/api-keys" data-section="api-keys">${icon("key")}${uiLabel("settings.keys")}</a>
      <a href="#settings/runtime" data-section="runtime">${icon("terminal")}${uiLabel("settings.runtime")}</a>
    </nav>
    ${hasRun ? `<a class="settings-back" href="#studio">${icon("arrowLeft")}${uiLabel("settings.back")}</a>` : ""}
  </aside><main class="settings-content" tabindex="-1"></main>`;
  const content = element.querySelector<HTMLElement>(".settings-content")!;
  let generation = 0;
  let busy = false;

  function heading(section: Section): void {
    const title = node("div", "settings-page-title");
    title.append(label("h2", titles[section], "settings-heading"));
    content.replaceChildren(title,
      label("p", section === "guide" ? "guide.description" : section === "general" ? "settings.general-description" : section === "runtime"
        ? "settings.runtime-description" : "settings.keys-description", "settings-description"));
  }
  function general(): void {
    const rows = node("div", "settings-rows");
    function row(title: Message, description: Message, control: HTMLElement): void {
      const item = node("div", "settings-row");
      const copy = node("div"); copy.append(label("h3", title), label("p", description));
      item.append(copy, control); rows.append(item);
    }
    row("app.language", "settings.language-description", languageSelect());
    const motion = node("select", "settings-select"); uiAttr(motion, "aria-label", "settings.motion");
    for (const [value, message] of [["system", "settings.motion-system"], ["reduce", "settings.motion-reduce"]] as const) {
      const option = label("option", message); option.value = value; motion.append(option);
    }
    motion.value = motionPreference();
    motion.addEventListener("change", () => setMotionPreference(motion.value));
    row("settings.motion", "settings.motion-description", motion);
    const reset = button("settings.reset");
    reset.addEventListener("click", async () => {
      if (!await confirmChange("settings.reset-confirm", "settings.reset", "")) return;
      resetStudioLayout(); window.location.reload();
    });
    row("settings.layout", "settings.layout-description", reset);
    content.append(rows, label("p", "settings.preferences-note", "settings-footnote"));
    if (isPersonalStudio()) {
      const logout = node("button", "settings-button", "退出登录 / Sign out");
      logout.addEventListener("click", async () => {
        if (!window.confirm("确认已保存修改并退出登录？ / Save your changes before signing out.")) return;
        logout.disabled = true;
        stopStudioEvents();
        try {
          const response = await fetch("/__studio/auth/logout", { method: "POST", headers: studioJsonHeaders(), body: "{}" });
          if (!response.ok && response.status !== 401) throw new Error();
          window.location.replace("/login");
        } catch {
          window.alert("退出失败，请重试。 / Sign out failed. Please retry.");
          window.location.reload();
        }
      });
      content.append(logout);
    }
  }
  function notice(message: Message): void {
    const empty = node("div", "settings-empty");
    empty.append(label("h3", message));
    if (message === "settings.no-runtime") {
      empty.append(label("p", "settings.no-runtime-help"), node("code", "settings-mono", "hypit runtime init"),
        label("p", "settings.no-runtime-restart"));
    }
    content.append(empty);
  }
  function runtime(data: StudioSettings): void {
    const list = node("dl", "settings-facts");
    for (const [message, value] of [["settings.project", data.project], ["settings.profile", data.profile ?? t("settings.no-runtime")],
      ["settings.platform", `${data.platform} · Node.js ${data.node}`]] as const) {
      list.append(label("dt", message), node("dd", "settings-mono", value));
    }
    content.append(list, label("h3", "settings.providers", "settings-subheading"));
    if (!data.profile) notice("settings.no-runtime");
    for (const endpoint of data.endpoints) {
      const row = node("div", "settings-provider-row");
      const info = node("div"); info.append(node("h4", "", endpoint.id), node("code", "settings-mono", endpoint.provider));
      row.append(info, endpoint.origin ? node("code", "settings-mono", endpoint.origin) : label("span", "settings.no-url"));
      content.append(row);
    }
    content.append(label("p", "settings.runtime-note", "settings-footnote"));
  }

  function credentialForm(endpoint: StudioEndpoint, initial: StudioCredential, index: number, current: number): HTMLElement {
    let item = initial;
    const panel = node("article", "settings-credential");
    const header = node("div", "settings-credential-header");
    const title = node("h3", "", endpoint.provider === "@hypit/provider-hypihub" ? "HypiHub" : endpoint.id);
    const status = node("span", "settings-badge");
    const updateStatus = () => { uiText(status, item.configured ? "settings.configured" : "settings.missing"); status.dataset.configured = String(item.configured); };
    updateStatus(); header.append(title, status);
    panel.append(header, node("code", "settings-mono settings-endpoint", endpoint.id));
    if (endpoint.origin) panel.append(node("code", "settings-mono settings-endpoint", endpoint.origin));
    const form = node("form", "settings-key-form"); form.autocomplete = "off";
    const fieldLabel = label("label", "settings.keys"); fieldLabel.htmlFor = `studio-key-${index}`;
    if (item.slot !== "apiKey") fieldLabel.append(document.createTextNode(` · ${item.label}`));
    const field = node("div", "settings-secret-field");
    const input = node("input"); input.type = "password"; input.id = fieldLabel.htmlFor;
    input.autocomplete = "new-password"; input.spellcheck = false; input.autocapitalize = "off";
    input.maxLength = 16384; input.required = true; input.disabled = !item.writable;
    uiAttr(input, "placeholder", "settings.key-placeholder");
    const show = button("settings.show"); show.disabled = !item.writable; show.setAttribute("aria-pressed", "false");
    show.addEventListener("click", () => {
      const visible = input.type === "password"; input.type = visible ? "text" : "password";
      uiText(show, visible ? "settings.hide" : "settings.show"); show.setAttribute("aria-pressed", String(visible));
    });
    field.append(input, show);
    const help = label("p", item.writable ? (item.storage === "os" ? "settings.key-help" : "settings.store-help") : "settings.read-only", "settings-help");
    help.id = `${input.id}-help`; input.setAttribute("aria-describedby", help.id);
    const actions = node("div", "settings-actions");
    const remove = button("settings.delete", "quiet-danger"); remove.hidden = !item.configured || !item.writable;
    const save = button("settings.save-key", "primary"); save.type = "submit"; save.disabled = true;
    input.addEventListener("input", () => { save.disabled = busy || !item.writable || input.value.trim().length === 0; });
    actions.append(remove, save);
    const feedback = node("p", "settings-feedback"); feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite");
    const mutate = async (method: "PUT" | "DELETE") => {
      if (busy) return;
      if (method === "DELETE" && !await confirmChange("settings.delete-confirm", "settings.delete", endpoint.id)) return;
      if (method === "PUT" && item.configured && !await confirmChange("settings.replace-confirm", "settings.replace", endpoint.id)) return;
      if (generation !== current || busy) return;
      busy = true;
      const payload = { endpoint: endpoint.id, slot: item.slot,
        ...(method === "PUT" ? { secret: input.value } : { confirm: true }) };
      input.value = ""; input.type = "password"; show.setAttribute("aria-pressed", "false"); uiText(show, "settings.show");
      input.disabled = true; save.disabled = true; remove.disabled = true; show.disabled = true;
      uiText(feedback, "settings.saving"); feedback.dataset.error = "false";
      try {
        const request = fetch("/__studio/settings/credential", {
          method, headers: studioJsonHeaders(), body: JSON.stringify(payload), cache: "no-store",
        });
        // Do not retain a second copy of the submitted secret across await points.
        if ("secret" in payload) payload.secret = "";
        const response = await request;
        if (!response.ok) throw new Error();
        const result = await response.json() as { credential: StudioCredential };
        if (generation !== current) return;
        item = result.credential; updateStatus(); remove.hidden = !item.configured || !item.writable;
        uiText(feedback, method === "PUT" ? "settings.saved" : "settings.deleted");
      } catch {
        if (generation !== current) return;
        feedback.dataset.error = "true"; uiText(feedback, "settings.write-error");
      } finally {
        if ("secret" in payload) payload.secret = "";
        busy = false; input.disabled = !item.writable; show.disabled = !item.writable; remove.disabled = false;
      }
    };
    form.addEventListener("submit", event => { event.preventDefault(); if (input.value.trim()) void mutate("PUT"); });
    remove.addEventListener("click", () => { void mutate("DELETE"); });
    form.append(fieldLabel, field, help, actions, feedback); panel.append(form);
    return panel;
  }

  async function activate(active: boolean): Promise<void> {
    element.hidden = !active;
    const current = ++generation;
    // Never leave a typed secret in a hidden editor or a previous route.
    content.querySelectorAll("input").forEach(input => { input.value = ""; });
    if (!active) { content.replaceChildren(); return; }
    const section: Section = window.location.hash === "#settings/guide" ? "guide" : window.location.hash === "#settings/general" ? "general"
      : window.location.hash === "#settings/runtime" ? "runtime" : "api-keys";
    element.querySelectorAll<HTMLAnchorElement>("[data-section]").forEach(link => {
      if (link.dataset.section === section) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    heading(section);
    if (section === "general") { general(); return; }
    const loading = label("p", "settings.loading", "settings-description"); loading.setAttribute("role", "status"); content.append(loading);
    try {
      const response = await fetch(section === "guide" ? "/__studio/settings/context" : "/__studio/settings", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json() as StudioSettings;
      if (generation !== current) return;
      loading.remove();
      if (section === "guide") { renderGuide(content, data); return; }
      if (section === "runtime") runtime(data);
      else {
        if (!data.profile) notice("settings.no-runtime");
        let count = 0;
        for (const endpoint of data.endpoints) {
          if (endpoint.unavailable) {
            const error = node("div", "settings-empty");
            error.append(node("h3", "", endpoint.id), label("p", "settings.credential-error")); content.append(error);
          }
          for (const item of endpoint.credentials) content.append(credentialForm(endpoint, item, count++, current));
        }
        if (data.profile && count === 0 && !data.endpoints.some(endpoint => endpoint.unavailable)) notice("settings.no-credentials");
        const guide = node("section", "settings-guide");
        guide.append(label("h3", "settings.guide"));
        const steps = node("ol"); steps.append(label("li", "settings.step-one"), label("li", "settings.step-two")); guide.append(steps);
        content.append(guide, label("p", "settings.keys-note", "settings-footnote"));
      }
      const refresh = button("settings.refresh", "settings-refresh");
      refresh.addEventListener("click", () => { if (!busy) void activate(true); }); content.querySelector(".settings-page-title")!.append(refresh);
    } catch {
      if (generation !== current) return;
      loading.remove(); notice("settings.load-error");
      const retry = button("settings.retry"); retry.addEventListener("click", () => { void activate(true); }); content.append(retry);
    }
  }
  return { element, activate };
}
