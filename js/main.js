import { state, readUI } from './state.js';
import { drawFrame } from './renderer.js';
import { initUI } from './ui.js';

const canvas = document.getElementById('avatar-canvas');
const ctx = canvas?.getContext('2d');

if (!canvas || !ctx) {
  throw new Error('Canvas element not found.');
}

function draw() {
  if (!state.recording) readUI();
  drawFrame(ctx, state, state.t);
}

initUI({ canvas, ctx, draw });
