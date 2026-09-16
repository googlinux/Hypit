import type { StudioSettingsContext } from "../settings.js";
import { languageSelect, uiText, type Message } from "./i18n.js";

function text<K extends keyof HTMLElementTagNameMap>(tag: K, message: Message, className = ""): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag); el.className = className; uiText(el, message); return el;
}
function action(message: Message, callback: () => void, primary = false): HTMLButtonElement {
  const button = text("button", message, `settings-button${primary ? " primary" : ""}`);
  button.type = "button"; button.addEventListener("click", callback); return button;
}
function link(message: Message, href: string): HTMLAnchorElement {
  const anchor = text("a", message, "settings-button"); anchor.href = href; return anchor;
}
function command(value: string): HTMLElement {
  const row = document.createElement("div"); row.className = "guide-command";
  const code = document.createElement("code"); code.textContent = value; code.tabIndex = 0;
  const copy = action("guide.copy", () => {
    void (async () => {
      try { await navigator.clipboard.writeText(value); uiText(status, "guide.copied"); }
      catch { uiText(status, "guide.copy-error"); }
    })();
  });
  const status = document.createElement("span"); status.className = "guide-copy-status"; status.setAttribute("role", "status");
  row.append(code, copy, status); return row;
}

export function renderGuide(content: HTMLElement, context: StudioSettingsContext): void {
  const intro = document.createElement("section"); intro.className = "guide-intro";
  const copy = document.createElement("div");
  copy.append(text("h3", "guide.example-title"), text("p", "guide.example-description"));
  const metadata = text("p", "guide.example-meta", "guide-metadata");
  const actions = document.createElement("div"); actions.className = "guide-actions";
  if (context.hasRun) {
    actions.append(action(context.example ? "guide.start-tour" : "guide.tour-current", () => {
      window.location.hash = "studio"; document.dispatchEvent(new Event("studio:start-tour"));
    }, true));
    actions.append(link(context.example ? "guide.open-example" : "settings.back", "#studio"));
  }
  copy.append(metadata, actions);
  if (!context.example) copy.append(text("p", "guide.separate-example"));
  const artwork = document.createElement("div"); artwork.className = "guide-example-preview"; artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = '<span>Hello, Hypit.</span><div class="guide-mini-timeline"><i></i><i></i><i></i></div>';
  intro.append(copy, artwork); content.append(intro);
  const language = document.createElement("div"); language.className = "guide-language";
  language.append(text("span", "app.language"), languageSelect()); content.append(language);

  const steps = document.createElement("ol"); steps.className = "guide-lessons";
  for (const [title, description] of [
    ["guide.lesson-play", "guide.lesson-play-description"],
    ["guide.lesson-edit", "guide.lesson-edit-description"],
    ["guide.lesson-save", context.example ? "guide.lesson-save-description" : "guide.lesson-save-own"],
  ] as const) {
    const item = document.createElement("li"); item.append(text("h3", title), text("p", description)); steps.append(item);
  }
  content.append(steps);
  const files = document.createElement("details"); files.className = "guide-details";
  files.append(text("summary", "guide.files-title"), text("p", "guide.files-description"));
  if (context.example) {
    files.append(text("p", "guide.copy-location"), command(context.example.directory));
    const cliPath = "'" + `${context.example.directory}/preview.svrun`.replaceAll("'", "'\\''") + "'";
    // Display only; the browser never executes this command. Quoting is documented for paths with spaces.
    files.append(text("p", "guide.reopen"), command(`node bin/hypit.mjs studio --run ${cliPath}`));
  } else files.append(text("p", "guide.separate-example"));
  files.append(text("p", "guide.new-example"), command("node bin/hypit.mjs studio --example first-film"));
  content.append(files);

  const next = document.createElement("section"); next.className = "guide-next";
  next.append(text("h3", "guide.next-title"), text("p", "guide.next-description"),
    command("node bin/hypit.mjs runtime init"), text("p", "guide.runtime-restart"), link("guide.configure-key", "#settings/api-keys"));
  content.append(next);
  const faq = document.createElement("details"); faq.className = "guide-details";
  faq.append(text("summary", "guide.faq-title"));
  for (const [title, description] of [["guide.faq-export", "guide.faq-export-answer"],
    ["guide.faq-cost", "guide.faq-cost-answer"], ["guide.faq-existing", "guide.faq-existing-answer"]] as const) {
    faq.append(text("h4", title), text("p", description));
  }
  content.append(faq);
  const note = text("p", "guide.footer", "settings-footnote"); content.append(note);
}

const tourSteps = [
  { target: "[data-stage]", title: "guide.tour-preview", description: "guide.tour-preview-description" },
  { target: "[data-timeline]", title: "guide.tour-timeline", description: "guide.tour-timeline-description" },
  { target: ".workspace-panel", title: "guide.tour-properties", description: "guide.tour-properties-description" },
  { target: "[data-library]", title: "guide.tour-source", description: "guide.tour-source-description" },
] as const;

/** A non-modal coach lets the user operate the real editor while reading each step. */
export function createEditorTour(): { start(): void; stop(): void } {
  let step = 0;
  let panel: HTMLElement | undefined;
  let highlighted: Element | null = null;
  let previousFocus: HTMLElement | null = null;
  const stop = (): void => {
    panel?.remove(); panel = undefined; highlighted?.classList.remove("guide-highlight"); highlighted = null;
    document.removeEventListener("keydown", escape);
    if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
  };
  const escape = (event: KeyboardEvent): void => { if (event.key === "Escape") { event.preventDefault(); stop(); } };
  const render = (): void => {
    panel?.remove(); highlighted?.classList.remove("guide-highlight");
    const item = tourSteps[step]!;
    document.dispatchEvent(new CustomEvent("studio:tour-panel", { detail: step === 3 ? "source" : step === 2 ? "properties" : "preview" }));
    highlighted = document.querySelector(item.target); highlighted?.classList.add("guide-highlight");
    panel = document.createElement("aside"); panel.className = "guide-coach"; panel.setAttribute("aria-labelledby", "guide-coach-heading");
    if (step === 3) panel.classList.add("guide-coach-source");
    if (step === 1) panel.classList.add("guide-coach-timeline");
    const heading = text("h2", item.title); heading.id = "guide-coach-heading"; heading.tabIndex = -1;
    const count = document.createElement("span"); count.className = "guide-count"; uiText(count, "guide.progress", { current: step + 1, total: tourSteps.length });
    const controls = document.createElement("div"); controls.className = "guide-actions";
    const dismiss = action("guide.dismiss", stop);
    const back = action("guide.previous", () => { step--; render(); }); back.disabled = step === 0;
    const next = action(step === tourSteps.length - 1 ? "guide.finish" : "guide.next", () => {
      if (step < tourSteps.length - 1) { step++; render(); }
      else { stop(); window.location.hash = "settings/guide"; }
    }, true);
    controls.append(dismiss, back, next);
    panel.append(count, heading, text("p", item.description), controls);
    document.body.append(panel); heading.focus();
  };
  return { stop, start() {
    stop(); previousFocus = document.activeElement as HTMLElement | null; step = 0;
    document.addEventListener("keydown", escape); render();
  } };
}
