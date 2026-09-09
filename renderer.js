// All canvas drawing lives here. This file never decides what happens in the
// game — it only draws whatever state it is handed.

import { CELL_SIZE, COLORS, HUD } from './constants.js';

/**
 * Size the canvas to the viewport, accounting for the device pixel ratio.
 *
 * A canvas has two sizes: its CSS size (how big it looks) and its bitmap size
 * (how many pixels it actually stores). On a retina screen those differ by 2x.
 * If we only set the CSS size, the browser stretches a low-resolution bitmap
 * and everything looks soft. So we set the bitmap to the true pixel count and
 * then scale the drawing context back down, which lets the rest of the code
 * keep working in ordinary CSS pixels.
 */
export function resizeCanvas(canvas, ctx) {
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;

  // setTransform (not scale) because it replaces the transform rather than
  // stacking on top of the previous one every time we resize.
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

/** Convert a grid cell to the pixel position of its top-left corner. */
function cellToPixel(grid, cell) {
  return {
    x: grid.originX + cell.x * CELL_SIZE,
    y: grid.originY + cell.y * CELL_SIZE,
  };
}

function drawSnake(ctx, state) {
  ctx.fillStyle = COLORS.snake;

  for (const cell of state.snake) {
    const { x, y } = cellToPixel(state.grid, cell);
    // The 1px inset leaves a hairline gap so individual segments stay legible
    // instead of merging into one solid bar.
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }
}

/**
 * The apple is a circle while the snake is squares. Shape carries the
 * difference, so the whole game stays legible in one colour.
 */
function drawApple(ctx, state) {
  if (state.apple === null) return;

  const { x, y } = cellToPixel(state.grid, state.apple);
  const radius = CELL_SIZE / 2 - 3;

  ctx.fillStyle = COLORS.apple;
  ctx.beginPath();
  ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.font = HUD.font;
  ctx.letterSpacing = HUD.letterSpacing;
  ctx.textBaseline = 'top';

  ctx.fillText(`SCORE ${state.score}`, HUD.padding, HUD.padding);
  ctx.fillText(`BEST ${state.best}`, HUD.padding, HUD.padding + HUD.lineHeight);
}

/** Draw one complete frame. */
export function render(ctx, state) {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  drawApple(ctx, state);
  drawSnake(ctx, state);
  drawHud(ctx, state);
}
