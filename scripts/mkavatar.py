"""Split the avatar into a body layer and a head layer that can be tilted.

Run:  sips -s format png source.jpeg --out /tmp/desk.png
      python3 scripts/mkavatar.py /tmp/desk.png

The head is cut where the face stops and the collar starts. Rotating the head
layer about that line reads as a head turn. The two layers overlap by a few
pixels so a tilt cannot open a hairline of background above the collar.
"""
import zlib, struct, sys
from collections import deque

SRC = sys.argv[1]
# Where the head ends and the collar begins, found by scanning for the row that
# stops being skin and starts being shirt.
HEAD_BOTTOM = 352
# The base layer starts a little higher, so the two layers overlap by a few
# pixels. Without that overlap a tilted head opens a hairline of white above the
# collar; with it, the static chin underneath shows through instead.
BASE_TOP = 344
NECK_X = 515         # centre of the neck: what the head pivots on
OUT_W = 640          # delivered width; drawn at about half this on screen

def read_png(path):
    d = open(path, 'rb').read()
    pos, idat, meta = 8, b'', None
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]
        typ, body = d[pos+4:pos+8], d[pos+8:pos+8+ln]
        if typ == b'IHDR': meta = struct.unpack('>IIBBBBB', body)
        elif typ == b'IDAT': idat += body
        pos += 12 + ln
    w, h, _, ctype, _, _, _ = meta
    ch = {0:1, 2:3, 3:1, 4:2, 6:4}[ctype]
    raw = zlib.decompress(idat); stride = w*ch
    out = bytearray(h*stride); prev = bytearray(stride); p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p+stride]); p += stride
        for i in range(stride):
            a = line[i-ch] if i >= ch else 0
            b = prev[i]; c = prev[i-ch] if i >= ch else 0
            if f == 1: line[i] = (line[i]+a) & 255
            elif f == 2: line[i] = (line[i]+b) & 255
            elif f == 3: line[i] = (line[i]+(a+b)//2) & 255
            elif f == 4:
                pa, pb, pc = abs(b-c), abs(a-c), abs(a+b-2*c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i]+pr) & 255
        out[y*stride:(y+1)*stride] = line; prev = line
    return w, h, ch, bytes(out)

W, H, CH, PIX = read_png(SRC)

def is_bg(x, y):
    i = (y*W+x)*CH
    r, g, b = PIX[i], PIX[i+1], PIX[i+2]
    return (r+g+b)/3 > 234 and max(r,g,b)-min(r,g,b) < 18

mask = bytearray(W*H); q = deque()
for x in range(W):
    for y in (0, H-1):
        if not mask[y*W+x] and is_bg(x,y): mask[y*W+x] = 1; q.append((x,y))
for y in range(H):
    for x in (0, W-1):
        if not mask[y*W+x] and is_bg(x,y): mask[y*W+x] = 1; q.append((x,y))
while q:
    x, y = q.popleft()
    for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx, ny = x+dx, y+dy
        if 0 <= nx < W and 0 <= ny < H and not mask[ny*W+nx] and is_bg(nx,ny):
            mask[ny*W+nx] = 1; q.append((nx,ny))

# The border fill only reaches background it can walk to. Everything under the
# desk is backdrop too, but it is walled in — tabletop above, legs either side,
# floor shadow below — so the fill never arrives and the snake disappears
# behind a solid block.
#
# So: sweep up every backdrop-coloured pixel the fill missed and clear the ones
# that form a large pocket. Large, because a small enclosed highlight is much
# more likely to be part of the figure than a hole in it.
MIN_POCKET = 400

def components(test):
    """Connected runs of pixels satisfying `test`, as lists of indices."""
    seen = bytearray(W*H)
    for sy in range(H):
        for sx in range(W):
            start = sy*W+sx
            if seen[start] or not test(sx, sy): continue
            group, stack = [], [(sx, sy)]
            seen[start] = 1
            while stack:
                x, y = stack.pop()
                group.append(y*W+x)
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < W and 0 <= ny < H and not seen[ny*W+nx] and test(nx, ny):
                        seen[ny*W+nx] = 1; stack.append((nx, ny))
            yield group

pockets = 0
for group in components(lambda x, y: not mask[y*W+x] and is_bg(x, y)):
    if len(group) < MIN_POCKET: continue
    pockets += 1
    for i in group: mask[i] = 1
print(f'cleared {pockets} enclosed backdrop pockets')

# The floor shadow is not backdrop and not the figure — it is the figure's
# shadow on the backdrop. Left solid it swallows the snake in a band across the
# bottom. Treated as black at partial coverage over white, which is what a
# shadow physically is, it keeps its softness and the snake shows through it.
SHADOW_MIN, SHADOW_MAX, SHADOW_SAT = 168, 234, 34
MIN_SHADOW = 5000

def is_shadow(x, y):
    if mask[y*W+x]: return False
    i = (y*W+x)*CH
    r, g, b = PIX[i], PIX[i+1], PIX[i+2]
    return SHADOW_MIN < (r+g+b)/3 < SHADOW_MAX and max(r,g,b)-min(r,g,b) < SHADOW_SAT

shadow = bytearray(W*H)
for group in components(is_shadow):
    # Only a big region is the cast shadow; small grey patches belong to shoes,
    # the chair, the laptop, and must stay solid.
    if len(group) < MIN_SHADOW: continue
    for i in group: shadow[i] = 1
print(f'softened {sum(shadow)} shadow px')

grown = bytearray(mask)
for y in range(H):
    for x in range(W):
        if mask[y*W+x]:
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < W and 0 <= ny < H: grown[ny*W+nx] = 1
mask = grown

xs = [x for x in range(W) for y in range(0, H, 4) if not mask[y*W+x]]
ys = [y for y in range(H) for x in range(0, W, 4) if not mask[y*W+x]]
X0, X1, Y0, Y1 = min(xs), max(xs), min(ys), max(ys)
BW, BH = X1-X0+1, Y1-Y0+1
print(f'figure bbox: x {X0}-{X1}  y {Y0}-{Y1}  ({BW}x{BH})')

scale = BW / OUT_W
OUT_H = round(BH / scale)

def layer(keep):
    """Downscale the figure, keeping only rows `keep` accepts."""
    rows = []
    for ty in range(OUT_H):
        row = bytearray()
        y0, y1 = Y0+int(ty*scale), Y0+int((ty+1)*scale)
        for tx in range(OUT_W):
            x0, x1 = X0+int(tx*scale), X0+int((tx+1)*scale)
            r = g = b = a = n = 0
            for y in range(y0, max(y1, y0+1)):
                for x in range(x0, max(x1, x0+1)):
                    if not (0 <= x < W and 0 <= y < H): continue
                    n += 1
                    if mask[y*W+x] or not keep(y): continue
                    i = (y*W+x)*CH
                    if shadow[y*W+x]:
                        # A shadow of luminance L over white is black at
                        # (255-L)/255 coverage. Recovering that is what lets it
                        # stay soft instead of becoming a grey sticker.
                        opacity = 255 - (PIX[i]+PIX[i+1]+PIX[i+2])//3
                        a += opacity
                        continue                      # colour contribution is black
                    r += PIX[i]; g += PIX[i+1]; b += PIX[i+2]; a += 255
            if n == 0 or a == 0: row += bytes((0,0,0,0)); continue
            cov = a/255
            row += bytes((min(int(r/cov),255), min(int(g/cov),255), min(int(b/cov),255), a//n))
        rows.append(row)
    return rows

def write(path, rows):
    raw = b''.join(b'\x00'+bytes(r) for r in rows)
    def chunk(t, d):
        c = t+d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', OUT_W, OUT_H, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

write('assets/avatar/body.png', layer(lambda y: y >= BASE_TOP))
write('assets/avatar/head.png', layer(lambda y: y < HEAD_BOTTOM))

# Where the head pivots, as a percentage of the shared canvas — CSS
# transform-origin wants it in those terms.
print(f'canvas: {OUT_W}x{OUT_H}')
print(f'transform-origin: {(NECK_X-X0)/BW*100:.1f}% {(HEAD_BOTTOM-Y0)/BH*100:.1f}%')
