"""Clean a logo: key out any white backing, then trim to the ink.

Run:  python3 scripts/trimlogo.py assets/credentials/name.png

Two problems arrive with logo files. Some carry an opaque white rectangle
behind the artwork, which is invisible on a white page but makes the file's
bounds meaningless — it will not trim, and it cannot be optically aligned
against anything. Others carry transparent padding, so sized to a shared height
one renders smaller than its neighbour and reads as a mistake.

White is removed by flooding in from the borders rather than by testing colour,
so a white shape *inside* a logo — a white bus on a red circle, say — survives.
"""
import zlib, struct, sys
from collections import deque

path = sys.argv[1]

def read_png(p):
    d = open(p, 'rb').read()
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
    out = bytearray(h*stride); prev = bytearray(stride); p2 = 0
    for y in range(h):
        f = raw[p2]; p2 += 1
        line = bytearray(raw[p2:p2+stride]); p2 += stride
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

W, H, CH, PIX = read_png(path)
PIX = bytearray(PIX)

def alpha(x, y):
    return PIX[(y*W+x)*CH + 3] if CH == 4 else 255

# Key the white backing, if there is one.
if CH == 4:
    def whiteish(x, y):
        i = (y*W+x)*CH
        r, g, b = PIX[i], PIX[i+1], PIX[i+2]
        # Any alpha, not just solid: the edge of a white backing is
        # anti-aliased, and leaving that behind is what puts a faint haze on
        # rows that should be empty — which then defeats the trim.
        return PIX[i+3] > 8 and (r+g+b)/3 > 238 and max(r,g,b)-min(r,g,b) < 14

    seen = bytearray(W*H); q = deque()
    for x in range(W):
        for y in (0, H-1):
            if not seen[y*W+x] and whiteish(x, y): seen[y*W+x] = 1; q.append((x, y))
    for y in range(H):
        for x in (0, W-1):
            if not seen[y*W+x] and whiteish(x, y): seen[y*W+x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x+dx, y+dy
            if 0 <= nx < W and 0 <= ny < H and not seen[ny*W+nx] and whiteish(nx, ny):
                seen[ny*W+nx] = 1; q.append((nx, ny))

    keyed = sum(seen)
    if keyed:
        for i in range(W*H):
            if seen[i]: PIX[i*CH + 3] = 0
        print(f'  keyed {keyed} white background px ({keyed*100//(W*H)}%)')

PIX = bytes(PIX)

def opaque(x, y):
    return alpha(x, y) > 30

xs = [x for y in range(H) for x in range(W) if opaque(x, y)]
ys = [y for y in range(H) for x in range(W) if opaque(x, y)]
X0, X1, Y0, Y1 = min(xs), max(xs), min(ys), max(ys)
NW, NH = X1-X0+1, Y1-Y0+1

rows = []
for y in range(Y0, Y1+1):
    row = bytearray()
    for x in range(X0, X1+1):
        i = (y*W+x)*CH
        if CH == 4: row += PIX[i:i+4]
        else: row += bytes((PIX[i], PIX[i+1], PIX[i+2], 255))
    rows.append(row)

raw = b''.join(b'\x00'+bytes(r) for r in rows)
def chunk(t, d):
    c = t+d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
open(path,'wb').write(b'\x89PNG\r\n\x1a\n'
    + chunk(b'IHDR', struct.pack('>IIBBBBB', NW, NH, 8, 6, 0, 0, 0))
    + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
print(f'{path}: {W}x{H} -> {NW}x{NH}')

# Where the mark sits inside the trimmed file, so an --optical value can be
# chosen for it. Rows carrying real weight only — a stray anti-aliased speck
# at the edge would otherwise define the bounds.
weights = [sum(rows[y][x*4+3]/255 for x in range(NW)) for y in range(NH)]
peak = max(weights)
solid = [y for y, w in enumerate(weights) if w > peak*0.35]
centre = (solid[0]+solid[-1]) / 2 / NH * 100
print(f'  its heaviest band is rows {solid[0]}-{solid[-1]}, centred at {centre:.1f}%')
print(f'  a mark centred there wants  --optical: {50-centre:.1f}%')
print('  (check it against the part of the logo that is the identity — for a')
print('   lockup that is usually the wordmark, not the whole thing)')
