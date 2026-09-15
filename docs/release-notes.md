# AutoSkip 1.0.0 alpha — browser test build

This build fixes a packaging error that prevented Chrome from starting the playback automation script. It is prepared for live streaming validation; it is not yet a verified stable release.

## Changes

- Bundle the manifest content script into a single classic script. Verify syntax and packaged assets on every build.
- Restore the original playback position when Undo is available for an intro/recap. Undo also reverses the skip statistic and pauses that action for the session. Other actions offer an explicitly labelled Pause automation button.
- Keep unrelated service defaults when adding a series or session override. Unknown series never silently create service-wide rules. Remove series overrides and resume session-paused automation from the popup.
- Separate recap detection from intro detection; remove ambiguous Watch credits and generic Continue matches. Require a visible player for controller actions.
- Count real manual interactions only, preserve toast visibility across scans, ignore stale prompts after navigation, and count only successfully dispatched control clicks.
- Serialize state mutations in the extension worker. Validate imports and add complete local-data reset.
- Remove unnecessary activeTab/host_permissions grants; restrict Amazon injection to Video paths.
- Add installed-extension browser coverage, CI artifacts, checksummed ZIP packaging, and a draft-only release workflow.

## Validation

- 24 unit/fixture tests, TypeScript, production build, and package validation pass.
- 16 installed Chromium extension tests pass and use real extension storage and messaging with locally simulated pages for all four services.
- Live Netflix, Prime Video, Disney+, and Apple TV+ player validation remains with the tester. Do not interpret simulated-player passes as proof of current streaming-site compatibility.

## Install

Extract `autoskip-1.0.0.zip`, open `chrome://extensions`, enable Developer mode, and Load unpacked → the extracted folder containing `manifest.json`. If already loaded, use Reload. Refresh streaming tabs after updating.

Follow [the live-site checklist](test-checklist.md). Intro/recap rewind requires an accessible, seekable video and the same video/URL. Other actions can be paused but cannot be rewound. Per-series matching depends on titles exposed by the player; popup and Options remain English.
