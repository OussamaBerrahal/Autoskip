import type { StreamingAdapter } from "../../types";
import {
  clickAction,
  detectControl,
  slugTitle,
  titleFromSelectors,
} from "../shared";

const INTRO_SELECTORS = [
  '[data-uia="player-skip-intro"]',
  'button[data-uia*="skip-intro"]',
  '[data-uia="player-skip-intro"] button',
];

const RECAP_SELECTORS = [
  '[data-uia="player-skip-recap"]',
  'button[data-uia*="skip-recap"]',
];

const CREDITS_SELECTORS = [
  '[data-uia="next-episode-seamless-button"]',
  '[data-uia="next-episode-button"]',
  'button[data-uia*="next-episode"]',
  '[data-uia="player-next-episode"]',
];

const STILL_WATCHING_SELECTORS = [
  '[data-uia="interrupt-autoplay-continue"]',
  '[data-uia="evidence-overlay-action-primary"]',
  'button[data-uia*="continue-playing"]',
];

export const netflixAdapter: StreamingAdapter = {
  id: "netflix",
  displayName: "Netflix",

  matches(url) {
    return /(^|\.)netflix\.com$/i.test(url.hostname);
  },

  getSeriesId() {
    // A /watch ID identifies a video/episode, not a series.
    return slugTitle(this.getSeriesTitle());
  },

  getSeriesTitle() {
    return titleFromSelectors([
      '[data-uia="video-title"]',
      ".video-title h4",
      ".video-title",
    ]);
  },

  detectIntro() {
    return detectControl("intro", INTRO_SELECTORS);
  },

  detectRecap() {
    return detectControl("recap", RECAP_SELECTORS);
  },

  detectCredits() {
    return detectControl("credits", CREDITS_SELECTORS);
  },

  detectStillWatching() {
    return detectControl("stillWatching", STILL_WATCHING_SELECTORS);
  },

  skipIntro(action) {
    return clickAction(action);
  },
  skipRecap(action) {
    return clickAction(action);
  },
  continuePlayback(action) {
    return clickAction(action);
  },
};
