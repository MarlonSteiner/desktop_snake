// Opening and closing the side panels (the CV and the projects), and telling
// the caller when to pause.
//
// This file owns the panels' behaviour but not the consequences of it: it
// reports open/closed through onPauseChange and lets main.js decide that the
// game should stop. That keeps the menu reusable and the pause rule in one
// place.

/**
 * The panels, and what opens each one. Only one is ever open. The hash lets a
 * link (the language switch, or a link sent to a recruiter) arrive with a
 * panel already open. The projects are not a panel: they are a section further
 * down the page, reached by an ordinary #work link.
 */
const PANELS = [
  { id: 'cv-panel', hash: '#cv', openers: ['menu-button'], close: 'cv-close' },
];

/**
 * Wire up the panels.
 *
 * @param {object} handlers
 * @param {(isOpen: boolean) => void} handlers.onPauseChange
 */
export function attachMenu({ onPauseChange }) {
  const menuButton = document.getElementById('menu-button');
  const backdrop = document.getElementById('cv-backdrop');

  const panels = PANELS
    .map((config) => ({
      ...config,
      element: document.getElementById(config.id),
      closeButton: document.getElementById(config.close),
    }))
    .filter((panel) => panel.element !== null);

  let open = null;
  // Where focus goes back to on close. Remembered only when a panel opens from
  // the page itself, never when switching between panels, so closing never
  // leaves focus on a button that is now off-screen.
  let returnFocus = menuButton;

  function show(next, opener = null) {
    if (next === open) return;
    if (open === null && next !== null) returnFocus = opener ?? menuButton;
    open = next;

    for (const panel of panels) {
      const isShown = panel === open;
      // `inert` removes the whole subtree from the tab order and from
      // assistive technology in one attribute. Without it the links stay
      // reachable by keyboard while the panel is parked off-screen.
      panel.element.toggleAttribute('inert', !isShown);
      panel.element.classList.toggle('translate-x-full', !isShown);
    }

    menuButton.setAttribute('aria-expanded', String(open !== null && open.id === 'cv-panel'));
    backdrop.classList.toggle('opacity-0', open === null);
    backdrop.classList.toggle('pointer-events-none', open === null);

    // Move focus with the panel: into it on open, back where it came from on
    // close, so a keyboard user is never left focused on something invisible.
    // preventScroll, because focusing the CV button would yank the page back
    // to the top, fighting a link that is on its way to the projects.
    (open === null ? returnFocus : open.closeButton).focus({ preventScroll: true });

    onPauseChange(open !== null);
  }

  for (const panel of panels) {
    for (const id of panel.openers) {
      const opener = document.getElementById(id);
      if (opener === null) continue;
      // The CV icon toggles; everything else only opens.
      opener.addEventListener('click', () => {
        show(opener === menuButton && open === panel ? null : panel, opener);
      });
    }
    panel.closeButton.addEventListener('click', () => show(null));

    // A link from a panel to somewhere on this page (the CV's "see my
    // projects") closes the panel and lets the browser scroll there.
    for (const link of panel.element.querySelectorAll('a[href^="#"]')) {
      link.addEventListener('click', () => show(null));
    }
  }

  backdrop.addEventListener('click', () => show(null));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open !== null) show(null);
  });

  const linked = panels.find((panel) => panel.hash === window.location.hash);
  if (linked !== undefined) show(linked);
}
