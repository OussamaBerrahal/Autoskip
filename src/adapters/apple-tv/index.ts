import type { StreamingAdapter } from "../../types";
import { clickAction, detectControl, slugTitle, titleFromSelectors } from "../shared";

export const appleTvAdapter: StreamingAdapter = {
  id: "apple-tv",
  displayName: "Apple TV+",

  matches(url) {
    return /(^|\.)tv\.apple\.com$/i.test(url.hostname);
  },

  getSeriesId() {
    const match = window.location.pathname.match(
      /\/(show|episode|movie|season)\/([^/]+)/i,
    );
    return match?.[2] ?? slugTitle(this.getSeriesTitle());
  },

  getSeriesTitle() {
    return titleFromSelectors([
      "h1",
      "[class*='title']",
      "[data-testid='title']",
    ]);
  },

  detectIntro() {
    return detectControl("intro", [
      'button[aria-label*="Skip" i]',
      'button[class*="skip"]',
      '[data-testid*="skip"]',
    ]);
  },

  detectRecap() {
    return detectControl("recap", [
      'button[aria-label*="recap" i]',
      'button[aria-label*="Skip" i]',
    ]);
  },

  detectCredits() {
    return detectControl("credits", [
      'button[aria-label*="Next" i]',
      'button[aria-label*="next episode" i]',
    ]);
  },

  detectStillWatching() {
    return detectControl("stillWatching", [
      'button[aria-label*="Continue" i]',
      'button[aria-label*="still watching" i]',
    ]);
  },

  skipIntro(action) {
    clickAction(action);
  },
  skipRecap(action) {
    clickAction(action);
  },
  continuePlayback(action) {
    clickAction(action);
  },
};
