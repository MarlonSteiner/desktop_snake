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

// Arrow keys scroll the page by default. Since the page is exactly one screen
// tall this is barely visible, but it also steals focus behaviour, so we stop
// it. WASD is left alone — it has no default worth cancelling.
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

/**
 * Listen for movement keys and report each one as a direction vector.
 *
 * @param {(direction: {x: number, y: number}) => void} onDirection
 */
export function attachKeyboardInput(onDirection) {
  window.addEventListener('keydown', (event) => {
    const name = KEY_MAP[event.code];
    if (!name) return;

    if (SCROLL_KEYS.has(event.code)) event.preventDefault();

    onDirection(DIRECTIONS[name]);
  });
}
