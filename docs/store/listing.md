# Chrome Web Store listing — prepared draft

Status: ready for owner review after live streaming tests. The listing has not been submitted.

## Name

AutoSkip

## Short description

Automatically skip intros and recaps, advance episodes, and keep watching with preferences saved only on your device.

## Detailed description

You decide once. AutoSkip remembers.

AutoSkip handles repetitive streaming playback buttons according to choices you make. When an intro or recap appears, skip it once, remember the choice for that series, or set a default for the service.

• Get started with an explicit choice of streaming apps, or choose as you watch.
• Choose intro, recap, next-episode, and keep-watching automation separately.
• Save show choices instantly; search, edit, or remove them right in the popup.
• Pause for 30 minutes and resume automatically. Follow your system’s light or dark appearance.
• Use per-series preferences when the player exposes an identifiable series.
• Keep service defaults and override only the actions you choose.
• Receive a suggestion after repeated manual skips. Preferences are never enabled without your choice.
• Rewind an automatic intro or recap with Undo when the player exposes a seekable video. Other actions offer Pause this action.
• Use four clearly explained switches, change the in-player message language, and save or restore a backup.

AutoSkip includes adapters for Netflix, Prime Video, Disney+, and Apple TV+. Player layouts, languages, and regional versions can vary. If a series cannot be identified, choose service defaults explicitly. AutoSkip clicks controls the service already provides; it does not bypass access restrictions or remove advertisements.

Free and open source. No AutoSkip account, tracking, advertising, analytics, or remote code. Preferences and aggregate statistics stay in your browser unless you choose to export a local file.

Requires access to the streaming service you want to use. AutoSkip is an independent project and is not affiliated with or endorsed by the streaming services.

## Single purpose

Automate repetitive streaming playback controls according to explicit preferences stored on the user's device.

## Category / language

Suggested category: Entertainment (select the closest available category in the dashboard).
Listing language: English. In-player prompts support English, French, German, and Spanish, with English fallback for untranslated strings. Popup and Options are English.

## Permissions justification

**storage**: Save enabled services, action preferences, series identifiers/titles associated with saved choices, prompt-learning counters, and aggregate skip statistics locally. No data is transmitted to a server.

**Site access from content-script matches**: Detect and activate visible playback controls and read the player title on Netflix, Prime Video, Disney+, Apple TV+, and the configured Amazon Video regional paths. This allows the extension to apply the user's chosen playback preferences automatically while a supported player is open. The Amazon matches are restricted to `/gp/video/`, `/video/`, and `/detail/` paths.

No `activeTab`, `tabs`, `scripting`, network interception, cookies, or remote-code permissions are requested. The popup queries only the active tab ID and asks the extension's content script for its player context.

## Data disclosures

- Data remains local: selected series titles/identifiers, saved rules, prompt history/manual-skip counts, aggregate statistics, enabled services, temporary global pause expiry, locale, debug preference.
- No account credentials, payment information, or communication content is read.
- No user data is collected or transmitted off-device by the extension.
- Export is user initiated and creates a local JSON file.
- Reset all local data is available in Options; uninstalling removes extension storage.
- No remote code, analytics, advertisements, sale, or transfer of data.

Use these facts to answer the dashboard's current privacy questions. Owner declarations must reflect the exact uploaded build.

## Links

- Homepage/source: https://github.com/OussamaBerrahal/Autoskip
- Support: https://github.com/OussamaBerrahal/Autoskip/issues
- Privacy policy source: https://github.com/OussamaBerrahal/Autoskip/blob/main/PRIVACY.md (use after these changes are merged)

## Upload assets

- ZIP: `artifacts/autoskip-1.1.0.zip` (manifest at archive root)
- Icon: `apps/extension/icons/icon128.png`
- Small promotional image: `docs/store/images/small-promo-440x280.png`
- Screenshots (1280 × 800): `01-player-prompt.png`, `02-player-undo.png`, `03-popup-rules.png`, `04-options.png`, `05-welcome.png` in `docs/store/images/`

Screenshots use the actual extension interface and a clearly labelled demo player. They contain no streaming-service artwork, private account information, or claims of live-site validation. Regenerate with `npm run screenshots` after building. A demo GIF is optional and not required for this submission package.

Asset dimensions and required assets were checked against [Chrome's image requirements](https://developer.chrome.com/docs/webstore/images). Permission descriptions follow [Chrome's permission documentation](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions).

## Submission sequence

1. Complete the live-site checklist in `docs/test-checklist.md` and fix any failures.
2. Merge the tested changes; remove `version_name: 1.1.0 alpha` for a stable release and rerun all checks/package/screenshots.
3. Review this copy, confirm owner/contact details in the developer dashboard, and upload the ZIP and images.
4. Complete the dashboard privacy declarations, preview the listing, and submit for review.

Developer account setup, any store registration fee, owner attestations, and publication remain owner actions. No store submission was made by this task.
