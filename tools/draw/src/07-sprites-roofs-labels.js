const spriteCache = new Map();
const LEAFY = { oak: 1, bigtree: 1, bush: 1, woods: 1, sakura: 1, maple: 1 },
  JP_TREES = { sakura: 1, maple: 1 },
  PINEY = { pine: 1, pinewood: 1, jpine: 1, bamboo: 1 },
  GRASSY = { tuftg: 1, reeds: 1, hills: 1, flowers: 1, swamp: 1 };
const AUTUMN = ['#c0641e', '#d8902a', '#b13a1e', '#a8882a', '#cf9e2e'];
function seasonFor(t, v, tint) {
  const st = STAMPS[t],
    r = mulberry((v * 7 + 3) | 0)(),
    out = {};
  if (st.cat === 'jungle' || st.cat === 'cave' || st.cat === 'steam' || st.cat === 'hidden') return out; // tropical and underground: no seasons
  if (SEASON === 'spring') {
    if (LEAFY[t] && !JP_TREES[t]) {
      if (!tint) out.tint = '#5d9c3c';
      if (r < 0.4 && t !== 'woods') out.mode = 'blossom';
    }
  } else if (SEASON === 'autumn') {
    if (LEAFY[t] && !tint && r > 0.15) out.tint = AUTUMN[(v >>> 0) % AUTUMN.length];
    if (GRASSY[t] && !tint) out.tint = '#9a8a4a';
  } else if (SEASON === 'winter') {
    if (LEAFY[t]) {
      if (t === 'woods') {
        out.tint = '#6b5d50';
        out.mode = 'snow';
      } else out.mode = 'bare';
    } else if (GRASSY[t]) {
      out.tint = '#bdb6a6';
      out.mode = 'snow';
    } else if (PINEY[t] || st.out || ['nature', 'ruins', 'camp', 'world'].includes(st.cat)) out.mode = 'snow';
  }
  return out;
}
function getSprite(t, v, R, tint) {
  R = Math.max(4, Math.round(R));
  const key = t + ':' + v + ':' + R + ':' + (tint || '') + ':' + SEASON;
  let s = spriteCache.get(key);
  if (s) return s;
  const sv = seasonFor(t, v, tint);
  tint = sv.tint || tint;
  if (spriteCache.size > 1500) spriteCache.clear();
  const st = STAMPS[t],
    size = Math.ceil(Math.max(st.w, st.h) * R * 1.3) + 8;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.translate(size / 2, size / 2);
  if (st.cat === 'world') x.scale(1.3, 1.3);
  const tk = tint && st.tint,
    saved = tk && RAMP[tk];
  if (tk) RAMP[tk] = rampFromHex(tint).map(hexRgb);
  const rs = mulberry((v * 2654435761 + t.length * 97 + t.charCodeAt(0)) | 0);
  try {
    if (sv.mode === 'bare' && st.drawBare) st.drawBare(x, R, rs);
    else if (sv.mode === 'bare') STAMPS.dead.draw(x, (R * Math.max(st.w, st.h)) / 1.8, rs);
    else if (t === 'flowers' && SEASON === 'winter') STAMPS.tuftg.draw(x, R, rs);
    else st.draw(x, R, rs);
  } finally {
    if (tk) RAMP[tk] = saved;
  }
  if (sv.mode) {
    const rr = mulberry((v * 31 + 7) | 0),
      half = size / 2 / (st.cat === 'world' ? 1.3 : 1);
    x.save();
    x.globalCompositeOperation = 'source-atop';
    if (sv.mode === 'blossom') {
      const cols = ['#f6c9d6', '#fbe3ea', '#ffffff', '#f2a7bf'];
      for (let i = 0; i < 55 * Math.max(st.w, st.h); i++) {
        x.fillStyle = cols[(rr() * 4) | 0];
        x.beginPath();
        x.arc((rr() - 0.5) * 2 * half, (rr() - 0.5) * 2 * half, Math.max(0.7, R * (0.025 + rr() * 0.03)), 0, 7);
        x.fill();
      }
    } else {
      x.fillStyle = 'rgba(236,242,248,.22)';
      x.fillRect(-half, -half, 2 * half, 2 * half);
      x.fillStyle = 'rgba(246,249,252,.9)';
      for (let i = 0; i < 70 * Math.max(st.w, st.h); i++) {
        const px = (rr() - 0.5) * 2 * half,
          py = (rr() - 0.5) * 2 * half;
        if (px + py > half * 0.5 && rr() < 0.75) continue;
        x.beginPath();
        x.arc(px, py, Math.max(0.7, R * (0.02 + rr() * 0.045)), 0, 7);
        x.fill();
      }
    }
    x.restore();
  }
  const sh = document.createElement('canvas');
  sh.width = sh.height = size;
  const y = sh.getContext('2d');
  y.filter = `brightness(0) blur(${Math.max(0.5, R * 0.05).toFixed(1)}px)`;
  y.drawImage(c, 0, 0);
  s = { c, sh, size };
  spriteCache.set(key, s);
  return s;
}
const CANOPY = {
  oak: 1,
  bigtree: 1,
  pine: 1,
  sakura: 1,
  maple: 1,
  jpine: 1,
  bamboo: 1,
  palm: 1,
  jtree: 1,
  mangrove: 1,
  giantshroom: 1
};
function drawObjects(ctx, m, P) {
  const objs = m.struct.objects;
  if (!objs || !objs.length) return;
  const order = objs.map((o, i) => i).sort((a, b) => STAMPS[objs[a].t].z - STAMPS[objs[b].t].z || a - b);
  for (const pass of [0, 1])
    for (const i of order) {
      const o = objs[i],
        st = STAMPS[o.t];
      if (!st) continue;
      const t2 = !SHOW_TOP && st.openAs ? st.openAs : o.t,
        sp = getSprite(t2, o.v, P * o.s, o.c);
      if (SHOW_TOP && st.ownShadow && pass === 0) {
        drawOwnShadow(ctx, o, st, P);
        continue;
      }
      if (!SHOW_TOP && CANOPY[o.t]) {
        ctx.save();
        ctx.translate(o.x * P, o.y * P);
        ctx.rotate(o.r || 0);
        if (pass === 1 && st.baseY) ctx.translate(0, st.baseY * P * o.s);
        if (pass === 0) {
          ctx.globalAlpha = 0.38;
          ctx.drawImage(sp.sh, -sp.size / 2, -sp.size / 2);
        } else {
          const r = P * o.s * (o.t === 'pine' ? 0.07 : 0.1);
          ctx.fillStyle = 'rgba(0,0,0,.45)';
          ctx.beginPath();
          ctx.arc(r * 0.3, r * 0.4, r * 1.1, 0, 7);
          ctx.fill();
          const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
          g.addColorStop(0, '#7a5a3c');
          g.addColorStop(1, '#3a2618');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, 7);
          ctx.fill();
        }
        ctx.restore();
        continue;
      }
      ctx.save();
      if (pass === 0 && st.hg > 1.6) {
        const k = Math.min(8, st.hg) * P * o.s,
          n = st.hg > 3 ? 6 : 3,
          A = SUN.a * 0.85,
          a1 = 1 - Math.pow(1 - A, 1 / n); // tall: shadow stretches from the base
        ctx.translate(o.x * P, o.y * P);
        ctx.globalAlpha = a1;
        for (let q = 1; q <= n; q++) {
          ctx.save();
          ctx.translate((k * SUN.dx * q) / n, (k * SUN.dy * q) / n);
          ctx.rotate(o.r || 0);
          if (o.f) ctx.scale(-1, 1);
          ctx.drawImage(sp.sh, -sp.size / 2, -sp.size / 2);
          ctx.restore();
        }
        ctx.restore();
        continue;
      }
      if (pass === 0) {
        const k = st.hg * P * o.s;
        ctx.globalAlpha = SUN.a * 0.85;
        ctx.translate(o.x * P + k * SUN.dx, o.y * P + k * SUN.dy);
      } else ctx.translate(o.x * P, o.y * P);
      ctx.rotate(o.r || 0);
      if (o.f) ctx.scale(-1, 1);
      ctx.drawImage(pass === 0 ? sp.sh : sp.c, -sp.size / 2, -sp.size / 2);
      ctx.restore();
    }
}

const ROOFMATS = {
  tiles: ['#4a1d12', '#6e2a18', '#923a20', '#b0502c', '#c76a40', '#d98a5c'],
  slate: ['#1c2026', '#2a3038', '#3a424c', '#4d5661', '#636d79', '#7d8793'],
  thatch: ['#4a3a1c', '#6a5426', '#8c7032', '#a98a42', '#c2a458', '#d6bc74'],
  shingles: ['#2a1c12', '#3e2a1b', '#553a25', '#6c4b31', '#83603f', '#9a7650'],
  kawara: ['#1b1f24', '#282e35', '#373f48', '#4a535e', '#606a76', '#7b8592'],
  hiwada: ['#2e1a10', '#45281a', '#5d3826', '#764a33', '#8f5e42', '#a87656'],
  copper: ['#1f4a42', '#2b6157', '#3a786c', '#4d8f81', '#66a596', '#86bcae'],
  ironsheet: ['#15181c', '#252a30', '#363c44', '#4a525c', '#616a75', '#7c8590'],
  palm: ['#3a3a1a', '#555224', '#6f6a2e', '#8a833c', '#a59c50', '#bdb468']
};
const THATCHY = { thatch: 1, palm: 1 };
const JP_ROOF = { kawara: 1, hiwada: 1, copper: 1 };
// outline with the eaves sweeping up at the corners (sides bow in, corners reach out)
function flaredPath(ctx, x, y, w, h, P) {
  const f = P * 0.22,
    b = P * 0.14;
  ctx.beginPath();
  ctx.moveTo(x - f, y - f);
  ctx.quadraticCurveTo(x + w / 2, y + b, x + w + f, y - f);
  ctx.quadraticCurveTo(x + w - b, y + h / 2, x + w + f, y + h + f);
  ctx.quadraticCurveTo(x + w / 2, y + h - b, x - f, y + h + f);
  ctx.quadraticCurveTo(x + b, y + h / 2, x - f, y - f);
  ctx.closePath();
}
function drawRoof(ctx, r, P) {
  const ramp = (r.c ? rampFromHex(r.c) : ROOFMATS[r.mat] || ROOFMATS.tiles).map(hexRgb),
    col = (t, a = 1) => rgba(ramp, t, a);
  const ov = P * 0.12,
    x = r.x0 * P - ov,
    y = r.y0 * P - ov,
    w = (r.x1 - r.x0) * P + 2 * ov,
    h = (r.y1 - r.y0) * P + 2 * ov,
    horiz = w >= h;
  ctx.save();
  const jp = JP_ROOF[r.mat];
  ctx.filter = `blur(${(P * 0.05).toFixed(1)}px)`;
  ctx.fillStyle = `rgba(0,0,0,${SUN.a * 0.7})`;
  if (jp) {
    ctx.save();
    ctx.translate(SUN.dx * P * 1.6, SUN.dy * P * 1.6);
    flaredPath(ctx, x, y, w, h, P);
    ctx.fill();
    ctx.restore();
  } else ctx.fillRect(x + SUN.dx * P * 1.6, y + SUN.dy * P * 1.6, w, h);
  ctx.filter = 'none';
  if (jp) {
    ctx.save();
    flaredPath(ctx, x, y, w, h, P);
    ctx.clip();
  }
  const hh = Math.min(w, h) / 2,
    A = horiz ? [x + hh, y + h / 2] : [x + w / 2, y + hh],
    B = horiz ? [x + w - hh, y + h / 2] : [x + w / 2, y + h - hh];
  const F = jp ? P * 0.22 : 0,
    X0 = x - F,
    Y0 = y - F,
    X1 = x + w + F,
    Y1 = y + h + F;
  const faces = jp
    ? horiz
      ? [
          [[[X0, Y0], [X1, Y0], B, A], 0.82, 'h'],
          [[[X0, Y1], [X1, Y1], B, A], 0.3, 'h'],
          [[[X0, Y0], A, [X0, Y1]], 0.62, 'v'],
          [[[X1, Y0], B, [X1, Y1]], 0.22, 'v']
        ]
      : [
          [[[X0, Y0], [X0, Y1], B, A], 0.82, 'v'],
          [[[X1, Y0], [X1, Y1], B, A], 0.3, 'v'],
          [[[X0, Y0], A, [X1, Y0]], 0.62, 'h'],
          [[[X0, Y1], B, [X1, Y1]], 0.22, 'h']
        ]
    : horiz
      ? [
          [[[x, y], [x + w, y], B, A], 0.82, 'h'],
          [[[x, y + h], [x + w, y + h], B, A], 0.3, 'h'],
          [[[x, y], A, [x, y + h]], 0.62, 'v'],
          [[[x + w, y], B, [x + w, y + h]], 0.22, 'v']
        ]
      : [
          [[[x, y], [x, y + h], B, A], 0.82, 'v'],
          [[[x + w, y], [x + w, y + h], B, A], 0.3, 'v'],
          [[[x, y], A, [x + w, y]], 0.62, 'h'],
          [[[x, y + h], B, [x + w, y + h]], 0.22, 'h']
        ];
  const rnd = mulberry((r.x0 * 73 + r.y0 * 151) | 0),
    path = pts => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
    };
  for (const [pts, t, dir] of faces) {
    ctx.save();
    path(pts);
    ctx.clip();
    {
      const ex = pts[0],
        fx = pts[1],
        mx = (ex[0] + fx[0]) / 2,
        my = (ex[1] + fx[1]) / 2,
        rx = (A[0] + B[0]) / 2,
        ry = (A[1] + B[1]) / 2,
        gr = ctx.createLinearGradient(rx, ry, mx, my);
      gr.addColorStop(0, col(Math.min(1, t + 0.1)));
      gr.addColorStop(1, col(Math.max(0, t - 0.1)));
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w, h);
    }
    const step = P * (THATCHY[r.mat] ? 0.08 : 0.17);
    if (r.mat === 'kawara' || r.mat === 'copper' || r.mat === 'ironsheet') {
      // round tiles / standing seams / corrugations running from ridge to eave
      const sp = P * (r.mat === 'kawara' ? 0.13 : r.mat === 'ironsheet' ? 0.09 : 0.3),
        lw = Math.max(0.8, P / (r.mat === 'kawara' ? 40 : 60));
      for (let q = dir === 'h' ? X0 : Y0; q < (dir === 'h' ? X1 : Y1); q += sp) {
        ctx.strokeStyle = 'rgba(0,0,0,.26)';
        ctx.lineWidth = lw;
        ctx.beginPath();
        dir === 'h' ? (ctx.moveTo(q, Y0), ctx.lineTo(q, Y1)) : (ctx.moveTo(X0, q), ctx.lineTo(X1, q));
        ctx.stroke();
        ctx.strokeStyle = col(Math.min(1, t + 0.25), r.mat === 'kawara' ? 0.55 : 0.4);
        ctx.lineWidth = lw * (r.mat === 'kawara' ? 1.6 : 0.8);
        ctx.beginPath();
        const o = sp * 0.45;
        dir === 'h' ? (ctx.moveTo(q + o, Y0), ctx.lineTo(q + o, Y1)) : (ctx.moveTo(X0, q + o), ctx.lineTo(X1, q + o));
        ctx.stroke();
      }
    } else if (r.mat === 'hiwada') {
      ctx.strokeStyle = 'rgba(0,0,0,.18)';
      ctx.lineWidth = Math.max(0.6, P / 80);
      ctx.beginPath();
      for (let q = dir === 'h' ? Y0 : X0; q < (dir === 'h' ? Y1 : X1); q += P * 0.05)
        dir === 'h' ? (ctx.moveTo(X0, q), ctx.lineTo(X1, q)) : (ctx.moveTo(q, Y0), ctx.lineTo(q, Y1));
      ctx.stroke();
    } else if (THATCHY[r.mat]) {
      ctx.lineCap = 'round';
      for (let i = 0; i < ((w * h) / (P * P)) * 70; i++) {
        const px = x + rnd() * w,
          py = y + rnd() * h,
          l = P * (0.08 + rnd() * 0.08);
        ctx.strokeStyle = col(clamp(t + (rnd() - 0.5) * 0.35, 0, 1), 0.7);
        ctx.lineWidth = Math.max(0.6, P / 55);
        ctx.beginPath();
        ctx.moveTo(px, py);
        dir === 'h'
          ? ctx.lineTo(px + (rnd() - 0.5) * P * 0.03, py + l)
          : ctx.lineTo(px + l, py + (rnd() - 0.5) * P * 0.03);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(0,0,0,.28)';
      ctx.lineWidth = Math.max(0.8, P / 55);
      ctx.beginPath();
      let k = 0;
      if (dir === 'h')
        for (let yy = y + step; yy < y + h; yy += step, k++) {
          ctx.moveTo(x, yy);
          ctx.lineTo(x + w, yy);
          for (let xx = x + (k % 2 ? step * 0.6 : 0); xx < x + w; xx += step * 1.2) {
            ctx.moveTo(xx, yy - step);
            ctx.lineTo(xx, yy);
          }
        }
      else
        for (let xx = x + step; xx < x + w; xx += step, k++) {
          ctx.moveTo(xx, y);
          ctx.lineTo(xx, y + h);
          for (let yy = y + (k % 2 ? step * 0.6 : 0); yy < y + h; yy += step * 1.2) {
            ctx.moveTo(xx - step, yy);
            ctx.lineTo(xx, yy);
          }
        }
      ctx.stroke();
    }
    if (SEASON === 'winter') {
      ctx.fillStyle = `rgba(236,242,248,${0.55 + t * 0.3})`;
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }
  ctx.strokeStyle = col(0.05, 0.9);
  ctx.lineWidth = Math.max(1.5, P / (jp ? 12 : 18));
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(A[0], A[1]);
  ctx.lineTo(B[0], B[1]);
  for (const [cx, cy] of jp
    ? [
        [X0, Y0],
        [X1, Y0],
        [X0, Y1],
        [X1, Y1]
      ]
    : [
        [x, y],
        [x + w, y],
        [x, y + h],
        [x + w, y + h]
      ]) {
    const e = (horiz ? cx < A[0] + 1 : cy < A[1] + 1) ? A : B;
    ctx.moveTo(cx, cy);
    ctx.lineTo(e[0], e[1]);
  }
  ctx.stroke();
  ctx.strokeStyle = SEASON === 'winter' ? 'rgba(255,255,255,.7)' : col(0.95, 0.5);
  ctx.lineWidth = Math.max(0.8, P / 45);
  ctx.beginPath();
  ctx.moveTo(A[0] - 1, A[1] - 1);
  ctx.lineTo(B[0] - 1, B[1] - 1);
  ctx.stroke();
  if (jp) {
    // ridge-end ornaments (onigawara), then the flared eave line
    for (const E of [A, B]) {
      ctx.fillStyle = col(0.08);
      ctx.beginPath();
      ctx.arc(E[0], E[1], P * 0.09, 0, 7);
      ctx.fill();
      ctx.fillStyle = col(0.7, 0.6);
      ctx.beginPath();
      ctx.arc(E[0] - P * 0.02, E[1] - P * 0.02, P * 0.035, 0, 7);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(10,6,4,.9)';
    ctx.lineWidth = Math.max(1.5, P / 26);
    flaredPath(ctx, x, y, w, h, P);
    ctx.stroke();
    ctx.strokeStyle = col(0.9, 0.35);
    ctx.lineWidth = Math.max(0.8, P / 50);
    ctx.save();
    ctx.translate(-1, -1);
    flaredPath(ctx, x + P * 0.04, y + P * 0.04, w - P * 0.08, h - P * 0.08, P);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
    return;
  }
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = Math.max(1, P / 25);
  ctx.strokeRect(x + P * 0.03, y + P * 0.03, w - P * 0.06, h - P * 0.06);
  ctx.strokeStyle = 'rgba(10,6,4,.9)';
  ctx.lineWidth = Math.max(1.5, P / 30);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
const isBadge = t => /^\d{1,3}[a-z]?$/i.test(t);
function drawLabels(ctx, labels, P) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  for (const l of labels) {
    const x = l.x * P,
      y = l.y * P,
      fs = l.size * P;
    if (isBadge(l.text)) {
      const r = fs * 0.72;
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.beginPath();
      ctx.arc(x + fs * 0.06, y + fs * 0.09, r, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#f2ead6';
      ctx.strokeStyle = '#2a1d12';
      ctx.lineWidth = Math.max(1.5, fs * 0.1);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2a1d12';
      ctx.font = `700 ${Math.round(fs * (l.text.length > 2 ? 0.62 : 0.8))}px Georgia,"Times New Roman",serif`;
      ctx.fillText(l.text, x, y + fs * 0.04);
    } else {
      ctx.font = `600 ${Math.round(fs)}px Georgia,"Times New Roman",serif`;
      ctx.strokeStyle = 'rgba(12,9,6,.9)';
      ctx.lineWidth = Math.max(2, fs * 0.2);
      ctx.strokeText(l.text, x, y);
      ctx.fillStyle = '#f2ead6';
      ctx.fillText(l.text, x, y);
    }
  }
  ctx.restore();
}
