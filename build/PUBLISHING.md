# Publishing a new desktop build

1. Bump the version in **both** `package.json` and `electron/package.json` (keep them equal), and in `src/lib/downloads.ts`'s `DESKTOP_APP_VERSION`.
2. `npm run dist:win` — produces in `dist/`:
   - `Lordran Tracker-Setup-<version>.exe`
   - `Lordran Tracker-Setup-<version>.exe.blockmap`
   - `latest.yml` (electron-updater's feed manifest, from the `publish` block in `electron-builder.yml`)
3. Rename the installer to replace the space with a hyphen (`Lordran-Tracker-Setup-<version>.exe`), matching the URL `downloads.ts` builds — spaces in a public URL are ugly/error-prone.
4. Upload all three files to the **same** Vercel Blob store the previous version used (`store_BPcNe2nKARuZhq1B`, public, `--no-add-random-suffix`), from a terminal already logged in via `npx vercel login`:
   ```
   npx --yes vercel blob put "dist\Lordran-Tracker-Setup-<version>.exe" --access=public --rw-token=<token>
   npx --yes vercel blob put "dist\Lordran Tracker-Setup-<version>.exe" --access=public --rw-token=<token>
   npx --yes vercel blob put "dist\Lordran Tracker-Setup-<version>.exe.blockmap" --access=public --rw-token=<token>
   npx --yes vercel blob put "dist\latest.yml" --access=public --force --cache-control-max-age 60 --rw-token=<token>
   ```
   The installer goes up under **both** names: the hyphenated one is the site's download link, the spaced one is what `latest.yml` references for auto-update.
   `latest.yml` **must** be uploaded as exactly `latest.yml` (no version in the name) — that's the fixed path `electron-updater` polls on every launch. It already exists from the previous release, hence `--force`, and the short cache max-age stops the CDN from serving the old manifest for 30 days.
5. Commit and push the version bump.

Already-installed apps pick up the new version automatically (checks on launch, asks before downloading, asks again before restarting to install) — no further action needed for existing users.
