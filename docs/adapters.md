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
  skipIntro(action: DetectedAction): void
  skipRecap(action: DetectedAction): void
  continuePlayback(action: DetectedAction): void
}
```

## Detection rules of thumb

1. **Fail closed.** If confidence is weak, return `null`.
2. Prefer `data-*` / test ids and ARIA labels over brittle class names.
3. Always verify visibility before returning an element.
4. Support multiple UI languages via label lists.
5. Debounce and click-cooldowns are handled centrally — do not spam clicks inside adapters.

## Checklist for a new service

- [ ] Adapter file under `src/adapters/<service>/`
- [ ] Registered in `src/adapters/index.ts`
- [ ] Host permission + content-script match patterns added
- [ ] Unit tests for `matches()` and at least one detector
- [ ] Support matrix updated in README
