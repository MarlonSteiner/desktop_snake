// The avatar's head follows the snake.
//
// The illustration is two stacked PNGs sharing one canvas size: the body, and
// the head cut off at the collar. Tilting the head layer about that cut reads
// as a head turn, and because the layers overlap by a few pixels the seam never
// opens. Everything here is a CSS transform on one element — no canvas work, no
// per-frame layout.

import { AVATAR, BLINK } from './constants.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Blink forever, at uneven intervals.
 *
 * Self-scheduling with setTimeout rather than a CSS animation, because a
 * keyframe loop can only be regular, and regular is the one thing a blink must
 * not be.
 */
export function startBlinking(element) {
  if (prefersReducedMotion.matches) return;

  const close = () => {
    element.classList.add('is-blinking');
    setTimeout(() => element.classList.remove('is-blinking'), BLINK.closedMs);
  };

  const next = () => {
    const gap = BLINK.minGapMs + Math.random() * (BLINK.maxGapMs - BLINK.minGapMs);

    setTimeout(() => {
      close();
      if (Math.random() < BLINK.doubleChance) {
        setTimeout(close, BLINK.closedMs + BLINK.doubleGapMs);
      }
      next();
    }, gap);
  };

  next();
}

/** Squash a value into -1..1 as it moves `range` away from `centre`. */
function normalise(value, centre, range) {
  return Math.max(-1, Math.min(1, (value - centre) / range));
}

/**
 * Wire up the gaze and return a function that aims it at a viewport point.
 *
 * @param {HTMLElement} head the head layer
 * @param {HTMLElement} frame the element whose box defines where the avatar is
 */
export function createAvatarGaze(head, frame) {
  // Cached rather than measured per frame: getBoundingClientRect forces layout,
  // and doing that sixty times a second next to a running game is exactly the
  // kind of thing that turns a smooth page into a janky one.
  let box = frame.getBoundingClientRect();
  window.addEventListener('resize', () => {
    box = frame.getBoundingClientRect();
  });

  // Remembered so we only touch the DOM when the value actually changes.
  let lastTilt = null;
  let lastLift = null;

  head.style.transformOrigin = AVATAR.pivot;

  return function lookAt(x, y) {
    if (prefersReducedMotion.matches) return;

    const centreX = box.left + box.width / 2;
    // Aim from the head rather than the middle of the picture, which includes
    // the desk and the chair — the eyes are near the top.
    const centreY = box.top + box.height * AVATAR.headHeightFraction;

    const reachX = window.innerWidth * AVATAR.reachXFraction;
    const reachY = window.innerHeight * AVATAR.reachYFraction;

    const tilt = +(normalise(x, centreX, reachX) * AVATAR.maxTiltDeg).toFixed(1);
    const lift = +(normalise(y, centreY, reachY) * AVATAR.maxLiftPx).toFixed(1);

    if (tilt === lastTilt && lift === lastLift) return;
    lastTilt = tilt;
    lastLift = lift;

    // Set as custom properties so the transform itself stays declared in CSS,
    // where the transition that smooths it also lives.
    head.style.setProperty('--tilt', `${tilt}deg`);
    head.style.setProperty('--lift', `${lift}px`);
  };
}
