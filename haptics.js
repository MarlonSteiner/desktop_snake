// A short buzz when the snake eats.
//
// navigator.vibrate is the only vibration API the web has, and it is worth
// being plain about its reach: Android browsers implement it, and iOS Safari
// does not — at all, in any version. On an iPhone this is silent.
//
// The workarounds that circulate for iOS lean on undocumented side effects of
// a particular form control and stop working between releases, so there is
// nothing here pretending otherwise.

const supported = typeof navigator.vibrate === 'function';

/**
 * Buzz for `ms`, or run a pattern of [on, off, on, ...] durations.
 *
 * Silently does nothing where the API is missing, which is most of the time —
 * this is a garnish, and nothing should be checking whether it happened.
 */
export function buzz(pattern) {
  if (!supported) return;

  // Wrapped because a browser may refuse — a background tab, or a user setting
  // — and it is not worth an exception over a vibration.
  try {
    navigator.vibrate(pattern);
  } catch {
    // Nothing to do about it.
  }
}
