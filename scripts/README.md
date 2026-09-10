# scripts

Build-time helpers. Nothing here runs in the browser and the site does not
depend on it — these are for regenerating assets by hand.

## mkicon.py

Builds `favicon.png`, `favicon.ico` and `apple-touch-icon.png` from a source
image.

```bash
sips -s format png source.jpg --out /tmp/avatar.png
python3 scripts/mkicon.py /tmp/avatar.png [x y side]
```

Point it at the same image the avatar layers come from, so the tab icon and the
figure on the page are the same face. The crop defaults to the head of the
current desk avatar; pass `x y side` in source pixels to re-frame it.

It flood-fills the near-white background from the borders — rather than
thresholding globally, which would punch holes through the light parts of the
face — grows that mask by a pixel to eat the JPEG rim, then box-filters down
over premultiplied alpha so the small sizes have clean edges instead of a white
halo.

Crop tight: at 16px a head with room around it is a smudge, and the laptop
below the chin reads as a grey smear rather than as a laptop. Head only, filling
the frame.
