/* ---------- structure: walls, doors, stairs (vector, cell coordinates) ---------- */
const WALLMATS = {
  stone: { key: 'cobble', ramp: ['#3b3934', '#514d46', '#69645c', '#827c72', '#9b948a', '#b5ada1'] },
  wood: { key: 'wood', ramp: ['#24160b', '#352112', '#4a2f19', '#5f3d21', '#764d2a', '#8e5f35'] },
  cave: { key: 'rock', tile: 8, ramp: ['#16171a', '#212226', '#2d2f33', '#3a3c41', '#494b51', '#5b5d63'] },
  hull: { key: 'wood', ramp: ['#120b06', '#1e130a', '#2c1c0f', '#3b2615', '#4c321c', '#5e3f24'] },
  brasswall: { key: 'plate', ramp: ['#1c1206', '#3e2a0e', '#6a4a18', '#9a7228', '#c49a40', '#ead07a'] },
  ironwall: { key: 'plate', ramp: ['#0e1013', '#22262c', '#363c44', '#4c535d', '#646c77', '#848c97'] },
  balustrade: { key: 'stone', ramp: ['#6d665b', '#857d71', '#9d958a', '#b4ada2', '#cac3b8', '#ded8ce'] },
  rampart: { key: 'flag', ramp: ['#3a3731', '#4d4943', '#625d55', '#78726a', '#8f887e', '#a79f94'] },
  bamboo: { key: 'wood', ramp: ['#3a3a14', '#55541c', '#706c26', '#8a8432', '#a59c42', '#bdb258'] }
};
Object.values(WALLMATS).forEach(w => (w.rgb = w.ramp.map(hexRgb)));
function getWallTex(mat, P, seed) {
  const key = 'w:' + mat + ':' + P + ':' + seed;
  let c = texCache.get(key);
  if (!c) {
    c = genTex(WALLMATS[mat], P, seed, 200 + Object.keys(WALLMATS).indexOf(mat));
    texCache.set(key, c);
  }
  return c;
}
const DOOR_CUT = { door: 1, double: 1, portcullis: 1, opening: 1, shoji: 1 };

/* ---------- wall chains: connected segments become polylines (natural caves and fortress wall-walks) ---------- */
function wallChains(ws) {
  const K = (x, y) => Math.round(x * 100) + ',' + Math.round(y * 100),
    adj = new Map();
  ws.forEach((w, i) => {
    for (const k of [K(w.x1, w.y1), K(w.x2, w.y2)]) {
      if (!adj.has(k)) adj.set(k, []);
      adj.get(k).push(i);
    }
  });
  const used = new Uint8Array(ws.length),
    out = [];
  const next = pt => {
    for (const j of adj.get(K(pt[0], pt[1])) || [])
      if (!used[j]) {
        used[j] = 1;
        const w = ws[j];
        return K(w.x1, w.y1) === K(pt[0], pt[1]) ? [w.x2, w.y2] : [w.x1, w.y1];
      }
    return null;
  };
  for (let i = 0; i < ws.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const w = ws[i],
      pts = [
        [w.x1, w.y1],
        [w.x2, w.y2]
      ];
    for (let p; (p = next(pts[pts.length - 1]));) pts.push(p);
    for (let p; (p = next(pts[0]));) pts.unshift(p);
    const closed = pts.length > 3 && K(...pts[0]) === K(...pts[pts.length - 1]);
    if (closed) pts.pop();
    out.push({ pts, closed });
  }
  return out;
}
function roundCorners(pts, closed, rc) {
  // replace each corner with a short curve
  const n = pts.length,
    out = [];
  if (n < 3) return pts.slice();
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    if (!closed && (i === 0 || i === n - 1)) {
      out.push(p);
      continue;
    }
    const a = pts[(i - 1 + n) % n],
      b = pts[(i + 1) % n],
      la = Math.hypot(p[0] - a[0], p[1] - a[1]),
      lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(rc, la / 2),
      rb = Math.min(rc, lb / 2),
      s = [p[0] + ((a[0] - p[0]) * ra) / la, p[1] + ((a[1] - p[1]) * ra) / la],
      e = [p[0] + ((b[0] - p[0]) * rb) / lb, p[1] + ((b[1] - p[1]) * rb) / lb];
    for (let k = 0; k <= 4; k++) {
      const t = k / 4,
        u = 1 - t;
      out.push([u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]]);
    }
  }
  return out;
}
function resample(pts, closed, step) {
  const out = [],
    P2 = closed ? [...pts, pts[0]] : pts;
  for (let i = 0; i < P2.length - 1; i++) {
    const a = P2[i],
      b = P2[i + 1],
      L = Math.hypot(b[0] - a[0], b[1] - a[1]),
      n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  if (!closed) out.push(P2[P2.length - 1]);
  return out;
}
function cavePaths(ctx, ws, P, seed) {
  // rounded corners, then a big irregular wobble, drawn twice so the thickness varies
  for (const ch of wallChains(ws)) {
    const base = resample(roundCorners(ch.pts, ch.closed, 0.7), ch.closed, 0.15),
      n = base.length;
    let along = 0;
    const tot = base.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - base[i - 1][0], p[1] - base[i - 1][1]) : 0), 0);
    for (const [so, side] of [
      [0, 0],
      [57, 0.12],
      [113, -0.1]
    ]) {
      along = 0;
      for (let i = 0; i < n; i++) {
        const p = base[i],
          a = base[Math.max(0, i - 1)],
          b = base[Math.min(n - 1, i + 1)],
          a2 = ch.closed ? base[(i - 1 + n) % n] : a,
          b2 = ch.closed ? base[(i + 1) % n] : b;
        if (i) along += Math.hypot(p[0] - base[i - 1][0], p[1] - base[i - 1][1]);
        const dx = b2[0] - a2[0],
          dy = b2[1] - a2[1],
          l = Math.hypot(dx, dy) || 1,
          nx = -dy / l,
          ny = dx / l;
        const taper = ch.closed ? 1 : clamp(Math.min(along, tot - along) / 0.6, 0, 1);
        const d =
          ((vnoise(p[0] * 1.2 + 11 + so, p[1] * 1.2 + 7, 1 << 20, seed) - 0.5) * 0.6 +
            (vnoise(p[0] * 3.4 + 3 + so, p[1] * 3.4 + 5, 1 << 20, seed + 1) - 0.5) * 0.25 +
            side) *
          taper;
        const x = (p[0] + nx * d) * P,
          y = (p[1] + ny * d) * P;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      if (ch.closed) ctx.closePath();
    }
  }
}
function offsetPoly(pts, closed, d) {
  const n = pts.length,
    out = [];
  for (let i = 0; i < n; i++) {
    const nrm = (a, b) => {
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l];
    };
    const hasA = closed || i > 0,
      hasB = closed || i < n - 1,
      n1 = hasA ? nrm(pts[(i - 1 + n) % n], pts[i]) : null,
      n2 = hasB ? nrm(pts[i], pts[(i + 1) % n]) : null;
    if (n1 && n2) {
      const k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
      out.push([
        pts[i][0] + (d * (n1[0] + n2[0])) / Math.max(0.2, k),
        pts[i][1] + (d * (n1[1] + n2[1])) / Math.max(0.2, k)
      ]);
    } else {
      const q = n1 || n2;
      out.push([pts[i][0] + d * q[0], pts[i][1] + d * q[1]]);
    }
  }
  return out;
}
function chainPath(ctx, pts, closed, P) {
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * P, p[1] * P) : ctx.moveTo(p[0] * P, p[1] * P)));
  if (closed) ctx.closePath();
}
function inPoly(x, y, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i],
      [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function drawRampartTop(ctx, g, P, seed) {
  // parapets on both edges of the wall-walk; battlements on the outer one
  const th = g.th,
    p = Math.min(0.24, th * 0.22);
  for (const ch of wallChains(g.ws)) {
    const pts = ch.pts;
    let outer = 1;
    if (ch.closed) {
      const a = pts[0],
        b = pts[1],
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        l = Math.hypot(dx, dy) || 1;
      if (!inPoly((a[0] + b[0]) / 2 - (dy / l) * 0.05, (a[1] + b[1]) / 2 + (dx / l) * 0.05, pts)) outer = 1;
      else outer = -1;
    }
    const stone = ctx.createPattern(getWallTex('stone', P, seed), 'repeat');
    for (const sg of [outer, -outer]) {
      const line = offsetPoly(pts, ch.closed, sg * (th / 2 - p / 2)),
        isOuter = sg === outer;
      ctx.lineJoin = 'miter';
      ctx.lineCap = ch.closed ? 'butt' : 'square';
      ctx.beginPath();
      chainPath(ctx, line, ch.closed, P);
      ctx.strokeStyle = '#0b0a09';
      ctx.lineWidth = p * P + Math.max(2, P * 0.05);
      ctx.stroke();
      ctx.strokeStyle = stone;
      ctx.lineWidth = p * P;
      ctx.stroke();
      if (isOuter) {
        ctx.strokeStyle = 'rgba(0,0,0,.45)';
        ctx.lineWidth = p * P;
        ctx.stroke(); // crenels sit lower and darker
        ctx.setLineDash([P * 0.3, P * 0.2]);
        ctx.strokeStyle = 'rgba(0,0,0,.7)';
        ctx.lineWidth = p * P * 1.35 + 2;
        ctx.stroke();
        ctx.strokeStyle = stone;
        ctx.lineWidth = p * P * 1.35;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,244,226,.3)';
        ctx.lineWidth = p * P * 0.5;
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = 'rgba(255,240,220,.12)';
        ctx.lineWidth = p * P * 0.35;
        ctx.stroke();
      }
    }
    // walkway shading: a soft gutter along each parapet's foot
    for (const sg of [1, -1]) {
      ctx.beginPath();
      chainPath(ctx, offsetPoly(pts, ch.closed, sg * (th / 2 - p - 0.04)), ch.closed, P);
      ctx.strokeStyle = 'rgba(0,0,0,.18)';
      ctx.lineWidth = P * 0.08;
      ctx.stroke();
    }
  }
}
function wallPath(ctx, w, P, seed) {
  if (w.mat !== 'cave') {
    ctx.moveTo(w.x1 * P, w.y1 * P);
    ctx.lineTo(w.x2 * P, w.y2 * P);
    return;
  }
  const dx = w.x2 - w.x1,
    dy = w.y2 - w.y1,
    len = Math.hypot(dx, dy) || 1,
    n = Math.max(2, Math.ceil(len * 5)),
    nx = -dy / len,
    ny = dx / len;
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      x = w.x1 + dx * t,
      y = w.y1 + dy * t,
      e = i === 0 || i === n ? 0 : 1;
    const d =
      ((vnoise(x * 2.3 + 11, y * 2.3 + 7, 1 << 20, seed) - 0.5) * 0.4 +
        (hash(Math.round(x * 5), Math.round(y * 5), seed) - 0.5) * 0.07) *
      e;
    if (i) ctx.lineTo((x + nx * d) * P, (y + ny * d) * P);
    else ctx.moveTo(x * P, y * P);
  }
}
const doorCenter = d => (d.o === 'h' ? [d.x + 0.5, d.y, 0] : [d.x, d.y + 0.5, Math.PI / 2]);

/* ---------- composite stairs: grand (imperial) and half-turn, built from flights, landings, rails and walls ---------- */
const DIRV = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const STAIR_OPTS = {
  grand: ['grandW', 'sideW', 'sideTurn', 'sideRun', 'curveR'],
  half: ['stairW', 'halfTurn', 'turnSide', 'halfWell', 'landD']
};
const flightRise = len => Math.max(5, Math.round((len * 5 * 0.6) / 5) * 5);
function stairParts(s) {
  // everything in squares; steps carry their height (in 5 ft levels) for shading and shadows
  const o = s.opt || {},
    d = DIRV[s.dir] || DIRV.n,
    nr = [-d[1], d[0]],
    F = [s.fx, s.fy],
    L = s.len;
  const W = (u, v) => [F[0] + d[0] * u + nr[0] * v, F[1] + d[1] * u + nr[1] * v];
  const out = { steps: [], landings: [], outlines: [], arrows: [], rails: [], walls: [], posts: [] },
    h0 = s.h0,
    h1 = s.h1,
    hm = (h0 + h1) / 2;
  const straight = (P0, dv, len, w, hA, hB, rails) => {
    const n2 = [-dv[1], dv[0]],
      Q = (u, v) => [P0[0] + dv[0] * u + n2[0] * v, P0[1] + dv[1] * u + n2[1] * v],
      n = Math.max(2, Math.round(len * 3));
    for (let i = 0; i < n; i++) {
      const u0 = (len * i) / n,
        u1 = (len * (i + 1)) / n;
      out.steps.push({
        poly: [Q(u0, -w / 2), Q(u1, -w / 2), Q(u1, w / 2), Q(u0, w / 2)],
        h: hA + ((hB - hA) * (i + 0.5)) / n,
        edge: [Q(u1, -w / 2), Q(u1, w / 2)]
      });
    }
    out.outlines.push([Q(0, -w / 2), Q(len, -w / 2), Q(len, w / 2), Q(0, w / 2)]);
    out.arrows.push([Q(len * 0.15, 0), Q(len * 0.85, 0)]);
    if (rails) {
      out.rails.push([Q(0, -w / 2), Q(len, -w / 2)], [Q(0, w / 2), Q(len, w / 2)]);
    }
  };
  const curved = (C, ri, ro, a0, a1, hA, hB, rails) => {
    const rm = (ri + ro) / 2,
      n = Math.max(4, Math.round(Math.abs(a1 - a0) * rm * 3)),
      pt = (a, r) => [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r];
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n,
        b = a0 + ((a1 - a0) * (i + 1)) / n,
        m = (a + b) / 2;
      out.steps.push({
        poly: [pt(a, ro), pt(m, ro), pt(b, ro), pt(b, ri), pt(m, ri), pt(a, ri)],
        h: hA + ((hB - hA) * (i + 0.5)) / n,
        edge: [pt(b, ri), pt(b, ro)]
      });
    }
    const k = Math.max(8, n * 2),
      arc = r => Array.from({ length: k + 1 }, (_, i) => pt(a0 + ((a1 - a0) * i) / k, r));
    out.outlines.push([...arc(ro), ...arc(ri).reverse()]);
    out.arrows.push(Array.from({ length: 9 }, (_, i) => pt(a0 + (a1 - a0) * (0.15 + (0.7 * i) / 8), rm)));
    if (rails) out.rails.push(arc(ro), arc(ri));
  };
  if (s.kind === 'grand') {
    const wc = o.grandW || 3,
      ws = o.sideW || 2,
      rc = o.curveR || 2,
      ri = Math.max(0.3, rc - ws / 2),
      ro = ri + ws,
      phi = ((o.sideTurn == null ? 90 : o.sideTurn) * Math.PI) / 180,
      run = o.sideRun || 0;
    straight(F, d, L, wc, h0, hm, true);
    const land = [W(L, -wc / 2), W(L + ws, -wc / 2), W(L + ws, wc / 2), W(L, wc / 2)];
    out.landings.push({ poly: land, h: hm });
    out.rails.push([W(L + ws, -wc / 2), W(L + ws, wc / 2)]);
    out.posts.push(W(0, -wc / 2), W(0, wc / 2));
    const ad = Math.atan2(d[1], d[0]);
    for (const sg of [1, -1]) {
      const curveLen = (phi * (ri + ro)) / 2,
        runLen = phi < 0.01 ? Math.max(run, 2) : run,
        tot = curveLen + runLen,
        hc = hm + (h1 - hm) * (tot ? curveLen / tot : 1);
      if (phi < 0.01) {
        const dv = [nr[0] * sg, nr[1] * sg];
        straight(W(L + ws / 2, (sg * wc) / 2), dv, runLen, ws, hm, h1, true);
        const e = W(L + ws / 2, sg * (wc / 2 + runLen));
        out.posts.push(
          [e[0] + (d[0] * ws) / 2, e[1] + (d[1] * ws) / 2],
          [e[0] - (d[0] * ws) / 2, e[1] - (d[1] * ws) / 2]
        );
        continue;
      }
      const C = W(L - ri, (sg * wc) / 2),
        a0 = ad,
        a1 = ad + sg * phi;
      curved(C, ri, ro, a0, a1, hm, hc, true);
      const ea = [Math.cos(a1), Math.sin(a1)],
        tv = sg > 0 ? [-ea[1], ea[0]] : [ea[1], -ea[0]],
        rm = (ri + ro) / 2,
        ef = [C[0] + ea[0] * rm, C[1] + ea[1] * rm];
      if (runLen > 0.01) {
        straight(ef, tv, runLen, ws, hc, h1, true);
      }
      const tip = [ef[0] + tv[0] * runLen, ef[1] + tv[1] * runLen];
      out.posts.push(
        [tip[0] + (ea[0] * ws) / 2, tip[1] + (ea[1] * ws) / 2],
        [tip[0] - (ea[0] * ws) / 2, tip[1] - (ea[1] * ws) / 2]
      );
    }
  } else {
    const w = o.stairW || 1,
      sd = o.turnSide === 'l' ? -1 : 1,
      well = o.halfWell || 0,
      D = Math.max(w, o.landD || w),
      turn = o.halfTurn || 180;
    straight(F, d, L, w, h0, hm, false);
    if (turn === 90) {
      out.landings.push({ poly: [W(L, -w / 2), W(L + w, -w / 2), W(L + w, w / 2), W(L, w / 2)], h: hm });
      straight(W(L + w / 2, (sd * w) / 2), [nr[0] * sd, nr[1] * sd], L, w, hm, h1, false);
    } else {
      const a = (-sd * w) / 2,
        b = sd * (w / 2 + w + well);
      out.landings.push({
        poly: [W(L, Math.min(a, b)), W(L + D, Math.min(a, b)), W(L + D, Math.max(a, b)), W(L, Math.max(a, b))],
        h: hm
      });
      straight(W(L, sd * (w + well)), [-d[0], -d[1]], L, w, hm, h1, false);
      if (!well) out.walls.push([...W(0, (sd * w) / 2), ...W(L, (sd * w) / 2)]);
    }
  }
  return out;
}
function compositeBBox(s) {
  const p = stairParts(s),
    pts = [...p.steps.flatMap(t => t.poly), ...p.landings.flatMap(t => t.poly)];
  s.x0 = Math.min(...pts.map(q => q[0]));
  s.y0 = Math.min(...pts.map(q => q[1]));
  s.x1 = Math.max(...pts.map(q => q[0]));
  s.y1 = Math.max(...pts.map(q => q[1]));
  return s;
}
function drawRail(ctx, pts, P, posts) {
  // a balustrade seen from above: a stone handrail with balusters showing either side
  if (pts.length < 2) return;
  const path = () => {
    ctx.beginPath();
    pts.forEach((q, i) => (i ? ctx.lineTo(q[0] * P, q[1] * P) : ctx.moveTo(q[0] * P, q[1] * P)));
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  path();
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.lineWidth = P * 0.2;
  ctx.setLineDash([P * 0.07, P * 0.2]);
  ctx.stroke();
  ctx.setLineDash([]);
  path();
  ctx.strokeStyle = 'rgba(12,10,8,.85)';
  ctx.lineWidth = Math.max(2.5, P * 0.13);
  ctx.stroke();
  path();
  ctx.strokeStyle = '#cfc6b5';
  ctx.lineWidth = Math.max(1.5, P * 0.09);
  ctx.stroke();
  path();
  ctx.strokeStyle = 'rgba(255,255,250,.45)';
  ctx.lineWidth = Math.max(0.6, P * 0.025);
  ctx.stroke();
  for (const q of posts || []) {
    disc(ctx, q[0] * P, q[1] * P, P * 0.11, 'rgba(12,10,8,.9)');
    disc(ctx, q[0] * P, q[1] * P, P * 0.085, '#d8d0c0');
  }
  ctx.restore();
}
function drawCompositeStairs(ctx, s, P) {
  const p = stairParts(s),
    all = [...p.steps, ...p.landings],
    hs = all.map(t => t.h),
    lo = Math.min(...hs),
    hi = Math.max(...hs),
    rnd = mulberry(((s.fx * 97 + s.fy * 13) | 0) + 3);
  const poly = (c, q, ox = 0, oy = 0) => {
    c.beginPath();
    q.forEach((v, i) => (i ? c.lineTo(v[0] * P + ox, v[1] * P + oy) : c.moveTo(v[0] * P + ox, v[1] * P + oy)));
    c.closePath();
  };
  const sc = document.createElement('canvas');
  sc.width = ctx.canvas.width;
  sc.height = ctx.canvas.height;
  const sx = sc.getContext('2d');
  sx.setTransform(ctx.getTransform());
  sx.fillStyle = '#000';
  for (const t of all) {
    const h = Math.max(0.25, t.h);
    for (const f of [0.34, 0.67, 1]) {
      poly(sx, t.poly, SUN.dx * h * P * f, SUN.dy * h * P * f);
      sx.fill();
    }
  }
  for (const w of p.walls) {
    sx.save();
    sx.translate(SUN.dx * 2 * P, SUN.dy * 2 * P);
    sx.strokeStyle = '#000';
    sx.lineWidth = P * 0.2;
    sx.beginPath();
    sx.moveTo(w[0] * P, w[1] * P);
    sx.lineTo(w[2] * P, w[3] * P);
    sx.stroke();
    sx.restore();
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = SUN.a * 0.85;
  ctx.filter = `blur(${(P * 0.1).toFixed(1)}px)`;
  ctx.drawImage(sc, 0, 0);
  ctx.restore();
  const top = [176, 168, 154],
    bot = [48, 45, 40],
    col = (h, j) => {
      const t = hi > lo ? (h - lo) / (hi - lo) : 1;
      return `rgb(${bot.map((v, q) => Math.round(v + (top[q] - v) * t + j))})`;
    },
    lw = Math.max(1, P / 32);
  for (const t of p.steps) {
    ctx.fillStyle = col(t.h, (rnd() - 0.5) * 14);
    poly(ctx, t.poly);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,245,230,.2)';
    ctx.beginPath();
    ctx.moveTo(t.edge[0][0] * P, t.edge[0][1] * P);
    ctx.lineTo(t.edge[1][0] * P, t.edge[1][1] * P);
    ctx.stroke();
  }
  for (const t of p.landings) {
    ctx.fillStyle = col(t.h, 8);
    poly(ctx, t.poly);
    ctx.fill();
    ctx.save();
    poly(ctx, t.poly);
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,.12)';
    ctx.lineWidth = lw;
    const xs = t.poly.map(q => q[0]),
      ys = t.poly.map(q => q[1]);
    ctx.beginPath();
    for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x += 0.5) {
      ctx.moveTo(x * P, Math.min(...ys) * P);
      ctx.lineTo(x * P, Math.max(...ys) * P);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(10,8,6,.85)';
  ctx.lineWidth = Math.max(1.5, P / 18);
  ctx.lineJoin = 'round';
  for (const q of [...p.outlines, ...p.landings.map(t => t.poly)]) {
    poly(ctx, q);
    ctx.stroke();
  }
  for (const w of p.walls) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0b0a09';
    ctx.lineWidth = P * 0.2;
    ctx.beginPath();
    ctx.moveTo(w[0] * P, w[1] * P);
    ctx.lineTo(w[2] * P, w[3] * P);
    ctx.stroke();
    ctx.strokeStyle = '#8d867b';
    ctx.lineWidth = P * 0.13;
    ctx.stroke();
  }
  const up = s.h1 >= s.h0;
  for (const a of p.arrows) {
    const q = up ? a : a.slice().reverse(),
      e = q[q.length - 1],
      b = q[q.length - 2],
      ang = Math.atan2(e[1] - b[1], e[0] - b[0]),
      ah = P * 0.26;
    for (const [c, w] of [
      ['rgba(10,8,6,.75)', Math.max(3, P / 11)],
      ['rgba(250,240,215,.9)', Math.max(1.5, P / 26)]
    ]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      q.forEach((v, i) => (i ? ctx.lineTo(v[0] * P, v[1] * P) : ctx.moveTo(v[0] * P, v[1] * P)));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e[0] * P - Math.cos(ang - 0.5) * ah, e[1] * P - Math.sin(ang - 0.5) * ah);
      ctx.lineTo(e[0] * P, e[1] * P);
      ctx.lineTo(e[0] * P - Math.cos(ang + 0.5) * ah, e[1] * P - Math.sin(ang + 0.5) * ah);
      ctx.stroke();
    }
  }
  p.rails.forEach((r, i) => drawRail(ctx, r, P, i === p.rails.length - 1 ? p.posts : null));
}
function inPolyPts(x, y, q) {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const [xi, yi] = q[i],
      [xj, yj] = q[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
function drawArcStairs(ctx, s, P) {
  // curved / spiral stair: steps along an arc, rising from h0 to h1 (in 5 ft steps)
  const A = s.arc,
    cx = A.cx * P,
    cy = A.cy * P,
    r0 = A.r0 * P,
    r1 = A.r1 * P,
    da = A.a1 - A.a0,
    rm = (A.r0 + A.r1) / 2;
  const n = Math.max(4, Math.round(Math.abs(da) * rm * 3), Math.round((Math.abs(da) / (2 * Math.PI)) * 14)),
    h0 = +s.h0 || 0,
    h1 = s.h1 == null ? 2 : +s.h1,
    rnd = mulberry(((A.cx * 97 + A.cy * 13) | 0) + 5);
  const sect = (c, a, b, ox = 0, oy = 0) => {
    c.beginPath();
    c.arc(cx + ox, cy + oy, r1, a, b, b < a);
    c.arc(cx + ox, cy + oy, r0, b, a, b >= a);
    c.closePath();
  };
  const sc = document.createElement('canvas');
  sc.width = ctx.canvas.width;
  sc.height = ctx.canvas.height;
  const sx = sc.getContext('2d');
  sx.setTransform(ctx.getTransform());
  sx.fillStyle = '#000';
  for (let i = 0; i < n; i++) {
    const h = Math.max(0.25, h0 + ((h1 - h0) * (i + 0.5)) / n),
      a = A.a0 + (da * i) / n,
      b = A.a0 + (da * (i + 1)) / n; // each step throws a shadow as long as its height
    for (const f of [0.25, 0.5, 0.75, 1]) {
      sect(sx, a, b, SUN.dx * h * P * f, SUN.dy * h * P * f);
      sx.fill();
    }
  }
  ctx.save();
  if (Math.abs(da) > 4.7) {
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, 7);
    ctx.clip();
  } // a spiral inside a shaft: its shadow stays in the shaft
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = SUN.a * 0.85;
  ctx.filter = `blur(${(P * 0.1).toFixed(1)}px)`;
  ctx.drawImage(sc, 0, 0);
  ctx.restore();
  const top = [176, 168, 154],
    bot = [48, 45, 40],
    lw = Math.max(1, P / 32);
  const i0 = Math.abs(da) > 2 * Math.PI ? n - Math.round((n * 2 * Math.PI) / Math.abs(da)) : 0; // stacked turns: only the top turn shows
  for (let i = i0; i < n; i++) {
    const t = n - 1 > i0 ? (i - i0) / (n - 1 - i0) : 1,
      j = (rnd() - 0.5) * 14,
      c = bot.map((v, q) => Math.round(v + (top[q] - v) * t + j)),
      a = A.a0 + (da * i) / n,
      b = A.a0 + (da * (i + 1)) / n;
    ctx.fillStyle = `rgb(${c})`;
    sect(ctx, a, b - Math.sign(da) * 0.002);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,245,230,.2)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(b) * r0, cy + Math.sin(b) * r0);
    ctx.lineTo(cx + Math.cos(b) * r1, cy + Math.sin(b) * r1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(10,8,6,.85)';
  ctx.lineWidth = Math.max(1.5, P / 18);
  const aS = A.a0 + (da * i0) / n;
  ctx.beginPath();
  ctx.arc(cx, cy, r0, aS, A.a1, da < 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r1, aS, A.a1, da < 0);
  ctx.stroke();
  {
    const rmP = (r0 + r1) / 2,
      span = Math.min(Math.abs(da), 2 * Math.PI),
      sg = Math.sign(da) || 1,
      b0 = A.a1 - sg * span * 0.62,
      b1 = A.a1 - sg * span * 0.2,
      up = h1 >= h0; // arrow pointing up the stair
    const e0 = up ? b0 : b1,
      e1 = up ? b1 : b0,
      dir = up ? sg : -sg,
      hx = cx + Math.cos(e1) * rmP,
      hy = cy + Math.sin(e1) * rmP,
      tx = -Math.sin(e1) * dir,
      ty = Math.cos(e1) * dir,
      nx = Math.cos(e1),
      ny = Math.sin(e1),
      ah = Math.min(P * 0.28, (r1 - r0) * 0.45);
    for (const [col, w] of [
      ['rgba(10,8,6,.75)', Math.max(3, P / 11)],
      ['rgba(250,240,215,.9)', Math.max(1.5, P / 26)]
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, rmP, e0, e1, dir < 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx - tx * ah + nx * ah * 0.7, hy - ty * ah + ny * ah * 0.7);
      ctx.lineTo(hx, hy);
      ctx.lineTo(hx - tx * ah - nx * ah * 0.7, hy - ty * ah - ny * ah * 0.7);
      ctx.stroke();
    }
  }
  for (const a of [aS, A.a1]) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  if (A.r0 <= 0.3) {
    disc(ctx, cx, cy, r0 + Math.max(1.5, P / 30), 'rgba(10,8,6,.9)');
    const g = ctx.createRadialGradient(cx - r0 * 0.3, cy - r0 * 0.35, 0, cx, cy, r0);
    g.addColorStop(0, '#bdb5a6');
    g.addColorStop(1, '#5a554d');
    disc(ctx, cx, cy, r0, g);
  } // newel post
}
function drawStairs(ctx, s, P) {
  if (s.kind) return drawCompositeStairs(ctx, s, P);
  if (s.arc) return drawArcStairs(ctx, s, P);
  const x = s.x0 * P,
    y = s.y0 * P,
    w = (s.x1 - s.x0) * P,
    h = (s.y1 - s.y0) * P,
    vert = s.dir === 'n' || s.dir === 's';
  const len = vert ? s.y1 - s.y0 : s.x1 - s.x0,
    n = Math.max(2, Math.round(len * 3)),
    lw = Math.max(1, P / 32);
  const top = [168, 160, 148],
    bot = [44, 41, 37];
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.filter = `blur(${(P * 0.08).toFixed(1)}px)`;
  ctx.fillRect(x + P * 0.05, y + P * 0.07, w, h);
  ctx.filter = 'none';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1),
      k = s.dir === 'n' || s.dir === 'w' ? n - 1 - i : i; // k = position along the drawn axis
    const c = top.map((v, j) => Math.round(v + (bot[j] - v) * t));
    ctx.fillStyle = `rgb(${c})`;
    const sx = vert ? x : x + (w * k) / n,
      sy = vert ? y + (h * k) / n : y,
      sw = vert ? w : w / n,
      sh = vert ? h / n : h;
    ctx.fillRect(sx, sy, sw + (vert ? 0 : 0.5), sh + (vert ? 0.5 : 0));
    // step nose: light edge on the high side, shadow on the low side
    const down = s.dir;
    ctx.fillStyle = 'rgba(255,245,230,.18)';
    if (down === 's') ctx.fillRect(sx, sy, sw, lw);
    if (down === 'n') ctx.fillRect(sx, sy + sh - lw, sw, lw);
    if (down === 'e') ctx.fillRect(sx, sy, lw, sh);
    if (down === 'w') ctx.fillRect(sx + sw - lw, sy, lw, sh);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    if (down === 's') ctx.fillRect(sx, sy + sh - lw, sw, lw);
    if (down === 'n') ctx.fillRect(sx, sy, sw, lw);
    if (down === 'e') ctx.fillRect(sx + sw - lw, sy, lw, sh);
    if (down === 'w') ctx.fillRect(sx, sy, lw, sh);
  }
  ctx.strokeStyle = '#0d0c0b';
  ctx.lineWidth = Math.max(1.5, P / 18);
  ctx.beginPath();
  if (vert) {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
  }
  ctx.stroke();
  ctx.lineWidth = Math.max(1, P / 40);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

function drawDoor(ctx, d, P, opt) {
  const [cx, cy, ang] = doorCenter(d),
    L = P * 0.86,
    t = P * 0.2,
    T = P * 0.5,
    lw = Math.max(1, P / 45),
    ink = '#141210',
    edge = Math.max(1.5, P / 18);
  ctx.save();
  ctx.translate(cx * P, cy * P);
  ctx.rotate(ang);
  const slab = fill => {
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.filter = `blur(${(P * 0.04).toFixed(1)}px)`;
    ctx.fillRect(-L / 2 + P * 0.04, -T / 2 + P * 0.05, L, T);
    ctx.filter = 'none';
    ctx.fillStyle = ink;
    ctx.fillRect(-L / 2 - edge / 2, -T / 2 - edge / 2, L + edge, T + edge);
    ctx.fillStyle = fill;
    ctx.fillRect(-L / 2, -T / 2, L, T);
  };
  if (d.type === 'door' || d.type === 'double') {
    // white, half a square thick: unmistakable against any wall
    slab('#f6f3ec');
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.fillRect(-L / 2, T * 0.18, L, T * 0.32);
    ctx.strokeStyle = 'rgba(20,18,16,.35)';
    ctx.lineWidth = lw;
    ctx.strokeRect(-L / 2 + P * 0.07, -T / 2 + P * 0.07, L - P * 0.14, T - P * 0.14);
    if (d.type === 'double') {
      ctx.strokeStyle = ink;
      ctx.lineWidth = Math.max(1.5, P / 26);
      ctx.beginPath();
      ctx.moveTo(0, -T / 2);
      ctx.lineTo(0, T / 2);
      ctx.stroke();
    }
    ctx.fillStyle = ink;
    for (const hx of d.type === 'double' ? [-P * 0.08, P * 0.08] : [L * 0.3]) {
      ctx.beginPath();
      ctx.arc(hx, 0, Math.max(1.5, P * 0.04), 0, 7);
      ctx.fill();
    }
  } else if (d.type === 'portcullis') {
    const bw = Math.max(1.5, P * 0.045),
      tt = t * 1.1;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.filter = `blur(${(P * 0.03).toFixed(1)}px)`;
    ctx.fillRect(-L / 2 + P * 0.03, -bw / 2 + P * 0.05, L, bw);
    ctx.filter = 'none';
    ctx.fillStyle = '#1c1d20';
    ctx.fillRect(-L / 2, -bw / 2, L, bw);
    for (let i = 0; i <= 6; i++) {
      const xx = -L / 2 + (L * i) / 6;
      ctx.fillRect(xx - bw / 2, -tt / 2, bw, tt);
    }
    ctx.fillStyle = 'rgba(200,205,215,.35)';
    ctx.fillRect(-L / 2, -bw / 2, L, Math.max(0.8, bw * 0.3));
    for (let i = 0; i <= 6; i++) {
      const xx = -L / 2 + (L * i) / 6;
      ctx.fillRect(xx - bw / 2, -tt / 2, Math.max(0.8, bw * 0.3), tt);
    }
  } else if (d.type === 'shoji') {
    // sliding paper screen: light wood frame, paper panes, lattice
    const tt = P * 0.1;
    ctx.fillStyle = '#2a1b0e';
    ctx.fillRect(-L / 2 - 1, -tt / 2 - 1, L + 2, tt + 2);
    ctx.fillStyle = '#efe7d3';
    ctx.fillRect(-L / 2, -tt / 2, L, tt);
    ctx.strokeStyle = '#8a6a44';
    ctx.lineWidth = Math.max(0.8, P / 60);
    ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const xx = -L / 2 + (L * i) / 8;
      ctx.moveTo(xx, -tt / 2);
      ctx.lineTo(xx, tt / 2);
    }
    ctx.moveTo(-L / 2, 0);
    ctx.lineTo(L / 2, 0);
    ctx.stroke();
    ctx.strokeStyle = '#5a3e22';
    ctx.lineWidth = Math.max(1.2, P / 35);
    ctx.strokeRect(-L / 2, -tt / 2, L, tt);
    ctx.beginPath();
    ctx.moveTo(0, -tt / 2);
    ctx.lineTo(0, tt / 2);
    ctx.stroke();
  } else if (d.type === 'window') {
    // crystal blue, half a square thick, with glazing bars
    slab('#7fd3f5');
    const gg = ctx.createLinearGradient(-L / 2, -T / 2, L / 2, T / 2);
    gg.addColorStop(0, 'rgba(255,255,255,.55)');
    gg.addColorStop(0.45, 'rgba(255,255,255,.05)');
    gg.addColorStop(1, 'rgba(20,90,140,.25)');
    ctx.fillStyle = gg;
    ctx.fillRect(-L / 2, -T / 2, L, T);
    ctx.strokeStyle = '#f4fbff';
    ctx.lineWidth = Math.max(1.2, P / 30);
    ctx.beginPath();
    ctx.moveTo(-L / 2, 0);
    ctx.lineTo(L / 2, 0);
    for (const fx of [-1 / 6, 1 / 6]) {
      ctx.moveTo(((L * fx * 3) / 1.5) * 0.5, -T / 2);
      ctx.lineTo(((L * fx * 3) / 1.5) * 0.5, T / 2);
    }
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.lineWidth = edge;
    ctx.strokeRect(-L / 2, -T / 2, L, T);
  } else if (d.type === 'secret' && opt.secret) {
    ctx.strokeStyle = '#e25555';
    ctx.lineWidth = Math.max(1.5, P / 30);
    ctx.setLineDash([P * 0.08, P * 0.06]);
    ctx.strokeRect(-L / 2, -t * 0.7, L, t * 1.4);
    ctx.setLineDash([]);
    ctx.rotate(-ang);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = `bold ${Math.round(P * 0.34)}px system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,.8)';
    ctx.lineWidth = Math.max(2, P / 18);
    ctx.strokeText('S', 0, 0);
    ctx.fillText('S', 0, 0);
  }
  ctx.restore();
}

// Draws stairs, walls (with ambient occlusion + drop shadow), openings and doors onto its own transparent canvas.
function drawStructure(m, ctx, P, opt) {
  const st = m.struct;
  if (!st) return;
  ctx.save();
  ctx.lineJoin = 'round';
  for (const s of st.stairs) drawStairs(ctx, s, P);
  if (st.walls.length) {
    const groups = {};
    for (const w of st.walls) (groups[w.mat + '|' + w.th] ||= { mat: w.mat, th: w.th, ws: [] }).ws.push(w);
    const BAL = Object.values(groups).filter(g => g.mat === 'balustrade'),
      G = Object.values(groups).filter(g => g.mat !== 'balustrade');
    for (const g of G) if (g.mat === 'cave') g.wth = Math.max(0.3, g.th * 1.5); // natural cave walls are a band of rock
    const W_ = g => g.wth || g.th;
    const pass = (fn, only) => {
      for (const g of G) {
        if (only && !only(g)) continue;
        ctx.lineCap = g.mat === 'cave' ? 'round' : g.mat === 'rampart' ? 'square' : 'square';
        ctx.lineJoin = g.mat === 'rampart' ? 'miter' : 'round';
        ctx.beginPath();
        if (g.mat === 'cave') cavePaths(ctx, g.ws, P, m.seed);
        else if (g.mat === 'rampart') for (const ch of wallChains(g.ws)) chainPath(ctx, ch.pts, ch.closed, P);
        else for (const w of g.ws) wallPath(ctx, w, P, m.seed);
        fn(g);
        ctx.stroke();
      }
    };
    ctx.filter = `blur(${(P * 0.32).toFixed(1)}px)`;
    ctx.strokeStyle = 'rgba(0,0,0,.62)';
    pass(g => (ctx.lineWidth = W_(g) * P + P * 0.7));
    for (const g of G) {
      const k = g.mat === 'rampart' ? 3.5 : 1.2;
      ctx.save();
      ctx.translate(P * SUN.dx * k, P * SUN.dy * k);
      ctx.filter = `blur(${(P * 0.06).toFixed(1)}px)`;
      ctx.strokeStyle = `rgba(0,0,0,${SUN.a})`;
      pass(
        h => (ctx.lineWidth = W_(h) * P + P * 0.03),
        h => h === g
      );
      ctx.restore();
    }
    ctx.filter = 'none';
    ctx.strokeStyle = '#0b0a09';
    pass(g => (ctx.lineWidth = W_(g) * P + Math.max(2, P * 0.055)));
    pass(g => {
      const pat = ctx.createPattern(getWallTex(g.mat, P, m.seed), 'repeat');
      ctx.strokeStyle = pat;
      ctx.lineWidth = W_(g) * P;
    });
    ctx.save();
    ctx.translate(-P * 0.015, -P * 0.02);
    ctx.strokeStyle = 'rgba(255,240,220,.1)';
    pass(
      g => (ctx.lineWidth = Math.max(1, W_(g) * P * 0.35)),
      g => g.mat !== 'rampart'
    );
    ctx.restore();
    for (const g of G) if (g.mat === 'rampart') drawRampartTop(ctx, g, P, m.seed);
    for (const g of BAL)
      for (const ch of wallChains(g.ws)) {
        const pts = ch.closed ? [...ch.pts, ch.pts[0]] : ch.pts;
        drawRail(ctx, pts, P, ch.closed ? [] : [pts[0], pts[pts.length - 1]]);
      }
  }
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (const d of st.doors)
    if (DOOR_CUT[d.type]) {
      const [cx, cy, a] = doorCenter(d);
      let th = 0;
      for (const w of st.walls)
        if (segDist(cx, cy, w.x1, w.y1, w.x2, w.y2) < 0.2)
          th = Math.max(th, w.mat === 'cave' ? Math.max(0.3, w.th * 1.5) + 0.5 : w.th);
      th = th || 0.25;
      const h = th * P + Math.max(2, P * 0.055) + 2;
      ctx.save();
      ctx.translate(cx * P, cy * P);
      ctx.rotate(a);
      ctx.fillRect(-P * 0.45, -h / 2, P * 0.9, h);
      ctx.restore();
    }
  ctx.restore();
  for (const d of st.doors) drawDoor(ctx, d, P, opt);
  drawObjects(ctx, m, P);
  if (SHOW_TOP) for (const r of st.roofs || []) drawRoof(ctx, r, P);
  if (opt.labels) drawLabels(ctx, st.labels || [], P);
  ctx.restore();
}
