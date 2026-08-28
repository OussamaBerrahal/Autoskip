import type {
  ActionPreferences,
  ActionType,
  AutoSkipState,
  RuleScope,
  RuleSet,
  ServiceId,
} from "../types";
import { DEFAULT_PREFERENCES } from "../types";
import { seriesKey, sessionKey } from "../storage/state";

const SESSION_TTL_MS = 4 * 60 * 60 * 1000;

export function resolvePreferences(
  state: AutoSkipState,
  serviceId: ServiceId,
  seriesId: string | null,
): ActionPreferences {
  if (!state.enabled) {
    return { ...DEFAULT_PREFERENCES };
  }

  const service = state.serviceRules[serviceId]?.preferences;
  const series = seriesId
    ? state.seriesRules[seriesKey(serviceId, seriesId)]?.preferences
    : undefined;
  const session = state.sessionRules[sessionKey(serviceId, seriesId)]?.preferences;

  return {
    intro: session?.intro ?? series?.intro ?? service?.intro ?? false,
    recap: session?.recap ?? series?.recap ?? service?.recap ?? false,
    credits: session?.credits ?? series?.credits ?? service?.credits ?? false,
    stillWatching:
      session?.stillWatching ??
      series?.stillWatching ??
      service?.stillWatching ??
      false,
  };
}

export function shouldAutomate(
  state: AutoSkipState,
  serviceId: ServiceId,
  seriesId: string | null,
  action: ActionType,
): boolean {
  const prefs = resolvePreferences(state, serviceId, seriesId);
  return prefs[action];
}

export function upsertRule(
  state: AutoSkipState,
  scope: RuleScope,
  serviceId: ServiceId,
  seriesId: string | null,
  seriesTitle: string | null,
  patch: Partial<ActionPreferences>,
): AutoSkipState {
  const next = structuredClone(state);
  const base: ActionPreferences = {
    ...DEFAULT_PREFERENCES,
    ...patch,
  };

  if (scope === "service") {
    const existing = next.serviceRules[serviceId];
    next.serviceRules[serviceId] = {
      serviceId,
      preferences: { ...(existing?.preferences ?? DEFAULT_PREFERENCES), ...patch },
      updatedAt: Date.now(),
    };
    return next;
  }

  if (scope === "series") {
    if (!seriesId) return state;
    const key = seriesKey(serviceId, seriesId);
    const existing = next.seriesRules[key];
    next.seriesRules[key] = {
      serviceId,
      seriesId,
      seriesTitle: seriesTitle ?? existing?.seriesTitle,
      preferences: { ...(existing?.preferences ?? DEFAULT_PREFERENCES), ...patch },
      updatedAt: Date.now(),
    };
    return next;
  }

  const key = sessionKey(serviceId, seriesId);
  const existing = next.sessionRules[key];
  next.sessionRules[key] = {
    serviceId,
    seriesId: seriesId ?? undefined,
    seriesTitle: seriesTitle ?? existing?.seriesTitle,
    preferences: { ...(existing?.preferences ?? base), ...patch },
    updatedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  return next;
}

export function setServiceEnabled(
  state: AutoSkipState,
  enabled: boolean,
): AutoSkipState {
  return { ...state, enabled };
}

export function getServiceRule(
  state: AutoSkipState,
  serviceId: ServiceId,
): RuleSet | undefined {
  return state.serviceRules[serviceId];
}

export function getSeriesRule(
  state: AutoSkipState,
  serviceId: ServiceId,
  seriesId: string,
): RuleSet | undefined {
  return state.seriesRules[seriesKey(serviceId, seriesId)];
}
