// The bridge between the page and the game board.
//
// The snake passes through everything, so these cells are not walls. They mark
// where the page's own content sits so that apples never spawn underneath the
// headline, where they would be invisible and effectively unreachable.
//
// We ask the DOM where those elements actually are rather than testing against
// rendered glyphs, so this keeps working if you rewrite the headline or change
// the font.

import { CELL_SIZE } from './constants.js';
import { cellKey } from './game.js';

/**
 * Elements the apples should keep clear of.
 *
 * #text-block is the wrapper, not the <h1> inside it. The <h1> scales when the
 * snake eats, and an element's transform changes its own getBoundingClientRect
 * but not its parent's — so measuring the wrapper keeps this box steady while
 * the headline pops.
 */
const PAGE_SELECTORS = ['#contact-link', '#text-block', '#logo-row'];

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
 * Measure the page and return the set of cells its content occupies.
 *
 * A Set of "x,y" strings, so checking a cell is one cheap lookup rather than a
 * scan through a list of rectangles.
 */
export function computePageCells(grid) {
  const cells = new Set();

  for (const selector of PAGE_SELECTORS) {
    const element = document.querySelector(selector);
    if (element === null) continue;

    rectToCells(grid, element.getBoundingClientRect(), cells);
  }

  return cells;
}
