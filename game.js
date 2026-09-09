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

/** The three starting cells on a given row, head first. */
function startCellsOnRow(row) {
  const headX = START_MARGIN + START_LENGTH - 1;

  const cells = [];
  for (let i = 0; i < START_LENGTH; i++) {
    cells.push({ x: headX - i, y: row });
  }
  return cells;
}

/**
 * The snake is an array of grid cells, head first. Head-first ordering is what
 * makes movement cheap: add a new head, drop the last tail cell.
 *
 * We want to start near the vertical middle, but on a narrow window the
 * headline reaches the left edge and the middle rows are wall. So we start at
 * the middle row and walk outwards — up one, down one, up two — until we find a
 * row where all three starting cells are free. Without this the snake can spawn
 * inside the text and die on its first move.
 */
export function createSnake(grid, blocked) {
  const middle = Math.floor(grid.rows / 2);

  for (let offset = 0; offset <= grid.rows; offset++) {
    const candidates = offset === 0 ? [middle] : [middle - offset, middle + offset];

    for (const row of candidates) {
      if (row < 0 || row >= grid.rows) continue;

      const cells = startCellsOnRow(row);
      if (cells.every((cell) => !blocked.has(cellKey(cell)))) return cells;
    }
  }

  // Every row is blocked, which should be impossible. Start in the middle and
  // let the player see a very short game rather than crashing the page.
  return startCellsOnRow(middle);
}

/**
 * The single object that holds everything the game knows. Passing this around
 * explicitly is what keeps us from accumulating loose global variables.
 */
export function createGameState({ grid, blocked, best = 0 }) {
  const direction = { x: 1, y: 0 };

  const state = {
    grid,
    // The cells the page itself occupies. Walls for the snake, and off-limits
    // to apples.
    blocked,
    snake: createSnake(grid, blocked),
    // Direction is a unit vector so moving is just head.x + direction.x.
    direction,
    // Where input wants to go. Kept separate from `direction` so a turn only
    // takes effect on a tick boundary — see step().
    nextDirection: direction,
    // 'idle' until the first movement key, then 'running', then 'over'. The
    // game never starts on its own, which is also how we respect
    // prefers-reduced-motion.
    status: 'idle',
    score: 0,
    // Carried across restarts by the caller, so it lasts as long as the tab.
    best,
    apple: null,
  };

  state.apple = spawnApple(state);
  return state;
}

/** A cell as a string, so cells can live in a Set and be compared cheaply. */
export function cellKey(cell) {
  return `${cell.x},${cell.y}`;
}

function sameCell(a, b) {
  return a !== null && b !== null && a.x === b.x && a.y === b.y;
}

/**
 * Every cell nothing is currently sitting on.
 *
 * Listing the free cells and picking one is slower than guessing a random cell
 * and retrying until it's empty — but guessing gets arbitrarily slow as the
 * board fills, and never finishes on a full board. A full sweep of ~1600 cells
 * once per apple is nothing, and it cannot hang. Stage 5 adds the obstacle
 * cells to the same `taken` set.
 */
export function findFreeCells(state) {
  const taken = new Set(state.blocked);
  for (const cell of state.snake) taken.add(cellKey(cell));
  const free = [];

  for (let y = 0; y < state.grid.rows; y++) {
    for (let x = 0; x < state.grid.cols; x++) {
      const cell = { x, y };
      if (!taken.has(cellKey(cell))) free.push(cell);
    }
  }
  return free;
}

/**
 * Pick a random free cell, or null if the board is somehow full.
 *
 * `variant` is a random number the renderer turns into a sticker choice. Kept
 * here so each apple keeps the same face for its whole life, and kept as a
 * plain number so game.js never learns that images exist.
 */
export function spawnApple(state) {
  const free = findFreeCells(state);
  if (free.length === 0) return null;

  const cell = free[Math.floor(Math.random() * free.length)];
  return { ...cell, variant: Math.floor(Math.random() * 1000) };
}

/** Two vectors pointing directly at each other, e.g. left and right. */
function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

/** True if a cell has left the board entirely. */
function isOutside(grid, cell) {
  return cell.x < 0 || cell.y < 0 || cell.x >= grid.cols || cell.y >= grid.rows;
}

/**
 * Bring a cell back inside the grid if it has gone off an edge.
 *
 * Adding grid.cols before the modulo is what makes -1 wrap to the last column;
 * JavaScript's % keeps the sign of the left operand, so -1 % 53 is -1, not 52.
 *
 * Edges are lethal now, so nothing calls this yet. It stays because the PHASE
 * modifier in stage 7 needs exactly this behaviour.
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
  // A dead snake does not take orders. Space restarts instead.
  if (state.status === 'over') return;

  state.nextDirection = direction;

  if (state.status === 'idle') state.status = 'running';
}

/**
 * Advance the game by exactly one grid cell.
 *
 * Returns true if the snake ate this tick. The game does not know that eating
 * makes the headline pulse — it just reports what happened and lets main.js
 * decide what the page does about it.
 */
export function step(state) {
  // Commit the pending turn, unless it would double back on the current one.
  if (!isOpposite(state.direction, state.nextDirection)) {
    state.direction = state.nextDirection;
  }

  const head = state.snake[0];
  const target = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  };

  const ate = sameCell(target, state.apple);

  // Three ways to die, checked before anything moves.
  //
  // The tail is the subtle one: the last segment steps away this tick, so the
  // cell it is vacating is fair game — unless we are eating, because then the
  // tail stays put and the snake really does run into itself.
  const body = ate ? state.snake : state.snake.slice(0, -1);

  if (
    isOutside(state.grid, target) ||
    state.blocked.has(cellKey(target)) ||
    body.some((cell) => sameCell(cell, target))
  ) {
    state.status = 'over';
    return false;
  }

  // Grow at the front, shrink at the back — unless we just ate, in which case
  // skipping the pop is the entire growth mechanic.
  state.snake.unshift(target);
  if (ate) {
    state.score += 1;
    state.best = Math.max(state.best, state.score);
    state.apple = spawnApple(state);
  } else {
    state.snake.pop();
  }

  return ate;
}
