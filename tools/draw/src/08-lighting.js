/* ---------- night: a multiply layer (moonlit tint with holes for lights) + a screen layer (warm glow) ---------- */
// Light occlusion: wall segments (minus openings that let light through) block light; visibility polygon per light.
const LIGHT_PASSES = { opening: 1, portcullis: 1, window: 1, shoji: 1 };
function lightBlockers(m) {
  const gaps = m.struct.doors
    .filter(d => LIGHT_PASSES[d.type])
    .map(d => {
      const [cx, cy] = doorCenter(d);
      return d.o === 'h' ? { h: 1, c: cy, a: cx - 0.45, b: cx + 0.45 } : { h: 0, c: cx, a: cy - 0.45, b: cy + 0.45 };
    });
  const out = [];
  const extra = [];
  for (const st2 of m.struct.stairs || [])
    if (st2.kind === 'half')
      for (const w of stairParts(st2).walls) extra.push({ x1: w[0], y1: w[1], x2: w[2], y2: w[3] });
  for (const w of [...m.struct.walls.filter(w => w.mat !== 'balustrade'), ...extra]) {
    let pieces = [[w.x1, w.y1, w.x2, w.y2]];
    for (const g of gaps) {
      const np = [];
      for (const p of pieces) {
        const horiz = g.h && Math.abs(p[1] - p[3]) < 1e-6 && Math.abs(p[1] - g.c) < 0.05,
          vert = !g.h && Math.abs(p[0] - p[2]) < 1e-6 && Math.abs(p[0] - g.c) < 0.05;
        if (!horiz && !vert) {
          np.push(p);
          continue;
        }
        const k = horiz ? 0 : 1,
          a0 = Math.min(p[k], p[k + 2]),
          a1 = Math.max(p[k], p[k + 2]);
        if (g.b <= a0 || g.a >= a1) {
          np.push(p);
          continue;
        }
        const mk = (s0, e0) => (horiz ? [s0, p[1], e0, p[1]] : [p[0], s0, p[0], e0]);
        if (g.a > a0) np.push(mk(a0, g.a));
        if (g.b < a1) np.push(mk(g.b, a1));
      }
      pieces = np;
    }
    out.push(...pieces);
  }
  return out;
}
function raySeg(lx, ly, dx, dy, s) {
  const ex = s[2] - s[0],
    ey = s[3] - s[1],
    den = dx * ey - dy * ex;
  if (Math.abs(den) < 1e-9) return Infinity;
  const qx = s[0] - lx,
    qy = s[1] - ly,
    t = (qx * ey - qy * ex) / den,
    u = (qx * dy - qy * dx) / den;
  return u >= -1e-6 && u <= 1 + 1e-6 && t > 0 ? t : Infinity;
}
function visPoly(lx, ly, r, segs) {
  const S = segs.filter(s => segDist(lx, ly, s[0], s[1], s[2], s[3]) < r);
  if (!S.length) return null;
  const angs = [];
  for (let i = 0; i < 64; i++) angs.push((i / 64) * Math.PI * 2 - Math.PI);
  for (const s of S)
    for (const [px, py] of [
      [s[0], s[1]],
      [s[2], s[3]]
    ]) {
      const a = Math.atan2(py - ly, px - lx);
      angs.push(a - 1e-4, a, a + 1e-4);
    }
  angs.sort((a, b) => a - b);
  return angs.map(a => {
    const dx = Math.cos(a),
      dy = Math.sin(a);
    let tm = r;
    for (const s of S) {
      const t = raySeg(lx, ly, dx, dy, s);
      if (t > 0.04 && t < tm) tm = t;
    }
    return [lx + dx * tm, ly + dy * tm];
  });
}
const TOD = {
  day: { name: 'Day', sun: [0.07, 0.1], sa: 0.6 },
  dawn: {
    name: 'Dawn',
    sun: [-0.32, 0.14],
    sa: 0.42,
    tint: [228, 204, 222],
    sat: 0.9,
    light: 0.35,
    wash: 'rgba(255,165,190,.10)'
  },
  golden: {
    name: 'Golden hour',
    sun: [0.36, 0.1],
    sa: 0.55,
    tint: [250, 222, 172],
    sat: 1.12,
    light: 0.2,
    wash: 'rgba(255,160,60,.13)'
  },
  dusk: {
    name: 'Dusk',
    sun: [0.45, 0.07],
    sa: 0.35,
    tint: [158, 140, 186],
    sat: 0.7,
    light: 0.75,
    wash: 'rgba(255,110,80,.06)'
  },
  night: { name: 'Night', sun: [0.05, 0.07], sa: 0.22, sat: 0.5, light: 1 }
};
const TOD_ORDER = ['day', 'dawn', 'golden', 'dusk', 'night'];
function setSun(tod) {
  const t = TOD[tod] || TOD.day;
  SUN.dx = t.sun[0];
  SUN.dy = t.sun[1];
  SUN.a = t.sa;
}
function nightColour(k) {
  const deep = [14, 24, 72];
  return deep.map(v => Math.round(255 + (v - 255) * k));
}
// Light sources: [bright, outer edge of dim/shadowy light] in feet, D&D 3.5 and 5e (5e dim = bright + the extra dim distance)
const LIGHT_PRESETS = {
  candle: { name: 'Candle', 35: [0, 5], '5e': [5, 10] },
  lamp: { name: 'Common lamp', 35: [15, 30], '5e': [15, 45] },
  torch: { name: 'Torch / light spell', 35: [20, 40], '5e': [20, 40] },
  campfire: { name: 'Campfire / brazier', 35: [20, 40], '5e': [20, 40] },
  hooded: { name: 'Hooded lantern', 35: [30, 60], '5e': [30, 60] },
  sunrod: { name: 'Sunrod', 35: [30, 60], '5e': [30, 60] },
  bullseye: { name: 'Bullseye lantern (cone)', 35: [60, 120], '5e': [60, 120], cone: 60 },
  daylight: { name: 'Daylight spell', 35: [60, 120], '5e': [60, 120] },
  glow: { name: 'Faint glow', 35: [5, 10], '5e': [5, 10] },
  beacon: { name: 'Lighthouse beam (cone)', 35: [120, 240], '5e': [120, 240], cone: 30 }
};
// One light, in squares: { b: bright radius, o: outer radius, cone: degrees or 0, dir: radians }
function lightOf(o, m) {
  const st = STAMPS[o.t];
  if (!st || (!st.light && !st.lp) || o.off) return null;
  const pr = LIGHT_PRESETS[o.lp || st.lp];
  if (!pr || !/^f(ee)?t$/i.test(m.unit || 'ft')) {
    const r = (st.light || 3) * Math.sqrt(o.s || 1);
    return { b: r * 0.35, o: r, cone: 0, dir: 0 };
  } // world maps: keep icon-sized glows
  const [b, ou] = pr[m.rules === '5e' ? '5e' : '35'],
    ft = m.ft || 5;
  return { b: b / ft, o: ou / ft, cone: pr.cone || 0, dir: o.r || 0 };
}
function buildNight(m, P, W, H, k, lr, dm = true, tod = 'night') {
  const TP = TOD[tod] || TOD.night,
    LA = TP.light ?? 1;
  const Ls = shownLayers(m, dm),
    all = key => Ls.flatMap(l => l.struct[key] || []);
  const merged = { struct: { objects: all('objects'), doors: all('doors'), walls: all('walls') }, occlude: m.occlude };
  const dark = document.createElement('canvas'),
    glow = document.createElement('canvas');
  dark.width = glow.width = W;
  dark.height = glow.height = H;
  const d = dark.getContext('2d'),
    g = glow.getContext('2d');
  d.fillStyle = `rgb(${TP.tint || nightColour(k)})`;
  d.fillRect(0, 0, W, H);
  if (TP.wash) {
    g.fillStyle = TP.wash;
    g.fillRect(0, 0, W, H);
  }
  const lights = [];
  for (const o of merged.struct.objects) {
    const L = lightOf(o, m);
    if (L) lights.push([o.x, o.y, L.o * lr, 1, o.c || STAMPS[o.t].lc, L.b * lr, L.cone, L.dir]);
  }
  for (const dr of merged.struct.doors)
    if (dr.type === 'window' || dr.type === 'shoji') {
      const [cx, cy] = doorCenter(dr);
      lights.push([cx, cy, 1.6 * lr, 0.7]);
    }
  const segs = m.occlude === false ? [] : lightBlockers(merged);
  for (const [x, y, r, a0 = 1, lc, rb = r * 0.35, cone = 0, dir = 0] of lights) {
    const a = a0 * LA,
      cc = lc ? hexRgb(lc) : [255, 150, 50],
      hole = cc.map(v => Math.round(255 - (255 - v) * 0.35)),
      hole2 = cc.map(v => Math.round(255 - (255 - v) * 0.45));
    const poly = segs.length ? visPoly(x, y, r, segs) : null;
    const clip = c2 => {
      if (!poly) return;
      c2.beginPath();
      poly.forEach(([px, py], i) => (i ? c2.lineTo(px * P, py * P) : c2.moveTo(px * P, py * P)));
      c2.closePath();
      c2.clip();
    };
    const wedge = c2 => {
      if (!cone) return;
      const h = (cone * Math.PI) / 360;
      c2.beginPath();
      c2.moveTo(x * P, y * P);
      c2.arc(x * P, y * P, r * P * 1.02, dir - h, dir + h);
      c2.closePath();
      c2.clip();
    };
    d.save();
    g.save();
    clip(d);
    clip(g);
    wedge(d);
    wedge(g);
    const gr = d.createRadialGradient(x * P, y * P, 0, x * P, y * P, r * P),
      kb = clamp(rb / r, 0.05, 0.9); // full light to the bright radius, fading through the dim ring
    gr.addColorStop(0, `rgba(${hole},${a})`);
    gr.addColorStop(kb, `rgba(${hole2},${a * 0.9})`);
    gr.addColorStop(Math.min(0.97, kb + (1 - kb) * 0.55), `rgba(${hole2},${a * 0.45})`);
    gr.addColorStop(1, `rgba(${hole2},0)`);
    d.fillStyle = gr;
    d.fillRect((x - r) * P, (y - r) * P, 2 * r * P, 2 * r * P);
    const gg = g.createRadialGradient(x * P, y * P, 0, x * P, y * P, r * 0.7 * P);
    gg.addColorStop(0, `rgba(${cc},${0.42 * a})`);
    gg.addColorStop(0.5, `rgba(${cc},${0.16 * a})`);
    gg.addColorStop(1, `rgba(${cc},0)`);
    g.fillStyle = gg;
    g.fillRect((x - r) * P, (y - r) * P, 2 * r * P, 2 * r * P);
    d.restore();
    g.restore();
  }
  // emissive terrain (lava, including recoloured lava)
  // glowing terrain: lava, crystal floors, glowing fungus... each terrain carries its own glow colour
  const emit = TERRAINS.map(t => (t && (t.glow || ((t.gen || t.key) === 'lava' ? '#ffc896' : null))) || null);
  const present = new Set();
  for (const l of Ls) {
    const lab = l.labels;
    for (let i = 0; i < lab.length; i++) if (emit[lab[i]]) present.add(emit[lab[i]]);
  }
  for (const gc of present) {
    const [cr, cg, cb] = hexRgb(gc),
      sw = m.cols * R,
      sh = m.rows * R,
      mc = document.createElement('canvas');
    mc.width = sw;
    mc.height = sh;
    const mx = mc.getContext('2d'),
      id = mx.createImageData(sw, sh),
      dd = id.data;
    for (const l of Ls) {
      const lab = l.labels;
      for (let i = 0; i < lab.length; i++)
        if (emit[lab[i]] === gc) {
          dd[i * 4] = cr;
          dd[i * 4 + 1] = cg;
          dd[i * 4 + 2] = cb;
          dd[i * 4 + 3] = 255;
        }
    }
    mx.putImageData(id, 0, 0);
    d.save();
    d.globalAlpha = Math.max(0.4, LA);
    d.filter = `blur(${(P * 0.9 * lr).toFixed(1)}px)`;
    d.drawImage(mc, 0, 0, m.cols * P, m.rows * P);
    d.filter = 'none';
    d.drawImage(mc, 0, 0, m.cols * P, m.rows * P);
    d.restore();
    g.save();
    g.globalAlpha = 0.5;
    g.filter = `blur(${(P * 0.6 * lr).toFixed(1)}px)`;
    g.drawImage(mc, 0, 0, m.cols * P, m.rows * P);
    g.restore();
  }
  // windows keep their blue glass at night, so they never read as doors
  for (const l of m.layers || [])
    if (l.visible)
      for (const dd of l.struct.doors || [])
        if (dd.type === 'window') {
          const [wx, wy, wa] = doorCenter(dd);
          for (const [c2, col] of [
            [d, 'rgba(225,238,250,.9)'],
            [g, 'rgba(70,150,210,.35)']
          ]) {
            c2.save();
            c2.translate(wx * P, wy * P);
            c2.rotate(wa);
            c2.fillStyle = col;
            c2.fillRect(-P * 0.43, -P * 0.25, P * 0.86, P * 0.5);
            c2.restore();
          }
        }
  return { dark, glow };
}
