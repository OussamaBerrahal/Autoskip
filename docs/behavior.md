# What each control does

| Choice | When AutoSkip acts | What it does |
| --- | --- | --- |
| Skip intros | The player offers a visible intro-skip button | Clicks it once for that episode. Confirms a playback jump and that the control disappeared before showing success. |
| Skip recaps | The player offers a visible recap-skip button | Skips the recap independently of the intro setting. |
| Play next episode | A supported next-episode end card appears near the end, after observed playback | Starts the following episode once. Netflix's normal toolbar Next Episode button is excluded. |
| Keep watching | The player offers a recognized still-watching confirmation | Answers that prompt and confirms playback is running. It does not seek or choose the next episode itself. |

These are independent opt-in choices. Off does not activate the matching button. Until the viewer makes an explicit choice, an intro/recap may offer a small first-encounter question. Choosing Don't ask again dismisses that question for the current show/action; it does not turn skipping on.

## Which shows are affected?

The popup has one set of switches and an **Apply to** selector. **All Netflix shows** changes Netflix's general choices. **Only Friends** immediately saves the current four choices for Friends and adds it to **Your shows**, even before a switch changes. Later edits apply just to Friends. Selecting an already saved show preserves its previous choices. **Use my Netflix settings** removes that show's saved choices.

The popup’s **Your shows** view stays available on any browser tab. Search by title, filter by streaming app, open a show to edit its four choices, or choose **Remove show settings** to restore the app defaults. Changes save automatically and survive closing Chrome. The same title on different apps has separate entries. Settings → Your shows uses this same list.

Older rules and choices made through an in-player prompt may specify only one action; their remaining actions continue to follow the app defaults. Temporary pauses are kept separate from saved choices.

If Netflix's title controls disappear, AutoSkip remembers the title for the current episode. A different episode URL must expose its own title before AutoSkip uses a show-specific preference. Unknown titles still allow the user to explicitly choose general settings.

## End-of-episode safety

- Netflix, Prime Video, and Disney+ require an adapter-specific next-episode marker; a generic “Next Episode” label is insufficient. The Prime/Disney markers still require live player validation.
- Playback must be within the last 5% of the video, capped at 60 seconds, or have ended naturally. Paused credits are left alone.
- At least 30 seconds of continuous media progress must have been observed for that episode. Seeking does not count. Resuming a watched episode at its saved ending does not immediately advance.
- Only one attempt is made per action/episode for intros, recaps, and next episode, even if a button is replaced.
- Automatic episode advances are separated by at least 60 seconds.
- The next-episode count changes only after a playback restart/source change or episode navigation is observed.

These deliberately conservative rules may leave an end card for the viewer to click, particularly after seeking directly to the credits. Netflix's own autoplay remains separate from AutoSkip.

## Getting started and saved shows

The welcome page opens on a new installation, not on ordinary updates. **Skip intros & recaps** explicitly enables AutoSkip, clears a temporary global pause, and enables those two actions for the selected streaming apps. Other actions and saved show overrides are preserved. **I'll choose as I watch** leaves all preferences unchanged.

Settings → **Watching** manages each streaming app's choices. **Your shows** lets the viewer find saved shows, edit their overrides, or return a show to its app's choices. **Backup & help** includes validated backup/restore, help, activity, and reset tools. The interface follows the system's light/dark appearance.

## Undo and pause

**Pause for 30 min** temporarily stops automatic actions and preference prompts across all supported tabs. It leaves saved choices intact and expires by the clock, including across browser restarts. **Resume AutoSkip** ends it early. Switching AutoSkip **Off** has no timer; it remains off until explicitly turned on. These controls are separate from the action-specific pauses below.

An automatic intro or recap offers **Undo** for eight seconds when the same video is seekable. Undo restores the previous position, removes the skip from the automatic count, and pauses that action for the current show. **Resume** restores the saved choices. These action pauses expire after four hours or when Chrome restarts.

Next episode and Keep watching offer **Pause this action**, because AutoSkip cannot reliably reverse a navigation. It never promises to return to the previous episode.

## What the six counts meant

On 2026-09-15, the owner reported six consecutive advances while watching Friends. Read-only inspection showed Netflix's `control-next` toolbar button at approximately 3m31s of a 21m52s episode. The previous generic-label fallback classified that button as an end card. Reappearing controls and changed episode URLs could rearm it repeatedly. Watching the show previously was not necessary to trigger that bug.

Version 1.0.0 counted dispatched clicks, so six counts establish six activations rather than independently confirming six completed episode transitions. The screenshot's zero intro count cannot be reconstructed from that image alone: Undo removes a count, one-time skips are excluded, and the capture may precede another action. Existing counts are preserved rather than silently reset. New automatic counts check the observed playback outcome.

## Verification boundary

The owner reported live intro skipping and Undo feedback working. The toolbar/title observations above came from the connected Netflix player. Automated regression tests use an installed extension with generated media and simulated service pages. After reloading 1.1.0 alpha, the owner confirmed that the Netflix repeated-advance fix works. The remaining Netflix action/fullscreen checks and live Prime Video/Disney+ checks are still pending. Automated passes do not establish compatibility with current DRM players.
