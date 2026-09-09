// Loads the sticker images the snake eats.
//
// Everything here is best-effort on purpose: if the folder is empty, or a file
// is missing, or the images simply haven't decoded yet, the renderer falls back
// to drawing a plain circle. A portfolio page should never show a broken image
// because a decorative asset didn't arrive.

/**
 * Start loading every source and return an array that fills in as they decode.
 *
 * The array is returned immediately and mutated later. That means the first few
 * frames draw circles and then quietly start drawing stickers, with no loading
 * screen and no async plumbing through the render loop.
 */
export function loadStickers(sources) {
  const loaded = [];

  for (const source of sources) {
    const image = new Image();

    image.addEventListener('load', () => loaded.push(image));
    image.addEventListener('error', () => {
      console.warn(`Sticker failed to load, falling back to a circle: ${source}`);
    });

    image.src = source;
  }

  return loaded;
}

/**
 * Choose which sticker an apple wears.
 *
 * The apple carries a random `variant` number and the modulo happens here, so
 * game.js never has to know how many images exist — or that images exist.
 */
export function pickSticker(loaded, variant) {
  if (loaded.length === 0) return null;

  return loaded[variant % loaded.length];
}
