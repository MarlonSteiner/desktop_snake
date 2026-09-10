# Credentials

Logos for the row under the headline. To add one:

1. Drop the file in here. **SVG is best** — it stays sharp at any size and is
   usually a few KB. Otherwise a PNG with a transparent background, about 3x its
   display height (so roughly 120px tall).
2. Add a line to `#credentials` in `index.html`:

```html
<img src="assets/credentials/eth.png" alt="ETH Zurich" class="credential" />
```

The `alt` text matters: these are claims about where you studied and worked, and
a screen reader has nothing else to go on.

`.credential` sizes every logo to the same height and renders it grey until
hovered, so a row of different brand colours does not compete with the headline
right above it. Logos that are mostly white will disappear on the white page —
use a dark version where one exists.

The row hides itself while it is empty, so there is no gap before the first logo
lands.
