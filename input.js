// Keyboard handling. This file's only job is to turn raw key events into
// direction intents and hand them to whoever is listening.
//
// It knows nothing about the snake, the grid, or the rules. That is what lets a
// second input source (touch, buttons, a gamepad) be added later as a sibling
// file: it just has to call the same callback with the same vectors.

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Keyed by event.code, which is the physical key's position rather than the
// character it produces. That keeps the WASD cluster in the same shape on a
// non-QWERTY layout, which is the whole point of using WASD.
const KEY_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};

// Keys that scroll the page by default. Since the page is exactly one screen
// tall this is barely visible, but Space in particular jumps the view, so we
// stop them. WASD is left alone — it has no default worth cancelling.
const SCROLL_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
]);

/**
 * Listen for the game's keys and report them as intents.
 *
 * Note the shape: this takes named handlers rather than a single callback, so
 * adding a future intent means adding a handler, not changing the signature for
 * every caller. A touch input module would export its own attach function and
 * call the same handlers.
 *
 * @param {object} handlers
 * @param {(direction: {x: number, y: number}) => void} handlers.onDirection
 * @param {() => void} handlers.onRestart
 */
export function attachKeyboardInput({ onDirection, onRestart }) {
  window.addEventListener('keydown', (event) => {
    const isMovement = event.code in KEY_MAP;
    const isRestart = event.code === 'Space';

    if (!isMovement && !isRestart) return;
    if (SCROLL_KEYS.has(event.code)) event.preventDefault();

    if (isMovement) onDirection(DIRECTIONS[KEY_MAP[event.code]]);
    else onRestart();
  });
}
