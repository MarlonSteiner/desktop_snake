# desktop_snake

The source for [marlonsteiner.studio](https://marlonsteiner.studio) — a landing
page that is also a playable snake game. The page reads as a normal site first;
the game lives on a canvas layered behind the content.

Desktop only for now. Mobile controls come later.

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
7. ~~Glitch fruit and modifiers~~ ← *current*
8. Polish: colors, countdown UI, resize handling

## Stickers

The snake eats cutouts of me rather than fruit — seven of them, one picked at
random per apple. They are drawn three cells across while the hitbox stays a
single cell, so aim for the middle. See
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

Every modifier changes how the snake *handles*, never where it can go. One that
made the page content lethal, SOLID, was removed: its hitbox came from measured
DOM boxes, which are larger than the letterforms people actually see, so deaths
read as arbitrary.

They live in one table in `constants.js`. A modifier that only changes speed
needs nothing but a new row there.

## Parked

- **Control hint on first load.** A key-cluster prompt drawn on the canvas near
  the snake, fading out on first input. Planned for stage 8.
- **Mobile controls.** A second input source alongside `input.js`; the game
  logic should not need to change.
