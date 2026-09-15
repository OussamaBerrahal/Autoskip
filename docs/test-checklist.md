# AutoSkip alpha: live streaming test

## Load this build

1. Open `chrome://extensions` in Chrome 120 or newer.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose the repository's `dist/` directory.
   If using the ZIP, extract it first and choose the extracted directory containing `manifest.json`.
4. If AutoSkip is already installed unpacked, click its **Reload** button.
5. **Reload each streaming tab** after installing/updating the extension.
6. Open a supported player using your normal streaming account. Pin AutoSkip for easier access.

No terminal or build commands are needed when using the prepared ZIP or local `dist/`.
For a fresh checkout: `npm ci && npm run build`.

## New in 1.1: everyday checks

- Fresh installation opens the welcome page. Nothing skips until you choose; selecting only Netflix must not set skip choices on other apps.
- In the popup, choose **Only Friends** or **All Netflix shows** and verify there is one set of switches.
- Open Settings → **Your shows**, find Friends, change a choice, then restore its Netflix settings.
- Click **Pause for 30 min**. All AutoSkip actions/prompts pause; **Resume AutoSkip** restores saved choices. Turning **Off** remains off without a timer.
- Check light/dark appearance and keyboard navigation. The ordinary popup should fit without scrolling.
- Save a backup, restore it, and verify show choices and counts survive. Cancelling a restore leaves data intact.

## Friends regression checks

- With **Play next episode** enabled, show Netflix's normal player controls mid-episode. Its toolbar Next Episode button must stay untouched.
- Resume an already-watched episode near the end. AutoSkip must not immediately advance through several episodes.
- Watch at least 30 seconds and reach the actual end card naturally. At most one automatic advance may occur. Seeking directly to the credits is intentionally insufficient.
- Show Netflix's controls once, then hide them. The popup should retain **Friends** for that episode.
- Verify intro and recap skips independently. Undo should actually rewind and reduce the automatic count.
- Netflix's own autoplay is independent; distinguish a native countdown advance from an AutoSkip action.

## Test each service

Repeat for Netflix, Prime Video, Disney+, and Apple TV+. Treat the rows as independent scenarios: reset local data between conflicting preference/discovery scenarios. Start with **Settings → Activity & resets → Reset AutoSkip** if you want a clean test; export a backup first if keeping existing preferences.

| Check | Expected result |
| --- | --- |
| A visible Skip Intro control appears | AutoSkip asks what to do; nothing skips before your choice |
| Choose Skip once | One click; no permanent rule; it is not counted as a manual skip |
| After a reset, choose Always for this show | One skip; the popup identifies the series and checks Skip intros |
| Watch the next episode of that series | The same preference applies if the service exposes a consistent series title |
| Change to another series | The first series' choice does not apply |
| Choose Always on Netflix | The setting applies to other series on this service |
| Recap appears with only intros enabled | It is not skipped as an intro |
| Click Undo on an automatic intro/recap | Playback returns to before the skip; that skip is removed from stats; the action pauses for this session |
| Undo cannot be supported for this player | Button says Pause this action; it does not promise a rewind |
| Choose Next episode or Keep watching in the popup | Next episode requires a supported end card near the end after observed playback. Keep watching only answers its confirmation. Feedback offers Pause this action |
| After a pause, click Resume in the popup | Saved series/service preferences become effective again |
| Disable AutoSkip or disable this service | No automation; pending preference prompt disappears |
| Toggle another action for this series | Unrelated service defaults stay effective |
| Click Use my Netflix settings | Removes the current series overrides |
| Series is not identified | Only the All shows choice is offered; no disabled duplicate controls |
| Skip manually twice, then encounter that control again | A smart preference prompt appears, unless you already configured/dismissed that action |
| Enter/exit fullscreen | Prompt and feedback remain visible in the service's fullscreen player |
| Switch episodes while a prompt is open | A stale prompt cannot save a rule or click the old control |

**Undo limits:** Only intros/recaps with an accessible, seekable video can be rewound. Undo is available for eight seconds and only for the same video and URL. AutoSkip does not navigate backwards after Next episode. Session pauses last up to four hours or until Chrome restarts. Browser-native video fullscreen may not allow HTML overlays; test the service's own fullscreen control.

## Settings and privacy checks

- Change the in-player prompt language (English/French/German/Spanish); reload and verify prompts.
- Export, reset, and import preferences; verify the settings return.
- Try invalid JSON: see an error and retain the previous settings.
- Clear current/all counts in Settings → Activity & resets and check the values update.
- Check `chrome://extensions` → AutoSkip → **Errors** for errors after each service test.

## Results to report

| Service | Locale | Series recognised across episodes? | Intro | Recap | Next episode | Keep watching | Undo | Fullscreen | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Netflix | | | | | | | | | |
| Prime Video | | | | | | | | | |
| Disney+ | | | | | | | | | |
| Apple TV+ | | | | | | | | | |

If a control is missed, note the service, action, UI language, Chrome version, and what happened. Settings → Troubleshooting → Diagnostic logging adds local console messages. Do not share authentication tokens or account details.

## What is already automated

`npm run check` runs unit tests, type checking, a production build, package checks, and a real Chromium extension test suite. Browser tests load the production `dist/` with real Chrome extension storage/messaging and simulated service pages. They do not validate the current private/DRM streaming players. No live service pass is claimed until the table above is completed.
