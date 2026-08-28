import { resolveAdapter } from "../adapters";
import { detectAnyAction, performAction } from "./detection";
import { debounce } from "./dom";
import { resolvePreferences, shouldAutomate, upsertRule } from "../rules/engine";
import { loadState, promptKey, saveState, updateState } from "../storage/state";
import { recordSkip } from "../storage/stats";
import type { ActionType, DetectedAction, StreamingAdapter } from "../types";
import { showSmartPrompt, showToast } from "../ui/feedback";

const MANUAL_PROMPT_THRESHOLD = 2;
const SCAN_INTERVAL_MS = 800;

let lastHandledSignature = "";
let observer: MutationObserver | null = null;
let intervalId: number | undefined;

function actionSignature(action: DetectedAction): string {
  return `${action.type}:${action.label}:${action.element.outerHTML.slice(0, 80)}`;
}

function actionLabel(type: ActionType): string {
  switch (type) {
    case "intro":
      return "Intro skipped";
    case "recap":
      return "Recap skipped";
    case "credits":
      return "Credits skipped";
    case "stillWatching":
      return "Continued watching";
  }
}

async function automate(
  adapter: StreamingAdapter,
  action: DetectedAction,
): Promise<void> {
  const signature = actionSignature(action);
  if (signature === lastHandledSignature) return;
  lastHandledSignature = signature;

  const clicked = performAction(adapter, action);
  if (!clicked) return;

  await updateState((state) => recordSkip(state, action.type));

  showToast({
    message: `${actionLabel(action.type)} automatically`,
    onUndo: () => {
      // Best-effort: user can manually seek back; we only disable further automation this session.
      void updateState((state) =>
        upsertRule(
          state,
          "session",
          adapter.id,
          adapter.getSeriesId(),
          adapter.getSeriesTitle(),
          { [action.type]: false },
        ),
      );
      showToast({ message: "Automation paused for this session" });
    },
  });
}

async function maybePrompt(
  adapter: StreamingAdapter,
  action: DetectedAction,
): Promise<void> {
  const state = await loadState();
  const seriesId = adapter.getSeriesId();
  const key = promptKey(adapter.id, seriesId, action.type);

  if (state.dismissedPrompts[key]) return;
  if (shouldAutomate(state, adapter.id, seriesId, action.type)) return;

  const count = (state.manualSkipCounts[key] ?? 0) + 1;
  state.manualSkipCounts[key] = count;
  await saveState(state);

  // Observe manual skips only when the control is present and user likely interacts later.
  // For V1 we also offer a proactive prompt once the threshold is hit and control reappears.
  if (count < MANUAL_PROMPT_THRESHOLD) return;

  const signature = `prompt:${actionSignature(action)}`;
  if (signature === lastHandledSignature) return;
  lastHandledSignature = signature;

  const noun =
    action.type === "intro"
      ? "intro"
      : action.type === "recap"
        ? "recap"
        : action.type === "credits"
          ? "credits"
          : "continuation prompt";

  showSmartPrompt({
    message: `You usually skip this ${noun}. Remember that preference?`,
    onChoice: (choice) => {
      void (async () => {
        if (choice === "dismiss") {
          await updateState((s) => ({
            ...s,
            dismissedPrompts: { ...s.dismissedPrompts, [key]: true },
          }));
          return;
        }

        const scope = choice === "service" ? "service" : "series";
        if (scope === "series" && !seriesId) {
          await updateState((s) =>
            upsertRule(s, "service", adapter.id, seriesId, adapter.getSeriesTitle(), {
              [action.type]: true,
            }),
          );
        } else {
          await updateState((s) =>
            upsertRule(s, scope, adapter.id, seriesId, adapter.getSeriesTitle(), {
              [action.type]: true,
            }),
          );
        }

        await automate(adapter, action);
      })();
    },
  });
}

async function scan(): Promise<void> {
  const adapter = resolveAdapter();
  if (!adapter) return;

  const state = await loadState();
  if (!state.enabled) return;

  const detected = detectAnyAction(adapter);
  if (!detected) return;

  const { action } = detected;
  const seriesId = adapter.getSeriesId();
  const prefs = resolvePreferences(state, adapter.id, seriesId);

  if (prefs[action.type]) {
    await automate(adapter, action);
    return;
  }

  // Track control presence for smart prompting without forcing clicks.
  await maybePrompt(adapter, action);
}

const debouncedScan = debounce(() => {
  void scan();
}, 200);

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
    attributeFilter: ["class", "style", "aria-label", "data-uia"],
  });
}

export function stopController(): void {
  observer?.disconnect();
  observer = null;
  if (intervalId !== undefined) {
    window.clearInterval(intervalId);
    intervalId = undefined;
  }
}
