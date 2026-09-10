// Entry point. This is the only file that talks to both the page and the game:
// it owns the canvas, the loop, and the wiring between input, state and render.

import { TICKS_PER_SECOND, MAX_FRAME_MS, STICKERS, DANCERS, RESIZE_SETTLE_MS, CELL_SIZE, HAPTICS } from './constants.js';
import {
  createGrid,
  createGameState,
  queueDirection,
  step,
  advanceTime,
  resizeGame,
  cellKey,
} from './game.js';
import {
  computePageCells,
  measureHintAnchor,
  measureHudAnchor,
  measureStartLetter,
} from './obstacles.js';
import { attachKeyboardInput } from './input.js';
import { attachTouchInput } from './touch.js';
import { attachMenu } from './menu.js';
import { speedMultiplier, isFlashing } from './modifiers.js';
import { createHeadlineBurst } from './headline.js';
import { createAvatarGaze, startBlinking } from './avatar.js';
import { buzz } from './haptics.js';
import { initTheme, toggleTheme } from './theme.js';
import { loadImages } from './images.js';
import { resizeCanvas, render, renderSnake } from './renderer.js';

const page = document.getElementById('page');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// The snake gets its own canvas above the page so it can cut through the text.
const snakeCanvas = document.getElementById('snake');
const snakeCtx = snakeCanvas.getContext('2d');

// The headline letter the snake is standing in for. Hidden from here rather
// than from CSS, so the word is complete for anyone without JavaScript.
const startLetter = document.getElementById('letter-i');

/**
 * Hand the letter over to the snake, and take it back again.
 *
 * The letter stays on screen until the first keypress — it is the better
 * version of the picture, being the actual glyph — and only then hides so the
 * snake can grow out of its shape. It fades back once no part of the snake is
 * standing on those cells any more.
 */
function updateStartLetter(state) {
  if (startLetter === null || state.startCells.length === 0) return;

  const held = startLetter.classList.contains('is-snake');

  if (!held) {
    if (state.status !== 'idle' && state.emergeMs > 0) startLetter.classList.add('is-snake');
    return;
  }

  const stillThere = state.snake.some((cell) => state.startCells.includes(cellKey(cell)));
  if (!stillThere) startLetter.classList.remove('is-snake');
}

/**
 * The desk scene is the light switch.
 *
 * Clicking the figure, the desk, the laptop or the lamp toggles the theme —
 * but only where the picture is actually opaque, so a click on the empty
 * corners of its box does nothing. The lamp is a separate SVG drawn on top and
 * counts wherever it is hit.
 */
function attachLampSwitch() {
  const avatar = document.getElementById('avatar');
  const body = avatar === null ? null : avatar.querySelector('img');
  const lamp = document.getElementById('lamp');
  if (avatar === null || body === null) return;

  // Built once and kept, so an alpha lookup does not redraw the image on every
  // click.
  let hit = null;

  const isOpaqueAt = (event) => {
    if (hit === null) {
      if (!body.complete || body.naturalWidth === 0) return true;
      const canvas = document.createElement('canvas');
      canvas.width = body.naturalWidth;
      canvas.height = body.naturalHeight;
      canvas.getContext('2d').drawImage(body, 0, 0);
      hit = canvas.getContext('2d');
    }

    const box = avatar.getBoundingClientRect();
    const x = Math.floor(((event.clientX - box.left) / box.width) * hit.canvas.width);
    const y = Math.floor(((event.clientY - box.top) / box.height) * hit.canvas.height);
    if (x < 0 || y < 0 || x >= hit.canvas.width || y >= hit.canvas.height) return false;

    return hit.getImageData(x, y, 1, 1).data[3] > 20;
  };

  const flip = () => {
    const dark = toggleTheme();
    avatar.setAttribute('aria-pressed', String(dark));
    avatar.setAttribute('aria-label', dark ? 'Turn the desk lamp off' : 'Turn the desk lamp on');
    buzz(HAPTICS.eat);
  };

  avatar.addEventListener('click', (event) => {
    if (lamp !== null && lamp.contains(event.target)) { flip(); return; }
    if (isOpaqueAt(event)) flip();
  });

  avatar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      flip();
    }
  });
}

const burstHeadline = createHeadlineBurst(document.getElementById('headline'));
/**
 * Pictures, fetched when the game starts rather than when the page loads.
 *
 * Together they are about 1.2MB, and none of it is on screen until someone
 * plays: food is hidden while idle, and the earliest a dancer can appear is the
 * first glitch fruit, fifteen seconds in. Loading them up front would make the
 * page slower for every visitor who only reads it.
 */
const art = { stickers: [], dancers: [] };
let artRequested = false;

function loadArt() {
  if (artRequested) return;
  artRequested = true;

  art.stickers = loadImages(STICKERS);
  art.dancers = loadImages(DANCERS);
}
const lookAtSnake = createAvatarGaze(
  document.getElementById('avatar-head'),
  document.getElementById('avatar'),
);
startBlinking(document.getElementById('avatar-blink'));
initTheme();
attachLampSwitch();

/** How much game time one tick represents at normal speed. */
const BASE_TICK_MS = 1000 / TICKS_PER_SECOND;

let state = null;

// Pausing is a page concern, not a game rule, so it lives here rather than on
// the game state. The state object stays purely about the snake.
let isPaused = false;

// Tracked so the class is only touched when it actually changes, rather than
// on every one of the sixty frames a second.
let isPageHidden = false;

/**
 * Hide or restore the page content during FLASH.
 *
 * visibility, not display: the layout has to stay exactly where it is, because
 * obstacles.js measures those same elements and a resize mid-flash would
 * otherwise read every box as zero.
 */
function setPageHidden(hidden) {
  if (hidden === isPageHidden) return;

  isPageHidden = hidden;
  page.classList.toggle('page-hidden', hidden);
}

/** Measure the viewport and the page as they are right now. */
function measure() {
  // The letter first: the grid is aligned to it, so it has to be known before
  // the grid exists.
  const startLetter = measureStartLetter();
  const grid = createGrid(window.innerWidth, window.innerHeight, startLetter);

  return {
    grid,
    startLetter,
    pageCells: computePageCells(grid),
    hintAnchor: measureHintAnchor(),
    hudAnchor: measureHudAnchor(),
  };
}

/** Build the world for the first time. */
function setup() {
  resizeCanvas(canvas, ctx);
  resizeCanvas(snakeCanvas, snakeCtx);

  state = createGameState({ ...measure(), best: 0 });
}

let resizeTimer = null;

/**
 * Handle a viewport change.
 *
 * The canvas is resized immediately, because leaving a stale bitmap stretched
 * across a new window size looks broken while you drag. Re-measuring the page
 * waits until the resizing stops: the headline is still reflowing during a
 * drag, so boxes measured mid-drag would be wrong anyway, and sweeping every
 * cell sixty times a second to get a wrong answer is the worst of both.
 */
function handleResize() {
  resizeCanvas(canvas, ctx);
  resizeCanvas(snakeCanvas, snakeCtx);

  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => resizeGame(state, measure()), RESIZE_SETTLE_MS);
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

    if (isFlashing(state.twist)) {
      // Nothing moves. Zeroing the accumulator rather than banking the time is
      // what lets the snake resume from exactly where it stopped instead of
      // catching up on everything it missed.
      accumulator = 0;
    } else {
      accumulator += elapsed;

      // `while`, not `if`: a slow frame may owe more than one tick.
      while (accumulator >= tickMs) {
        accumulator -= tickMs;
        if (step(state)) {
        burstHeadline();
        buzz(HAPTICS.eat);
      }
      }
    }
  } else {
    // Don't bank time while idle or paused, or the game would lurch forward
    // the moment it resumes.
    accumulator = 0;
  }

  setPageHidden(isFlashing(state.twist));

  // Aim the avatar at the snake's head, in viewport pixels.
  const head = state.snake[0];
  lookAtSnake(
    state.grid.originX + head.x * CELL_SIZE + CELL_SIZE / 2,
    state.grid.originY + head.y * CELL_SIZE + CELL_SIZE / 2,
  );

  updateStartLetter(state);
  render(ctx, state, art);
  renderSnake(snakeCtx, state);
  requestAnimationFrame(frame);
}

setup();
window.addEventListener('resize', handleResize);
// One set of handlers, two sources feeding it. Adding swipe controls needed no
// change to game.js, renderer.js or input.js — which is what the named-handler
// shape in input.js was for.
const controls = {
  onDirection: (direction) => {
    if (isPaused) return;

    loadArt();
    queueDirection(state, direction);
  },
  onRestart: () => {
    if (!isPaused) restart();
  },
};

attachKeyboardInput(controls);
attachTouchInput(controls);
attachMenu({
  onPauseChange: (open) => {
    isPaused = open;
  },
});
requestAnimationFrame(frame);
