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

- [ ] First-run welcome and guided, explicit opt-in choices.
- [ ] Manage saved show preferences from Settings, including search and clear scope/reset behavior.
- [ ] Convenient temporary global pause and clear automatic resume behavior.
- [ ] System appearance support and a complete keyboard/accessibility pass.
- [ ] Verify new flows in the installed-extension fixture browser.

## Milestone 3 — Release polish

- [ ] Review the complete product for confusing copy, inconsistent behavior, and unnecessary features.
- [ ] Refresh preview/store assets, behavior documentation, and live-test checklist.
- [ ] Run final checks, build the ZIP, update the draft PR/release, and verify CI.
- [ ] Report what is complete and the exact remaining live-service checks.

## Live evidence and boundaries

- Owner reported intro skipping and Undo feedback worked on Netflix/Friends, and six consecutive Next Episode activations.
- Read-only player inspection found `data-uia="control-next"` available around 3m31s into a ~21m52s episode. The old generic-label fallback matched it.
- Netflix renders the show name in `[data-uia="video-title"] h4`, then unmounts it when controls hide.
- The patched extension still needs the owner's manual reload and live playback validation. Automated checks use generated media and simulated streaming pages.
