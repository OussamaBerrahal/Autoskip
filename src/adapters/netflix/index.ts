import type { DetectedAction, StreamingAdapter } from "../../types";
import {
  findButtonByLabels,
  queryFirstVisible,
  safeClick,
  toDetectedAction,
} from "../../engine/dom";

const INTRO_SELECTORS = [
  '[data-uia="player-skip-intro"]',
  'button[data-uia*="skip-intro"]',
];

const RECAP_SELECTORS = [
  '[data-uia="player-skip-recap"]',
  'button[data-uia*="skip-recap"]',
];

const CREDITS_SELECTORS = [
  '[data-uia="next-episode-seamless-button"]',
  '[data-uia="next-episode-button"]',
  'button[data-uia*="next-episode"]',
];

const STILL_WATCHING_SELECTORS = [
  '[data-uia="interrupt-autoplay-continue"]',
  'button[data-uia*="continue"]',
];

const INTRO_LABELS = [
  "skip intro",
  "skip the intro",
  "intro überspringen",
  "passer l'intro",
  "omitir intro",
  "salta intro",
];

const RECAP_LABELS = [
  "skip recap",
  "skip the recap",
  "recap überspringen",
  "passer le résumé",
  "omitir resumen",
  "salta riepilogo",
];

const CREDITS_LABELS = [
  "next episode",
  "skip credits",
  "nächste folge",
  "épisode suivant",
  "siguiente episodio",
  "prossimo episodio",
];

const STILL_WATCHING_LABELS = [
  "continue watching",
  "are you still watching",
  "yes, continue",
  "weiter ansehen",
  "continuer à regarder",
  "seguir viendo",
];

function detectBySelectorsOrLabels(
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

export const netflixAdapter: StreamingAdapter = {
  id: "netflix",
  displayName: "Netflix",

  matches(url) {
    return /(^|\.)netflix\.com$/i.test(url.hostname);
  },

  getSeriesId() {
    const path = window.location.pathname;
    const watchMatch = path.match(/\/watch\/(\d+)/);
    if (watchMatch) return watchMatch[1];

    const titleEl = document.querySelector('[data-uia="video-title"]');
    const text = titleEl?.textContent?.trim();
    return text ? `title:${text.toLowerCase()}` : null;
  },

  getSeriesTitle() {
    const titleEl = document.querySelector(
      '[data-uia="video-title"], .video-title, h4',
    );
    return titleEl?.textContent?.trim() || null;
  },

  detectIntro() {
    return detectBySelectorsOrLabels("intro", INTRO_SELECTORS, INTRO_LABELS);
  },

  detectRecap() {
    return detectBySelectorsOrLabels("recap", RECAP_SELECTORS, RECAP_LABELS);
  },

  detectCredits() {
    return detectBySelectorsOrLabels("credits", CREDITS_SELECTORS, CREDITS_LABELS);
  },

  detectStillWatching() {
    return detectBySelectorsOrLabels(
      "stillWatching",
      STILL_WATCHING_SELECTORS,
      STILL_WATCHING_LABELS,
    );
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
