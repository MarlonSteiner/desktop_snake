// Light and dark, switched by the lamp on the desk.
//
// The theme lives on <html> as a class, so CSS handles the page and the canvas
// asks palette() for the four colours it paints itself with. The snake needs
// nothing: it is drawn on a difference-blend layer, so it inverts against
// whatever is behind it — black on white, light on dark — without being told.

import { COLORS } from './constants.js';

const STORAGE_KEY = 'marlon-theme';

let dark = false;

/** The colours the canvas should paint with right now. */
export function palette() {
  return dark ? COLORS.dark : COLORS.light;
}

export function isDark() {
  return dark;
}

function apply() {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    // Private browsing, or storage turned off. The theme still works, it just
    // will not be remembered.
  }
}

/**
 * Start on whatever the visitor chose last time, or on what their system asks
 * for if they have never chosen here.
 */
export function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // See above.
  }

  dark = stored === null
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : stored === 'dark';

  apply();
}

export function toggleTheme() {
  dark = !dark;
  apply();
  return dark;
}
