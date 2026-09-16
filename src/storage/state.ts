import type {
  ActionPreferences,
  ActionType,
  AutoSkipState,
  RuleSet,
  ServiceId,
} from "../types";
import { DEFAULT_PREFERENCES, DEFAULT_STATE } from "../types";
import { validateImport } from "./validation";

const STORAGE_KEY = "autoskip_state_v1";

function cloneDefaultState(): AutoSkipState {
  return structuredClone(DEFAULT_STATE);
}

export async function loadState(): Promise<AutoSkipState> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return cloneDefaultState();
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<AutoSkipState> | undefined;
  if (!stored) return cloneDefaultState();

  try {
    const state = validateImport(stored);
    state.sessionRules = pruneExpiredSessions(state.sessionRules);
    return state;
  } catch {
    // A malformed legacy import must not break the player or Options recovery UI.
    // Leave the original bytes in storage until the user saves or resets preferences.
    return cloneDefaultState();
  }
}

export async function saveState(state: AutoSkipState): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
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

export function sessionKey(
  serviceId: ServiceId,
  seriesId: string | null,
): string {
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
