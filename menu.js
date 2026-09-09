// Opening and closing the CV panel, and telling the caller when to pause.
//
// This file owns the panel's behaviour but not the consequences of it: it
// reports open/closed through onPauseChange and lets main.js decide that the
// game should stop. That keeps the menu reusable and the pause rule in one
// place.

/**
 * Wire up the CV panel.
 *
 * @param {object} handlers
 * @param {(isOpen: boolean) => void} handlers.onPauseChange
 */
export function attachMenu({ onPauseChange }) {
  const button = document.getElementById('menu-button');
  const panel = document.getElementById('cv-panel');
  const backdrop = document.getElementById('cv-backdrop');
  const closeButton = document.getElementById('cv-close');

  let isOpen = false;

  function setOpen(next) {
    if (next === isOpen) return;
    isOpen = next;

    button.setAttribute('aria-expanded', String(isOpen));

    // `inert` removes the whole subtree from the tab order and from assistive
    // technology in one attribute. Without it the CV links stay reachable by
    // keyboard while the panel is parked off-screen.
    panel.toggleAttribute('inert', !isOpen);
    panel.classList.toggle('translate-x-full', !isOpen);

    backdrop.classList.toggle('opacity-0', !isOpen);
    backdrop.classList.toggle('pointer-events-none', !isOpen);

    // Move focus with the panel: into it on open, back to the button on close,
    // so a keyboard user is never left focused on something invisible.
    (isOpen ? closeButton : button).focus();

    onPauseChange(isOpen);
  }

  button.addEventListener('click', () => setOpen(!isOpen));
  closeButton.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setOpen(false);
  });
}
