import { DEFAULT_STATE } from './config.js';

/** Shared application state. */
export const state = { ...DEFAULT_STATE };

const UI_BINDINGS = [
  { id: 'mainName', key: 'mainName', transform: (v) => v.trim() || 'MO' },
  { id: 'subLine1', key: 'subLine1', transform: (v) => v.trim() },
  { id: 'subLine2', key: 'subLine2', transform: (v) => v.trim() },
  { id: 'glowStrength', key: 'glowStrength', display: 'glowStrengthVal', parse: Number },
  { id: 'glowPulse', key: 'glowPulse', display: 'glowPulseVal', parse: Number },
  { id: 'centerGlow', key: 'centerGlow', display: 'centerGlowVal', parse: Number },
  { id: 'borderWidth', key: 'borderWidth', display: 'borderWidthVal', parse: Number },
  { id: 'borderGlow', key: 'borderGlow', display: 'borderGlowVal', parse: Number },
  { id: 'borderPulse', key: 'borderPulse', display: 'borderPulseVal', parse: Number },
  { id: 'particleDensity', key: 'particleDensity', display: 'particleDensityVal', parse: Number },
  { id: 'effectIntensity', key: 'effectIntensity', display: 'effectIntensityVal', parse: Number },
];

const RADIO_BINDINGS = [
  { name: 'theme', key: 'themeName' },
  { name: 'nameCase', key: 'nameCase' },
  { name: 'textStyle', key: 'textStyle' },
  { name: 'bgStyle', key: 'bgStyle' },
  { name: 'particleStyle', key: 'particleStyle' },
  { name: 'overlayEffect', key: 'overlayEffect' },
  { name: 'textAnim', key: 'textAnim' },
  { name: 'borderStyle', key: 'borderStyle' },
  { name: 'borderRotation', key: 'borderRotation' },
  { name: 'rotationDir', key: 'rotationDir' },
  { name: 'exportSize', key: 'exportSize', parse: Number },
  { name: 'exportBg', key: 'exportBg' },
  { name: 'exportFormat', key: 'exportFormat' },
];

function getElement(id) {
  return document.getElementById(id);
}

function snapshotState() {
  const snap = {};
  for (const key of Object.keys(DEFAULT_STATE)) {
    if (key !== 't' && key !== 'recording') snap[key] = state[key];
  }
  return snap;
}

/** Sync UI controls into shared state. */
export function readUI() {
  for (const binding of UI_BINDINGS) {
    const el = getElement(binding.id);
    if (!el) continue;

    let value = el.value;
    if (binding.parse) value = binding.parse(value);
    if (binding.transform) value = binding.transform(value);

    state[binding.key] = value;

    if (binding.display) {
      const display = getElement(binding.display);
      if (display) display.textContent = value;
    }
  }

  for (const { name, key, parse } of RADIO_BINDINGS) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    if (!checked) continue;
    state[key] = parse ? parse(checked.value) : checked.value;
  }

  updateCharCounters();
}

function updateCharCounters() {
  const counters = [
    { input: 'mainName', counter: 'mainNameCounter', max: 8 },
    { input: 'subLine1', counter: 'subLine1Counter', max: 20 },
    { input: 'subLine2', counter: 'subLine2Counter', max: 20 },
  ];

  for (const { input, counter, max } of counters) {
    const el = getElement(input);
    const counterEl = getElement(counter);
    if (el && counterEl) {
      counterEl.textContent = `${el.value.length}/${max}`;
    }
  }
}

/** Apply a state snapshot to UI controls. */
export function applyStateToUI(snap) {
  Object.assign(state, snap);

  for (const binding of UI_BINDINGS) {
    const el = getElement(binding.id);
    if (el && snap[binding.key] !== undefined) {
      el.value = snap[binding.key];
    }
    if (binding.display) {
      const display = getElement(binding.display);
      if (display && snap[binding.key] !== undefined) {
        display.textContent = snap[binding.key];
      }
    }
  }

  for (const { name, key } of RADIO_BINDINGS) {
    if (snap[key] === undefined) continue;
    const radio = document.querySelector(`input[name="${name}"][value="${snap[key]}"]`);
    if (radio) radio.checked = true;
  }

  updateCharCounters();
}

/** Attach input listeners for text fields. */
export function bindTextInputs(ids, onChange) {
  for (const id of ids) {
    const el = getElement(id);
    if (!el) continue;
    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
  }
}

/** Attach listeners for range/select controls. */
export function bindControls(configs, onChange) {
  for (const { id, event = 'input' } of configs) {
    const el = getElement(id);
    if (el) el.addEventListener(event, onChange);
  }
}

/** Attach listeners for radio groups. */
export function bindRadios(names, onChange) {
  for (const name of names) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
      radio.addEventListener('change', onChange);
    });
  }
}

export function createHistory(maxSize = 30) {
  const stack = [];
  const redoStack = [];
  let applying = false;

  function push() {
    if (applying) return;
    const snap = snapshotState();
    const last = stack[stack.length - 1];
    if (last && JSON.stringify(last) === JSON.stringify(snap)) return;
    stack.push(snap);
    redoStack.length = 0;
    if (stack.length > maxSize) stack.shift();
  }

  function undo() {
    if (stack.length <= 1) return false;
    redoStack.push(stack.pop());
    applying = true;
    applyStateToUI(stack[stack.length - 1]);
    applying = false;
    return true;
  }

  function redo() {
    if (redoStack.length === 0) return false;
    const snap = redoStack.pop();
    stack.push(snap);
    applying = true;
    applyStateToUI(snap);
    applying = false;
    return true;
  }

  function reset() {
    applying = true;
    applyStateToUI({ ...DEFAULT_STATE });
    stack.length = 0;
    redoStack.length = 0;
    stack.push(snapshotState());
    applying = false;
  }

  function canUndo() {
    return stack.length > 1;
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  function seed() {
    stack.push(snapshotState());
  }

  return {
    push,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    seed,
    get isApplying() { return applying; },
  };
}

export { snapshotState };
