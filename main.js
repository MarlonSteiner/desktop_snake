// Entry point. This is the only file that talks to both the page and the game:
// it owns the canvas element, builds the state, and asks the renderer to draw.

import { createGrid, createGameState } from './game.js';
import { resizeCanvas, render } from './renderer.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let state = null;

/**
 * Build the world from the current viewport size and draw it once.
 *
 * Resizing currently throws the game away and starts over. That is fine while
 * the snake is static; a later stage will preserve the run instead.
 */
function setup() {
  resizeCanvas(canvas, ctx);
  state = createGameState(createGrid(window.innerWidth, window.innerHeight));
  render(ctx, state);
}

setup();
window.addEventListener('resize', setup);
