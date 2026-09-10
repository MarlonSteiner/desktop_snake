"""Cut a dance pose out of a screenshot and write a transparent PNG.

Run:  python3 scripts/mkdance.py /tmp/pose.png assets/dance/spread.png

These arrive as JPEGs of a transparency checkerboard, so the "transparent"
background is really two greys baked into the pixels. Both are unsaturated and
light, which is also true of the white shoes — so the background is found by
flooding in from the borders rather than by testing colour alone. The shoes are
enclosed by the figure, so the flood never reaches them.
"""
import zlib, struct, sys
from collections import deque

SRC, DST = sys.argv[1], sys.argv[2]
OUT_H = int(sys.argv[3]) if len(sys.argv) > 3 else 700

# The checkerboard runs from about 138 (its dark squares) to 255. Black
# trousers sit near 30 and every other part of the figure is saturated, so a
# low-saturation, light test separates them cleanly.
BG_MIN_LUM, BG_MAX_SAT = 120, 14

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
    return (r+g+b)/3 > BG_MIN_LUM and max(r,g,b)-min(r,g,b) < BG_MAX_SAT

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

# JPEG ringing leaves a pale fringe just inside the silhouette. Two passes,
# because a checkerboard edge rings harder than a flat one.
for _ in range(2):
    grown = bytearray(mask)
    for y in range(H):
        for x in range(W):
            if mask[y*W+x]:
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < W and 0 <= ny < H: grown[ny*W+nx] = 1
    mask = grown

xs = [x for x in range(W) for y in range(0, H, 3) if not mask[y*W+x]]
ys = [y for y in range(H) for x in range(0, W, 3) if not mask[y*W+x]]
X0, X1, Y0, Y1 = min(xs), max(xs), min(ys), max(ys)
BW, BH = X1-X0+1, Y1-Y0+1
scale = BH / OUT_H
OUT_W = round(BW / scale)

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
                if mask[y*W+x]: continue
                i = (y*W+x)*CH
                r += PIX[i]; g += PIX[i+1]; b += PIX[i+2]; a += 255
        if n == 0 or a == 0: row += bytes((0,0,0,0)); continue
        cov = a/255
        row += bytes((min(int(r/cov),255), min(int(g/cov),255), min(int(b/cov),255), a//n))
    rows.append(row)

raw = b''.join(b'\x00'+bytes(r) for r in rows)
def chunk(t, d):
    c = t+d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
open(DST,'wb').write(b'\x89PNG\r\n\x1a\n'
    + chunk(b'IHDR', struct.pack('>IIBBBBB', OUT_W, OUT_H, 8, 6, 0, 0, 0))
    + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
kept = W*H - sum(mask)
print(f'{DST}: bbox {BW}x{BH} -> {OUT_W}x{OUT_H}, figure {kept/(W*H)*100:.0f}% of source')
