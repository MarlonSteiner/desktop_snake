// Text the scripts write themselves: the canvas hints and the lamp's label.
// Everything else lives in the HTML, one page per language. The page's own
// <html lang> picks the set, so de.html needs no extra wiring.

const STRINGS = {
  en: {
    swipeToPlay: 'SWIPE TO PLAY',
    tapToRestart: 'TAP TO RESTART',
    spaceToRestart: 'PRESS SPACE TO RESTART',
    score: 'SCORE',
    best: 'BEST',
    lampOn: 'Turn the desk lamp on',
    lampOff: 'Turn the desk lamp off',
  },
  de: {
    swipeToPlay: 'WISCHEN ZUM SPIELEN',
    tapToRestart: 'TIPPEN FÜR NEUSTART',
    spaceToRestart: 'LEERTASTE FÜR NEUSTART',
    score: 'PUNKTE',
    best: 'REKORD',
    lampOn: 'Schreibtischlampe einschalten',
    lampOff: 'Schreibtischlampe ausschalten',
  },
};

export const text = document.documentElement.lang.startsWith('de') ? STRINGS.de : STRINGS.en;
