import type { StreamingAdapter } from "../../types";
import {
  clickAction,
  detectControl,
  slugTitle,
  titleFromSelectors,
} from "../shared";

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
    return slugTitle(this.getSeriesTitle());
  },

  getSeriesTitle() {
    return titleFromSelectors([
      "[data-automation-id='title']",
      "h1[data-automation-id]",
      ".atvwebplayersdk-title-text",
    ]);
  },

  detectIntro() {
    return detectControl("intro", []);
  },

  detectRecap() {
    return detectControl("recap", []);
  },

  detectCredits() {
    // A generic Next Episode label can belong to the regular player toolbar.
    return detectControl(
      "credits",
      [".atvwebplayersdk-nexttitle-button"],
      [],
      false,
    );
  },

  detectStillWatching() {
    return detectControl("stillWatching", [
      ".atvwebplayersdk-stillwatching-button",
    ]);
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
