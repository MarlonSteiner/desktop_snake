# Credentials

Logos for the row under the headline. To add one:

1. Drop the file in here, then trim its transparent padding:

   ```bash
   python3 scripts/trimlogo.py assets/credentials/name.png
   ```

   Logos ship with wildly different amounts of built-in padding. Sized to a
   shared height, one with 16% empty space at the bottom renders 16% smaller
   than its neighbour — which reads as a mistake even though both boxes are
   the same height.

2. **SVG is best** — it stays sharp at any size and is
   usually a few KB. Otherwise a PNG with a transparent background, about 3x its
   display height (so roughly 120px tall).
3. Add a line to `#credentials` in `index.html`:

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

## Still to add

ETH Zurich (Autonomous Systems Lab) and le Wagon. Both were sent but did not
land in Downloads, so save them there and they can go straight in.
