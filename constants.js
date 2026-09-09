// Every tunable number lives here so the rest of the code reads as intent
// ("START_LENGTH") rather than as magic numbers scattered across files.

/** Width and height of one grid cell, in CSS pixels. */
export const CELL_SIZE = 24;

/** How many segments the snake starts with. */
export const START_LENGTH = 3;

/** How far in from the left edge the snake's tail starts, in cells. */
export const START_MARGIN = 2;

/** Grid moves per second. The game runs at this rate on every machine. */
export const TICKS_PER_SECOND = 8;

/**
 * Longest frame gap we are willing to believe, in milliseconds.
 *
 * Background a tab for a minute and the next frame reports a 60000ms delta.
 * Without this clamp the loop would try to catch up with 480 ticks in one
 * frame, lock the page, and report an even bigger delta next time.
 */
export const MAX_FRAME_MS = 250;

export const COLORS = {
  background: '#ffffff',
  snake: '#000000',
};
