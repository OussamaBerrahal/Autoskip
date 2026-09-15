import { chromium } from "@playwright/test";
import { resolve } from "node:path";

export const urls = {
  netflix: "https://www.netflix.com/watch/1001",
  "prime-video": "https://www.primevideo.com/detail/episode-1",
  "disney-plus": "https://www.disneyplus.com/play/episode-1",
  "apple-tv": "https://tv.apple.com/episode/example/episode-1",
};
// Generated silence: no third-party media, accounts, or outbound streaming requests.
const pcm = Buffer.alloc(120 * 8000 * 2);
const wav = Buffer.alloc(44 + pcm.length);
wav.write("RIFF");
wav.writeUInt32LE(36 + pcm.length, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(8000, 24);
wav.writeUInt32LE(16000, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(pcm.length, 40);
pcm.copy(wav, 44);

export function playerHtml({
  service = "netflix",
  action = "intro",
  series = true,
  toolbar = false,
  noEffect = false,
} = {}) {
  const labels = {
    intro: "Skip Intro",
    recap: "Skip Recap",
    credits: "Next Episode",
    stillWatching: "Continue watching",
  };
  const selectors = {
    netflix: {
      intro: 'data-uia="player-skip-intro"',
      recap: 'data-uia="player-skip-recap"',
      credits: 'data-uia="next-episode-button"',
      stillWatching: 'data-uia="interrupt-autoplay-continue"',
    },
    "prime-video": {
      intro: 'class="atvwebplayersdk-skipelement-button"',
      recap: 'class="atvwebplayersdk-skipelement-button"',
    },
    "disney-plus": {
      intro: 'data-testid="skip-button"',
      recap: 'data-testid="skip-button"',
    },
    "apple-tv": {
      intro: 'data-testid="skip-button"',
      recap: 'data-testid="skip-button"',
    },
  };
  const seriesAttr = {
    netflix: 'data-uia="video-title"',
    "prime-video": 'class="atvwebplayersdk-title-text"',
    "disney-plus": 'data-testid="title"',
    "apple-tv": 'data-testid="series-title"',
  }[service];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>AutoSkip demo player</title><style>
  *{box-sizing:border-box}body{margin:0;background:#101d22;color:#f3faf7;font-family:Arial,sans-serif}header{padding:35px 64px;display:flex;justify-content:space-between;align-items:center}header b{font-size:24px;letter-spacing:-1px}header span{color:#9ab0a7;font-size:13px}.scene{margin:0 64px;position:relative;height:550px;background:radial-gradient(ellipse at 70% 35%,#365a51,#172c32 65%);border:1px solid #416057;border-radius:20px;overflow:hidden}.copy{position:absolute;left:44px;top:35px;z-index:1}.copy p{color:#a7bfb4;font-size:12px;letter-spacing:3px}.copy h1{font-size:48px;letter-spacing:-2px;margin:16px 0}.copy small{color:#b0c4bc}video{position:absolute;width:100%;height:100%;opacity:.18}#skip{position:absolute;right:40px;bottom:50px;border:1px solid #9db6aa;background:#ecf5f0;color:#172923;padding:13px 22px;border-radius:8px;font:600 15px Arial;cursor:pointer}footer{padding:22px 64px;color:#9ab0a7;font-size:13px;display:flex;justify-content:space-between}.demo{color:#64cda9}
  </style></head><body><header><b>AutoSkip <span class="demo">/ demo player</span></b><span>Example content · No streaming account connected</span></header>
  <main class="scene"><video src="/autoskip-fixture.wav" preload="auto" muted></video><div class="copy"><p>AN EXAMPLE SERIES</p><h1 ${series ? seriesAttr : ""}>A Quiet Orbit</h1><small>Season 1 · Episode 1</small></div><button id="skip" ${toolbar ? 'data-uia="control-next"' : (selectors[service]?.[action] ?? "")} aria-label="${labels[action]}">${labels[action]}</button></main><footer><span>You decide once. AutoSkip remembers.</span><span>Local preferences · No account · No tracking</span></footer>
  <script>window.clicks=0;document.querySelector('#skip').addEventListener('click',()=>{window.clicks++;const v=document.querySelector('video');${noEffect ? "" : action === "credits" ? `history.pushState({},'', '/watch/1002');v.currentTime=0;document.querySelector('#skip').hidden=true;` : action === "stillWatching" ? `v.play();document.querySelector('#skip').hidden=true;` : `v.currentTime=102;document.querySelector('#skip').hidden=true;`}});</script></body></html>`;
}
export async function launchHarness(options = {}) {
  const extension = resolve("dist");
  const context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
      ...(options.debugPort
        ? [`--remote-debugging-port=${options.debugPort}`]
        : []),
    ],
  });
  let current = {};
  await context.route("https://**/*", async (route) => {
    const url = new URL(route.request().url());
    if (
      !Object.values(urls).some((value) => new URL(value).origin === url.origin)
    )
      return route.abort();
    if (url.pathname === "/autoskip-fixture.wav") {
      const range = route.request().headers().range;
      if (range) {
        const start = Number(range.match(/bytes=(\d+)/)?.[1] ?? 0);
        return route.fulfill({
          status: 206,
          contentType: "audio/wav",
          headers: {
            "content-range": `bytes ${start}-${wav.length - 1}/${wav.length}`,
            "accept-ranges": "bytes",
          },
          body: wav.subarray(start),
        });
      }
      return route.fulfill({
        contentType: "audio/wav",
        headers: { "accept-ranges": "bytes" },
        body: wav,
      });
    }
    if (route.request().resourceType() === "document")
      return route.fulfill({
        contentType: "text/html",
        body: playerHtml(current),
      });
    return route.abort();
  });
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  const id = worker.url().split("/")[2];
  const errors = [];
  context.on("page", (page) =>
    page.on("pageerror", (error) => errors.push(error.message)),
  );
  const read = () =>
    worker.evaluate(
      async () =>
        (await chrome.storage.local.get("autoskip_state_v1")).autoskip_state_v1,
    );
  const seed = (state) =>
    worker.evaluate(
      async (state) => chrome.storage.local.set({ autoskip_state_v1: state }),
      state,
    );
  const player = async (config = {}) => {
    current = config;
    const page = await context.newPage();
    await page.goto(urls[config.service ?? "netflix"]);
    await page.waitForFunction(() => {
      const v = document.querySelector("video");
      return v?.readyState >= 2 && v.seekable.length > 0;
    });
    await page.evaluate(() => {
      document.querySelector("video").currentTime = 12;
    });
    return page;
  };
  return { context, worker, id, errors, read, seed, player };
}
