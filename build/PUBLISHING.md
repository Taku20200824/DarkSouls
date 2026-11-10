# Publishing a new desktop build

1. Bump the version in **both** `package.json` and `electron/package.json` (keep them equal). The website needs no change: `/download` and the version labels read the Blob store's `latest.yml`, so the site offers the new installer within a minute of step 3.
2. `npm run dist:win` — produces in `dist/`:
   - `Lordran-Tracker-Setup-<version>.exe`
   - `Lordran-Tracker-Setup-<version>.exe.blockmap`
   - `latest.yml` (electron-updater's feed manifest, from the `publish` block in `electron-builder.yml`; it references the installer by the same hyphenated name)
3. Upload the three files to the Vercel Blob store `store_BPcNe2nKARuZhq1B` (public). **Upload `latest.yml` last**: once it's up, installed apps start fetching the installer it names.
   ```
   npx --yes vercel blob put "C:\tusul\DarkSouls\dist\Lordran-Tracker-Setup-<version>.exe" --access=public --rw-token=<token>
   npx --yes vercel blob put "C:\tusul\DarkSouls\dist\Lordran-Tracker-Setup-<version>.exe.blockmap" --access=public --rw-token=<token>
   npx --yes vercel blob put "C:\tusul\DarkSouls\dist\latest.yml" --access=public --force --cache-control-max-age 60 --rw-token=<token>
   ```
   `latest.yml` **must** be uploaded as exactly `latest.yml` (no version in the name) — that's the fixed path `electron-updater` polls on every launch. It already exists from the previous release, hence `--force`, and the short cache max-age stops the CDN from serving the old manifest for 30 days.
   Alternatively, use the store's **Manage Blobs** page in the Vercel dashboard: delete the old `latest.yml`, then **Upload** the three files.
4. Check it landed: `https://bpcne2nkaruzhq1b.public.blob.vercel-storage.com/latest.yml` shows the new version, and `https://darksouls-five.vercel.app/api/desktop/latest` reports it within a minute.
5. Commit and push the version bump.

Already-installed apps pick up the new version automatically (checks on launch, asks before downloading, asks again before restarting to install) — no further action needed for existing users.

Releases up to 0.1.4 were built with a spaced file name (`Lordran Tracker-Setup-…`). 0.1.4's `latest.yml` was edited by hand to point at the hyphenated copy of the same installer.
