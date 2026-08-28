import { getSeriesRule, getServiceRule, resolvePreferences, upsertRule } from "../../src/rules/engine";
import type { ContentContextResponse } from "../../src/messaging";
import { formatDuration } from "../../src/storage/stats";
import { loadState, updateState } from "../../src/storage/state";
import type { ActionPreferences, ActionType, ServiceId } from "../../src/types";
import { DEFAULT_PREFERENCES } from "../../src/types";

const enabledInput = document.getElementById("enabled") as HTMLInputElement;
const serviceNameEl = document.getElementById("service-name")!;
const seriesNameEl = document.getElementById("series-name")!;
const statsLineEl = document.getElementById("stats-line")!;
const statsSavedEl = document.getElementById("stats-saved")!;

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
  (Object.keys(values) as ActionType[]).forEach((action) => {
    setCheckbox(scope, action, values[action]);
  });
}

async function refresh(): Promise<void> {
  const state = await loadState();
  enabledInput.checked = state.enabled;

  const tab = await getActiveTab();
  const context = tab?.id ? await getTabContext(tab.id) : null;

  activeService = context?.serviceId ?? null;
  activeSeriesId = context?.seriesId ?? null;
  activeSeriesTitle = context?.seriesTitle ?? null;

  serviceNameEl.textContent = context?.serviceName ?? "Unsupported page";
  seriesNameEl.textContent = activeSeriesTitle ?? "Not detected";

  if (activeService) {
    applyPreferences("service", getServiceRule(state, activeService)?.preferences);
    applyPreferences(
      "series",
      activeSeriesId
        ? getSeriesRule(state, activeService, activeSeriesId)?.preferences ??
            resolvePreferences(state, activeService, activeSeriesId)
        : DEFAULT_PREFERENCES,
    );
  } else {
    applyPreferences("service", DEFAULT_PREFERENCES);
    applyPreferences("series", DEFAULT_PREFERENCES);
  }

  const { stats } = state;
  statsLineEl.textContent = `${stats.intros} intros · ${stats.recaps} recaps · ${stats.credits} credits`;
  statsSavedEl.textContent = `~${formatDuration(stats.estimatedMsSaved)} saved`;
}

enabledInput.addEventListener("change", () => {
  void updateState((state) => ({ ...state, enabled: enabledInput.checked })).then(refresh);
});

document.querySelectorAll<HTMLInputElement>("input[data-scope][data-action]").forEach((input) => {
  input.addEventListener("change", () => {
    void (async () => {
      if (!activeService) return;
      const scope = input.dataset.scope as "service" | "series";
      const action = input.dataset.action as ActionType;

      if (scope === "series" && !activeSeriesId) {
        await updateState((state) =>
          upsertRule(state, "service", activeService!, null, null, {
            [action]: input.checked,
          }),
        );
      } else {
        await updateState((state) =>
          upsertRule(
            state,
            scope,
            activeService!,
            activeSeriesId,
            activeSeriesTitle,
            { [action]: input.checked },
          ),
        );
      }
      await refresh();
    })();
  });
});

void refresh();
