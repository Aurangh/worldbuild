/* ---------- objects: procedural stamps ----------
   Each stamp draws itself centred on (0,0) at R px per square, seeded by the
   object's variant, so the same object always looks the same.             */
const RAMP = {
  stone: ['#33312d', '#4f4b45', '#6b665e', '#878177', '#a49d92', '#c2bbaf'],
  bark: ['#24180f', '#3a2819', '#4f3824', '#664a31', '#7d5d40', '#967352'],
  leaf: ['#0f1f0c', '#1b3415', '#294b1e', '#386228', '#4d7d34', '#6b9a46'],
  pine: ['#0a1912', '#11291d', '#1a3c28', '#255033', '#336641', '#4b8054'],
  bush: ['#1a3612', '#284e1d', '#386828', '#4f8334', '#6a9f43', '#8bbb5a'],
  reed: ['#3e4d1f', '#56672a', '#717f38', '#8d984c', '#a9b165', '#c4c983'],
  grass: ['#1d3616', '#2b4f1f', '#3b6628', '#4d7a31', '#64913d', '#80a952']
};
for (const k in RAMP) RAMP[k] = RAMP[k].map(hexRgb);
const rgba = (r, t, a = 1) => {
  const c = rampAt(r, t);
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
};
function litFill(c, cx, cy, rad, ramp, lo = 0.12, hi = 0.95) {
  const g = c.createRadialGradient(cx - rad * 0.4, cy - rad * 0.45, rad * 0.05, cx, cy, rad * 1.15);
  g.addColorStop(0, rgba(ramp, hi));
  g.addColorStop(0.5, rgba(ramp, (hi + lo) / 1.7));
  g.addColorStop(1, rgba(ramp, lo));
  return g;
}
function linFill(c, x0, y0, x1, y1, ramp, a = 0.85, b = 0.2) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgba(ramp, a));
  g.addColorStop(1, rgba(ramp, b));
  return g;
}
function blobPath(c, cx, cy, rad, n, jit, rnd, rot = 0) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * 6.2832,
      r = rad * (1 - jit + rnd() * jit * 2);
    p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  c.beginPath();
  const m0 = mid(p[n - 1], p[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const q = p[i],
      m = mid(q, p[(i + 1) % n]);
    c.quadraticCurveTo(q[0], q[1], m[0], m[1]);
  }
  c.closePath();
}
function polyPath(c, cx, cy, rad, n, jit, rnd, rot = 0) {
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * 6.2832,
      r = rad * (1 - jit + rnd() * jit * 2);
    c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  c.closePath();
}
function rock(c, x, y, rad, rnd, R) {
  const rot = rnd() * 6.28,
    seedA = (rnd() * 1e6) | 0;
  const r1 = mulberry(seedA);
  c.fillStyle = 'rgba(12,11,10,.9)';
  blobPath(c, x, y, rad * 1.07, 9, 0.2, r1, rot);
  c.fill();
  const r2 = mulberry(seedA);
  c.fillStyle = litFill(c, x, y, rad, RAMP.stone, 0.15, 0.92);
  blobPath(c, x, y, rad, 9, 0.2, r2, rot);
  c.fill();
  c.strokeStyle = 'rgba(20,18,16,.6)';
  c.lineWidth = Math.max(0.6, R / 60);
  c.beginPath();
  const a = rnd() * 6.28;
  c.moveTo(x + Math.cos(a) * rad * 0.8, y + Math.sin(a) * rad * 0.8);
  c.lineTo(x + Math.cos(a + 0.5) * rad * 0.2, y + Math.sin(a + 0.5) * rad * 0.2);
  c.lineTo(x + Math.cos(a + 1.2) * rad * 0.05, y + Math.sin(a + 1.2) * rad * 0.05);
  c.stroke();
  c.fillStyle = 'rgba(255,250,240,.18)';
  c.beginPath();
  c.ellipse(x - rad * 0.35, y - rad * 0.38, rad * 0.3, rad * 0.18, -0.6, 0, 7);
  c.fill();
}
function chips(c, n, spread, rnd, R, size = 0.06) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28,
      d = spread * Math.sqrt(rnd()),
      x = Math.cos(a) * d,
      y = Math.sin(a) * d,
      r = R * size * (0.5 + rnd());
    c.fillStyle = rgba(RAMP.stone, 0.3 + rnd() * 0.55);
    polyPath(c, x, y, r, 4 + ((rnd() * 3) | 0), 0.35, rnd, rnd() * 6);
    c.fill();
    c.strokeStyle = 'rgba(15,13,11,.6)';
    c.lineWidth = Math.max(0.5, R / 80);
    c.stroke();
  }
}
function tuft(c, x, y, n, len, ramp, rnd, R) {
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = rnd() * 6.28,
      l = len * (0.5 + rnd() * 0.5);
    c.strokeStyle = rgba(ramp, 0.2 + rnd() * 0.75);
    c.lineWidth = Math.max(0.6, R / 45);
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(
      x + Math.cos(a) * l * 0.6 + (rnd() - 0.5) * l * 0.3,
      y + Math.sin(a) * l * 0.6,
      x + Math.cos(a) * l,
      y + Math.sin(a) * l
    );
    c.stroke();
  }
}
function blockRect(c, x, y, w, h, rot, R) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = 'rgba(12,11,10,.9)';
  c.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
  c.fillStyle = linFill(c, -w / 2, -h / 2, w / 2, h / 2, RAMP.stone, 0.9, 0.3);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = 'rgba(255,250,240,.12)';
  c.fillRect(-w / 2, -h / 2, w, Math.max(1, h * 0.15));
  c.restore();
}
function treeCrown(c, rad, ramp, rnd, R, nLobes) {
  const lobes = [];
  for (let i = 0; i < nLobes; i++) {
    const a = (i / nLobes) * 6.283 + rnd() * 0.35;
    lobes.push([Math.cos(a) * rad * 0.68, Math.sin(a) * rad * 0.68, rad * (0.3 + rnd() * 0.13)]);
  }
  const shape = k => {
    c.beginPath();
    c.arc(0, 0, rad * 0.76 * k, 0, 7);
    for (const [x, y, r] of lobes) {
      c.moveTo(x * k + r * k, y * k);
      c.arc(x * k, y * k, r * k, 0, 7);
    }
  };
  c.fillStyle = rgba(ramp, 0.02, 0.9);
  shape(1.05);
  c.fill();
  c.fillStyle = litFill(c, 0, 0, rad, ramp);
  shape(1);
  c.fill();
  for (let i = 0; i < 6; i++) {
    const a = rnd() * 6.28,
      d = rad * 0.45 * Math.sqrt(rnd()),
      x = Math.cos(a) * d,
      y = Math.sin(a) * d,
      r = rad * (0.22 + rnd() * 0.12);
    c.globalAlpha = 0.55;
    c.fillStyle = litFill(c, x, y, r, ramp, 0.2, 1);
    c.beginPath();
    c.arc(x, y, r, 0, 7);
    c.fill();
    c.globalAlpha = 1;
  }
  for (let i = 0; i < 70; i++) {
    const a = rnd() * 6.28,
      d = Math.sqrt(rnd()) * rad * 0.85,
      x = Math.cos(a) * d,
      y = Math.sin(a) * d;
    const lit = clamp(0.55 - ((x + y) / rad) * 0.35 + (rnd() - 0.5) * 0.25, 0, 1);
    c.fillStyle = rgba(ramp, lit, 0.5);
    c.beginPath();
    c.arc(x, y, Math.max(0.6, rad * (0.04 + rnd() * 0.05)), 0, 7);
    c.fill();
  }
}

const STAMPS = {
  // ---- nature ----
  oak: {
    cat: 'nature',
    name: 'Tree',
    w: 2,
    h: 2,
    z: 3,
    hg: 2.2,
    draw(c, R, rnd) {
      treeCrown(c, R * 0.95, RAMP.leaf, rnd, R, 8 + ((rnd() * 3) | 0));
    }
  },
  pine: {
    cat: 'nature',
    name: 'Pine',
    w: 1.6,
    h: 1.6,
    z: 3,
    hg: 2.2,
    draw(c, R, rnd) {
      const rot = rnd() * 6.28,
        layers = [
          [1, 0.35],
          [0.7, 0.6],
          [0.42, 0.85]
        ];
      layers.forEach(([k, t], li) => {
        const n = 13,
          rr = R * 0.8 * k;
        c.beginPath();
        for (let i = 0; i <= n * 2; i++) {
          const a = rot + li * 0.25 + (i * Math.PI) / n,
            r = rr * (i % 2 ? 0.6 : 1) * (0.9 + rnd() * 0.12);
          c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        c.closePath();
        if (li === 0) {
          c.fillStyle = rgba(RAMP.pine, 0.02, 0.9);
          c.save();
          c.scale(1.05, 1.05);
          c.fill();
          c.restore();
        }
        c.fillStyle = litFill(c, 0, 0, rr, RAMP.pine, t * 0.4, Math.min(1, t + 0.1));
        c.fill();
      });
      c.fillStyle = rgba(RAMP.bark, 0.3);
      c.beginPath();
      c.arc(0, 0, R * 0.05, 0, 7);
      c.fill();
    }
  },
  dead: {
    cat: 'nature',
    name: 'Dead tree',
    w: 1.8,
    h: 1.8,
    z: 3,
    hg: 1.6,
    draw(c, R, rnd) {
      c.lineCap = 'round';
      const br = (x, y, a, len, w, d) => {
        const x2 = x + Math.cos(a) * len,
          y2 = y + Math.sin(a) * len;
        c.strokeStyle = rgba(RAMP.bark, 0.15);
        c.lineWidth = w + 1.2;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x2, y2);
        c.stroke();
        c.strokeStyle = rgba(RAMP.bark, 0.6);
        c.lineWidth = w * 0.5;
        c.beginPath();
        c.moveTo(x - w * 0.15, y - w * 0.15);
        c.lineTo(x2 - w * 0.15, y2 - w * 0.15);
        c.stroke();
        if (d > 0)
          for (let k = 0; k < 2; k++)
            br(x2, y2, a + (k ? 1 : -1) * (0.3 + rnd() * 0.4), len * (0.55 + rnd() * 0.2), w * 0.6, d - 1);
      };
      const n = 5 + ((rnd() * 3) | 0);
      for (let i = 0; i < n; i++) br(0, 0, (i / n) * 6.28 + rnd() * 0.5, R * (0.32 + rnd() * 0.12), R * 0.09, 2);
      c.fillStyle = litFill(c, 0, 0, R * 0.14, RAMP.bark);
      c.beginPath();
      c.arc(0, 0, R * 0.14, 0, 7);
      c.fill();
    }
  },
  bush: {
    cat: 'nature',
    name: 'Bush',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.9,
    draw(c, R, rnd) {
      treeCrown(c, R * 0.46, RAMP.bush, rnd, R, 7);
      if (rnd() < 0.35) {
        const col = rnd() < 0.5 ? '#c23a3a' : '#5a4fb8';
        for (let i = 0; i < 9; i++) {
          const a = rnd() * 6.28,
            d = R * 0.32 * Math.sqrt(rnd());
          c.fillStyle = col;
          c.beginPath();
          c.arc(Math.cos(a) * d, Math.sin(a) * d, Math.max(0.8, R * 0.025), 0, 7);
          c.fill();
        }
      }
    }
  },
  boulder: {
    cat: 'nature',
    name: 'Boulder',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.8,
    draw(c, R, rnd) {
      rock(c, 0, 0, R * 0.42, rnd, R);
    }
  },
  rocks: {
    cat: 'nature',
    name: 'Rocks',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.4,
    draw(c, R, rnd) {
      const n = 3 + ((rnd() * 3) | 0);
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.28,
          d = R * 0.28 * Math.sqrt(rnd());
        rock(c, Math.cos(a) * d, Math.sin(a) * d, R * (0.09 + rnd() * 0.1), rnd, R);
      }
    }
  },
  log: {
    cat: 'nature',
    name: 'Log',
    w: 2,
    h: 0.5,
    z: 1,
    hg: 0.4,
    draw(c, R, rnd) {
      const L = R * 1.7,
        W = R * 0.36;
      c.fillStyle = 'rgba(12,8,5,.9)';
      c.beginPath();
      c.roundRect(-L / 2 - 1, -W / 2 - 1, L + 2, W + 2, W * 0.3);
      c.fill();
      c.fillStyle = linFill(c, 0, -W / 2, 0, W / 2, RAMP.bark, 0.8, 0.1);
      c.beginPath();
      c.roundRect(-L / 2, -W / 2, L, W, W * 0.3);
      c.fill();
      c.strokeStyle = rgba(RAMP.bark, 0.05, 0.7);
      c.lineWidth = Math.max(0.6, R / 50);
      for (let i = 0; i < 12; i++) {
        const y = (rnd() - 0.5) * W * 0.8,
          x = -L / 2 + rnd() * L * 0.8;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + L * (0.1 + rnd() * 0.2), y + (rnd() - 0.5) * W * 0.15);
        c.stroke();
      }
      c.fillStyle = '#b08758';
      c.beginPath();
      c.ellipse(L / 2 - W * 0.12, 0, W * 0.2, W * 0.48, 0, 0, 7);
      c.fill();
      c.strokeStyle = 'rgba(90,55,25,.6)';
      for (const k of [0.3, 0.6]) {
        c.beginPath();
        c.ellipse(L / 2 - W * 0.12, 0, W * 0.2 * k, W * 0.48 * k, 0, 0, 7);
        c.stroke();
      }
      c.fillStyle = rgba(RAMP.bark, 0.45);
      c.beginPath();
      c.ellipse(-L * 0.1 + rnd() * L * 0.3, -W * 0.55, W * 0.14, W * 0.22, 0.3, 0, 7);
      c.fill();
    }
  },
  stump: {
    cat: 'nature',
    name: 'Stump',
    w: 0.8,
    h: 0.8,
    z: 1,
    hg: 0.4,
    draw(c, R, rnd) {
      const r = R * 0.27;
      c.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28 + rnd() * 0.5;
        c.strokeStyle = rgba(RAMP.bark, 0.3);
        c.lineWidth = R * 0.07;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
        c.lineTo(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45);
        c.stroke();
      }
      c.fillStyle = litFill(c, 0, 0, r, RAMP.bark);
      c.beginPath();
      c.arc(0, 0, r, 0, 7);
      c.fill();
      c.fillStyle = '#ae8352';
      c.beginPath();
      c.arc(0, 0, r * 0.78, 0, 7);
      c.fill();
      c.strokeStyle = 'rgba(95,58,26,.55)';
      c.lineWidth = Math.max(0.6, R / 60);
      for (const k of [0.2, 0.4, 0.6]) {
        c.beginPath();
        c.arc(0, 0, r * k, 0, 7);
        c.stroke();
      }
      c.strokeStyle = 'rgba(40,24,10,.7)';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(r * 0.7, r * 0.2);
      c.stroke();
    }
  },
  reeds: {
    cat: 'nature',
    name: 'Reeds',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.5,
    draw(c, R, rnd) {
      for (let k = 0; k < 3; k++) {
        const x = (rnd() - 0.5) * R * 0.35,
          y = (rnd() - 0.5) * R * 0.35;
        tuft(c, x, y, 14, R * 0.42, RAMP.reed, rnd, R);
        for (let i = 0; i < 3; i++) {
          const a = rnd() * 6.28,
            d = R * (0.2 + rnd() * 0.18);
          c.fillStyle = '#4a2f1a';
          c.beginPath();
          c.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, R * 0.05, R * 0.022, a, 0, 7);
          c.fill();
        }
      }
    }
  },
  mush: {
    cat: 'nature',
    name: 'Mushrooms',
    w: 0.6,
    h: 0.6,
    z: 1,
    hg: 0.2,
    draw(c, R, rnd) {
      const red = rnd() < 0.5,
        n = 3 + ((rnd() * 4) | 0);
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.28,
          d = R * 0.18 * Math.sqrt(rnd()),
          x = Math.cos(a) * d,
          y = Math.sin(a) * d,
          r = R * (0.05 + rnd() * 0.06);
        c.fillStyle = 'rgba(20,10,5,.8)';
        c.beginPath();
        c.arc(x, y, r * 1.1, 0, 7);
        c.fill();
        const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
        g.addColorStop(0, red ? '#e0624f' : '#c39a6b');
        g.addColorStop(1, red ? '#7d1f17' : '#6b4a2b');
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, r, 0, 7);
        c.fill();
        if (red) {
          c.fillStyle = '#f3ead8';
          for (let k = 0; k < 3; k++) {
            c.beginPath();
            c.arc(x + (rnd() - 0.5) * r, y + (rnd() - 0.5) * r, Math.max(0.5, r * 0.16), 0, 7);
            c.fill();
          }
        }
      }
    }
  },
  flowers: {
    cat: 'nature',
    name: 'Flowers',
    w: 1,
    h: 1,
    z: 0,
    hg: 0.1,
    draw(c, R, rnd) {
      tuft(c, 0, 0, 18, R * 0.3, RAMP.grass, rnd, R);
      const cols = ['#e8d44d', '#e86a8a', '#f4f1ea', '#a48ae6', '#e8873c'],
        col = cols[(rnd() * cols.length) | 0];
      for (let i = 0; i < 12; i++) {
        const a = rnd() * 6.28,
          d = R * 0.36 * Math.sqrt(rnd()),
          x = Math.cos(a) * d,
          y = Math.sin(a) * d,
          pr = Math.max(0.8, R * 0.045);
        c.fillStyle = col;
        for (let k = 0; k < 5; k++) {
          const b = (k / 5) * 6.28;
          c.beginPath();
          c.arc(x + Math.cos(b) * pr, y + Math.sin(b) * pr, pr, 0, 7);
          c.fill();
        }
        c.fillStyle = '#f2c230';
        c.beginPath();
        c.arc(x, y, pr * 0.7, 0, 7);
        c.fill();
      }
    }
  },
  tuftg: {
    cat: 'nature',
    name: 'Grass tuft',
    w: 0.7,
    h: 0.7,
    z: 0,
    hg: 0.1,
    draw(c, R, rnd) {
      tuft(c, 0, 0, 22, R * 0.3, RAMP.grass, rnd, R);
    }
  },
  // ---- ruins ----
  ruinwall: {
    cat: 'ruins',
    name: 'Broken wall',
    w: 2,
    h: 0.5,
    z: 2,
    hg: 1,
    draw(c, R, rnd) {
      let x = -R * 0.95;
      const end = R * (0.6 + rnd() * 0.35),
        bh = R * 0.32;
      while (x < end) {
        const bw = R * (0.26 + rnd() * 0.16);
        if (rnd() > 0.1) blockRect(c, x + bw / 2, (rnd() - 0.5) * R * 0.04, bw * 0.96, bh, (rnd() - 0.5) * 0.06, R);
        x += bw;
      }
      for (let i = 0; i < 3; i++)
        blockRect(
          c,
          end + R * (0.1 + rnd() * 0.2),
          (rnd() - 0.5) * R * 0.4,
          R * (0.12 + rnd() * 0.1),
          R * (0.1 + rnd() * 0.08),
          rnd() * 3,
          R
        );
      chips(c, 10, R * 0.8, rnd, R, 0.04);
    }
  },
  pillar: {
    cat: 'ruins',
    name: 'Pillar',
    w: 1,
    h: 1,
    z: 2,
    hg: 2.5,
    draw(c, R, rnd) {
      const s = R * 0.44;
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.fillRect(-s - 1, -s - 1, 2 * s + 2, 2 * s + 2);
      c.fillStyle = linFill(c, -s, -s, s, s, RAMP.stone, 0.7, 0.15);
      c.fillRect(-s, -s, 2 * s, 2 * s);
      const r = R * 0.34;
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.beginPath();
      c.arc(0, 0, r + 1.2, 0, 7);
      c.fill();
      c.fillStyle = litFill(c, 0, 0, r, RAMP.stone, 0.2, 0.98);
      c.beginPath();
      c.arc(0, 0, r, 0, 7);
      c.fill();
      c.strokeStyle = 'rgba(30,28,25,.4)';
      c.lineWidth = Math.max(0.6, R / 60);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 6.28;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
        c.lineTo(Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97);
        c.stroke();
      }
      if (rnd() < 0.4) {
        c.fillStyle = 'rgba(40,37,33,.55)';
        polyPath(c, 0, 0, r * 0.62, 9, 0.35, rnd);
        c.fill();
        chips(c, 6, R * 0.45, rnd, R, 0.04);
      }
    }
  },
  fallen: {
    cat: 'ruins',
    name: 'Fallen pillar',
    w: 2.4,
    h: 0.8,
    z: 2,
    hg: 0.7,
    draw(c, R, rnd) {
      const W = R * 0.3;
      let x = -R * 1.1;
      for (let i = 0; i < 3; i++) {
        const L = R * (0.55 + rnd() * 0.25),
          cx = x + L / 2,
          cy = (rnd() - 0.5) * R * 0.12,
          rot = (rnd() - 0.5) * 0.25;
        c.save();
        c.translate(cx, cy);
        c.rotate(rot);
        c.fillStyle = 'rgba(12,11,10,.9)';
        c.fillRect(-L / 2 - 1, -W - 1, L + 2, 2 * W + 2);
        const g = c.createLinearGradient(0, -W, 0, W);
        g.addColorStop(0, rgba(RAMP.stone, 0.95));
        g.addColorStop(0.45, rgba(RAMP.stone, 0.7));
        g.addColorStop(1, rgba(RAMP.stone, 0.15));
        c.fillStyle = g;
        c.fillRect(-L / 2, -W, L, 2 * W);
        c.strokeStyle = 'rgba(30,28,25,.35)';
        c.lineWidth = Math.max(0.6, R / 60);
        for (const k of [-0.6, -0.2, 0.2, 0.6]) {
          c.beginPath();
          c.moveTo(-L / 2, k * W);
          c.lineTo(L / 2, k * W);
          c.stroke();
        }
        c.fillStyle = rgba(RAMP.stone, 0.45);
        c.beginPath();
        c.ellipse(L / 2, 0, W * 0.25, W, 0, 0, 7);
        c.fill();
        c.strokeStyle = 'rgba(12,11,10,.8)';
        c.stroke();
        c.restore();
        x += L + R * 0.07;
      }
      chips(c, 8, R * 1.1, rnd, R, 0.045);
    }
  },
  rubble: {
    cat: 'ruins',
    name: 'Rubble',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.25,
    draw(c, R, rnd) {
      chips(c, 18 + ((rnd() * 10) | 0), R * 0.42, rnd, R, 0.085);
    }
  },
  statue: {
    cat: 'ruins',
    name: 'Statue',
    w: 1,
    h: 1,
    z: 2,
    hg: 2.2,
    draw(c, R, rnd) {
      const s = R * 0.42;
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.fillRect(-s - 1, -s - 1, 2 * s + 2, 2 * s + 2);
      c.fillStyle = linFill(c, -s, -s, s, s, RAMP.stone, 0.55, 0.1);
      c.fillRect(-s, -s, 2 * s, 2 * s);
      const s2 = R * 0.34;
      c.fillStyle = linFill(c, -s2, -s2, s2, s2, RAMP.stone, 0.75, 0.25);
      c.fillRect(-s2, -s2, 2 * s2, 2 * s2);
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.beginPath();
      c.ellipse(0, R * 0.02, R * 0.27, R * 0.19, 0, 0, 7);
      c.fill();
      c.fillStyle = litFill(c, 0, R * 0.02, R * 0.26, RAMP.stone, 0.25, 0.95);
      c.beginPath();
      c.ellipse(0, R * 0.02, R * 0.25, R * 0.17, 0, 0, 7);
      c.fill();
      c.strokeStyle = 'rgba(12,11,10,.85)';
      c.lineWidth = R * 0.05;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(R * 0.18, -R * 0.02);
      c.lineTo(R * 0.2, -R * 0.3);
      c.stroke();
      c.strokeStyle = rgba(RAMP.stone, 0.85);
      c.lineWidth = R * 0.025;
      c.stroke();
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.beginPath();
      c.arc(0, -R * 0.01, R * 0.105, 0, 7);
      c.fill();
      c.fillStyle = litFill(c, 0, -R * 0.01, R * 0.095, RAMP.stone, 0.35, 1);
      c.beginPath();
      c.arc(0, -R * 0.01, R * 0.095, 0, 7);
      c.fill();
    }
  },
  arch: {
    cat: 'ruins',
    name: 'Fallen arch',
    w: 2.2,
    h: 0.7,
    z: 2,
    hg: 1.2,
    draw(c, R, rnd) {
      for (const sx of [-1, 1]) blockRect(c, sx * R * 0.8, 0, R * 0.4, R * 0.4, 0, R);
      for (let i = 0; i < 7; i++) {
        const t = i / 6,
          x = -R * 0.55 + t * R * 1.1 + (rnd() - 0.5) * R * 0.1,
          y = Math.sin(t * Math.PI) * R * 0.18 * (rnd() < 0.5 ? 1 : -1) + (rnd() - 0.5) * R * 0.1;
        blockRect(c, x, y, R * 0.2, R * 0.14, t * 1.5 - 0.75 + (rnd() - 0.5) * 0.8, R);
      }
      chips(c, 8, R * 0.9, rnd, R, 0.04);
    }
  },
  tiles: {
    cat: 'ruins',
    name: 'Old tiles',
    w: 1.5,
    h: 1.5,
    z: 0,
    hg: 0.05,
    draw(c, R, rnd) {
      const n = 3,
        cs = R * 0.46,
        o = (-cs * n) / 2;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++)
          if (rnd() < 0.8) {
            const x = o + i * cs + cs / 2 + (rnd() - 0.5) * R * 0.04,
              y = o + j * cs + cs / 2 + (rnd() - 0.5) * R * 0.04;
            c.save();
            c.translate(x, y);
            c.rotate((rnd() - 0.5) * 0.12);
            c.fillStyle = 'rgba(15,13,11,.8)';
            c.fillRect(-cs * 0.46, -cs * 0.46, cs * 0.92, cs * 0.92);
            c.fillStyle = linFill(c, -cs / 2, -cs / 2, cs / 2, cs / 2, RAMP.stone, 0.65 + rnd() * 0.2, 0.25);
            c.fillRect(-cs * 0.43, -cs * 0.43, cs * 0.86, cs * 0.86);
            c.restore();
          }
      for (let i = 0; i < 8; i++)
        tuft(
          c,
          o + ((rnd() * n) | 0) * cs + (rnd() < 0.5 ? 0 : cs),
          o + rnd() * cs * n,
          6,
          R * 0.12,
          RAMP.grass,
          rnd,
          R
        );
    }
  }
};
// ---- phase 4 stamps: dungeon, furniture, camp ----
Object.assign(RAMP, {
  wood: ['#2a190d', '#3e2614', '#54341c', '#6a4325', '#81542e', '#99673a'].map(hexRgb),
  cloth: ['#3a0f0f', '#5a1a18', '#7a2522', '#97332c', '#b4473a', '#cc6a55'].map(hexRgb),
  canvas: ['#4f4636', '#6d624d', '#8b7e64', '#a8997c', '#c3b595', '#dbcfb0'].map(hexRgb),
  metal: ['#16171a', '#26282c', '#383b40', '#50535a', '#6c6f77', '#8c8f97'].map(hexRgb)
});
function plankRect(c, x, y, w, h, rot, R, alongX = true, ramp = RAMP.wood, rnd = Math.random) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = 'rgba(14,8,4,.92)';
  c.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
  const minor = alongX ? h : w,
    n = Math.max(1, Math.round(minor / (R * 0.13)));
  for (let i = 0; i < n; i++) {
    const t = 0.35 + rnd() * 0.35;
    if (alongX) {
      const yy = -h / 2 + (h * i) / n;
      c.fillStyle = linFill(c, 0, yy, 0, yy + h / n, ramp, t + 0.2, t - 0.15);
      c.fillRect(-w / 2, yy, w, h / n);
    } else {
      const xx = -w / 2 + (w * i) / n;
      c.fillStyle = linFill(c, xx, 0, xx + w / n, 0, ramp, t + 0.2, t - 0.15);
      c.fillRect(xx, -h / 2, w / n, h);
    }
  }
  c.strokeStyle = 'rgba(20,10,4,.55)';
  c.lineWidth = Math.max(0.5, R / 70);
  c.beginPath();
  for (let i = 1; i < n; i++) {
    if (alongX) {
      const yy = -h / 2 + (h * i) / n;
      c.moveTo(-w / 2, yy);
      c.lineTo(w / 2, yy);
    } else {
      const xx = -w / 2 + (w * i) / n;
      c.moveTo(xx, -h / 2);
      c.lineTo(xx, h / 2);
    }
  }
  c.stroke();
  c.restore();
}
const disc = (c, x, y, r, fill) => {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, 7);
  c.fill();
};
function flame(c, x, y, r) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, '#fff6c8');
  g.addColorStop(0.35, '#ffc240');
  g.addColorStop(0.75, '#e2561a');
  g.addColorStop(1, 'rgba(160,30,10,0)');
  disc(c, x, y, r, g);
}
function logEnd(c, x, y, r) {
  disc(c, x, y, r + 1, 'rgba(14,8,4,.9)');
  disc(c, x, y, r, '#5c3d22');
  disc(c, x, y, r * 0.78, '#b08a5a');
  c.strokeStyle = 'rgba(95,58,26,.6)';
  c.lineWidth = Math.max(0.5, r / 8);
  c.beginPath();
  c.arc(x, y, r * 0.45, 0, 7);
  c.stroke();
}

Object.assign(STAMPS, {
  // ---- dungeon ----
  chest: {
    cat: 'dungeon',
    name: 'Chest',
    w: 1,
    h: 0.7,
    z: 2,
    hg: 0.6,
    tint: 'wood',
    draw(c, R, rnd) {
      const w = R * 0.72,
        h = R * 0.46;
      plankRect(c, 0, 0, w, h, 0, R, true, RAMP.wood, rnd);
      c.fillStyle = rgba(RAMP.metal, 0.35);
      for (const x of [-w * 0.32, w * 0.32]) c.fillRect(x - R * 0.035, -h / 2, R * 0.07, h);
      c.fillStyle = 'rgba(14,8,4,.7)';
      c.fillRect(-w / 2, -h * 0.08, w, Math.max(1, R * 0.02));
      c.fillStyle = '#d4ac5e';
      c.fillRect(-R * 0.045, -h * 0.12, R * 0.09, R * 0.1);
    }
  },
  altar: {
    cat: 'dungeon',
    name: 'Altar',
    w: 2,
    h: 1,
    z: 2,
    hg: 0.8,
    tint: 'stone',
    draw(c, R, rnd) {
      const w = R * 1.7,
        h = R * 0.8;
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
      c.fillStyle = linFill(c, -w / 2, -h / 2, w / 2, h / 2, RAMP.stone, 0.7, 0.2);
      c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = linFill(c, -w / 2, -h / 2, w / 2, h / 2, RAMP.stone, 0.9, 0.45);
      c.fillRect(-w * 0.44, -h * 0.38, w * 0.88, h * 0.76);
      c.fillStyle = rgba(RAMP.cloth, 0.55);
      c.fillRect(-R * 0.18, -h / 2, R * 0.36, h);
      for (const x of [-w * 0.36, w * 0.36]) {
        disc(c, x, 0, R * 0.06, '#efe6cf');
        flame(c, x, 0, R * 0.07);
      }
    }
  },
  sarco: {
    cat: 'dungeon',
    name: 'Sarcophagus',
    w: 1,
    h: 2,
    z: 2,
    hg: 0.8,
    tint: 'stone',
    draw(c, R, rnd) {
      const w = R * 0.78,
        h = R * 1.75;
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.beginPath();
      c.roundRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, R * 0.12);
      c.fill();
      c.fillStyle = linFill(c, -w / 2, -h / 2, w / 2, h / 2, RAMP.stone, 0.8, 0.25);
      c.beginPath();
      c.roundRect(-w / 2, -h / 2, w, h, R * 0.1);
      c.fill();
      c.strokeStyle = 'rgba(30,28,25,.55)';
      c.lineWidth = Math.max(0.7, R / 45);
      c.beginPath();
      c.roundRect(-w * 0.38, -h * 0.44, w * 0.76, h * 0.88, R * 0.08);
      c.stroke();
      c.beginPath();
      c.arc(0, -h * 0.3, R * 0.12, 0, 7);
      c.stroke();
      c.beginPath();
      c.moveTo(-w * 0.2, -h * 0.18);
      c.lineTo(-w * 0.14, h * 0.36);
      c.lineTo(w * 0.14, h * 0.36);
      c.lineTo(w * 0.2, -h * 0.18);
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(-w * 0.12, -h * 0.05);
      c.lineTo(w * 0.12, h * 0.05);
      c.moveTo(w * 0.12, -h * 0.05);
      c.lineTo(-w * 0.12, h * 0.05);
      c.stroke();
    }
  },
  brazier: {
    cat: 'dungeon',
    name: 'Brazier',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.9,
    draw(c, R, rnd) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * 6.28 + 0.5;
        c.fillStyle = rgba(RAMP.metal, 0.3);
        c.fillRect(Math.cos(a) * R * 0.3 - R * 0.03, Math.sin(a) * R * 0.3 - R * 0.03, R * 0.06, R * 0.06);
      }
      disc(c, 0, 0, R * 0.3, 'rgba(10,10,12,.95)');
      disc(c, 0, 0, R * 0.27, litFill(c, 0, 0, R * 0.27, RAMP.metal, 0.1, 0.7));
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.21);
      g.addColorStop(0, '#ffcf5a');
      g.addColorStop(0.5, '#e2561a');
      g.addColorStop(1, '#5a1206');
      disc(c, 0, 0, R * 0.21, g);
      for (let i = 0; i < 4; i++)
        flame(c, (rnd() - 0.5) * R * 0.16, (rnd() - 0.5) * R * 0.16, R * (0.08 + rnd() * 0.06));
    }
  },
  bones: {
    cat: 'dungeon',
    name: 'Bones',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.1,
    draw(c, R, rnd) {
      c.lineCap = 'round';
      const bone = '#e6dcc6';
      for (let i = 0; i < 5; i++) {
        const a = rnd() * 6.28,
          x = (rnd() - 0.5) * R * 0.55,
          y = (rnd() - 0.5) * R * 0.55,
          l = R * (0.12 + rnd() * 0.14),
          dx = Math.cos(a) * l,
          dy = Math.sin(a) * l;
        c.strokeStyle = 'rgba(30,26,20,.8)';
        c.lineWidth = R * 0.06;
        c.beginPath();
        c.moveTo(x - dx, y - dy);
        c.lineTo(x + dx, y + dy);
        c.stroke();
        c.strokeStyle = bone;
        c.lineWidth = R * 0.035;
        c.stroke();
        disc(c, x - dx, y - dy, R * 0.03, bone);
        disc(c, x + dx, y + dy, R * 0.03, bone);
      }
      const sx = (rnd() - 0.5) * R * 0.2,
        sy = (rnd() - 0.5) * R * 0.2;
      disc(c, sx, sy, R * 0.12, 'rgba(30,26,20,.85)');
      disc(c, sx, sy, R * 0.105, bone);
      disc(c, sx - R * 0.04, sy + R * 0.01, R * 0.025, '#2a2520');
      disc(c, sx + R * 0.04, sy + R * 0.01, R * 0.025, '#2a2520');
    }
  },
  torch: {
    cat: 'dungeon',
    name: 'Torch',
    w: 0.5,
    h: 0.5,
    z: 3,
    hg: 0.3,
    light: 4,
    draw(c, R, rnd) {
      c.fillStyle = rgba(RAMP.metal, 0.3);
      c.fillRect(-R * 0.05, -R * 0.03, R * 0.1, R * 0.16);
      disc(c, 0, 0, R * 0.07, '#2a1a0e');
      flame(c, 0, -R * 0.02, R * 0.13);
    }
  },
  lantern: {
    cat: 'dungeon',
    name: 'Lantern',
    w: 0.5,
    h: 0.5,
    z: 3,
    hg: 0.3,
    light: 3,
    draw(c, R, rnd) {
      const s = R * 0.2;
      c.fillStyle = 'rgba(10,10,12,.95)';
      c.fillRect(-s / 2 - 1, -s / 2 - 1, s + 2, s + 2);
      c.fillStyle = '#ffd77a';
      c.fillRect(-s / 2, -s / 2, s, s);
      c.strokeStyle = '#1c1d20';
      c.lineWidth = Math.max(1, R * 0.025);
      c.strokeRect(-s / 2, -s / 2, s, s);
      c.beginPath();
      c.moveTo(0, -s / 2);
      c.lineTo(0, s / 2);
      c.moveTo(-s / 2, 0);
      c.lineTo(s / 2, 0);
      c.stroke();
    }
  },
  pit: {
    cat: 'dungeon',
    name: 'Pit',
    w: 1,
    h: 1,
    z: 0,
    hg: 0,
    draw(c, R, rnd) {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.44);
      g.addColorStop(0, '#000');
      g.addColorStop(0.7, '#0d0c0b');
      g.addColorStop(1, 'rgba(30,28,26,.9)');
      c.fillStyle = g;
      blobPath(c, 0, 0, R * 0.44, 10, 0.1, rnd);
      c.fill();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.28 + rnd() * 0.3;
        rock(c, Math.cos(a) * R * 0.44, Math.sin(a) * R * 0.44, R * (0.05 + rnd() * 0.04), rnd, R);
      }
    }
  },
  trapdoor: {
    cat: 'dungeon',
    name: 'Trapdoor',
    w: 1,
    h: 1,
    z: 0,
    hg: 0.05,
    tint: 'wood',
    draw(c, R, rnd) {
      const s = R * 0.78;
      plankRect(c, 0, 0, s, s, 0, R, false, RAMP.wood, rnd);
      c.fillStyle = rgba(RAMP.metal, 0.3);
      for (const y of [-s * 0.3, s * 0.3]) c.fillRect(-s / 2, y - R * 0.03, s * 0.3, R * 0.06);
      c.strokeStyle = rgba(RAMP.metal, 0.7);
      c.lineWidth = Math.max(1, R * 0.03);
      c.beginPath();
      c.arc(s * 0.28, 0, R * 0.07, 0, 7);
      c.stroke();
    }
  },
  // ---- furniture ----
  table: {
    cat: 'furniture',
    name: 'Table',
    w: 2,
    h: 1,
    z: 2,
    hg: 0.5,
    tint: 'wood',
    draw(c, R, rnd) {
      plankRect(c, 0, 0, R * 1.7, R * 0.85, 0, R, true, RAMP.wood, rnd);
      if (rnd() < 0.7) {
        disc(c, -R * 0.4, -R * 0.1, R * 0.08, 'rgba(14,8,4,.8)');
        disc(c, -R * 0.4, -R * 0.1, R * 0.065, '#9a9184');
        disc(c, R * 0.3, R * 0.12, R * 0.1, 'rgba(14,8,4,.8)');
        disc(c, R * 0.3, R * 0.12, R * 0.085, '#c8c0b0');
      }
    }
  },
  rtable: {
    cat: 'furniture',
    name: 'Round table',
    w: 1.5,
    h: 1.5,
    z: 2,
    hg: 0.5,
    tint: 'wood',
    draw(c, R, rnd) {
      const r = R * 0.62;
      disc(c, 0, 0, r + 1.2, 'rgba(14,8,4,.92)');
      disc(c, 0, 0, r, litFill(c, 0, 0, r, RAMP.wood, 0.3, 0.85));
      c.strokeStyle = 'rgba(40,22,8,.35)';
      c.lineWidth = Math.max(0.5, R / 70);
      for (const k of [0.3, 0.55, 0.8]) {
        c.beginPath();
        c.arc(0, 0, r * k, 0, 7);
        c.stroke();
      }
    }
  },
  chair: {
    cat: 'furniture',
    name: 'Chair',
    w: 0.6,
    h: 0.6,
    z: 2,
    hg: 0.4,
    tint: 'wood',
    draw(c, R, rnd) {
      plankRect(c, 0, R * 0.03, R * 0.4, R * 0.36, 0, R, false, RAMP.wood, rnd);
      plankRect(c, 0, -R * 0.19, R * 0.44, R * 0.08, 0, R, true, RAMP.wood, rnd);
    }
  },
  bed: {
    cat: 'furniture',
    name: 'Bed',
    w: 1,
    h: 2,
    z: 2,
    hg: 0.5,
    tint: 'cloth',
    draw(c, R, rnd) {
      const w = R * 0.9,
        h = R * 1.8;
      plankRect(c, 0, 0, w, h, 0, R, false, RAMP.wood, rnd);
      c.fillStyle = '#ece5d6';
      c.beginPath();
      c.roundRect(-w * 0.4, -h * 0.44, w * 0.8, h * 0.16, R * 0.06);
      c.fill();
      c.fillStyle = linFill(c, 0, -h * 0.2, 0, h / 2, RAMP.cloth, 0.75, 0.3);
      c.beginPath();
      c.roundRect(-w * 0.45, -h * 0.22, w * 0.9, h * 0.68, R * 0.05);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.15)';
      c.fillRect(-w * 0.45, -h * 0.22, w * 0.9, h * 0.05);
    }
  },
  shelf: {
    cat: 'furniture',
    name: 'Bookshelf',
    w: 2,
    h: 0.5,
    z: 2,
    hg: 1.2,
    tint: 'wood',
    draw(c, R, rnd) {
      const w = R * 1.8,
        h = R * 0.4;
      plankRect(c, 0, 0, w, h, 0, R, true, RAMP.wood, rnd);
      const cols = ['#7a2522', '#2f4f7a', '#3d6b3a', '#7a6a2a', '#5a3a6b', '#8a5a2a'];
      let x = -w * 0.46;
      while (x < w * 0.44) {
        const bw = R * (0.04 + rnd() * 0.05);
        c.fillStyle = cols[(rnd() * cols.length) | 0];
        c.fillRect(x, -h * 0.32, bw, h * (0.5 + rnd() * 0.14));
        x += bw + R * 0.008;
      }
    }
  },
  barrel: {
    cat: 'furniture',
    name: 'Barrel',
    w: 0.8,
    h: 0.8,
    z: 2,
    hg: 0.6,
    tint: 'wood',
    draw(c, R, rnd) {
      const r = R * 0.33;
      disc(c, 0, 0, r + 1.2, 'rgba(14,8,4,.92)');
      disc(c, 0, 0, r, litFill(c, 0, 0, r, RAMP.wood, 0.25, 0.85));
      c.save();
      c.beginPath();
      c.arc(0, 0, r, 0, 7);
      c.clip();
      c.strokeStyle = 'rgba(30,15,5,.5)';
      c.lineWidth = Math.max(0.5, R / 70);
      for (let i = -3; i <= 3; i++) {
        c.beginPath();
        c.moveTo((i * r) / 3.5, -r);
        c.lineTo((i * r) / 3.5, r);
        c.stroke();
      }
      c.restore();
      c.strokeStyle = rgba(RAMP.metal, 0.25);
      c.lineWidth = Math.max(1, R * 0.035);
      for (const k of [0.98, 0.7]) {
        c.beginPath();
        c.arc(0, 0, r * k, 0, 7);
        c.stroke();
      }
    }
  },
  crate: {
    cat: 'furniture',
    name: 'Crate',
    w: 0.8,
    h: 0.8,
    z: 2,
    hg: 0.6,
    tint: 'wood',
    draw(c, R, rnd) {
      const s = R * 0.64;
      plankRect(c, 0, 0, s, s, 0, R, true, RAMP.wood, rnd);
      c.strokeStyle = rgba(RAMP.wood, 0.15);
      c.lineWidth = R * 0.07;
      c.strokeRect(-s / 2 + R * 0.035, -s / 2 + R * 0.035, s - R * 0.07, s - R * 0.07);
      c.beginPath();
      c.moveTo(-s / 2 + R * 0.05, -s / 2 + R * 0.05);
      c.lineTo(s / 2 - R * 0.05, s / 2 - R * 0.05);
      c.stroke();
      c.strokeStyle = rgba(RAMP.wood, 0.75);
      c.lineWidth = R * 0.025;
      c.stroke();
    }
  },
  sacks: {
    cat: 'furniture',
    name: 'Sacks',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.5,
    tint: 'canvas',
    draw(c, R, rnd) {
      const n = 2 + ((rnd() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const x = (rnd() - 0.5) * R * 0.4,
          y = (rnd() - 0.5) * R * 0.4,
          r = R * (0.17 + rnd() * 0.05);
        c.fillStyle = 'rgba(20,15,8,.9)';
        blobPath(c, x, y, r * 1.06, 7, 0.12, mulberry(i + 3));
        c.fill();
        c.fillStyle = litFill(c, x, y, r, RAMP.canvas, 0.2, 0.95);
        blobPath(c, x, y, r, 7, 0.12, mulberry(i + 3));
        c.fill();
        disc(c, x - r * 0.2, y - r * 0.25, r * 0.14, rgba(RAMP.canvas, 0.2));
      }
    }
  },
  rug: {
    cat: 'furniture',
    name: 'Rug',
    w: 2,
    h: 1.4,
    z: 0,
    hg: 0.02,
    tint: 'cloth',
    draw(c, R, rnd) {
      const w = R * 1.8,
        h = R * 1.2;
      c.fillStyle = rgba(RAMP.cloth, 0.4);
      c.fillRect(-w / 2, -h / 2, w, h);
      c.strokeStyle = '#d9c38c';
      c.lineWidth = R * 0.05;
      c.strokeRect(-w / 2 + R * 0.08, -h / 2 + R * 0.08, w - R * 0.16, h - R * 0.16);
      c.fillStyle = rgba(RAMP.cloth, 0.75);
      c.fillRect(-w / 2 + R * 0.16, -h / 2 + R * 0.16, w - R * 0.32, h - R * 0.32);
      c.strokeStyle = '#d9c38c';
      c.lineWidth = R * 0.025;
      c.beginPath();
      c.moveTo(0, -h * 0.28);
      c.lineTo(w * 0.2, 0);
      c.lineTo(0, h * 0.28);
      c.lineTo(-w * 0.2, 0);
      c.closePath();
      c.stroke();
      c.strokeStyle = '#e7dcc0';
      c.lineWidth = Math.max(0.5, R / 70);
      for (let i = 0; i < 16; i++) {
        const y = -h / 2 + (h * (i + 0.5)) / 16;
        for (const sx of [-1, 1]) {
          c.beginPath();
          c.moveTo((sx * w) / 2, y);
          c.lineTo(sx * (w / 2 + R * 0.06), y);
          c.stroke();
        }
      }
    }
  },
  // ---- camp & outdoor ----
  tent: {
    cat: 'camp',
    name: 'Tent',
    w: 2,
    h: 2,
    z: 3,
    hg: 1.2,
    tint: 'canvas',
    draw(c, R, rnd) {
      const w = R * 1.3,
        h = R * 1.5;
      c.strokeStyle = 'rgba(60,45,30,.8)';
      c.lineWidth = Math.max(0.6, R / 60);
      for (const [px, py] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ]) {
        c.beginPath();
        c.moveTo(px * w * 0.5, py * h * 0.45);
        c.lineTo(px * w * 0.72, py * h * 0.62);
        c.stroke();
        disc(c, px * w * 0.72, py * h * 0.62, R * 0.025, '#3a2a1a');
      }
      c.fillStyle = 'rgba(14,10,6,.9)';
      c.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
      c.fillStyle = linFill(c, -w / 2, 0, 0, 0, RAMP.canvas, 0.95, 0.7);
      c.fillRect(-w / 2, -h / 2, w / 2, h);
      c.fillStyle = linFill(c, 0, 0, w / 2, 0, RAMP.canvas, 0.35, 0.15);
      c.fillRect(0, -h / 2, w / 2, h);
      c.strokeStyle = 'rgba(40,30,18,.85)';
      c.lineWidth = Math.max(1, R / 30);
      c.beginPath();
      c.moveTo(0, -h / 2);
      c.lineTo(0, h / 2);
      c.stroke();
      c.fillStyle = 'rgba(20,14,8,.85)';
      c.beginPath();
      c.moveTo(-w * 0.18, h / 2);
      c.lineTo(0, h * 0.3);
      c.lineTo(w * 0.18, h / 2);
      c.closePath();
      c.fill();
    }
  },
  fire: {
    cat: 'camp',
    name: 'Campfire',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.2,
    draw(c, R, rnd) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * 6.28;
        rock(c, Math.cos(a) * R * 0.34, Math.sin(a) * R * 0.34, R * 0.075, rnd, R);
      }
      disc(c, 0, 0, R * 0.27, '#1a120c');
      c.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * 3.14 + rnd() * 0.4;
        c.strokeStyle = '#2a1a0e';
        c.lineWidth = R * 0.09;
        c.beginPath();
        c.moveTo(Math.cos(a) * R * 0.22, Math.sin(a) * R * 0.22);
        c.lineTo(-Math.cos(a) * R * 0.22, -Math.sin(a) * R * 0.22);
        c.stroke();
      }
      flame(c, 0, 0, R * 0.2);
      flame(c, R * 0.05, -R * 0.04, R * 0.12);
    }
  },
  bedroll: {
    cat: 'camp',
    name: 'Bedroll',
    w: 0.7,
    h: 1.6,
    z: 1,
    hg: 0.2,
    tint: 'cloth',
    draw(c, R, rnd) {
      const w = R * 0.55,
        h = R * 1.45;
      c.fillStyle = 'rgba(14,8,4,.85)';
      c.beginPath();
      c.roundRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, R * 0.12);
      c.fill();
      c.fillStyle = linFill(c, -w / 2, 0, w / 2, 0, RAMP.cloth, 0.8, 0.35);
      c.beginPath();
      c.roundRect(-w / 2, -h / 2, w, h, R * 0.12);
      c.fill();
      c.fillStyle = linFill(c, 0, -h / 2, 0, -h * 0.25, RAMP.canvas, 0.9, 0.5);
      c.beginPath();
      c.roundRect(-w / 2, -h / 2, w, h * 0.22, R * 0.1);
      c.fill();
    }
  },
  wagon: {
    cat: 'camp',
    name: 'Wagon',
    w: 1.6,
    h: 2.6,
    z: 3,
    hg: 1,
    tint: 'wood',
    draw(c, R, rnd) {
      c.strokeStyle = rgba(RAMP.wood, 0.3);
      c.lineWidth = R * 0.06;
      c.beginPath();
      c.moveTo(0, -R * 0.9);
      c.lineTo(0, -R * 1.25);
      c.moveTo(-R * 0.15, -R * 1.25);
      c.lineTo(R * 0.15, -R * 1.25);
      c.stroke();
      for (const sx of [-1, 1])
        for (const sy of [-1, 1]) {
          c.fillStyle = '#16120e';
          c.fillRect(sx * R * 0.62 - R * 0.07, sy * R * 0.55 - R * 0.22, R * 0.14, R * 0.44);
        }
      plankRect(c, 0, 0, R * 1.15, R * 1.85, 0, R, false, RAMP.wood, rnd);
      c.strokeStyle = 'rgba(14,8,4,.8)';
      c.lineWidth = R * 0.06;
      c.strokeRect(-R * 0.55, -R * 0.9, R * 1.1, R * 1.8);
    }
  },
  well: {
    cat: 'camp',
    name: 'Well',
    w: 1.2,
    h: 1.2,
    z: 2,
    hg: 0.8,
    tint: 'stone',
    draw(c, R, rnd) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 6.28;
        c.save();
        c.translate(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42);
        c.rotate(a);
        blockRect(c, 0, 0, R * 0.16, R * 0.2, 0, R);
        c.restore();
      }
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.32);
      g.addColorStop(0, '#0c2230');
      g.addColorStop(1, '#050608');
      disc(c, 0, 0, R * 0.32, g);
      plankRect(c, 0, 0, R * 1.15, R * 0.12, 0, R, true, RAMP.wood, rnd);
    }
  },
  fence: {
    cat: 'camp',
    name: 'Fence',
    w: 2,
    h: 0.3,
    z: 2,
    hg: 0.5,
    tint: 'wood',
    draw(c, R, rnd) {
      for (const y of [-R * 0.04, R * 0.04]) plankRect(c, 0, y, R * 2, R * 0.05, 0, R, true, RAMP.wood, rnd);
      for (let i = 0; i < 5; i++) {
        const x = -R * 0.96 + i * R * 0.48;
        disc(c, x, 0, R * 0.075, 'rgba(14,8,4,.9)');
        disc(c, x, 0, R * 0.06, litFill(c, x, 0, R * 0.06, RAMP.wood, 0.3, 0.9));
      }
    }
  },
  bridge: {
    cat: 'camp',
    name: 'Bridge',
    w: 1.2,
    h: 3,
    z: 1,
    hg: 0.3,
    tint: 'wood',
    draw(c, R, rnd) {
      const w = R * 1.1,
        h = R * 2.9;
      plankRect(c, 0, 0, w, h, 0, R, true, RAMP.wood, rnd);
      for (const sx of [-1, 1]) {
        c.strokeStyle = 'rgba(14,8,4,.85)';
        c.lineWidth = R * 0.06;
        c.beginPath();
        c.moveTo(sx * w * 0.47, -h / 2);
        c.lineTo(sx * w * 0.47, h / 2);
        c.stroke();
        c.strokeStyle = '#a58a5c';
        c.lineWidth = R * 0.03;
        c.stroke();
        for (let i = 0; i <= 5; i++) disc(c, sx * w * 0.47, -h / 2 + (h * i) / 5, R * 0.05, '#3a2614');
      }
    }
  },
  boat: {
    cat: 'camp',
    name: 'Rowboat',
    w: 1,
    h: 2.4,
    z: 1,
    hg: 0.4,
    tint: 'wood',
    draw(c, R, rnd) {
      const hull = k => {
        c.beginPath();
        c.moveTo(0, -R * 1.1 * k);
        c.quadraticCurveTo(R * 0.5 * k, -R * 0.5 * k, R * 0.42 * k, R * 0.9 * k);
        c.lineTo(-R * 0.42 * k, R * 0.9 * k);
        c.quadraticCurveTo(-R * 0.5 * k, -R * 0.5 * k, 0, -R * 1.1 * k);
        c.closePath();
      };
      c.fillStyle = 'rgba(14,8,4,.92)';
      hull(1.04);
      c.fill();
      c.fillStyle = linFill(c, -R * 0.5, 0, R * 0.5, 0, RAMP.wood, 0.8, 0.3);
      hull(1);
      c.fill();
      c.fillStyle = linFill(c, 0, -R, 0, R, RAMP.wood, 0.45, 0.2);
      hull(0.82);
      c.fill();
      for (const y of [-R * 0.25, R * 0.4]) plankRect(c, 0, y, R * 0.72, R * 0.14, 0, R, true, RAMP.wood, rnd);
    }
  },
  sign: {
    cat: 'camp',
    name: 'Signpost',
    w: 0.6,
    h: 0.6,
    z: 2,
    hg: 1.4,
    tint: 'wood',
    draw(c, R, rnd) {
      plankRect(c, R * 0.05, 0, R * 0.5, R * 0.14, -0.3, R, true, RAMP.wood, rnd);
      disc(c, 0, 0, R * 0.07, 'rgba(14,8,4,.9)');
      disc(c, 0, 0, R * 0.055, '#6a4325');
    }
  },
  woodpile: {
    cat: 'camp',
    name: 'Woodpile',
    w: 1.2,
    h: 0.7,
    z: 2,
    hg: 0.5,
    draw(c, R, rnd) {
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 5; i++) logEnd(c, -R * 0.44 + i * R * 0.22 + j * R * 0.11, -R * 0.1 + j * R * 0.2, R * 0.1);
    }
  }
});
for (const [k, t] of Object.entries({
  oak: 'leaf',
  pine: 'pine',
  dead: 'bark',
  bush: 'bush',
  boulder: 'stone',
  rocks: 'stone',
  log: 'bark',
  stump: 'bark',
  reeds: 'reed',
  flowers: 'grass',
  tuftg: 'grass',
  ruinwall: 'stone',
  pillar: 'stone',
  fallen: 'stone',
  rubble: 'stone',
  statue: 'stone',
  arch: 'stone',
  tiles: 'stone'
}))
  STAMPS[k].tint = t;

// ---- world map icons (sized so 1 unit = one hex / square) ----
Object.assign(RAMP, {
  roof: ['#3a1510', '#5a2218', '#7a3222', '#98452d', '#b35c3c', '#c97a55'].map(hexRgb),
  plast: ['#6b6252', '#877c68', '#a39780', '#bdb29a', '#d2c8b0', '#e6dec8'].map(hexRgb)
});
function peak(c, x, y, w, h, rnd, R, snow = true, ramp = RAMP.stone) {
  const tx = x + (rnd() - 0.5) * w * 0.15,
    ty = y - h,
    L = [x - w / 2, y],
    Rr = [x + w / 2, y];
  const ridge = [];
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    ridge.push([tx + (rnd() - 0.5) * w * 0.08, ty + h * t * 0.9]);
  }
  c.fillStyle = 'rgba(12,11,10,.95)';
  c.beginPath();
  c.moveTo(L[0] - 1, L[1] + 1);
  c.lineTo(tx, ty - 1.5);
  c.lineTo(Rr[0] + 1, Rr[1] + 1);
  c.closePath();
  c.fill();
  c.fillStyle = linFill(c, L[0], y, tx, ty, ramp, 0.45, 0.85);
  c.beginPath();
  c.moveTo(L[0], L[1]);
  c.lineTo(tx, ty);
  ridge.forEach(p => c.lineTo(p[0], p[1]));
  c.lineTo(x + (rnd() - 0.5) * w * 0.1, y);
  c.closePath();
  c.fill();
  c.fillStyle = linFill(c, tx, ty, Rr[0], y, ramp, 0.3, 0.08);
  c.beginPath();
  c.moveTo(tx, ty);
  c.lineTo(Rr[0], Rr[1]);
  c.lineTo(x + (rnd() - 0.5) * w * 0.1, y);
  [...ridge].reverse().forEach(p => c.lineTo(p[0], p[1]));
  c.closePath();
  c.fill();
  if (snow) {
    c.fillStyle = '#eef3f7';
    c.beginPath();
    c.moveTo(tx, ty);
    c.lineTo(tx - w * 0.13, ty + h * 0.26);
    c.lineTo(tx - w * 0.04, ty + h * 0.2);
    c.lineTo(tx + w * 0.02, ty + h * 0.3);
    c.lineTo(tx + w * 0.12, ty + h * 0.24);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(150,170,190,.6)';
    c.beginPath();
    c.moveTo(tx, ty);
    c.lineTo(tx + w * 0.02, ty + h * 0.3);
    c.lineTo(tx + w * 0.12, ty + h * 0.24);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = 'rgba(12,11,10,.6)';
  c.lineWidth = Math.max(0.6, R / 70);
  c.beginPath();
  for (let i = 0; i < 3; i++) {
    const t = 0.4 + i * 0.18;
    c.moveTo(tx + (L[0] - tx) * t, ty + (y - ty) * t);
    c.lineTo(tx + (L[0] - tx) * t + w * 0.06, ty + (y - ty) * t + h * 0.08);
  }
  c.stroke();
}
function house(c, x, y, w, h, rnd, R) {
  c.fillStyle = 'rgba(12,9,6,.95)';
  c.fillRect(x - w / 2 - 1, y - h * 0.45 - 1, w + 2, h * 0.95 + 2);
  c.fillStyle = linFill(c, x - w / 2, 0, x + w / 2, 0, RAMP.plast, 0.85, 0.45);
  c.fillRect(x - w / 2, y, w, h * 0.5);
  c.fillStyle = '#2a1d12';
  c.fillRect(x - w * 0.1, y + h * 0.18, w * 0.2, h * 0.32);
  c.fillStyle = rgba(RAMP.roof, 0.75);
  c.beginPath();
  c.moveTo(x - w * 0.6, y + 1);
  c.lineTo(x - w * 0.3, y - h * 0.45);
  c.lineTo(x + w * 0.3, y - h * 0.45);
  c.lineTo(x + w * 0.6, y + 1);
  c.closePath();
  c.fill();
  c.fillStyle = rgba(RAMP.roof, 0.35);
  c.beginPath();
  c.moveTo(x, y + 1);
  c.lineTo(x + w * 0.3, y - h * 0.45);
  c.lineTo(x + w * 0.6, y + 1);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(12,9,6,.85)';
  c.lineWidth = Math.max(0.7, R / 60);
  c.beginPath();
  c.moveTo(x - w * 0.6, y + 1);
  c.lineTo(x - w * 0.3, y - h * 0.45);
  c.lineTo(x + w * 0.3, y - h * 0.45);
  c.lineTo(x + w * 0.6, y + 1);
  c.stroke();
}
function towerIcon(c, x, y, w, h, R, roof = true) {
  c.fillStyle = 'rgba(12,11,10,.95)';
  c.fillRect(x - w / 2 - 1, y - h - 1, w + 2, h + 2);
  c.fillStyle = linFill(c, x - w / 2, 0, x + w / 2, 0, RAMP.stone, 0.85, 0.3);
  c.fillRect(x - w / 2, y - h, w, h);
  c.fillStyle = '#16120e';
  c.fillRect(x - w * 0.12, y - h * 0.55, w * 0.24, h * 0.16);
  if (roof) {
    c.fillStyle = rgba(RAMP.roof, 0.6);
    c.beginPath();
    c.moveTo(x - w * 0.62, y - h);
    c.lineTo(x, y - h - w * 1.1);
    c.lineTo(x + w * 0.62, y - h);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(RAMP.roof, 0.3);
    c.beginPath();
    c.moveTo(x, y - h);
    c.lineTo(x, y - h - w * 1.1);
    c.lineTo(x + w * 0.62, y - h);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(12,9,6,.85)';
    c.lineWidth = Math.max(0.7, R / 60);
    c.stroke();
  } else {
    c.fillStyle = linFill(c, x - w / 2, 0, x + w / 2, 0, RAMP.stone, 0.85, 0.3);
    for (let i = 0; i < 3; i++) c.fillRect(x - w / 2 + i * w * 0.4, y - h - w * 0.18, w * 0.2, w * 0.18);
  }
}
function wallRing(c, cx, cy, rx, ry, R) {
  c.strokeStyle = 'rgba(12,11,10,.95)';
  c.lineWidth = R * 0.07;
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, 7);
  c.stroke();
  c.strokeStyle = rgba(RAMP.stone, 0.7);
  c.lineWidth = R * 0.045;
  c.stroke();
}

Object.assign(STAMPS, {
  mountain: {
    cat: 'world',
    name: 'Mountains',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.3,
    tint: 'stone',
    draw(c, R, rnd) {
      const n = 1 + ((rnd() * 3) | 0),
        ps = [];
      for (let i = 0; i < n; i++)
        ps.push([
          (i - (n - 1) / 2) * R * 0.3 + (rnd() - 0.5) * R * 0.08,
          R * (0.25 + rnd() * 0.08),
          R * (n === 1 ? 0.78 : 0.5 + rnd() * 0.14),
          R * (n === 1 ? 0.62 : 0.42 + rnd() * 0.16)
        ]);
      ps.sort((a, b) => b[3] - a[3]).forEach(([x, y, w, h]) => peak(c, x, y, w, h, rnd, R));
    }
  },
  volcano: {
    cat: 'world',
    name: 'Volcano',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.3,
    draw(c, R, rnd) {
      peak(
        c,
        0,
        R * 0.3,
        R * 0.85,
        R * 0.6,
        rnd,
        R,
        false,
        ['#1d1513', '#2e2220', '#40302c', '#57423b', '#6e554b', '#87695c'].map(hexRgb)
      );
      flame(c, 0, -R * 0.28, R * 0.12);
      c.strokeStyle = 'rgba(230,90,20,.85)';
      c.lineWidth = R * 0.03;
      c.beginPath();
      c.moveTo(0, -R * 0.25);
      c.quadraticCurveTo(R * 0.06, -R * 0.05, -R * 0.04, R * 0.18);
      c.stroke();
    }
  },
  hills: {
    cat: 'world',
    name: 'Hills',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.2,
    tint: 'grass',
    draw(c, R, rnd) {
      const n = 2 + ((rnd() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * R * 0.3 + (rnd() - 0.5) * R * 0.06,
          y = R * (0.12 + (i % 2) * 0.14),
          w = R * (0.38 + rnd() * 0.12),
          h = R * (0.22 + rnd() * 0.08);
        c.fillStyle = 'rgba(12,14,8,.9)';
        c.beginPath();
        c.ellipse(x, y, w / 2 + 1, h + 1, 0, Math.PI, 0);
        c.closePath();
        c.fill();
        c.fillStyle = linFill(c, x - w / 2, y - h, x + w / 2, y, RAMP.grass, 0.9, 0.2);
        c.beginPath();
        c.ellipse(x, y, w / 2, h, 0, Math.PI, 0);
        c.closePath();
        c.fill();
        c.strokeStyle = rgba(RAMP.grass, 0.05, 0.6);
        c.lineWidth = Math.max(0.6, R / 70);
        c.beginPath();
        c.arc(x + w * 0.08, y, w * 0.3, Math.PI * 1.15, Math.PI * 1.6);
        c.stroke();
      }
    }
  },
  woods: {
    cat: 'world',
    name: 'Woods',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.3,
    tint: 'leaf',
    draw(c, R, rnd) {
      const pts = [];
      for (let i = 0; i < 7; i++)
        pts.push([(rnd() - 0.5) * R * 0.6, (rnd() - 0.5) * R * 0.55, R * (0.13 + rnd() * 0.06)]);
      pts
        .sort((a, b) => a[1] - b[1])
        .forEach(([x, y, r]) => {
          c.save();
          c.translate(x, y);
          treeCrown(c, r, RAMP.leaf, rnd, R, 6);
          c.restore();
        });
    }
  },
  pinewood: {
    cat: 'world',
    name: 'Pine woods',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.3,
    tint: 'pine',
    draw(c, R, rnd) {
      const pts = [];
      for (let i = 0; i < 8; i++)
        pts.push([(rnd() - 0.5) * R * 0.62, (rnd() - 0.5) * R * 0.5 + R * 0.05, R * (0.2 + rnd() * 0.08)]);
      pts
        .sort((a, b) => a[1] - b[1])
        .forEach(([x, y, h]) => {
          c.fillStyle = 'rgba(8,14,10,.95)';
          c.beginPath();
          c.moveTo(x, y - h - 1);
          c.lineTo(x - h * 0.42 - 1, y + 1);
          c.lineTo(x + h * 0.42 + 1, y + 1);
          c.closePath();
          c.fill();
          c.fillStyle = rgba(RAMP.pine, 0.6);
          c.beginPath();
          c.moveTo(x, y - h);
          c.lineTo(x - h * 0.4, y);
          c.lineTo(x, y);
          c.closePath();
          c.fill();
          c.fillStyle = rgba(RAMP.pine, 0.25);
          c.beginPath();
          c.moveTo(x, y - h);
          c.lineTo(x + h * 0.4, y);
          c.lineTo(x, y);
          c.closePath();
          c.fill();
          c.fillStyle = '#3a2614';
          c.fillRect(x - R * 0.012, y, R * 0.024, R * 0.04);
        });
    }
  },
  swamp: {
    cat: 'world',
    name: 'Swamp',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.05,
    tint: 'reed',
    draw(c, R, rnd) {
      for (let i = 0; i < 4; i++) {
        c.fillStyle = 'rgba(30,48,36,.85)';
        c.beginPath();
        c.ellipse(
          (rnd() - 0.5) * R * 0.5,
          (rnd() - 0.5) * R * 0.45,
          R * (0.08 + rnd() * 0.06),
          R * (0.03 + rnd() * 0.02),
          0,
          0,
          7
        );
        c.fill();
      }
      for (let i = 0; i < 4; i++)
        tuft(c, (rnd() - 0.5) * R * 0.55, (rnd() - 0.5) * R * 0.5, 8, R * 0.14, RAMP.reed, rnd, R);
    }
  },
  village: {
    cat: 'world',
    name: 'Village',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.25,
    draw(c, R, rnd) {
      [
        [-0.2, -0.05],
        [0.18, -0.1],
        [0, 0.18]
      ].forEach(([x, y]) => house(c, x * R, y * R, R * 0.22, R * 0.26, rnd, R));
    }
  },
  town: {
    cat: 'world',
    name: 'Town',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.25,
    draw(c, R, rnd) {
      towerIcon(c, R * 0.02, -R * 0.02, R * 0.1, R * 0.28, R);
      [
        [-0.28, -0.12],
        [0.26, -0.14],
        [-0.32, 0.14],
        [0.3, 0.12],
        [-0.08, 0.24],
        [0.12, 0.26]
      ].forEach(([x, y]) => house(c, x * R, y * R, R * 0.17, R * 0.2, rnd, R));
    }
  },
  city: {
    cat: 'world',
    name: 'City',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.3,
    draw(c, R, rnd) {
      wallRing(c, 0, R * 0.06, R * 0.44, R * 0.34, R);
      towerIcon(c, 0, -R * 0.04, R * 0.12, R * 0.34, R);
      [
        [-0.25, -0.1],
        [0.24, -0.12],
        [-0.28, 0.14],
        [0.27, 0.12],
        [-0.1, 0.24],
        [0.12, 0.24],
        [-0.12, 0.04],
        [0.14, 0.02]
      ].forEach(([x, y]) => house(c, x * R, y * R, R * 0.13, R * 0.16, rnd, R));
      for (const a of [0, 1.57, 3.14, 4.71])
        towerIcon(c, Math.cos(a) * R * 0.44, R * 0.06 + Math.sin(a) * R * 0.34 + R * 0.04, R * 0.07, R * 0.1, R, false);
    }
  },
  castle: {
    cat: 'world',
    name: 'Castle',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.3,
    draw(c, R, rnd) {
      const w = R * 0.56,
        h = R * 0.26,
        y = R * 0.22;
      c.fillStyle = 'rgba(12,11,10,.95)';
      c.fillRect(-w / 2 - 1, y - h - 1, w + 2, h + 2);
      c.fillStyle = linFill(c, -w / 2, 0, w / 2, 0, RAMP.stone, 0.8, 0.35);
      c.fillRect(-w / 2, y - h, w, h);
      for (let i = 0; i < 6; i++) c.fillRect(-w / 2 + (i * w) / 5.5, y - h - R * 0.04, w / 11, R * 0.04);
      c.fillStyle = '#16120e';
      c.beginPath();
      c.moveTo(-R * 0.06, y);
      c.lineTo(-R * 0.06, y - R * 0.08);
      c.arc(0, y - R * 0.08, R * 0.06, Math.PI, 0);
      c.lineTo(R * 0.06, y);
      c.fill();
      towerIcon(c, -w / 2, y, R * 0.14, R * 0.38, R);
      towerIcon(c, w / 2, y, R * 0.14, R * 0.38, R);
      towerIcon(c, 0, y - h, R * 0.16, R * 0.2, R);
      c.strokeStyle = '#1a1410';
      c.lineWidth = Math.max(0.7, R / 60);
      c.beginPath();
      c.moveTo(0, y - h - R * 0.2 - R * 0.17);
      c.lineTo(0, y - h - R * 0.52);
      c.stroke();
      c.fillStyle = '#b3332a';
      c.beginPath();
      c.moveTo(0, y - h - R * 0.52);
      c.lineTo(R * 0.12, y - h - R * 0.48);
      c.lineTo(0, y - h - R * 0.44);
      c.closePath();
      c.fill();
    }
  },
  tower: {
    cat: 'world',
    name: 'Tower',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.3,
    draw(c, R, rnd) {
      towerIcon(c, 0, R * 0.3, R * 0.18, R * 0.5, R);
    }
  },
  cave: {
    cat: 'world',
    name: 'Cave',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.25,
    tint: 'stone',
    draw(c, R, rnd) {
      peak(c, 0, R * 0.28, R * 0.7, R * 0.45, rnd, R, false);
      c.fillStyle = '#060504';
      c.beginPath();
      c.moveTo(-R * 0.1, R * 0.28);
      c.lineTo(-R * 0.1, R * 0.16);
      c.quadraticCurveTo(0, R * 0.0, R * 0.1, R * 0.16);
      c.lineTo(R * 0.1, R * 0.28);
      c.closePath();
      c.fill();
    }
  },
  ruinsicon: {
    cat: 'world',
    name: 'Ruins',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.2,
    tint: 'stone',
    draw(c, R, rnd) {
      [
        [-0.2, 0.32],
        [-0.02, 0.22],
        [0.18, 0.4]
      ].forEach(([x, hh]) => {
        const w = R * 0.09,
          y = R * 0.25,
          h = R * hh;
        c.fillStyle = 'rgba(12,11,10,.95)';
        c.fillRect(x * R - w / 2 - 1, y - h - 1, w + 2, h + 2);
        c.fillStyle = linFill(c, x * R - w / 2, 0, x * R + w / 2, 0, RAMP.stone, 0.85, 0.3);
        c.beginPath();
        c.moveTo(x * R - w / 2, y);
        c.lineTo(x * R - w / 2, y - h);
        c.lineTo(x * R, y - h + w * 0.5);
        c.lineTo(x * R + w / 2, y - h + w * 0.2);
        c.lineTo(x * R + w / 2, y);
        c.fill();
      });
      c.save();
      c.translate(0, R * 0.28);
      chips(c, 7, R * 0.3, rnd, R, 0.035);
      c.restore();
    }
  },
  port: {
    cat: 'world',
    name: 'Port',
    w: 1,
    h: 1,
    z: 3,
    hg: 0.25,
    draw(c, R, rnd) {
      plankRect(c, R * 0.12, R * 0.22, R * 0.5, R * 0.07, 0, R, true, RAMP.wood, rnd);
      [
        [-0.24, -0.08],
        [0.02, -0.14],
        [-0.1, 0.1]
      ].forEach(([x, y]) => house(c, x * R, y * R, R * 0.17, R * 0.2, rnd, R));
      c.fillStyle = rgba(RAMP.wood, 0.35);
      c.beginPath();
      c.moveTo(R * 0.22, R * 0.3);
      c.lineTo(R * 0.42, R * 0.3);
      c.lineTo(R * 0.36, R * 0.36);
      c.lineTo(R * 0.26, R * 0.36);
      c.closePath();
      c.fill();
      c.strokeStyle = '#2a1a0e';
      c.lineWidth = Math.max(0.7, R / 60);
      c.beginPath();
      c.moveTo(R * 0.32, R * 0.3);
      c.lineTo(R * 0.32, R * 0.06);
      c.stroke();
      c.fillStyle = '#e8e0cc';
      c.beginPath();
      c.moveTo(R * 0.33, R * 0.08);
      c.lineTo(R * 0.44, R * 0.27);
      c.lineTo(R * 0.33, R * 0.27);
      c.closePath();
      c.fill();
    }
  }
});

Object.assign(STAMPS.brazier, { light: 4, lp: 'campfire' });
Object.assign(STAMPS.fire, { light: 5, lp: 'campfire' });
Object.assign(STAMPS.altar, { light: 2, lp: 'candle' });
Object.assign(STAMPS.volcano, { light: 1.5 });
Object.assign(STAMPS.torch, { lp: 'torch' });
Object.assign(STAMPS.lantern, { lp: 'hooded' });
const STAMP_KEYS = Object.keys(STAMPS);
const SCATTER_SETS = {
  current: { name: 'Selected object', keys: null },
  forest: { name: 'Woodland (trees, bushes)', keys: ['oak', 'oak', 'oak', 'bush'] },
  pines: { name: 'Pine wood', keys: ['pine', 'pine', 'pine', 'bush'] },
  mixed: { name: 'Mixed wood', keys: ['oak', 'pine', 'oak', 'bush', 'dead'] },
  under: { name: 'Undergrowth', keys: ['bush', 'flowers', 'tuftg', 'tuftg', 'mush'] },
  rocks: { name: 'Rocky ground', keys: ['boulder', 'rocks', 'rocks'] },
  marsh: { name: 'Marsh', keys: ['reeds', 'reeds', 'tuftg'] },
  range: { name: 'World: mountain range', keys: ['mountain', 'mountain', 'mountain', 'hills'] },
  wwoods: { name: 'World: forest', keys: ['woods', 'woods', 'pinewood'] },
  debris: { name: 'Ruin debris', keys: ['rubble', 'rubble', 'rubble', 'rocks', 'rocks', 'tiles'] }
};
