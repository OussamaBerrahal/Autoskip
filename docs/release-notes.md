# AutoSkip 1.0.1 alpha — Netflix safety and simpler controls

Fixes the repeated Netflix episode advances reported while watching Friends and replaces the duplicated, technical popup with four explained choices.

## Changes

- Exclude Netflix's regular Next Episode toolbar button; recognize only supported end cards.
- Require near-end playback and 30 seconds of observed media progress; prevent duplicate attempts and rapid consecutive advances.
- Read the actual show heading and remember it while Netflix's controls hide.
- Confirm playback changes before automatic success feedback/counting. Preserve historical counts and explain their limitations in Settings.
- One set of switches with an explicit all-shows/current-show selector, clear off/pause states, and an always-visible Settings link.
- Simplify Settings, backup/restore, activity, and troubleshooting. Keep intro/recap Undo and use plain in-player action labels.

## Verification

35 unit/fixture checks plus 21 installed Chromium extension checks cover detection, playback safety, actual rewind, preference storage, popup scope, fullscreen placement, no-effect clicks, and previously watched episode chains. Production packaging checks the content script and all runtime assets.

Live read-only inspection confirmed the old toolbar/title failure on Netflix. The owner reported working intro skipping and Undo feedback. Updated end-card handling still requires the owner's live test; fixture passes are not live streaming compatibility claims.

## Install

Extract `autoskip-1.0.1.zip` and load the folder containing `manifest.json` in Chrome's extension manager. If using the existing repository `dist/`, reload AutoSkip there. Reload Netflix afterwards. See [the test checklist](test-checklist.md) and [behavior guide](behavior.md).
