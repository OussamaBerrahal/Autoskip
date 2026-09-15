import { adapters } from "../../src/adapters";
import { summarizeStats } from "../../src/storage/stats";
import { loadState } from "../../src/storage/state";
import { mutateState } from "../../src/storage/mutations";
import { validateImport } from "../../src/storage/validation";
import {
  isTemporarilyPaused,
  resolvePreferences,
} from "../../src/rules/engine";
import type { AutoSkipState, ServiceId } from "../../src/types";
import { preferenceFields, updateFields } from "./preferences";

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const enabledInput = $<HTMLInputElement>("#enabled");
const debugInput = $<HTMLInputElement>("#debug");
const localeSelect = $<HTMLSelectElement>("#locale");
const importFile = $<HTMLInputElement>("#import-file");
const statusEl = $("#status");
const search = $<HTMLInputElement>("#show-search");
const serviceFilter = $<HTMLSelectElement>("#show-service");
const appFields = new Map<ServiceId, ReturnType<typeof preferenceFields>>();
let currentState: AutoSkipState | null = null;
let refreshVersion = 0;

const views: Record<string, { title: string; description: string }> = {
  watching: {
    title: "Make yourself comfortable.",
    description: "Choose what gets skipped. We'll remember.",
  },
  shows: {
    title: "Some shows are different.",
    description: "Keep an intro you love. Give each show its own choices.",
  },
  backup: {
    title: "Everything in its place.",
    description: "Back up your choices, find an answer, or start fresh.",
  },
};
function switchView(view: string) {
  if (!views[view]) return;
  for (const section of document.querySelectorAll<HTMLElement>(
    "[data-section]",
  ))
    section.hidden = section.dataset.section !== view;
  for (const button of document.querySelectorAll<HTMLElement>("[data-view]")) {
    if (button.dataset.view === view)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  $("#page-title").textContent = views[view]!.title;
  $("#page-description").textContent = views[view]!.description;
  history.replaceState({}, "", `#${view}`);
}
for (const button of document.querySelectorAll<HTMLElement>("[data-view]"))
  button.addEventListener("click", () => switchView(button.dataset.view!));
switchView(location.hash.slice(1) || "watching");
$("#version").textContent =
  `Version ${chrome.runtime.getManifest().version_name ?? chrome.runtime.getManifest().version}`;

for (const adapter of adapters) {
  serviceFilter.add(new Option(adapter.displayName, adapter.id));
  const card = document.createElement("section");
  card.className = "app-card";
  const heading = document.createElement("div");
  heading.className = "app-heading";
  const badge = document.createElement("span");
  badge.className = "app-badge";
  badge.textContent = adapter.displayName[0]!;
  badge.setAttribute("aria-hidden", "true");
  const label = document.createElement("label");
  label.append(document.createTextNode(adapter.displayName));
  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.service = adapter.id;
  input.setAttribute("aria-label", `Use AutoSkip on ${adapter.displayName}`);
  input.addEventListener("change", () =>
    run(() =>
      mutateState({
        kind: "service",
        serviceId: adapter.id,
        enabled: input.checked,
      }),
    ),
  );
  label.append(input);
  heading.append(badge, label);
  card.append(heading);
  const details = document.createElement("details");
  details.className = "app-detail";
  const summary = document.createElement("summary");
  summary.id = `summary-${adapter.id}`;
  summary.textContent = "Choose what to skip";
  const fields = document.createElement("fieldset");
  fields.className = "preference-list";
  const legend = document.createElement("legend");
  legend.className = "sr-only";
  legend.textContent = `All ${adapter.displayName} shows`;
  fields.append(legend);
  appFields.set(
    adapter.id,
    preferenceFields(fields, adapter.id, (action, checked) =>
      run(() =>
        mutateState({
          kind: "rule",
          scope: "service",
          serviceId: adapter.id,
          seriesId: null,
          seriesTitle: null,
          patch: { [action]: checked },
        }),
      ),
    ),
  );
  details.append(summary, fields);
  card.append(details);
  $("#services").append(card);
}
function savedPreferences(
  state: AutoSkipState,
  serviceId: ServiceId,
  seriesId: string | null,
) {
  return resolvePreferences(
    {
      ...state,
      enabled: true,
      pausedUntil: 0,
      sessionRules: {},
      services: { ...state.services, [serviceId]: { enabled: true } },
    },
    serviceId,
    seriesId,
  );
}
function renderShows() {
  const state = currentState;
  if (!state) return;
  const container = $("#shows");
  const opened = new Set(
    Array.from(
      container.querySelectorAll<HTMLDetailsElement>("details[open]"),
    ).map((el) => el.dataset.key),
  );
  const focused =
    document.activeElement instanceof HTMLElement &&
    container.contains(document.activeElement)
      ? document.activeElement.id
      : null;
  const all = Object.entries(state.seriesRules);
  $("#show-count").textContent = String(all.length);
  const query = search.value.trim().toLocaleLowerCase();
  const results = all
    .filter(
      ([, rule]) =>
        (serviceFilter.value === "all" ||
          serviceFilter.value === rule.serviceId) &&
        (rule.seriesTitle ?? "Unnamed show")
          .toLocaleLowerCase()
          .includes(query),
    )
    .sort(([, a], [, b]) =>
      (a.seriesTitle ?? "").localeCompare(b.seriesTitle ?? ""),
    );
  container.replaceChildren();
  $("#shows-empty").hidden = results.length > 0;
  $("#shows-empty").textContent =
    all.length === 0
      ? "Your shows will appear here. While watching, open AutoSkip and choose ‘Only this show’ to give it its own settings."
      : "No shows match. Try another name or streaming app.";
  for (const [key, rule] of results) {
    const adapter = adapters.find((a) => a.id === rule.serviceId)!;
    const card = document.createElement("details");
    card.className = "show-card";
    card.dataset.key = key;
    card.open = opened.has(key);
    const summary = document.createElement("summary");
    summary.id = `show-${encodeURIComponent(key)}`;
    const meta = document.createElement("span");
    meta.className = "show-meta";
    const title = document.createElement("span");
    title.textContent = rule.seriesTitle ?? "Unnamed show";
    const app = document.createElement("small");
    app.textContent = adapter.displayName;
    meta.append(title, app);
    summary.append(meta);
    card.append(summary);
    const note = document.createElement("p");
    note.className = "show-note";
    note.textContent =
      "Changes here apply only to this show. Other choices follow your streaming app's settings.";
    card.append(note);
    const fields = document.createElement("fieldset");
    fields.className = "preference-list";
    const legend = document.createElement("legend");
    legend.className = "sr-only";
    legend.textContent = rule.seriesTitle ?? "Show choices";
    fields.append(legend);
    const inputs = preferenceFields(fields, summary.id, (action, checked) =>
      run(() =>
        mutateState({
          kind: "rule",
          scope: "series",
          serviceId: rule.serviceId,
          seriesId: rule.seriesId!,
          seriesTitle: rule.seriesTitle ?? null,
          patch: { [action]: checked },
        }),
      ),
    );
    updateFields(
      inputs,
      savedPreferences(state, rule.serviceId, rule.seriesId!),
    );
    card.append(fields);
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "text-button";
    reset.id = `${summary.id}-reset`;
    reset.textContent = `Use my ${adapter.displayName} settings`;
    reset.addEventListener("click", () =>
      run(
        async () => {
          await mutateState({
            kind: "clear-series",
            serviceId: rule.serviceId,
            seriesId: rule.seriesId!,
          });
          search.focus();
        },
        `${rule.seriesTitle ?? "This show"} now uses your ${adapter.displayName} settings.`,
      ),
    );
    card.append(reset);
    container.append(card);
  }
  if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
}
search.addEventListener("input", renderShows);
serviceFilter.addEventListener("change", renderShows);
async function refresh() {
  const version = ++refreshVersion;
  const state = await loadState();
  if (version !== refreshVersion) return;
  currentState = state;
  enabledInput.checked = state.enabled;
  debugInput.checked = state.debugLogging;
  localeSelect.value = state.locale;
  const paused = isTemporarilyPaused(state);
  $("#global-notice").hidden = state.enabled && !paused;
  $("#global-message").textContent = !state.enabled
    ? "AutoSkip is off. Your choices are saved for when you turn it on."
    : `AutoSkip is paused. It resumes in ${Math.max(1, Math.ceil((state.pausedUntil - Date.now()) / 60000))} min.`;
  $("#resume-global").hidden = !state.enabled || !paused;
  for (const adapter of adapters) {
    $<HTMLInputElement>(`[data-service="${adapter.id}"]`).checked =
      state.services[adapter.id].enabled;
    const preferences = savedPreferences(state, adapter.id, null);
    updateFields(appFields.get(adapter.id)!, preferences);
    const labels = {
      intro: "Intros",
      recap: "recaps",
      credits: "next episode",
      stillWatching: "keep watching",
    };
    $(`#summary-${adapter.id}`).textContent =
      Object.entries(preferences)
        .filter(([, enabled]) => enabled)
        .map(([key]) => labels[key as keyof typeof labels])
        .join(" · ") || "Choose what to skip";
  }
  $("#stats").textContent =
    `Since Chrome opened: ${summarizeStats(state.sessionStats)}\nAll time: ${summarizeStats(state.stats)}`;
  renderShows();
}
$("#resume-global").addEventListener("click", () =>
  run(() => mutateState({ kind: "settings", patch: { pausedUntil: 0 } })),
);
window.setInterval(() => {
  void refresh();
}, 30000);
function run(action: () => Promise<unknown>, success = "Saved.") {
  void action()
    .then(async (result) => {
      await refresh();
      statusEl.textContent = result === false ? "No changes made." : success;
    })
    .catch((error) => {
      statusEl.textContent = `Could not save: ${error instanceof Error ? error.message : "Please try again."}`;
    });
}
enabledInput.addEventListener("change", () =>
  run(() =>
    mutateState({
      kind: "settings",
      patch: { enabled: enabledInput.checked, pausedUntil: 0 },
    }),
  ),
);
debugInput.addEventListener("change", () =>
  run(() =>
    mutateState({
      kind: "settings",
      patch: { debugLogging: debugInput.checked },
    }),
  ),
);
localeSelect.addEventListener("change", () =>
  run(() =>
    mutateState({ kind: "settings", patch: { locale: localeSelect.value } }),
  ),
);
document
  .querySelector("#reset-session")!
  .addEventListener("click", () =>
    run(() => mutateState({ kind: "reset", target: "session" })),
  );
document.querySelector("#reset-lifetime")!.addEventListener("click", () => {
  if (confirm("Reset lifetime statistics? This cannot be undone."))
    run(() => mutateState({ kind: "reset", target: "lifetime" }));
});
document.querySelector("#reset-all")!.addEventListener("click", () => {
  if (
    confirm(
      "Delete all preferences, learning, and statistics? Save a backup first if you want to keep them.",
    )
  )
    run(
      () => mutateState({ kind: "reset", target: "all" }),
      "All local data reset.",
    );
});
document.querySelector("#export")!.addEventListener("click", () =>
  run(async () => {
    const blob = new Blob([JSON.stringify(await loadState(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "autoskip-preferences.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "Backup saved. It includes your show choices and counts."),
);
document
  .querySelector("#import")!
  .addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  const file = importFile.files?.[0];
  if (!file) return;
  run(async () => {
    if (file.size > 1_000_000)
      throw new Error("File is too large (maximum 1 MB).");
    const state = validateImport(JSON.parse(await file.text()));
    if (
      !confirm(
        "Replace your saved AutoSkip preferences and statistics with this file?",
      )
    )
      return false;
    await mutateState({ kind: "import", state });
  }, "Backup processed.");
  importFile.value = "";
});
chrome.storage.onChanged.addListener(() => {
  void refresh();
});
void refresh();
