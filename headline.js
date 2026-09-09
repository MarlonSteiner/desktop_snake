// The headline's reaction to the game. Kept out of main.js so the wiring there
// stays readable, and out of game.js so the game never touches the DOM.

const POP_SCALE = 1.07;
const POP_MS = 300;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Return a function that makes the headline swell and settle.
 *
 * This uses element.animate() rather than toggling a CSS class. Two reasons:
 * retriggering a CSS animation means removing the class, forcing a reflow, and
 * re-adding it, which is a well-known hack; and the headline already runs a
 * rainbow animation, which this would have to fight with. The Web Animations
 * API just layers a second, independent animation on top.
 */
export function createHeadlinePop(element) {
  return function pop() {
    if (prefersReducedMotion.matches) return;

    element.animate(
      [
        { transform: 'scale(1)' },
        { transform: `scale(${POP_SCALE})`, offset: 0.35 },
        { transform: 'scale(1)' },
      ],
      { duration: POP_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  };
}
