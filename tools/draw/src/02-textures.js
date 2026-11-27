/* ---------- procedural textures (tileable, seeded) ---------- */
function wrapDraw(x, y, m, S, fn) {
  const xs = [x],
    ys = [y];
  if (x < m) xs.push(x + S);
  if (x > S - m) xs.push(x - S);
  if (y < m) ys.push(y + S);
  if (y > S - m) ys.push(y - S);
  for (const a of xs) for (const b of ys) fn(a, b);
}

function genTexture(tid, P, seed) {
  const T = TERRAINS[tid];
  return genTex(T, P, seed, T.baseIdx ?? tid);
}
function genTex(T, P, seed, salt) {
  const K = T.gen || T.key;
  const tc = T.tile || TILE_CELLS,
    ts = tc / TILE_CELLS,
    S = Math.max(32, Math.round(P * tc));
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d'),
    img = x.createImageData(S, S),
    d = img.data;
  const s = (seed + salt * 7919) | 0,
    rnd = mulberry(s),
    r = T.rgb;
  let vor = null;
  if (K === 'cobble') vor = makeVoronoi(14, rnd);
  if (K === 'crystal') vor = makeVoronoi(9, rnd);
  if (K === 'flag') vor = makeVoronoi(5, rnd);
  for (let py = 0; py < S; py++) {
    const v = py / S;
    for (let px = 0; px < S; px++) {
      const u = px / S,
        g = hash(px, py, s + 3) - 0.5;
      let t = 0.5,
        k = 1;
      switch (K) {
        case 'grass':
          t = 0.18 + 0.62 * fbm(u, v, 3, 5, s) + g * 0.2;
          break;
        case 'dirt':
          t = 0.12 + 0.72 * fbm(u, v, 3, 5, s) + g * 0.16;
          break;
        case 'sand': {
          const f = fbm(u, v, 2, 4, s);
          const rip = Math.sin((v * 12 + f * 2.2 + 0.4 * fbm(u, v, 6, 2, s + 3)) * Math.PI * 2);
          t = 0.32 + 0.38 * f + 0.09 * rip + g * 0.2;
          break;
        }
        case 'forest':
        case 'pine':
          t = 0.02 + 0.16 * fbm(u, v, 3, 4, s) + g * 0.06;
          break;
        case 'rock':
        case 'lrock': {
          const f = fbm(u, v, 3 * ts, 5, s),
            rr = 1 - Math.abs(2 * fbm(u, v, 4 * ts, 4, s + 50) - 1);
          t = 0.2 + 0.62 * f + g * 0.1;
          if (rr > 0.9) t -= (rr - 0.9) * 5;
          break;
        }
        case 'snow':
          t = 0.42 + 0.48 * fbm(u, v, 2, 4, s) + g * 0.05;
          if (g > 0.497) t = 1;
          break;
        case 'water': {
          const f = fbm(u, v, 2, 5, s),
            w = fbm(u, v, 5, 3, s + 9);
          const band = Math.sin((u * 6 + v * 4 + w * 2.5) * Math.PI * 2);
          t = 0.2 + 0.5 * f + g * 0.04;
          if (band > 0.9) t += ((0.3 * (band - 0.9)) / 0.1) * (0.4 + w);
          break;
        }
        case 'lava': {
          const f = fbm(u, v, 3 * ts, 5, s),
            rr = 1 - Math.abs(2 * fbm(u, v, 4 * ts, 5, s + 77) - 1);
          t = rr > 0.78 ? 0.55 + (rr - 0.78) * 2.1 : 0.04 + 0.3 * f + g * 0.06;
          break;
        }
        case 'cobble':
        case 'flag': {
          const o = vor(u, v),
            edge = o.f2 - o.f1,
            shade = hash(o.id, 1, s);
          const grout = K === 'cobble' ? 0.1 : 0.045;
          if (edge < grout) t = 0.04 + (edge / grout) * 0.12;
          else {
            t = 0.28 + 0.4 * shade + 0.18 * fbm(u, v, 6, 3, s + 5) - o.f1 * (K === 'cobble' ? 0.35 : 0.12) + g * 0.08;
            if (edge < grout * 1.8) t += 0.08;
          }
          break;
        }
        case 'tatami': {
          // mats 1×2 squares, alternating direction in 2×2 blocks, black cloth border (heri)
          const cu = u * TILE_CELLS,
            cv = v * TILE_CELLS,
            bx = Math.floor(cu / 2),
            by = Math.floor(cv / 2),
            lx = cu - bx * 2,
            ly = cv - by * 2,
            hz = (bx + by) % 2 === 0;
          const mat = hz ? Math.floor(ly) : Math.floor(lx),
            along = hz ? lx : ly,
            across = hz ? ly - mat : lx - mat;
          const shade = hash(bx * 7 + by * 13 + mat, 3, s);
          t =
            0.5 +
            0.12 * (shade - 0.5) +
            0.07 * Math.sin(along * Math.PI * 2 * 22) +
            g * 0.05 +
            0.06 * (fbm(u, v, 6, 2, s) - 0.5);
          if (across < 0.07 || across > 0.93) {
            t = 0.02;
            k = 0.55;
          } else if (along < 0.02 || along > 1.98) t = 0.08;
          break;
        }
        case 'gravel': {
          // raked sand/gravel garden lines with a slow wobble
          const rake = Math.sin((v * TILE_CELLS * 6 + (fbm(u, v, 2, 3, s) - 0.5) * 1.6) * Math.PI * 2);
          t = 0.55 + 0.14 * rake + g * 0.3;
          if (hash(px, py, s + 9) > 0.985) t -= 0.35;
          break;
        }
        case 'wetrock': {
          const f = fbm(u, v, 3 * ts, 5, s),
            rr = 1 - Math.abs(2 * fbm(u, v, 4 * ts, 4, s + 50) - 1),
            wet = fbm(u, v, 3 * ts, 3, s + 8);
          t = 0.18 + 0.55 * f + g * 0.1;
          if (rr > 0.9) t -= (rr - 0.9) * 5;
          if (wet > 0.66) {
            t = t * 0.6 + 0.05;
            if (hash(px, py, s + 2) > 0.97) t = 0.9;
          }
          break;
        }
        case 'crystal': {
          const o = vor(u, v),
            edge = o.f2 - o.f1;
          t = 0.12 + 0.3 * hash(o.id, 2, s) + (1 - o.f1) * 0.22 + g * 0.05;
          if (edge < 0.05) t = 0.78 + (0.05 - edge) * 4;
          break;
        }
        case 'mud': {
          const f = fbm(u, v, 3, 5, s);
          t = 0.18 + 0.5 * f + g * 0.08;
          const sh = fbm(u, v, 6, 2, s + 4);
          if (sh > 0.68) t += (sh - 0.68) * 1.6;
          break;
        }
        case 'jungle':
          t = 0.08 + 0.42 * fbm(u, v, 3, 5, s) + g * 0.12;
          break;
        case 'beach':
          t =
            0.45 +
            0.3 * fbm(u, v, 2, 4, s) +
            g * 0.16 +
            0.05 * Math.sin((v * 9 + fbm(u, v, 3, 2, s + 1) * 2) * Math.PI * 2);
          break;
        case 'reef': {
          const f = fbm(u, v, 2, 5, s),
            w = fbm(u, v, 5, 3, s + 9),
            caus = 1 - Math.abs(2 * fbm(u, v, 6, 3, s + 31) - 1);
          t = 0.3 + 0.42 * f + g * 0.03;
          if (caus > 0.9) t += (caus - 0.9) * 3.5 * (0.5 + w);
          break;
        }
        case 'pier': {
          const rows = TILE_CELLS * 3,
            row = Math.floor(v * rows),
            fy = v * rows - row,
            off = hash(row, 21, s) * 0.5,
            uu = (((u - off) % 1) + 1) % 1,
            du = (uu * 1.5) % 1;
          const shade = hash(row * 5 + Math.floor(uu * 1.5), 7, s),
            grain = Math.sin((fy * 4 + fbm(u, v, 9, 3, s + row) * 3) * Math.PI * 2);
          t = 0.38 + 0.3 * shade + 0.08 * grain + g * 0.1;
          if (fy < 0.14 || du < 0.012) t = 0.0;
          else if (fy < 0.2) t -= 0.12;
          break;
        }
        case 'quay': {
          const rows = TILE_CELLS * 2,
            row = Math.floor(v * rows),
            fy = v * rows - row,
            off = row % 2 ? 0.5 : 0,
            cu = u * TILE_CELLS + off,
            col = Math.floor(cu),
            fx = cu - col;
          t = 0.32 + 0.3 * hash(row * 31 + col, 3, s) + 0.12 * (fbm(u, v, 6, 3, s + 5) - 0.5) + g * 0.08;
          if (fbm(u, v, 3, 3, s + 9) > 0.64) t -= 0.14;
          if (fx < 0.035 || fy < 0.07) t = 0.05;
          else if (fx < 0.07 || fy < 0.13) t += 0.08;
          break;
        }
        case 'plate': {
          const n = TILE_CELLS,
            row = Math.floor(v * n),
            fy = v * n - row,
            cu = u * n + (row % 2 ? 0.5 : 0),
            col = Math.floor(cu),
            fx = cu - col;
          t =
            0.42 +
            0.2 * hash(row * 17 + col, 3, s) +
            0.12 * (fbm(u, v, 3, 3, s + 4) - 0.5) +
            0.05 * Math.sin((fx * 1.3 + fy) * 14 + fbm(u, v, 8, 2, s) * 5) +
            (0.5 - fy) * 0.14 +
            g * 0.05;
          if (fbm(u, v, 4, 3, s + 8) > 0.66) t -= 0.12;
          const dx = (((fx * 5) % 1) - 0.5) / 5,
            dy = (((fy * 5) % 1) - 0.5) / 5;
          let rd = 1,
            rx = 0,
            ry = 0;
          for (const e of [fy - 0.1, fy - 0.9])
            if (Math.hypot(dx, e) < rd) {
              rd = Math.hypot(dx, e);
              rx = dx;
              ry = e;
            }
          for (const e of [fx - 0.1, fx - 0.9])
            if (Math.hypot(e, dy) < rd) {
              rd = Math.hypot(e, dy);
              rx = e;
              ry = dy;
            }
          if (rd < 0.04) t = 0.78 - (rx + ry) * 7;
          else if (rd < 0.055) t = 0.12;
          if (fx < 0.018 || fy < 0.018) t = 0.04;
          else if (fx < 0.035 || fy < 0.035) t += 0.12;
          break;
        }
        case 'grate': {
          const n = TILE_CELLS * 4,
            fu = (u * n) % 1,
            fv = (v * n) % 1,
            cx2 = (u * TILE_CELLS) % 1,
            cy2 = (v * TILE_CELLS) % 1;
          if (cx2 < 0.06 || cy2 < 0.06) t = 0.62 + (cx2 < 0.03 || cy2 < 0.03 ? 0.15 : -0.1) + g * 0.05;
          else if (fu < 0.26) t = 0.35 + (0.13 - Math.abs(fu - 0.13)) * 3.5 + g * 0.05;
          else if (fv < 0.26) t = 0.3 + (0.13 - Math.abs(fv - 0.13)) * 3.5 + g * 0.05;
          else t = 0.02 + 0.07 * fbm(u, v, 4, 2, s);
          break;
        }
        case 'moss': {
          const cu = fbm(u, v, 10, 3, s + 21);
          t = 0.2 + 0.4 * fbm(u, v, 4, 5, s) + 0.32 * cu * cu + g * 0.07;
          if (hash(px, py, s + 4) > 0.994) t = 0.95;
          break;
        }
        case 'wood': {
          const rows = TILE_CELLS * (T.ppc || 2),
            row = Math.floor(v * rows),
            fy = v * rows - row;
          const off = hash(row, 11, s) * 0.5,
            uu = (((u - off) % 1) + 1) % 1,
            plank = Math.floor(uu * 2),
            du = (uu * 2) % 1;
          const shade = hash(row * 3 + plank, 5, s);
          const grain = Math.sin((fy * 5 + fbm(u, v, 8, 3, s + row) * 3.5) * Math.PI * 2);
          t = 0.32 + 0.32 * shade + 0.1 * grain + g * 0.08;
          const seamPx = Math.max(1, P / 40);
          if ((fy * S) / rows < seamPx || (du * S) / 2 < seamPx * 0.8) t = 0.03;
          else if ((fy * S) / rows < seamPx * 2.2) t += 0.1;
          break;
        }
      }
      const col = rampAt(r, t),
        i = (py * S + px) * 4;
      d[i] = col[0] * k;
      d[i + 1] = col[1] * k;
      d[i + 2] = col[2] * k;
      d[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  // painted detail strokes
  if (K === 'grass') {
    const n = TILE_CELLS * TILE_CELLS * 170;
    x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const bx = rnd() * S,
        by = rnd() * S,
        len = P * (0.04 + rnd() * 0.07),
        a = -Math.PI / 2 + (rnd() - 0.5) * 1.0;
      const col = rampAt(r, rnd() < 0.55 ? 0.85 + rnd() * 0.15 : 0.05 + rnd() * 0.2);
      x.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},.5)`;
      x.lineWidth = Math.max(0.7, P / 70);
      wrapDraw(bx, by, len + 2, S, (ax, ay) => {
        x.beginPath();
        x.moveTo(ax, ay);
        x.lineTo(ax + Math.cos(a) * len, ay + Math.sin(a) * len);
        x.stroke();
      });
    }
  }
  if (K === 'forest' || K === 'pine') drawCanopy(x, S, P, rnd, r, K === 'pine');
  if (K === 'jungle') {
    // leaf litter and low growth
    for (let i = 0; i < TILE_CELLS * TILE_CELLS * 45; i++) {
      const bx = rnd() * S,
        by = rnd() * S,
        l = P * (0.05 + rnd() * 0.1),
        a = rnd() * 6.28,
        col = rampAt(r, 0.25 + rnd() * 0.7);
      wrapDraw(bx, by, l + 2, S, (ax, ay) => {
        x.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},.75)`;
        x.beginPath();
        x.ellipse(ax, ay, l, l * 0.35, a, 0, 7);
        x.fill();
      });
    }
  }
  if (K === 'beach') {
    // shells
    for (let i = 0; i < TILE_CELLS * TILE_CELLS * 3; i++) {
      const bx = rnd() * S,
        by = rnd() * S,
        rr = P * (0.02 + rnd() * 0.025),
        cl = ['#f4ece0', '#efc9b8', '#e8dcc4'][(rnd() * 3) | 0];
      wrapDraw(bx, by, rr * 2, S, (ax, ay) => {
        x.fillStyle = 'rgba(90,70,50,.35)';
        x.beginPath();
        x.ellipse(ax + rr * 0.2, ay + rr * 0.3, rr, rr * 0.7, 0, 0, 7);
        x.fill();
        x.fillStyle = cl;
        x.beginPath();
        x.ellipse(ax, ay, rr, rr * 0.7, 0, 0, 7);
        x.fill();
      });
    }
  }
  if (K === 'reef') {
    // coral patches under the water
    for (let i = 0; i < TILE_CELLS * TILE_CELLS * 0.8; i++) {
      const bx = rnd() * S,
        by = rnd() * S,
        rr = P * (0.1 + rnd() * 0.14),
        cl = ['rgba(232,120,130,.28)', 'rgba(240,170,90,.28)', 'rgba(170,120,210,.24)', 'rgba(220,210,150,.3)'][
          (rnd() * 4) | 0
        ],
        sd = (rnd() * 1e6) | 0;
      wrapDraw(bx, by, rr * 1.3, S, (ax, ay) => {
        x.fillStyle = cl;
        blobPath(x, ax, ay, rr, 8, 0.35, mulberry(sd));
        x.fill();
      });
    }
  }
  if (K === 'dirt' || K === 'sand') {
    const n = TILE_CELLS * TILE_CELLS * (K === 'dirt' ? 26 : 8);
    for (let i = 0; i < n; i++) {
      const bx = rnd() * S,
        by = rnd() * S,
        rad = P * (0.012 + rnd() * 0.035);
      const hi = rampAt(r, 0.75 + rnd() * 0.25),
        lo = rampAt(r, 0.02);
      wrapDraw(bx, by, rad * 3, S, (ax, ay) => {
        x.fillStyle = `rgba(${lo[0] | 0},${lo[1] | 0},${lo[2] | 0},.55)`;
        x.beginPath();
        x.ellipse(ax + rad * 0.35, ay + rad * 0.45, rad, rad * 0.8, 0, 0, 7);
        x.fill();
        x.fillStyle = `rgb(${hi[0] | 0},${hi[1] | 0},${hi[2] | 0})`;
        x.beginPath();
        x.ellipse(ax, ay, rad, rad * 0.8, 0, 0, 7);
        x.fill();
      });
    }
  }
  return c;
}

// top-down tree crowns, tileable: shadows first, then crowns lit from the top-left
function drawCanopy(x, S, P, rnd, r, pine) {
  const g = TILE_CELLS * (pine ? 2 : 1.5),
    step = S / g,
    trees = [];
  for (let j = 0; j < g; j++)
    for (let i = 0; i < g; i++) {
      const t = {
        x: (i + 0.05 + rnd() * 0.9) * step,
        y: (j + 0.05 + rnd() * 0.9) * step,
        rad: P * (pine ? 0.36 + rnd() * 0.2 : 0.46 + rnd() * 0.26),
        rot: rnd() * 6.28,
        k: rnd(),
        leaves: []
      };
      for (let n = 0; n < 26; n++) t.leaves.push([rnd() * 6.283, Math.sqrt(rnd()), rnd(), rnd()]);
      trees.push(t);
    }
  for (let i = trees.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [trees[i], trees[j]] = [trees[j], trees[i]];
  }
  const col = (t, a = 1) => {
    const c = rampAt(r, t);
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  };
  const shape = (ctx, t, cx, cy, sc) => {
    ctx.beginPath();
    if (pine) {
      const n = 14;
      for (let i = 0; i <= n * 2; i++) {
        const a = t.rot + (i * Math.PI) / n,
          rr = t.rad * sc * (i % 2 ? 0.62 : 1) * (0.92 + 0.08 * Math.sin(i * 2.3 + t.k * 9));
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
    } else {
      ctx.moveTo(cx + t.rad * sc * 0.78, cy);
      ctx.arc(cx, cy, t.rad * sc * 0.78, 0, 7);
      const n = 9;
      for (let i = 0; i < n; i++) {
        const a = t.rot + (i * 6.283) / n,
          lr = t.rad * sc * (0.3 + 0.12 * Math.sin(i * 3.1 + t.k * 7)),
          lx = cx + Math.cos(a) * t.rad * sc * 0.7,
          ly = cy + Math.sin(a) * t.rad * sc * 0.7;
        ctx.moveTo(lx + lr, ly);
        ctx.arc(lx, ly, lr, 0, 7);
      }
    }
  };
  if (!SHOW_TOP) {
    // canopy hidden: forest floor, dappled shade where the crowns are, and the trunks
    x.fillStyle =
      SEASON === 'winter'
        ? 'rgba(214,224,233,.88)'
        : SEASON === 'autumn'
          ? 'rgba(104,74,40,.84)'
          : pine
            ? 'rgba(92,72,48,.84)'
            : 'rgba(80,74,44,.84)';
    x.fillRect(0, 0, S, S);
    const sh = document.createElement('canvas');
    sh.width = sh.height = S;
    const sx = sh.getContext('2d');
    sx.fillStyle = '#000';
    for (const t of trees)
      wrapDraw(t.x, t.y, t.rad * 1.6, S, (ax, ay) => {
        shape(sx, t, ax, ay, 1);
        sx.fill();
      });
    x.save();
    x.globalAlpha = 0.3;
    x.drawImage(sh, 0, 0);
    x.restore(); // no blur: it would show seams where the texture tiles
    for (const t of trees)
      wrapDraw(t.x, t.y, t.rad, S, (ax, ay) => {
        const r = Math.max(1.2, t.rad * (pine ? 0.12 : 0.16));
        x.fillStyle = 'rgba(0,0,0,.45)';
        x.beginPath();
        x.arc(ax + r * 0.3, ay + r * 0.4, r * 1.1, 0, 7);
        x.fill();
        const g = x.createRadialGradient(ax - r * 0.3, ay - r * 0.3, 0, ax, ay, r);
        g.addColorStop(0, '#7a5a3c');
        g.addColorStop(1, '#3a2618');
        x.fillStyle = g;
        x.beginPath();
        x.arc(ax, ay, r, 0, 7);
        x.fill();
      });
    return;
  }
  // ground shadows
  x.save();
  x.filter = `blur(${Math.max(1, P * 0.05).toFixed(1)}px)`;
  x.fillStyle = 'rgba(0,0,0,.55)';
  for (const t of trees)
    wrapDraw(t.x, t.y, t.rad * 1.6, S, (ax, ay) => {
      shape(x, t, ax + P * 0.1, ay + P * 0.13, 1.02);
      x.fill();
    });
  x.restore();
  if (SEASON === 'winter' && !pine) {
    // snowy forest floor, bare branches with a dusting of snow
    x.fillStyle = 'rgba(214,224,233,.86)';
    x.fillRect(0, 0, S, S);
    x.lineCap = 'round';
    for (const t of trees)
      wrapDraw(t.x, t.y, t.rad * 1.4, S, (ax, ay) => {
        const rb = mulberry((t.k * 1e6) | 0),
          br = (bx, by, a, len, w, d) => {
            const ex = bx + Math.cos(a) * len,
              ey = by + Math.sin(a) * len;
            x.strokeStyle = col(0.1, 0.95);
            x.lineWidth = w;
            x.beginPath();
            x.moveTo(bx, by);
            x.lineTo(ex, ey);
            x.stroke();
            x.strokeStyle = 'rgba(240,245,250,.55)';
            x.lineWidth = w * 0.45;
            x.beginPath();
            x.moveTo(bx - w * 0.2, by - w * 0.2);
            x.lineTo(ex - w * 0.2, ey - w * 0.2);
            x.stroke();
            if (d > 0)
              for (const sg of [-1, 1])
                br(ex, ey, a + sg * (0.35 + rb() * 0.4), len * (0.6 + rb() * 0.15), w * 0.62, d - 1);
          };
        const n = 5 + ((rb() * 3) | 0);
        for (let i = 0; i < n; i++) br(ax, ay, t.rot + (i / n) * 6.283, t.rad * 0.42, Math.max(1, t.rad * 0.1), 2);
        x.fillStyle = col(0.25);
        x.beginPath();
        x.arc(ax, ay, t.rad * 0.14, 0, 7);
        x.fill();
      });
    return;
  }
  for (const t of trees)
    wrapDraw(t.x, t.y, t.rad * 1.4, S, (ax, ay) => {
      const gr = x.createRadialGradient(ax - t.rad * 0.4, ay - t.rad * 0.45, t.rad * 0.05, ax, ay, t.rad * 1.15);
      gr.addColorStop(0, col(0.95));
      gr.addColorStop(0.45, col(0.6 + t.k * 0.15));
      gr.addColorStop(1, col(0.12));
      x.fillStyle = col(0.03, 0.8);
      shape(x, t, ax + P * 0.012, ay + P * 0.015, 1.05);
      x.fill();
      x.fillStyle = gr;
      shape(x, t, ax, ay, 1);
      x.fill();
      if (pine) {
        x.fillStyle = col(0.85, 0.35);
        shape(x, { ...t, rot: t.rot + 0.2 }, ax - t.rad * 0.08, ay - t.rad * 0.08, 0.55);
        x.fill();
        x.fillStyle = col(0.15, 0.7);
        x.beginPath();
        x.arc(ax, ay, Math.max(1, t.rad * 0.1), 0, 7);
        x.fill();
        if (SEASON === 'winter') {
          x.fillStyle = 'rgba(244,248,250,.7)';
          for (const [a, dd, q1, q2] of t.leaves)
            if (q1 < 0.5 && Math.cos(a) + Math.sin(a) < 0.3) {
              const d = dd * t.rad * 0.85;
              x.beginPath();
              x.arc(ax + Math.cos(a) * d, ay + Math.sin(a) * d, Math.max(0.7, t.rad * (0.06 + q2 * 0.07)), 0, 7);
              x.fill();
            }
        }
      } else {
        // leaf clusters: lighter towards the light
        for (const [a, dd, q1, q2] of t.leaves) {
          const d = dd * t.rad * 0.82,
            lx = ax + Math.cos(a) * d,
            ly = ay + Math.sin(a) * d;
          const lit = clamp(0.55 - (((Math.cos(a) + Math.sin(a)) * d) / t.rad) * 0.35 + (q1 - 0.5) * 0.2, 0, 1);
          x.fillStyle = col(lit, 0.55);
          x.beginPath();
          x.arc(lx, ly, Math.max(0.7, t.rad * (0.09 + q2 * 0.08)), 0, 7);
          x.fill();
        }
      }
    });
}

// Seasons recolour natural built-in terrains (recoloured customs keep the user's colour).
const SEASON_RAMPS = {
  spring: {
    grass: ['#22401a', '#325c22', '#457a2d', '#5b9438', '#78af47', '#98c95f'],
    forest: ['#11240d', '#1d3e17', '#2d5a22', '#40752d', '#59933b', '#7cb24e']
  },
  autumn: {
    moss: ['#2a2e14', '#3d431b', '#525a22', '#68702c', '#7d8638', '#949c48'],
    grass: ['#38371a', '#524d24', '#6b6330', '#847a3c', '#9c904d', '#b3a662'],
    forest: ['#2a120a', '#4a2210', '#7a3814', '#a8541c', '#c97a28', '#e0a03c'],
    dirt: ['#33241a', '#483323', '#5d432f', '#72543b', '#876748', '#9d7c5a']
  },
  winter: {
    moss: ['#5d6e66', '#7a8a83', '#98a7a1', '#b6c3bf', '#d0dad8', '#e9eff0'],
    grass: ['#8a9aab', '#a5b5c4', '#bdcad6', '#d1dce5', '#e3eaf1', '#f3f7fa'],
    forest: ['#2a2622', '#3d3833', '#554d45', '#6e655c', '#8c857c', '#b3ada6'],
    pine: ['#0d1c16', '#1a2f25', '#2e4a3a', '#7d968b', '#c3d3cc', '#f0f5f3'],
    dirt: ['#4a4541', '#5f5954', '#77706a', '#908982', '#aba59e', '#c8c3bd'],
    deepwater: ['#1c3646', '#24434f', '#2f5262', '#3d6476', '#4f788a', '#668e9f'],
    water: ['#4f7286', '#668b9e', '#7fa4b6', '#9bbecc', '#bad5e0', '#d8eaf0'],
    sand: ['#9a8e74', '#b3a78c', '#c9bea4', '#d9d0ba', '#e6dfce', '#f2eee4']
  }
};
for (const s of Object.values(SEASON_RAMPS)) for (const k in s) s[k] = { ramp: s[k], rgb: s[k].map(hexRgb) };
function seasonal(T) {
  if (T.custom || SEASON === 'summer') return T;
  const o = SEASON_RAMPS[SEASON][T.key];
  if (!o) return T;
  const t = { ...T, ramp: o.ramp, rgb: o.rgb };
  if (SEASON === 'winter' && T.key === 'water') t.edge = { color: 'rgba(240,248,252,.75)', w: 0.25 };
  return t;
}
const texCache = new Map();
function getTexture(tid, P) {
  const key =
    tid + ':' + (TERRAINS[tid].hex || '') + ':' + P + ':' + map.seed + ':' + SEASON + (SHOW_TOP ? '' : ':open');
  let c = texCache.get(key);
  if (!c) {
    const T = seasonal(TERRAINS[tid]);
    c = genTex(T, P, map.seed, T.baseIdx ?? tid);
    texCache.set(key, c);
  }
  return c;
}
