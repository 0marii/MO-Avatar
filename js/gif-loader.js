const GIF_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
const GIF_JS_FALLBACK = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';

let loadPromise = null;

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/** Load gif.js from CDN with a fallback mirror. */
export function loadGifJs() {
  if (typeof globalThis.GIF !== 'undefined') {
    return Promise.resolve(true);
  }

  if (!loadPromise) {
    loadPromise = injectScript(GIF_JS_CDN)
      .then(() => true)
      .catch(() => injectScript(GIF_JS_FALLBACK).then(() => true))
      .catch(() => false);
  }

  return loadPromise;
}

export function isGifJsAvailable() {
  return typeof globalThis.GIF !== 'undefined';
}
