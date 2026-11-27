'use strict';
/* ============================================================
   Map Drawing — phase 1 core
   Maps are stored in cells; pixels are chosen only when rendering.
   Terrain is a label grid at R samples per cell; each terrain is
   rendered as a procedural, tileable texture clipped by a blurred
   mask, stacked by priority so edges blend without gaps.
   ============================================================ */

const R = 8; // label samples per cell
const TILE_CELLS = 4; // texture tile spans 4×4 cells
let SEASON = 'summer'; // spring | summer | autumn | winter
let SHOW_TOP = true; // roofs and tree canopies shown (off: see inside buildings and under trees)
const SUN = { dx: 0.07, dy: 0.1, a: 0.6 }; // shadow direction per unit of height, and shadow strength

/* ---------- utilities ---------- */
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function mulberry(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(i, j, s) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, per, s) {
  const xi = Math.floor(x),
    yi = Math.floor(y),
    xf = x - xi,
    yf = y - yi;
  const u = xf * xf * (3 - 2 * xf),
    v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % per) + per) % per,
    y0 = ((yi % per) + per) % per,
    x1 = (x0 + 1) % per,
    y1 = (y0 + 1) % per;
  const a = hash(x0, y0, s),
    b = hash(x1, y0, s),
    c = hash(x0, y1, s),
    d = hash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// tileable fbm over u,v in [0,1)
function fbm(u, v, per, oct, s) {
  let sum = 0,
    amp = 1,
    norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += amp * vnoise(u * per, v * per, per, s + o * 101);
    norm += amp;
    amp *= 0.5;
    per *= 2;
  }
  return sum / norm;
}
function makeVoronoi(g, rnd) {
  const pts = new Float32Array(g * g * 2);
  for (let i = 0; i < g * g; i++) {
    pts[i * 2] = 0.15 + rnd() * 0.7;
    pts[i * 2 + 1] = 0.15 + rnd() * 0.7;
  }
  return function (u, v) {
    const x = u * g,
      y = v * g,
      cx = Math.floor(x),
      cy = Math.floor(y);
    let f1 = 9,
      f2 = 9,
      id = 0;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        const ci = (((cx + di) % g) + g) % g,
          cj = (((cy + dj) % g) + g) % g,
          k = cj * g + ci;
        const px = cx + di + pts[k * 2],
          py = cy + dj + pts[k * 2 + 1],
          d = Math.hypot(x - px, y - py);
        if (d < f1) {
          f2 = f1;
          f1 = d;
          id = k;
        } else if (d < f2) f2 = d;
      }
    return { f1, f2, id };
  };
}
function rampAt(r, t) {
  t = clamp(t, 0, 1) * (r.length - 1);
  const i = Math.min(r.length - 2, Math.floor(t)),
    f = t - i,
    a = r[i],
    b = r[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
function slug(s) {
  return (
    (s || 'map')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'map'
  );
}
function u8ToB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToU8(b) {
  const s = atob(b),
    u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
