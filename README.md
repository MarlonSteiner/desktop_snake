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

## Deploy

GitHub Pages serves the repository root. `CNAME` points the site at
`marlonsteiner.studio`.

## Build stages

1. ~~Static page — markup, logos, hamburger, footer~~
2. ~~Canvas layered behind, grid from viewport, static snake~~
3. ~~Movement, fixed-timestep loop, keyboard input~~
4. ~~Apples, growth, scoring~~ ← *current*
5. Obstacles from DOM bounds, collision, game over, restart
6. Hamburger menu with CV panel and pause
7. Glitch fruit and modifiers
8. Polish: colors, countdown UI, resize handling

## Parked

- **Control hint on first load.** A key-cluster prompt drawn on the canvas near
  the snake, fading out on first input. Planned for stage 8.
- **Mobile controls.** A second input source alongside `input.js`; the game
  logic should not need to change.
