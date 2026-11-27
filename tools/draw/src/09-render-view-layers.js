/* ---------- renderer ---------- */
const scratch = {
  mask: document.createElement('canvas'),
  L: document.createElement('canvas'),
  E: document.createElement('canvas'),
  A: document.createElement('canvas')
};
for (const k in scratch) scratch[k].ctx = scratch[k].getContext('2d', { willReadFrequently: k === 'mask' });
function sizeTo(c, w, h) {
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  } else c.ctx.clearRect(0, 0, w, h);
  c.ctx.globalCompositeOperation = 'source-over';
  c.ctx.filter = 'none';
  c.ctx.imageSmoothingEnabled = true;
  c.ctx.imageSmoothingQuality = 'high';
}

// Render cells [rx0,rx1)×[ry0,ry1) of `m` into ctx at P px per cell.
function renderRegion(m, ctx, P, rx0, ry0, rx1, ry1) {
  const M = 2;
  const ex0 = Math.max(0, rx0 - M),
    ey0 = Math.max(0, ry0 - M),
    ex1 = Math.min(m.cols, rx1 + M),
    ey1 = Math.min(m.rows, ry1 + M);
  const sw = (ex1 - ex0) * R,
    sh = (ey1 - ey0) * R,
    lw = Math.round((ex1 - ex0) * P),
    lh = Math.round((ey1 - ey0) * P);
  const W = m.cols * R,
    lab = m.labels;
  const present = new Uint8Array(TERRAINS.length);
  for (let y = 0; y < sh; y++) {
    const row = (ey0 * R + y) * W + ex0 * R;
    for (let x = 0; x < sw; x++) present[lab[row + x]] = 1;
  }
  const list = [];
  present.forEach((p, i) => p && list.push(i));
  list.sort((a, b) => TERRAINS[a].prio - TERRAINS[b].prio);
  const { mask, L, E, A } = scratch;
  sizeTo(mask, sw, sh);
  sizeTo(L, lw, lh);
  sizeTo(E, lw, lh);
  sizeTo(A, lw, lh);
  const md = mask.ctx.createImageData(sw, sh),
    dd = md.data;
  const prio = TERRAINS.map(t => t.prio);
  list.forEach((tid, k) => {
    const T = seasonal(TERRAINS[tid]),
      p = T.prio;
    for (let y = 0; y < sh; y++) {
      const row = (ey0 * R + y) * W + ex0 * R,
        o = y * sw;
      for (let x = 0; x < sw; x++) {
        const i = (o + x) * 4;
        dd[i] = dd[i + 1] = dd[i + 2] = 255;
        dd[i + 3] = prio[lab[row + x]] >= p ? 255 : 0;
      }
    }
    mask.ctx.putImageData(md, 0, 0);
    const lc = L.ctx;
    lc.globalCompositeOperation = 'source-over';
    lc.clearRect(0, 0, lw, lh);
    const blur = k === 0 && !m.overlay ? 0 : m.soft * T.soft * P * 0.5;
    lc.filter = blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : 'none';
    lc.drawImage(mask, 0, 0, lw, lh);
    lc.filter = 'none';
    lc.globalCompositeOperation = 'source-in';
    const pat = lc.createPattern(getTexture(tid, P), 'repeat');
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, -ex0 * P, -ey0 * P]));
    lc.fillStyle = pat;
    lc.fillRect(0, 0, lw, lh);
    if (T.edge && (k > 0 || m.overlay)) {
      const ec = E.ctx;
      ec.globalCompositeOperation = 'source-over';
      ec.clearRect(0, 0, lw, lh);
      ec.fillStyle = T.edge.color;
      ec.fillRect(0, 0, lw, lh);
      ec.globalCompositeOperation = 'destination-out';
      ec.drawImage(mask, 0, 0, lw, lh);
      ec.globalCompositeOperation = 'source-over';
      lc.globalCompositeOperation = 'source-atop';
      lc.filter = `blur(${Math.max(1, T.edge.w * P).toFixed(2)}px)`;
      lc.drawImage(E, 0, 0);
      lc.filter = 'none';
    }
    lc.globalCompositeOperation = 'source-over';
    A.ctx.drawImage(L, 0, 0);
  });
  const ox = (rx0 - ex0) * P,
    oy = (ry0 - ey0) * P,
    w = (rx1 - rx0) * P,
    h = (ry1 - ry0) * P;
  ctx.clearRect(rx0 * P, ry0 * P, w, h);
  ctx.drawImage(A, ox, oy, w, h, rx0 * P, ry0 * P, w, h);
}

function renderFull(m, P, withGrid, opt = {}) {
  const prevSeason = SEASON,
    prevSun = { ...SUN },
    prevTop = SHOW_TOP;
  if (opt.season) SEASON = opt.season;
  setSun(opt.tod || 'day');
  SHOW_TOP = opt.top !== false;
  try {
    return renderFull0(m, P, withGrid, opt);
  } finally {
    SEASON = prevSeason;
    Object.assign(SUN, prevSun);
    SHOW_TOP = prevTop;
  }
}
function renderFull0(m, P, withGrid, opt = {}) {
  const c = document.createElement('canvas');
  c.width = m.cols * P;
  c.height = m.rows * P;
  const ctx = c.getContext('2d'),
    strip = Math.max(1, Math.floor(1600 / P));
  const Ls = shownLayers(m, !!opt.dm);
  for (const l of Ls) {
    const lv = layerView(m, l);
    const tc = document.createElement('canvas');
    tc.width = c.width;
    tc.height = c.height;
    const tx = tc.getContext('2d');
    for (let y = 0; y < m.rows; y += strip)
      for (let x = 0; x < m.cols; x += strip)
        renderRegion(lv, tx, P, x, y, Math.min(m.cols, x + strip), Math.min(m.rows, y + strip));
    if (l === m.layers[0]) drawRelief(tx, m, P);
    drawStructure(lv, tx, P, { secret: !!opt.dm });
    ctx.globalAlpha = l.opacity;
    ctx.drawImage(tc, 0, 0);
    ctx.globalAlpha = 1;
  }
  if (opt.tod && opt.tod !== 'day') {
    const nt = document.createElement('canvas');
    nt.width = c.width;
    nt.height = c.height;
    const nx = nt.getContext('2d');
    nx.filter = `saturate(${TOD[opt.tod].sat})`;
    nx.drawImage(c, 0, 0);
    nx.filter = 'none';
    const L = buildNight(m, P, c.width, c.height, m.nightStr ?? 0.7, m.lightRad ?? 1, !!opt.dm, opt.tod);
    nx.globalCompositeOperation = 'multiply';
    nx.drawImage(L.dark, 0, 0);
    nx.globalCompositeOperation = 'screen';
    nx.drawImage(L.glow, 0, 0);
    nx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(nt, 0, 0);
  }
  if (opt.labels)
    drawLabels(
      ctx,
      Ls.flatMap(l => l.struct.labels || []),
      P
    );
  if (withGrid) {
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = Math.max(1, P / 45);
    ctx.beginPath();
    if (isHex(m)) hexGridPath(ctx, m, P, 0, 0, m.hcols, m.hrows, 0, 0);
    else {
      for (let i = 1; i < m.cols; i++) {
        ctx.moveTo(i * P, 0);
        ctx.lineTo(i * P, m.rows * P);
      }
      for (let j = 1; j < m.rows; j++) {
        ctx.moveTo(0, j * P);
        ctx.lineTo(m.cols * P, j * P);
      }
    }
    ctx.stroke();
  }
  const [ew, eh] = exportSize(m, P);
  if (ew === c.width && eh === c.height) return c;
  const out = document.createElement('canvas');
  out.width = ew;
  out.height = eh;
  out.getContext('2d').drawImage(c, 0, 0);
  return out;
}

function hexGridPath(ctx, m, P, c0, r0, c1, r1, ox, oy) {
  for (let r = r0; r < r1; r++)
    for (let c = c0; c < c1; c++) {
      const [x, y] = hexCenter(m, c, r),
        k = hexCorners(m, x, y);
      ctx.moveTo(ox + k[0][0] * P, oy + k[0][1] * P);
      for (let i = 1; i < 6; i++) ctx.lineTo(ox + k[i][0] * P, oy + k[i][1] * P);
      ctx.closePath();
    }
}

/* ---------- view ---------- */
const structCanvas = $('structCanvas'),
  sctx = structCanvas.getContext('2d');
const view = $('view'),
  mapCanvas = $('mapCanvas'),
  mctx = mapCanvas.getContext('2d'),
  overlay = $('overlay'),
  octx = overlay.getContext('2d');
let viewP = 48,
  zoom = 30,
  panX = 0,
  panY = 0;
let dirty = null,
  rafPending = false;

/* ---------- layers: map.layers[0] is the base; map.labels / map.struct always alias the ACTIVE layer ---------- */
const LV = new Map(); // layer id -> { t: terrain canvas, s: structure canvas }
const shownLayers = (m, dm = true) => m.layers.filter(l => l.visible && (!l.dm || dm));
const layerView = (m, l) =>
  Object.assign(Object.create(m), { labels: l.labels, struct: l.struct, overlay: l !== m.layers[0] });
const activeLayer = () => map.layers.find(l => l.id === map.activeLayer) || map.layers[0];
const baseActive = () => activeLayer() === map.layers[0];
function ensureLayers(m, extras = [], active) {
  if (!m.layers)
    m.layers = [{ id: 'base', name: 'Base', visible: true, opacity: 1, dm: false, labels: m.labels, struct: m.struct }];
  for (const e of extras) m.layers.push(e);
  m.activeLayer = m.layers.some(l => l.id === active) ? active : 'base';
  return m;
}
function newLayer(name, o = {}) {
  const labels = new Uint8Array(map.cols * R * map.rows * R);
  labels.fill(255);
  return { id: uid(), name, visible: true, opacity: o.opacity ?? 1, dm: !!o.dm, labels, struct: emptyStruct() };
}
function setActiveLayer(id) {
  const l = map.layers.find(x => x.id === id) || map.layers[0];
  map.activeLayer = l.id;
  map.labels = l.labels;
  map.struct = l.struct;
  wallDraft = null;
  selObj = null;
  buildLayerPanel();
  drawOverlay();
}
function layerCanvases(l) {
  if (l === map.layers[0]) return { t: mapCanvas, s: structCanvas };
  let c = LV.get(l.id);
  if (!c) {
    c = { t: document.createElement('canvas'), s: document.createElement('canvas') };
    for (const cv of [c.t, c.s]) cv.className = 'lcv';
    LV.set(l.id, c);
  }
  return c;
}
function syncLayerDOM() {
  const ids = new Set(map.layers.map(l => l.id));
  for (const [id, c] of LV)
    if (!ids.has(id)) {
      c.t.remove();
      c.s.remove();
      LV.delete(id);
    }
  for (const l of map.layers) {
    const c = layerCanvases(l);
    for (const cv of [c.t, c.s]) {
      if (cv !== mapCanvas && cv !== structCanvas) {
        view.insertBefore(cv, nightCanvas);
        if (cv.width !== mapCanvas.width || cv.height !== mapCanvas.height) {
          cv.width = mapCanvas.width;
          cv.height = mapCanvas.height;
        }
      }
      cv.style.width = mapCanvas.style.width;
      cv.style.height = mapCanvas.style.height;
      cv.style.opacity = l.opacity;
      cv.style.display = l.visible ? '' : 'none';
    }
  }
  applyView();
}
function renderLayer(l, x0, y0, x1, y1) {
  renderRegion(layerView(map, l), layerCanvases(l).t.getContext('2d'), viewP, x0, y0, x1, y1);
}
function renderAllLayers() {
  for (const l of map.layers) renderLayer(l, 0, 0, map.cols, map.rows);
}
function setupCanvas() {
  viewP = clamp(Math.floor(9000 / Math.max(map.cols, map.rows)), 16, 56);
  mapCanvas.width = map.cols * viewP;
  mapCanvas.height = map.rows * viewP;
  mapCanvas.style.width = mapCanvas.width + 'px';
  mapCanvas.style.height = mapCanvas.height + 'px';
  structCanvas.width = mapCanvas.width;
  structCanvas.height = mapCanvas.height;
  for (const cv of [nightCanvas, glowCanvas, labelCanvas, reliefCanvas]) {
    cv.width = mapCanvas.width;
    cv.height = mapCanvas.height;
    cv.style.width = mapCanvas.style.width;
    cv.style.height = mapCanvas.style.height;
  }
  structCanvas.style.width = mapCanvas.style.width;
  structCanvas.style.height = mapCanvas.style.height;
  for (const [, c] of LV) {
    c.t.width = c.s.width = 1;
  }
  syncLayerDOM();
  renderAllLayers();
  drawStructView();
  drawReliefView();
}
const nightCanvas = $('nightCanvas'),
  glowCanvas = $('glowCanvas'),
  labelCanvas = $('labelCanvas');
