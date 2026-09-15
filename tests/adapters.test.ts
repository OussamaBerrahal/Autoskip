/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  findButtonByLabels,
  isVisible,
  toDetectedAction,
} from "../src/engine/dom";
import {
  adapters,
  netflixAdapter,
  primeVideoAdapter,
  disneyPlusAdapter,
  appleTvAdapter,
} from "../src/adapters";
import { detectControl } from "../src/adapters/shared";

function stubVisibleRect() {
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value() {
      const style = window.getComputedStyle(this);
      if (style.display === "none" || style.visibility === "hidden") {
        return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 120, height: 40 });
    },
  });
}

describe("dom helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    stubVisibleRect();
  });

  it("finds visible labeled buttons", () => {
    document.body.innerHTML = `
      <button aria-label="Skip Intro">Skip Intro</button>
      <button aria-label="Hidden" style="display:none">Skip Intro</button>
    `;
    const found = findButtonByLabels(["skip intro"]);
    expect(found?.getAttribute("aria-label")).toBe("Skip Intro");
    expect(isVisible(found!)).toBe(true);
  });

  it("builds detected actions", () => {
    const button = document.createElement("button");
    button.setAttribute("aria-label", "Skip Intro");
    document.body.appendChild(button);
    const action = toDetectedAction("intro", button);
    expect(action.type).toBe("intro");
    expect(action.label).toBe("Skip Intro");
  });
});

describe("platform adapters", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    stubVisibleRect();
  });

  it("registers four V1 adapters", () => {
    expect(adapters.map((a) => a.id)).toEqual([
      "netflix",
      "prime-video",
      "disney-plus",
      "apple-tv",
    ]);
  });

  it("matches hostnames", () => {
    expect(
      netflixAdapter.matches(new URL("https://www.netflix.com/watch/123")),
    ).toBe(true);
    expect(
      primeVideoAdapter.matches(new URL("https://www.primevideo.com/detail/x")),
    ).toBe(true);
    expect(
      disneyPlusAdapter.matches(new URL("https://www.disneyplus.com/play/abc")),
    ).toBe(true);
    expect(
      appleTvAdapter.matches(new URL("https://tv.apple.com/show/xyz")),
    ).toBe(true);
  });

  it("detects netflix skip intro via data-uia", () => {
    document.body.innerHTML = `<button data-uia="player-skip-intro">Skip Intro</button>`;
    const action = netflixAdapter.detectIntro();
    expect(action?.type).toBe("intro");
    expect(action?.confidence).toBe("high");
  });

  it("detects localized skip labels", () => {
    document.body.innerHTML = `<button aria-label="Intro überspringen">Intro überspringen</button>`;
    const action = detectControl("intro", []);
    expect(action?.type).toBe("intro");
  });
});

it("never treats Watch credits or generic Continue as a skip command", () => {
  stubVisibleRect();
  document.body.innerHTML =
    "<button>Watch credits</button><button>Continue</button>";
  for (const adapter of adapters) {
    expect(adapter.detectCredits()).toBeNull();
    expect(adapter.detectStillWatching()).toBeNull();
  }
});

it("ignores Netflix's normal Next Episode toolbar button", () => {
  stubVisibleRect();
  document.body.innerHTML =
    '<button data-uia="control-next" aria-label="Next Episode">Next Episode</button>';
  expect(netflixAdapter.detectCredits()).toBeNull();
  document.body.innerHTML +=
    '<button data-uia="next-episode-seamless-button">Next Episode</button>';
  expect(netflixAdapter.detectCredits()?.element.dataset.uia).toBe(
    "next-episode-seamless-button",
  );
});

it("ignores controls faded out by a parent", () => {
  stubVisibleRect();
  document.body.innerHTML =
    '<div style="opacity:0"><button data-uia="next-episode-button">Next Episode</button></div>';
  expect(netflixAdapter.detectCredits()).toBeNull();
});

it("keeps Netflix's show title when controls hide, without using the episode title", () => {
  history.replaceState({}, "", "/watch/friends-1");
  document.body.innerHTML =
    '<div data-uia="video-title"><h4>Friends</h4><span>E6</span><span>The One with the Halloween Party</span></div>';
  expect(netflixAdapter.getSeriesTitle()).toBe("Friends");
  expect(netflixAdapter.getSeriesId()).toBe("title:friends");
  document.body.innerHTML = "";
  expect(netflixAdapter.getSeriesTitle()).toBe("Friends");
  history.replaceState({}, "", "/watch/different-show");
  expect(netflixAdapter.getSeriesTitle()).toBeNull();
});

it.each([primeVideoAdapter, disneyPlusAdapter])(
  "$displayName ignores ambiguous Next Episode and Watch recap controls",
  (adapter) => {
    stubVisibleRect();
    document.body.innerHTML =
      '<button aria-label="Next Episode">Next Episode</button><button aria-label="Watch intro">Watch intro</button><button aria-label="Watch recap">Watch recap</button>';
    expect(adapter.detectCredits()).toBeNull();
    expect(adapter.detectIntro()).toBeNull();
    expect(adapter.detectRecap()).toBeNull();
  },
);
