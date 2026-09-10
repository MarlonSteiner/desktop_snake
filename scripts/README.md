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

Crop very tight — hair and eyes, nothing below. Two rounds of this taught the
lesson: anything under the chin (a laptop, a collar) stops being that thing at
16px and becomes a grey smear under a face. The recognisable part of a person at
this size is the hair line and the eyes, so give them the whole frame.

All three outputs are transparent. Note that iOS paints transparent pixels black
when a site is saved to a home screen, so `apple-touch-icon.png` sits on black
there; pass an `opaque_bg` in the script if that is ever unwanted.
