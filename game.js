// Game state and the rules that change it.
//
// Nothing in this file touches the DOM or the canvas. It takes numbers in and
// returns plain objects out, which means you can reason about it (and later
// test it) without a browser.

import {
  CELL_SIZE, START_LENGTH, START_MARGIN, TWIST, EAT_FLARE_MS, APPLE_REACH, EMERGE_MS,
} from './constants.js';
import {
  createTwist,
  updateTwist,
  activateRandomModifier,
  isInverted,
  isFlashing,
} from './modifiers.js';

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
 * Choosing where to start is the interesting part. Walking outwards from the
 * middle until the cells are clear finds the *nearest* free row, which is the
 * row pressed right up against the headline — the snake appears to be hiding
 * behind the text. Instead we score every free row by how much clear space
 * surrounds it and take the roomiest, so the snake starts in open page.
 *
 * That needs no breakpoint to do the right thing on a phone: there the content
 * fills the middle of the screen and the biggest gap happens to be below the
 * logos, so that is where it lands.
 */
/**
 * The snake's opening position: standing in for the letter it is about to
 * climb out of, if that letter can be found and there is room above it.
 */
function startOnLetter(grid, letter) {
  if (letter === null) return null;

  // Centred on the letter's box, not hung from its top. getBoundingClientRect
  // on an inline span returns the line box, which is taller than the letter and
  // sits higher than it — aligning to the top left the snake floating above the
  // word by most of a cell.
  const centreY = (letter.top + letter.bottom) / 2;
  const col = Math.floor((letter.centreX - grid.originX) / CELL_SIZE);
  const headRow = Math.round(
    (centreY - (CELL_SIZE * START_LENGTH) / 2 - grid.originY) / CELL_SIZE,
  );

  const cells = [];
  for (let i = 0; i < START_LENGTH; i++) cells.push({ x: col, y: headRow + i });

  const fits = cells.every(
    (cell) => cell.x >= 0 && cell.x < grid.cols && cell.y >= 0 && cell.y < grid.rows,
  );
  return fits ? cells : null;
}

export function createSnake(grid, pageCells) {
  const isClear = (row) =>
    startCellsOnRow(row).every((cell) => !pageCells.has(cellKey(cell)));

  const middle = Math.floor(grid.rows / 2);
  let best = null;

  for (let row = 0; row < grid.rows; row++) {
    if (!isClear(row)) continue;

    // How far the clear run reaches above and below this row. Counting stops at
    // the grid edge too, so the very top and bottom rows score badly and the
    // snake does not start jammed against the viewport edge either.
    let above = 0;
    while (row - above - 1 >= 0 && isClear(row - above - 1)) above += 1;
    let below = 0;
    while (row + below + 1 < grid.rows && isClear(row + below + 1)) below += 1;

    const clearance = Math.min(above, below);
    const distanceFromMiddle = Math.abs(row - middle);

    // Roomiest wins; ties go to whichever is nearer the middle, so a symmetric
    // page still starts somewhere deliberate rather than at the first match.
    if (
      best === null ||
      clearance > best.clearance ||
      (clearance === best.clearance && distanceFromMiddle < best.distanceFromMiddle)
    ) {
      best = { row, clearance, distanceFromMiddle };
    }
  }

  // Every row blocked, which should be impossible. Start in the middle and let
  // the player see a very short game rather than crashing the page.
  return startCellsOnRow(best === null ? middle : best.row);
}

/**
 * The single object that holds everything the game knows. Passing this around
 * explicitly is what keeps us from accumulating loose global variables.
 */
export function createGameState({
  grid, pageCells, hintAnchor = null, hudAnchor = null, startLetter = null, best = 0,
}) {
  // Starting as the letter means starting upright and heading up out of the
  // word. Everything else about the snake is unchanged; only its first cells
  // and first direction come from the page.
  const onLetter = startOnLetter(grid, startLetter);
  const snake = onLetter ?? createSnake(grid, pageCells);
  const direction = onLetter === null ? { x: 1, y: 0 } : { x: 0, y: -1 };

  const state = {
    grid,
    // The cells the page's own content sits on. The snake passes straight
    // through them; they exist so apples never spawn somewhere unreachable or
    // hidden behind the headline.
    pageCells,
    // Where the control prompt and the score are drawn. Measured from the page,
    // like pageCells.
    hintAnchor,
    hudAnchor,
    snake,
    // The cells it began on, so the page knows when the snake has climbed off
    // the letter and the word can put itself back together.
    startCells: onLetter === null ? [] : onLetter.map(cellKey),
    // The head's opening cell, so the renderer can tell how far the snake has
    // travelled and drag the letter-shaped version along with it.
    startHead: onLetter === null ? null : { ...onLetter[0] },
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
    // Counts down after eating; the renderer turns it into the snake's flare.
    eatFlareMs: 0,
    // Counts down from the first keypress while the snake grows out of the
    // letter. Zero when there is no letter to grow out of.
    emergeMs: 0,
    // Kept so the renderer knows what shape to start from.
    startLetter,
    // Carried across restarts by the caller, so it lasts as long as the tab.
    best,
    apple: null,
    // The glitch fruit and any running modifier.
    twist: createTwist(),
  };

  // After twist, because free-cell search consults it.
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
 * Is `cell` close enough to the apple to eat it?
 *
 * Chebyshev distance — the square block around the apple rather than a circle —
 * because the sticker is drawn as a square box, and the hitbox should be the
 * shape of the thing you are aiming at. It deliberately does not wrap at the
 * edges: the sprite does not wrap either, so neither should the reach.
 */
function withinReach(cell, apple) {
  if (apple === null) return false;

  return Math.abs(cell.x - apple.x) <= APPLE_REACH
    && Math.abs(cell.y - apple.y) <= APPLE_REACH;
}

/**
 * Every cell nothing is currently sitting on.
 *
 * Listing the free cells and picking one is slower than guessing a random cell
 * and retrying until it's empty — but guessing gets arbitrarily slow as the
 * board fills, and never finishes on a full board. A full sweep of ~1600 cells
 * once per apple is nothing, and it cannot hang.
 */
export function findFreeCells(state) {
  const taken = new Set(state.pageCells);
  for (const cell of state.snake) taken.add(cellKey(cell));
  if (state.apple !== null) taken.add(cellKey(state.apple));
  if (state.twist.glitch !== null) taken.add(cellKey(state.twist.glitch));
  const free = [];

  for (let y = 0; y < state.grid.rows; y++) {
    for (let x = 0; x < state.grid.cols; x++) {
      const cell = { x, y };
      if (!taken.has(cellKey(cell))) free.push(cell);
    }
  }
  return free;
}

/** A random cell nothing occupies, or null if the board is full. */
export function randomFreeCell(state) {
  const free = findFreeCells(state);
  if (free.length === 0) return null;

  return free[Math.floor(Math.random() * free.length)];
}

/**
 * Place a new apple.
 *
 * `variant` is a random number the renderer turns into a sticker choice. Kept
 * here so each apple keeps the same face for its whole life, and kept as a
 * plain number so game.js never learns that images exist.
 */
export function spawnApple(state) {
  const cell = randomFreeCell(state);
  if (cell === null) return null;

  return { ...cell, variant: Math.floor(Math.random() * 1000) };
}

/** True if a cell has fallen off the board — only possible after a resize. */
function isOutsideGrid(grid, cell) {
  return cell.x < 0 || cell.y < 0 || cell.x >= grid.cols || cell.y >= grid.rows;
}

/** A cell is no longer a valid home for food if it left the board or the page grew over it. */
function isStranded(state, cell) {
  return cell === null || isOutsideGrid(state.grid, cell) || state.pageCells.has(cellKey(cell));
}

/**
 * Fit an in-progress game to a new viewport, keeping the run alive.
 *
 * The snake's cells are wrapped rather than clamped. Clamping would fold
 * several segments onto the same cell and leave the snake visibly knotted;
 * wrapping is what the edges already do, so a snake that was near the old right
 * edge simply reappears on the left, which the player can read at a glance.
 *
 * Food is only moved if it has to be — respawning an apple that is still
 * perfectly reachable would feel like the game cheating during a resize.
 */
export function resizeGame(state, { grid, pageCells, hintAnchor, hudAnchor }) {
  state.grid = grid;
  state.pageCells = pageCells;
  state.hintAnchor = hintAnchor;
  state.hudAnchor = hudAnchor;
  state.snake = state.snake.map((cell) => wrap(grid, cell));

  if (isStranded(state, state.apple)) state.apple = spawnApple(state);

  // The glitch fruit is on a timer anyway, so dropping it is kinder than
  // teleporting it: another is along shortly.
  if (state.twist.glitch !== null && isStranded(state, state.twist.glitch)) {
    state.twist.glitch = null;
  }
}

/**
 * Move every clock forward.
 *
 * Called once per frame with real elapsed time, separately from step(), which
 * runs on the fixed tick. Two clocks, on purpose: movement should be steady in
 * ticks, while "this modifier lasts ten seconds" should be steady in seconds.
 */
export function advanceTime(state, elapsedMs) {
  state.eatFlareMs = Math.max(0, state.eatFlareMs - elapsedMs);
  state.emergeMs = Math.max(0, state.emergeMs - elapsedMs);
  updateTwist(state.twist, elapsedMs, () => randomFreeCell(state));
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
 * The edges of the screen are a portal, not a wall: leave on the right and you
 * come back on the left.
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

  // Nor one nobody can see. FLASH blanks the screen, so a key pressed during it
  // would be a turn the player could not have aimed.
  if (isFlashing(state.twist)) return;

  // INVERTED swaps left and right only, so up and down stay a reliable way to
  // get your bearings back.
  const horizontal = direction.y === 0;
  state.nextDirection =
    isInverted(state.twist) && horizontal ? { x: -direction.x, y: 0 } : direction;

  if (state.status === 'idle') {
    state.status = 'running';
    // Only worth animating if the snake actually began as the letter.
    if (state.startCells.length > 0) state.emergeMs = EMERGE_MS;
  }
}

/**
 * Advance the game by exactly one grid cell.
 *
 * Returns true if the snake ate anything this tick. The game does not know that
 * eating makes the headline flare — it just reports what happened and lets
 * main.js decide what the page does about it.
 */
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

  const ateApple = withinReach(target, state.apple);
  const ateGlitch = sameCell(target, state.twist.glitch);
  const ate = ateApple || ateGlitch;

  // Biting yourself is the only way to die. Screen edges wrap, and the page's
  // own content is scenery the snake glides through.
  //
  // The tail is the subtle part: the last segment steps away this tick, so the
  // cell it is vacating is fair game — unless we are eating, because then the
  // tail stays put and the snake really does run into itself.
  const body = ate ? state.snake : state.snake.slice(0, -1);

  if (body.some((cell) => sameCell(cell, target))) {
    state.status = 'over';
    return false;
  }

  // Grow at the front, shrink at the back — unless we just ate, in which case
  // skipping the pop is the entire growth mechanic.
  state.snake.unshift(target);
  if (ate) {
    state.score += 1;
    state.eatFlareMs = EAT_FLARE_MS;
  } else {
    state.snake.pop();
  }

  if (ateApple) {
    state.apple = spawnApple(state);
  }

  if (ateGlitch) {
    // The glitch fruit is worth more and rewrites a rule, but it is a power-up
    // rather than food, so the extra score is all it gives beyond the one
    // segment every meal is worth.
    state.score += TWIST.score;
    state.twist.glitch = null;
    activateRandomModifier(state.twist);
  }

  state.best = Math.max(state.best, state.score);
  return ate;
}
