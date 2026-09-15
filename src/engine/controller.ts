import { resolveAdapter } from "../adapters";
import { detectAnyAction, performAction } from "./detection";
import { debounce, isVisible } from "./dom";
import { captureUndo, playbackVideo } from "./playback";
import { t, toastMessage } from "../i18n/messages";
import { resolvePreferences, shouldAutomate } from "../rules/engine";
import { loadState, promptKey, seriesKey, sessionKey } from "../storage/state";
import { mutateState, type RuleContext } from "../storage/mutations";
import type { AutoSkipState, DetectedAction, StreamingAdapter } from "../types";
import {
  dismissOverlays,
  dismissPrompt,
  isPromptVisible,
  showActionPrompt,
  showToast,
  type PromptChoice,
} from "../ui/feedback";

const MANUAL_PROMPT_THRESHOLD = 2;
let observer: MutationObserver | null = null;
let intervalId: number | undefined;
let scanning = false;
let generation = 0;
let pageUrl = "";
let handled: { element: HTMLElement; type: string } | null = null;
let promptElement: HTMLElement | null = null;

function context(adapter: StreamingAdapter): RuleContext {
  return {
    serviceId: adapter.id,
    seriesId: adapter.getSeriesId(),
    seriesTitle: adapter.getSeriesTitle(),
  };
}
function explicitlyConfigured(
  state: AutoSkipState,
  ctx: RuleContext,
  action: DetectedAction,
): boolean {
  return [
    state.sessionRules[sessionKey(ctx.serviceId, ctx.seriesId)],
    ctx.seriesId
      ? state.seriesRules[seriesKey(ctx.serviceId, ctx.seriesId)]
      : undefined,
    state.serviceRules[ctx.serviceId],
  ].some((rule) => rule?.preferences[action.type] !== undefined);
}
function report(error: unknown): void {
  console.warn("[AutoSkip] Could not complete the action:", error);
}
async function automate(
  adapter: StreamingAdapter,
  action: DetectedAction,
): Promise<void> {
  if (handled?.element === action.element && handled.type === action.type)
    return;
  const ctx = context(adapter),
    undo = captureUndo(action.type),
    url = location.href;
  if (!performAction(adapter, action)) return;
  handled = { element: action.element, type: action.type };
  const state = await mutateState({ kind: "skip", action: action.type });
  if (state.debugLogging)
    console.info(`[AutoSkip] Activated ${adapter.id} ${action.type}`);
  if (location.href !== url) return;
  showToast({
    message: toastMessage(action.type, state.locale),
    undoLabel: t(undo ? "prompt.undo" : "prompt.pause", state.locale),
    durationMs: 8000,
    onUndo: async () => {
      // Capture the original series context; a later navigation must not alter a new series.
      const reversed = undo?.() ?? false;
      await mutateState({
        kind: "pause",
        ...ctx,
        action: action.type,
        reversed,
      });
      showToast({
        message: t(
          reversed ? "toast.undone" : "toast.undoPaused",
          state.locale,
        ),
      });
    },
  });
}
async function applyChoice(
  adapter: StreamingAdapter,
  action: DetectedAction,
  ctx: RuleContext,
  url: string,
  choice: PromptChoice,
): Promise<void> {
  if (
    location.href !== url ||
    adapter.getSeriesId() !== ctx.seriesId ||
    !isVisible(action.element)
  )
    return;
  const state = await loadState();
  if (!state.enabled || !state.services[adapter.id].enabled) return;
  const key = promptKey(ctx.serviceId, ctx.seriesId, action.type);
  await mutateState({ kind: "prompt", key, dismissed: choice === "dismiss" });
  if (choice === "dismiss") return;
  if (choice === "once") {
    if (performAction(adapter, action)) {
      handled = { element: action.element, type: action.type };
      showToast({ message: t("toast.skippedOnce", state.locale) });
    }
    return;
  }
  if (choice === "series" && !ctx.seriesId) return;
  await mutateState({
    kind: "rule",
    ...ctx,
    scope: choice,
    patch: { [action.type]: true },
  });
  // User may have navigated or the control may have disappeared while saving.
  if (location.href === url && adapter.getSeriesId() === ctx.seriesId)
    await automate(adapter, action);
}
async function onDocumentClick(event: MouseEvent): Promise<void> {
  // Extension-generated clicks and our own prompt buttons are not manual skips.
  if (
    !event.isTrusted ||
    !(event.target instanceof Element) ||
    event.target.closest("#autoskip-prompt, #autoskip-toast")
  )
    return;
  const adapter = resolveAdapter();
  if (!adapter || !playbackVideo()) return;
  const detected = detectAnyAction(adapter);
  if (!detected || !detected.action.element.contains(event.target)) return;
  const action = detected.action,
    ctx = context(adapter);
  const state = await loadState();
  if (
    !state.enabled ||
    !state.services[adapter.id].enabled ||
    shouldAutomate(state, adapter.id, ctx.seriesId, action.type)
  )
    return;
  await mutateState({
    kind: "manual",
    key: promptKey(adapter.id, ctx.seriesId, action.type),
  });
  dismissPrompt();
}
const clickListener = (event: MouseEvent) => {
  void onDocumentClick(event).catch(report);
};

async function scan(): Promise<void> {
  if (scanning || !observer) return;
  scanning = true;
  const currentGeneration = generation;
  try {
    if (pageUrl !== location.href) {
      pageUrl = location.href;
      handled = null;
      promptElement = null;
      dismissOverlays();
    }
    const adapter = resolveAdapter();
    if (!adapter || !playbackVideo()) {
      dismissPrompt();
      return;
    }
    const state = await loadState();
    if (currentGeneration !== generation || !observer) return;
    if (!state.enabled || !state.services[adapter.id].enabled) {
      dismissPrompt();
      return;
    }
    const detected = detectAnyAction(adapter);
    if (!detected) {
      handled = null;
      promptElement = null;
      dismissPrompt();
      return;
    }
    const { action } = detected,
      ctx = context(adapter);
    if (promptElement && promptElement !== action.element) dismissPrompt();
    if (resolvePreferences(state, adapter.id, ctx.seriesId)[action.type]) {
      dismissPrompt();
      await automate(adapter, action);
      return;
    }
    // An explicit off switch or session pause must not be followed by another opt-in prompt.
    if (explicitlyConfigured(state, ctx, action)) {
      dismissPrompt();
      return;
    }
    if (handled?.element === action.element && handled.type === action.type)
      return;
    if (isPromptVisible()) return;
    const key = promptKey(adapter.id, ctx.seriesId, action.type);
    if (state.dismissedPrompts[key]) return;
    const smart = (state.manualSkipCounts[key] ?? 0) >= MANUAL_PROMPT_THRESHOLD;
    if (
      !smart &&
      (state.offeredFirstEncounter[key] ||
        !["intro", "recap"].includes(action.type))
    )
      return;
    const url = location.href;
    await mutateState({ kind: "prompt", key });
    if (
      currentGeneration !== generation ||
      url !== location.href ||
      !isVisible(action.element)
    )
      return;
    promptElement = action.element;
    showActionPrompt({
      mode: smart ? "smart" : "first-encounter",
      actionType: action.type,
      locale: state.locale,
      allowSeries: Boolean(ctx.seriesId),
      onChoice: (choice) => {
        void applyChoice(adapter, action, ctx, url, choice).catch(report);
      },
    });
  } finally {
    scanning = false;
  }
}
const runScan = () => {
  void scan().catch(report);
};
const debouncedScan = debounce(runScan, 180);
export function startController(): void {
  if (observer) return;
  generation += 1;
  pageUrl = location.href;
  observer = new MutationObserver(debouncedScan);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "class",
      "style",
      "aria-label",
      "data-uia",
      "data-testid",
      "hidden",
      "disabled",
    ],
  });
  document.addEventListener("click", clickListener, true);
  intervalId = window.setInterval(runScan, 700);
  runScan();
}
export function stopController(): void {
  generation += 1;
  observer?.disconnect();
  observer = null;
  window.clearInterval(intervalId);
  intervalId = undefined;
  document.removeEventListener("click", clickListener, true);
  handled = null;
  promptElement = null;
  dismissOverlays();
}
