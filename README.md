# AutoSkip

**Just watch. AutoSkip handles the buttons you've already decided you don't want to press.**

AutoSkip is a free and open-source Chromium extension that remembers repetitive streaming playback decisions — Skip Intro, Skip Recap, Next Episode, and Still Watching — and performs them automatically according to explicit local preferences.

> **You decide once. AutoSkip remembers.**

> **Status: 1.0.0 alpha, ready for live streaming tests.** Production packaging and automated browser checks are in place. Current service-player compatibility still needs the owner’s validation. See [the test checklist](docs/test-checklist.md).

## Features (V1)

- **First-encounter prompt** — Skip once · Always for this series · Always on this service
- **Smart prompt** — learns from repeated manual skips (local only)
- **Rules hierarchy** — session → series → service
- **Undo for seekable intro/recap skips** — restores playback and pauses that action; other actions offer **Pause automation**
- **Session + lifetime time-saved stats**
- **Per-service enable toggles**
- **Options page** — prompt language, debug logging, validated export/import, reset local data
- **Local-first privacy** — no account, tracking, ads, or backend

## Supported platforms

| Service | Status |
| --- | --- |
| Netflix | Adapter + automated fixtures; live test pending |
| Prime Video | Adapter + automated fixtures; live test pending |
| Disney+ | Adapter + automated fixtures; live test pending |
| Apple TV+ | Adapter + automated fixtures; live test pending |
| Max / Hulu / Crunchyroll | Contributor wanted |

## Install (development)

```bash
npm ci
npx playwright install chromium
npm run check
node scripts/package.mjs
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder
4. Open a supported streaming site
5. Reload supported streaming tabs after installing/updating.
6. When Skip Intro appears, choose **Always for this series** if identified, or choose service defaults explicitly.

The prepared `dist/` or extracted ZIP can be loaded without running build commands. Follow [the live-test checklist](docs/test-checklist.md). Store materials are in [docs/store/listing.md](docs/store/listing.md).

### Limits

- Series matching uses available player titles; episode URLs are not treated as series IDs. If no series is identified, series settings are disabled.
- Undo lasts eight seconds and requires the same accessible, seekable video/URL. It does not navigate backwards after Next episode.
- Session pauses expire after four hours or at browser startup. Use **Resume automation** to clear one sooner.
- Statistics use rough duration estimates. Popup and Options are English; in-player prompts have English/French/German/Spanish strings with English fallback.
- Current DRM players, regional UI variants, and service fullscreen behavior must be tested live.

## How it works

```
Browser Extension
      │
      ├── Netflix / Prime / Disney+ / Apple TV+ adapters
              │
              ↓
        Detection Engine
              │
              ↓
          Rules Engine
          │          │
          ↓          ↓
      Action      Feedback + Undo
```

Preferences resolve as:

```
Service default
      ↓
Series override
      ↓
Session override   ← most specific wins
```

## Project layout

```
apps/extension/   Chrome MV3 entrypoints (background, content, popup, options)
src/adapters/     Per-service detection/action adapters
src/engine/       Detection controller and DOM helpers
src/rules/        Session / series / service preference resolution
src/storage/      Local state + statistics
src/ui/           In-page toast / smart prompt feedback
src/i18n/         Localized strings + multilingual control labels
tests/            Unit + fixture integration harness
docs/             Adapter authoring + release process
```

## Privacy

See [PRIVACY.md](./PRIVACY.md). Core functionality stores only local rules and aggregate skip statistics.

## Contributing

Adapter breakage is expected as streaming UIs change. See [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/adapters.md](./docs/adapters.md).

## License

[MIT](./LICENSE)
