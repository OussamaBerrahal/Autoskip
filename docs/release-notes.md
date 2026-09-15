# AutoSkip 1.1.0 alpha — settle in and keep watching

A simpler, more complete viewing companion, including the fix for repeated Netflix episode advances reported on Friends.

## What changed

- **Clear controls:** four explained switches and one choice of scope: the streaming app or the current show.
- **Safer next episode:** ignores Netflix's regular toolbar button, requires a supported marker near the end after observed playback, and prevents repeated attempts and rapid episode chains. Prime Video and Disney+ no longer qualify buttons from a generic Next Episode label; ambiguous Watch intro/recap matches are excluded.
- **Reliable feedback:** preserves intro/recap Undo, remembers Netflix's show title when controls hide, and checks playback changes before counting an automatic action. Existing counts are retained.
- **Easy setup:** a welcome page on first install, with explicit intro/recap opt-in for selected apps. Updates preserve your choices.
- **Your shows:** **Only Friends** saves immediately. The popup now has a **Your shows** view with a count, search, app filter, editing, and removal that restores app defaults. The same list is available in Settings, including when no player is open.
- **Take a break:** pause AutoSkip for 30 minutes and resume automatically, or turn it off until you choose to turn it on.
- **A calmer interface:** system light/dark appearance, keyboard-friendly forms, narrow-window layouts, clear help, and backup/restore that preserves show choices and counts.
- **Local and lightweight:** no accounts, tracking, new permissions, backend, or remote code.

## Verification

- 41 unit/fixture tests and 52 installed Chromium extension scenarios pass (93 total).
- TypeScript, production build, content-script syntax, runtime assets, and package checks pass.
- The browser suite runs matching playback regressions on Netflix, Prime Video, and Disney+ fixtures, including rewind, episode-loop prevention, fullscreen, and saved-show creation/editing/removal. It also covers consent, saved-show keyboard editing, temporary pause expiry, and real downloaded backup/restore/cancel.
- Interface previews use the actual extension with a clearly labelled simulated player and generated media.

The owner reported live intro skipping and Undo feedback working. Read-only Netflix inspection identified the old toolbar/title issues. After reloading the build, the owner confirmed that the Netflix repeated-advance fix works. Other Netflix action/fullscreen checks and live Prime Video/Disney+ validation remain pending. Simulated player tests do not establish current DRM-player compatibility.

## Install or update

Use the prepared repository `dist/` or extract `autoskip-1.1.0.zip`. In Chrome's extension manager, reload AutoSkip or load the extracted folder containing `manifest.json`. **Reload Netflix and any other open streaming tabs afterwards.**

Your existing choices are preserved. Open Settings → Getting started to revisit the welcome page after an update. See [the behavior guide](behavior.md) and [live-test checklist](test-checklist.md).

The build remains an alpha/draft until live testing is complete. No store submission or stable publication is included.
