import type { DetectedAction, StreamingAdapter } from "../../types";
import {
  findButtonByLabels,
  queryFirstVisible,
  safeClick,
  toDetectedAction,
} from "../../engine/dom";

function detect(
  type: DetectedAction["type"],
  selectors: string[],
  labels: string[],
): DetectedAction | null {
  const bySelector = queryFirstVisible(selectors);
  if (bySelector) return toDetectedAction(type, bySelector, "high");
  const byLabel = findButtonByLabels(labels);
  if (byLabel) return toDetectedAction(type, byLabel, "medium");
  return null;
}

export const primeVideoAdapter: StreamingAdapter = {
  id: "prime-video",
  displayName: "Prime Video",

  matches(url) {
    return (
      /(^|\.)primevideo\.com$/i.test(url.hostname) ||
      (/(^|\.)amazon\./i.test(url.hostname) && /\/(gp\/)?video\b/i.test(url.pathname))
    );
  },

  getSeriesId() {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("gti") ||
      params.get("asin") ||
      document.querySelector("[data-title-id]")?.getAttribute("data-title-id") ||
      null
    );
  },

  getSeriesTitle() {
    return (
      document.querySelector("h1, [data-automation-id='title']")?.textContent?.trim() ||
      null
    );
  },

  detectIntro() {
    return detect(
      "intro",
      ['button[aria-label*="Skip" i]', '[class*="skipElement"]'],
      ["skip intro", "skip", "intro überspringen"],
    );
  },

  detectRecap() {
    return detect("recap", [], ["skip recap", "skip the recap"]);
  },

  detectCredits() {
    return detect(
      "credits",
      ['button[aria-label*="Next" i]'],
      ["next episode", "skip credits"],
    );
  },

  detectStillWatching() {
    return detect("stillWatching", [], ["continue watching", "are you still watching"]);
  },

  skipIntro(action) {
    safeClick(action.element);
  },
  skipRecap(action) {
    safeClick(action.element);
  },
  continuePlayback(action) {
    safeClick(action.element);
  },
};
