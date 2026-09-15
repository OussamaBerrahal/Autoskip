# AutoSkip

**Just watch. AutoSkip handles the buttons you've already decided you don't want to press.**

AutoSkip is a free and open-source Chromium extension that remembers repetitive streaming playback decisions — Skip Intro, Skip Recap, Next Episode, and Still Watching — and performs them automatically according to explicit local preferences.

> **You decide once. AutoSkip remembers.**

> **Status: 1.1.0 alpha, ready for live streaming tests.** Production packaging and automated browser checks are in place. Current service-player compatibility still needs the owner’s validation. See [the test checklist](docs/test-checklist.md).

## Features (V1)

- **Welcome setup** — explicitly enable intro/recap skipping on the streaming apps you choose
- **Saved shows** — search and edit show-specific choices in Settings
- **Pause for 30 minutes** — resume automatically without losing your choices
- **Light/dark appearance** — follows your system, with keyboard-friendly controls
- **First-encounter prompt** — Skip once · Always for this show · Always on Netflix
- **Smart prompt** — learns from repeated manual skips (local only)
- **Rules hierarchy** — session → series → service
- **Undo for seekable intro/recap skips** — restores playback and pauses that action; other actions offer **Pause this action**
- **Four explained switches** with a single show/app scope selector
- **Per-service enable toggles**
- **Settings** — per-app skip choices, saved shows, backup/restore, and tucked-away activity/troubleshooting
- **Local-first privacy** — no account, tracking, ads, or backend

## Supported platforms

| Service | Status |
| --- | --- |
| Netflix | Toolbar/title investigated live; patched playback retest pending |
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
6. On first install, use the welcome page to choose where intros/recaps are skipped, or choose as you watch. Updates preserve existing choices.

The prepared `dist/` or extracted ZIP can be loaded without running build commands. Follow [the live-test checklist](docs/test-checklist.md). Store materials are in [docs/store/listing.md](docs/store/listing.md).

See [the behavior guide](docs/behavior.md) for button meanings, the Friends investigation, and end-of-episode safeguards.

### Limits

- Next episode requires a supported end card, the final 5% (maximum 60 seconds), and at least 30 seconds of observed playback. Seeking directly to credits does not qualify. Netflix’s own autoplay is separate.

- Series matching uses available player titles; episode URLs are not treated as series IDs. If no series is identified, only explicit app-wide choices are offered. Netflix titles are remembered while the same episode’s controls hide.
- Undo lasts eight seconds and requires the same accessible, seekable video/URL. It does not navigate backwards after Next episode.
- Session pauses expire after four hours or at browser startup. Use **Resume** to clear one sooner. The global **Pause for 30 min** timer is separate and expires by the clock.
- Older counts may include ineffective clicks. New counts check playback changes; time-saved estimates are no longer displayed. Popup and Settings are English; in-player prompts have English/French/German/Spanish strings with English fallback.
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
