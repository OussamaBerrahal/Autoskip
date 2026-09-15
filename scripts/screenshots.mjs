import { mkdirSync, readFileSync } from "node:fs";
import { expect } from "@playwright/test";
import { launchHarness } from "../tests/e2e/harness.mjs";
const out = "docs/store/images";
mkdirSync(out, { recursive: true });
const inspect = process.argv.includes("--inspect");
const h = await launchHarness({ debugPort: inspect ? 9223 : undefined });
const player = await h.player();
await expect(player.getByRole("dialog")).toBeVisible();
await player.screenshot({
  animations: "disabled",
  path: `${out}/01-player-prompt.png`,
});
await player
  .getByRole("button", { name: "Always for this show", exact: true })
  .click();
await expect(
  player.getByRole("button", { name: "Undo", exact: true }),
).toBeVisible();
await player.screenshot({
  animations: "disabled",
  path: `${out}/02-player-undo.png`,
});
const popup = await h.context.newPage();
await popup.goto(`chrome-extension://${h.id}/popup.html`);
await player.bringToFront();
const state = await h.read();
await h.seed({ ...state, locale: "en" });
await expect(popup.locator("#service-name")).toHaveText("Netflix");
await popup.setViewportSize({ width: 360, height: 1000 });
mkdirSync("artifacts", { recursive: true });
const popupImage = await popup
  .locator("body")
  .screenshot({ path: "artifacts/popup-preview.png" });
const options = await h.context.newPage();
await options.goto(`chrome-extension://${h.id}/options.html`);
await expect(options.locator("#services .app-card")).toHaveCount(4);
await options.setViewportSize({ width: 1080, height: 900 });
await options
  .locator(".settings-shell")
  .screenshot({ path: "artifacts/settings-preview.png" });
const welcome = await h.context.newPage();
await welcome.goto(`chrome-extension://${h.id}/welcome.html`);
await welcome.setViewportSize({ width: 1180, height: 840 });
await welcome.screenshot({ path: "artifacts/welcome-preview.png" });
await popup.emulateMedia({ colorScheme: "dark" });
await popup
  .locator("body")
  .screenshot({ path: "artifacts/popup-dark-preview.png" });
await popup.getByRole("button", { name: "Your shows" }).click();
await popup.locator(".show-card summary").click();
await popup
  .locator("body")
  .screenshot({ path: "artifacts/popup-shows-dark-preview.png" });
await popup.emulateMedia({ colorScheme: "light" });
await popup
  .locator("body")
  .screenshot({ path: "artifacts/popup-shows-preview.png" });
await popup.getByRole("button", { name: "Watching", exact: true }).click();
const canvas = await h.context.newPage();
await canvas.setViewportSize({ width: 1280, height: 800 });
const icon = readFileSync("apps/extension/icons/icon128.png").toString(
  "base64",
);
const html = (heading, subheading, img, kind) =>
  `<!doctype html><html><head><style>*{box-sizing:border-box}body{margin:0;background:#eff5f1;color:#16392d;font-family:Arial,sans-serif}.page{width:1280px;height:800px;display:flex;align-items:center;justify-content:space-between;padding:64px 100px;background:radial-gradient(circle at 100% 0,#cde4d7,transparent 65%)}.copy{width:530px}.brand{display:flex;align-items:center;gap:14px;font-size:24px;font-weight:bold}.brand img{width:48px;height:48px}h1{font-size:58px;letter-spacing:-2.5px;line-height:1.07;margin:50px 0 28px}p{font-size:22px;color:#526e60;line-height:1.6}.badge{margin-top:40px;font-size:13px;border:1px solid #afc9b8;border-radius:20px;padding:10px 16px;display:inline-block}.shot{${kind === "popup" ? "width:360px;" : "width:425px;"}border-radius:16px;box-shadow:0 25px 65px #0b2a2226;border:1px solid #d5e4da}.note{font-size:12px;margin-top:26px;line-height:1.5}</style></head><body><main class="page"><section class="copy"><div class="brand"><img src="data:image/png;base64,${icon}">AutoSkip</div><h1>${heading}</h1><p>${subheading}</p><span class="badge">No account · No tracking · Local storage</span><div class="note">Actual extension interface. Example series and statistics from a simulated player.</div></section><img class="shot" src="data:image/png;base64,${img.toString("base64")}"></main></body></html>`;
await canvas.setContent(
  html(
    "Less clicking.<br>More watching.",
    "Four simple choices.<br>For one show or everything you watch.<br>Change your mind anytime.",
    popupImage,
    "popup",
  ),
);
await canvas.screenshot({ path: `${out}/03-popup-rules.png` });
await options.setViewportSize({ width: 1280, height: 800 });
await options.getByRole("button", { name: "Your shows" }).click();
await options.locator(".show-card summary").first().click();
await options.screenshot({ path: `${out}/04-options.png` });
await options.screenshot({ path: "artifacts/shows-preview.png" });
await welcome.setViewportSize({ width: 1280, height: 800 });
await welcome.screenshot({ path: `${out}/05-welcome.png` });
await canvas.setViewportSize({ width: 440, height: 280 });
await canvas.setContent(
  `<html><body style="margin:0;background:#123b2e;color:#f4fcf7;font-family:Arial;width:440px;height:280px;padding:32px;box-sizing:border-box"><div style="display:flex;align-items:center;gap:13px;font-size:27px;font-weight:bold"><img width="48" height="48" src="data:image/png;base64,${icon}">AutoSkip</div><h1 style="font-size:36px;letter-spacing:-1.4px;line-height:1.12;margin:23px 0 18px">You decide once.<br>AutoSkip remembers.</h1><p style="font-size:14px;color:#b9dccc">Streaming shortcuts. Local preferences.</p></body></html>`,
);
await canvas.screenshot({ path: `${out}/small-promo-440x280.png` });
console.log(`Store images saved to ${out}. Extension ID: ${h.id}`);
if (inspect) {
  await player.reload();
  await player.bringToFront();
  console.log(
    "Browser available on CDP port 9223. Stop this process when finished.",
  );
  await new Promise((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
}
await h.context.close();
