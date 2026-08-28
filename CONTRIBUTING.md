# Contributing to AutoSkip

Thanks for helping keep AutoSkip reliable across streaming UIs that change often.

## Development setup

```bash
npm install
npm test
npm run build
```

Load `dist/` as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

## Project layout

```
apps/extension/   Chrome MV3 entrypoints (background, content, popup, options)
src/adapters/     Per-service detection/action adapters
src/engine/       Detection controller and DOM helpers
src/rules/        Session / series / service preference resolution
src/storage/      Local state + statistics
src/ui/           In-page toast / smart prompt feedback
src/i18n/         Localized prompt/toast copy + control labels
tests/            Unit tests + HTML fixture harness
```

## Adding or fixing an adapter

1. Prefer precision over aggressive matching.
2. Combine stable attributes, ARIA labels, visible-text fallbacks, and visibility checks.
3. Keep selectors inside the service adapter — never hard-code platform details into the shared controller.
4. Add a fixture under `tests/fixtures/` and cover it in `tests/integration/fixtures.test.ts`.
5. Document any new host permissions in `PRIVACY.md` and `apps/extension/manifest.json`.

## Pull requests

- Keep PRs focused (one adapter or one subsystem when possible)
- Include reproduction notes for player UI changes
- Confirm `npm test` and `npm run build` pass
- Use the issue templates for adapter breakage reports
