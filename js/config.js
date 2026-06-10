/** Canvas dimensions and drawing constants. */
export const CANVAS = {
  width: 480,
  height: 480,
  outerRadius: 232,
};

/** Modern theme palette — each drives bg mesh, accents, and UI swatch. */
export const THEMES = {
  dark: {
    bg: '#0a0e16', bgHi: '#151b28', bgLo: '#05070c',
    accent: '#4db8ff', accent2: '#a78bfa', text: '#ffffff',
    label: 'Midnight Blue', short: 'Dark', glow: 'rgba(77,184,255,0.45)',
  },
  purple: {
    bg: '#0e0a18', bgHi: '#1a1228', bgLo: '#080510',
    accent: '#b48cff', accent2: '#f472b6', text: '#ffffff',
    label: 'Violet Dream', short: 'Purple', glow: 'rgba(180,140,255,0.45)',
  },
  teal: {
    bg: '#061410', bgHi: '#0c221c', bgLo: '#030a08',
    accent: '#2ee6a8', accent2: '#5ee8ff', text: '#ffffff',
    label: 'Electric Teal', short: 'Teal', glow: 'rgba(46,230,168,0.4)',
  },
  sunset: {
    bg: '#1a0a12', bgHi: '#2d1520', bgLo: '#0d0508',
    accent: '#ff6b6b', accent2: '#ffb347', text: '#ffffff',
    label: 'Warm Sunset', short: 'Sunset', glow: 'rgba(255,107,107,0.45)',
  },
  ocean: {
    bg: '#041018', bgHi: '#0a2438', bgLo: '#020810',
    accent: '#00d4ff', accent2: '#0066ff', text: '#ffffff',
    label: 'Deep Ocean', short: 'Ocean', glow: 'rgba(0,212,255,0.4)',
  },
  neon: {
    bg: '#0a0a0f', bgHi: '#14141f', bgLo: '#050508',
    accent: '#39ff14', accent2: '#ff10f0', text: '#ffffff',
    label: 'Neon Pulse', short: 'Neon', glow: 'rgba(57,255,20,0.4)',
  },
  rose: {
    bg: '#150810', bgHi: '#251018', bgLo: '#0a0406',
    accent: '#fb7185', accent2: '#f472b6', text: '#ffffff',
    label: 'Soft Rose', short: 'Rose', glow: 'rgba(251,113,133,0.42)',
  },
  amber: {
    bg: '#120c04', bgHi: '#1f1608', bgLo: '#080604',
    accent: '#fbbf24', accent2: '#f97316', text: '#ffffff',
    label: 'Golden Amber', short: 'Amber', glow: 'rgba(251,191,36,0.42)',
  },
  slate: {
    bg: '#111113', bgHi: '#1c1c1f', bgLo: '#09090b',
    accent: '#e4e4e7', accent2: '#a1a1aa', text: '#fafafa',
    label: 'Modern Slate', short: 'Slate', glow: 'rgba(228,228,231,0.35)',
  },
  aurora: {
    bg: '#0a1218', bgHi: '#102030', bgLo: '#050a10',
    accent: '#22d3ee', accent2: '#818cf8', text: '#ffffff',
    label: 'Aurora', short: 'Aurora', glow: 'rgba(34,211,238,0.42)',
  },
  cyber: {
    bg: '#0d0221', bgHi: '#1a0440', bgLo: '#060110',
    accent: '#7c3aed', accent2: '#06b6d4', text: '#ffffff',
    label: 'Cyber Violet', short: 'Cyber', glow: 'rgba(124,58,237,0.45)',
  },
  forest: {
    bg: '#061208', bgHi: '#0c1f10', bgLo: '#030804',
    accent: '#4ade80', accent2: '#86efac', text: '#ffffff',
    label: 'Forest Glow', short: 'Forest', glow: 'rgba(74,222,128,0.4)',
  },
  lava: {
    bg: '#140605', bgHi: '#280a08', bgLo: '#080202',
    accent: '#ef4444', accent2: '#f97316', text: '#ffffff',
    label: 'Molten Lava', short: 'Lava', glow: 'rgba(239,68,68,0.45)',
  },
};

export const THEME_IDS = Object.keys(THEMES);

export const ROT_SPEEDS = {
  off: 0,
  slow: 0.002,
  medium: 0.006,
  fast: 0.018,
};

export const GIF_EXPORT = {
  loopFrames: 24,
  fps: 10,
  outputSize: 1024,
  encodeTimeoutMs: 45000,
};

export const DEFAULT_STATE = {
  themeName: 'dark',
  mainName: 'MO',
  subLine1: 'Software Engineer',
  subLine2: '',
  nameCase: 'upper',
  textStyle: 'glow',
  bgStyle: 'mesh',
  particleDensity: 20,
  particleStyle: 'float',
  overlayEffect: 'none',
  textAnim: 'none',
  effectIntensity: 50,
  glowStrength: 35,
  glowPulse: 25,
  centerGlow: 30,
  borderWidth: 3,
  borderGlow: 50,
  borderPulse: 50,
  borderStyle: 'gradient',
  borderRotation: 'slow',
  rotationDir: 'cw',
  exportSize: 1024,
  exportBg: 'solid',
  exportFormat: 'png',
  t: 0,
  recording: false,
};

export const PRESETS = {
  developer: {
    mainName: 'MO', subLine1: 'Software Engineer', subLine2: '',
    themeName: 'dark', bgStyle: 'mesh', textStyle: 'glow',
    glowStrength: 30, borderStyle: 'gradient', borderRotation: 'slow', particleDensity: 15,
  },
  designer: {
    mainName: 'MO', subLine1: 'UI Designer', subLine2: '',
    themeName: 'rose', bgStyle: 'aurora', textStyle: 'gradient',
    glowStrength: 45, borderStyle: 'halo', borderRotation: 'medium', particleDensity: 35,
  },
  founder: {
    mainName: 'MO', subLine1: 'Founder', subLine2: 'CEO',
    themeName: 'amber', bgStyle: 'mesh', textStyle: 'glow',
    glowStrength: 40, borderStyle: 'double', borderRotation: 'slow', particleDensity: 10,
  },
  pm: {
    mainName: 'MO', subLine1: 'Product Manager', subLine2: '',
    themeName: 'teal', bgStyle: 'radial', textStyle: 'clean',
    glowStrength: 35, borderStyle: 'gradient', borderRotation: 'off', particleDensity: 0,
  },
  creator: {
    mainName: 'MO', subLine1: 'Content Creator', subLine2: '',
    themeName: 'sunset', bgStyle: 'aurora', textStyle: 'gradient',
    glowStrength: 50, borderStyle: 'neon', borderRotation: 'fast', particleDensity: 45,
    particleStyle: 'meteor', textAnim: 'shimmer', overlayEffect: 'shimmer', effectIntensity: 60,
  },
  hacker: {
    mainName: 'MO', subLine1: 'Security Engineer', subLine2: '',
    themeName: 'neon', bgStyle: 'mesh', textStyle: 'glow',
    glowStrength: 55, borderStyle: 'neon', borderRotation: 'medium', particleDensity: 30,
    particleStyle: 'sparkle', overlayEffect: 'scanlines', textAnim: 'pulse', effectIntensity: 45,
  },
  minimalist: {
    mainName: 'MO', subLine1: 'Engineer', subLine2: '',
    themeName: 'slate', bgStyle: 'radial', textStyle: 'clean', nameCase: 'upper',
    glowStrength: 10, centerGlow: 10, borderStyle: 'minimal', borderRotation: 'off',
    borderGlow: 20, particleDensity: 0,
  },
  devops: {
    mainName: 'MO', subLine1: 'DevOps', subLine2: 'Cloud',
    themeName: 'ocean', bgStyle: 'mesh', textStyle: 'glow',
    glowStrength: 35, borderStyle: 'gradient', borderRotation: 'slow', particleDensity: 20,
  },
  streamer: {
    mainName: 'MO', subLine1: 'Live Coder', subLine2: '',
    themeName: 'cyber', bgStyle: 'waves', textStyle: 'gradient',
    glowStrength: 55, borderStyle: 'rainbow', borderRotation: 'fast', particleDensity: 50,
    particleStyle: 'meteor', textAnim: 'shimmer', overlayEffect: 'shimmer', effectIntensity: 70,
  },
  retro: {
    mainName: 'MO', subLine1: 'Retro Dev', subLine2: '',
    themeName: 'amber', bgStyle: 'radial', textStyle: 'glow',
    glowStrength: 40, borderStyle: 'dash', borderRotation: 'medium', particleDensity: 25,
    particleStyle: 'rise', overlayEffect: 'grain', textAnim: 'float', effectIntensity: 35,
  },
};
