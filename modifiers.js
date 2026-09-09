// The twist: a glitch fruit that appears on a timer, and the temporary rule
// changes eating one hands out.
//
// Everything here is time-based rather than tick-based, deliberately. RUSH
// doubles the tick rate, so a duration counted in ticks would silently halve
// itself while RUSH was running. Counting milliseconds means ten seconds is ten
// seconds whatever the snake is doing.
//
// This file imports nothing from game.js. It is handed a `spawnCell` function
// instead of reaching for the board itself, which keeps the two modules from
// importing each other in a circle.

import { TWIST } from './constants.js';

export const MODIFIER_NAMES = ['INVERTED', 'RUSH'];

/** The twist's own slice of the game state. */
export function createTwist() {
  return {
    glitch: null,
    msUntilSpawn: TWIST.spawnEveryMs,
    modifier: null,
  };
}

/**
 * Run every clock in the twist forward.
 *
 * @param {object} twist
 * @param {number} elapsedMs real time since the last frame
 * @param {() => ({x: number, y: number} | null)} spawnCell picks a free cell
 */
export function updateTwist(twist, elapsedMs, spawnCell) {
  // Age what is already on the board *before* spawning anything, so a fruit
  // created below is not immediately charged for the frame it appeared in.
  if (twist.glitch !== null) {
    twist.glitch.msLeft -= elapsedMs;
    if (twist.glitch.msLeft <= 0) twist.glitch = null;
  }

  if (twist.modifier !== null) {
    twist.modifier.msLeft -= elapsedMs;
    if (twist.modifier.msLeft <= 0) twist.modifier = null;
  }

  twist.msUntilSpawn -= elapsedMs;

  if (twist.msUntilSpawn <= 0) {
    // Add rather than reset, so the cadence stays on the beat even if a frame
    // overshoots the deadline. Safe because main.js clamps elapsedMs well
    // below the interval, so one frame can never owe two fruit.
    twist.msUntilSpawn += TWIST.spawnEveryMs;

    if (twist.glitch === null) {
      const cell = spawnCell();
      if (cell !== null) twist.glitch = { ...cell, msLeft: TWIST.lifetimeMs };
    }
  }
}

/**
 * Start a random modifier, replacing whatever was running.
 *
 * Every modifier here changes how the snake handles, never where it can go. A
 * SOLID modifier that made the page content lethal was tried and removed: the
 * hitbox came from measured DOM boxes, which are bigger than the letterforms
 * people actually see, so deaths looked arbitrary.
 */
export function activateRandomModifier(twist) {
  const name = MODIFIER_NAMES[Math.floor(Math.random() * MODIFIER_NAMES.length)];

  twist.modifier = { name, msLeft: TWIST.modifierMs };
  return name;
}

/** The running modifier's name, or null. */
export function activeModifier(twist) {
  return twist.modifier === null ? null : twist.modifier.name;
}

export function isInverted(twist) {
  return activeModifier(twist) === 'INVERTED';
}

/** How much faster the snake should be moving right now. */
export function speedMultiplier(twist) {
  return activeModifier(twist) === 'RUSH' ? TWIST.rushMultiplier : 1;
}

/** Whole seconds left on the modifier, for the HUD. */
export function secondsLeft(twist) {
  return twist.modifier === null ? 0 : Math.ceil(twist.modifier.msLeft / 1000);
}
