# LORDRAN TRACKER

**Your Journey Through Lordran, Tracked.** A Dark Souls: Remastered companion website (Next.js + Firestore) with Steam sign-in, Steam achievement sync, a read-only `DRAKS0005.sl2` reader, and a Windows companion that syncs automatically each time the game saves. The UI text is in Mongolian Cyrillic, and official game terms stay in English.

> Every value has a source: **Steam API · Parsed save file · Companion · User confirmation · Inference · Demo**.
> Values the save cannot prove are shown as **Unknown**. Demo Mode is separate and labelled on every screen.

---

## What is implemented

| Area | Status |
|---|---|
| Steam OpenID sign-in (state cookie, `check_authentication`, nonce freshness and replay check) | Implemented and unit-tested. **Not yet tested live against Steam** (the build sandbox had no access to Steam). |
| Steam profile, ownership and achievements (`GetPlayerSummaries`, `GetOwnedGames`, `GetSchemaForGame`, `GetPlayerAchievements`) | Implemented and unit-tested, including private profiles and a missing key. Not yet tested live. |
| Save reader, TypeScript (in the browser) and Python (companion) | Tested on a real PtDE save. DSR decryption tested on synthetic files. A TS↔Python parity test confirms both give the same output. |
| Manual upload. The `.sl2` is parsed in the browser and only the parsed fields are sent, after consent. | Done |
| Windows companion: pairing, debounced watch, MD5 check that rejects half-written files, retry and backoff, heartbeat | Done. End-to-end tested against the dev server. |
| Live status: CONNECTED — LIVE TRACKING / WAITING FOR NEXT SAVE / OFFLINE — LAST SYNC | Done. Uses 15-second polling (see Limitations). |
| Snapshot diff into events: deaths, level, bosses, bonfires, NG | Done. VICTORY ACHIEVED plays once per event and is acknowledged on the server. |
| Pages: Landing, Login, Characters, Dashboard, World Map (SVG + GSAP route animation), Area Guide, Bosses (26), Guide, Upgrade Planner, Inventory, Achievements (41), Death Analytics, NPC Quests, NG Roadmap, Settings | Done |

## Repository layout

```
src/lib/save/        BND4 + AES-128-CBC + DS1 slot reader (TypeScript), zod payload schema
src/lib/steam/       OpenID + Web API
src/lib/server/      Firestore/dev store, sessions, CSRF/rate limit, ingest + diff
src/lib/data/        areas/connections, bosses, 41 achievements, upgrade recipes, NPC quests, ds1db/ tables
src/lib/guide/       boss evidence, objectives, upgrade advice, NG+ checklist
src/app/             pages + /api routes
companion/           Windows companion (Python) — ds1parser.py mirrors src/lib/save/ds1.ts
tests/               vitest (parser, Steam, logic, TS↔Python parity) + fixtures
```

## Requirements

- Node.js 20 or newer
- A Firebase project with Firestore enabled (you have `darksouls-65f0d`)
- A Steam Web API key: <https://steamcommunity.com/dev/apikey>
- For the companion: Windows with Python 3.10 or newer, or the `.exe` you build from it

## Environment variables

Copy `.env.example` to `.env.local` for local work. In production, set them in Vercel under Project → Settings → Environment Variables.

| Name | Required | Notes |
|---|---|---|
| `APP_URL` | yes | Public origin, no trailing slash, e.g. `https://lordran-tracker.vercel.app`. Used as the OpenID realm and return_to, and for the CSRF origin check. |
| `SESSION_SECRET` | yes (prod) | 32+ random characters (`openssl rand -base64 48`). |
| `STEAM_API_KEY` | yes | Server-side only. It never reaches the browser. |
| `FIREBASE_PROJECT_ID` | yes | `darksouls-65f0d` |
| `FIREBASE_CLIENT_EMAIL` | yes | From the service-account JSON |
| `FIREBASE_PRIVATE_KEY` | yes | From the service-account JSON. Paste it with literal `\n`, which are converted at runtime. |
| `DISABLE_DEV_STORE` | no | `1` stops the local JSON store from being used in development. |

If the Firebase variables are missing and `NODE_ENV != production`, a local `.dev-store.json` is used and the sidebar shows **DEV STORE**. In production the app refuses to run without Firestore.

### Steam API setup
1. Sign in at <https://steamcommunity.com/dev/apikey>, enter your site's domain, and copy the key into `STEAM_API_KEY`.
2. For achievements, the player's Steam **Privacy Settings → Game details** must be **Public**. If they are not, the app shows "private" and offers manual tracking.

### Firebase / Firestore setup
1. Firebase console → *Build → Firestore Database → Create database* (production mode).
2. *Project settings → Service accounts → Generate new private key* gives you `project_id`, `client_email` and `private_key`.
3. Deploy `firestore.rules`. It denies all client access, because the website talks to Firestore only through the Admin SDK on the server.
4. Optional: add TTL policies for `nonces.at` and `pairing.expiresAt`.

Data model: `users/{steamId}` with `characters/`, `events/`, `snapshots/`, `meta/{achievements,manual,companion,sync}`, and `companionTokens/`. At the top level there are `companionTokens/{sha256}`, `pairing/{code}`, `nonces/{sha256}` and `cache/steamSchema570940`.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values (Firebase optional locally)
npm run dev                  # http://localhost:3000
npm test                     # vitest (includes TS↔Python parity if python3+cryptography exist)
npm run test:py              # companion unit tests
npm run typecheck
npm run build
```

## Deploying to Vercel

1. Push this folder to `github.com/Taku20200824/DarkSouls`.
2. Go to <https://vercel.com/new> → Import that repository. The framework is Next.js and the defaults work.
3. Add all the environment variables above. Set `APP_URL` to the final production URL.
4. Deploy. Open `/login` → *Sign in through Steam*.

## Windows companion

```bat
cd companion
python -m pip install -r requirements.txt
REM 1. On the website: Settings → "Холбох код үүсгэх" (8-character code, valid for 10 minutes, single use)
python lordran_companion.py pair ABCD2345 --server https://your-site.vercel.app
REM 2. Watch and sync (leave it running while you play)
python lordran_companion.py run
REM Other commands
python lordran_companion.py status
python lordran_companion.py once --print          REM parse locally and print JSON, send nothing
```

Run `build_windows.bat` to build a standalone `dist\lordran-companion.exe` with PyInstaller.

Save auto-detection follows the game's Steam Cloud config: `Documents\NBGI\DARK SOULS REMASTERED\<id>\`, `Documents\FromSoftware\DARK SOULS REMASTERED\<id>\` and `Documents\NBGI\570940\<id>\`. OneDrive-redirected Documents and Proton prefixes are also checked. Use `--save PATH` to override.

How the companion behaves:
- It checks size and modification time every 2 seconds. Once the file has stayed unchanged for 3 seconds, it reads it **into memory, read-only**.
- It accepts the snapshot only if size and modification time did not change during the read **and every BND4 entry's MD5 matches**, so half-written saves are rejected and retried.
- It parses locally, sends only the parsed fields, and only when something changed. A heartbeat goes out every 30 seconds. If the network fails it retries with backoff.
- It needs no admin rights, does not read or touch game memory, does not inject anything, and never writes to the save. The token is stored in `%APPDATA%\LordranTracker\config.json`, and the server keeps only its SHA-256.

## Security

- Steam OpenID is verified directly with Steam. There is a state cookie against login CSRF and a single-use nonce. Steam passwords never touch this app.
- The session is an HS256 JWT in an `httpOnly`, `SameSite=Lax`, `Secure` cookie. Every cookie-authenticated mutation also requires a matching `Origin` (CSRF).
- All request bodies are validated with zod and have size limits. Save files are size-capped and parsed with bounds-checked readers.
- Rate limits apply per user, per token and per IP. They are kept in memory per server instance.
- Each user's data is isolated under `users/{steamId}`. Companion tokens can be revoked in Settings.
- Security headers are set (HSTS, nosniff, frame-deny, referrer policy).

## Save-format notes and sources

The offsets come from [darthdemono/sl2-analyzer](https://github.com/darthdemono/sl2-analyzer) (Apache-2.0), whose author verified them on real DSR and PtDE saves, plus [tarvitz/dsfp](https://github.com/tarvitz/dsfp) (MIT) and [pawREP/Dark-Souls-Remastered-SL2-Unpacker](https://github.com/pawREP/Dark-Souls-Remastered-SL2-Unpacker) (MIT). See `NOTICE`.

| Field | Source |
|---|---|
| Name, class, gender, SL, souls, humanity, HP, stamina, 8 attributes | Verified. Found from a DSR anchor pattern, with the SL = Σattributes − K(class) rule as a gate. |
| Total deaths | Verified when the sentinel next to the counter is present; otherwise Unknown. |
| Play time | Verified. Taken from the load-screen roster record whose name and level match. |
| NG cycle | Verified on DSR. Unknown on PtDE. |
| Inventory (weapons with +level and infusion, armour, rings, goods, spells) | Verified |
| Bonfires | Verified when a run of ≥5 valid records is found |
| Boss kills | Verified only for the 12 bosses with known flags. The others are *inferred* from boss souls, NG+, key items, world flags or Steam achievements. |
| World flags (bells, Lordvessel, covenants joined, some NPC states) | Verified when the flag region passes a sparsity sanity check |
| Current location / coordinates, equipped items, per-death cause | **Not decoded.** Area is estimated from progress (Inference). Death causes are "Unconfirmed" unless the user tags them. |

The upgrade recipes come from the Dark Souls Wiki path pages. Boss, Unique and Dragon per-level quantities are **not** shown because they were not verified.

## Known limitations

- **Steam login and the Web API have not been tested live.** The build sandbox could not reach Steam, so they are covered by unit tests with mocked Steam responses. Test them once after you deploy.
- **There is no real DSR save in this repo.** The DSR path is tested with synthetic encrypted files built at the documented offsets. Testing with a real `DRAKS0005.sl2` is still needed.
- Live updates use 15-second polling instead of SSE/WebSockets. Vercel serverless functions do not hold long connections, and updates only happen when the game writes its save anyway. Tracking is save-by-save, not frame-by-frame.
- "Deaths between bonfires" and boss attribution are not available from the save, so they are marked **Unconfirmed** and the user can tag deaths manually.
- Official game screenshots and item icons are not bundled. The cinematic landing and Artorias spotlight use original AI-generated fan illustrations (see `public/artwork/README.md`); boss cards use monogram sigils. Achievement icons load from Steam's CDN when Steam data is available.
- The world map is illustrative. Its connections follow the real game, but positions are not real coordinates.
- Rate limiting is per instance. For strict global limits, add a shared store such as Upstash.
- Account deletion is not built in the UI yet. To remove a user, delete `users/{steamId}` in the Firebase console.

Fan-made and unofficial. DARK SOULS is a trademark of Bandai Namco Entertainment / FromSoftware.
