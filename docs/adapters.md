# Adapter authoring guide

Each streaming service implements the shared `StreamingAdapter` contract in `src/types.ts`.

## Contract

```ts
interface StreamingAdapter {
  id: ServiceId
  displayName: string
  matches(url: URL): boolean
  getSeriesId(): string | null
  getSeriesTitle(): string | null
  detectIntro(): DetectedAction | null
  detectRecap(): DetectedAction | null
  detectCredits(): DetectedAction | null
  detectStillWatching(): DetectedAction | null
  skipIntro(action: DetectedAction): boolean
  skipRecap(action: DetectedAction): boolean
  continuePlayback(action: DetectedAction): boolean
}
```

## Detection rules of thumb

1. **Fail closed.** If confidence is weak, return `null`.
2. Prefer `data-*` / test ids and ARIA labels over brittle class names.
3. Always verify visibility before returning an element.
4. Support multiple UI languages via label lists.
5. Require a stable series title/identifier; never return an episode URL ID as a series ID. Return `null` if unsure.
6. Return the `safeClick` result from action methods so failed clicks cannot increment statistics.
7. Debounce and click-cooldowns are handled centrally — do not spam clicks inside adapters.

## Checklist for a new service

- [ ] Adapter file under `src/adapters/<service>/`
- [ ] Registered in `src/adapters/index.ts`
- [ ] Content-script match patterns added; request extra permissions only if the adapter needs them
- [ ] Unit tests for `matches()` and at least one detector
- [ ] Support matrix updated in README
