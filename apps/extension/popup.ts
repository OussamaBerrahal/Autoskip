import {
  getSeriesRule,
  getServiceRule,
  setServiceEnabled,
  upsertRule,
} from "../../src/rules/engine";
import type { ContentContextResponse } from "../../src/messaging";
import { formatDuration, summarizeStats } from "../../src/storage/stats";
import { loadState, updateState } from "../../src/storage/state";
import type { ActionPreferences, ActionType, ServiceId } from "../../src/types";
import { ACTION_TYPES, DEFAULT_PREFERENCES } from "../../src/types";

const enabledInput = document.getElementById("enabled") as HTMLInputElement;
const enabledLabel = document.getElementById("enabled-label")!;
const serviceEnabledInput = document.getElementById("service-enabled") as HTMLInputElement;
const serviceNameEl = document.getElementById("service-name")!;
const seriesNameEl = document.getElementById("series-name")!;
const sessionStatsLineEl = document.getElementById("session-stats-line")!;
const sessionStatsSavedEl = document.getElementById("session-stats-saved")!;
const lifetimeStatsLineEl = document.getElementById("lifetime-stats-line")!;
const lifetimeStatsSavedEl = document.getElementById("lifetime-stats-saved")!;
const optionsLink = document.getElementById("options-link") as HTMLAnchorElement;

optionsLink.href = chrome.runtime.getURL("options.html");

let activeService: ServiceId | null = null;
let activeSeriesId: string | null = null;
let activeSeriesTitle: string | null = null;

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getTabContext(tabId: number): Promise<ContentContextResponse | null> {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: "autoskip/get-context" });
  } catch {
    return null;
  }
}

function setCheckbox(scope: "service" | "series", action: ActionType, value: boolean) {
  const input = document.querySelector<HTMLInputElement>(
    `input[data-scope="${scope}"][data-action="${action}"]`,
  );
  if (input) input.checked = value;
}

function applyPreferences(
  scope: "service" | "series",
  prefs: ActionPreferences | undefined,
) {
  const values = prefs ?? DEFAULT_PREFERENCES;
  for (const action of ACTION_TYPES) {
    setCheckbox(scope, action, values[action]);
  }
}

async function refresh(): Promise<void> {
  const state = await loadState();
  enabledInput.checked = state.enabled;
  enabledLabel.textContent = state.enabled ? "ON" : "OFF";

  const tab = await getActiveTab();
  const context = tab?.id ? await getTabContext(tab.id) : null;

  activeService = context?.serviceId ?? null;
  activeSeriesId = context?.seriesId ?? null;
  activeSeriesTitle = context?.seriesTitle ?? null;

  serviceNameEl.textContent = context?.serviceName ?? "Unsupported page";
  seriesNameEl.textContent = activeSeriesTitle ?? "Not detected";

  if (activeService) {
    serviceEnabledInput.disabled = false;
    serviceEnabledInput.checked = state.services[activeService]?.enabled !== false;
    applyPreferences("service", getServiceRule(state, activeService)?.preferences);
    applyPreferences(
      "series",
      activeSeriesId
        ? getSeriesRule(state, activeService, activeSeriesId)?.preferences
        : DEFAULT_PREFERENCES,
    );
  } else {
    serviceEnabledInput.disabled = true;
    serviceEnabledInput.checked = false;
    applyPreferences("service", DEFAULT_PREFERENCES);
    applyPreferences("series", DEFAULT_PREFERENCES);
  }

  sessionStatsLineEl.textContent = summarizeStats(state.sessionStats);
  sessionStatsSavedEl.textContent = `~${formatDuration(state.sessionStats.estimatedMsSaved)} saved`;
  lifetimeStatsLineEl.textContent = summarizeStats(state.stats);
  lifetimeStatsSavedEl.textContent = `~${formatDuration(state.stats.estimatedMsSaved)} saved`;
}

enabledInput.addEventListener("change", () => {
  void updateState((state) => ({ ...state, enabled: enabledInput.checked })).then(refresh);
});

serviceEnabledInput.addEventListener("change", () => {
  void (async () => {
    if (!activeService) return;
    await updateState((state) =>
      setServiceEnabled(state, activeService!, serviceEnabledInput.checked),
    );
    await refresh();
  })();
});

document.querySelectorAll<HTMLInputElement>("input[data-scope][data-action]").forEach((input) => {
  input.addEventListener("change", () => {
    void (async () => {
      if (!activeService) return;
      const scope = input.dataset.scope as "service" | "series";
      const action = input.dataset.action as ActionType;

      await updateState((state) =>
        upsertRule(
          state,
          scope === "series" && !activeSeriesId ? "service" : scope,
          activeService!,
          activeSeriesId,
          activeSeriesTitle,
          { [action]: input.checked },
        ),
      );
      await refresh();
    })();
  });
});

void refresh();
