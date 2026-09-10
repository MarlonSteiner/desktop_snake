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

## Aligning a logo

Two nudges, both per-logo, because neither can be worked out from the file alone.

**Size.** A lockup — wordmark, divider, second line — carries far more inside
the same box than a plain wordmark. Matched on box height its type comes out
about half the size of its neighbour's. Give those
`class="credential credential--lockup"`, which allows more height.

**Position.** Centring the boxes lines up the *files*, not the marks inside
them. Ironman's letters sit low in its box because the dot rides above them, so
box-centred it hangs below its neighbour. Add
`style="--optical: -16.3%"` — a shift in percent of the logo's own height, so it
holds at every size.

`trimlogo.py` prints a suggested value. Check it against the part of the logo
that is the identity: for a lockup that is the wordmark, not the whole thing.
The current two are aligned to 0.0px, with cap heights within 0.3px.

## Still to add

le Wagon. `flowton.png` is here and trimmed but deliberately not shown yet.
