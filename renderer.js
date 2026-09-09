// All canvas drawing lives here. This file never decides what happens in the
// game — it only draws whatever state it is handed.

import { CELL_SIZE, COLORS, HUD, STICKER_SCALE, TWIST, MODIFIERS } from './constants.js';
import { pickSticker } from './stickers.js';
import { activeModifier, isFlashing, flashIndex } from './modifiers.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  // The snake's colour is the only thing announcing a modifier — no label, no
  // countdown. You feel the change and see it on the snake itself.
  const modifier = activeModifier(state.twist);
  ctx.fillStyle = modifier === null ? COLORS.snake : MODIFIERS[modifier].color;

  for (const cell of state.snake) {
    const { x, y } = cellToPixel(state.grid, cell);
    // The 1px inset leaves a hairline gap so individual segments stay legible
    // instead of merging into one solid bar.
    ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }
}

/**
 * Draw the apple: a sticker if one has loaded, otherwise a circle.
 *
 * The circle is not just a fallback for errors — it is what shows during the
 * first frames while the images are still decoding, so the game is playable
 * before the assets arrive.
 */
function drawApple(ctx, state, stickers) {
  if (state.apple === null) return;

  const { x, y } = cellToPixel(state.grid, state.apple);
  const centreX = x + CELL_SIZE / 2;
  const centreY = y + CELL_SIZE / 2;

  const sticker = pickSticker(stickers, state.apple.variant);

  if (sticker !== null) {
    // Fit inside a square box without stretching. Photos are all different
    // shapes — a full-length one is roughly half as wide as it is tall — so
    // forcing them into a square would squash every face differently. Scaling
    // by the longest side keeps everyone the right shape.
    const box = CELL_SIZE * STICKER_SCALE;
    const scale = box / Math.max(sticker.naturalWidth, sticker.naturalHeight);
    const width = sticker.naturalWidth * scale;
    const height = sticker.naturalHeight * scale;

    // Centred on the cell, so the sticker grows outward from its hitbox.
    ctx.drawImage(sticker, centreX - width / 2, centreY - height / 2, width, height);
    return;
  }

  ctx.fillStyle = COLORS.apple;
  ctx.beginPath();
  ctx.arc(centreX, centreY, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The glitch fruit: a diamond, so it is not just a differently coloured apple.
 * It blinks over its last second and a half to say it is about to leave.
 */
function drawGlitch(ctx, state) {
  const glitch = state.twist.glitch;
  if (glitch === null) return;

  const leaving = glitch.msLeft < TWIST.blinkUnderMs;
  // Derived from the fruit's own clock rather than a frame counter, so the
  // blink runs at the same speed however fast the display refreshes.
  const blinkedOut = leaving && Math.floor(glitch.msLeft / 150) % 2 === 0;
  if (blinkedOut && !prefersReducedMotion.matches) return;

  const { x, y } = cellToPixel(state.grid, glitch);
  const centreX = x + CELL_SIZE / 2;
  const centreY = y + CELL_SIZE / 2;
  const radius = CELL_SIZE / 2 - 1;

  ctx.fillStyle = COLORS.glitch;
  ctx.beginPath();
  ctx.moveTo(centreX, centreY - radius);
  ctx.lineTo(centreX + radius, centreY);
  ctx.lineTo(centreX, centreY + radius);
  ctx.lineTo(centreX - radius, centreY);
  ctx.closePath();
  ctx.fill();
}

/** The restart prompt, low in the page where nothing else is competing. */
function drawGameOver(ctx, state) {
  if (state.status !== 'over') return;

  ctx.fillStyle = COLORS.hint;
  ctx.font = HUD.font;
  ctx.letterSpacing = HUD.letterSpacing;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';

  ctx.fillText(
    'PRESS SPACE TO RESTART',
    window.innerWidth / 2,
    window.innerHeight * 0.76,
  );

  // Leave the context as we found it, or the HUD would start drawing centred.
  ctx.textAlign = 'left';
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.font = HUD.font;
  ctx.letterSpacing = HUD.letterSpacing;
  ctx.textBaseline = 'top';

  ctx.fillText(`SCORE ${state.score}`, HUD.padding, HUD.padding);
  ctx.fillText(`BEST ${state.best}`, HUD.padding, HUD.padding + HUD.lineHeight);
}

/** The whole viewport in one flat colour, cycling. */
function drawFlash(ctx, state) {
  // Reduced motion gets the effect without the strobe: one colour, held.
  const index = prefersReducedMotion.matches ? 0 : flashIndex(state.twist);

  ctx.fillStyle = COLORS.flash[index % COLORS.flash.length];
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

/** Draw one complete frame. */
export function render(ctx, state, stickers) {
  // FLASH is the whole frame. Returning here is what makes the snake, the
  // apple and the score vanish — there is no hiding logic anywhere else,
  // they simply are not drawn.
  if (isFlashing(state.twist)) {
    drawFlash(ctx, state);
    return;
  }

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  drawApple(ctx, state, stickers);
  drawGlitch(ctx, state);
  drawSnake(ctx, state);
  drawHud(ctx, state);
  drawGameOver(ctx, state);
}
