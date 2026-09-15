import { resolvePreferences } from "../../src/rules/engine";
import type { ContentContextResponse } from "../../src/messaging";
import { formatDuration, summarizeStats } from "../../src/storage/stats";
import { loadState, seriesKey, sessionKey } from "../../src/storage/state";
import { mutateState } from "../../src/storage/mutations";
import type { ActionType, ServiceId } from "../../src/types";

const enabledInput = document.querySelector<HTMLInputElement>("#enabled")!;
const serviceInput =
  document.querySelector<HTMLInputElement>("#service-enabled")!;
const resetSeries = document.querySelector<HTMLButtonElement>("#reset-series")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
let activeService: ServiceId | null = null;
let activeSeriesId: string | null = null;
let activeSeriesTitle: string | null = null;
let refreshVersion = 0;

async function refresh(): Promise<void> {
  const version = ++refreshVersion;
  const state = await loadState();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let context: ContentContextResponse | null = null;
  try {
    if (tab?.id)
      context = await chrome.tabs.sendMessage(tab.id, {
        type: "autoskip/get-context",
      });
  } catch {
    /* No content script on this tab. */
  }
  if (version !== refreshVersion) return;
  activeService = context?.serviceId ?? null;
  activeSeriesId = context?.seriesId ?? null;
  activeSeriesTitle = context?.seriesTitle ?? null;
  enabledInput.checked = state.enabled;
  document.querySelector("#enabled-label")!.textContent = state.enabled
    ? "ON"
    : "OFF";
  serviceInput.disabled = !activeService;
  serviceInput.checked = activeService
    ? state.services[activeService].enabled
    : false;
  document.querySelector("#service-name")!.textContent =
    context?.serviceName ?? "No player connected";
  document.querySelector("#series-name")!.textContent =
    activeSeriesTitle ?? "Not identified";
  document.querySelector("#context-hint")!.textContent = !activeService
    ? "Open a supported streaming player. After installing or updating, reload its tab."
    : !activeSeriesId
      ? "Series not identified. Only service defaults are available."
      : "Series settings inherit service defaults until you change them.";
  const series =
    activeService && activeSeriesId
      ? state.seriesRules[seriesKey(activeService, activeSeriesId)]
      : undefined;
  resetSeries.disabled = !series;
  const effective = activeService
    ? resolvePreferences(
        {
          ...state,
          enabled: true,
          services: { ...state.services, [activeService]: { enabled: true } },
          sessionRules: {},
        },
        activeService,
        activeSeriesId,
      )
    : null;
  for (const input of document.querySelectorAll<HTMLInputElement>(
    "input[data-scope][data-action]",
  )) {
    const action = input.dataset.action as ActionType,
      scope = input.dataset.scope;
    input.disabled = !activeService || (scope === "series" && !activeSeriesId);
    input.checked =
      scope === "series"
        ? (effective?.[action] ?? false)
        : activeService
          ? (state.serviceRules[activeService]?.preferences[action] ?? false)
          : false;
  }
  const session = activeService
    ? state.sessionRules[sessionKey(activeService, activeSeriesId)]
    : undefined;
  document.querySelector<HTMLButtonElement>("#resume-session")!.hidden =
    !session;
  document.querySelector("#pause-hint")!.textContent = session
    ? "Some actions are paused for this session (up to 4 hours or until Chrome restarts)."
    : "";
  for (const [prefix, stats] of [
    ["session", state.sessionStats],
    ["lifetime", state.stats],
  ] as const) {
    document.querySelector(`#${prefix}-stats-line`)!.textContent =
      summarizeStats(stats);
    document.querySelector(`#${prefix}-stats-saved`)!.textContent =
      `~${formatDuration(stats.estimatedMsSaved)} saved (estimated)`;
  }
}
function run(action: () => Promise<unknown>) {
  statusEl.textContent = "";
  void action()
    .then(refresh)
    .catch(() => {
      statusEl.textContent =
        "Could not save. Reload the extension and try again.";
    });
}
enabledInput.addEventListener("change", () =>
  run(() =>
    mutateState({ kind: "settings", patch: { enabled: enabledInput.checked } }),
  ),
);
serviceInput.addEventListener("change", () => {
  const serviceId = activeService;
  if (serviceId)
    run(() =>
      mutateState({
        kind: "service",
        serviceId,
        enabled: serviceInput.checked,
      }),
    );
});
document.querySelector("#resume-session")!.addEventListener("click", () => {
  const serviceId = activeService,
    seriesId = activeSeriesId;
  if (serviceId)
    run(() => mutateState({ kind: "clear-session", serviceId, seriesId }));
});
resetSeries.addEventListener("click", () => {
  const serviceId = activeService,
    seriesId = activeSeriesId;
  if (serviceId && seriesId)
    run(() => mutateState({ kind: "clear-series", serviceId, seriesId }));
});
for (const input of document.querySelectorAll<HTMLInputElement>(
  "input[data-scope][data-action]",
)) {
  input.addEventListener("change", () => {
    const serviceId = activeService,
      seriesId = activeSeriesId,
      seriesTitle = activeSeriesTitle;
    const scope = input.dataset.scope as "service" | "series";
    if (!serviceId || (scope === "series" && !seriesId)) return;
    run(() =>
      mutateState({
        kind: "rule",
        scope,
        serviceId,
        seriesId,
        seriesTitle,
        patch: { [input.dataset.action as ActionType]: input.checked },
      }),
    );
  });
}
document.querySelector("#options-link")!.addEventListener("click", (event) => {
  event.preventDefault();
  void chrome.runtime.openOptionsPage();
});
chrome.storage.onChanged.addListener(() => {
  void refresh();
});
void refresh();
