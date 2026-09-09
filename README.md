# desktop_snake

### → [marlonsteiner.studio](https://marlonsteiner.studio) — go play it

The source for the site above: a landing page that is also a playable snake
game. The page reads as a normal site first — the game lives on a canvas
layered behind the content, and everything works if it never starts.

Keyboard on desktop, swipe on touch.

## Stack

Plain JavaScript with native ES modules, HTML Canvas, and Tailwind via the CDN
script tag. No build step, no npm, no bundler — the files you edit are the files
the browser runs.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Opening `index.html` directly with `file://` will break once ES modules are
added, so use the server.

## Controls

| Key | Action |
| --- | --- |
| Arrow keys / WASD | Move (the first press also starts the game) |

| Space | Restart after game over |
| Escape | Close the CV panel |

The screen edges wrap: leave on the right and you come back on the left. The
snake passes straight through the headline, the logos and the footer — the only
way to lose is to bite yourself. The document icon in the top right opens the
CV; the game pauses while it is open. The headline flares rainbow for a moment
each time the snake eats, and is black the rest of the time.

## Deploy

GitHub Pages serves the repository root. `CNAME` points the site at
`marlonsteiner.studio`.

## Build stages

1. ~~Static page — markup, logos, hamburger, footer~~
2. ~~Canvas layered behind, grid from viewport, static snake~~
3. ~~Movement, fixed-timestep loop, keyboard input~~
4. ~~Apples, growth, scoring~~
5. ~~Obstacles from DOM bounds, collision, game over, restart~~
6. ~~CV panel and pause~~
7. ~~Glitch fruit and modifiers~~
8. ~~Polish: control hint, resize handling~~ ← *done*

## CV

The panel holds the CV as editable HTML, and the download icon in its corner
serves `assets/cv/Marlon_Steiner_CV.pdf` — the designed PDF, with no phone
number in it. See [`assets/cv/README.md`](assets/cv/README.md).

## The avatar

`assets/avatar/body.png` and `head.png` are one illustration cut in two at the
collar. `avatar.js` tilts the head layer toward the snake; the typing bounce is
CSS. Regenerate the pair with:

```bash
sips -s format png source.jpeg --out /tmp/desk.png
python3 scripts/mkavatar.py /tmp/desk.png
```

It prints the `transform-origin` to paste into `AVATAR.pivot` in
`constants.js` — that is the point on the collar the head swings around.

## Stickers

The snake eats cutouts of me rather than fruit — seven of them, one picked at
random per apple. They are drawn three cells across, and the hitbox is the same
3x3 block, so you eat what you can see. See
[`assets/stickers/README.md`](assets/stickers/README.md) for what to drop in and
how to register it. Falls back to a plain circle when an image is missing or
still loading, so the game is playable before the assets arrive.

## The twist

Every 15 seconds a magenta diamond appears somewhere free and stays for 6,
blinking over its last second and a half. Eating it is worth +5 and starts one
random modifier for 10 seconds. Only one runs at a time — a new one replaces
whatever was going and resets the clock. The snake changing colour is the only
announcement; there is no label or countdown.

| Modifier | Effect |
| --- | --- |
| INVERTED | Indigo. Left and right are swapped. Up and down are left alone, so you can always get your bearings back. |
| RUSH | Orange. The snake moves twice as fast. |
| TURBO | Gold. Three times as fast. |
| FLASH | The page, the snake and everything else vanish and the whole screen cycles through flat colours. Nothing moves, and the snake picks up exactly where it left off. Two and a half seconds, purely for the look of it. |

The first three change how the snake *handles*, never where it can go. FLASH
changes nothing at all — it just interrupts.

Its colours hold for 113ms each — about nine changes a second across the whole
viewport, which is a real strobe. WCAG 2.3.1 puts the photosensitive-seizure
threshold at three full-screen flashes per second, so this sits three times over
that line by choice. Anyone with reduced motion turned on gets a single held
colour instead of a cycle. `FLASH_MS_PER_COLOR` in `constants.js` is the dial;
340 was the last value under the threshold. One that
made the page content lethal, SOLID, was removed: its hitbox came from measured
DOM boxes, which are larger than the letterforms people actually see, so deaths
read as arbitrary.

They live in one table in `constants.js` holding each one's colour, speed and
duration. A modifier that only changes speed needs nothing but a new row there.

## Resizing

Resizing keeps the run going rather than starting over. The board is
re-measured once the dragging stops, and the snake's cells are wrapped into the
new grid — the same thing the edges already do, so a snake that was near the old
right edge reappears on the left. Food only moves if the resize actually
stranded it.

## Input sources

`input.js` (keyboard) and `touch.js` (swipe) are siblings. Both turn raw events
into the same named intents and hand them to the same handlers, and neither
knows the other exists. Adding swipe controls changed no game logic at all —
`game.js`, `renderer.js` and `input.js` were untouched.
