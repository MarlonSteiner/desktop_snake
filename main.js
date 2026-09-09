// Entry point. This is the only file that talks to both the page and the game:
// it owns the canvas, the loop, and the wiring between input, state and render.

import { TICKS_PER_SECOND, MAX_FRAME_MS, STICKERS } from './constants.js';
import { createGrid, createGameState, queueDirection, step, advanceTime } from './game.js';
import { computePageCells } from './obstacles.js';
import { attachKeyboardInput } from './input.js';
import { attachMenu } from './menu.js';
import { speedMultiplier } from './modifiers.js';
import { createHeadlineBurst } from './headline.js';
import { loadStickers } from './stickers.js';
import { resizeCanvas, render } from './renderer.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const burstHeadline = createHeadlineBurst(document.getElementById('headline'));
const stickers = loadStickers(STICKERS);

/** How much game time one tick represents at normal speed. */
const BASE_TICK_MS = 1000 / TICKS_PER_SECOND;

let state = null;

// Pausing is a page concern, not a game rule, so it lives here rather than on
// the game state. The state object stays purely about the snake.
let isPaused = false;

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

  state = createGameState({ grid, pageCells: computePageCells(grid), best });
}

/** Start a fresh run on the same board, keeping the session best. */
function restart() {
  if (state.status !== 'over') return;

  state = createGameState({
    grid: state.grid,
    pageCells: state.pageCells,
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

  if (state.status === 'running' && !isPaused) {
    // Clocks first: a modifier that expires this frame should not get to
    // govern the ticks that follow it.
    advanceTime(state, elapsed);

    // RUSH shortens the tick, which is the only thing that changes the snake's
    // speed. Read once per frame, after the clocks have moved.
    const tickMs = BASE_TICK_MS / speedMultiplier(state.twist);

    accumulator += elapsed;

    // `while`, not `if`: a slow frame may owe more than one tick.
    while (accumulator >= tickMs) {
      accumulator -= tickMs;
      if (step(state)) burstHeadline();
    }
  } else {
    // Don't bank time while idle or paused, or the game would lurch forward
    // the moment it resumes.
    accumulator = 0;
  }

  render(ctx, state, stickers);
  requestAnimationFrame(frame);
}

setup();
window.addEventListener('resize', setup);
attachKeyboardInput({
  onDirection: (direction) => {
    if (!isPaused) queueDirection(state, direction);
  },
  onRestart: () => {
    if (!isPaused) restart();
  },
});
attachMenu({
  onPauseChange: (open) => {
    isPaused = open;
  },
});
requestAnimationFrame(frame);
