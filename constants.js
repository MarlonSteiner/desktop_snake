// Every tunable number lives here so the rest of the code reads as intent
// ("START_LENGTH") rather than as magic numbers scattered across files.

/** Width and height of one grid cell, in CSS pixels. */
export const CELL_SIZE = 24;

/** How many segments the snake starts with. */
export const START_LENGTH = 3;

/** How far in from the left edge the snake's tail starts, in cells. */
export const START_MARGIN = 2;

export const COLORS = {
  background: '#ffffff',
  snake: '#000000',
};
