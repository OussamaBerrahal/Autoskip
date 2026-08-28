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

export const appleTvAdapter: StreamingAdapter = {
  id: "apple-tv",
  displayName: "Apple TV+",

  matches(url) {
    return /(^|\.)tv\.apple\.com$/i.test(url.hostname);
  },

  getSeriesId() {
    const match = window.location.pathname.match(/\/(show|episode|movie)\/([^/]+)/i);
    return match?.[2] ?? null;
  },

  getSeriesTitle() {
    return document.querySelector("h1, [class*='title']")?.textContent?.trim() || null;
  },

  detectIntro() {
    return detect(
      "intro",
      ['button[aria-label*="Skip" i]'],
      ["skip intro", "skip", "intro überspringen"],
    );
  },

  detectRecap() {
    return detect("recap", [], ["skip recap", "skip the recap"]);
  },

  detectCredits() {
    return detect("credits", [], ["next episode", "skip credits"]);
  },

  detectStillWatching() {
    return detect("stillWatching", [], ["continue watching", "still watching"]);
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
