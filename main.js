// Entry point. This is the only file that talks to both the page and the game:
// it owns the canvas, the loop, and the wiring between input, state and render.

import { TICKS_PER_SECOND, MAX_FRAME_MS, STICKERS } from './constants.js';
import { createGrid, createGameState, queueDirection, step } from './game.js';
import { computeBlockedCells } from './obstacles.js';
import { attachKeyboardInput } from './input.js';
import { createHeadlinePop } from './headline.js';
import { loadStickers } from './stickers.js';
import { resizeCanvas, render } from './renderer.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const popHeadline = createHeadlinePop(document.getElementById('headline'));
const stickers = loadStickers(STICKERS);

/** How much game time one tick represents. */
const TICK_MS = 1000 / TICKS_PER_SECOND;

let state = null;

/**
 * Build the world from the current viewport size and the page's real layout.
 *
 * Resizing currently throws the game away and starts over. That is acceptable
 * for now; a later stage will preserve the run instead.
 */
function setup() {
  resizeCanvas(canvas, ctx);

  const grid = createGrid(window.innerWidth, window.innerHeight);
  // The best score outlives the state object it was set on.
  const best = state === null ? 0 : state.best;

  state = createGameState({ grid, blocked: computeBlockedCells(grid), best });
}

/** Start a fresh run on the same board, keeping the session best. */
function restart() {
  if (state.status !== 'over') return;

  state = createGameState({
    grid: state.grid,
    blocked: state.blocked,
    best: state.best,
  });
}

// ── The loop ────────────────────────────────────────────────────────────────
//
// requestAnimationFrame fires once per screen refresh, which is 60 times a
// second on most displays and 120 on some. If we moved the snake once per
// frame, the game would literally run twice as fast on better hardware.
//
// So the frame rate and the game rate are separated. Each frame adds its real
// elapsed time to an accumulator, and we take one tick out of that accumulator
// for every whole TICK_MS it contains. Frames stay as smooth as the display
// allows; the snake moves 8 times a second everywhere.

let accumulator = 0;
let lastFrameTime = performance.now();

function frame(now) {
  const elapsed = Math.min(now - lastFrameTime, MAX_FRAME_MS);
  lastFrameTime = now;

  if (state.status === 'running') {
    accumulator += elapsed;

    // `while`, not `if`: a slow frame may owe more than one tick.
    while (accumulator >= TICK_MS) {
      accumulator -= TICK_MS;
      if (step(state)) popHeadline();
    }
  } else {
    // Don't bank time while idle, or the game would lurch forward on start.
    accumulator = 0;
  }

  render(ctx, state, stickers);
  requestAnimationFrame(frame);
}

setup();
window.addEventListener('resize', setup);
attachKeyboardInput({
  onDirection: (direction) => queueDirection(state, direction),
  onRestart: restart,
});
requestAnimationFrame(frame);
