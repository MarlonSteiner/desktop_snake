# Stickers

The things the snake eats. Drop image files in here, then list them in
`STICKERS` in `constants.js`:

```js
export const STICKERS = [
  'assets/stickers/marlon-grin.png',
  'assets/stickers/marlon-shades.png',
];
```

## What works well

- **Square PNGs with a transparent background.** A rectangular photo with a
  white box around it will read as a white box on a white page.
- **128×128 or 256×256.** They are drawn at roughly 46px, so anything larger is
  wasted bytes on a page with no build step to optimise them.
- **Tight crop, high contrast.** At this size a full-body shot is a smudge. Face
  filling most of the frame, cut out from the background.
- **Keep each file under ~40KB.** There is no bundler here; every file is served
  as-is.

## How they behave

Each apple picks one at spawn and keeps it until eaten, so several different
faces can appear over a run. Anything that fails to load is skipped with a
console warning and that apple falls back to a plain black circle — a missing
file can never break the page.

## What is in here

Seven cutouts, resized to 256px on the longest side with
`sips -Z 256 in.png --out out.png` — the originals were 4000–9000px and 11–31MB
each, which is a lot to ship for something drawn at 72px.

| File | |
| --- | --- |
| `cap.png` | backwards cap, thumbs up |
| `shades.png` | sunglasses and headphones |
| `hood.png` | red hoodie, toothpick |
| `backpack.png` | cap and backpack |
| `facemask.png` | sheet mask |
| `redjacket.png` | red jacket, mirror selfie |
| `reading.png` | orange hoodie, reading |

The last two are full-length shots, so most of the sticker is body and the face
ends up around 15px. Cropping them to head-and-shoulders would make them read
far better than any amount of scaling.
