# AutoSkip privacy policy

Last updated: September 15, 2026.

AutoSkip performs streaming playback actions using preferences stored on your device. It does not require an AutoSkip account, serve advertising, use analytics, or send data to a server. It does not sell or transfer user data.

## What the extension reads

On configured streaming player pages, AutoSkip reads visible playback controls and available series titles to detect intros, recaps, next-episode controls, and keep-watching prompts. It observes manual clicks on those detected controls to offer local preference suggestions.

For an undoable intro/recap skip, it temporarily remembers the video's playback position, source, and page URL in memory. This bookmark is used only to return to the same video before the skip; it is not written to storage or transmitted.

## What is stored locally

Chrome extension local storage contains:

- Global and per-service enable settings.
- Service/series/session action rules, including the series title and identifier associated with saved choices.
- Manual-skip counts and prompt-discovery/dismissal markers keyed to service and identified series.
- Aggregate skip counts and estimated time saved (session and lifetime).
- In-player prompt language and optional debug logging preference.

Series identifiers are derived from available player titles, not a full browsing or viewing history. Session pauses expire after four hours or when Chrome starts. Statistics are estimates, not measured playback time. Optional debug messages stay in your browser console.

## Export, import, and deletion

Export creates a JSON file on your device containing the locally stored state, including saved series choices and statistics. Nothing is uploaded. You control whether you share that file. Import replaces saved state only after validation and your confirmation.

Use **Options → Reset all local data** to remove saved preferences, learning, and statistics. Uninstalling the extension also removes its extension storage. Exported files remain wherever you saved them and can be deleted using your file manager.

## Permissions

| Access | Purpose |
| --- | --- |
| `storage` | Save local preferences, prompt-learning counters, and aggregate statistics |
| Content-script access on supported player domains/paths | Detect and activate playback controls and identify the series when the player exposes it |

Site patterns cover Netflix, Prime Video, Disney+, Apple TV+, and Amazon Video paths on amazon.com, amazon.co.uk, amazon.de, and amazon.co.jp. Amazon access is limited to `/gp/video/`, `/video/`, and `/detail/` paths. The exact list is in `apps/extension/manifest.json`.

No `activeTab`, `tabs`, cookies, network interception, remote code, or broad access to all websites is requested. The popup queries the active tab ID and asks its own content script for the current player context.

## Third parties and contact

Your streaming service operates independently under its own privacy policy. AutoSkip does not access your account credentials or bypass access restrictions.

For questions or bugs, open an issue at [OussamaBerrahal/Autoskip](https://github.com/OussamaBerrahal/Autoskip/issues). Do not include passwords, account details, authentication tokens, or private viewing data in public issues.
