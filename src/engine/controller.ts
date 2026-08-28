import { resolveAdapter } from "../adapters";
import { detectAnyAction, performAction } from "./detection";
import { debounce, normalizeText } from "./dom";
import { actionNoun, t, toastMessage } from "../i18n/messages";
import { resolvePreferences, shouldAutomate, upsertRule } from "../rules/engine";
import { loadState, promptKey, updateState } from "../storage/state";
import { recordSkip } from "../storage/stats";
import type { ActionType, DetectedAction, StreamingAdapter } from "../types";
import {
  dismissOverlays,
  isPromptVisible,
  showActionPrompt,
  showToast,
  type PromptChoice,
} from "../ui/feedback";

const MANUAL_PROMPT_THRESHOLD = 2;
const SCAN_INTERVAL_MS = 700;

let lastHandledSignature = "";
let observer: MutationObserver | null = null;
let intervalId: number | undefined;
let clickListenerAttached = false;
let scanning = false;

function actionSignature(action: DetectedAction): string {
  return `${action.type}:${action.label}`;
}

async function appendDebug(message: string): Promise<void> {
  const state = await loadState();
  if (!state.debugLogging) return;
  console.info(`[AutoSkip] ${message}`);
}

async function applyChoice(
  adapter: StreamingAdapter,
  action: DetectedAction,
  choice: PromptChoice,
): Promise<void> {
  const seriesId = adapter.getSeriesId();
  const seriesTitle = adapter.getSeriesTitle();
  const key = promptKey(adapter.id, seriesId, action.type);

  if (choice === "dismiss") {
    await updateState((s) => ({
      ...s,
      dismissedPrompts: { ...s.dismissedPrompts, [key]: true },
      offeredFirstEncounter: { ...s.offeredFirstEncounter, [key]: true },
    }));
    return;
  }

  if (choice === "once") {
    await updateState((s) => ({
      ...s,
      offeredFirstEncounter: { ...s.offeredFirstEncounter, [key]: true },
    }));
    const clicked = performAction(adapter, action);
    if (clicked) {
      const locale = (await loadState()).locale;
      showToast({ message: t("toast.skippedOnce", locale) });
    }
    return;
  }

  const scope = choice === "service" ? "service" : "series";
  await updateState((s) =>
    upsertRule(s, scope, adapter.id, seriesId, seriesTitle, {
      [action.type]: true,
    }),
  );
  await automate(adapter, action);
}

async function automate(
  adapter: StreamingAdapter,
  action: DetectedAction,
): Promise<void> {
  const signature = actionSignature(action);
  if (signature === lastHandledSignature) return;
  lastHandledSignature = signature;

  const clicked = performAction(adapter, action);
  if (!clicked) {
    await appendDebug(`click failed for ${action.type}`);
    return;
  }

  const state = await updateState((current) => recordSkip(current, action.type));
  await appendDebug(`automated ${action.type}`);

  showToast({
    message: toastMessage(action.type, state.locale),
    undoLabel: t("prompt.undo", state.locale),
    onUndo: () => {
      void updateState((current) =>
        upsertRule(
          current,
          "session",
          adapter.id,
          adapter.getSeriesId(),
          adapter.getSeriesTitle(),
          { [action.type]: false },
        ),
      );
      showToast({ message: t("toast.undoPaused", state.locale) });
    },
  });
}

async function offerFirstEncounter(
  adapter: StreamingAdapter,
  action: DetectedAction,
): Promise<void> {
  if (isPromptVisible()) return;

  const state = await loadState();
  const seriesId = adapter.getSeriesId();
  const key = promptKey(adapter.id, seriesId, action.type);

  if (state.dismissedPrompts[key] || state.offeredFirstEncounter[key]) return;
  if (shouldAutomate(state, adapter.id, seriesId, action.type)) return;

  // Only offer first-encounter for intro/recap by default (core + opt-in discovery).
  if (action.type !== "intro" && action.type !== "recap") return;

  const signature = `first:${actionSignature(action)}`;
  if (signature === lastHandledSignature) return;
  lastHandledSignature = signature;

  await updateState((s) => ({
    ...s,
    offeredFirstEncounter: { ...s.offeredFirstEncounter, [key]: true },
  }));

  showActionPrompt({
    mode: "first-encounter",
    actionType: action.type,
    locale: state.locale,
    onChoice: (choice) => {
      void applyChoice(adapter, action, choice);
    },
  });
}

async function offerSmartPrompt(
  adapter: StreamingAdapter,
  action: DetectedAction,
): Promise<void> {
  if (isPromptVisible()) return;

  const state = await loadState();
  const seriesId = adapter.getSeriesId();
  const key = promptKey(adapter.id, seriesId, action.type);

  if (state.dismissedPrompts[key]) return;
  if (shouldAutomate(state, adapter.id, seriesId, action.type)) return;

  const count = state.manualSkipCounts[key] ?? 0;
  if (count < MANUAL_PROMPT_THRESHOLD) return;

  const signature = `smart:${actionSignature(action)}`;
  if (signature === lastHandledSignature) return;
  lastHandledSignature = signature;

  showActionPrompt({
    mode: "smart",
    actionType: action.type,
    locale: state.locale,
    onChoice: (choice) => {
      void applyChoice(adapter, action, choice);
    },
  });
}

function inferActionTypeFromTarget(target: EventTarget | null): ActionType | null {
  if (!(target instanceof Element)) return null;
  const clickable = target.closest("button, [role='button'], a");
  if (!(clickable instanceof HTMLElement)) return null;

  const label = normalizeText(
    [
      clickable.getAttribute("aria-label"),
      clickable.getAttribute("data-uia"),
      clickable.getAttribute("data-testid"),
      clickable.textContent,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (!label) return null;
  if (label.includes("recap") || label.includes("résumé") || label.includes("resumen")) {
    return "recap";
  }
  if (label.includes("intro") || label.includes("skip")) {
    // Prefer intro when ambiguous skip buttons appear mid-episode start.
    if (label.includes("credit") || label.includes("next episode")) return "credits";
    if (label.includes("continue") || label.includes("still watching")) {
      return "stillWatching";
    }
    return "intro";
  }
  if (label.includes("next episode") || label.includes("credits")) return "credits";
  if (label.includes("still watching") || label.includes("continue watching")) {
    return "stillWatching";
  }
  return null;
}

async function onDocumentClick(event: MouseEvent): Promise<void> {
  const adapter = resolveAdapter();
  if (!adapter) return;

  const actionType = inferActionTypeFromTarget(event.target);
  if (!actionType) return;

  const state = await loadState();
  if (!state.enabled || state.services[adapter.id]?.enabled === false) return;

  const seriesId = adapter.getSeriesId();
  if (shouldAutomate(state, adapter.id, seriesId, actionType)) return;

  const key = promptKey(adapter.id, seriesId, actionType);
  const count = (state.manualSkipCounts[key] ?? 0) + 1;
  await updateState((s) => ({
    ...s,
    manualSkipCounts: { ...s.manualSkipCounts, [key]: count },
  }));

  await appendDebug(`manual ${actionType} count=${count}`);

  if (count >= MANUAL_PROMPT_THRESHOLD) {
    // Defer prompt until next scan detects the control again or immediately if still present.
    window.setTimeout(() => {
      void scan();
    }, 400);
  }
}

async function scan(): Promise<void> {
  if (scanning) return;
  scanning = true;
  try {
    const adapter = resolveAdapter();
    if (!adapter) return;

    const state = await loadState();
    if (!state.enabled || state.services[adapter.id]?.enabled === false) return;

    const detected = detectAnyAction(adapter);
    if (!detected) {
      // Clear stale signature when controls disappear so next episode can re-trigger.
      if (!isPromptVisible()) lastHandledSignature = "";
      return;
    }

    const { action } = detected;
    const seriesId = adapter.getSeriesId();
    const prefs = resolvePreferences(state, adapter.id, seriesId);

    if (prefs[action.type]) {
      dismissOverlays();
      await automate(adapter, action);
      return;
    }

    const key = promptKey(adapter.id, seriesId, action.type);
    const manualCount = state.manualSkipCounts[key] ?? 0;

    if (manualCount >= MANUAL_PROMPT_THRESHOLD) {
      await offerSmartPrompt(adapter, action);
      return;
    }

    await offerFirstEncounter(adapter, action);
  } finally {
    scanning = false;
  }
}

const debouncedScan = debounce(() => {
  void scan();
}, 180);

export function startController(): void {
  if (observer) return;

  void scan();
  intervalId = window.setInterval(() => {
    void scan();
  }, SCAN_INTERVAL_MS);

  observer = new MutationObserver(() => debouncedScan());
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "aria-label", "data-uia", "data-testid"],
  });

  if (!clickListenerAttached) {
    document.addEventListener("click", (event) => {
      void onDocumentClick(event);
    }, true);
    clickListenerAttached = true;
  }
}

export function stopController(): void {
  observer?.disconnect();
  observer = null;
  if (intervalId !== undefined) {
    window.clearInterval(intervalId);
    intervalId = undefined;
  }
}

// Keep noun helper referenced for potential future toast copy reuse.
void actionNoun;
