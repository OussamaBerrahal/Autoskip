# AutoSkip

**Just watch. AutoSkip handles the buttons you've already decided you don't want to press.**

AutoSkip is a free and open-source Chromium extension that remembers repetitive streaming playback decisions — Skip Intro, Skip Recap, Next Episode, and Still Watching — and performs them automatically according to explicit local preferences.

> **You decide once. AutoSkip remembers.**

## Principles

- **User intent before automation** — never configure itself without consent
- **Reversible by default** — every automatic action can be undone / paused
- **Context beats globals** — session → series → service rule hierarchy
- **Local-first and private** — no account, no tracking, no backend for core functionality
- **Open by default** — MIT licensed, inspectable adapters and permissions

## Supported platforms (V1)

| Service | Status |
| --- | --- |
| Netflix | Supported |
| Prime Video | Supported (initial selectors) |
| Disney+ | Supported (initial selectors) |
| Apple TV+ | Supported (initial selectors) |
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
4. Open a supported streaming site and use the popup to enable Skip Intro for the current series or service

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

## Privacy

See [PRIVACY.md](./PRIVACY.md). Core functionality stores only local rules and aggregate skip statistics.

## Contributing

Adapter breakage is expected as streaming UIs change. See [CONTRIBUTING.md](./CONTRIBUTING.md) and [docs/adapters.md](./docs/adapters.md).

## License

[MIT](./LICENSE)
