# UI/UX audit & fix pass — 2026-11-19

Scope: every page of the web app and the Windows (Electron) app, which share one Next.js codebase.
Screenshots: `docs/redesign/before/` and `docs/redesign/after/` — 19 pages × desktop (1440×900) and
mobile (390×844), demo mode; `after/desktop-app-*.png` are taken from the packaged desktop server build.
(The PNGs are kept out of git; see `.gitignore`.)

## How it was audited

- axe-core 4.10 (WCAG 2.0/2.1 A + AA rules) on all 19 pages at both sizes, in Electron.
- Horizontal-overflow and console-error check on the same runs.
- Visual review of the 38 screenshots; keyboard pass (skip link, nav order, focus ring); drawer behaviour.

## Prioritised plan (what was done)

| # | Priority | Finding | Fix | Verified |
|---|----------|---------|-----|----------|
| 1 | P0 a11y | `/deaths`: 14 cause `<select>`s without a name (critical) | `aria-label` per row | axe ✓ |
| 2 | P0 a11y | `/upgrades`: 3 inputs + 2 selects not tied to their labels (critical) | `htmlFor`/`id` pairs | axe ✓ |
| 3 | P0 a11y | `/characters`: save-file input without a label (critical) | `aria-label` | axe ✓ |
| 4 | P0 a11y | `/bosses`: art credit at 1.93:1 contrast, 7 px | #9fb0bc, 9 px (8 px mobile) | axe ✓ |
| 5 | P0 a11y | `/privacy`: scrollable table not keyboard-reachable | `tabIndex=0`, `role=region`, label | axe ✓ |
| 6 | P0 a11y | Mobile drawer: when closed it was only moved off-screen, so its 12 links stayed in the tab order | `inert` while closed on phones; Esc and navigation close it | JS check ✓ |
| 7 | P0 bug | Mobile: header 49 px but game bar stuck at 57 px → page content showed through the gap while scrolling | one shared `--mobile-bar-h` (52 px) for both | measured ✓ |
| 8 | P0 bug | `/deaths` mobile: page 12 px wider than the screen | cause controls wrap / shrink | overflow check ✓ |
| 9 | P0 bug | Game page in demo mode: games without demo data showed "loading…" forever | empty state instead | screenshot ✓ |
| 10 | P1 a11y | Achievement filters used `role="tab"` without tab panels; chips had no pressed state | `role="group"` + `aria-pressed` | code ✓ |
| 11 | P1 a11y | Game bar "Steam шалгах" button lost its name on phones (text hidden) | `aria-label` | code ✓ |
| 12 | P1 UX | Sidebar didn't fit a 900 px window (last item cut, "Тохиргоо / Compani…" truncated, scrollbar always visible) | tighter rhythm, compact game label, shorter settings label, scrollbar only on hover | 900 = 900 ✓ |
| 13 | P1 UI | Game bar showed a raw scrollbar on phones; chips below 44 px touch size | hidden scrollbar, edge fade, snap, 44 px chips on mobile, ember underline for the active game | screenshot ✓ |
| 14 | P1 UI | Stat tiles: badge position jumped with label length; "ЖИШЭЭ" repeated on every tile; "19ц 42м" wrapped | fixed label/badge row, demo badge left to the banner, one value size | screenshot ✓ |
| 15 | P1 UI | Loading = bare text; error = red text with no way out | breathing-ember loader with `role=status`; error panel with "Дахин оролдох" | code ✓ (error state not forced) |
| 16 | P1 UI | New game pages (DS II/III, Elden Ring) looked plainer than the DS1 achievements page | same hero, segmented filter and achievement cards | screenshot ✓ |

Results after the fixes: **0 axe violations on 19/19 pages at both sizes** (was 5 rule types, about 22
elements), no horizontal overflow, no console errors. Type check, 78 unit tests, the web production
build and the desktop build all pass.

## Remaining issues (not fixed)

| Severity | Issue |
|----------|-------|
| Medium | Not checked with a real screen reader (NVDA/VoiceOver); only automated rules and keyboard order. |
| Medium | The error panel (#15) was not forced in a test; it is a straightforward render path. |
| Low | axe cannot judge contrast over images/gradients (hero art, boss portraits); those were reviewed by eye only. |
| Low | Hero copy on the dashboard and landing page is English while the UI is Mongolian (content choice, left as is). |
| Low | Tablet width (768–1024 px) reviewed only through the desktop and mobile layouts, not captured separately. |
| Info | DS II, DS III and Elden Ring have Steam data only (no save parser), as before. |
