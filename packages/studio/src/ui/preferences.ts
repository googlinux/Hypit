const motionKey = "hypit-studio.motion";
export function motionPreference(): string {
  try { return localStorage.getItem(motionKey) === "reduce" ? "reduce" : "system"; }
  catch { return "system"; }
}
export function applyPreferences(): void {
  document.documentElement.dataset.motion = motionPreference();
}
export function setMotionPreference(value: string): void {
  try { localStorage.setItem(motionKey, value); } catch { /* Apply for this tab when storage is disabled. */ }
  document.documentElement.dataset.motion = value;
}
export function resetStudioLayout(): void {
  for (const key of ["hypit-studio.v3.source-width", "hypit-studio.v3.workspace-width",
    "hypit-studio.comments-width", "hypit-studio.v3.timeline-height", "hypit-studio.v4.timeline-label-width"]) {
    try { localStorage.removeItem(key); } catch { /* Browser storage may be disabled. */ }
  }
}
