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
6. ~~CV panel and pause~~ ← *current*
7. Glitch fruit and modifiers
8. Polish: colors, countdown UI, resize handling

## Stickers

The snake eats sticker images rather than fruit. See
[`assets/stickers/README.md`](assets/stickers/README.md) for what to drop in and
how to register it. Falls back to a plain circle when no image is available.

## Open question for stage 7

The three planned modifiers were INVERTED, RUSH and PHASE. PHASE let the snake
pass through walls and the text block — which is now the default behaviour, so
it no longer does anything. It needs replacing. The strongest candidate is
SOLID: for ten seconds the headline and logos *do* become lethal, inverting the
usual rule instead of removing it.

## Parked

- **Control hint on first load.** A key-cluster prompt drawn on the canvas near
  the snake, fading out on first input. Planned for stage 8.
- **Mobile controls.** A second input source alongside `input.js`; the game
  logic should not need to change.
