# scripts

Build-time helpers. Nothing here runs in the browser and the site does not
depend on it — these are for regenerating assets by hand.

## mkicon.py

Builds `favicon.png`, `favicon.ico` and `apple-touch-icon.png` from a source
image.

```bash
sips -s format png source.jpg --out /tmp/avatar.png
python3 scripts/mkicon.py /tmp/avatar.png
```

It flood-fills the near-white background from the borders — rather than
thresholding globally, which would punch holes through the light parts of the
face — grows that mask by a pixel to eat the JPEG rim, then box-filters down
over premultiplied alpha so the small sizes have clean edges instead of a white
halo.

`CX0`, `CY0` and `SIDE` near the bottom are the crop rectangle. Adjust them if
you swap in a differently framed source.
