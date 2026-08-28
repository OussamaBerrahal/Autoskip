/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { findButtonByLabels, isVisible, toDetectedAction } from "../src/engine/dom";
import { adapters, netflixAdapter, primeVideoAdapter, disneyPlusAdapter, appleTvAdapter } from "../src/adapters";
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
    expect(netflixAdapter.matches(new URL("https://www.netflix.com/watch/123"))).toBe(true);
    expect(primeVideoAdapter.matches(new URL("https://www.primevideo.com/detail/x"))).toBe(true);
    expect(disneyPlusAdapter.matches(new URL("https://www.disneyplus.com/play/abc"))).toBe(true);
    expect(appleTvAdapter.matches(new URL("https://tv.apple.com/show/xyz"))).toBe(true);
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
