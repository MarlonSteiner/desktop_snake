// Swipe controls. A second input source alongside input.js.
//
// It imports DIRECTIONS from there and calls the same handlers, so the game
// never learns that touch exists — this file could be deleted and nothing else
// would need changing.
//
// The hard part is not detecting swipes. It is staying out of the way: the
// LinkedIn and GitHub links, the contact link and the CV have to keep working
// as ordinary taps, and the CV panel has to keep scrolling.

import { DIRECTIONS } from './input.js';

/** How far a finger must travel before it counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 24;

function closestMatch(target, selector) {
  return target instanceof Element ? target.closest(selector) : null;
}

/**
 * Listen for swipes and taps and report them as the same intents the keyboard
 * produces.
 *
 * @param {object} handlers
 * @param {(direction: {x: number, y: number}) => void} handlers.onDirection
 * @param {() => void} handlers.onRestart
 */
export function attachTouchInput({ onDirection, onRestart }) {
  // Where the current gesture started, or null if we are ignoring this one.
  let origin = null;

  window.addEventListener(
    'touchstart',
    (event) => {
      // Two fingers means a pinch-zoom. Leave it entirely alone; being able to
      // zoom a page is not something a game should take away.
      if (event.touches.length > 1) {
        origin = null;
        return;
      }

      // Touches inside the CV keep their native behaviour, which is how the
      // panel still scrolls.
      if (closestMatch(event.target, '#cv-panel') !== null) {
        origin = null;
        return;
      }

      const touch = event.touches[0];
      origin = {
        x: touch.clientX,
        y: touch.clientY,
        // Remembered so a tap that lands on a link is never also read as a tap
        // on the page.
        onLink: closestMatch(event.target, 'a, button') !== null,
        swiped: false,
      };
    },
    { passive: true },
  );

  window.addEventListener(
    'touchmove',
    (event) => {
      if (origin === null || event.touches.length > 1) return;

      const touch = event.touches[0];
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;

      // Below the threshold this is still potentially a tap, so we do nothing
      // at all — no preventDefault, no intent. That silence is what lets the
      // browser turn it into a click on a link.
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

      // Now we know it is a swipe, so stop the page rubber-banding under it.
      // This listener is deliberately not passive, which is what makes
      // preventDefault here legal.
      event.preventDefault();
      origin.swiped = true;

      const horizontal = Math.abs(dx) > Math.abs(dy);
      const name = horizontal
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');

      onDirection(DIRECTIONS[name]);

      // Measure the next turn from here rather than from the original touch, so
      // one long drag can steer several times instead of firing once and then
      // ignoring the rest of the finger's journey.
      origin.x = touch.clientX;
      origin.y = touch.clientY;
    },
    { passive: false },
  );

  window.addEventListener(
    'touchend',
    () => {
      // A tap on the page — not a swipe, not on a link — is the touch
      // equivalent of pressing space. onRestart ignores it unless the game is
      // actually over.
      if (origin !== null && !origin.swiped && !origin.onLink) onRestart();

      origin = null;
    },
    { passive: true },
  );
}
