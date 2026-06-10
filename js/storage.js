import { DEFAULT_STATE } from './config.js';

const STORAGE_KEY = 'mo-avatar-state-v1';

const PERSISTED_KEYS = Object.keys(DEFAULT_STATE).filter(
  (key) => key !== 't' && key !== 'recording'
);

function pickPersistedFields(source) {
  const snap = {};
  for (const key of PERSISTED_KEYS) {
    if (source[key] !== undefined) snap[key] = source[key];
  }
  return snap;
}

function isValidSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return false;
  if (typeof snap.mainName !== 'string' || snap.mainName.length > 8) return false;
  if (typeof snap.subLine1 !== 'string' || snap.subLine1.length > 20) return false;
  if (typeof snap.subLine2 !== 'string' || snap.subLine2.length > 20) return false;
  return true;
}

/** Restore saved settings from localStorage, if present. */
export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidSnapshot(parsed)) return null;
    return pickPersistedFields(parsed);
  } catch {
    return null;
  }
}

/** Save current settings to localStorage. */
export function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersistedFields(state)));
  } catch {
    // Ignore quota or private-mode errors.
  }
}
