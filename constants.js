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
  // Swap this for '#ff2d20' if you ever want the apple to read as food rather
  // than as part of the page's black-and-white identity.
  apple: '#000000',
  hud: '#a3a3a3',
  hint: '#000000',
  glitch: '#c026d3',
  /** Cycled one at a time as the whole page during FLASH. */
  flash: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'],
};

/**
 * Every modifier, one row each: what colour the snake turns and how much
 * faster it moves (1 = normal). Adding a modifier that only changes speed
 * needs nothing but a new row here — modifiers.js derives its list from this
 * object. Anything with a stranger effect, like INVERTED, also needs a rule
 * somewhere; INVERTED's lives in queueDirection.
 *
 * The yellow is a deep gold rather than a bright yellow because the same
 * colour draws the 11px HUD countdown, and bright yellow on white is
 * unreadable at that size.
 */
export const MODIFIERS = {
  INVERTED: { color: '#4f46e5', speed: 1, durationMs: 10000 },
  RUSH: { color: '#ea580c', speed: 2, durationMs: 10000 },
  TURBO: { color: '#ca8a04', speed: 3, durationMs: 10000 },
  /**
   * FLASH empties the screen: the page, the snake and everything else vanish
   * and the whole viewport cycles through flat colours. Nothing moves while it
   * runs, so the snake picks up exactly where it left off. `color` and `speed`
   * are never read for it — the board is not on screen to have a colour.
   */
  FLASH: { color: '#ffffff', speed: 1, durationMs: 2400 },
};

/**
 * How long each flat colour holds, in milliseconds.
 *
 * 340ms is just under three changes a second. That is deliberate: WCAG 2.3.1
 * puts the photosensitive-seizure threshold at three full-screen flashes per
 * second, and this covers the entire viewport. Going much below 333 crosses
 * into territory that can genuinely hurt people.
 */
export const FLASH_MS_PER_COLOR = 340;

/** The glitch fruit itself. Modifier durations live in MODIFIERS above. */
export const TWIST = {
  spawnEveryMs: 15000,
  lifetimeMs: 6000,
  /** Below this much life left, the fruit blinks to say it is leaving. */
  blinkUnderMs: 1500,
  score: 5,
};

/**
 * Sticker images the snake eats, drawn in place of the plain circle.
 *
 * Drop square PNGs with transparent backgrounds into assets/stickers/ and list
 * them here. Anything that fails to load is skipped and that apple falls back
 * to a circle, so a missing file can never break the page.
 */
export const STICKERS = [
  'assets/stickers/cap.png',
  'assets/stickers/shades.png',
  'assets/stickers/hood.png',
  'assets/stickers/backpack.png',
  'assets/stickers/facemask.png',
  'assets/stickers/redjacket.png',
  'assets/stickers/reading.png',
];

/**
 * The box a sticker is fitted into, in cells.
 *
 * A face rendered at 24px is an unreadable smudge, so the sticker overflows its
 * cell — three cells on its longest side. Only the drawing is bigger; the snake
 * still has to reach the one cell the apple actually occupies. Sprites larger
 * than their hitbox are normal in games, and it is the hitbox that has to stay
 * honest.
 */
export const STICKER_SCALE = 3;

/** Top-left score readout. */
export const HUD = {
  font: '500 11px ui-sans-serif, system-ui, -apple-system, sans-serif',
  letterSpacing: '0.12em',
  padding: 20,
  lineHeight: 16,
};
