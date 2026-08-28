import type { StreamingAdapter } from "../../types";
import { clickAction, detectControl, slugTitle, titleFromSelectors } from "../shared";

export const primeVideoAdapter: StreamingAdapter = {
  id: "prime-video",
  displayName: "Prime Video",

  matches(url) {
    return (
      /(^|\.)primevideo\.com$/i.test(url.hostname) ||
      (/(^|\.)amazon\./i.test(url.hostname) &&
        /\/(gp\/)?video\b|\/detail\//i.test(`${url.pathname}${url.search}`))
    );
  },

  getSeriesId() {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("gti") ||
      params.get("asin") ||
      document.querySelector("[data-title-id]")?.getAttribute("data-title-id") ||
      document.querySelector("[data-asin]")?.getAttribute("data-asin") ||
      slugTitle(this.getSeriesTitle())
    );
  },

  getSeriesTitle() {
    return titleFromSelectors([
      "[data-automation-id='title']",
      "h1[data-automation-id]",
      ".atvwebplayersdk-title-text",
      "h1",
    ]);
  },

  detectIntro() {
    return detectControl("intro", [
      ".atvwebplayersdk-skipelement-button",
      'button[aria-label*="Skip" i]',
      '[class*="skipElement"] button',
      '[class*="SkipButton"]',
    ]);
  },

  detectRecap() {
    return detectControl("recap", [
      'button[aria-label*="recap" i]',
      ".atvwebplayersdk-skipelement-button",
    ]);
  },

  detectCredits() {
    return detectControl("credits", [
      ".atvwebplayersdk-nexttitle-button",
      'button[aria-label*="Next" i]',
      'button[aria-label*="next episode" i]',
    ]);
  },

  detectStillWatching() {
    return detectControl("stillWatching", [
      'button[aria-label*="Continue" i]',
      ".atvwebplayersdk-stillwatching-button",
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
