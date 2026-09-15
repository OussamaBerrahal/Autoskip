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
  '[data-uia="player-next-episode"]',
];

const STILL_WATCHING_SELECTORS = [
  '[data-uia="interrupt-autoplay-continue"]',
  'button[data-uia*="continue-playing"]',
];

let cachedTitle: { path: string; title: string } | null = null;

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
    const path = window.location.pathname;
    const title = titleFromSelectors([
      '[data-uia="video-title"] h4',
      ".video-title h4",
    ]);
    // Older layouts expose the show title alone. Never concatenate the episode
    // number/name into the identity when the container has child elements.
    const titleRoot = document.querySelector(
      '[data-uia="video-title"], .video-title',
    );
    const plainTitle =
      titleRoot?.childElementCount === 0 ? titleRoot.textContent?.trim() : null;
    const detected = title || plainTitle;
    if (detected) cachedTitle = { path, title: detected };
    return cachedTitle?.path === path ? cachedTitle.title : null;
  },

  detectIntro() {
    return detectControl("intro", INTRO_SELECTORS);
  },

  detectRecap() {
    return detectControl("recap", RECAP_SELECTORS);
  },

  detectCredits() {
    // The persistent toolbar control (control-next) is never an end card.
    return detectControl("credits", CREDITS_SELECTORS, [], false);
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
