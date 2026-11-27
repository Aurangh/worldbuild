/* ---------- map state ---------- */
let map = null; // { id, name, cols, rows, ft, seed, soft, base, labels:Uint8Array }
let curTerrain = 0,
  tool = 'brush';
let undoStack = [],
  redoStack = [];
let dirtySave = false;

/* ---------- grid geometry (1 internal unit = 1 square, or hex centre-to-centre distance) ---------- */
const SQ3 = Math.sqrt(3),
  HR = 1 / SQ3;
const isHex = m => m.grid === 'hexflat' || m.grid === 'hexpointy';
function hexExtent(grid, hc, hr) {
  return grid === 'hexflat'
    ? { w: 2 * HR + (hc - 1) * 1.5 * HR, h: hr + (hc > 1 ? 0.5 : 0) }
    : { w: hc + (hr > 1 ? 0.5 : 0), h: 2 * HR + (hr - 1) * 1.5 * HR };
}
function hexCenter(m, c, r) {
  return m.grid === 'hexflat'
    ? [HR + c * 1.5 * HR, 0.5 + r + (c & 1 ? 0.5 : 0)]
    : [0.5 + c + (r & 1 ? 0.5 : 0), HR + r * 1.5 * HR];
}
function hexCorners(m, cx, cy, k = 1) {
  const a0 = m.grid === 'hexflat' ? 0 : Math.PI / 6,
    out = [];
  for (let i = 0; i < 6; i++) {
    const a = a0 + (i * Math.PI) / 3;
    out.push([cx + HR * k * Math.cos(a), cy + HR * k * Math.sin(a)]);
  }
  return out;
}
function pixelToHex(m, x, y) {
  let c, r;
  if (m.grid === 'hexflat') {
    c = Math.round((x - HR) / (1.5 * HR));
    r = Math.round(y - 0.5 - (c & 1 ? 0.5 : 0));
  } else {
    r = Math.round((y - HR) / (1.5 * HR));
    c = Math.round(x - 0.5 - (r & 1 ? 0.5 : 0));
  }
  let best = null,
    bd = 9;
  for (let dc = -1; dc <= 1; dc++)
    for (let dr = -1; dr <= 1; dr++) {
      const cc = c + dc,
        rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= m.hcols || rr >= m.hrows) continue;
      const [hx, hy] = hexCenter(m, cc, rr),
        d = (hx - x) ** 2 + (hy - y) ** 2;
      if (d < bd) {
        bd = d;
        best = [cc, rr];
      }
    }
  return best && bd <= HR * HR * 1.01 ? best : best && bd < 0.34 ? best : null;
}
function hexCube(m, c, r) {
  if (m.grid === 'hexflat') {
    const q = c,
      rr = r - (c - (c & 1)) / 2;
    return [q, rr, -q - rr];
  }
  const q = c - (r - (r & 1)) / 2;
  return [q, r, -q - r];
}
function hexDist(m, a, b) {
  const A = hexCube(m, a[0], a[1]),
    B = hexCube(m, b[0], b[1]);
  return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2]));
}
function gridInit(m) {
  m.grid = m.grid || 'square';
  m.px = clamp(+m.px || 40, 8, 400);
  m.unit = m.unit || 'ft';
  if (isHex(m)) {
    const e = hexExtent(m.grid, m.hcols, m.hrows);
    m.exW = e.w;
    m.exH = e.h;
  } else {
    m.exW = m.cols;
    m.exH = m.rows;
  }
  return m;
}
const cellWord = (m, n) => (isHex(m) ? (n === 1 ? 'hex' : 'hexes') : n === 1 ? 'square' : 'squares');
const exportSize = (m, P) => [Math.round(m.exW * P), Math.round(m.exH * P)];

function blankMap(name, cols, rows, ft, base, g = {}) {
  const grid = g.grid || 'square';
  let hc = 0,
    hr = 0;
  if (grid !== 'square') {
    hc = cols;
    hr = rows;
    const e = hexExtent(grid, hc, hr);
    cols = Math.ceil(e.w - 1e-6);
    rows = Math.ceil(e.h - 1e-6);
  }
  const labels = new Uint8Array(cols * R * rows * R);
  labels.fill(base);
  return gridInit({
    id: uid(),
    name,
    cols,
    rows,
    ft,
    seed: (Math.random() * 1e9) | 0,
    soft: 0.6,
    base,
    labels,
    struct: emptyStruct(),
    custom: [],
    created: Date.now(),
    grid,
    px: g.px,
    unit: g.unit,
    hcols: hc,
    hrows: hr
  });
}

const emptyStruct = () => ({ walls: [], doors: [], stairs: [], objects: [], labels: [], roofs: [] });
