// The bridge between the page and the game board.
//
// The snake passes through everything, so these cells are not walls. They mark
// where the page's own content sits so that apples never spawn underneath the
// headline, where they would be invisible and effectively unreachable.
//
// We ask the DOM where those elements actually are rather than testing against
// rendered glyphs, so this keeps working if you rewrite the headline or change
// the font.

import { CELL_SIZE, HUD } from './constants.js';
import { cellKey } from './game.js';

/**
 * Elements the apples should keep clear of.
 *
 * #text-block is the wrapper, not the <h1> inside it. The <h1> scales when the
 * snake eats, and an element's transform changes its own getBoundingClientRect
 * but not its parent's — so measuring the wrapper keeps this box steady while
 * the headline pops.
 */
const PAGE_SELECTORS = ['#avatar', '#contact-link', '#text-block', '#logo-row', '#menu-button', 'footer'];

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
 * Where the control prompt should sit, described relative to the avatar.
 *
 * The prompt belongs next to the thing it explains, and the avatar is what a
 * visitor is already looking at. Measured from the DOM for the same reason the
 * page cells are: it follows the real layout instead of guessing at a fraction
 * of the viewport.
 */
export function measureHintAnchor() {
  const element = document.querySelector('#avatar');
  if (element === null) return null;

  const rect = element.getBoundingClientRect();
  return {
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    centreX: rect.left + rect.width / 2,
    // Roughly eye level, which is where a prompt beside a figure wants to sit.
    eyeY: rect.top + rect.height * 0.24,
  };
}

/**
 * The box of the letter the snake starts as, or null if it is not there.
 *
 * Measured rather than hardcoded for the same reason as everything else here:
 * the headline is fluid type, so where that letter sits changes with the
 * window.
 */
export function measureStartLetter() {
  const element = document.querySelector('#letter-i');
  if (element === null) return null;

  const rect = element.getBoundingClientRect();
  return { centreX: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom };
}

/**
 * Where the score readout should sit, so it lines up with the CV icon opposite.
 *
 * The x is the button's own inset mirrored to the left edge, so the two sit on
 * matching margins however the page padding changes; the y is the button's
 * centre line.
 */
export function measureHudAnchor() {
  const button = document.querySelector('#menu-button');
  if (button === null) return null;

  const rect = button.getBoundingClientRect();
  return {
    x: window.innerWidth - rect.right,
    y: rect.top + rect.height / 2,
  };
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

  // The score readout is drawn on the canvas, so there is no element to
  // measure — but it takes up space like everything else here, and an apple
  // behind it looks unreachable. Reserved from the same anchor the renderer
  // draws it at, so the two cannot disagree.
  const hud = measureHudAnchor();
  if (hud !== null) {
    rectToCells(grid, {
      left: hud.x,
      right: hud.x + HUD.reserve.width,
      top: hud.y - HUD.reserve.height / 2,
      bottom: hud.y + HUD.reserve.height / 2,
    }, cells);
  }

  return cells;
}
