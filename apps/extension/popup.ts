import { savedPreferences, isTemporarilyPaused } from "../../src/rules/engine";
import type { ContentContextResponse } from "../../src/messaging";
import { loadState, seriesKey, sessionKey } from "../../src/storage/state";
import {
  ExtensionReloadRequired,
  mutateState,
} from "../../src/storage/mutations";
import type { ActionType, ServiceId } from "../../src/types";
import { showManager } from "./shows";

const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const enabledInput = $<HTMLInputElement>("#enabled");
const scopeSelect = $<HTMLSelectElement>("#scope");
const resetSeries = $<HTMLButtonElement>("#reset-series");
const statusEl = $("#status");
let activeService: ServiceId | null = null;
let activeSeriesId: string | null = null;
let activeSeriesTitle: string | null = null;
let scope: "series" | "service" = "service";
let lastContext = "";
let refreshVersion = 0;
const shows = showManager(document, run);

for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-view]",
)) {
  button.addEventListener("click", () => {
    for (const section of document.querySelectorAll<HTMLElement>(
      "[data-section]",
    ))
      section.hidden = section.dataset.section !== button.dataset.view;
    for (const item of document.querySelectorAll<HTMLElement>("[data-view]")) {
      if (item === button) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    }
    statusEl.textContent = "";
  });
}

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
  shows.render(state);
  activeService = context?.serviceId ?? null;
  activeSeriesId = context?.seriesId ?? null;
  activeSeriesTitle = context?.seriesTitle ?? null;
  const name = context?.serviceName ?? "";
  const paused = isTemporarilyPaused(state);
  const minutes = Math.max(
    1,
    Math.ceil((state.pausedUntil - Date.now()) / 60000),
  );
  $("#snooze").textContent = paused ? "Resume AutoSkip" : "Pause for 30 min";
  $("#snooze").hidden = !state.enabled;
  $("#global-pause").hidden = !paused || !state.enabled;
  $("#global-pause").textContent = `Paused · resumes in ${minutes} min`;
  enabledInput.checked = state.enabled;
  $("#enabled-label").textContent = state.enabled
    ? paused
      ? "Paused"
      : "On"
    : "Off";
  $("#empty").hidden = Boolean(activeService);
  $("#player-settings").hidden = !activeService;
  if (!activeService) {
    lastContext = "";
    return;
  }
  $("#service-name").textContent = name;
  $("#series-name").textContent = activeSeriesTitle ?? `Watching on ${name}`;
  const series = activeSeriesId
    ? state.seriesRules[seriesKey(activeService, activeSeriesId)]
    : undefined;
  const nextContext = `${activeService}::${activeSeriesId}`;
  if (lastContext !== nextContext) scope = series ? "series" : "service";
  lastContext = nextContext;
  if (!activeSeriesId) scope = "service";
  scopeSelect.replaceChildren(new Option(`All ${name} shows`, "service"));
  if (activeSeriesId)
    scopeSelect.add(
      new Option(`Only ${activeSeriesTitle ?? "this show"}`, "series"),
    );
  scopeSelect.value = scope;
  const serviceEnabled = state.services[activeService].enabled;
  $("#disabled-notice").hidden = state.enabled && serviceEnabled;
  $("#disabled-message").textContent = !state.enabled
    ? "AutoSkip is off. Turn it on above to use your choices."
    : `AutoSkip is off for ${name}.`;
  $("#service-enabled").hidden = !state.enabled || serviceEnabled;
  $("#service-enabled").textContent = `Turn on for ${name}`;
  const effective = savedPreferences(
    state,
    activeService,
    scope === "series" ? activeSeriesId : null,
  );
  $<HTMLFieldSetElement>("#choices").disabled =
    !state.enabled || !serviceEnabled;
  for (const input of document.querySelectorAll<HTMLInputElement>(
    "#choices input[data-action]",
  )) {
    input.checked = effective[input.dataset.action as ActionType];
  }
  resetSeries.hidden = !series || scope !== "series";
  resetSeries.textContent = `Use my ${name} settings`;
  $("#scope-hint").textContent =
    series && scope === "service"
      ? `${activeSeriesTitle ?? "This show"} has its own choices. Select it above to change them.`
      : "";
  const session = state.sessionRules[sessionKey(activeService, activeSeriesId)];
  const pausedActions = Object.entries(session?.preferences ?? {})
    .filter(([, value]) => value === false)
    .map(
      ([action]) =>
        ({
          intro: "Intro skipping",
          recap: "Recap skipping",
          credits: "Next episode",
          stillWatching: "Keep watching",
        })[action],
    );
  $("#pause-notice").hidden = pausedActions.length === 0;
  $("#pause-hint").textContent =
    `${pausedActions.join(", ")} ${pausedActions.length === 1 ? "is" : "are"} paused for now.`;
}
function run(action: () => Promise<unknown>, success = "") {
  statusEl.textContent = "";
  statusEl.classList.remove("error");
  void action()
    .then(async () => {
      await refresh();
      statusEl.textContent = success;
    })
    .catch((error) => {
      statusEl.classList.add("error");
      statusEl.textContent =
        error instanceof ExtensionReloadRequired
          ? error.message
          : "Couldn't save that change. Please try again.";
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
scopeSelect.addEventListener("change", () => {
  const previousScope = scope;
  scope = scopeSelect.value as typeof scope;
  const serviceId = activeService,
    seriesId = activeSeriesId,
    seriesTitle = activeSeriesTitle;
  if (scope === "series" && serviceId && seriesId) {
    run(async () => {
      try {
        return await mutateState({
          kind: "save-series",
          serviceId,
          seriesId,
          seriesTitle,
        });
      } catch (error) {
        scope = previousScope;
        scopeSelect.value = scope;
        throw error;
      }
    });
  } else void refresh();
});
$("#service-enabled").addEventListener("click", () => {
  if (activeService) {
    const serviceId = activeService;
    run(() => mutateState({ kind: "service", serviceId, enabled: true }));
  }
});
$("#resume-session").addEventListener("click", () => {
  const serviceId = activeService,
    seriesId = activeSeriesId;
  if (serviceId)
    run(() => mutateState({ kind: "clear-session", serviceId, seriesId }));
});
resetSeries.addEventListener("click", () => {
  const serviceId = activeService,
    seriesId = activeSeriesId;
  if (serviceId && seriesId) {
    scope = "service";
    run(() => mutateState({ kind: "clear-series", serviceId, seriesId }));
  }
});
for (const input of document.querySelectorAll<HTMLInputElement>(
  "#choices input[data-action]",
)) {
  input.addEventListener("change", () => {
    const serviceId = activeService,
      seriesId = activeSeriesId,
      seriesTitle = activeSeriesTitle,
      selectedScope = scope;
    if (!serviceId || (selectedScope === "series" && !seriesId)) return;
    const checked = input.checked;
    run(() =>
      mutateState({
        kind: "rule",
        scope: selectedScope,
        serviceId,
        seriesId,
        seriesTitle,
        patch: { [input.dataset.action as ActionType]: checked },
      }),
    );
  });
}
$("#options-link").addEventListener("click", (event) => {
  event.preventDefault();
  void chrome.runtime.openOptionsPage();
});
$("#snooze").addEventListener("click", () =>
  run(async () => {
    const state = await loadState();
    await mutateState({
      kind: "settings",
      patch: {
        pausedUntil: isTemporarilyPaused(state) ? 0 : Date.now() + 30 * 60000,
      },
    });
  }),
);
window.setInterval(() => {
  void refresh();
}, 30000);
chrome.storage.onChanged.addListener(() => {
  void refresh();
});
void refresh();
