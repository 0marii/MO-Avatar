import { CANVAS, GIF_EXPORT } from './config.js';
import { drawFrame, generateSVG, getCycleLength } from './renderer.js';
import { isGifJsAvailable } from './gif-loader.js';

const GIF_ESTIMATE_SEC = Math.ceil(GIF_EXPORT.loopFrames / GIF_EXPORT.fps) + 1;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function yieldToMain() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function getExportOptions(state) {
  return {
    size: state.exportSize || 1024,
    transparent: state.exportBg === 'transparent',
  };
}

function renderToExportCanvas(state, frameT, size, transparent) {
  const tmp = document.createElement('canvas');
  tmp.width = CANVAS.width;
  tmp.height = CANVAS.height;
  drawFrame(tmp.getContext('2d'), state, frameT, { transparent });

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = size;
  exportCanvas.height = size;
  exportCanvas.getContext('2d').drawImage(tmp, 0, 0, size, size);
  return exportCanvas;
}

async function saveWithGifenc(canvas, ctx, state, onProgress) {
  const { GIFEncoder, quantize, applyPalette } = await import(
    'https://unpkg.com/gifenc@1.0.3/dist/gifenc.esm.js'
  );

  const { loopFrames, fps } = GIF_EXPORT;
  const { size, transparent } = getExportOptions(state);
  const delay = Math.round(1000 / fps);
  const cycleLength = getCycleLength(state);
  const gif = GIFEncoder();

  const tmp = document.createElement('canvas');
  tmp.width = size;
  tmp.height = size;
  const tmpCtx = tmp.getContext('2d', { willReadFrequently: true });

  for (let i = 0; i < loopFrames; i++) {
    const exportCanvas = renderToExportCanvas(state, (i / loopFrames) * cycleLength, size, transparent);
    onProgress(`Capturing frames… ${Math.round(((i + 1) / loopFrames) * 100)}%`, 'busy');
    tmpCtx.clearRect(0, 0, size, size);
    tmpCtx.drawImage(exportCanvas, 0, 0);
    const { data } = tmpCtx.getImageData(0, 0, size, size);
    const palette = quantize(data, 256);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, size, size, { palette, delay, transparent: transparent ? 0 : undefined });
    await yieldToMain();
  }

  onProgress('Encoding GIF…', 'busy');
  gif.finish();
  downloadBlob(new Blob([gif.bytes()], { type: 'image/gif' }), 'mo_avatar.gif');
}

async function saveWithGifJs(canvas, ctx, state, onProgress) {
  const { loopFrames, fps, encodeTimeoutMs } = GIF_EXPORT;
  const { size, transparent } = getExportOptions(state);
  const delay = Math.round(1000 / fps);
  const cycleLength = getCycleLength(state);
  const gif = new globalThis.GIF({
    workers: 0,
    quality: 15,
    width: size,
    height: size,
    transparent: transparent ? 0x000000 : null,
    repeat: 0,
  });

  for (let i = 0; i < loopFrames; i++) {
    const exportCanvas = renderToExportCanvas(state, (i / loopFrames) * cycleLength, size, transparent);
    onProgress(`Capturing frames… ${Math.round(((i + 1) / loopFrames) * 100)}%`, 'busy');
    gif.addFrame(exportCanvas, { copy: true, delay });
    await yieldToMain();
  }

  onProgress('Encoding GIF…', 'busy');

  await new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) reject(new Error('Encoding timed out'));
    }, encodeTimeoutMs);

    gif.on('finished', (blob) => {
      done = true;
      clearTimeout(timer);
      downloadBlob(blob, 'mo_avatar.gif');
      resolve();
    });

    gif.on('error', (error) => {
      done = true;
      clearTimeout(timer);
      reject(error);
    });

    gif.render();
  });
}

export function savePNG(canvas, ctx, state, frameT, onStatus) {
  try {
    const { size, transparent } = getExportOptions(state);
    const exportCanvas = renderToExportCanvas(state, frameT, size, transparent);
    const anchor = document.createElement('a');
    anchor.download = 'mo_avatar.png';
    anchor.href = exportCanvas.toDataURL('image/png');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    onStatus('Downloaded successfully', 'success');
  } catch (error) {
    console.error(error);
    onStatus('PNG save failed.', 'error');
  }
}

export function saveWebP(canvas, ctx, state, frameT, onStatus) {
  try {
    const { size, transparent } = getExportOptions(state);
    const exportCanvas = renderToExportCanvas(state, frameT, size, transparent);
    exportCanvas.toBlob(
      (blob) => {
        if (!blob) {
          onStatus('WebP export not supported in this browser.', 'error');
          return;
        }
        downloadBlob(blob, 'mo_avatar.webp');
        onStatus('Downloaded successfully', 'success');
      },
      'image/webp',
      0.92
    );
  } catch (error) {
    console.error(error);
    onStatus('WebP save failed.', 'error');
  }
}

export function saveSVG(state, frameT, onStatus) {
  try {
    const svg = generateSVG(state, frameT);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, 'mo_avatar.svg');
    onStatus('Downloaded successfully', 'success');
  } catch (error) {
    console.error(error);
    onStatus('SVG save failed.', 'error');
  }
}

export async function saveGIF(canvas, ctx, state, onStatus) {
  onStatus(`Generating GIF (~${GIF_ESTIMATE_SEC} sec)…`, 'busy');

  try {
    try {
      await saveWithGifenc(canvas, ctx, state, onStatus);
    } catch (encError) {
      console.warn('gifenc failed, trying gif.js', encError);
      if (!isGifJsAvailable()) throw encError;
      await saveWithGifJs(canvas, ctx, state, onStatus);
    }
    onStatus('Downloaded successfully', 'success');
  } catch (error) {
    console.error(error);
    onStatus('GIF failed — try PNG, or refresh with internet and retry.', 'error');
    throw error;
  }
}

export async function copyImage(canvas, ctx, state, frameT, onStatus) {
  try {
    onStatus('Copying to clipboard…', 'busy');
    const { size, transparent } = getExportOptions(state);
    const exportCanvas = renderToExportCanvas(state, frameT, size, transparent);

    exportCanvas.toBlob(async (blob) => {
      if (!blob) {
        onStatus('Copy failed — try downloading instead.', 'error');
        return;
      }
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        onStatus('Copied to clipboard', 'success');
      } catch {
        onStatus('Clipboard access denied — try downloading instead.', 'error');
      }
    }, 'image/png');
  } catch (error) {
    console.error(error);
    onStatus('Copy failed.', 'error');
  }
}

export function downloadByFormat(canvas, ctx, state, frameT, onStatus) {
  const format = state.exportFormat || 'png';
  switch (format) {
    case 'svg':
      saveSVG(state, frameT, onStatus);
      break;
    case 'gif':
      return saveGIF(canvas, ctx, state, onStatus);
    case 'webp':
      onStatus('Exporting…', 'busy');
      saveWebP(canvas, ctx, state, frameT, onStatus);
      break;
    default:
      onStatus('Exporting…', 'busy');
      savePNG(canvas, ctx, state, frameT, onStatus);
  }
}

export function updateDownloadButtonLabel(format, busy = false) {
  const btn = document.getElementById('downloadBtn');
  if (!btn) return;

  if (busy) {
    const label = format === 'gif' ? 'Generating GIF…' : 'Exporting…';
    const icon = btn.querySelector('.btn__icon');
    btn.textContent = '';
    if (icon) btn.appendChild(icon);
    btn.appendChild(document.createTextNode(` ${label}`));
    return;
  }

  const labels = { png: 'Download PNG', svg: 'Download SVG', gif: 'Generate GIF', webp: 'Download WebP' };
  const label = labels[format] || 'Download PNG';
  const icon = btn.querySelector('.btn__icon');
  btn.textContent = '';
  if (icon) btn.appendChild(icon);
  btn.appendChild(document.createTextNode(` ${label}`));
}
