import zlib, struct, sys
from collections import deque

SRC = sys.argv[1]

def read_png(path):
    d = open(path,'rb').read()
    pos, idat, meta = 8, b'', None
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]; typ = d[pos+4:pos+8]
        body = d[pos+8:pos+8+ln]
        if typ == b'IHDR': meta = struct.unpack('>IIBBBBB', body)
        elif typ == b'IDAT': idat += body
        pos += 12 + ln
    w, h, depth, ctype, _, _, inter = meta
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
print(f'source {W}x{H}, {CH} channels')
for name, (x, y) in [('top-left',(2,2)), ('top-right',(W-3,2)), ('bottom-left',(2,H-3))]:
    i = (y*W+x)*CH
    print(f'  {name} corner: {PIX[i]},{PIX[i+1]},{PIX[i+2]}')

# Background = near-white AND near-grey, reached from the border.
#
# Flood fill from the edges rather than thresholding globally: the face has
# highlights nearly as light as the backdrop, and a global threshold would
# punch holes straight through them.
LUM, SAT = 232, 20
def is_bg(x, y):
    i = (y*W+x)*CH
    r, g, b = PIX[i], PIX[i+1], PIX[i+2]
    return (r+g+b)/3 > LUM and max(r,g,b)-min(r,g,b) < SAT

mask = bytearray(W*H)
q = deque()
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

filled = sum(mask)
print(f'background: {filled} px ({filled/(W*H)*100:.1f}%)')

# Grow the background by one pixel. JPEG ringing leaves a pale rim just inside
# the silhouette that the fill will not claim, and that rim reads as a white
# halo once the icon is on a dark tab strip.
grown = bytearray(mask)
for y in range(H):
    for x in range(W):
        if mask[y*W+x]:
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < W and 0 <= ny < H: grown[ny*W+nx] = 1
mask = grown

# Crop, as x, y and side in source pixels. Overridable from the command line so
# the same script can re-cut the icon when the avatar changes.
CX0 = int(sys.argv[2]) if len(sys.argv) > 2 else 400
CY0 = int(sys.argv[3]) if len(sys.argv) > 3 else 66
SIDE = int(sys.argv[4]) if len(sys.argv) > 4 else 230

def downscale(size, opaque_bg=None):
    """Box filter over premultiplied alpha, so edges blend without a halo."""
    step = SIDE/size
    rows = []
    for ty in range(size):
        row = bytearray()
        y0, y1 = int(CY0+ty*step), int(CY0+(ty+1)*step)
        for tx in range(size):
            x0, x1 = int(CX0+tx*step), int(CX0+(tx+1)*step)
            r = g = b = a = n = 0
            for y in range(y0, max(y1, y0+1)):
                for x in range(x0, max(x1, x0+1)):
                    if not (0 <= x < W and 0 <= y < H): continue
                    n += 1
                    if mask[y*W+x]: continue          # transparent, contributes 0
                    i = (y*W+x)*CH
                    r += PIX[i]; g += PIX[i+1]; b += PIX[i+2]; a += 255
            if n == 0: row += bytes((0,0,0,0)); continue
            alpha = a//n
            if alpha == 0:
                row += bytes(opaque_bg+(255,)) if opaque_bg else bytes((0,0,0,0))
            else:
                cov = a/255                            # opaque samples in this cell
                cr, cg, cb = int(r/cov), int(g/cov), int(b/cov)
                if opaque_bg:                          # composite onto a flat colour
                    f = alpha/255
                    cr = int(cr*f + opaque_bg[0]*(1-f))
                    cg = int(cg*f + opaque_bg[1]*(1-f))
                    cb = int(cb*f + opaque_bg[2]*(1-f))
                    alpha = 255
                row += bytes((min(cr,255), min(cg,255), min(cb,255), alpha))
        rows.append(row)
    return rows

def encode_png(rows, size):
    raw = b''.join(b'\x00'+bytes(r) for r in rows)
    def chunk(t, d):
        c = t+d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

open('favicon.png','wb').write(encode_png(downscale(64), 64))

sizes = [16, 32, 48]
pngs = {s: encode_png(downscale(s), s) for s in sizes}
ico = struct.pack('<HHH', 0, 1, len(sizes)); off = 6+16*len(sizes)
for s in sizes:
    ico += struct.pack('<BBBBHHII', s, s, 0, 0, 1, 32, len(pngs[s]), off); off += len(pngs[s])
for s in sizes: ico += pngs[s]
open('favicon.ico','wb').write(ico)

# White behind this one only. iOS fills transparent pixels with black on a home
# screen, and the icon is mostly dark hair — on black it would lose its top half.
open('apple-touch-icon.png','wb').write(encode_png(downscale(180, opaque_bg=(255,255,255)), 180))
print('written: favicon.png (64) and favicon.ico (16/32/48) transparent, '
      'apple-touch-icon.png (180) on white')
