import {
  state,
  readUI,
  bindTextInputs,
  bindControls,
  bindRadios,
  applyStateToUI,
  createHistory,
} from './state.js';
import { copyImage, downloadByFormat, updateDownloadButtonLabel } from './export.js';
import { loadGifJs, isGifJsAvailable } from './gif-loader.js';
import { loadPersistedState, persistState } from './storage.js';
import { PRESETS, THEMES, THEME_IDS, ROT_SPEEDS } from './config.js';

const TEXT_INPUTS = ['mainName', 'subLine1', 'subLine2'];

const CONTROL_BINDINGS = [
  { id: 'glowStrength' },
  { id: 'glowPulse' },
  { id: 'centerGlow' },
  { id: 'borderWidth' },
  { id: 'borderGlow' },
  { id: 'borderPulse' },
  { id: 'particleDensity' },
  { id: 'effectIntensity' },
];

const RADIO_GROUPS = [
  'theme', 'nameCase', 'textStyle', 'bgStyle', 'particleStyle', 'overlayEffect', 'textAnim',
  'borderStyle', 'borderRotation', 'rotationDir',
  'exportSize', 'exportBg', 'exportFormat',
];

const MOBILE_SHEET_MQ = window.matchMedia('(max-width: 48rem)');
const REDUCED_MOTION_MQ = window.matchMedia('(prefers-reduced-motion: reduce)');

function isMobileSheet() {
  return MOBILE_SHEET_MQ.matches;
}

function setStatus(message, variant = 'success') {
  const status = document.getElementById('status');
  const banner = document.getElementById('statusBanner');
  if (status) status.textContent = message;
  if (banner) {
    banner.classList.remove('status-banner--info', 'status-banner--busy', 'status-banner--error');
    if (variant === 'busy') banner.classList.add('status-banner--busy');
    else if (variant === 'error') banner.classList.add('status-banner--error');
    else if (variant === 'info') banner.classList.add('status-banner--info');
  }
}

function showGifHelp(show) {
  const help = document.getElementById('gifHelp');
  if (!help) return;

  help.classList.toggle('is-hidden', !show);
  if (show) {
    const refreshKey = /Mac|iPhone|iPad/i.test(navigator.platform) ? 'Cmd+R' : 'Ctrl+R';
    help.textContent =
      `GIF export needs internet once. Connect to Wi‑Fi, refresh (${refreshKey}), wait a few seconds, then try again.`;
  }
}

function updateMetadata() {
  const size = state.exportSize || 1024;
  const metaSize = document.getElementById('metaSize');
  const metaAnim = document.getElementById('metaAnim');
  const metaTheme = document.getElementById('metaTheme');

  if (metaSize) metaSize.textContent = `${size} × ${size}`;
  if (metaAnim) {
    const rotAnim = (ROT_SPEEDS[state.borderRotation] ?? 0) > 0;
    const glowAnim = state.glowPulse > 0;
    const textAnim = state.textAnim && state.textAnim !== 'none';
    const overlayAnim = state.overlayEffect && state.overlayEffect !== 'none';
    const particleAnim = (state.particleDensity ?? 0) > 0;
    const isAnimated = rotAnim || glowAnim || textAnim || overlayAnim || particleAnim;
    metaAnim.textContent = isAnimated ? 'Animated' : 'Static';
    metaAnim.classList.toggle('badge--accent', isAnimated);
  }
  if (metaTheme) {
    const theme = THEMES[state.themeName] ?? THEMES.dark;
    metaTheme.textContent = theme.label;
  }
}

function initAccordions() {
  document.querySelectorAll('[data-accordion]').forEach((section) => {
    const trigger = section.querySelector('.accordion__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = section.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  });
}

function updateRangeFill(input) {
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const val = Number(input.value);
  const pct = ((val - min) / (max - min)) * 100;
  input.style.setProperty('--range-fill', `${pct}%`);
}

function initRangeFills() {
  document.querySelectorAll('[data-range-fill]').forEach((input) => {
    updateRangeFill(input);
    input.addEventListener('input', () => updateRangeFill(input));
  });
}

function refreshRangeFills() {
  document.querySelectorAll('[data-range-fill]').forEach(updateRangeFill);
}

function renderThemePicker() {
  const container = document.getElementById('themePicker');
  if (!container) return;

  container.innerHTML = THEME_IDS.map((id) => {
    const t = THEMES[id];
    const checked = id === state.themeName ? 'checked' : '';
    return `
      <label class="gradient-card" style="--t-bg:${t.bg};--t-bg-hi:${t.bgHi};--t-bg-lo:${t.bgLo};--t-accent:${t.accent};--t-glow:${t.glow};--t-accent2:${t.accent2}">
        <input type="radio" name="theme" value="${id}" data-theme="${id}" ${checked}>
        <span class="gradient-card__surface">
          <span class="gradient-card__swatch" aria-hidden="true"></span>
          <span class="gradient-card__label">${t.short}</span>
        </span>
      </label>
    `;
  }).join('');
}

function initThemePicker(onChange) {
  const container = document.getElementById('themePicker');
  if (!container || container.dataset.bound) return;
  container.dataset.bound = 'true';

  container.addEventListener('change', (event) => {
    if (event.target.name === 'theme') onChange();
  });

  container.addEventListener('mouseover', (event) => {
    const card = event.target.closest('.gradient-card');
    if (!card) return;
    const radio = card.querySelector('input[name="theme"]');
    if (radio) {
      state.themeName = radio.value;
      updateMetadata();
    }
  });

  container.addEventListener('mouseout', (event) => {
    const card = event.target.closest('.gradient-card');
    if (!card || card.contains(event.relatedTarget)) return;
    readUI();
    updateMetadata();
  });
}

function initZoom(canvas) {
  const modal = document.getElementById('zoomModal');
  const zoomCanvas = document.getElementById('zoom-canvas');
  const zoomBtn = document.getElementById('zoomBtn');
  const zoomClose = document.getElementById('zoomClose');
  const zoomBackdrop = document.getElementById('zoomBackdrop');
  if (!modal || !zoomCanvas || !zoomBtn) return;

  const zctx = zoomCanvas.getContext('2d');

  function openZoom() {
    if (zctx) zctx.drawImage(canvas, 0, 0);
    modal.classList.remove('is-hidden');
  }

  function closeZoom() {
    modal.classList.add('is-hidden');
  }

  zoomBtn.addEventListener('click', openZoom);
  zoomClose?.addEventListener('click', closeZoom);
  zoomBackdrop?.addEventListener('click', closeZoom);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('is-hidden')) {
      closeZoom();
    }
  });
}

function initKeyboardShortcuts(history, handlers) {
  document.addEventListener('keydown', (event) => {
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;

    if (event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      handlers.undo();
    } else if (event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      handlers.redo();
    }
  });
}

function initSheet() {
  const sheet = document.getElementById('controlsSheet');
  const overlay = document.getElementById('sheetOverlay');
  const content = document.getElementById('sheetContent');
  const trigger = document.getElementById('sheetTrigger');
  const closeBtn = document.getElementById('sheetClose');
  if (!sheet || !overlay || !content || !trigger || !closeBtn) return;

  let isOpen = false;
  let lastFocused = null;

  function setOpen(open) {
    if (!isMobileSheet()) {
      isOpen = true;
      sheet.classList.add('sheet--open');
      sheet.setAttribute('aria-hidden', 'false');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.classList.remove('sheet-open');
      return;
    }

    isOpen = open;
    sheet.classList.toggle('sheet--open', open);
    sheet.setAttribute('aria-hidden', String(!open));
    trigger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('sheet-open', open);

    if (open) {
      lastFocused = document.activeElement;
      requestAnimationFrame(() => content.focus());
      return;
    }

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function applySheetMode() {
    if (!isMobileSheet()) {
      content.removeAttribute('role');
      content.removeAttribute('aria-modal');
      setOpen(true);
      return;
    }

    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-modal', 'true');
    setOpen(false);
  }

  trigger.addEventListener('click', () => setOpen(true));
  closeBtn.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', () => setOpen(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMobileSheet() && isOpen) {
      event.preventDefault();
      setOpen(false);
    }
  });

  MOBILE_SHEET_MQ.addEventListener('change', applySheetMode);
  applySheetMode();
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  applyStateToUI({ ...state, ...preset });
  renderThemePicker();
  readUI();
}

function randomize() {
  const styles = ['gradient', 'double', 'halo', 'neon', 'pulse', 'minimal', 'rainbow', 'dash', 'comet'];
  const speeds = ['off', 'slow', 'medium', 'fast'];
  const bgStyles = ['mesh', 'radial', 'aurora', 'waves'];
  const textStyles = ['glow', 'gradient', 'clean'];
  const nameCases = ['upper', 'title', 'as-is'];
  const particleStyles = ['float', 'orbit', 'sparkle', 'meteor', 'rise'];
  const overlayEffects = ['none', 'scanlines', 'shimmer', 'grain', 'stars'];
  const textAnims = ['none', 'pulse', 'shimmer', 'float'];
  const titles = [
    'Software Engineer', 'Designer', 'Founder', 'Creator', 'Developer',
    'Product Manager', 'DevOps', 'Security Engineer', 'Data Scientist',
  ];

  applyStateToUI({
    ...state,
    themeName: THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)],
    nameCase: nameCases[Math.floor(Math.random() * nameCases.length)],
    textStyle: textStyles[Math.floor(Math.random() * textStyles.length)],
    bgStyle: bgStyles[Math.floor(Math.random() * bgStyles.length)],
    particleStyle: particleStyles[Math.floor(Math.random() * particleStyles.length)],
    overlayEffect: overlayEffects[Math.floor(Math.random() * overlayEffects.length)],
    textAnim: textAnims[Math.floor(Math.random() * textAnims.length)],
    effectIntensity: 25 + Math.floor(Math.random() * 60),
    particleDensity: Math.floor(Math.random() * 60),
    glowStrength: 20 + Math.floor(Math.random() * 50),
    glowPulse: Math.floor(Math.random() * 60),
    centerGlow: 20 + Math.floor(Math.random() * 50),
    borderWidth: 1 + Math.floor(Math.random() * 6),
    borderGlow: 30 + Math.floor(Math.random() * 60),
    borderPulse: Math.floor(Math.random() * 80),
    borderStyle: styles[Math.floor(Math.random() * styles.length)],
    borderRotation: speeds[Math.floor(Math.random() * speeds.length)],
    subLine1: titles[Math.floor(Math.random() * titles.length)],
  });
  renderThemePicker();
  readUI();
}

export function initUI({ canvas, ctx, draw }) {
  const history = createHistory();
  let historyTimer = null;
  let persistTimer = null;

  const saved = loadPersistedState();
  if (saved) {
    applyStateToUI({ ...state, ...saved });
  }

  function updateHistoryButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = !history.canUndo();
    if (redoBtn) redoBtn.disabled = !history.canRedo();
  }

  function performUndo() {
    if (history.undo()) {
      renderThemePicker();
      refreshRangeFills();
      updateMetadata();
      updateDownloadButtonLabel(state.exportFormat);
      updateHistoryButtons();
      setStatus('Undone last change.', 'info');
    }
  }

  function performRedo() {
    if (history.redo()) {
      renderThemePicker();
      refreshRangeFills();
      updateMetadata();
      updateDownloadButtonLabel(state.exportFormat);
      updateHistoryButtons();
      setStatus('Redone.', 'info');
    }
  }

  function onChange() {
    readUI();
    refreshRangeFills();
    updateMetadata();
    updateDownloadButtonLabel(state.exportFormat);
    scheduleHistoryPush();
    schedulePersist();
  }

  function scheduleHistoryPush() {
    if (history.isApplying) return;
    clearTimeout(historyTimer);
    historyTimer = setTimeout(() => {
      history.push();
      updateHistoryButtons();
    }, 400);
  }

  function schedulePersist() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => persistState(state), 300);
  }

  renderThemePicker();
  initThemePicker(onChange);

  bindTextInputs(TEXT_INPUTS, onChange);
  bindControls(CONTROL_BINDINGS, onChange);
  bindRadios(RADIO_GROUPS.filter((g) => g !== 'theme'), onChange);

  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      applyPreset(button.dataset.preset);
      refreshRangeFills();
      history.push();
      updateHistoryButtons();
      updateMetadata();
      setStatus('Preset applied.', 'success');
      persistState(state);
    });
  });

  document.getElementById('undoBtn')?.addEventListener('click', performUndo);
  document.getElementById('redoBtn')?.addEventListener('click', performRedo);

  initKeyboardShortcuts(history, { undo: performUndo, redo: performRedo });

  document.getElementById('resetBtn')?.addEventListener('click', () => {
    history.reset();
    renderThemePicker();
    readUI();
    refreshRangeFills();
    updateMetadata();
    updateDownloadButtonLabel(state.exportFormat);
    updateHistoryButtons();
    setStatus('Reset to defaults.', 'info');
    persistState(state);
  });

  document.getElementById('randomizeBtn')?.addEventListener('click', () => {
    randomize();
    history.push();
    updateHistoryButtons();
    updateMetadata();
    setStatus('Randomized appearance.', 'info');
    persistState(state);
  });

  document.getElementById('downloadBtn')?.addEventListener('click', async () => {
    readUI();
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = true;
    updateDownloadButtonLabel(state.exportFormat, true);

    try {
      if (state.exportFormat === 'gif') {
        state.recording = true;
        await downloadByFormat(canvas, ctx, state, state.t, setStatus);
        state.recording = false;
      } else {
        downloadByFormat(canvas, ctx, state, state.t, setStatus);
      }
    } finally {
      state.recording = false;
      if (downloadBtn) downloadBtn.disabled = false;
      updateDownloadButtonLabel(state.exportFormat, false);
    }
  });

  document.getElementById('copyBtn')?.addEventListener('click', () => {
    readUI();
    copyImage(canvas, ctx, state, state.t, setStatus);
  });

  readUI();
  refreshRangeFills();
  history.seed();
  initSheet();
  initAccordions();
  initRangeFills();
  initZoom(canvas);
  updateMetadata();
  updateDownloadButtonLabel(state.exportFormat);
  updateHistoryButtons();

  loadGifJs().then((loaded) => {
    if (loaded && isGifJsAvailable()) {
      setStatus('Ready to export', 'success');
      showGifHelp(false);
    } else {
      setStatus('Ready to export — GIF needs internet once, then refresh.', 'info');
      showGifHelp(true);
    }
  });

  function loop() {
    if (!state.recording) draw();
    if (!REDUCED_MOTION_MQ.matches) state.t++;
    requestAnimationFrame(loop);
  }

  loop();
}
