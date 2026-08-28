/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { findButtonByLabels, isVisible, toDetectedAction } from "../src/engine/dom";
import { netflixAdapter } from "../src/adapters/netflix";

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

describe("netflix adapter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    stubVisibleRect();
  });

  it("matches netflix hosts", () => {
    expect(netflixAdapter.matches(new URL("https://www.netflix.com/watch/123"))).toBe(true);
    expect(netflixAdapter.matches(new URL("https://example.com"))).toBe(false);
  });

  it("detects skip intro via data-uia", () => {
    document.body.innerHTML = `<button data-uia="player-skip-intro">Skip Intro</button>`;
    const action = netflixAdapter.detectIntro();
    expect(action?.type).toBe("intro");
    expect(action?.confidence).toBe("high");
  });
});
