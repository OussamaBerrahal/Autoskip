import type {
  ActionPreferences,
  ActionType,
  AutoSkipState,
  RuleSet,
  ServiceId,
  StatsBucket,
} from "../types";
import {
  DEFAULT_PREFERENCES,
  DEFAULT_SERVICES,
  DEFAULT_STATE,
  DEFAULT_STATS,
} from "../types";

const STORAGE_KEY = "autoskip_state_v1";

function cloneDefaultState(): AutoSkipState {
  return structuredClone(DEFAULT_STATE);
}

function mergeStats(stored?: Partial<StatsBucket>): StatsBucket {
  return { ...DEFAULT_STATS, ...stored };
}

export async function loadState(): Promise<AutoSkipState> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return cloneDefaultState();
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<AutoSkipState> | undefined;
  if (!stored) return cloneDefaultState();

  return {
    ...cloneDefaultState(),
    ...stored,
    services: {
      ...DEFAULT_SERVICES,
      ...(stored.services ?? {}),
    },
    stats: mergeStats(stored.stats),
    sessionStats: mergeStats(stored.sessionStats),
    serviceRules: stored.serviceRules ?? {},
    seriesRules: stored.seriesRules ?? {},
    sessionRules: pruneExpiredSessions(stored.sessionRules ?? {}),
    manualSkipCounts: stored.manualSkipCounts ?? {},
    dismissedPrompts: stored.dismissedPrompts ?? {},
    offeredFirstEncounter: stored.offeredFirstEncounter ?? {},
    debugLogging: stored.debugLogging ?? false,
    locale: stored.locale ?? "auto",
  };
}

export async function saveState(state: AutoSkipState): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

export async function updateState(
  updater: (state: AutoSkipState) => AutoSkipState,
): Promise<AutoSkipState> {
  const current = await loadState();
  const next = updater(current);
  await saveState(next);
  return next;
}

function pruneExpiredSessions(
  sessions: Record<string, RuleSet>,
): Record<string, RuleSet> {
  const now = Date.now();
  const next: Record<string, RuleSet> = {};
  for (const [key, rule] of Object.entries(sessions)) {
    if (!rule.expiresAt || rule.expiresAt > now) {
      next[key] = rule;
    }
  }
  return next;
}

export function seriesKey(serviceId: ServiceId, seriesId: string): string {
  return `${serviceId}::${seriesId}`;
}

export function sessionKey(serviceId: ServiceId, seriesId: string | null): string {
  return `${serviceId}::${seriesId ?? "unknown"}`;
}

export function promptKey(
  serviceId: ServiceId,
  seriesId: string | null,
  action: ActionType,
): string {
  return `${serviceId}::${seriesId ?? "unknown"}::${action}`;
}

export function emptyPreferences(): ActionPreferences {
  return { ...DEFAULT_PREFERENCES };
}

export async function resetSessionStats(): Promise<void> {
  await updateState((state) => ({
    ...state,
    sessionStats: { ...DEFAULT_STATS },
  }));
}
