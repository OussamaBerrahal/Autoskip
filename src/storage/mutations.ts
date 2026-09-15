import type {
  ActionPreferences,
  ActionType,
  AutoSkipState,
  RuleScope,
  ServiceId,
} from "../types";
import { DEFAULT_STATS } from "../types";
import {
  clearSeriesRule,
  setServiceEnabled,
  upsertRule,
} from "../rules/engine";
import { recordSkip, removeSkip } from "./stats";
import { validateImport } from "./validation";
import { sessionKey } from "./state";

export type RuleContext = {
  serviceId: ServiceId;
  seriesId: string | null;
  seriesTitle: string | null;
};
export type StateMutation =
  | {
      kind: "settings";
      patch: Partial<
        Pick<AutoSkipState, "enabled" | "debugLogging" | "locale">
      >;
    }
  | { kind: "service"; serviceId: ServiceId; enabled: boolean }
  | ({
      kind: "rule";
      scope: RuleScope;
      patch: Partial<ActionPreferences>;
    } & RuleContext)
  | { kind: "clear-session"; serviceId: ServiceId; seriesId: string | null }
  | { kind: "clear-series"; serviceId: ServiceId; seriesId: string }
  | { kind: "skip"; action: ActionType }
  | ({ kind: "pause"; action: ActionType; reversed?: boolean } & RuleContext)
  | { kind: "manual"; key: string }
  | { kind: "prompt"; key: string; dismissed?: boolean }
  | { kind: "reset"; target: "session" | "lifetime" | "startup" | "all" }
  | { kind: "import"; state: unknown };

export function applyMutation(
  state: AutoSkipState,
  mutation: StateMutation,
): AutoSkipState {
  switch (mutation.kind) {
    case "settings":
      return { ...state, ...mutation.patch };
    case "service":
      return setServiceEnabled(state, mutation.serviceId, mutation.enabled);
    case "rule":
      return upsertRule(
        state,
        mutation.scope,
        mutation.serviceId,
        mutation.seriesId,
        mutation.seriesTitle,
        mutation.patch,
      );
    case "clear-session": {
      const next = structuredClone(state);
      delete next.sessionRules[
        sessionKey(mutation.serviceId, mutation.seriesId)
      ];
      return next;
    }
    case "clear-series":
      return clearSeriesRule(state, mutation.serviceId, mutation.seriesId);
    case "skip":
      return recordSkip(state, mutation.action);
    case "pause": {
      const next = upsertRule(
        state,
        "session",
        mutation.serviceId,
        mutation.seriesId,
        mutation.seriesTitle,
        { [mutation.action]: false },
      );
      return mutation.reversed ? removeSkip(next, mutation.action) : next;
    }
    case "manual":
      return {
        ...state,
        manualSkipCounts: {
          ...state.manualSkipCounts,
          [mutation.key]: (state.manualSkipCounts[mutation.key] ?? 0) + 1,
        },
      };
    case "prompt":
      return {
        ...state,
        offeredFirstEncounter: {
          ...state.offeredFirstEncounter,
          [mutation.key]: true,
        },
        dismissedPrompts: mutation.dismissed
          ? { ...state.dismissedPrompts, [mutation.key]: true }
          : state.dismissedPrompts,
      };
    case "reset": {
      if (mutation.target === "all") return validateImport({});
      return {
        ...state,
        ...(mutation.target === "lifetime"
          ? { stats: { ...DEFAULT_STATS } }
          : { sessionStats: { ...DEFAULT_STATS } }),
        ...(mutation.target === "startup" ? { sessionRules: {} } : {}),
      };
    }
    case "import":
      return validateImport(mutation.state);
  }
}

/** Every context writes through the worker's queue to avoid lost updates across tabs. */
export async function mutateState(
  mutation: StateMutation,
): Promise<AutoSkipState> {
  const result = await chrome.runtime.sendMessage({
    type: "autoskip/mutate",
    mutation,
  });
  if (!result?.ok)
    throw new Error(result?.error ?? "Could not save AutoSkip preferences");
  return result.state;
}
