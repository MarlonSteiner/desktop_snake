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

`placeholder.png` is a generated stand-in. Delete it once you have real ones.
