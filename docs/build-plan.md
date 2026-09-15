# Autonomous product polish plan

Owner direction (2026-09-15): make AutoSkip a complete, polished consumer extension and proceed autonomously. This is a concrete quality bar, not a promise that no future feature could exist.

## Milestone 1 — Reliable Netflix playback and clear controls

- [x] Inspect the open Friends player; distinguish the toolbar Next Episode control from end cards.
- [x] Add end-of-playback, observed-playback, deduplication, and cooldown safeguards.
- [x] Cache the show title while Netflix hides its controls.
- [x] Check playback changes before success feedback/counting.
- [x] Replace duplicated popup settings with four explained switches and one scope selector.
- [x] Simplify Settings and in-player labels.
- [x] Complete regression suite, documentation, package, and checkpoint commit (35 unit/fixture + 21 installed-browser tests passed; 1.0.1 ZIP built).

## Milestone 2 — A complete everyday experience

- [x] First-run welcome and guided, explicit opt-in choices.
- [x] Manage saved show preferences from Settings, including search and clear scope/reset behavior.
- [x] Convenient temporary global pause and clear automatic resume behavior.
- [x] System appearance support and a complete keyboard/accessibility pass.
- [x] Verify new flows in the installed-extension fixture browser.

## Milestone 3 — Release polish

- [x] Review the complete product for confusing copy, inconsistent behavior, and unnecessary features.
- [x] Refresh preview/store assets, behavior documentation, and live-test checklist.
- [x] Run final local checks and build the checksummed 1.1.0 ZIP.
- [x] Prepare draft PR/release notes and install instructions. Hosted CI and draft availability are tracked in GitHub PR #2.
- [x] Document the completed build and exact live-service checks in the behavior guide, release notes, and test checklist.
- [ ] Owner reloads the extension and validates current live streaming players before stable publication.

## Live evidence and boundaries

- Owner reported intro skipping and Undo feedback worked on Netflix/Friends, and six consecutive Next Episode activations.
- Read-only player inspection found `data-uia="control-next"` available around 3m31s into a ~21m52s episode. The old generic-label fallback matched it.
- Netflix renders the show name in `[data-uia="video-title"] h4`, then unmounts it when controls hide.
- The owner reloaded 1.1.0 alpha; the connected popup identified Friends. The owner subsequently confirmed: “the fix works!” for the repeated-advance issue. This is a live Netflix regression confirmation, not a pass for every action or streaming service.
- Prime Video and Disney+ live player tabs were not open during this follow-up. Their expanded automated checks use generated media and simulated streaming pages.

## Milestone 2 evidence

Version 1.1.0 alpha: 38 unit/fixture checks and 27 installed-browser checks pass. Covered flows include explicit setup consent, independent per-app settings, keyboard editing of saved shows, reset-to-app choices, pause expiry, responsive dark appearance, and downloaded backup/restore/cancel. The normal popup is 554px high. Runtime permissions remain storage only.

## Milestone 4 — Saved shows in the popup and matching service checks

- [x] Choosing **Only Friends** immediately creates a saved entry, even without changing a switch.
- [x] Add a **Your shows** popup view with a count, search, streaming-app filter, four editable choices, and removal that restores app defaults.
- [x] Reuse the show manager in Settings; preserve saved choices and separate identical show names on different apps.
- [x] Extend the Netflix playback scenarios to Prime Video and Disney+; remove ambiguous Next Episode and Watch recap matching.
- [x] Complete the expanded browser suite, refresh previews, and build the checksummed package. Hosted CI is tracked on draft PR #2.
- [ ] Live Prime Video and Disney+ playback checks after opening their players and reloading the new build.

### Milestone 4 evidence

41 unit/fixture tests and all 52 installed-extension scenarios pass locally. An older popup test needed its selector scoped to Watching after the addition of the separate saved-show editor. The final popup checks verify immediate save, persistence, same-name/app isolation, all four editable choices, deletion, and a single-show editor within 600px. The Watching popup with a saved show is 582px high. Previews and the 1.1.0 ZIP match this build; the alpha release remains a draft pending live tests.
