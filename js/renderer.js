import { CANVAS, THEMES, ROT_SPEEDS } from './config.js';

const { width: W, height: H, outerRadius: R_OUTER } = CANVAS;
const cx = W / 2;
const cy = H / 2;

function fitNameFont(name) {
  const len = name.length;
  if (len <= 2) return '800 128px "Outfit", sans-serif';
  if (len <= 4) return '800 100px "Outfit", sans-serif';
  return '800 76px "Outfit", sans-serif';
}

function fitSubtitleFont(text) {
  const len = text.length;
  if (len <= 12) return '700 32px "Outfit", sans-serif';
  if (len <= 16) return '700 26px "Outfit", sans-serif';
  return '700 20px "Outfit", sans-serif';
}

function hexAlpha(n) {
  return Math.min(255, Math.round(n)).toString(16).padStart(2, '0');
}

function formatName(text, nameCase) {
  const t = text?.trim() || '';
  if (nameCase === 'title') {
    return t.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (nameCase === 'as-is') return t;
  return t.toUpperCase();
}

function rotAngle(frameT, state) {
  const speed = ROT_SPEEDS[state.borderRotation] ?? 0;
  const dir = state.rotationDir === 'ccw' ? -1 : 1;
  return frameT * speed * dir;
}

function ringGradient(ctx, angle, theme) {
  const x1 = cx + Math.cos(angle) * R_OUTER;
  const y1 = cy + Math.sin(angle) * R_OUTER;
  const x2 = cx - Math.cos(angle) * R_OUTER;
  const y2 = cy - Math.sin(angle) * R_OUTER;
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, theme.accent);
  gradient.addColorStop(0.5, theme.accent2);
  gradient.addColorStop(1, theme.accent);
  return gradient;
}

function strokeRing(ctx, theme, r, lineWidth, alpha, angle, glow) {
  ctx.strokeStyle = ringGradient(ctx, angle, theme);
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = alpha;
  if (glow) {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = glow;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawBackground(ctx, theme, state, pulse, transparent, frameT) {
  if (transparent) return;

  const bgHi = theme.bgHi || '#151b28';
  const bgLo = theme.bgLo || '#05070c';
  const style = state.bgStyle || 'mesh';

  const base = ctx.createRadialGradient(cx, cy - 30, 8, cx, cy, 260);
  base.addColorStop(0, bgHi);
  base.addColorStop(0.5, theme.bg);
  base.addColorStop(1, bgLo);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  if (style === 'radial') return;

  const blob1 = ctx.createRadialGradient(cx - 70, cy - 90, 0, cx - 70, cy - 90, 190);
  blob1.addColorStop(0, theme.accent + hexAlpha(22 + 12 * pulse));
  blob1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = blob1;
  ctx.fillRect(0, 0, W, H);

  const blob2 = ctx.createRadialGradient(cx + 80, cy + 70, 0, cx + 80, cy + 70, 170);
  blob2.addColorStop(0, theme.accent2 + hexAlpha(18 + 10 * pulse));
  blob2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = blob2;
  ctx.fillRect(0, 0, W, H);

  if (style === 'aurora') {
    const blob3 = ctx.createRadialGradient(cx, cy - 120, 0, cx, cy - 40, 200);
    blob3.addColorStop(0, theme.accent2 + hexAlpha(28 + 14 * pulse));
    blob3.addColorStop(0.6, theme.accent + hexAlpha(10));
    blob3.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blob3;
    ctx.fillRect(0, 0, W, H);
  }

  if (style === 'waves') {
    const waveCount = 4;
    for (let i = 0; i < waveCount; i++) {
      const phase = frameT * 0.025 + i * 1.4;
      const baseY = cy + 60 + i * 28;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= W; x += 8) {
        const y = baseY + Math.sin(x * 0.02 + phase) * (8 + i * 3);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      const waveAlpha = 12 + i * 6 + pulse * 8;
      ctx.fillStyle = (i % 2 === 0 ? theme.accent : theme.accent2) + hexAlpha(waveAlpha);
      ctx.fill();
    }
  }
}

function effectScale(state) {
  return (state.effectIntensity ?? 50) / 100;
}

function drawParticles(ctx, theme, state, frameT) {
  const density = state.particleDensity ?? 0;
  if (density <= 0) return;

  const style = state.particleStyle || 'float';
  if (style === 'orbit') drawOrbitParticles(ctx, theme, state, frameT, density);
  else if (style === 'sparkle') drawSparkleParticles(ctx, theme, state, frameT, density);
  else if (style === 'meteor') drawMeteorParticles(ctx, theme, state, frameT, density);
  else if (style === 'rise') drawRiseParticles(ctx, theme, state, frameT, density);
  else drawFloatParticles(ctx, theme, state, frameT, density);
}

function drawFloatParticles(ctx, theme, state, frameT, density) {
  const count = Math.min(8, Math.ceil(density / 12));
  for (let i = 0; i < count; i++) {
    const phase = frameT * 0.012 + i * 1.7;
    const orbit = 90 + (i * 31) % 100;
    const x = cx + Math.cos(phase) * orbit * 0.85;
    const y = cy + Math.sin(phase * 1.25) * orbit * 0.75;
    drawParticleDot(ctx, theme, x, y, density, i, phase);
  }
}

function drawOrbitParticles(ctx, theme, state, frameT, density) {
  const count = Math.min(10, Math.ceil(density / 10));
  const r = 175 + (density / 100) * 25;
  for (let i = 0; i < count; i++) {
    const a = frameT * 0.015 * (1 + (i % 3) * 0.3) + (i / count) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    drawParticleDot(ctx, theme, x, y, density, i, a * 2);
  }
}

function drawSparkleParticles(ctx, theme, state, frameT, density) {
  const count = Math.min(14, Math.ceil(density / 8));
  const scale = effectScale(state);
  for (let i = 0; i < count; i++) {
    const seed = i * 97.3;
    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(frameT * 0.06 + seed));
    const x = cx + Math.cos(seed) * (60 + (i * 17) % 120);
    const y = cy + Math.sin(seed * 1.3) * (50 + (i * 23) % 100);
    const size = (1 + (i % 3)) * twinkle * scale;

    ctx.globalAlpha = twinkle * scale * 0.9;
    ctx.fillStyle = i % 2 === 0 ? theme.accent : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (twinkle > 0.7) {
      ctx.strokeStyle = theme.accent2 + hexAlpha(twinkle * 180 * scale);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - size * 3, y);
      ctx.lineTo(x + size * 3, y);
      ctx.moveTo(x, y - size * 3);
      ctx.lineTo(x, y + size * 3);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawMeteorParticles(ctx, theme, state, frameT, density) {
  const count = Math.min(5, Math.ceil(density / 20));
  const scale = effectScale(state);
  for (let i = 0; i < count; i++) {
    const cycle = ((frameT * 0.006 + i * 0.28) % 1);
    const angle = -Math.PI * 0.35 + i * 0.9;
    const dist = R_OUTER * (1.1 - cycle);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const tailLen = (30 + density * 0.4) * scale;
    const tx = x - Math.cos(angle) * tailLen;
    const ty = y - Math.sin(angle) * tailLen;

    const grad = ctx.createLinearGradient(tx, ty, x, y);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.6, theme.accent2 + hexAlpha(80 * scale * (1 - cycle)));
    grad.addColorStop(1, '#ffffff');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5 + scale;
    ctx.lineCap = 'round';
    ctx.globalAlpha = (1 - cycle * 0.5) * scale;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(x, y);
    ctx.stroke();

    drawParticleDot(ctx, theme, x, y, density, i, cycle);
  }
  ctx.globalAlpha = 1;
}

function drawRiseParticles(ctx, theme, state, frameT, density) {
  const count = Math.min(12, Math.ceil(density / 10));
  const scale = effectScale(state);
  for (let i = 0; i < count; i++) {
    const cycle = ((frameT * 0.004 + i * 0.12) % 1);
    const x = cx + Math.sin(i * 2.1) * (80 + (i * 13) % 60);
    const y = cy + 100 - cycle * 200;
    const alpha = (1 - cycle) * scale;
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = i % 2 === 0 ? theme.accent : theme.accent2;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (density / 100) * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawParticleDot(ctx, theme, x, y, density, i, phase) {
  const size = 1.2 + (density / 100) * 2 + (i % 2) * 0.8;
  const alpha = (0.15 + (density / 100) * 0.35) * (0.6 + 0.4 * Math.sin(phase * 2));
  const dot = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
  dot.addColorStop(0, theme.accent + hexAlpha(alpha * 255));
  dot.addColorStop(0.5, theme.accent2 + hexAlpha(alpha * 140));
  dot.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(x, y, size * 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawOverlay(ctx, theme, state, frameT, pulse) {
  const effect = state.overlayEffect || 'none';
  if (effect === 'none') return;

  const intensity = effectScale(state);

  if (effect === 'scanlines') {
    ctx.globalAlpha = intensity * 0.12;
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, y, W, 1);
    }
    ctx.globalAlpha = intensity * 0.06;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, (frameT * 1.5) % H, W, 2);
  }

  if (effect === 'shimmer') {
    const offset = ((frameT * 3) % (W + 160)) - 80;
    const grad = ctx.createLinearGradient(offset, 0, offset + 100, H);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.45, theme.accent + hexAlpha(intensity * 35));
    grad.addColorStop(0.55, '#ffffff' + hexAlpha(intensity * 25));
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  if (effect === 'grain') {
    const grains = Math.floor(120 * intensity);
    for (let i = 0; i < grains; i++) {
      const gx = ((i * 7919 + frameT * 3) % W);
      const gy = ((i * 6271 + frameT * 2) % H);
      ctx.globalAlpha = 0.04 + (i % 5) * 0.02 * intensity;
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(gx, gy, 1, 1);
    }
  }

  if (effect === 'stars') {
    const count = Math.floor(20 + intensity * 30);
    for (let i = 0; i < count; i++) {
      const sx = ((i * 137.5) % W);
      const sy = ((i * 89.3) % H);
      const tw = 0.2 + 0.8 * Math.abs(Math.sin(frameT * 0.04 + i));
      ctx.globalAlpha = tw * intensity * 0.7;
      ctx.fillStyle = i % 3 === 0 ? theme.accent2 : '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}

function drawOrbitDots(ctx, theme, angle, pulse, borderGlow) {
  const r = 208;
  const count = 3;
  const glowScale = borderGlow / 100;

  for (let i = 0; i < count; i++) {
    const a = angle * 1.4 + (i / count) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const size = 3 + pulse;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, theme.accent);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.85 * glowScale;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawRotatingArc(ctx, theme, r, lineWidth, angle, pulse, borderGlow) {
  const glowScale = borderGlow / 100;
  const trackAlpha = 0.2;
  const arcSpan = Math.PI * 0.55;
  const start = angle;

  ctx.lineCap = 'round';

  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = trackAlpha;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = theme.accent2;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = (0.45 + 0.15 * pulse) * glowScale;
  ctx.shadowColor = theme.accent2;
  ctx.shadowBlur = (10 + 8 * pulse) * glowScale;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + arcSpan);
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, lineWidth * 0.65);
  ctx.globalAlpha = 0.9 * glowScale;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = (6 + 4 * pulse) * glowScale;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start + 0.08, start + arcSpan * 0.35);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawBorder(ctx, theme, state, pulse, angle) {
  const w = state.borderWidth;
  const r = R_OUTER;
  const borderGlow = state.borderGlow ?? 50;
  const borderPulseAmt = (state.borderPulse ?? 50) / 100;
  const scaledPulse = pulse * borderPulseAmt + (1 - borderPulseAmt) * 0.5;
  const glowPx = (10 + 5 * scaledPulse) * (borderGlow / 100);
  const style = state.borderStyle;

  if (style === 'minimal') {
    strokeRing(ctx, theme, r, Math.max(1, w * 0.5), 0.35, angle, 0);
    return;
  }

  if (style === 'neon') {
    strokeRing(ctx, theme, r, w + 2, 0.2 + 0.08 * scaledPulse, angle, glowPx * 1.8);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = Math.max(1, w * 0.4);
    ctx.shadowColor = theme.accent2;
    ctx.shadowBlur = glowPx * 2;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    drawRotatingArc(ctx, theme, r, w, angle, scaledPulse, borderGlow);
    return;
  }

  if (style === 'pulse') {
    const pulseW = w + scaledPulse * 4;
    strokeRing(ctx, theme, r, pulseW, 0.15 + 0.1 * scaledPulse, angle, glowPx * 1.2);
    return;
  }

  if (style === 'rainbow') {
    drawRainbowBorder(ctx, r, w, angle, scaledPulse, borderGlow);
    return;
  }

  if (style === 'dash') {
    drawDashBorder(ctx, theme, r, w, angle, scaledPulse, borderGlow);
    return;
  }

  if (style === 'comet') {
    drawCometBorder(ctx, theme, r, w, angle, scaledPulse, borderGlow);
    return;
  }

  if (style === 'halo') {
    strokeRing(ctx, theme, r, w + 8, 0.08 + 0.04 * scaledPulse, angle, (14 + 6 * scaledPulse) * (borderGlow / 100));
    drawRotatingArc(ctx, theme, r, w, angle, scaledPulse, borderGlow);
  } else if (style === 'double') {
    strokeRing(ctx, theme, r - 10, w * 0.6, 0.3 + 0.12 * scaledPulse, -angle, 6 * (borderGlow / 100));
    drawRotatingArc(ctx, theme, r + 2, w * 0.85, angle, scaledPulse, borderGlow);
    drawOrbitDots(ctx, theme, angle, scaledPulse, borderGlow);
  } else {
    strokeRing(ctx, theme, r, w + 4, 0.1 + 0.05 * scaledPulse, angle, glowPx);
    drawRotatingArc(ctx, theme, r, w, angle, scaledPulse, borderGlow);
  }
}

function drawRainbowBorder(ctx, r, w, angle, pulse, borderGlow) {
  const segments = 16;
  const glowScale = borderGlow / 100;
  ctx.lineCap = 'round';

  for (let i = 0; i < segments; i++) {
    const a0 = angle + (i / segments) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2 / segments) * 0.75;
    const hue = ((i / segments) * 360 + angle * 57.3) % 360;
    ctx.strokeStyle = `hsl(${hue}, 85%, 58%)`;
    ctx.lineWidth = w + 1;
    ctx.globalAlpha = (0.5 + 0.2 * pulse) * glowScale;
    ctx.shadowColor = `hsl(${hue}, 90%, 65%)`;
    ctx.shadowBlur = 8 * glowScale;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawDashBorder(ctx, theme, r, w, angle, pulse, borderGlow) {
  const glowScale = borderGlow / 100;
  ctx.setLineDash([10 + pulse * 6, 8]);
  ctx.lineDashOffset = -angle * 40;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ringGradient(ctx, angle, theme);
  ctx.lineWidth = w;
  ctx.globalAlpha = (0.55 + 0.15 * pulse) * glowScale;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 10 * glowScale;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawCometBorder(ctx, theme, r, w, angle, pulse, borderGlow) {
  const glowScale = borderGlow / 100;
  strokeRing(ctx, theme, r, w, 0.12, angle, 4 * glowScale);

  const headAngle = angle;
  const hx = cx + Math.cos(headAngle) * r;
  const hy = cy + Math.sin(headAngle) * r;
  const tailLen = 55 + pulse * 20;
  const tx = cx + Math.cos(headAngle - 0.5) * (r - tailLen * 0.3);
  const ty = cy + Math.sin(headAngle - 0.5) * (r - tailLen * 0.3);

  const grad = ctx.createLinearGradient(tx, ty, hx, hy);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, theme.accent2 + hexAlpha(120 * glowScale));
  grad.addColorStop(1, '#ffffff');
  ctx.strokeStyle = grad;
  ctx.lineWidth = w + 2;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.95 * glowScale;
  ctx.shadowColor = theme.accent;
  ctx.shadowBlur = 14 * glowScale;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(hx, hy);
  ctx.stroke();

  const head = ctx.createRadialGradient(hx, hy, 0, hx, hy, w * 4);
  head.addColorStop(0, '#ffffff');
  head.addColorStop(0.4, theme.accent);
  head.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(hx, hy, w * 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawText(ctx, theme, state, pulse, frameT) {
  const name = formatName(state.mainName, state.nameCase);
  const textStyle = state.textStyle || 'glow';
  const textAnim = state.textAnim || 'none';
  const animScale = effectScale(state);
  const glow = state.glowStrength / 100;
  const glowPulse = state.glowPulse / 100;
  const pulseAmount = glowPulse * pulse;

  let nameOffsetY = 0;
  let nameAlpha = 1;
  if (textAnim === 'pulse') {
    nameAlpha = 0.85 + 0.15 * pulse * animScale;
  } else if (textAnim === 'float') {
    nameOffsetY = Math.sin(frameT * 0.05) * 4 * animScale;
  }

  const nameY = cy - 14 + nameOffsetY;

  ctx.font = fitNameFont(name);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (textStyle === 'glow' && glow > 0) {
    ctx.shadowColor = theme.accent;
    ctx.shadowBlur = glow * (28 + 22 * pulseAmount);
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = glow * 0.5;
    ctx.fillText(name, cx, nameY);

    ctx.shadowColor = theme.accent2;
    ctx.shadowBlur = glow * (18 + 14 * pulseAmount);
    ctx.fillStyle = theme.accent2;
    ctx.globalAlpha = glow * 0.3;
    ctx.fillText(name, cx, nameY);
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  if (textStyle === 'gradient' || textAnim === 'shimmer') {
    const shift = textAnim === 'shimmer' ? Math.sin(frameT * 0.06) * 60 * animScale : 0;
    const grad = ctx.createLinearGradient(cx - 100 + shift, nameY, cx + 100 + shift, nameY);
    grad.addColorStop(0, theme.accent);
    grad.addColorStop(0.35, '#ffffff');
    grad.addColorStop(0.65, theme.accent2);
    grad.addColorStop(1, theme.accent);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = theme.text;
  }

  if (textStyle === 'clean') {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(name, cx, nameY);
  }

  ctx.globalAlpha = nameAlpha;
  ctx.fillText(name, cx, nameY);
  ctx.globalAlpha = 1;

  const lines = [state.subLine1?.trim() || '', state.subLine2?.trim() || ''].filter(Boolean);
  const lineCount = lines.length;
  const startY = lineCount === 1 ? cy + 42 : cy + 32;
  const lineGap = lineCount === 1 ? 0 : 34;
  const subGlow = textStyle === 'clean' ? glow * 0.2 : glow * 0.4;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = startY + i * lineGap;
    ctx.font = fitSubtitleFont(line);
    ctx.letterSpacing = line.length > 14 ? '0.04em' : '0.06em';

    if (subGlow > 0 && textStyle !== 'clean') {
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = subGlow * (10 + 6 * pulseAmount);
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = subGlow * 0.4;
      ctx.fillText(line, cx, y);
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = textStyle === 'clean' ? 2 : 3;
    ctx.globalAlpha = 1;
    ctx.strokeText(line, cx, y);
    ctx.fillStyle = textStyle === 'clean' ? theme.text : 'rgba(255,255,255,0.95)';
    ctx.fillText(line, cx, y);
  }

  ctx.letterSpacing = '0px';
}

/**
 * Render a single avatar frame.
 */
export function drawFrame(ctx, state, frameT, options = {}) {
  const theme = THEMES[state.themeName] ?? THEMES.dark;
  const pulse = 0.5 + 0.5 * Math.sin(frameT * 0.04);
  const angle = rotAngle(frameT, state);
  const transparent = options.transparent ?? false;

  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R_OUTER, 0, Math.PI * 2);
  ctx.clip();

  drawBackground(ctx, theme, state, pulse, transparent, frameT);
  drawParticles(ctx, theme, state, frameT);

  const centerGlow = state.centerGlow / 100;
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 110);
  core.addColorStop(0, theme.accent + hexAlpha(centerGlow * (40 + 25 * pulse)));
  core.addColorStop(0.45, theme.accent2 + hexAlpha(centerGlow * (18 + 12 * pulse)));
  core.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.fill();

  drawText(ctx, theme, state, pulse, frameT);
  drawOverlay(ctx, theme, state, frameT, pulse);

  if (!transparent) {
    const vignette = ctx.createRadialGradient(cx, cy, 150, cx, cy, R_OUTER);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vignette;
    ctx.beginPath();
    ctx.arc(cx, cy, R_OUTER, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  drawBorder(ctx, theme, state, pulse, angle);
}

export function getCycleLength(state) {
  const rotSpeed = ROT_SPEEDS[state.borderRotation] ?? 0;
  return rotSpeed > 0 ? (Math.PI * 2) / rotSpeed : (Math.PI * 2) / 0.04;
}

export function generateSVG(state, frameT = 0) {
  const theme = THEMES[state.themeName] ?? THEMES.dark;
  const pulse = 0.5 + 0.5 * Math.sin(frameT * 0.04);
  const angle = rotAngle(frameT, state);
  const name = formatName(state.mainName, state.nameCase);
  const lines = [state.subLine1?.trim(), state.subLine2?.trim()].filter(Boolean);
  const glow = state.glowStrength / 100;
  const borderGlow = (state.borderGlow ?? 50) / 100;

  const nameFontSize = name.length <= 2 ? 128 : name.length <= 4 ? 100 : 76;
  const subtitleSize = lines[0]?.length > 12 ? 26 : 32;
  const lineCount = lines.length;
  const startY = lineCount === 1 ? cy + 42 : cy + 32;

  const subtitleEls = lines
    .map((line, i) => {
      const y = startY + i * 34;
      return `<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="Outfit,sans-serif" font-weight="700" font-size="${subtitleSize}" letter-spacing="0.06em" fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.75)" stroke-width="3" paint-order="stroke">${escapeXml(line)}</text>`;
    })
    .join('\n    ');

  const gradAngle = angle;
  const x1 = cx + Math.cos(gradAngle) * R_OUTER;
  const y1 = cy + Math.sin(gradAngle) * R_OUTER;
  const x2 = cx - Math.cos(gradAngle) * R_OUTER;
  const y2 = cy - Math.sin(gradAngle) * R_OUTER;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="44%" r="54%">
      <stop offset="0%" stop-color="${theme.bgHi || '#151b28'}"/>
      <stop offset="50%" stop-color="${theme.bg}"/>
      <stop offset="100%" stop-color="${theme.bgLo || '#05070c'}"/>
    </radialGradient>
    <linearGradient id="ring" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${theme.accent}"/>
      <stop offset="50%" stop-color="${theme.accent2}"/>
      <stop offset="100%" stop-color="${theme.accent}"/>
    </linearGradient>
    <filter id="nameGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${glow * 8}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${R_OUTER}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${R_OUTER}" fill="none" stroke="url(#ring)" stroke-width="${state.borderWidth + 6}" opacity="${0.12 + 0.06 * pulse * borderGlow}"/>
  <text x="${cx}" y="${cy - 14}" text-anchor="middle" dominant-baseline="middle" font-family="Outfit,sans-serif" font-weight="800" font-size="${nameFontSize}" fill="${theme.text}" filter="url(#nameGlow)">${escapeXml(name)}</text>
  ${subtitleEls}
</svg>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
