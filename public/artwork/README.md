# Original generated artwork

These optimized WebP assets were created with the built-in ImageGen tool for this unofficial fan companion. They are not official game screenshots or extracted game assets.

- `firelink-cinematic.webp`: cinematic dark fantasy key art; a weathered knight resting beside a burning coiled sword, ruined gothic citadel and eclipse; dark negative space at left for interface text.
- `abysswalker.webp`: original Artorias fan illustration; fallen knight with blue cloth, broken left arm and greatsword in a ruined moonlit arena; dark negative space at right for encounter text.

Generation prompts requested photorealistic materials, cinematic lighting, charcoal/slate palettes with ember accents, landscape composition, and no text, logos or watermark. Source PNGs were encoded as WebP at quality 87 and 85 respectively. Both final assets are 1672 × 941 pixels.

## Boss portraits

`bosses/<boss id>.webp` are original illustrations for the boss cards and detail pages, named after the `id` in `src/lib/data/bosses.ts`. They were generated with Canva from written descriptions, not from official screenshots or extracted game assets, so they do not match the in-game designs exactly.

Prompts requested photorealistic materials, cinematic lighting, a charcoal or slate palette, a centered subject, and no text, logos or watermark. Images were exported at 1456 × 1092 and encoded as WebP at 1024 × 768, quality 82. `artorias.webp` is a 4:3 crop of `abysswalker.webp`.

## Area scenes

`areas/<area id>.webp` are original atmospheric scene illustrations for the World Map's area detail panel, named after the `id` in `src/lib/data/areas.ts`. Generated (via Figma's image generation) from written descriptions of each location's look and mood, not from official screenshots, extracted game assets, or any third-party wiki's map images — they are moodboard-style establishing shots, not navigable layout diagrams, since no accurate level-geometry data is available to this project.

Same prompt formula as the boss portraits (photorealistic materials, cinematic lighting, charcoal/slate palette with accent colors suited to the area, landscape composition, no text/logos/watermark), encoded as WebP at 1024 × 768, quality 82. Currently covers 6 of 26 areas (Firelink Shrine, Undead Burg, Blighttown, Anor Londo, Sen's Fortress, Darkroot Garden); `src/components/AreaScene.tsx` lists which areas have art and silently omits the image block for the rest.
