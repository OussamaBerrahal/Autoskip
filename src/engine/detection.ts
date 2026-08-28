import type { DetectedAction, StreamingAdapter } from "../types";
import { safeClick } from "./dom";

export type DetectionResult = {
  action: DetectedAction;
  adapter: StreamingAdapter;
};

export function detectAnyAction(adapter: StreamingAdapter): DetectionResult | null {
  const detectors: Array<() => DetectedAction | null> = [
    () => adapter.detectIntro(),
    () => adapter.detectRecap(),
    () => adapter.detectCredits(),
    () => adapter.detectStillWatching(),
  ];

  for (const detect of detectors) {
    const action = detect();
    if (action && action.confidence !== undefined) {
      return { action, adapter };
    }
  }

  return null;
}

export function performAction(
  adapter: StreamingAdapter,
  action: DetectedAction,
): boolean {
  switch (action.type) {
    case "intro":
      adapter.skipIntro(action);
      return true;
    case "recap":
      adapter.skipRecap(action);
      return true;
    case "credits":
    case "stillWatching":
      adapter.continuePlayback(action);
      return true;
    default:
      return false;
  }
}

export function clickDetected(action: DetectedAction): boolean {
  return safeClick(action.element);
}
