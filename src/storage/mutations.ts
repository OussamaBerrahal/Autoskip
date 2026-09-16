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
  savedPreferences,
  setServiceEnabled,
  upsertRule,
} from "../rules/engine";
import { recordSkip, removeSkip } from "./stats";
import { validateImport } from "./validation";
import { seriesKey, sessionKey } from "./state";

export type RuleContext = {
  serviceId: ServiceId;
  seriesId: string | null;
  seriesTitle: string | null;
};
export type StateMutation =
  | {
      kind: "settings";
      patch: Partial<
        Pick<
          AutoSkipState,
          "enabled" | "debugLogging" | "locale" | "pausedUntil"
        >
      >;
    }
  | { kind: "setup"; serviceIds: ServiceId[] }
  | { kind: "service"; serviceId: ServiceId; enabled: boolean }
  | ({ kind: "save-series" } & RuleContext)
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
    case "setup": {
      if (!mutation.serviceIds.length) return state;
      let next = { ...state, enabled: true, pausedUntil: 0 };
      for (const serviceId of mutation.serviceIds) {
        next = setServiceEnabled(next, serviceId, true);
        next = upsertRule(next, "service", serviceId, null, null, {
          intro: true,
          recap: true,
        });
      }
      return next;
    }
    case "service":
      return setServiceEnabled(state, mutation.serviceId, mutation.enabled);
    case "save-series": {
      const { serviceId, seriesId, seriesTitle } = mutation;
      // Selecting an existing show must never overwrite its previous choices.
      if (!seriesId || state.seriesRules[seriesKey(serviceId, seriesId)])
        return state;
      return upsertRule(
        state,
        "series",
        serviceId,
        seriesId,
        seriesTitle,
        savedPreferences(state, serviceId, null),
      );
    }
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
    default:
      // A newer UI must never turn an unsupported operation into an empty state.
      throw new Error("Unsupported AutoSkip preference change");
  }
}

export class ExtensionReloadRequired extends Error {
  constructor() {
    super(
      "AutoSkip was updated. Reload it in Chrome’s Extensions page, then reload your show.",
    );
    this.name = "ExtensionReloadRequired";
  }
}

/** Every context writes through the worker's queue to avoid lost updates across tabs. */
export async function mutateState(
  mutation: StateMutation,
): Promise<AutoSkipState> {
  const savesShow = mutation.kind === "save-series";
  let result;
  try {
    result = await chrome.runtime.sendMessage({
      // Legacy workers ignore this new message instead of dispatching an unknown
      // mutation. This matters when an unpacked popup updates before its worker.
      type: savesShow ? "autoskip/save-series" : "autoskip/mutate",
      mutation,
    });
  } catch (error) {
    if (savesShow) throw new ExtensionReloadRequired();
    throw error;
  }
  if (savesShow && !result) throw new ExtensionReloadRequired();
  if (!result?.ok)
    throw new Error(result?.error ?? "Could not save AutoSkip preferences");
  return result.state;
}
