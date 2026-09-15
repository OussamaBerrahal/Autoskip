import { test, expect } from "@playwright/test";
import { launchHarness } from "./harness.mjs";
import { DEFAULT_STATE } from "../../src/types";

let h: Awaited<ReturnType<typeof launchHarness>>;
test.beforeEach(async () => {
  h = await launchHarness();
  await h.seed(structuredClone(DEFAULT_STATE));
});
test.afterEach(async () => {
  const errors = [...h.errors];
  await h.context.close();
  expect(errors).toEqual([]);
});

test("installed content script saves a series rule, skips, and really rewinds with Undo", async () => {
  const page = await h.player();
  await expect(
    page.getByRole("button", { name: "Always for this show", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Always for this show", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => (window as any).clicks)).toBe(1);
  await expect.poll(async () => (await h.read()).stats.intros).toBe(1);
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime),
    )
    .toBeCloseTo(12, 0);
  await expect.poll(async () => (await h.read()).stats.intros).toBe(0);
  await expect(page.getByRole("status")).toContainText(
    "Returned to before the skip",
  );
  await page.locator("#skip").evaluate((b: HTMLElement) => {
    b.hidden = false;
  });
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(1);
  expect(
    (await h.read()).seriesRules["netflix::title:a quiet orbit"].preferences
      .intro,
  ).toBe(true);
});

for (const service of ["netflix", "prime-video", "disney-plus", "apple-tv"]) {
  test(`${service}: recap is not skipped by an intro-only rule`, async () => {
    const state = structuredClone(DEFAULT_STATE);
    state.serviceRules[service] = {
      serviceId: service as any,
      preferences: { intro: true },
      updatedAt: Date.now(),
    };
    await h.seed(state);
    const page = await h.player({ service, action: "recap" });
    await expect(page.getByRole("dialog")).toContainText("Skip this recap?");
    expect(await page.evaluate(() => (window as any).clicks)).toBe(0);
    await page.getByRole("button", { name: "Skip once", exact: true }).click();
    await expect
      .poll(() => page.evaluate(() => (window as any).clicks))
      .toBe(1);
    expect((await h.read()).stats.intros).toBe(0);
  });
}

test("unknown series never exposes a series choice or widens the preference", async () => {
  const page = await h.player({ series: false });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Always for this show", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Skip once", exact: true }).click();
  expect((await h.read()).serviceRules).toEqual({});
});

test("manual learning counts genuine clicks and offers a smart prompt", async () => {
  const page = await h.player();
  await page.getByRole("button", { name: "Skip once", exact: true }).click();
  expect((await h.read()).manualSkipCounts).toEqual({});
  for (let count = 1; count <= 2; count++) {
    await page.reload();
    await page.locator("#skip").click();
    await expect
      .poll(
        async () =>
          (await h.read()).manualSkipCounts[
            "netflix::title:a quiet orbit::intro"
          ],
      )
      .toBe(count);
  }
  await page.reload();
  await expect(page.getByRole("dialog")).toContainText(
    "You usually skip this intro",
  );
});

test("service rule survives an episode navigation without duplicate clicks", async () => {
  const page = await h.player();
  await page
    .getByRole("button", { name: "Always on Netflix", exact: true })
    .click();
  await expect.poll(async () => (await h.read()).stats.intros).toBe(1);
  await page.evaluate(() => {
    history.pushState({}, "", "/watch/1002");
    document.querySelector<HTMLVideoElement>("video")!.currentTime = 12;
    document.querySelector<HTMLButtonElement>("#skip")!.hidden = false;
  });
  await expect.poll(async () => (await h.read()).stats.intros).toBe(2);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(2);
});

test("next episode offers Pause this action and never promises a rewind", async () => {
  const state = structuredClone(DEFAULT_STATE);
  state.serviceRules.netflix = {
    serviceId: "netflix",
    preferences: { credits: true },
    updatedAt: Date.now(),
  };
  await h.seed(state);
  const page = await h.player({ action: "credits" });
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(0);
  await page.locator("video").evaluate(async (v: HTMLVideoElement) => {
    v.currentTime = 70;
    v.playbackRate = 8;
    await v.play();
  });
  await expect
    .poll(async () => (await h.read()).stats.credits, { timeout: 15000 })
    .toBe(1);
  await expect(
    page.getByRole("button", { name: "Pause this action", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Pause this action", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await h.read()).sessionRules["netflix::title:a quiet orbit"]
          ?.preferences.credits,
    )
    .toBe(false);
});

test("options persist settings and reject malformed imports without changing state", async () => {
  const page = await h.context.newPage();
  await page.goto(`chrome-extension://${h.id}/options.html`);
  await page.getByLabel("AutoSkip on").uncheck();
  await expect.poll(async () => (await h.read()).enabled).toBe(false);
  await page.reload();
  await expect(page.getByLabel("AutoSkip on")).not.toBeChecked();
  await page.locator("#import-file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"enabled":"false"}'),
  });
  await expect(page.getByRole("status")).toContainText("Invalid preference");
  expect((await h.read()).enabled).toBe(false);
});

test("concurrent extension pages preserve all storage mutations", async () => {
  const pages = await Promise.all([h.context.newPage(), h.context.newPage()]);
  await Promise.all(
    pages.map((page) => page.goto(`chrome-extension://${h.id}/options.html`)),
  );
  await Promise.all(
    pages.map((page) =>
      page.evaluate(async () => {
        await Promise.all(
          Array.from({ length: 10 }, () =>
            chrome.runtime.sendMessage({
              type: "autoskip/mutate",
              mutation: { kind: "skip", action: "intro" },
            }),
          ),
        );
      }),
    ),
  );
  expect((await h.read()).stats.intros).toBe(20);
});

test("popup reads the active player and restores series defaults", async () => {
  const player = await h.player();
  await player
    .getByRole("button", { name: "Always for this show", exact: true })
    .click();
  const popup = await h.context.newPage();
  await popup.goto(`chrome-extension://${h.id}/popup.html`);
  await player.bringToFront();
  const state = await h.read();
  await h.seed({ ...state, debugLogging: true });
  await expect(popup.locator("#service-name")).toHaveText("Netflix");
  await expect(popup.locator('[data-action="intro"]')).toBeChecked();
  // Locator interaction need not focus the popup tab (the real action popup retains its player's tab).
  await popup
    .locator("#reset-series")
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect
    .poll(async () => Object.keys((await h.read()).seriesRules).length)
    .toBe(0);
});

test("a disabled skip control is never counted as a successful action", async () => {
  const page = await h.player();
  await page.locator("#skip").evaluate((button: HTMLButtonElement) => {
    button.disabled = true;
  });
  await page
    .getByRole("button", { name: "Always on Netflix", exact: true })
    .click();
  await page.waitForTimeout(1000);
  expect((await h.read()).stats.intros).toBe(0);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(0);
});

test("stale prompt choices after navigation do not change any rules", async () => {
  const page = await h.player();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => {
    history.pushState({}, "", "/watch/9999");
    const button = Array.from(
      document.querySelectorAll<HTMLButtonElement>("#autoskip-prompt button"),
    ).find((b) => b.textContent === "Always on Netflix");
    button?.click();
  });
  await page.waitForTimeout(1000);
  expect((await h.read()).serviceRules).toEqual({});
  expect(await page.evaluate(() => (window as any).clicks)).toBe(0);
});

test("disabled service removes its pending prompt and leaves the player alone", async () => {
  const page = await h.player();
  await expect(page.getByRole("dialog")).toBeVisible();
  const state = await h.read();
  state.services.netflix.enabled = false;
  await h.seed(state);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(0);
});

test("an existing prompt follows the player into and out of fullscreen", async () => {
  const page = await h.player();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .locator(".scene")
    .evaluate((scene: HTMLElement) => scene.requestFullscreen());
  await expect(page.locator(".scene #autoskip-prompt")).toBeVisible();
  await page.evaluate(() => document.exitFullscreen());
  await expect(page.locator("html > #autoskip-prompt")).toBeVisible();
});

test("Netflix toolbar cannot advance episodes even with Play next episode enabled", async () => {
  const state = structuredClone(DEFAULT_STATE);
  state.serviceRules.netflix = {
    serviceId: "netflix",
    preferences: { credits: true },
    updatedAt: Date.now(),
  };
  await h.seed(state);
  const page = await h.player({ action: "credits", toolbar: true });
  await page.locator("video").evaluate(async (v: HTMLVideoElement) => {
    v.currentTime = 70;
    v.playbackRate = 8;
    await v.play();
  });
  await page.waitForTimeout(6500);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(0);
  expect((await h.read()).stats.credits).toBe(0);
});

test("resuming several previously watched episodes near their end never causes a chain", async () => {
  const state = structuredClone(DEFAULT_STATE);
  state.serviceRules.netflix = {
    serviceId: "netflix",
    preferences: { credits: true },
    updatedAt: Date.now(),
  };
  await h.seed(state);
  const page = await h.player({ action: "credits" });
  for (let episode = 0; episode < 6; episode++) {
    await page.evaluate(async (episode) => {
      history.pushState({}, "", `/watch/resumed-${episode}`);
      const v = document.querySelector("video")!;
      v.currentTime = 115;
      await v.play();
    }, episode);
    await page.waitForTimeout(850);
  }
  expect(await page.evaluate(() => (window as any).clicks)).toBe(0);
  expect((await h.read()).stats.credits).toBe(0);
});

test("a no-effect intro click is attempted once, never counted, and never claims success", async () => {
  const state = structuredClone(DEFAULT_STATE);
  state.serviceRules.netflix = {
    serviceId: "netflix",
    preferences: { intro: true },
    updatedAt: Date.now(),
  };
  const page = await h.player({ noEffect: true });
  await h.seed(state);
  await expect.poll(() => page.evaluate(() => (window as any).clicks)).toBe(1);
  await page.locator("#skip").evaluate((b: HTMLButtonElement) => {
    const replacement = b.cloneNode(true) as HTMLButtonElement;
    replacement.onclick = () => {
      (window as any).clicks++;
    };
    b.replaceWith(replacement);
  });
  await page.waitForTimeout(3000);
  expect((await h.read()).stats.intros).toBe(0);
  expect(await page.evaluate(() => (window as any).clicks)).toBe(1);
  await expect(page.locator("#autoskip-toast")).toHaveCount(0);
});

test("Keep watching resumes the paused video without advancing to another episode", async () => {
  const state = structuredClone(DEFAULT_STATE);
  state.serviceRules.netflix = {
    serviceId: "netflix",
    preferences: { stillWatching: true },
    updatedAt: Date.now(),
  };
  await h.seed(state);
  const page = await h.player({ action: "stillWatching" });
  await expect.poll(async () => (await h.read()).stats.stillWatching).toBe(1);
  await expect
    .poll(() =>
      page.locator("video").evaluate((v: HTMLVideoElement) => v.paused),
    )
    .toBe(false);
  expect(page.url()).toContain("/watch/1001");
  expect((await h.read()).stats.credits).toBe(0);
});

test("popup has one set of choices and saves only to the selected scope", async () => {
  const player = await h.player({ series: false });
  const popup = await h.context.newPage();
  await popup.goto(`chrome-extension://${h.id}/popup.html`);
  await player.bringToFront();
  await h.seed({ ...(await h.read()), locale: "en" });
  await expect(popup.locator("#player-settings")).toBeVisible();
  await expect(popup.locator("#choices input")).toHaveCount(4);
  await expect(popup.locator("#scope option")).toHaveCount(1);
  await expect(
    popup.getByRole("switch", { name: "Skip intros", exact: true }),
  ).toBeEnabled();
  await popup
    .locator('[data-action="intro"]')
    .evaluate((input: HTMLInputElement) => input.click());
  await expect
    .poll(async () => (await h.read()).serviceRules.netflix?.preferences.intro)
    .toBe(true);
  expect((await h.read()).seriesRules).toEqual({});
  const height = await popup.locator("body").evaluate((el) => el.scrollHeight);
  expect(height).toBeLessThanOrEqual(600);
  await expect(popup.locator("#options-link")).toBeVisible();
  await popup
    .locator("#enabled")
    .evaluate((input: HTMLInputElement) => input.click());
  await expect(
    popup.getByRole("switch", { name: "Skip intros", exact: true }),
  ).toBeDisabled();
  await expect(popup.locator("#disabled-message")).toContainText(
    "AutoSkip is off",
  );
});
