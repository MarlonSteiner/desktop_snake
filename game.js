// Game state and the rules that change it.
//
// Nothing in this file touches the DOM or the canvas. It takes numbers in and
// returns plain objects out, which means you can reason about it (and later
// test it) without a browser.

import { CELL_SIZE, START_LENGTH, START_MARGIN } from './constants.js';

/**
 * Work out how many whole cells fit in the viewport.
 *
 * The viewport is almost never an exact multiple of CELL_SIZE, so there are
 * leftover pixels. We split them evenly into an origin offset, which centres
 * the playfield instead of leaving a dead strip at the right and bottom.
 */
export function createGrid(viewportWidth, viewportHeight) {
  const cols = Math.floor(viewportWidth / CELL_SIZE);
  const rows = Math.floor(viewportHeight / CELL_SIZE);

  return {
    cols,
    rows,
    originX: Math.floor((viewportWidth - cols * CELL_SIZE) / 2),
    originY: Math.floor((viewportHeight - rows * CELL_SIZE) / 2),
  };
}

/**
 * The snake is an array of grid cells, head first. Head-first ordering is what
 * makes movement cheap later: add a new head, drop the last tail cell.
 */
export function createSnake(grid) {
  const y = Math.floor(grid.rows / 2);
  const headX = START_MARGIN + START_LENGTH - 1;

  const cells = [];
  for (let i = 0; i < START_LENGTH; i++) {
    cells.push({ x: headX - i, y });
  }
  return cells;
}

/**
 * The single object that holds everything the game knows. Passing this around
 * explicitly is what keeps us from accumulating loose global variables.
 */
export function createGameState(grid) {
  return {
    grid,
    snake: createSnake(grid),
    // Direction is a unit vector so moving is just head.x + direction.x.
    direction: { x: 1, y: 0 },
  };
}
