"""Trim transparent padding from a logo so a row of them lines up.

Run:  python3 scripts/trimlogo.py assets/credentials/name.png

Logos arrive with wildly different amounts of built-in padding. Sized to a
shared height, one with 16% empty space at the bottom renders 16% smaller than
its neighbour — which reads as a mistake even though every box is the same
height. Trimming to the ink first is what makes one CSS rule work for all of
them.
"""
import zlib, struct, sys

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

def opaque(x, y):
    i = (y*W+x)*CH
    return (PIX[i+3] if CH == 4 else 255) > 30

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
