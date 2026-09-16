import type { StreamingAdapter } from "../../types";
import {
  clickAction,
  detectControl,
  slugTitle,
  titleFromSelectors,
} from "../shared";

export const appleTvAdapter: StreamingAdapter = {
  id: "apple-tv",
  displayName: "Apple TV+",

  matches(url) {
    return /(^|\.)tv\.apple\.com$/i.test(url.hostname);
  },

  getSeriesId() {
    return slugTitle(this.getSeriesTitle());
  },

  getSeriesTitle() {
    return titleFromSelectors([
      "[data-testid='series-title']",
      "[data-testid='title']",
    ]);
  },

  detectIntro() {
    return detectControl("intro", ['[data-testid*="skip-intro"]']);
  },

  detectRecap() {
    return detectControl("recap", ['button[aria-label*="recap" i]']);
  },

  detectCredits() {
    return detectControl("credits", ['button[aria-label*="next episode" i]']);
  },

  detectStillWatching() {
    return detectControl("stillWatching", [
      'button[aria-label*="still watching" i]',
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
