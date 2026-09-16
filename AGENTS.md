# AutoSkip product and engineering direction

AutoSkip is a consumer Chrome extension. Its job is to remove repetitive playback clicks while keeping the viewer in control. The owner has authorized autonomous implementation and reversible local verification. Keep the interface approachable to someone who has never used a browser extension.

## Product priorities

1. Playback safety comes first. A regular Next Episode toolbar button is never an end-of-episode prompt. Never chain through previously watched episodes.
2. Four distinct choices: Skip intros, Skip recaps, Play next episode, Keep watching. Explain each in one sentence.
3. A single set of controls with an explicit scope: all shows on a streaming app, or just the current show. Preserve existing choices.
4. Provide a welcoming first run, useful show management, clear pause/resume feedback, and a coherent, accessible visual design.
5. Keep technical terms, logs, reset tools, and detailed counts in secondary Settings sections. No speculative time-saved claims.
6. Stay local, lightweight, and private. No accounts, telemetry, remote code, unnecessary permissions, or third-party media in demos.

## Autonomous workflow

- Inspect existing work and the active task before changing direction. Maintain `docs/build-plan.md` with concrete milestones and evidence.
- Complete focused implementation and relevant checks before starting another feature. Preserve a working packaged build at each milestone.
- Prefer improvements that remove real viewer friction. Do not add features simply to increase the feature count.
- Use the owner's connected streaming player for read-only investigation unless playback interaction is explicitly requested. Use isolated fixture browsers for repeatable automated tests.
- Never work around a tool or URL policy block. Loading/reloading the unpacked extension in the owner's Chrome is a manual owner step when browser tools cannot do it.
- Never silently reset or overwrite the owner's preferences. Reversible local development and fixture-state setup are authorized.
- Keep releases and store submissions in draft until the owner completes live service tests. Do not claim synthetic fixture tests verify current DRM players.
- No software is literally impossible to improve. Report the completed quality bar, real verification, and remaining external validation honestly.

## Definition of a polished build

- No known episode-loop, wrong-action, duplicate-click, or false-success regressions in covered scenarios.
- A nontechnical viewer can set up AutoSkip and understand every primary control without a manual.
- Main popup fits Chrome's 600px limit in its standard state; keyboard navigation, focus visibility, contrast, and reduced motion are considered.
- Settings can manage streaming apps and saved shows and support safe backup/restore.
- Unit tests, installed-extension browser tests, TypeScript, production build, package validation, and relevant CI checks pass.
- Screenshots, behavior guide, release notes, and a checksummed installable ZIP match the build.
