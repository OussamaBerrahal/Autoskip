# Build and release

## Prepare a test build

```bash
npm ci
npx playwright install chromium
npm run check
node scripts/package.mjs
npm run screenshots
```

On Linux CI, use `npx playwright install --with-deps chromium`.

- `dist/`: extension directory for Load unpacked.
- `artifacts/autoskip-1.0.0.zip`: package with `manifest.json` at the root, no tests/source maps/development code.
- Adjacent `.sha256`: checksum for the exact ZIP.
- `docs/store/images/`: four 1280 × 800 screenshots and one 440 × 280 promotional image.
- `docs/store/listing.md`: store copy, privacy disclosures, permission explanations, asset paths.
- `docs/test-checklist.md`: live-service validation for the owner.

`npm run dev` watches the UI/worker and content script builds. Reload the extension and streaming tabs after changes. A build verifies the content script as a classic script to catch module-import errors before packaging.

## CI

Every pull request and push to main runs unit tests, type checking, production build/package validation, and Chromium tests with the extension actually installed. CI uploads a test ZIP and checksum. Browser tests intercept service URLs with local fixture responses and generated silent media; they do not access accounts or live streaming content.

## Release after live testing

1. Complete `docs/test-checklist.md`; fix failures and rerun `npm run check`.
2. Merge the tested branch. For a stable release, remove the alpha `version_name` from the manifest and update package/manifest versions together if needed.
3. Regenerate store screenshots and confirm the copy/privacy links refer to the merged version.
4. Tag a reviewed commit (example for an alpha: `v1.0.0-alpha.1`) and push that exact tag.
5. The Release workflow reruns all checks, packages the build, and creates a **draft prerelease** with the ZIP and checksum. It does not publish or submit to the store automatically.
6. Review the draft and owner test results before publishing it or submitting the ZIP to the Chrome Web Store.

## Store preparation

- [x] Actual-interface screenshots using a clearly labelled demo player.
- [x] 440 × 280 small promotional image and existing 128 × 128 icon.
- [x] Single-purpose listing description and permission justification.
- [x] Privacy policy reflects local series preferences, learning, bookmarks, import/export, and deletion.
- [x] No remote code, accounts, ads, or analytics in the extension.
- [ ] Owner verifies each live streaming service and fullscreen player.
- [ ] Owner confirms dashboard/account details and submits the reviewed package.

The unchecked items depend on the owner's live tests and store account; publication is intentionally pending those steps.
