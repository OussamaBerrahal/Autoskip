# AutoSkip

**Just watch. AutoSkip handles the buttons you've already decided you don't want to press.**

AutoSkip is a free and open-source Chromium extension that remembers repetitive streaming playback decisions — Skip Intro, Skip Recap, Next Episode, and Still Watching — and performs them automatically according to explicit local preferences.

> **You decide once. AutoSkip remembers.**

## Features (V1)

- **First-encounter prompt** — Skip once · Always for this series · Always on this service
- **Smart prompt** — learns from repeated manual skips (local only)
- **Rules hierarchy** — session → series → service
- **Undo toast** after every automatic action
- **Session + lifetime time-saved stats**
- **Per-service enable toggles**
- **Options page** — locale, debug logging, export/import preferences
- **Local-first privacy** — no account, tracking, ads, or backend

## Supported platforms

| Service | Status |
| --- | --- |
| Netflix | Supported |
| Prime Video | Supported |
| Disney+ | Supported |
| Apple TV+ | Supported |
| Max / Hulu / Crunchyroll | Contributor wanted |

## Install (development)

```bash
npm install
npm test
npm run build
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder
4. Open a supported streaming site
5. When Skip Intro appears, choose **Always for this series** (or configure via the popup)

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
