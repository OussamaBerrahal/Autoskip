# Privacy

AutoSkip is local-first.

## What AutoSkip does **not** do

- No account
- No tracking
- No advertising
- No analytics backend
- No remote viewing-history collection
- No sale of personal data

## What is stored locally

Preferences and aggregate skip statistics are stored in browser extension storage on your device:

- global / per-service enable flags
- service / series / session automation rules
- local skip counts and estimated time saved (session + lifetime)
- dismissed / first-encounter prompt markers
- optional debug flag and UI locale preference

These values never leave your browser unless you explicitly export them from Options.

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Persist local rules and statistics |
| `activeTab` | Read the current tab context when the popup is opened |
| Host access to supported streaming domains | Detect and activate playback controls already exposed by those sites |

Host access currently covers Netflix, Prime Video / Amazon Video regional hosts, Disney+, and Apple TV+.

AutoSkip only interacts with ordinary playback controls exposed by supported services according to your explicit preferences.
