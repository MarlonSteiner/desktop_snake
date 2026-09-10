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
  /**
   * The snake's flare after eating. Same stops as the headline gradient in
   * index.html, so the two effects read as the same event — duplicated on
   * purpose, because a canvas cannot read a CSS gradient.
   */
  rainbow: [
    '#e11d48', '#ea580c', '#ca8a04', '#16a34a',
    '#0284c7', '#4f46e5', '#c026d3', '#e11d48',
  ],
};

/**
 * How long the snake keeps its rainbow after eating.
 *
 * Roughly the headline's hold plus its fade, so the snake and the headline
 * finish together. The snake deliberately gets no scale animation: the
 * headline can swell without consequence, but a snake that changes size is a
 * snake whose collisions no longer match what you see.
 */
export const EAT_FLARE_MS = 500;

/**
 * How long the snake takes to become itself.
 *
 * It starts out shaped exactly like the letter it was standing in for — one
 * solid bar, the width of the stroke — and over this long it widens to a full
 * cell and splits into its three segments. Long enough to read as a change,
 * short enough that you are steering a normal snake almost immediately.
 */
export const EMERGE_MS = 340;

/**
 * Vibration lengths, in milliseconds.
 *
 * Short: a tick you feel rather than a buzz you notice. Anything past about
 * 30ms on a phone reads as a notification, which is the wrong register for
 * eating an apple.
 */
export const HAPTICS = { eat: 14 };

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
  FLASH: { color: '#ffffff', speed: 1, durationMs: 750 },
};

/**
 * How long each flat colour holds, in milliseconds.
 *
 * About nine changes a second, which is a real strobe. Worth knowing what that
 * means: WCAG 2.3.1 puts the photosensitive-seizure threshold at three
 * full-screen flashes per second, and this fills the whole viewport, so it is
 * three times over that line. That is a deliberate choice, not an oversight.
 *
 * The mitigation that remains is prefers-reduced-motion — anyone who has asked
 * their system for less motion gets one held colour instead of a cycle, which
 * is handled in renderer.js. Raise this number to soften the effect; 340 was
 * the last value that stayed under the threshold.
 */
export const FLASH_MS_PER_COLOR = 113;

/**
 * How long to wait after the last resize event before rebuilding the board.
 *
 * Dragging a window fires resize continuously. Measuring the page and sweeping
 * every cell on each of those events is wasted work, and worse, the text has
 * not finished reflowing yet — so the boxes we measured would already be wrong.
 */
export const RESIZE_SETTLE_MS = 120;

/**
 * The avatar's head-follow.
 *
 * `pivot` is where the head layer rotates: the point on the collar where the
 * two images were cut, as a percentage of their shared canvas. It comes out of
 * scripts/mkavatar.py — regenerate the layers and it will print the new value.
 */
export const AVATAR = {
  pivot: '50.3% 32.1%',
  /** Eye height as a fraction of the whole picture, which includes the desk. */
  headHeightFraction: 0.22,
  /**
   * How far the snake has to be for the head to be turned as far as it goes,
   * as a fraction of the viewport rather than a pixel count. A fixed distance
   * saturates almost immediately on a wide screen — the head sits pinned at
   * full tilt and stops reacting. Measuring in screen-halves means the turn
   * maps across whatever screen it is actually on.
   */
  reachXFraction: 0.5,
  reachYFraction: 0.45,
  maxTiltDeg: 9,
  maxLiftPx: 5,
};

/**
 * Blinking.
 *
 * The gap is random rather than fixed. A blink on a metronome reads as a
 * flicker in the page; an uneven one reads as a person. The occasional double
 * is the same idea — real eyes do it, and it is the detail that stops the
 * effect feeling like a loop.
 */
export const BLINK = {
  closedMs: 110,
  minGapMs: 2600,
  maxGapMs: 7200,
  doubleChance: 0.22,
  doubleGapMs: 190,
};

/** The arrow-key prompt shown until the first keypress. */
export const HINT = {
  keySize: 22,
  gap: 4,
  /** How long each key stays lit as the prompt cycles through them. */
  stepMs: 450,
  /** How long the whole prompt takes to fade once the game starts. */
  fadeMs: 400,
  /** Space between the key cluster and the avatar it sits beside. */
  gapBesideAvatar: 28,
  /** Space between the touch prompt and the avatar below it. */
  gapAboveAnchorText: 34,
  font: '600 12px ui-sans-serif, system-ui, -apple-system, sans-serif',
};

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
/**
 * Dance poses shown during FLASH, one per colour. Three against five colours,
 * so the pose and the colour go out of step and the loop is harder to spot.
 */
export const DANCERS = [
  'assets/dance/spread.png',
  'assets/dance/jump.png',
  'assets/dance/crouch.png',
];

/** How tall a dancer is drawn, as a fraction of the viewport. */
export const DANCE_HEIGHT_FRACTION = 0.52;

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

/**
 * How far from the apple's own cell still counts as eating it, in cells.
 *
 * The sticker is drawn three cells across while the cell underneath is one, so
 * a hitbox of exactly that cell means aiming at a face and missing it. At 1,
 * the hitbox is the 3x3 block the sticker actually covers — you eat what you
 * can see, which is the only version of this that feels fair.
 */
export const APPLE_REACH = 1;

/** Top-left score readout. */
export const HUD = {
  font: '500 11px ui-sans-serif, system-ui, -apple-system, sans-serif',
  letterSpacing: '0.12em',
  padding: 20,
  lineHeight: 16,
  /**
   * The box the readout occupies, reserved so apples never spawn behind it.
   * Generous rather than exact: it is a keep-out zone, not a hitbox.
   */
  reserve: { width: 104, height: 44 },
};
