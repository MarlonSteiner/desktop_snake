// The headline's reaction to the game. Kept out of main.js so the wiring there
// stays readable, and out of game.js so the game never touches the DOM.

const POP_SCALE = 1.07;
const POP_MS = 300;

/**
 * How long the headline holds its colour after an apple.
 *
 * The flare is deliberately shorter than the 300ms swell: the colour snaps on
 * instantly and then CSS eases it away over another 180ms, so the whole thing
 * is done in about half a second.
 */
const RAINBOW_MS = 320;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Return a function that celebrates an apple: the headline swells and settles,
 * and its colour flares rainbow before fading back to black.
 *
 * The swell uses element.animate() rather than a CSS class. Retriggering a CSS
 * animation means removing the class, forcing a reflow, and re-adding it, which
 * is a well-known hack; the Web Animations API just layers an independent
 * animation on top. The colour flare is a class, because it needs to *stay* on
 * for a while rather than run once — and CSS can then transition it back out.
 */
export function createHeadlineBurst(element) {
  let fadeTimer = null;

  return function burst() {
    if (prefersReducedMotion.matches) return;

    element.animate(
      [
        { transform: 'scale(1)' },
        { transform: `scale(${POP_SCALE})`, offset: 0.35 },
        { transform: 'scale(1)' },
      ],
      { duration: POP_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );

    element.classList.add('is-rainbow');

    // Eating again mid-flare restarts the clock instead of letting the first
    // apple's timer cut the second one short.
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => element.classList.remove('is-rainbow'), RAINBOW_MS);
  };
}
