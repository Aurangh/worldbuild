/* ---------- ground height: one level per square, 5 ft a step (−3 … +6) ---------- */
const H_MIN = -3,
  H_MAX = 6;
const hasHeights = m => !!(m.hgt && m.hgt.some(v => v));
/* ---------- relief, smooth variants: 'soft' hills · 'cliffs' natural cliffs · 'contour' map contours ---------- */
const RELIEF_STYLES = { cliffs: { sig: 0.4, disp: 0.3 }, contour: { sig: 0.5, disp: 0.22 } };
function rvnoise(x, y) {
  const h = (i, j) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const xi = Math.floor(x),
    yi = Math.floor(y),
    tx = x - xi,
    ty = y - yi,
    sx = tx * tx * (3 - 2 * tx),
    sy = ty * ty * (3 - 2 * ty);
  return (
    (h(xi, yi) * (1 - sx) + h(xi + 1, yi) * sx) * (1 - sy) + (h(xi, yi + 1) * (1 - sx) + h(xi + 1, yi + 1) * sx) * sy
  );
}
const fbm2 = (x, y) =>
  rvnoise(x, y) * 0.55 + rvnoise(x * 2.1 + 5.3, y * 2.1 + 1.7) * 0.3 + rvnoise(x * 4.3 + 9.1, y * 4.3 + 3.3) * 0.15;
function boxBlur(F, W, H, r) {
  if (r < 1) return F;
  const T = new Float32Array(F.length),
    n = 2 * r + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let j = 0; j < H; j++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += F[j * W + clamp(k, 0, W - 1)];
      for (let i = 0; i < W; i++) {
        T[j * W + i] = acc / n;
        acc += F[j * W + Math.min(W - 1, i + r + 1)] - F[j * W + Math.max(0, i - r)];
      }
    }
    for (let i = 0; i < W; i++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += T[clamp(k, 0, H - 1) * W + i];
      for (let j = 0; j < H; j++) {
        F[j * W + i] = acc / n;
        acc += T[Math.min(H - 1, j + r + 1) * W + i] - T[Math.max(0, j - r) * W + i];
      }
    }
  }
  return F;
}
function reliefField(m, SS, sig, disp) {
  // smooth, slightly irregular height field in levels, SS samples per square
  const C = m.cols,
    Rw = m.rows,
    W = C * SS,
    Hh = Rw * SS,
    H = m.hgt,
    F = new Float32Array(W * Hh);
  for (let j = 0; j < Hh; j++)
    for (let i = 0; i < W; i++) F[j * W + i] = H[Math.floor(j / SS) * C + Math.floor(i / SS)];
  boxBlur(F, W, Hh, Math.max(1, Math.round(sig * SS - 0.5)));
  const at = (x, y) => {
    x = clamp(x, 0, W - 1.001);
    y = clamp(y, 0, Hh - 1.001);
    const x0 = x | 0,
      y0 = y | 0,
      tx = x - x0,
      ty = y - y0,
      p = y0 * W + x0;
    return (F[p] * (1 - tx) + F[p + 1] * tx) * (1 - ty) + (F[p + W] * (1 - tx) + F[p + W + 1] * tx) * ty;
  };
  const D = new Float32Array(W * Hh),
    sd = m.seed % 997;
  for (let j = 0; j < Hh; j++)
    for (let i = 0; i < W; i++) {
      const x = i / SS,
        y = j / SS;
      D[j * W + i] = at(
        i + (fbm2(x * 0.6 + sd, y * 0.6) - 0.5) * 2 * disp * SS,
        j + (fbm2(x * 0.6 + 40 + sd, y * 0.6 + 17) - 0.5) * 2 * disp * SS
      );
    }
  return { D, W, Hh };
}
function drawRelief2(ctx, m, P, style) {
  const H = m.hgt;
  if (!H || !hasHeights(m) || H.length !== m.cols * m.rows) return;
  const st = RELIEF_STYLES[style] || RELIEF_STYLES.cliffs,
    n = m.cols * m.rows,
    SS = n > 20000 ? 3 : n > 6000 ? 5 : 8;
  const { D, W, Hh } = reliefField(m, SS, st.sig, st.disp),
    img = new ImageData(W, Hh),
    d = img.data,
    at = (i, j) => D[clamp(j, 0, Hh - 1) * W + clamp(i, 0, W - 1)];
  let maxH = H_MIN;
  for (const v of H) if (v > maxH) maxH = v;
  const sl = Math.max(0.02, Math.hypot(SUN.dx, SUN.dy)),
    lx = -SUN.dx / sl,
    ly = -SUN.dy / sl,
    lz = 1.1,
    ln = Math.hypot(lx, ly, lz),
    Lx = lx / ln,
    Ly = ly / ln,
    Lz = lz / ln;
  const kStep = Math.min(0.5, 0.15 / sl),
    cliffs = style === 'cliffs',
    ao = Math.max(1, Math.round(SS * 0.3));
  for (let j = 0; j < Hh; j++)
    for (let i = 0; i < W; i++) {
      const g = at(i, j),
        w2 = Math.max(1, SS >> 2),
        gx = ((at(i + w2, j) - at(i - w2, j)) * SS) / (2 * w2),
        gy = ((at(i, j + w2) - at(i, j - w2)) * SS) / (2 * w2),
        s = Math.hypot(gx, gy);
      const kz = cliffs ? 0.55 : 0.45,
        nx = -gx * kz,
        ny = -gy * kz,
        nn = Math.hypot(nx, ny, 1);
      let v = (nx * Lx + ny * Ly + Lz) / nn - Lz + g * 0.03;
      const lap = (at(i - ao, j) + at(i + ao, j) + at(i, j - ao) + at(i, j + ao)) / 4 - g;
      v -= lap * (cliffs ? 2.2 : 1.6); // hollows darker, crests lighter
      for (let k = kStep; k <= maxH - g; k += kStep)
        if (at(i - SUN.dx * k * SS, j - SUN.dy * k * SS) - g >= k) {
          v -= SUN.a * 0.55;
          break;
        }
      const fc = cliffs && s > 0.95 ? clamp((s - 0.95) / 0.9, 0, 1) : 0;
      if (fc) v = v * (1 - fc * 0.85) - lap * fc * 1.5;
      let r = 0,
        gg = 0,
        b = 0,
        a = 0;
      if (v < 0) a = Math.min(0.6, -v * 1.1);
      else {
        r = gg = b = 255;
        a = Math.min(0.16, v * 0.6);
      }
      if (fc) {
        // steep ground turns to rock, laid over the terrain's own colour
        const f = fc,
          streak = fbm2((i / SS) * 9, (j / SS) * 1.4),
          south = gy < 0 ? 1 : 0.5;
        const band = 0.5 + 0.5 * Math.sin(g * 9 + streak * 3),
          fa = f * (0.62 + streak * 0.25) * south,
          fr = 150 - streak * 50 - band * 18,
          fg = 138 - streak * 46 - band * 17,
          fb = 120 - streak * 40 - band * 15;
        const oa = fa + a * (1 - fa);
        if (oa > 0) {
          r = (fr * fa + r * a * (1 - fa)) / oa;
          gg = (fg * fa + gg * a * (1 - fa)) / oa;
          b = (fb * fa + b * a * (1 - fa)) / oa;
          a = oa;
        }
      }
      const p = (j * W + i) * 4;
      d[p] = r;
      d[p + 1] = gg;
      d[p + 2] = b;
      d[p + 3] = a * 255;
    }
  const tc = document.createElement('canvas');
  tc.width = W;
  tc.height = Hh;
  tc.getContext('2d').putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tc, 0, 0, m.cols * P, m.rows * P);
  if (style === 'contour' || cliffs) {
    // marching squares: a line every 5 ft (contour style) or a crisp lip on cliff tops
    const k = P / SS,
      lines = {};
    for (let j = 0; j < Hh - 1; j++)
      for (let i = 0; i < W - 1; i++) {
        const c0 = at(i, j),
          c1 = at(i + 1, j),
          c2 = at(i + 1, j + 1),
          c3 = at(i, j + 1);
        const lo = Math.min(c0, c1, c2, c3),
          hi = Math.max(c0, c1, c2, c3);
        if (hi - lo < 0.01) continue;
        for (let t = Math.ceil(lo - 0.5) + 0.5; t < hi; t++) {
          const pts = [],
            e = (a, b, x0, y0, x1, y1) => {
              if ((a - t) * (b - t) < 0) {
                const u = (t - a) / (b - a);
                pts.push([(x0 + (x1 - x0) * u) * k, (y0 + (y1 - y0) * u) * k]);
              }
            };
          e(c0, c1, i, j, i + 1, j);
          e(c1, c2, i + 1, j, i + 1, j + 1);
          e(c3, c2, i, j + 1, i + 1, j + 1);
          e(c0, c3, i, j, i, j + 1);
          if (pts.length >= 2) {
            (lines[t] = lines[t] || []).push(pts[0], pts[1]);
            if (pts.length === 4) lines[t].push(pts[2], pts[3]);
          }
        }
      }
    for (const t in lines) {
      const L = lines[t],
        lev = +t + 0.5;
      if (cliffs) {
        ctx.strokeStyle = 'rgba(40,32,24,.18)';
        ctx.lineWidth = Math.max(0.8, P / 48);
      } else {
        ctx.strokeStyle = lev % 2 === 0 ? 'rgba(52,36,20,.55)' : 'rgba(52,36,20,.3)';
        ctx.lineWidth = Math.max(0.8, P / (lev % 2 === 0 ? 28 : 45));
      }
      ctx.beginPath();
      for (let q = 0; q < L.length; q += 2) {
        ctx.moveTo(L[q][0], L[q][1]);
        ctx.lineTo(L[q + 1][0], L[q + 1][1]);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}
function drawRelief(ctx, m, P) {
  drawRelief2(ctx, m, P, m.relief === 'contour' ? 'contour' : 'cliffs');
}
const reliefCanvas = $('reliefCanvas');
let reliefRaf = false;
function drawReliefView() {
  const x = reliefCanvas.getContext('2d');
  x.clearRect(0, 0, reliefCanvas.width, reliefCanvas.height);
  if (map.layers[0].visible) drawRelief(x, map, viewP);
}
function reliefChanged() {
  if (!reliefRaf) {
    reliefRaf = true;
    requestAnimationFrame(() => {
      reliefRaf = false;
      drawReliefView();
    });
  }
  touchSave();
}
function ensureHgt() {
  if (!map.hgt || map.hgt.length !== map.cols * map.rows) map.hgt = new Int8Array(map.cols * map.rows);
  return map.hgt;
}
function paintHeight(cx, cy, rad, lv) {
  const H = ensureHgt();
  let ch = false;
  const r2 = Math.max(rad, 0.5);
  for (let r = Math.max(0, Math.floor(cy - r2)); r < Math.min(map.rows, Math.ceil(cy + r2)); r++)
    for (let c = Math.max(0, Math.floor(cx - r2)); c < Math.min(map.cols, Math.ceil(cx + r2)); c++) {
      const inside = Math.hypot(c + 0.5 - cx, r + 0.5 - cy) <= r2 || (c === Math.floor(cx) && r === Math.floor(cy));
      if (inside && H[r * map.cols + c] !== lv) {
        H[r * map.cols + c] = lv;
        ch = true;
      }
    }
  if (ch) reliefChanged();
}
$('reliefSel').onchange = () => {
  map.relief = $('reliefSel').value;
  drawReliefView();
  touchSave();
};
$('hLevel').oninput = () => {
  $('hOut').textContent = heightLabel(+$('hLevel').value);
};
function heightLabel(v) {
  return v === 0 ? 'Ground level' : (v > 0 ? '+' : '−') + Math.abs(v) * 5 + ' ft' + (v > 0 ? ' (raised)' : ' (sunken)');
}

function drawStructView() {
  for (const l of map.layers) {
    const cv = layerCanvases(l).s,
      x = cv.getContext('2d');
    x.clearRect(0, 0, cv.width, cv.height);
    if (l.visible) drawStructure(layerView(map, l), x, viewP, { secret: $('showSecret').checked });
  }
  const lx = labelCanvas.getContext('2d');
  lx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
  if ($('showLabels').checked)
    drawLabels(
      lx,
      shownLayers(map).flatMap(l => l.struct.labels || []),
      viewP
    );
  drawNightView();
}
function drawNightView() {
  const tod = map.tod || 'day',
    lit = tod !== 'day';
  view.classList.toggle('lit', lit);
  $('todSel').value = tod;
  const f = lit ? `saturate(${TOD[tod].sat})` : '';
  for (const cv of [mapCanvas, reliefCanvas, structCanvas]) cv.style.filter = f;
  for (const [, c] of LV) {
    c.t.style.filter = c.s.style.filter = f;
  }
  if (!lit) return;
  const L = buildNight(
    map,
    viewP,
    mapCanvas.width,
    mapCanvas.height,
    map.nightStr ?? 0.7,
    map.lightRad ?? 1,
    true,
    tod
  );
  for (const [cv, src] of [
    [nightCanvas, L.dark],
    [glowCanvas, L.glow]
  ]) {
    const x = cv.getContext('2d');
    x.clearRect(0, 0, cv.width, cv.height);
    x.drawImage(src, 0, 0);
  }
}
let nightTimer = 0;
const nightSoon = () => {
  if (!map.tod || map.tod === 'day') return;
  clearTimeout(nightTimer);
  nightTimer = setTimeout(drawNightView, 150);
};
let structRaf = false;
function structChanged() {
  if (!structRaf) {
    structRaf = true;
    requestAnimationFrame(() => {
      structRaf = false;
      drawStructView();
    });
  }
  touchSave();
}
function renderView(x0, y0, x1, y1) {
  renderLayer(activeLayer(), x0, y0, x1, y1);
}
function markDirty(x0, y0, x1, y1) {
  x0 = Math.max(0, Math.floor(x0));
  y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(map.cols, Math.ceil(x1));
  y1 = Math.min(map.rows, Math.ceil(y1));
  if (x1 <= x0 || y1 <= y0) return;
  dirty = dirty
    ? { x0: Math.min(dirty.x0, x0), y0: Math.min(dirty.y0, y0), x1: Math.max(dirty.x1, x1), y1: Math.max(dirty.y1, y1) }
    : { x0, y0, x1, y1 };
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      if (dirty) {
        const d = dirty;
        dirty = null;
        renderView(d.x0, d.y0, d.x1, d.y1);
        nightSoon();
      }
    });
  }
  touchSave();
}
function applyView() {
  const tr = `translate(${panX}px,${panY}px) scale(${zoom / viewP})`;
  for (const cv of [mapCanvas, reliefCanvas, structCanvas, nightCanvas, glowCanvas, labelCanvas])
    cv.style.transform = tr;
  for (const [, c] of LV) {
    c.t.style.transform = c.s.style.transform = tr;
  }
  $('stZoom').textContent = `Zoom ${Math.round((zoom / map.px) * 100)}%`;
  drawOverlay();
}
function fit() {
  const w = view.clientWidth,
    h = view.clientHeight;
  zoom = Math.min(w / map.exW, h / map.exH) * 0.92;
  panX = (w - map.exW * zoom) / 2;
  panY = (h - map.exH * zoom) / 2;
  applyView();
}
function resizeOverlay() {
  const dpr = devicePixelRatio || 1;
  overlay.width = view.clientWidth * dpr;
  overlay.height = view.clientHeight * dpr;
  overlay.style.width = view.clientWidth + 'px';
  overlay.style.height = view.clientHeight + 'px';
  octx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawOverlay();
}
const toCell = (sx, sy) => [(sx - panX) / zoom, (sy - panY) / zoom];
const toScr = (cx, cy) => [panX + cx * zoom, panY + cy * zoom];

let hover = null,
  rectDrag = null,
  ruler = null;
