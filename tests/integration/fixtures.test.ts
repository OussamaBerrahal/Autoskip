/**
 * Integration-style fixture harness for adapter detection.
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import { netflixAdapter } from "../../src/adapters/netflix";
import { primeVideoAdapter } from "../../src/adapters/prime-video";
import { disneyPlusAdapter } from "../../src/adapters/disney-plus";
import { appleTvAdapter } from "../../src/adapters/apple-tv";

const here = dirname(fileURLToPath(import.meta.url));

function stubVisibleRect() {
  Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
    configurable: true,
    value() {
      return DOMRect.fromRect({ x: 0, y: 0, width: 160, height: 48 });
    },
  });
}

function loadFixture(name: string): void {
  const html = readFileSync(resolve(here, "..", "fixtures", name), "utf8");
  document.body.innerHTML = html;
}

describe("fixture harness", () => {
  beforeEach(() => {
    stubVisibleRect();
  });

  it("detects Netflix intro/recap/next from fixture", () => {
    loadFixture("netflix-player.html");
    expect(netflixAdapter.detectIntro()?.type).toBe("intro");
    expect(netflixAdapter.detectRecap()?.type).toBe("recap");
    expect(netflixAdapter.detectCredits()?.type).toBe("credits");
  });

  it("detects Prime Video skip from fixture", () => {
    loadFixture("prime-player.html");
    expect(primeVideoAdapter.detectIntro()?.type).toBe("intro");
  });

  it("detects Disney+ skip from fixture", () => {
    loadFixture("disney-player.html");
    expect(disneyPlusAdapter.detectIntro()?.type).toBe("intro");
  });

  it("detects Apple TV+ skip from fixture", () => {
    loadFixture("appletv-player.html");
    expect(appleTvAdapter.detectIntro()?.type).toBe("intro");
  });
});
