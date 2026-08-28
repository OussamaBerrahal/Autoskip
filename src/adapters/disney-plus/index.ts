import type { StreamingAdapter } from "../../types";
import { clickAction, detectControl, slugTitle, titleFromSelectors } from "../shared";

export const disneyPlusAdapter: StreamingAdapter = {
  id: "disney-plus",
  displayName: "Disney+",

  matches(url) {
    return /(^|\.)disneyplus\.com$/i.test(url.hostname);
  },

  getSeriesId() {
    const match = window.location.pathname.match(
      /\/(series|play|video|browse)\/([^/]+)/i,
    );
    return match?.[2] ?? slugTitle(this.getSeriesTitle());
  },

  getSeriesTitle() {
    return titleFromSelectors([
      "[data-testid='title']",
      "h1",
      "[class*='title']",
    ]);
  },

  detectIntro() {
    return detectControl("intro", [
      'button[data-testid*="skip"]',
      'button[aria-label*="Skip" i]',
      '[class*="skip__button"]',
      'button[class*="skip"]',
    ]);
  },

  detectRecap() {
    return detectControl("recap", [
      'button[aria-label*="recap" i]',
      'button[data-testid*="recap"]',
    ]);
  },

  detectCredits() {
    return detectControl("credits", [
      'button[aria-label*="Next" i]',
      'button[data-testid*="next"]',
      'button[aria-label*="next episode" i]',
    ]);
  },

  detectStillWatching() {
    return detectControl("stillWatching", [
      'button[aria-label*="Continue" i]',
      'button[data-testid*="continue"]',
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
