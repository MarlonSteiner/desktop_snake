// The bridge between the page and the game board.
//
// The centred text is a solid wall the snake dies on. Rather than testing
// collisions against rendered glyphs — which would mean reading pixels back
// every frame and would break the moment the font or wording changed — we ask
// the DOM where those elements actually are and convert their boxes into a set
// of blocked grid cells, once, at load and on resize.

import { CELL_SIZE } from './constants.js';
import { cellKey } from './game.js';

/**
 * Elements that block the snake.
 *
 * #text-block is the wrapper, not the <h1> inside it. The <h1> scales when the
 * snake eats, and an element's transform changes its own getBoundingClientRect
 * but not its parent's — so measuring the wrapper keeps the wall still while
 * the headline pops.
 */
const OBSTACLE_SELECTORS = ['#text-block', '#logo-row'];

/** Convert one viewport rectangle into the grid cells it covers. */
function rectToCells(grid, rect, into) {
  // The rect is in viewport pixels; the grid starts at originX/originY, so the
  // origin has to come off before dividing into cells.
  const firstCol = Math.floor((rect.left - grid.originX) / CELL_SIZE);
  const lastCol = Math.ceil((rect.right - grid.originX) / CELL_SIZE) - 1;
  const firstRow = Math.floor((rect.top - grid.originY) / CELL_SIZE);
  const lastRow = Math.ceil((rect.bottom - grid.originY) / CELL_SIZE) - 1;

  // Clamp, because an element can sit partly outside the grid — the leftover
  // pixels at the edges are not part of any cell.
  for (let y = Math.max(0, firstRow); y <= Math.min(grid.rows - 1, lastRow); y++) {
    for (let x = Math.max(0, firstCol); x <= Math.min(grid.cols - 1, lastCol); x++) {
      into.add(cellKey({ x, y }));
    }
  }
}

/**
 * Measure the page and return the set of cells the snake cannot enter.
 *
 * Returns a Set of "x,y" strings so membership is a single cheap lookup rather
 * than a scan through a list of rectangles on every tick.
 */
export function computeBlockedCells(grid) {
  const blocked = new Set();

  for (const selector of OBSTACLE_SELECTORS) {
    const element = document.querySelector(selector);
    if (element === null) continue;

    rectToCells(grid, element.getBoundingClientRect(), blocked);
  }

  return blocked;
}
