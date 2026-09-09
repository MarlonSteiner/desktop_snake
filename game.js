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
  const direction = { x: 1, y: 0 };

  return {
    grid,
    snake: createSnake(grid),
    // Direction is a unit vector so moving is just head.x + direction.x.
    direction,
    // Where input wants to go. Kept separate from `direction` so a turn only
    // takes effect on a tick boundary — see step().
    nextDirection: direction,
    // 'idle' until the first movement key. The game never starts on its own,
    // which is also how we respect prefers-reduced-motion.
    status: 'idle',
  };
}

/** Two vectors pointing directly at each other, e.g. left and right. */
function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

/**
 * Bring a cell back inside the grid if it has gone off an edge.
 *
 * Adding grid.cols before the modulo is what makes -1 wrap to the last column;
 * JavaScript's % keeps the sign of the left operand, so -1 % 53 is -1, not 52.
 *
 * Wrapping is temporary as a movement rule — stage 5 makes edges lethal — but
 * the helper stays, because the PHASE modifier needs exactly this behaviour.
 */
export function wrap(grid, cell) {
  return {
    x: (cell.x + grid.cols) % grid.cols,
    y: (cell.y + grid.rows) % grid.rows,
  };
}

/**
 * Record where the player wants to go, and start the game if it hasn't begun.
 *
 * The intent is stored rather than applied immediately. Applying it here would
 * let two fast keypresses inside a single tick turn the snake 180 degrees —
 * press up then left while moving right and the head would reverse into its own
 * neck. Deferring to the tick means only one turn per move can ever land.
 */
export function queueDirection(state, direction) {
  state.nextDirection = direction;

  if (state.status === 'idle') state.status = 'running';
}

/** Advance the game by exactly one grid cell. */
export function step(state) {
  // Commit the pending turn, unless it would double back on the current one.
  if (!isOpposite(state.direction, state.nextDirection)) {
    state.direction = state.nextDirection;
  }

  const head = state.snake[0];
  const target = wrap(state.grid, {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  });

  // Grow at the front, shrink at the back. Growing later is just skipping the
  // pop, which is why the snake is stored head first.
  state.snake.unshift(target);
  state.snake.pop();
}
