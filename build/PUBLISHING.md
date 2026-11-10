# Publishing a new desktop build

Installers are distributed through **GitHub Releases** of the public repo
(`Taku20200824/DarkSouls`). Installed apps (0.1.8+) and the website both read the newest
release's `latest.yml`, so publishing a release is all it takes — no site deploy.

1. Bump the version in **both** `package.json` and `electron/package.json` (keep them equal), plus the two `package-lock.json` files.
2. `npm run dist:win` — produces in `dist/`:
   - `Lordran-Tracker-Setup-<version>.exe`
   - `Lordran-Tracker-Setup-<version>.exe.blockmap`
   - `latest.yml`
3. Commit and push the version bump.
4. On GitHub: **Releases → Draft a new release**
   - **Tag**: `v<version>` or `<version>` (e.g. `v0.1.9`) — any name works as long as it's a new tag; the app and site read the newest published release.
   - **Title**: `Lordran Tracker <version>`
   - **Attach** the three files from step 2 (drag them onto the page).
   - Leave "Set as a pre-release" **unchecked** and click **Publish release** (a draft or pre-release is ignored).
5. Check it landed: `https://github.com/Taku20200824/DarkSouls/releases/latest/download/latest.yml` shows the new version, and `https://darksouls-five.vercel.app/api/desktop/latest` reports it within a minute.

Already-installed apps (0.1.8+) pick up the new version on their next launch (they ask before downloading, show progress at the bottom of the window, and ask again before restarting to install).

## History

- 0.1.0–0.1.7 used a Vercel Blob store (`store_BPcNe2nKARuZhq1B`) as the update feed. The Hobby plan allows 1 GB of storage; ~144 MB per installer filled it, and Vercel suspended the store (403 "Your store is blocked") for 30 days. Apps from those versions can't see new releases: reinstall them once from the website.
- Releases up to 0.1.4 were built with a spaced file name (`Lordran Tracker-Setup-…`).
