# Notices

LORDRAN TRACKER is an unofficial, fan-made companion. It is not affiliated with or endorsed by
Bandai Namco or FromSoftware. DARK SOULS is a trademark of its respective owners; game names
are used only to describe what the tracker works with.

The source code in this repository is released under the [MIT License](LICENSE), except for the
third-party material listed below, which keeps its own license.

## Third-party material

| Material | Location | License |
|---|---|---|
| Dark Souls item / flag / bonfire tables from [darthdemono/sl2-analyzer](https://github.com/darthdemono/sl2-analyzer) (`db_ds1/`) | `src/lib/data/ds1db/`, `companion/ds1db/` | Apache License 2.0 — see `LICENSE-sl2-analyzer.txt` in each folder |
| Fonts: Cinzel, Cormorant Garamond, Yeseva One, Alegreya, Noto Sans (via `@fontsource/*`) | `node_modules`, bundled at build time | SIL Open Font License 1.1 |
| npm dependencies | `package.json`, `electron/package.json` | Each package's own license |

## Artwork

Images under `public/artwork/` are original generated illustrations made for this project —
not extracted game assets, official screenshots or wiki images. See
[`public/artwork/README.md`](public/artwork/README.md). They are covered by the MIT License
with the rest of the repository.
