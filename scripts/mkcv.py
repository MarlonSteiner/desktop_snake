import zlib, struct

# Helvetica advance widths (1/1000 em) for ASCII, so lines wrap where they
# really wrap rather than where a guessed average says they do.
W = {}
for c in range(32, 127): W[chr(c)] = 556
for c, w in {' ':278,'!':278,'"':355,'#':556,'$':556,'%':889,'&':667,"'":191,'(':333,')':333,
  '*':389,'+':584,',':278,'-':333,'.':278,'/':278,':':278,';':278,'<':584,'=':584,'>':584,
  '?':556,'@':1015,'A':667,'B':667,'C':722,'D':722,'E':667,'F':611,'G':778,'H':722,'I':278,
  'J':500,'K':667,'L':556,'M':833,'N':722,'O':778,'P':667,'Q':778,'R':722,'S':667,'T':611,
  'U':722,'V':667,'W':944,'X':667,'Y':667,'Z':611,'[':278,'\\':278,']':278,'^':469,'_':556,
  '`':333,'a':556,'b':556,'c':500,'d':556,'e':556,'f':278,'g':556,'h':556,'i':222,'j':222,
  'k':500,'l':222,'m':833,'n':556,'o':556,'p':556,'q':556,'r':333,'s':500,'t':278,'u':556,
  'v':500,'w':722,'x':500,'y':500,'z':500,'{':334,'|':260,'}':334,'~':584}.items():
    W[c] = w
W['•'] = 350; W['ü'] = 556; W['–'] = 556; W['—'] = 1000

def width(text, size, bold=False):
    # Bold is ~5% wider on average; padding the estimate keeps bold lines inside
    # the column without needing a second table.
    factor = 1.05 if bold else 1.0
    return sum(W.get(ch, 556) for ch in text) / 1000 * size * factor

PAGE_W, PAGE_H = 595.28, 841.89
MARGIN = 54
COL = PAGE_W - MARGIN * 2

def wrap(text, size, maxw, bold=False):
    words, lines, cur = text.split(), [], ''
    for word in words:
        trial = word if cur == '' else cur + ' ' + word
        if width(trial, size, bold) <= maxw:
            cur = trial
        else:
            if cur: lines.append(cur)
            cur = word
    if cur: lines.append(cur)
    return lines

def esc(t):
    out = ''
    for ch in t:
        if ch in '()\\': out += '\\' + ch
        else:
            try: out += ch.encode('cp1252').decode('latin-1')
            except Exception: out += '?'
    return out

pages, ops, y = [], [], PAGE_H - MARGIN

def newpage():
    global ops, y
    if ops: pages.append(ops)
    ops, y = [], PAGE_H - MARGIN

def room(h):
    if y - h < MARGIN + 24: newpage()

def text(t, size, x, yy, bold=False, gray=None):
    f = 'F2' if bold else 'F1'
    color = f'{gray} {gray} {gray} rg\n' if gray is not None else '0 0 0 rg\n'
    ops.append(f'BT\n{color}/{f} {size} Tf\n1 0 0 1 {x:.2f} {yy:.2f} Tm\n({esc(t)}) Tj\nET')

def rule(yy):
    ops.append(f'0.75 w 0 0 0 RG\n{MARGIN} {yy:.2f} m {MARGIN + COL} {yy:.2f} l S')

def name(t):
    global y
    room(34); text(t, 22, MARGIN, y - 22, bold=True); y -= 30

def subtitle(t):
    global y
    room(16); text(t, 10.5, MARGIN, y - 10, gray=0.25); y -= 18

def contact(t):
    global y
    for line in wrap(t, 9, COL):
        room(13); text(line, 9, MARGIN, y - 9, gray=0.3); y -= 12
    y -= 8

def heading(t):
    global y
    room(30); y -= 8
    text(t, 8.5, MARGIN, y - 8, bold=True); y -= 12
    rule(y + 1); y -= 10

def role(t):
    global y
    room(16); text(t, 10.5, MARGIN, y - 10, bold=True); y -= 14

def meta(t):
    global y
    room(13); text(t, 8.5, MARGIN, y - 8, gray=0.4); y -= 13

def bullet(t):
    global y
    lines = wrap(t, 9, COL - 14)
    for i, line in enumerate(lines):
        room(12)
        if i == 0: text('•', 9, MARGIN, y - 9, gray=0.35)
        text(line, 9, MARGIN + 12, y - 9); y -= 11.5
    y -= 1

def para(t):
    global y
    for line in wrap(t, 9, COL):
        room(12); text(line, 9, MARGIN, y - 9); y -= 11.5
    y -= 2

def gap(h=6):
    global y
    y -= h

# ---- content (no phone number) ----
name('MARLON STEINER')
subtitle('Junior Full Stack Developer')
contact('msteiner.sudo@gmail.com  •  linkedin.com/in/marlon-steiner  •  '
        'github.com/MarlonSteiner  •  St. Gallen, Switzerland  •  Available immediately')

heading('PROFILE')
para('Full stack developer with modern web development training and 4+ years of technical '
     'experience across mechanical systems, enterprise software and robotics development.')

heading('EXPERIENCE')
for r, m, bs in [
 ('Freelance Ecommerce Developer', '2025  •  Entrepreneur, Zurich', [
  'Built a jewellery website for Juwelier Mahler on WordPress, responsive across all devices.',
  'Customised themes and applied modern web design principles for a luxury retail presence.',
  'Deployed and hosted on Hostinger, handling domain configuration and ongoing maintenance.',
  'Worked directly with the client to turn business requirements into a working implementation.']),
 ('Inventory Control Specialist', '2024  •  Rheinmetall Air Defence AG, Switzerland', [
  'Documented and managed enterprise inventory systems in SAP, working with complex database records.',
  'Used Jira and Confluence for tracking and technical documentation.',
  'Collaborated with cross-functional engineering and production teams.']),
 ('Assistant – Robotics & Software Development', '2022–2023  •  ETH Zürich Autonomous Systems Lab', [
  'Designed UI for computer software in Figma and Qt Creator, alongside software engineers.',
  'Researched and developed UX concepts from ideation to implementation on robotics projects.',
  'Managed procurement of technical components and coordinated with suppliers.',
  'Supported doctoral and master students with PCB soldering, 3D printing, laser cutting and CAD in Fusion 360.']),
 ('Civil Service – Community Integration', '2022–2023  •  TISG Refugee Center Rosenau, St. Gallen', [
  'Supported Ukrainian refugees with administrative processes, accommodation and integration services.',
  'Organised and taught German language courses.',
  'Managed documentation and database entries in specialised refugee management software.']),
 ('Polymechanic', '2020–2022  •  Gietz AG, Switzerland', [
  'Precision mechanical assembly for punching and embossing machines.',
  'Electrical cabinet wiring, working from schematics.',
  'Worked with engineering teams to optimise manufacturing processes.',
  'Maintained quality standards and technical documentation.'])]:
    role(r); meta(m)
    for b in bs: bullet(b)
    gap()

heading('SKILLS')
for label, items in [
 ('Front end', 'HTML5 & semantic markup, CSS3, Sass/SCSS, JavaScript ES6+, Bootstrap, responsive design, cross-browser compatibility, web performance, accessibility (WCAG)'),
 ('Back end & data', 'Ruby on Rails, Python, C, SQL, PostgreSQL, database design, RESTful API integration'),
 ('Tools & practice', 'Git, Jira, Confluence, agile methodology, software engineering principles, data structures & algorithms, web hosting & deployment, domain management'),
 ('Design & other', 'UX/UI design, Figma, Qt Creator, SAP, WordPress, CAD (Fusion 360), 3D printing, Blender, Unity')]:
    role(label); para(items); gap(2)

heading('EDUCATION')
for r, m, bs in [
 ('Le Wagon Web Development Bootcamp', '2025  •  Cape Town, South Africa', [
  'Full-stack web development with a front-end specialisation.',
  'JavaScript, Ruby on Rails, PostgreSQL, Bootstrap, Flexbox and Grid.',
  'Built "Logs AI", an audio journal application with speech summarisation.',
  'Deployed with Git and Heroku.']),
 ('CS50: Introduction to Computer Science', '2024–2025  •  Harvard University, online', [
  'Computer science fundamentals, algorithms and data structures.',
  'C, Python, SQL, JavaScript, HTML/CSS.']),
 ('Self-directed Computer Science & UX Design study', '2023–2025  •  Independent, St. Gallen', [
  'Computer science fundamentals, UX design principles and modern web technologies.',
  'Google UX Design certification.']),
 ('Federal Certificate in Polymechanics', '2016–2020  •  Swiss Vocational Education System', [
  'Four-year apprenticeship. Specialised in precision assembly and technical systems.'])]:
    role(r); meta(m)
    for b in bs: bullet(b)
    gap()

heading('CERTIFICATIONS')
for b in ['Web Development Certificate – Le Wagon',
          'Swiss Federal Certificate in Polymechanics – Swiss Federal Institute for Vocational Education and Training',
          'UX Design Fundamentals and Process', 'JavaScript Fundamentals',
          'Responsive Web Design', 'Learning How to Learn']:
    bullet(b)

heading('LANGUAGES')
for b in ['English – native', 'German – native', 'Tagalog – fluent']:
    bullet(b)

newpage()

# ---- assemble the PDF ----
objs, streams = [], []
for page_ops in pages:
    streams.append(zlib.compress('\n'.join(page_ops).encode('latin-1')))

n_pages = len(pages)
font1 = 3 + n_pages * 2
font2 = font1 + 1

objs.append((1, f'<< /Type /Catalog /Pages 2 0 R >>'.encode()))
kids = ' '.join(f'{3 + i * 2} 0 R' for i in range(n_pages))
objs.append((2, f'<< /Type /Pages /Count {n_pages} /Kids [{kids}] >>'.encode()))
for i, st in enumerate(streams):
    pid, cid = 3 + i * 2, 4 + i * 2
    objs.append((pid, (f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W:.2f} {PAGE_H:.2f}] '
                       f'/Resources << /Font << /F1 {font1} 0 R /F2 {font2} 0 R >> >> '
                       f'/Contents {cid} 0 R >>').encode()))
    objs.append((cid, f'<< /Length {len(st)} /Filter /FlateDecode >>\nstream\n'.encode() + st + b'\nendstream'))
objs.append((font1, b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'))
objs.append((font2, b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'))

out = bytearray(b'%PDF-1.4\n')
offsets = {}
for num, body in sorted(objs):
    offsets[num] = len(out)
    out += f'{num} 0 obj\n'.encode() + body + b'\nendobj\n'
xref = len(out)
top = max(offsets) + 1
out += f'xref\n0 {top}\n'.encode() + b'0000000000 65535 f \n'
for i in range(1, top):
    out += f'{offsets.get(i, 0):010d} 00000 n \n'.encode()
out += (f'trailer\n<< /Size {top} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n').encode()

open('assets/cv/Marlon_Steiner_CV.pdf', 'wb').write(bytes(out))
print(f'{n_pages} pages, {len(out)} bytes')
