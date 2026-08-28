# Release process

1. Ensure `main` is green (`npm test`, `npm run build`).
2. Bump `version` in `package.json` and `apps/extension/manifest.json`.
3. Update support matrix / changelog notes in the GitHub release body.
4. Tag and push:

```bash
git tag v1.0.0
git push origin v1.0.0
```

5. The `Release` workflow builds `dist/`, zips it, and attaches it to the GitHub release.
6. Upload the zip (or a store package derived from it) to the Chrome Web Store listing when ready.

## Store checklist

- [ ] Screenshots / demo GIF
- [ ] Permission justification text matches PRIVACY.md
- [ ] Single-purpose description focused on repetitive playback automation
- [ ] No remote code, accounts, or analytics
