import type { StreamingAdapter } from "../../types";
import {
  clickAction,
  detectControl,
  slugTitle,
  titleFromSelectors,
} from "../shared";

export const disneyPlusAdapter: StreamingAdapter = {
  id: "disney-plus",
  displayName: "Disney+",

  matches(url) {
    return /(^|\.)disneyplus\.com$/i.test(url.hostname);
  },

  getSeriesId() {
    return slugTitle(this.getSeriesTitle());
  },

  getSeriesTitle() {
    return titleFromSelectors(["[data-testid='title']"]);
  },

  detectIntro() {
    return detectControl("intro", [
      'button[data-testid*="skip-intro"]',
      'button[aria-label*="intro" i]',
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
      'button[data-testid*="next-episode"]',
      'button[aria-label*="next episode" i]',
    ]);
  },

  detectStillWatching() {
    return detectControl("stillWatching", [
      'button[data-testid*="still-watching"]',
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
