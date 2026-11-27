// ---- Japan pack objects ----
Object.assign(RAMP, {
  sakura: ['#5a2a3a', '#8a4a62', '#b86e8a', '#d895ad', '#ecbccd', '#f9dde7'].map(hexRgb),
  momiji: ['#3a0c08', '#5e160d', '#8a2414', '#b23a1c', '#d0582a', '#e8823e'].map(hexRgb),
  bamboo: ['#2c4418', '#3f5f20', '#55792a', '#6c9234', '#87aa44', '#a6c25e'].map(hexRgb),
  lacquer: ['#3a0a06', '#5e140b', '#8a2412', '#b3341b', '#cf4a26', '#e46a3c'].map(hexRgb)
});
function star5(c, x, y, r, rot) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5,
      rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}
function cloudPad(c, x, y, rx, ry, rnd, R) {
  c.fillStyle = 'rgba(6,14,9,.92)';
  c.beginPath();
  c.ellipse(x, y, rx * 1.06, ry * 1.1, 0, 0, 7);
  c.fill();
  c.fillStyle = litFill(c, x, y, Math.max(rx, ry), RAMP.pine, 0.15, 0.85);
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, 7);
  c.fill();
  c.lineCap = 'round';
  for (let i = 0; i < 30; i++) {
    const a = rnd() * 6.28,
      d = Math.sqrt(rnd()),
      px = x + Math.cos(a) * rx * d * 0.9,
      py = y + Math.sin(a) * ry * d * 0.9;
    c.strokeStyle = rgba(
      RAMP.pine,
      clamp(0.55 - ((px - x + py - y) / (rx + ry)) * 0.5 + (rnd() - 0.5) * 0.2, 0, 1),
      0.6
    );
    c.lineWidth = Math.max(0.6, R / 70);
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + Math.cos(a) * R * 0.05, py + Math.sin(a) * R * 0.05);
    c.stroke();
  }
}
function vermilionBeam(c, x0, x1, y, h, R) {
  const lift = h * 0.55;
  c.fillStyle = 'rgba(10,6,4,.95)';
  c.beginPath();
  c.moveTo(x0 - 2, y - h / 2 - lift - 1);
  c.quadraticCurveTo((x0 + x1) / 2, y - h / 2 + lift * 0.3, x1 + 2, y - h / 2 - lift - 1);
  c.lineTo(x1 + 2, y + h / 2 - lift * 0.4 + 1);
  c.quadraticCurveTo((x0 + x1) / 2, y + h / 2 + lift * 0.3 + 1, x0 - 2, y + h / 2 - lift * 0.4 + 1);
  c.closePath();
  c.fill();
  c.fillStyle = linFill(c, 0, y - h / 2, 0, y + h / 2, RAMP.lacquer, 0.9, 0.4);
  c.beginPath();
  c.moveTo(x0, y - h / 2 - lift);
  c.quadraticCurveTo((x0 + x1) / 2, y - h / 2 + lift * 0.3, x1, y - h / 2 - lift);
  c.lineTo(x1, y + h / 2 - lift * 0.4);
  c.quadraticCurveTo((x0 + x1) / 2, y + h / 2 + lift * 0.3, x0, y + h / 2 - lift * 0.4);
  c.closePath();
  c.fill();
}
Object.assign(STAMPS, {
  sakura: {
    cat: 'japan',
    name: 'Cherry tree',
    w: 2,
    h: 2,
    z: 3,
    hg: 2.2,
    tint: 'sakura',
    out: 1,
    draw(c, R, rnd) {
      treeCrown(c, R * 0.92, RAMP.sakura, rnd, R, 9 + ((rnd() * 3) | 0));
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 6.28,
          d = R * (0.85 + rnd() * 0.35);
        c.fillStyle = rgba(RAMP.sakura, 0.75 + rnd() * 0.25, 0.85);
        c.beginPath();
        c.ellipse(Math.cos(a) * d, Math.sin(a) * d, R * 0.025, R * 0.015, rnd() * 3, 0, 7);
        c.fill();
      }
    }
  },
  maple: {
    cat: 'japan',
    name: 'Maple',
    w: 1.8,
    h: 1.8,
    z: 3,
    hg: 2,
    tint: 'momiji',
    out: 1,
    draw(c, R, rnd) {
      treeCrown(c, R * 0.8, RAMP.momiji, rnd, R, 11);
      for (let i = 0; i < 40; i++) {
        const a = rnd() * 6.28,
          d = Math.sqrt(rnd()) * R * 0.78,
          x = Math.cos(a) * d,
          y = Math.sin(a) * d;
        c.fillStyle = rgba(RAMP.momiji, clamp(0.6 - ((x + y) / R) * 0.4 + (rnd() - 0.5) * 0.3, 0, 1), 0.8);
        star5(c, x, y, R * (0.035 + rnd() * 0.025), rnd() * 6);
        c.fill();
      }
    }
  },
  jpine: {
    cat: 'japan',
    name: 'Black pine',
    w: 2,
    h: 2,
    z: 3,
    hg: 2,
    tint: 'pine',
    out: 1,
    draw(c, R, rnd) {
      const pads = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28 + rnd() * 0.6,
          d = R * (0.42 + rnd() * 0.25);
        pads.push([Math.cos(a) * d, Math.sin(a) * d, R * (0.3 + rnd() * 0.1), R * (0.21 + rnd() * 0.06)]);
      }
      c.lineCap = 'round';
      c.strokeStyle = rgba(RAMP.bark, 0.2);
      for (const [x, y] of pads) {
        c.lineWidth = R * 0.07;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(x * 0.3 + (rnd() - 0.5) * R * 0.3, y * 0.7, x, y);
        c.stroke();
      }
      disc(c, 0, 0, R * 0.12, litFill(c, 0, 0, R * 0.12, RAMP.bark));
      pads.sort((a, b) => a[1] - b[1]).forEach(([x, y, rx, ry]) => cloudPad(c, x, y, rx, ry, rnd, R));
      cloudPad(c, 0, -R * 0.05, R * 0.28, R * 0.2, rnd, R);
    }
  },
  bamboo: {
    cat: 'japan',
    name: 'Bamboo',
    w: 1.4,
    h: 1.4,
    z: 3,
    hg: 2.4,
    tint: 'bamboo',
    out: 1,
    draw(c, R, rnd) {
      const n = 12 + ((rnd() * 6) | 0),
        stalks = [];
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.28,
          d = Math.sqrt(rnd()) * R * 0.4;
        stalks.push([Math.cos(a) * d, Math.sin(a) * d]);
      }
      c.lineCap = 'round';
      for (const [x, y] of stalks)
        for (let k = 0; k < 8; k++) {
          const a = rnd() * 6.28,
            l = R * (0.28 + rnd() * 0.3),
            mx = x + Math.cos(a) * l * 0.5,
            my = y + Math.sin(a) * l * 0.5,
            ex = x + Math.cos(a) * l,
            ey = y + Math.sin(a) * l;
          c.fillStyle = rgba(RAMP.bamboo, 0.25 + rnd() * 0.6, 0.85);
          c.beginPath();
          c.moveTo(x, y);
          c.quadraticCurveTo(mx + Math.cos(a + 1.57) * R * 0.05, my + Math.sin(a + 1.57) * R * 0.05, ex, ey);
          c.quadraticCurveTo(mx - Math.cos(a + 1.57) * R * 0.05, my - Math.sin(a + 1.57) * R * 0.05, x, y);
          c.fill();
        }
      for (const [x, y] of stalks) {
        disc(c, x, y, R * 0.07, 'rgba(10,18,6,.9)');
        disc(c, x, y, R * 0.058, litFill(c, x, y, R * 0.045, RAMP.bamboo, 0.4, 1));
        c.strokeStyle = rgba(RAMP.bamboo, 0.15);
        c.lineWidth = Math.max(0.5, R / 90);
        c.beginPath();
        c.arc(x, y, R * 0.028, 0, 7);
        c.stroke();
      }
    }
  },
  mossrock: {
    cat: 'japan',
    name: 'Garden rock',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.7,
    tint: 'stone',
    out: 1,
    draw(c, R, rnd) {
      rock(c, 0, 0, R * 0.4, rnd, R);
      c.save();
      c.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 18; i++) {
        const a = rnd() * 6.28,
          d = R * 0.35 * Math.sqrt(rnd()),
          x = Math.cos(a) * d - R * 0.08,
          y = Math.sin(a) * d - R * 0.1;
        c.fillStyle = rgba(RAMP.grass, 0.4 + rnd() * 0.4, 0.75);
        c.beginPath();
        c.arc(x, y, R * (0.03 + rnd() * 0.05), 0, 7);
        c.fill();
      }
      c.restore();
    }
  },
  stepping: {
    cat: 'japan',
    name: 'Stepping stones',
    w: 2,
    h: 0.6,
    z: 0,
    hg: 0.05,
    tint: 'stone',
    out: 1,
    draw(c, R, rnd) {
      for (let i = 0; i < 4; i++) {
        const x = -R * 0.72 + i * R * 0.48,
          y = (rnd() - 0.5) * R * 0.16,
          r = R * (0.16 + rnd() * 0.04);
        c.fillStyle = 'rgba(12,11,10,.8)';
        blobPath(c, x, y, r * 1.08, 8, 0.12, mulberry(i * 31 + 5));
        c.fill();
        c.fillStyle = linFill(c, x - r, y - r, x + r, y + r, RAMP.stone, 0.85, 0.45);
        blobPath(c, x, y, r, 8, 0.12, mulberry(i * 31 + 5));
        c.fill();
      }
    }
  },
  torou: {
    cat: 'japan',
    name: 'Stone lantern',
    w: 0.9,
    h: 0.9,
    z: 3,
    hg: 1.6,
    tint: 'stone',
    out: 1,
    light: 2.5,
    draw(c, R, rnd) {
      const s = R * 0.3;
      c.fillStyle = 'rgba(12,11,10,.9)';
      c.fillRect(-s - 1, -s - 1, 2 * s + 2, 2 * s + 2);
      c.fillStyle = linFill(c, -s, -s, s, s, RAMP.stone, 0.6, 0.2);
      c.fillRect(-s, -s, 2 * s, 2 * s);
      const hx = k => {
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = Math.PI / 6 + (i * Math.PI) / 3;
          c.lineTo(Math.cos(a) * R * 0.38 * k, Math.sin(a) * R * 0.38 * k);
        }
        c.closePath();
      };
      c.fillStyle = 'rgba(12,11,10,.92)';
      hx(1.06);
      c.fill();
      c.fillStyle = litFill(c, 0, 0, R * 0.38, RAMP.stone, 0.25, 0.95);
      hx(1);
      c.fill();
      c.strokeStyle = 'rgba(20,18,16,.5)';
      c.lineWidth = Math.max(0.7, R / 60);
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (i * Math.PI) / 3;
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.38);
      }
      c.stroke();
      disc(c, 0, 0, R * 0.09, 'rgba(12,11,10,.9)');
      disc(c, 0, 0, R * 0.075, litFill(c, 0, 0, R * 0.075, RAMP.stone, 0.4, 1));
    }
  },
  chochin: {
    cat: 'japan',
    name: 'Paper lantern',
    w: 0.5,
    h: 0.5,
    z: 3,
    hg: 0.8,
    tint: 'lacquer',
    light: 3,
    draw(c, R, rnd) {
      c.fillStyle = 'rgba(10,6,4,.9)';
      c.beginPath();
      c.ellipse(0, 0, R * 0.17, R * 0.2, 0, 0, 7);
      c.fill();
      const g = c.createRadialGradient(-R * 0.05, -R * 0.06, R * 0.02, 0, 0, R * 0.2);
      g.addColorStop(0, '#ffd58a');
      g.addColorStop(0.5, rgba(RAMP.lacquer, 0.85));
      g.addColorStop(1, rgba(RAMP.lacquer, 0.35));
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(0, 0, R * 0.16, R * 0.19, 0, 0, 7);
      c.fill();
      c.strokeStyle = 'rgba(40,10,5,.5)';
      c.lineWidth = Math.max(0.5, R / 90);
      for (const k of [-0.5, 0, 0.5]) {
        c.beginPath();
        c.ellipse(0, R * 0.19 * k, R * 0.16 * Math.sqrt(1 - k * k), R * 0.02, 0, 0, 7);
        c.stroke();
      }
      c.fillStyle = '#16100c';
      c.fillRect(-R * 0.07, -R * 0.22, R * 0.14, R * 0.04);
      c.fillRect(-R * 0.07, R * 0.18, R * 0.14, R * 0.04);
    }
  },
  torii: {
    cat: 'japan',
    name: 'Torii gate',
    w: 3,
    h: 0.8,
    z: 3,
    hg: 2.5,
    tint: 'lacquer',
    out: 1,
    draw(c, R, rnd) {
      for (const sx of [-1, 1]) {
        disc(c, sx * R * 1.0, R * 0.22, R * 0.15, 'rgba(10,6,4,.95)');
        disc(
          c,
          sx * R * 1.0,
          R * 0.22,
          R * 0.13,
          litFill(c, sx * R * 1.0, R * 0.22, R * 0.13, RAMP.lacquer, 0.3, 0.95)
        );
      }
      c.fillStyle = 'rgba(10,6,4,.95)';
      c.fillRect(-R * 1.25, R * 0.07, R * 2.5, R * 0.12);
      c.fillStyle = linFill(c, 0, R * 0.08, 0, R * 0.18, RAMP.lacquer, 0.85, 0.4);
      c.fillRect(-R * 1.24, R * 0.08, R * 2.48, R * 0.1);
      vermilionBeam(c, -R * 1.45, R * 1.45, -R * 0.02, R * 0.3, R);
      c.fillStyle = '#16100c';
      c.beginPath();
      c.moveTo(-R * 1.47, -R * 0.3);
      c.quadraticCurveTo(0, -R * 0.1, R * 1.47, -R * 0.3);
      c.lineTo(R * 1.47, -R * 0.17);
      c.quadraticCurveTo(0, R * 0.01, -R * 1.47, -R * 0.17);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(RAMP.lacquer, 0.5);
      c.fillRect(-R * 0.1, -R * 0.1, R * 0.2, R * 0.16);
      c.strokeStyle = '#c9a23a';
      c.lineWidth = Math.max(0.6, R / 70);
      c.strokeRect(-R * 0.1, -R * 0.1, R * 0.2, R * 0.16);
    }
  },
  redbridge: {
    cat: 'japan',
    name: 'Arched bridge',
    w: 1.4,
    h: 3,
    z: 1,
    hg: 0.5,
    tint: 'lacquer',
    out: 1,
    draw(c, R, rnd) {
      const w = R * 1.15,
        h = R * 2.8;
      plankRect(c, 0, 0, w * 0.86, h, 0, R, true, RAMP.wood, rnd);
      const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, 'rgba(0,0,0,.18)');
      g.addColorStop(0.5, 'rgba(255,255,255,.12)');
      g.addColorStop(1, 'rgba(0,0,0,.22)');
      c.fillStyle = g;
      c.fillRect(-w * 0.43, -h / 2, w * 0.86, h);
      for (const sx of [-1, 1]) {
        c.fillStyle = 'rgba(10,6,4,.95)';
        c.fillRect(sx * w * 0.47 - R * 0.06, -h / 2, R * 0.12, h);
        c.fillStyle = linFill(c, sx * w * 0.47 - R * 0.05, 0, sx * w * 0.47 + R * 0.05, 0, RAMP.lacquer, 0.9, 0.4);
        c.fillRect(sx * w * 0.47 - R * 0.05, -h / 2, R * 0.1, h);
        for (let i = 0; i <= 4; i++) {
          const yy = -h / 2 + (h * i) / 4;
          disc(c, sx * w * 0.47, yy, R * 0.08, 'rgba(10,6,4,.95)');
          disc(c, sx * w * 0.47, yy, R * 0.065, '#c9a23a');
        }
      }
    }
  },
  koi: {
    cat: 'japan',
    name: 'Koi',
    w: 1,
    h: 0.7,
    z: 0,
    hg: 0.02,
    draw(c, R, rnd) {
      const n = 2 + ((rnd() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const x = (rnd() - 0.5) * R * 0.5,
          y = (rnd() - 0.5) * R * 0.35,
          a = rnd() * 6.28,
          cols = [
            ['#f08a2e', '#fff3e6'],
            ['#e8e2d8', '#d0321e'],
            ['#f2c14a', '#fff6dc']
          ][(rnd() * 3) | 0];
        c.save();
        c.translate(x, y);
        c.rotate(a);
        c.fillStyle = cols[0];
        c.beginPath();
        c.ellipse(0, 0, R * 0.13, R * 0.045, 0, 0, 7);
        c.fill();
        c.beginPath();
        c.moveTo(-R * 0.11, 0);
        c.lineTo(-R * 0.2, -R * 0.05);
        c.lineTo(-R * 0.2, R * 0.05);
        c.closePath();
        c.fill();
        c.fillStyle = cols[1];
        c.beginPath();
        c.ellipse(R * 0.02, 0, R * 0.05, R * 0.03, 0, 0, 7);
        c.fill();
        c.restore();
      }
    }
  },
  chabudai: {
    cat: 'japan',
    name: 'Low table',
    w: 1.2,
    h: 1.2,
    z: 2,
    hg: 0.3,
    tint: 'wood',
    draw(c, R, rnd) {
      const r = R * 0.48;
      disc(c, 0, 0, r + 1.2, 'rgba(14,8,4,.92)');
      disc(c, 0, 0, r, litFill(c, 0, 0, r, RAMP.wood, 0.3, 0.9));
      c.strokeStyle = 'rgba(40,22,8,.3)';
      c.lineWidth = Math.max(0.5, R / 70);
      c.beginPath();
      c.arc(0, 0, r * 0.85, 0, 7);
      c.stroke();
      disc(c, -r * 0.3, -r * 0.1, R * 0.05, '#e9e2d2');
      disc(c, r * 0.25, r * 0.2, R * 0.05, '#e9e2d2');
      disc(c, r * 0.05, -r * 0.4, R * 0.08, '#3a2a1a');
    }
  },
  zabuton: {
    cat: 'japan',
    name: 'Cushion',
    w: 0.6,
    h: 0.6,
    z: 1,
    hg: 0.1,
    tint: 'cloth',
    draw(c, R, rnd) {
      const s = R * 0.44;
      c.fillStyle = 'rgba(14,8,4,.85)';
      c.beginPath();
      c.roundRect(-s / 2 - 1, -s / 2 - 1, s + 2, s + 2, R * 0.07);
      c.fill();
      c.fillStyle = litFill(c, 0, 0, s * 0.7, RAMP.cloth, 0.3, 0.9);
      c.beginPath();
      c.roundRect(-s / 2, -s / 2, s, s, R * 0.07);
      c.fill();
      disc(c, 0, 0, R * 0.025, 'rgba(40,20,10,.6)');
    }
  },
  byobu: {
    cat: 'japan',
    name: 'Folding screen',
    w: 2,
    h: 0.5,
    z: 2,
    hg: 1.2,
    draw(c, R, rnd) {
      const n = 6,
        pw = (R * 1.8) / n,
        zz = R * 0.14;
      c.lineJoin = 'round';
      c.strokeStyle = 'rgba(10,6,4,.95)';
      c.lineWidth = R * 0.11;
      c.beginPath();
      for (let i = 0; i <= n; i++) c.lineTo(-R * 0.9 + i * pw, i % 2 ? zz : -zz);
      c.stroke();
      for (let i = 0; i < n; i++) {
        c.strokeStyle = i % 2 ? '#a5822e' : '#e0bd5a';
        c.lineWidth = R * 0.075;
        c.beginPath();
        c.moveTo(-R * 0.9 + i * pw, i % 2 ? zz : -zz);
        c.lineTo(-R * 0.9 + (i + 1) * pw, (i + 1) % 2 ? zz : -zz);
        c.stroke();
      }
    }
  },
  taiko: {
    cat: 'japan',
    name: 'Taiko drum',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.8,
    draw(c, R, rnd) {
      for (const [x, y] of [
        [-0.3, -0.3],
        [0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3]
      ]) {
        c.fillStyle = '#2a1a0e';
        c.fillRect(x * R - R * 0.04, y * R - R * 0.04, R * 0.08, R * 0.08);
      }
      disc(c, 0, 0, R * 0.4, 'rgba(10,6,4,.95)');
      disc(c, 0, 0, R * 0.38, litFill(c, 0, 0, R * 0.38, RAMP.lacquer, 0.2, 0.7));
      disc(c, 0, 0, R * 0.32, litFill(c, 0, 0, R * 0.32, RAMP.canvas, 0.5, 1));
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * 6.28;
        disc(c, Math.cos(a) * R * 0.35, Math.sin(a) * R * 0.35, Math.max(0.6, R * 0.012), '#1a1410');
      }
      c.strokeStyle = 'rgba(30,20,10,.5)';
      c.lineWidth = Math.max(0.8, R / 50);
      c.beginPath();
      c.arc(0, 0, R * 0.1, 0, 7);
      c.stroke();
    }
  },
  komodaru: {
    cat: 'japan',
    name: 'Sake barrels',
    w: 1.2,
    h: 1.2,
    z: 2,
    hg: 0.7,
    draw(c, R, rnd) {
      for (const [x, y] of [
        [-0.22, 0.14],
        [0.22, 0.14],
        [0, -0.22]
      ]) {
        const px = x * R,
          py = y * R,
          r = R * 0.24;
        disc(c, px, py, r + 1.2, 'rgba(14,10,6,.92)');
        disc(c, px, py, r, litFill(c, px, py, r, RAMP.canvas, 0.45, 1));
        c.strokeStyle = 'rgba(70,50,30,.75)';
        c.lineWidth = Math.max(0.8, R / 45);
        c.beginPath();
        c.moveTo(px - r, py);
        c.lineTo(px + r, py);
        c.moveTo(px, py - r);
        c.lineTo(px, py + r);
        c.stroke();
        disc(c, px, py, r * 0.35, rnd() < 0.5 ? '#b3341b' : '#1c1c22');
        disc(c, px, py, r * 0.2, '#efe7d3');
      }
    }
  },
  bonsai: {
    cat: 'japan',
    name: 'Bonsai',
    w: 0.7,
    h: 0.7,
    z: 2,
    hg: 0.5,
    draw(c, R, rnd) {
      const w = R * 0.5,
        h = R * 0.3;
      c.fillStyle = 'rgba(10,8,6,.9)';
      c.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
      c.fillStyle = linFill(c, -w / 2, 0, w / 2, 0, RAMP.metal, 0.6, 0.25);
      c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = '#4a3a26';
      c.fillRect(-w * 0.42, -h * 0.36, w * 0.84, h * 0.72);
      cloudPad(c, -R * 0.1, -R * 0.05, R * 0.14, R * 0.1, rnd, R);
      cloudPad(c, R * 0.12, R * 0.04, R * 0.11, R * 0.08, rnd, R);
    }
  },
  katana: {
    cat: 'japan',
    name: 'Sword rack',
    w: 0.9,
    h: 0.5,
    z: 2,
    hg: 0.5,
    draw(c, R, rnd) {
      plankRect(c, 0, 0, R * 0.8, R * 0.14, 0, R, true, RAMP.wood, rnd);
      for (const [y, k] of [
        [-R * 0.09, 1],
        [R * 0.09, 0.82]
      ]) {
        c.strokeStyle = '#121216';
        c.lineWidth = R * 0.045;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-R * 0.4 * k, y + R * 0.03);
        c.quadraticCurveTo(0, y - R * 0.03, R * 0.4 * k, y + R * 0.02);
        c.stroke();
        c.fillStyle = '#c9a23a';
        c.fillRect(-R * 0.18 * k, y - R * 0.035, R * 0.02, R * 0.07);
      }
    }
  }
});
STAMP_KEYS.push(...Object.keys(STAMPS).filter(k => !STAMP_KEYS.includes(k)));
Object.assign(STAMPS.torou, { lp: 'lamp' });
Object.assign(STAMPS.chochin, { lp: 'lamp' });
STAMPS.bullseye = {
  cat: 'dungeon',
  name: 'Bullseye lantern',
  w: 0.5,
  h: 0.5,
  z: 3,
  hg: 0.3,
  light: 3,
  lp: 'bullseye',
  draw(c, R, rnd) {
    c.fillStyle = 'rgba(10,10,12,.95)';
    c.beginPath();
    c.moveTo(-R * 0.14, -R * 0.1);
    c.lineTo(R * 0.1, -R * 0.1);
    c.lineTo(R * 0.2, -R * 0.14);
    c.lineTo(R * 0.2, R * 0.14);
    c.lineTo(R * 0.1, R * 0.1);
    c.lineTo(-R * 0.14, R * 0.1);
    c.closePath();
    c.fill();
    c.fillStyle = linFill(c, 0, -R * 0.1, 0, R * 0.1, RAMP.metal, 0.85, 0.3);
    c.fillRect(-R * 0.12, -R * 0.08, R * 0.22, R * 0.16);
    c.fillStyle = '#ffe08a';
    c.beginPath();
    c.ellipse(R * 0.19, 0, R * 0.03, R * 0.11, 0, 0, 7);
    c.fill();
  }
};
STAMP_KEYS.push('bullseye');
// ---- Underdark & caverns, Jungle & coast, Ships & docks packs ----
Object.assign(RAMP, {
  crystal: ['#10203a', '#1c3a66', '#2c5a94', '#4a86c2', '#7cbde6', '#c8f0ff'].map(hexRgb),
  shroom: ['#1a0e2a', '#2e1846', '#4a2468', '#6a3490', '#8e4cb8', '#b878de'].map(hexRgb),
  palmlf: ['#10260c', '#1b3c12', '#285418', '#386c20', '#4c862a', '#66a038'].map(hexRgb),
  jungle: ['#081608', '#10240e', '#183614', '#22481a', '#2e5e22', '#3e782c'].map(hexRgb),
  coral: ['#4a1420', '#7a2232', '#aa3a48', '#d05a5e', '#e8847a', '#f6b2a0'].map(hexRgb)
});
function cone(c, x, y, r, rnd, R, ramp = RAMP.stone) {
  // stalagmite seen from above: rings rising to a wet tip
  disc(c, x, y, r * 1.08, 'rgba(10,10,12,.9)');
  for (let k = 0; k < 4; k++) {
    const rr = r * (1 - k * 0.22);
    disc(
      c,
      x - (r - rr) * 0.25,
      y - (r - rr) * 0.3,
      rr,
      litFill(c, x - (r - rr) * 0.25, y - (r - rr) * 0.3, rr, ramp, 0.15 + k * 0.12, 0.7 + k * 0.08)
    );
  }
  disc(c, x - r * 0.3, y - r * 0.35, r * 0.12, 'rgba(235,245,255,.6)');
}
function prism(c, x, y, len, wid, a, R) {
  // one crystal, seen from above
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = 'rgba(6,10,20,.9)';
  c.beginPath();
  c.moveTo(-wid * 0.6, -wid * 0.55);
  c.lineTo(len * 0.85, -wid * 0.55);
  c.lineTo(len + 1, 0);
  c.lineTo(len * 0.85, wid * 0.55);
  c.lineTo(-wid * 0.6, wid * 0.55);
  c.closePath();
  c.fill();
  const g = c.createLinearGradient(0, -wid / 2, 0, wid / 2);
  g.addColorStop(0, rgba(RAMP.crystal, 1));
  g.addColorStop(0.5, rgba(RAMP.crystal, 0.6));
  g.addColorStop(1, rgba(RAMP.crystal, 0.25));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-wid * 0.5, -wid * 0.45);
  c.lineTo(len * 0.85, -wid * 0.45);
  c.lineTo(len, 0);
  c.lineTo(len * 0.85, wid * 0.45);
  c.lineTo(-wid * 0.5, wid * 0.45);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,.55)';
  c.lineWidth = Math.max(0.6, R / 70);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(len, 0);
  c.stroke();
  c.restore();
}
function frond(c, x, y, a, len, w, ramp, rnd, R) {
  // feathery palm/fern leaf
  const ex = x + Math.cos(a) * len,
    ey = y + Math.sin(a) * len,
    mx = x + Math.cos(a) * len * 0.5 + Math.cos(a + 1.57) * len * 0.08,
    my = y + Math.sin(a) * len * 0.5 + Math.sin(a + 1.57) * len * 0.08;
  c.lineCap = 'round';
  {
    const nx = Math.cos(a + 1.57),
      ny = Math.sin(a + 1.57);
    c.fillStyle = rgba(ramp, 0.12, 0.85);
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(mx + nx * w * 0.9, my + ny * w * 0.9, ex, ey);
    c.quadraticCurveTo(mx - nx * w * 0.9, my - ny * w * 0.9, x, y);
    c.fill();
  }
  for (let i = 1; i < 14; i++) {
    const t = i / 14,
      px = x + (ex - x) * t + (mx - (x + ex) / 2) * 4 * t * (1 - t),
      py = y + (ey - y) * t + (my - (y + ey) / 2) * 4 * t * (1 - t),
      l = w * Math.sin(t * Math.PI) * (0.8 + rnd() * 0.3);
    for (const sg of [-1, 1]) {
      const b = a + sg * (1.1 - t * 0.3);
      c.strokeStyle = rgba(ramp, clamp(0.25 + t * 0.45 + (rnd() - 0.5) * 0.2 - sg * 0.12, 0, 1), 0.95);
      c.lineWidth = Math.max(0.9, R / 32);
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(px + Math.cos(b) * l, py + Math.sin(b) * l);
      c.stroke();
    }
  }
  c.strokeStyle = rgba(ramp, 0.1, 0.9);
  c.lineWidth = Math.max(0.8, R / 45);
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(mx, my, ex, ey);
  c.stroke();
}
Object.assign(STAMPS, {
  // ---- caverns ----
  stalag: {
    cat: 'cave',
    name: 'Stalagmite',
    w: 0.8,
    h: 0.8,
    z: 2,
    hg: 1.4,
    tint: 'stone',
    out: 1,
    draw(c, R, rnd) {
      cone(c, 0, 0, R * 0.32, rnd, R);
    }
  },
  stalags: {
    cat: 'cave',
    name: 'Stalagmites',
    w: 1.5,
    h: 1.5,
    z: 2,
    hg: 1.2,
    tint: 'stone',
    out: 1,
    draw(c, R, rnd) {
      const n = 3 + ((rnd() * 3) | 0),
        ps = [];
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.28,
          d = R * 0.42 * Math.sqrt(rnd());
        ps.push([Math.cos(a) * d, Math.sin(a) * d, R * (0.12 + rnd() * 0.16)]);
      }
      ps.sort((a, b) => a[2] - b[2]).forEach(([x, y, r]) => cone(c, x, y, r, rnd, R));
    }
  },
  crystals: {
    cat: 'cave',
    name: 'Crystals',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.9,
    tint: 'crystal',
    lp: 'glow',
    lc: '#7fe3ff',
    light: 1.5,
    draw(c, R, rnd) {
      rock(c, 0, R * 0.05, R * 0.18, rnd, R);
      const n = 6 + ((rnd() * 4) | 0);
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (rnd() - 0.5) * 5;
        prism(
          c,
          (rnd() - 0.5) * R * 0.12,
          (rnd() - 0.5) * R * 0.12,
          R * (0.3 + rnd() * 0.16),
          R * (0.11 + rnd() * 0.05),
          a,
          R
        );
      }
    }
  },
  glowshroom: {
    cat: 'cave',
    name: 'Glowing fungi',
    w: 0.8,
    h: 0.8,
    z: 1,
    hg: 0.2,
    tint: 'crystal',
    lp: 'glow',
    lc: '#7fd8ff',
    light: 1.2,
    draw(c, R, rnd) {
      const n = 4 + ((rnd() * 4) | 0);
      for (let i = 0; i < n; i++) {
        const a = rnd() * 6.28,
          d = R * 0.25 * Math.sqrt(rnd()),
          x = Math.cos(a) * d,
          y = Math.sin(a) * d,
          r = R * (0.05 + rnd() * 0.07);
        disc(c, x, y, r * 1.12, 'rgba(4,10,20,.85)');
        const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        g.addColorStop(0, '#e8fbff');
        g.addColorStop(0.5, rgba(RAMP.crystal, 0.8));
        g.addColorStop(1, rgba(RAMP.crystal, 0.35));
        disc(c, x, y, r, g);
        for (let k = 0; k < 3; k++)
          disc(c, x + (rnd() - 0.5) * r, y + (rnd() - 0.5) * r, Math.max(0.5, r * 0.14), 'rgba(255,255,255,.8)');
      }
    }
  },
  giantshroom: {
    cat: 'cave',
    name: 'Giant mushroom',
    w: 2,
    h: 2,
    z: 3,
    hg: 2,
    tint: 'shroom',
    draw(c, R, rnd) {
      const r = R * 0.85;
      disc(c, 0, 0, r * 1.04, 'rgba(8,4,14,.92)');
      disc(c, 0, 0, r, litFill(c, 0, 0, r, RAMP.shroom, 0.15, 0.95));
      c.strokeStyle = rgba(RAMP.shroom, 0.05, 0.35);
      c.lineWidth = Math.max(0.6, R / 60);
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * 6.28;
        c.beginPath();
        c.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
        c.lineTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
        c.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const a = rnd() * 6.28,
          d = r * 0.75 * Math.sqrt(rnd());
        disc(c, Math.cos(a) * d, Math.sin(a) * d, R * (0.04 + rnd() * 0.06), 'rgba(240,225,255,.75)');
      }
    }
  },
  ropebridge: {
    cat: 'cave',
    name: 'Rope bridge',
    w: 1.2,
    h: 4,
    z: 1,
    hg: 0.3,
    tint: 'wood',
    draw(c, R, rnd) {
      const w = R * 1,
        h = R * 3.9;
      for (let i = 0; i < 26; i++) {
        if (rnd() < 0.07) continue;
        const y = -h / 2 + ((i + 0.5) * h) / 26,
          sag = Math.sin(((i + 0.5) / 26) * Math.PI) * R * 0.04;
        plankRect(
          c,
          (rnd() - 0.5) * R * 0.04,
          y + sag,
          w * (0.86 + rnd() * 0.1),
          (h / 26) * 0.72,
          (rnd() - 0.5) * 0.06,
          R,
          true,
          RAMP.wood,
          rnd
        );
      }
      for (const sx of [-1, 1]) {
        c.strokeStyle = '#2a1e12';
        c.lineWidth = R * 0.05;
        c.beginPath();
        c.moveTo(sx * w * 0.5, -h / 2);
        c.quadraticCurveTo(sx * w * 0.56, 0, sx * w * 0.5, h / 2);
        c.stroke();
        c.strokeStyle = '#b79a6a';
        c.lineWidth = R * 0.025;
        c.stroke();
      }
    }
  },
  web: {
    cat: 'cave',
    name: 'Spider web',
    w: 2,
    h: 2,
    z: 0,
    hg: 0.02,
    draw(c, R, rnd) {
      const n = 9,
        rr = R * 0.9,
        ang = [];
      for (let i = 0; i < n; i++) ang.push((i / n) * 6.28 + (rnd() - 0.5) * 0.3);
      c.strokeStyle = 'rgba(235,235,240,.6)';
      c.lineWidth = Math.max(0.6, R / 70);
      c.beginPath();
      for (const a of ang) {
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * rr * (0.8 + rnd() * 0.2), Math.sin(a) * rr * (0.8 + rnd() * 0.2));
      }
      c.stroke();
      for (let k = 1; k < 9; k++) {
        const d = (rr * k) / 9;
        c.beginPath();
        ang.forEach((a, i) => {
          const p = [Math.cos(a) * d, Math.sin(a) * d];
          i ? c.lineTo(...p) : c.moveTo(...p);
        });
        c.closePath();
        c.stroke();
      }
    }
  },
  minecart: {
    cat: 'cave',
    name: 'Mine cart',
    w: 0.8,
    h: 1.1,
    z: 2,
    hg: 0.6,
    draw(c, R, rnd) {
      const w = R * 0.6,
        h = R * 0.9;
      c.fillStyle = 'rgba(8,8,10,.95)';
      c.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
      c.fillStyle = linFill(c, -w / 2, -h / 2, w / 2, h / 2, RAMP.metal, 0.7, 0.25);
      c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = '#1a1612';
      c.fillRect(-w * 0.38, -h * 0.4, w * 0.76, h * 0.8);
      for (let i = 0; i < 9; i++)
        rock(c, (rnd() - 0.5) * w * 0.6, (rnd() - 0.5) * h * 0.66, R * (0.05 + rnd() * 0.05), rnd, R);
    }
  },
  rails: {
    cat: 'cave',
    name: 'Mine rails',
    w: 1,
    h: 2,
    z: 0,
    hg: 0.03,
    draw(c, R, rnd) {
      for (let i = 0; i < 7; i++) plankRect(c, 0, -R * 0.9 + i * R * 0.3, R * 0.8, R * 0.1, 0, R, true, RAMP.wood, rnd);
      for (const sx of [-1, 1]) {
        c.fillStyle = '#1c1d20';
        c.fillRect(sx * R * 0.25 - R * 0.035, -R, R * 0.07, R * 2);
        c.fillStyle = 'rgba(190,195,205,.6)';
        c.fillRect(sx * R * 0.25 - R * 0.035, -R, R * 0.02, R * 2);
      }
    }
  },
  beams: {
    cat: 'cave',
    name: 'Mine supports',
    w: 2,
    h: 0.4,
    z: 2,
    hg: 1.6,
    tint: 'wood',
    draw(c, R, rnd) {
      plankRect(c, 0, 0, R * 1.9, R * 0.2, 0, R, true, RAMP.wood, rnd);
      for (const sx of [-1, 1]) plankRect(c, sx * R * 0.85, 0, R * 0.26, R * 0.3, 0, R, false, RAMP.wood, rnd);
    }
  },
  eggs: {
    cat: 'cave',
    name: 'Egg cluster',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.3,
    draw(c, R, rnd) {
      for (let i = 0; i < 7; i++) {
        const a = rnd() * 6.28,
          d = R * 0.25 * Math.sqrt(rnd()),
          x = Math.cos(a) * d,
          y = Math.sin(a) * d,
          r = R * (0.09 + rnd() * 0.05);
        c.fillStyle = 'rgba(20,18,10,.85)';
        c.beginPath();
        c.ellipse(x, y, r * 1.1, r * 0.9, a, 0, 7);
        c.fill();
        const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        g.addColorStop(0, '#f6f0d8');
        g.addColorStop(1, '#a8a070');
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(x, y, r, r * 0.8, a, 0, 7);
        c.fill();
        c.strokeStyle = 'rgba(140,60,60,.35)';
        c.lineWidth = Math.max(0.5, R / 90);
        c.beginPath();
        c.moveTo(x - r * 0.5, y);
        c.quadraticCurveTo(x, y - r * 0.4, x + r * 0.5, y + r * 0.1);
        c.stroke();
      }
    }
  },
  // ---- jungle & coast ----
  palm: {
    cat: 'jungle',
    name: 'Palm',
    w: 2.2,
    h: 2.2,
    z: 3,
    hg: 2.4,
    tint: 'palmlf',
    draw(c, R, rnd) {
      const n = 8 + ((rnd() * 3) | 0),
        rot = rnd() * 6.28;
      for (let i = 0; i < n; i++)
        frond(
          c,
          0,
          0,
          rot + (i / n) * 6.28 + (rnd() - 0.5) * 0.3,
          R * (0.85 + rnd() * 0.2),
          R * 0.2,
          RAMP.palmlf,
          rnd,
          R
        );
      for (let i = 0; i < 4; i++) {
        const a = rnd() * 6.28;
        disc(c, Math.cos(a) * R * 0.07, Math.sin(a) * R * 0.07, R * 0.06, '#3a2612');
        disc(c, Math.cos(a) * R * 0.07 - 1, Math.sin(a) * R * 0.07 - 1, R * 0.035, '#6a4a28');
      }
    }
  },
  fern: {
    cat: 'jungle',
    name: 'Fern',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.5,
    tint: 'palmlf',
    draw(c, R, rnd) {
      const n = 7;
      for (let i = 0; i < n; i++)
        frond(c, 0, 0, (i / n) * 6.28 + rnd() * 0.4, R * (0.38 + rnd() * 0.1), R * 0.08, RAMP.palmlf, rnd, R);
    }
  },
  bigleaf: {
    cat: 'jungle',
    name: 'Giant leaves',
    w: 1.4,
    h: 1.4,
    z: 2,
    hg: 0.9,
    tint: 'palmlf',
    draw(c, R, rnd) {
      const n = 4 + ((rnd() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + rnd() * 0.5,
          l = R * (0.5 + rnd() * 0.15),
          ex = Math.cos(a) * l,
          ey = Math.sin(a) * l,
          nx = -Math.sin(a),
          ny = Math.cos(a),
          w = R * 0.2;
        c.fillStyle = 'rgba(6,14,4,.9)';
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(ex * 0.5 + nx * w * 1.1, ey * 0.5 + ny * w * 1.1, ex, ey);
        c.quadraticCurveTo(ex * 0.5 - nx * w * 1.1, ey * 0.5 - ny * w * 1.1, 0, 0);
        c.fill();
        c.fillStyle = litFill(c, ex * 0.5, ey * 0.5, l * 0.6, RAMP.palmlf, 0.25, 0.95);
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(ex * 0.5 + nx * w, ey * 0.5 + ny * w, ex, ey);
        c.quadraticCurveTo(ex * 0.5 - nx * w, ey * 0.5 - ny * w, 0, 0);
        c.fill();
        c.strokeStyle = rgba(RAMP.palmlf, 0.85, 0.7);
        c.lineWidth = Math.max(0.7, R / 55);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(ex, ey);
        for (let k = 1; k < 6; k++) {
          const t = k / 6,
            px = ex * t,
            py = ey * t;
          for (const sg of [-1, 1]) {
            c.moveTo(px, py);
            c.lineTo(
              px + nx * sg * w * 0.7 * Math.sin(t * Math.PI) + ex * 0.06,
              py + ny * sg * w * 0.7 * Math.sin(t * Math.PI) + ey * 0.06
            );
          }
        }
        c.stroke();
      }
    }
  },
  jtree: {
    cat: 'jungle',
    name: 'Jungle tree',
    w: 2.6,
    h: 2.6,
    z: 3,
    hg: 2.6,
    tint: 'jungle',
    draw(c, R, rnd) {
      treeCrown(c, R * 1.15, RAMP.jungle, rnd, R, 11);
      c.strokeStyle = 'rgba(60,90,30,.7)';
      c.lineWidth = Math.max(0.7, R / 50);
      c.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const a = rnd() * 6.28,
          d0 = R * 0.9,
          d1 = R * 1.25;
        c.beginPath();
        c.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
        c.quadraticCurveTo(
          (Math.cos(a + 0.2) * (d0 + d1)) / 2,
          (Math.sin(a + 0.2) * (d0 + d1)) / 2,
          Math.cos(a + 0.1) * d1,
          Math.sin(a + 0.1) * d1
        );
        c.stroke();
      }
    }
  },
  mangrove: {
    cat: 'jungle',
    name: 'Mangrove',
    w: 1.8,
    h: 1.8,
    z: 3,
    hg: 1.8,
    tint: 'jungle',
    draw(c, R, rnd) {
      c.lineCap = 'round';
      for (let i = 0; i < 11; i++) {
        const a = rnd() * 6.28,
          l = R * (0.55 + rnd() * 0.25);
        c.strokeStyle = rgba(RAMP.bark, 0.2);
        c.lineWidth = R * 0.045;
        c.beginPath();
        c.moveTo(Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1);
        c.quadraticCurveTo(Math.cos(a + 0.3) * l * 0.7, Math.sin(a + 0.3) * l * 0.7, Math.cos(a) * l, Math.sin(a) * l);
        c.stroke();
      }
      treeCrown(c, R * 0.55, RAMP.jungle, rnd, R, 8);
    }
  },
  stilthut: {
    cat: 'jungle',
    name: 'Stilt hut',
    w: 2.4,
    h: 2.4,
    z: 3,
    hg: 2.2,
    openAs: 'stilthut_open',
    draw(c, R, rnd) {
      const r = R * 1.05;
      disc(c, 0, 0, r * 1.04, 'rgba(18,12,4,.92)');
      disc(c, 0, 0, r, litFill(c, 0, 0, r, ROOFMATS.thatch.map(hexRgb), 0.2, 0.85));
      c.save();
      c.beginPath();
      c.arc(0, 0, r, 0, 7);
      c.clip();
      c.lineCap = 'round';
      for (let i = 0; i < 260; i++) {
        const a = rnd() * 6.28,
          d = r * Math.sqrt(rnd()),
          l = R * 0.12;
        c.strokeStyle = `rgba(${(130 + rnd() * 60) | 0},${(110 + rnd() * 50) | 0},${(50 + rnd() * 30) | 0},.6)`;
        c.lineWidth = Math.max(0.6, R / 60);
        c.beginPath();
        c.moveTo(Math.cos(a) * d, Math.sin(a) * d);
        c.lineTo(Math.cos(a) * (d + l), Math.sin(a) * (d + l));
        c.stroke();
      }
      c.restore();
      disc(c, 0, 0, R * 0.1, '#3a2a12');
    }
  },
  stilthut_open: {
    cat: 'hidden',
    name: 'Stilt hut (open)',
    w: 2.4,
    h: 2.4,
    z: 1,
    hg: 0.4,
    draw(c, R, rnd) {
      const r = R * 0.95;
      disc(c, 0, 0, r * 1.03, 'rgba(14,8,4,.92)');
      c.save();
      c.beginPath();
      c.arc(0, 0, r, 0, 7);
      c.clip();
      plankRect(c, 0, 0, r * 2, r * 2, 0, R, true, RAMP.bamboo, rnd);
      c.restore();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.28;
        disc(c, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, R * 0.06, '#2a1a0c');
      }
      disc(c, 0, 0, R * 0.16, '#3a2a1a');
      flame(c, 0, 0, R * 0.1);
    }
  },
  totem: {
    cat: 'jungle',
    name: 'Totem',
    w: 0.8,
    h: 0.8,
    z: 3,
    hg: 2.4,
    draw(c, R, rnd) {
      plankRect(c, 0, 0, R * 0.74, R * 0.14, 0, R, true, RAMP.wood, rnd);
      disc(c, 0, 0, R * 0.24, 'rgba(14,8,4,.95)');
      disc(c, 0, 0, R * 0.22, litFill(c, 0, 0, R * 0.22, RAMP.wood, 0.3, 0.9));
      c.fillStyle = '#b3341b';
      disc(c, -R * 0.07, -R * 0.03, R * 0.04, '#e8d8a0');
      disc(c, R * 0.07, -R * 0.03, R * 0.04, '#e8d8a0');
      c.fillStyle = '#1a1410';
      c.fillRect(-R * 0.08, R * 0.07, R * 0.16, R * 0.03);
    }
  },
  canoe: {
    cat: 'jungle',
    name: 'Canoe',
    w: 0.6,
    h: 2.4,
    z: 1,
    hg: 0.3,
    tint: 'wood',
    draw(c, R, rnd) {
      const hull = k => {
        c.beginPath();
        c.moveTo(0, -R * 1.15 * k);
        c.quadraticCurveTo(R * 0.3 * k, 0, 0, R * 1.15 * k);
        c.quadraticCurveTo(-R * 0.3 * k, 0, 0, -R * 1.15 * k);
        c.closePath();
      };
      c.fillStyle = 'rgba(14,8,4,.92)';
      hull(1.05);
      c.fill();
      c.fillStyle = linFill(c, -R * 0.3, 0, R * 0.3, 0, RAMP.wood, 0.8, 0.3);
      hull(1);
      c.fill();
      c.fillStyle = linFill(c, 0, -R, 0, R, RAMP.wood, 0.35, 0.15);
      hull(0.75);
      c.fill();
      plankRect(c, 0, R * 0.2, R * 0.26, R * 0.06, 0, R, true, RAMP.wood, rnd);
    }
  },
  tikitorch: {
    cat: 'jungle',
    name: 'Tiki torch',
    w: 0.4,
    h: 0.4,
    z: 3,
    hg: 1.2,
    light: 3,
    lp: 'torch',
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.09, '#2a1a0c');
      disc(c, 0, 0, R * 0.07, '#a68a4a');
      flame(c, 0, -R * 0.02, R * 0.13);
    }
  },
  idol: {
    cat: 'jungle',
    name: 'Stone idol',
    w: 1.6,
    h: 1.6,
    z: 2,
    hg: 1.6,
    tint: 'stone',
    out: 1,
    draw(c, R, rnd) {
      const r = R * 0.7;
      c.fillStyle = 'rgba(10,10,8,.92)';
      c.beginPath();
      c.roundRect(-r * 0.8 - 1, -r - 1, r * 1.6 + 2, r * 2 + 2, r * 0.5);
      c.fill();
      c.fillStyle = litFill(c, 0, 0, r, RAMP.stone, 0.25, 0.95);
      c.beginPath();
      c.roundRect(-r * 0.8, -r, r * 1.6, r * 2, r * 0.5);
      c.fill();
      c.fillStyle = 'rgba(20,18,14,.55)';
      c.fillRect(-r * 0.55, -r * 0.25, r * 0.4, r * 0.16);
      c.fillRect(r * 0.15, -r * 0.25, r * 0.4, r * 0.16);
      c.beginPath();
      c.moveTo(0, -r * 0.1);
      c.lineTo(-r * 0.14, r * 0.3);
      c.lineTo(r * 0.14, r * 0.3);
      c.closePath();
      c.fill();
      c.fillRect(-r * 0.4, r * 0.5, r * 0.8, r * 0.12);
      c.save();
      c.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 6.28,
          d = r * Math.sqrt(rnd());
        disc(
          c,
          Math.cos(a) * d * 0.8,
          Math.sin(a) * d,
          R * (0.03 + rnd() * 0.05),
          rgba(RAMP.grass, 0.4 + rnd() * 0.4, 0.75)
        );
      }
      c.restore();
    }
  },
  coral: {
    cat: 'jungle',
    name: 'Coral',
    w: 1,
    h: 1,
    z: 0,
    hg: 0.05,
    tint: 'coral',
    draw(c, R, rnd) {
      c.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const x = (rnd() - 0.5) * R * 0.4,
          y = (rnd() - 0.5) * R * 0.4;
        const br = (bx, by, a, l, w, d) => {
          const ex = bx + Math.cos(a) * l,
            ey = by + Math.sin(a) * l;
          c.strokeStyle = rgba(RAMP.coral, 0.3 + d * 0.15);
          c.lineWidth = w;
          c.beginPath();
          c.moveTo(bx, by);
          c.lineTo(ex, ey);
          c.stroke();
          if (d > 0) for (const sg of [-1, 1]) br(ex, ey, a + sg * (0.4 + rnd() * 0.4), l * 0.7, w * 0.7, d - 1);
        };
        for (let i = 0; i < 4; i++) br(x, y, rnd() * 6.28, R * 0.12, R * 0.05, 2);
      }
    }
  },
  shells: {
    cat: 'jungle',
    name: 'Shells & starfish',
    w: 0.6,
    h: 0.6,
    z: 0,
    hg: 0.03,
    draw(c, R, rnd) {
      c.fillStyle = '#e8844a';
      star5(c, -R * 0.08, 0, R * 0.12, rnd() * 6);
      c.fill();
      c.fillStyle = 'rgba(255,230,200,.6)';
      star5(c, -R * 0.08, 0, R * 0.05, 0);
      c.fill();
      for (let i = 0; i < 3; i++) {
        const x = (rnd() - 0.2) * R * 0.3,
          y = (rnd() - 0.5) * R * 0.3;
        c.fillStyle = ['#f4ece0', '#efc9b8', '#e0cfa8'][i];
        c.beginPath();
        c.ellipse(x, y, R * 0.05, R * 0.035, rnd() * 3, 0, 7);
        c.fill();
      }
    }
  },
  driftwood: {
    cat: 'jungle',
    name: 'Driftwood',
    w: 1.6,
    h: 0.5,
    z: 1,
    hg: 0.3,
    draw(c, R, rnd) {
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(20,16,12,.85)';
      c.lineWidth = R * 0.2;
      c.beginPath();
      c.moveTo(-R * 0.7, R * 0.05);
      c.quadraticCurveTo(0, -R * 0.12, R * 0.7, R * 0.02);
      c.stroke();
      c.strokeStyle = '#b9ad98';
      c.lineWidth = R * 0.16;
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.3)';
      c.lineWidth = R * 0.04;
      c.beginPath();
      c.moveTo(-R * 0.6, -R * 0.01);
      c.quadraticCurveTo(0, -R * 0.16, R * 0.6, -R * 0.03);
      c.stroke();
      c.strokeStyle = '#a89c86';
      c.lineWidth = R * 0.07;
      c.beginPath();
      c.moveTo(R * 0.2, -R * 0.05);
      c.lineTo(R * 0.38, -R * 0.22);
      c.stroke();
    }
  },
  ziggurat: {
    cat: 'jungle',
    name: 'Stepped pyramid',
    w: 5,
    h: 5,
    z: 2,
    hg: 3,
    tint: 'stone',
    out: 1,
    draw(c, R, rnd) {
      for (let k = 0; k < 4; k++) {
        const s = R * (2.4 - k * 0.55),
          t = 0.35 + k * 0.15;
        c.fillStyle = 'rgba(10,10,8,.9)';
        c.fillRect(-s - 1, -s - 1, 2 * s + 2, 2 * s + 2);
        c.fillStyle = linFill(c, -s, -s, s, s, RAMP.stone, t + 0.25, t - 0.2);
        c.fillRect(-s, -s, 2 * s, 2 * s);
        c.strokeStyle = 'rgba(0,0,0,.25)';
        c.lineWidth = Math.max(0.6, R / 60);
        for (let q = -s + R * 0.2; q < s; q += R * 0.2) {
          c.beginPath();
          c.moveTo(-s, q);
          c.lineTo(s, q);
          c.stroke();
        }
      }
      c.fillStyle = 'rgba(10,10,8,.9)';
      c.fillRect(-R * 0.32, R * 0.3, R * 0.64, R * 2.12);
      c.fillStyle = linFill(c, 0, R * 0.3, 0, R * 2.4, RAMP.stone, 0.85, 0.4);
      c.fillRect(-R * 0.3, R * 0.3, R * 0.6, R * 2.1);
      c.strokeStyle = 'rgba(0,0,0,.4)';
      c.beginPath();
      for (let q = R * 0.4; q < R * 2.4; q += R * 0.14) {
        c.moveTo(-R * 0.3, q);
        c.lineTo(R * 0.3, q);
      }
      c.stroke();
    }
  },
  // ---- ships & docks ----
  sloop: {
    cat: 'ship',
    name: 'Sailing ship',
    w: 4,
    h: 11,
    z: 1,
    hg: 0.5,
    tint: 'wood',
    draw(c, R, rnd) {
      const W = R * 1.9,
        H = R * 5.3,
        hull = k => {
          c.beginPath();
          c.moveTo(0, -H * k);
          c.bezierCurveTo(W * 1.05 * k, -H * 0.55 * k, W * k, H * 0.55 * k, W * 0.8 * k, H * k);
          c.lineTo(-W * 0.8 * k, H * k);
          c.bezierCurveTo(-W * k, H * 0.55 * k, -W * 1.05 * k, -H * 0.55 * k, 0, -H * k);
          c.closePath();
        };
      c.fillStyle = 'rgba(8,5,2,.95)';
      hull(1.02);
      c.fill();
      c.fillStyle = rgba(RAMP.wood, 0.12);
      hull(1);
      c.fill();
      c.save();
      hull(0.92);
      c.clip();
      plankRect(c, 0, 0, W * 2, H * 2, 0, R, false, RAMP.wood, rnd);
      c.restore();
      c.strokeStyle = 'rgba(8,5,2,.9)';
      c.lineWidth = R * 0.12;
      hull(0.94);
      c.stroke();
      c.strokeStyle = rgba(RAMP.wood, 0.75);
      c.lineWidth = R * 0.05;
      c.stroke();
      c.strokeStyle = '#2a1a0c';
      c.lineWidth = R * 0.1;
      c.beginPath();
      c.moveTo(0, -H);
      c.lineTo(0, -H - R * 0.1);
      c.stroke();
      for (const [y, yl] of [
        [-H * 0.35, R * 1.7],
        [H * 0.2, R * 1.9]
      ]) {
        c.fillStyle = 'rgba(8,5,2,.9)';
        c.fillRect(-yl, y - R * 0.07, yl * 2, R * 0.14);
        c.fillStyle = '#e8dcc0';
        c.fillRect(-yl * 0.96, y - R * 0.05, yl * 1.92, R * 0.1);
        disc(c, 0, y, R * 0.2, 'rgba(8,5,2,.95)');
        disc(c, 0, y, R * 0.16, litFill(c, 0, y, R * 0.16, RAMP.wood, 0.3, 0.9));
      }
      for (const y of [-H * 0.05, H * 0.45]) {
        c.fillStyle = 'rgba(8,5,2,.9)';
        c.fillRect(-R * 0.35, y - R * 0.3, R * 0.7, R * 0.6);
        c.fillStyle = '#1a120a';
        c.fillRect(-R * 0.3, y - R * 0.25, R * 0.6, R * 0.5);
        c.strokeStyle = '#6a4a2a';
        c.lineWidth = Math.max(0.8, R / 40);
        c.beginPath();
        for (let q = -R * 0.2; q <= R * 0.2; q += R * 0.1) {
          c.moveTo(q, y - R * 0.25);
          c.lineTo(q, y + R * 0.25);
          c.moveTo(-R * 0.3, y + q);
          c.lineTo(R * 0.3, y + q);
        }
        c.stroke();
      }
      c.fillStyle = 'rgba(8,5,2,.9)';
      c.fillRect(-W * 0.7, H * 0.72, W * 1.4, H * 0.24);
      plankRect(c, 0, H * 0.84, W * 1.36, H * 0.2, 0, R, true, RAMP.wood, rnd);
      disc(c, 0, H * 0.7, R * 0.2, '#2a1a0c');
      c.strokeStyle = '#c9a23a';
      c.lineWidth = Math.max(1, R / 30);
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.28;
        c.moveTo(0, H * 0.7);
        c.lineTo(Math.cos(a) * R * 0.22, H * 0.7 + Math.sin(a) * R * 0.22);
      }
      c.stroke();
    }
  },
  mast: {
    cat: 'ship',
    name: 'Mast & yard',
    w: 3,
    h: 0.6,
    z: 3,
    hg: 2.5,
    draw(c, R, rnd) {
      c.fillStyle = 'rgba(8,5,2,.9)';
      c.fillRect(-R * 1.45, -R * 0.09, R * 2.9, R * 0.18);
      c.fillStyle = '#e8dcc0';
      c.beginPath();
      c.roundRect(-R * 1.4, -R * 0.07, R * 2.8, R * 0.14, R * 0.05);
      c.fill();
      c.strokeStyle = 'rgba(120,100,70,.5)';
      c.lineWidth = Math.max(0.6, R / 70);
      c.beginPath();
      for (let q = -R * 1.3; q < R * 1.4; q += R * 0.25) {
        c.moveTo(q, -R * 0.07);
        c.lineTo(q + R * 0.05, R * 0.07);
      }
      c.stroke();
      disc(c, 0, 0, R * 0.2, 'rgba(8,5,2,.95)');
      disc(c, 0, 0, R * 0.16, litFill(c, 0, 0, R * 0.16, RAMP.wood, 0.3, 0.9));
    }
  },
  cannon: {
    cat: 'ship',
    name: 'Cannon',
    w: 0.7,
    h: 1.4,
    z: 2,
    hg: 0.6,
    draw(c, R, rnd) {
      plankRect(c, 0, R * 0.2, R * 0.5, R * 0.7, 0, R, false, RAMP.wood, rnd);
      for (const sx of [-1, 1]) disc(c, sx * R * 0.27, R * 0.3, R * 0.07, '#1a1410');
      c.fillStyle = 'rgba(4,4,6,.95)';
      c.beginPath();
      c.roundRect(-R * 0.13, -R * 0.65, R * 0.26, R * 1.05, R * 0.1);
      c.fill();
      c.fillStyle = linFill(c, -R * 0.12, 0, R * 0.12, 0, RAMP.metal, 0.75, 0.15);
      c.beginPath();
      c.roundRect(-R * 0.11, -R * 0.63, R * 0.22, R * 1.0, R * 0.09);
      c.fill();
      disc(c, 0, -R * 0.62, R * 0.06, '#050506');
    }
  },
  ropecoil: {
    cat: 'ship',
    name: 'Rope coil',
    w: 0.6,
    h: 0.6,
    z: 1,
    hg: 0.2,
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.26, 'rgba(30,22,10,.85)');
      c.strokeStyle = '#b79a62';
      c.lineWidth = R * 0.045;
      c.beginPath();
      for (let t = 0; t < 22; t += 0.1) {
        const r = R * (0.03 + t * 0.0105);
        c.lineTo(Math.cos(t) * r, Math.sin(t) * r);
      }
      c.stroke();
      c.strokeStyle = 'rgba(80,60,30,.6)';
      c.lineWidth = R * 0.012;
      c.stroke();
    }
  },
  anchor: {
    cat: 'ship',
    name: 'Anchor',
    w: 1,
    h: 1.4,
    z: 1,
    hg: 0.2,
    draw(c, R, rnd) {
      c.lineCap = 'round';
      for (const [col, w] of [
        ['rgba(4,4,6,.95)', R * 0.14],
        ['#4a4d54', R * 0.09]
      ]) {
        c.strokeStyle = col;
        c.lineWidth = w;
        c.beginPath();
        c.moveTo(0, -R * 0.55);
        c.lineTo(0, R * 0.45);
        c.moveTo(-R * 0.25, -R * 0.4);
        c.lineTo(R * 0.25, -R * 0.4);
        c.moveTo(-R * 0.38, R * 0.25);
        c.quadraticCurveTo(0, R * 0.65, R * 0.38, R * 0.25);
        c.stroke();
      }
      c.strokeStyle = '#2a2c30';
      c.lineWidth = R * 0.05;
      c.beginPath();
      c.arc(0, -R * 0.62, R * 0.08, 0, 7);
      c.stroke();
    }
  },
  cargonet: {
    cat: 'ship',
    name: 'Cargo net',
    w: 1.4,
    h: 1.4,
    z: 2,
    hg: 0.8,
    draw(c, R, rnd) {
      for (const [x, y] of [
        [-0.25, -0.2],
        [0.25, -0.15],
        [-0.15, 0.25],
        [0.28, 0.3]
      ])
        plankRect(c, x * R, y * R, R * 0.5, R * 0.5, (rnd() - 0.5) * 0.2, R, true, RAMP.wood, rnd);
      c.save();
      c.beginPath();
      c.arc(0, 0, R * 0.62, 0, 7);
      c.clip();
      c.strokeStyle = 'rgba(200,170,110,.75)';
      c.lineWidth = Math.max(0.8, R / 45);
      c.beginPath();
      for (let q = -R; q < R; q += R * 0.14) {
        c.moveTo(q, -R);
        c.lineTo(q + R, R);
        c.moveTo(q, R);
        c.lineTo(q + R, -R);
      }
      c.stroke();
      c.restore();
    }
  },
  crane: {
    cat: 'ship',
    name: 'Dock crane',
    w: 1,
    h: 3,
    z: 3,
    hg: 2.4,
    tint: 'wood',
    draw(c, R, rnd) {
      plankRect(c, 0, R * 1.1, R * 0.7, R * 0.7, 0, R, true, RAMP.wood, rnd);
      plankRect(c, 0, -R * 0.2, R * 0.18, R * 2.5, 0, R, false, RAMP.wood, rnd);
      c.strokeStyle = '#a58a5a';
      c.lineWidth = R * 0.025;
      c.beginPath();
      c.moveTo(0, -R * 1.4);
      c.lineTo(R * 0.02, -R * 1.1);
      c.stroke();
      c.strokeStyle = '#2a2c30';
      c.lineWidth = R * 0.04;
      c.beginPath();
      c.arc(R * 0.02, -R * 1.05, R * 0.06, 0, 3.5);
      c.stroke();
    }
  },
  shipwheel: {
    cat: 'ship',
    name: "Ship's wheel",
    w: 0.8,
    h: 0.8,
    z: 2,
    hg: 0.8,
    draw(c, R, rnd) {
      c.strokeStyle = 'rgba(8,5,2,.95)';
      c.lineWidth = R * 0.1;
      c.beginPath();
      c.arc(0, 0, R * 0.28, 0, 7);
      c.stroke();
      c.strokeStyle = rgba(RAMP.wood, 0.65);
      c.lineWidth = R * 0.06;
      c.stroke();
      c.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.28;
        c.strokeStyle = rgba(RAMP.wood, 0.5);
        c.lineWidth = R * 0.04;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.38);
        c.stroke();
      }
      disc(c, 0, 0, R * 0.07, '#c9a23a');
    }
  },
  bollard: {
    cat: 'ship',
    name: 'Bollard',
    w: 0.4,
    h: 0.4,
    z: 2,
    hg: 0.5,
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.15, 'rgba(4,4,6,.95)');
      disc(c, 0, 0, R * 0.13, litFill(c, 0, 0, R * 0.13, RAMP.metal, 0.2, 0.85));
      c.strokeStyle = '#b79a62';
      c.lineWidth = R * 0.03;
      c.beginPath();
      c.arc(0, 0, R * 0.16, 0, 4);
      c.stroke();
    }
  },
  gangplank: {
    cat: 'ship',
    name: 'Gangplank',
    w: 0.6,
    h: 2.4,
    z: 1,
    hg: 0.2,
    draw(c, R, rnd) {
      plankRect(c, 0, 0, R * 0.5, R * 2.3, 0, R, false, RAMP.wood, rnd);
      c.strokeStyle = 'rgba(20,10,4,.7)';
      c.lineWidth = R * 0.04;
      c.beginPath();
      for (let q = -R; q < R * 1.1; q += R * 0.25) {
        c.moveTo(-R * 0.22, q);
        c.lineTo(R * 0.22, q);
      }
      c.stroke();
    }
  },
  buoy: {
    cat: 'ship',
    name: 'Buoy',
    w: 0.6,
    h: 0.6,
    z: 1,
    hg: 0.3,
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.2, 'rgba(4,4,6,.9)');
      disc(c, 0, 0, R * 0.18, '#c8301e');
      c.fillStyle = '#efe7d3';
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, R * 0.18, 0, 1.57);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, R * 0.18, 3.14, 4.71);
      c.closePath();
      c.fill();
      disc(c, -R * 0.05, -R * 0.05, R * 0.04, 'rgba(255,255,255,.6)');
    }
  },
  lighthouse: {
    cat: 'ship',
    name: 'Lighthouse',
    w: 3,
    h: 3,
    z: 3,
    hg: 4,
    lp: 'beacon',
    light: 6,
    draw(c, R, rnd) {
      const r = R * 1.3;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * 6.28;
        c.save();
        c.translate(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92);
        c.rotate(a);
        blockRect(c, 0, 0, r * 0.16, r * 0.28, 0, R);
        c.restore();
      }
      disc(c, 0, 0, r * 0.8, 'rgba(8,8,10,.95)');
      disc(c, 0, 0, r * 0.76, litFill(c, 0, 0, r * 0.76, RAMP.stone, 0.3, 0.9));
      disc(c, 0, 0, r * 0.5, '#16161a');
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.46);
      g.addColorStop(0, '#fff6d0');
      g.addColorStop(0.6, '#f0c060');
      g.addColorStop(1, 'rgba(120,90,40,.8)');
      disc(c, 0, 0, r * 0.46, g);
      c.strokeStyle = '#16161a';
      c.lineWidth = Math.max(1, R / 30);
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.28;
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
      }
      c.stroke();
      disc(c, 0, 0, r * 0.16, '#c03020');
    }
  },
  grate: {
    cat: 'ship',
    name: 'Deck hatch',
    w: 1,
    h: 1,
    z: 0,
    hg: 0.05,
    draw(c, R, rnd) {
      c.fillStyle = 'rgba(8,5,2,.9)';
      c.fillRect(-R * 0.45, -R * 0.45, R * 0.9, R * 0.9);
      c.fillStyle = '#120c06';
      c.fillRect(-R * 0.4, -R * 0.4, R * 0.8, R * 0.8);
      c.strokeStyle = rgba(RAMP.wood, 0.55);
      c.lineWidth = Math.max(1, R / 30);
      c.beginPath();
      for (let q = -R * 0.3; q <= R * 0.3; q += R * 0.15) {
        c.moveTo(q, -R * 0.4);
        c.lineTo(q, R * 0.4);
        c.moveTo(-R * 0.4, q);
        c.lineTo(R * 0.4, q);
      }
      c.stroke();
    }
  }
});
Object.assign(SCATTER_SETS, {
  cavefloor: { name: 'Cave floor', keys: ['stalag', 'stalags', 'rocks', 'rocks'] },
  grotto: { name: 'Crystal grotto', keys: ['crystals', 'crystals', 'glowshroom'] },
  fungus: { name: 'Fungus cavern', keys: ['giantshroom', 'glowshroom', 'glowshroom'] },
  jungleset: { name: 'Jungle', keys: ['jtree', 'jtree', 'palm', 'fern', 'fern', 'bigleaf'] },
  beachset: { name: 'Beach', keys: ['palm', 'shells', 'driftwood'] },
  reefset: { name: 'Reef', keys: ['coral', 'coral', 'shells'] },
  harbour: { name: 'Harbour clutter', keys: ['crate', 'barrel', 'ropecoil', 'cargonet', 'bollard'] }
});
STAMP_KEYS.push(...Object.keys(STAMPS).filter(k => !STAMP_KEYS.includes(k) && STAMPS[k].cat !== 'hidden'));
// ---- Steampunk pack ----
Object.assign(RAMP, {
  brass: ['#1c1206', '#3e2a0e', '#6a4a18', '#9a7228', '#c49a40', '#ecd282'].map(hexRgb),
  copper: ['#200e06', '#43200e', '#6e3618', '#9a5228', '#c4743e', '#eaa676'].map(hexRgb),
  fabric: ['#2e261a', '#4c4030', '#6c5c44', '#8e7c5e', '#b29f7e', '#d8caa6'].map(hexRgb)
});
function cog(c, x, y, r, n, ramp, R) {
  // a gear seen face-on
  const path = k => {
    c.beginPath();
    for (let i = 0; i <= n * 4; i++) {
      const a = (i / (n * 4)) * 6.2832,
        rr = (i % 4 < 2 ? r : r * 0.8) * k;
      i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  };
  c.fillStyle = 'rgba(6,5,3,.92)';
  path(1.07);
  c.fill();
  c.fillStyle = litFill(c, x, y, r, ramp, 0.25, 0.95);
  path(1);
  c.fill();
  disc(c, x, y, r * 0.68, rgba(ramp, 0.3));
  const h = Math.max(3, Math.round(n / 2.5));
  for (let i = 0; i < h; i++) {
    const a = (i / h) * 6.2832 + 0.3;
    disc(c, x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.15, '#0d0a06');
  }
  disc(c, x, y, r * 0.24, litFill(c, x, y, r * 0.24, ramp, 0.4, 0.95));
  disc(c, x, y, r * 0.08, '#0a0805');
  c.strokeStyle = 'rgba(255,240,200,.35)';
  c.lineWidth = Math.max(0.6, R / 60);
  c.beginPath();
  c.arc(x, y, r * 0.74, 3.6, 5.2);
  c.stroke();
}
function pipeSeg(c, x0, y0, x1, y1, w, ramp, R, flanges = true) {
  // straight pipe with cylinder shading
  const L = Math.hypot(x1 - x0, y1 - y0);
  c.save();
  c.translate(x0, y0);
  c.rotate(Math.atan2(y1 - y0, x1 - x0));
  c.fillStyle = 'rgba(6,4,2,.92)';
  c.fillRect(-1, -w / 2 - 1, L + 2, w + 2);
  const g = c.createLinearGradient(0, -w / 2, 0, w / 2);
  g.addColorStop(0, rgba(ramp, 0.25));
  g.addColorStop(0.32, rgba(ramp, 0.95));
  g.addColorStop(0.55, rgba(ramp, 0.6));
  g.addColorStop(1, rgba(ramp, 0.12));
  c.fillStyle = g;
  c.fillRect(0, -w / 2, L, w);
  if (flanges)
    for (const fx of [0, L]) {
      const fw = w * 0.35;
      c.fillStyle = 'rgba(6,4,2,.92)';
      c.fillRect(fx - fw / 2 - 1, -w * 0.7 - 1, fw + 2, w * 1.4 + 2);
      c.fillStyle = g;
      c.save();
      c.scale(1, 1.4);
      c.fillRect(fx - fw / 2, -w / 2, fw, w);
      c.restore();
      for (const sy of [-1, 1]) disc(c, fx, sy * w * 0.5, Math.max(0.8, w * 0.08), 'rgba(255,240,200,.7)');
    }
  c.restore();
}
function pipeBend(c, cx, cy, rr, a0, a1, w, ramp, R) {
  // quarter bend: concentric strokes fake a curved cylinder
  c.lineCap = 'butt';
  c.strokeStyle = 'rgba(6,4,2,.92)';
  c.lineWidth = w + 2;
  c.beginPath();
  c.arc(cx, cy, rr, a0, a1);
  c.stroke();
  for (let j = 0; j < 10; j++) {
    const f = j / 9,
      t = f < 0.32 ? 0.25 + (f / 0.32) * 0.7 : 0.95 - ((f - 0.32) / 0.68) * 0.83;
    c.strokeStyle = rgba(ramp, t);
    c.lineWidth = w / 10 + 0.8;
    c.beginPath();
    c.arc(cx, cy, rr - w / 2 + f * w, a0, a1);
    c.stroke();
  }
}
function rivets(c, pts, R) {
  for (const [x, y] of pts) {
    disc(c, x + 0.4, y + 0.5, Math.max(0.8, R * 0.025), 'rgba(0,0,0,.5)');
    disc(c, x, y, Math.max(0.7, R * 0.022), 'rgba(255,236,190,.75)');
  }
}
Object.assign(STAMPS, {
  gear: {
    cat: 'steam',
    name: 'Big gear',
    w: 2,
    h: 2,
    z: 1,
    hg: 0.2,
    tint: 'brass',
    draw(c, R, rnd) {
      cog(c, 0, 0, R * 0.9, 14 + ((rnd() * 6) | 0), RAMP.brass, R);
    }
  },
  gears: {
    cat: 'steam',
    name: 'Gear train',
    w: 2,
    h: 1.6,
    z: 1,
    hg: 0.3,
    tint: 'brass',
    draw(c, R, rnd) {
      cog(c, -R * 0.42, R * 0.1, R * 0.52, 12, RAMP.brass, R);
      cog(c, R * 0.5, -R * 0.2, R * 0.4, 9, RAMP.copper, R);
      cog(c, R * 0.62, R * 0.52, R * 0.24, 7, RAMP.metal, R);
    }
  },
  pipe: {
    cat: 'steam',
    name: 'Pipe',
    w: 0.6,
    h: 2,
    z: 1,
    hg: 0.4,
    tint: 'copper',
    draw(c, R, rnd) {
      pipeSeg(c, 0, -R * 0.95, 0, R * 0.95, R * 0.26, RAMP.copper, R);
    }
  },
  pipebend: {
    cat: 'steam',
    name: 'Pipe bend',
    w: 1,
    h: 1,
    z: 1,
    hg: 0.4,
    tint: 'copper',
    draw(c, R, rnd) {
      pipeBend(c, -R * 0.5, -R * 0.5, R * 0.5, 0, Math.PI / 2, R * 0.26, RAMP.copper, R);
    }
  },
  pipetee: {
    cat: 'steam',
    name: 'Pipe junction & valve',
    w: 1,
    h: 1,
    z: 2,
    hg: 0.7,
    tint: 'copper',
    draw(c, R, rnd) {
      pipeSeg(c, -R * 0.5, 0, R * 0.5, 0, R * 0.26, RAMP.copper, R, false);
      pipeSeg(c, 0, 0, 0, R * 0.5, R * 0.26, RAMP.copper, R, false);
      disc(c, 0, 0, R * 0.2, 'rgba(6,4,2,.92)');
      disc(c, 0, 0, R * 0.18, litFill(c, 0, 0, R * 0.18, RAMP.brass, 0.3, 0.9));
      c.strokeStyle = '#2a0c08';
      c.lineWidth = R * 0.07;
      c.beginPath();
      c.arc(0, 0, R * 0.3, 0, 7);
      c.stroke();
      c.strokeStyle = '#b8301c';
      c.lineWidth = R * 0.045;
      c.stroke();
      c.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + 0.4;
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3);
      }
      c.lineWidth = R * 0.03;
      c.stroke();
      disc(c, 0, 0, R * 0.05, '#e8d090');
    }
  },
  boiler: {
    cat: 'steam',
    name: 'Boiler',
    w: 2,
    h: 3,
    z: 2,
    hg: 2,
    tint: 'copper',
    lp: 'glow',
    lc: '#ff8a3a',
    draw(c, R, rnd) {
      const w = R * 0.85,
        h = R * 1.4,
        cap = k => {
          c.beginPath();
          c.roundRect(-w * k, -h * k, 2 * w * k, 2 * h * k, w * k);
        };
      c.fillStyle = 'rgba(6,4,2,.94)';
      cap(1.04);
      c.fill();
      c.fillStyle = linFill(c, -w, 0, w, 0, RAMP.copper, 0.25, 0.95);
      cap(1);
      c.fill();
      c.fillStyle = linFill(c, -w, 0, w, 0, RAMP.copper, 0.9, 0.2);
      cap(1);
      c.save();
      c.clip();
      c.globalAlpha = 0.35;
      c.fillRect(-w, -h, w * 0.6, 2 * h);
      c.restore();
      for (const y of [-h * 0.45, 0, h * 0.45]) {
        c.fillStyle = 'rgba(10,6,2,.55)';
        c.fillRect(-w, y - R * 0.03, 2 * w, R * 0.06);
        const pts = [];
        for (let q = -w * 0.85; q <= w * 0.85; q += w * 0.28) pts.push([q, y]);
        rivets(c, pts, R);
      }
      disc(c, 0, -h * 0.7, R * 0.22, 'rgba(6,4,2,.94)');
      disc(c, 0, -h * 0.7, R * 0.19, litFill(c, 0, -h * 0.7, R * 0.19, RAMP.brass, 0.3, 0.95));
      disc(c, 0, -h * 0.7, R * 0.1, '#120c06');
      disc(c, w * 0.55, h * 0.1, R * 0.14, '#2a2010');
      disc(c, w * 0.55, h * 0.1, R * 0.11, '#efe6cc');
      c.strokeStyle = '#b02010';
      c.lineWidth = Math.max(0.8, R / 50);
      c.beginPath();
      c.moveTo(w * 0.55, h * 0.1);
      c.lineTo(w * 0.55 + R * 0.08, h * 0.1 - R * 0.05);
      c.stroke();
      c.fillStyle = '#140a04';
      c.fillRect(-R * 0.3, h * 0.7, R * 0.6, R * 0.3);
      const g = c.createRadialGradient(0, h * 0.86, 0, 0, h * 0.86, R * 0.3);
      g.addColorStop(0, '#ffe0a0');
      g.addColorStop(0.5, '#ff7a20');
      g.addColorStop(1, 'rgba(120,20,0,.3)');
      c.fillStyle = g;
      c.fillRect(-R * 0.26, h * 0.73, R * 0.52, R * 0.24);
    }
  },
  furnace: {
    cat: 'steam',
    name: 'Furnace',
    w: 2,
    h: 2,
    z: 2,
    hg: 1.6,
    lp: 'campfire',
    lc: '#ff9a40',
    draw(c, R, rnd) {
      const s = R * 0.9;
      c.fillStyle = 'rgba(8,6,4,.94)';
      c.fillRect(-s - 1, -s - 1, 2 * s + 2, 2 * s + 2);
      for (let yy = -s; yy < s - 1; yy += R * 0.2)
        for (let xx = -s + ((yy / (R * 0.2)) & 1 ? R * 0.15 : 0); xx < s - 1; xx += R * 0.3) {
          const bw = Math.min(R * 0.3, s - xx);
          c.fillStyle = `rgb(${(110 + rnd() * 40) | 0},${(48 + rnd() * 20) | 0},${(34 + rnd() * 14) | 0})`;
          c.fillRect(xx + 1, yy + 1, bw - 2, R * 0.2 - 2);
        }
      c.fillStyle = '#0c0806';
      c.fillRect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 0.6);
      g.addColorStop(0, '#fff2c0');
      g.addColorStop(0.4, '#ffaa30');
      g.addColorStop(0.8, '#c83a10');
      g.addColorStop(1, 'rgba(60,10,0,.6)');
      c.fillStyle = g;
      c.fillRect(-s * 0.5, -s * 0.5, s, s);
      for (let i = 0; i < 9; i++)
        rock(c, (rnd() - 0.5) * s * 0.8, (rnd() - 0.5) * s * 0.8, R * (0.05 + rnd() * 0.05), rnd, R);
    }
  },
  gaslamp: {
    cat: 'steam',
    name: 'Gas lamp',
    w: 0.6,
    h: 0.6,
    z: 3,
    hg: 2,
    lp: 'lamp',
    lc: '#ffe2a8',
    light: 4,
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.2, 'rgba(6,6,8,.94)');
      c.fillStyle = linFill(c, -R * 0.17, -R * 0.17, R * 0.17, R * 0.17, RAMP.metal, 0.7, 0.2);
      c.beginPath();
      c.moveTo(0, -R * 0.19);
      for (let i = 1; i < 6; i++) {
        const a = -Math.PI / 2 + (i / 6) * 6.2832;
        c.lineTo(Math.cos(a) * R * 0.19, Math.sin(a) * R * 0.19);
      }
      c.closePath();
      c.fill();
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.13);
      g.addColorStop(0, '#fffbe8');
      g.addColorStop(0.6, '#ffd890');
      g.addColorStop(1, 'rgba(200,140,60,.7)');
      disc(c, 0, 0, R * 0.13, g);
      disc(c, 0, 0, R * 0.05, '#3a3020');
    }
  },
  tesla: {
    cat: 'steam',
    name: 'Tesla coil',
    w: 1.4,
    h: 1.4,
    z: 3,
    hg: 2.4,
    lp: 'torch',
    lc: '#9fd0ff',
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.6, 'rgba(6,6,8,.94)');
      disc(c, 0, 0, R * 0.56, litFill(c, 0, 0, R * 0.56, RAMP.metal, 0.2, 0.75));
      rivets(
        c,
        Array.from({ length: 10 }, (_, i) => [Math.cos(i * 0.628) * R * 0.5, Math.sin(i * 0.628) * R * 0.5]),
        R
      );
      for (let k = 0; k < 7; k++) {
        c.strokeStyle = k % 2 ? rgba(RAMP.copper, 0.8) : rgba(RAMP.copper, 0.45);
        c.lineWidth = R * 0.035;
        c.beginPath();
        c.arc(0, 0, R * (0.12 + k * 0.035), 0, 7);
        c.stroke();
      }
      c.strokeStyle = 'rgba(6,6,8,.9)';
      c.lineWidth = R * 0.15;
      c.beginPath();
      c.arc(0, 0, R * 0.4, 0, 7);
      c.stroke();
      c.strokeStyle = 'rgba(210,220,230,.95)';
      c.lineWidth = R * 0.1;
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.7)';
      c.lineWidth = R * 0.03;
      c.beginPath();
      c.arc(0, 0, R * 0.42, 3.4, 5);
      c.stroke();
      c.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        let a = rnd() * 6.28,
          x = Math.cos(a) * R * 0.45,
          y = Math.sin(a) * R * 0.45;
        c.beginPath();
        c.moveTo(x, y);
        for (let k = 0; k < 5; k++) {
          x += Math.cos(a) * R * 0.07 + (rnd() - 0.5) * R * 0.12;
          y += Math.sin(a) * R * 0.07 + (rnd() - 0.5) * R * 0.12;
          c.lineTo(x, y);
        }
        c.strokeStyle = 'rgba(120,190,255,.55)';
        c.lineWidth = R * 0.06;
        c.stroke();
        c.strokeStyle = '#eef8ff';
        c.lineWidth = Math.max(0.7, R * 0.018);
        c.stroke();
      }
    }
  },
  automaton: {
    cat: 'steam',
    name: 'Clockwork automaton',
    w: 1,
    h: 1,
    z: 3,
    hg: 1.8,
    tint: 'brass',
    draw(c, R, rnd) {
      for (const sx of [-1, 1]) {
        disc(c, sx * R * 0.34, R * 0.02, R * 0.11, 'rgba(6,4,2,.94)');
        disc(
          c,
          sx * R * 0.34,
          R * 0.02,
          R * 0.09,
          litFill(c, sx * R * 0.34, R * 0.02, R * 0.09, RAMP.brass, 0.3, 0.95)
        );
      }
      c.fillStyle = 'rgba(6,4,2,.94)';
      c.beginPath();
      c.ellipse(0, 0, R * 0.32, R * 0.2, 0, 0, 7);
      c.fill();
      c.fillStyle = litFill(c, 0, 0, R * 0.3, RAMP.brass, 0.25, 0.95);
      c.beginPath();
      c.ellipse(0, 0, R * 0.3, R * 0.18, 0, 0, 7);
      c.fill();
      rivets(
        c,
        [
          [-R * 0.2, -R * 0.08],
          [R * 0.2, -R * 0.08],
          [-R * 0.2, R * 0.08],
          [R * 0.2, R * 0.08]
        ],
        R
      );
      c.strokeStyle = 'rgba(6,4,2,.9)';
      c.lineWidth = R * 0.05;
      c.beginPath();
      c.moveTo(0, R * 0.14);
      c.lineTo(0, R * 0.32);
      c.stroke();
      c.strokeStyle = rgba(RAMP.brass, 0.8);
      c.lineWidth = R * 0.03;
      c.stroke();
      c.fillStyle = rgba(RAMP.brass, 0.75);
      c.beginPath();
      c.ellipse(-R * 0.07, R * 0.34, R * 0.07, R * 0.04, 0, 0, 7);
      c.ellipse(R * 0.07, R * 0.34, R * 0.07, R * 0.04, 0, 0, 7);
      c.fill();
      disc(c, 0, -R * 0.04, R * 0.15, 'rgba(6,6,8,.94)');
      disc(c, 0, -R * 0.04, R * 0.13, litFill(c, 0, -R * 0.04, R * 0.13, RAMP.metal, 0.3, 0.9));
      for (const sx of [-1, 1]) {
        disc(c, sx * R * 0.05, -R * 0.12, R * 0.035, 'rgba(120,220,255,.5)');
        disc(c, sx * R * 0.05, -R * 0.12, R * 0.018, '#e8fbff');
      }
    }
  },
  workbench: {
    cat: 'steam',
    name: 'Tinker bench',
    w: 2,
    h: 1,
    z: 2,
    hg: 0.9,
    tint: 'wood',
    draw(c, R, rnd) {
      plankRect(c, 0, 0, R * 1.9, R * 0.85, 0, R, true, RAMP.wood, rnd);
      cog(c, -R * 0.6, -R * 0.1, R * 0.16, 8, RAMP.brass, R);
      cog(c, -R * 0.38, R * 0.15, R * 0.1, 7, RAMP.copper, R);
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(6,6,8,.9)';
      c.lineWidth = R * 0.07;
      c.beginPath();
      c.moveTo(R * 0.05, -R * 0.2);
      c.lineTo(R * 0.4, R * 0.1);
      c.stroke();
      c.strokeStyle = rgba(RAMP.metal, 0.7);
      c.lineWidth = R * 0.04;
      c.stroke();
      c.lineWidth = R * 0.035;
      c.beginPath();
      c.arc(R * 0.05, -R * 0.2, R * 0.05, 0.5, 5.5);
      c.stroke();
      c.fillStyle = 'rgba(6,6,8,.9)';
      c.fillRect(R * 0.58, -R * 0.32, R * 0.3, R * 0.2);
      c.fillStyle = linFill(c, R * 0.6, 0, R * 0.86, 0, RAMP.metal, 0.7, 0.3);
      c.fillRect(R * 0.6, -R * 0.3, R * 0.26, R * 0.16);
      for (let i = 0; i < 5; i++)
        disc(c, R * (0.05 + rnd() * 0.5), R * (0.15 + rnd() * 0.15), R * 0.02, rgba(RAMP.brass, 0.9));
      disc(c, R * 0.7, R * 0.2, R * 0.09, '#efe6cc');
      c.strokeStyle = '#2a2010';
      c.lineWidth = Math.max(0.6, R / 60);
      c.beginPath();
      c.arc(R * 0.7, R * 0.2, R * 0.09, 0, 7);
      c.stroke();
    }
  },
  smokestack: {
    cat: 'steam',
    name: 'Smokestack',
    w: 1.4,
    h: 1.4,
    z: 4,
    hg: 4,
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.46, 'rgba(6,4,2,.94)');
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * 6.2832;
        c.save();
        c.rotate(a);
        c.fillStyle = `rgb(${(105 + rnd() * 40) | 0},${(44 + rnd() * 18) | 0},${(32 + rnd() * 14) | 0})`;
        c.fillRect(R * 0.3, -R * 0.08, R * 0.14, R * 0.15);
        c.restore();
      }
      disc(c, 0, 0, R * 0.3, '#141210');
      const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.3);
      g.addColorStop(0, '#000');
      g.addColorStop(1, 'rgba(40,36,32,.9)');
      disc(c, 0, 0, R * 0.28, g);
      for (let i = 0; i < 7; i++) {
        const a = 0.6 + (rnd() - 0.5) * 0.8,
          d = R * (0.15 + i * 0.07);
        disc(
          c,
          Math.cos(a) * d,
          Math.sin(a) * d,
          R * (0.12 + i * 0.025),
          `rgba(${(150 + rnd() * 30) | 0},${(150 + rnd() * 30) | 0},${(155 + rnd() * 30) | 0},${0.28 - i * 0.025})`
        );
      }
    }
  },
  envelope: {
    cat: 'steam',
    name: 'Airship envelope',
    w: 5,
    h: 12,
    z: 4,
    hg: 4,
    tint: 'fabric',
    openAs: 'envelope_open',
    draw(c, R, rnd) {
      const rx = R * 2.35,
        ry = R * 5.8;
      c.fillStyle = 'rgba(6,4,2,.9)';
      c.beginPath();
      c.ellipse(0, 0, rx * 1.02, ry * 1.01, 0, 0, 7);
      c.fill();
      for (const sx of [-1, 1]) {
        c.fillStyle = 'rgba(6,4,2,.9)';
        c.beginPath();
        c.moveTo(sx * rx * 0.25, ry * 0.7);
        c.lineTo(sx * rx * 0.95, ry * 1.02);
        c.lineTo(sx * rx * 0.2, ry * 0.98);
        c.closePath();
        c.fill();
        c.fillStyle = rgba(RAMP.fabric, 0.4);
        c.beginPath();
        c.moveTo(sx * rx * 0.27, ry * 0.72);
        c.lineTo(sx * rx * 0.9, ry);
        c.lineTo(sx * rx * 0.22, ry * 0.96);
        c.closePath();
        c.fill();
      }
      const g = c.createLinearGradient(-rx, 0, rx, 0);
      g.addColorStop(0, rgba(RAMP.fabric, 0.3));
      g.addColorStop(0.3, rgba(RAMP.fabric, 0.95));
      g.addColorStop(0.6, rgba(RAMP.fabric, 0.7));
      g.addColorStop(1, rgba(RAMP.fabric, 0.12));
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, 0, 7);
      c.fill();
      c.save();
      c.beginPath();
      c.ellipse(0, 0, rx, ry, 0, 0, 7);
      c.clip();
      c.strokeStyle = 'rgba(40,30,18,.35)';
      c.lineWidth = Math.max(0.8, R / 35);
      for (let k = 1; k < 4; k++) {
        c.beginPath();
        c.ellipse(0, 0, (rx * k) / 4, ry, 0, 0, 7);
        c.stroke();
      }
      c.strokeStyle = rgba(RAMP.brass, 0.8);
      c.lineWidth = Math.max(1, R / 20);
      for (const y of [-0.55, -0.2, 0.15, 0.5]) {
        c.beginPath();
        c.moveTo(-rx, y * ry);
        c.lineTo(rx, y * ry);
        c.stroke();
      }
      c.restore();
      disc(c, 0, -ry * 0.96, R * 0.25, litFill(c, 0, -ry * 0.96, R * 0.25, RAMP.brass, 0.3, 0.95));
    }
  },
  envelope_open: {
    cat: 'hidden',
    name: 'Airship envelope (hidden)',
    w: 5,
    h: 12,
    z: 0,
    hg: 0.01,
    draw(c, R) {
      c.setLineDash([R * 0.2, R * 0.2]);
      c.strokeStyle = 'rgba(230,220,190,.28)';
      c.lineWidth = Math.max(1, R / 25);
      c.beginPath();
      c.ellipse(0, 0, R * 2.35, R * 5.8, 0, 0, 7);
      c.stroke();
    }
  },
  propeller: {
    cat: 'steam',
    name: 'Propeller',
    w: 2,
    h: 2,
    z: 3,
    hg: 1,
    tint: 'wood',
    draw(c, R, rnd) {
      for (let i = 0; i < 4; i++) {
        c.save();
        c.rotate((i * Math.PI) / 2 + 0.3);
        c.fillStyle = 'rgba(6,4,2,.92)';
        c.beginPath();
        c.ellipse(0, -R * 0.48, R * 0.17, R * 0.48, 0.12, 0, 7);
        c.fill();
        c.fillStyle = linFill(c, -R * 0.15, 0, R * 0.15, 0, RAMP.wood, 0.85, 0.3);
        c.beginPath();
        c.ellipse(0, -R * 0.48, R * 0.15, R * 0.45, 0.12, 0, 7);
        c.fill();
        c.fillStyle = rgba(RAMP.brass, 0.9);
        c.beginPath();
        c.ellipse(0.02 * R, -R * 0.88, R * 0.07, R * 0.06, 0, 0, 7);
        c.fill();
        c.restore();
      }
      disc(c, 0, 0, R * 0.18, 'rgba(6,4,2,.94)');
      disc(c, 0, 0, R * 0.16, litFill(c, 0, 0, R * 0.16, RAMP.brass, 0.3, 0.95));
    }
  },
  gauge: {
    cat: 'steam',
    name: 'Pressure gauge',
    w: 0.6,
    h: 0.6,
    z: 2,
    hg: 1,
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.22, 'rgba(6,4,2,.94)');
      disc(c, 0, 0, R * 0.2, litFill(c, 0, 0, R * 0.2, RAMP.brass, 0.3, 0.95));
      disc(c, 0, 0, R * 0.15, '#f2ead4');
      c.strokeStyle = '#c02818';
      c.lineWidth = R * 0.03;
      c.beginPath();
      c.arc(0, 0, R * 0.12, -0.6, 0.5);
      c.stroke();
      c.strokeStyle = '#2a2418';
      c.lineWidth = Math.max(0.6, R / 80);
      c.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = 2.3 + i * 0.5;
        c.moveTo(Math.cos(a) * R * 0.13, Math.sin(a) * R * 0.13);
        c.lineTo(Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1);
      }
      c.stroke();
      const a = 2.5 + rnd() * 3;
      c.lineWidth = Math.max(0.8, R / 50);
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * R * 0.12, Math.sin(a) * R * 0.12);
      c.stroke();
      disc(c, 0, 0, R * 0.025, '#2a2418');
    }
  },
  telescope: {
    cat: 'steam',
    name: 'Telescope',
    w: 1.4,
    h: 1.4,
    z: 3,
    hg: 1.6,
    tint: 'brass',
    draw(c, R, rnd) {
      c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = i * 2.094 + 0.5;
        c.strokeStyle = 'rgba(6,4,2,.9)';
        c.lineWidth = R * 0.07;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5);
        c.stroke();
        c.strokeStyle = rgba(RAMP.wood, 0.55);
        c.lineWidth = R * 0.04;
        c.stroke();
      }
      c.save();
      c.rotate(-0.7);
      c.fillStyle = 'rgba(6,4,2,.94)';
      c.beginPath();
      c.moveTo(-R * 0.45, -R * 0.07);
      c.lineTo(R * 0.6, -R * 0.12);
      c.lineTo(R * 0.6, R * 0.12);
      c.lineTo(-R * 0.45, R * 0.07);
      c.closePath();
      c.fill();
      c.fillStyle = linFill(c, 0, -R * 0.11, 0, R * 0.11, RAMP.brass, 0.9, 0.2);
      c.beginPath();
      c.moveTo(-R * 0.43, -R * 0.055);
      c.lineTo(R * 0.58, -R * 0.1);
      c.lineTo(R * 0.58, R * 0.1);
      c.lineTo(-R * 0.43, R * 0.055);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(6,4,2,.6)';
      for (const x of [-R * 0.1, R * 0.25]) c.fillRect(x, -R * 0.1, R * 0.03, R * 0.2);
      c.fillStyle = '#7ab6e0';
      c.fillRect(R * 0.58, -R * 0.09, R * 0.03, R * 0.18);
      c.restore();
    }
  },
  coal: {
    cat: 'steam',
    name: 'Coal heap',
    w: 1.4,
    h: 1.4,
    z: 1,
    hg: 0.5,
    draw(c, R, rnd) {
      disc(c, 0, 0, R * 0.6, 'rgba(8,8,8,.75)');
      for (let i = 0; i < 40; i++) {
        const a = rnd() * 6.28,
          d = R * 0.5 * Math.sqrt(rnd()),
          x = Math.cos(a) * d,
          y = Math.sin(a) * d,
          r = R * (0.05 + rnd() * 0.06);
        c.fillStyle = '#060606';
        c.beginPath();
        c.moveTo(x + r, y);
        for (let k = 1; k < 5; k++) {
          const b = (k / 5) * 6.28 + rnd() * 0.4;
          c.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r);
        }
        c.closePath();
        c.fill();
        disc(
          c,
          x - r * 0.3,
          y - r * 0.3,
          r * 0.3,
          `rgba(${(80 + rnd() * 40) | 0},${(85 + rnd() * 40) | 0},${(95 + rnd() * 40) | 0},.6)`
        );
      }
    }
  },
  engine: {
    cat: 'steam',
    name: 'Steam engine',
    w: 3,
    h: 2,
    z: 2,
    hg: 1.4,
    draw(c, R, rnd) {
      c.fillStyle = 'rgba(6,6,8,.94)';
      c.fillRect(-R * 1.45, -R * 0.42, R * 2.4, R * 0.84);
      c.fillStyle = linFill(c, 0, -R * 0.4, 0, R * 0.4, RAMP.metal, 0.65, 0.25);
      c.fillRect(-R * 1.43, -R * 0.4, R * 2.36, R * 0.8);
      rivets(
        c,
        [
          [-R * 1.35, -R * 0.32],
          [-R * 1.35, R * 0.32],
          [R * 0.85, -R * 0.32],
          [R * 0.85, R * 0.32]
        ],
        R
      );
      pipeSeg(c, -R * 1.3, 0, -R * 0.5, 0, R * 0.5, RAMP.copper, R);
      c.strokeStyle = 'rgba(6,6,8,.9)';
      c.lineWidth = R * 0.1;
      c.beginPath();
      c.moveTo(-R * 0.5, 0);
      c.lineTo(R * 0.6, R * 0.05);
      c.stroke();
      c.strokeStyle = rgba(RAMP.metal, 0.85);
      c.lineWidth = R * 0.05;
      c.stroke();
      const fx = R * 0.95,
        fr = R * 0.9;
      c.strokeStyle = 'rgba(6,6,8,.94)';
      c.lineWidth = R * 0.22;
      c.beginPath();
      c.arc(fx, 0, fr * 0.88, 0, 7);
      c.stroke();
      c.strokeStyle = rgba(RAMP.metal, 0.45);
      c.lineWidth = R * 0.16;
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.25)';
      c.lineWidth = R * 0.04;
      c.beginPath();
      c.arc(fx, 0, fr * 0.9, 3.6, 5);
      c.stroke();
      c.strokeStyle = rgba(RAMP.metal, 0.35);
      c.lineWidth = R * 0.08;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.28;
        c.moveTo(fx, 0);
        c.lineTo(fx + Math.cos(a) * fr * 0.82, Math.sin(a) * fr * 0.82);
      }
      c.stroke();
      disc(c, fx, 0, R * 0.16, litFill(c, fx, 0, R * 0.16, RAMP.brass, 0.3, 0.95));
    }
  },
  conveyor: {
    cat: 'steam',
    name: 'Conveyor belt',
    w: 1.2,
    h: 3,
    z: 1,
    hg: 0.5,
    draw(c, R, rnd) {
      c.fillStyle = 'rgba(6,6,8,.94)';
      c.fillRect(-R * 0.55, -R * 1.45, R * 1.1, R * 2.9);
      c.fillStyle = rgba(RAMP.metal, 0.4);
      c.fillRect(-R * 0.53, -R * 1.43, R * 1.06, R * 2.86);
      c.fillStyle = '#1a1816';
      c.fillRect(-R * 0.42, -R * 1.35, R * 0.84, R * 2.7);
      c.strokeStyle = 'rgba(90,85,80,.7)';
      c.lineWidth = Math.max(0.8, R / 40);
      c.beginPath();
      for (let y = -R * 1.3; y < R * 1.35; y += R * 0.14) {
        c.moveTo(-R * 0.42, y);
        c.lineTo(R * 0.42, y);
      }
      c.stroke();
      for (const y of [-R * 1.35, R * 1.35]) pipeSeg(c, -R * 0.5, y, R * 0.5, y, R * 0.18, RAMP.metal, R, false);
      plankRect(c, 0, -R * 0.4, R * 0.5, R * 0.5, 0.1, R, true, RAMP.wood, rnd);
    }
  }
});
Object.assign(SCATTER_SETS, {
  workshop: { name: 'Workshop clutter', keys: ['gears', 'gauge', 'coal', 'crate', 'barrel', 'pipetee'] },
  pipework: { name: 'Pipework', keys: ['pipe', 'pipe', 'pipebend', 'pipetee', 'gauge'] },
  foundry: { name: 'Foundry yard', keys: ['coal', 'coal', 'gear', 'barrel'] }
});
STAMP_KEYS.push(...Object.keys(STAMPS).filter(k => !STAMP_KEYS.includes(k) && STAMPS[k].cat !== 'hidden'));
// ---- Great tree: oblique view (trunk on the ground, crown leaning up the screen) with its own cast shadow ----
function greatTrunk(c, R, rnd) {
  const by = R * 1.25,
    g0 = c.createRadialGradient(0, by, 0, 0, by, R * 0.8);
  g0.addColorStop(0, 'rgba(0,0,0,.55)');
  g0.addColorStop(1, 'rgba(0,0,0,0)');
  c.save();
  c.scale(1, 0.38);
  c.fillStyle = g0;
  c.beginPath();
  c.arc(0, by / 0.38, R * 0.8, 0, 7);
  c.fill();
  c.restore();
  c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.05 + i * 0.225) + (rnd() - 0.5) * 0.25,
      ex = Math.cos(a) * R * (0.26 + rnd() * 0.1),
      ey = by + Math.sin(a) * R * 0.1,
      w = R * 0.07; // root flares, front half only
    for (const [col, k] of [
      [rgba(RAMP.bark, 0.02, 0.9), 1.25],
      [rgba(RAMP.bark, 0.38), 1]
    ]) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(ex * 0.2 - w * k, by - R * 0.12);
      c.quadraticCurveTo(ex * 0.55, by - R * 0.05, ex, ey);
      c.quadraticCurveTo(ex * 0.55, by + R * 0.02, ex * 0.2 + w * k, by - R * 0.04);
      c.closePath();
      c.fill();
    }
  }
  const tx = R * 0.05,
    ty = -R * 0.3,
    poly = k => {
      c.beginPath();
      c.moveTo(-R * 0.2 * k, by);
      c.quadraticCurveTo(-R * 0.12 * k, by - R * 0.5, tx - R * 0.1 * k, ty);
      c.lineTo(tx + R * 0.1 * k, ty);
      c.quadraticCurveTo(R * 0.14 * k, by - R * 0.5, R * 0.2 * k, by);
      c.closePath();
    };
  c.fillStyle = rgba(RAMP.bark, 0.02);
  poly(1.12);
  c.fill();
  const g = c.createLinearGradient(-R * 0.2, 0, R * 0.2, 0);
  g.addColorStop(0, rgba(RAMP.bark, 0.85));
  g.addColorStop(0.45, rgba(RAMP.bark, 0.55));
  g.addColorStop(1, rgba(RAMP.bark, 0.08));
  c.fillStyle = g;
  poly(1);
  c.fill();
  c.save();
  poly(1);
  c.clip();
  c.strokeStyle = rgba(RAMP.bark, 0.05, 0.55);
  c.lineWidth = Math.max(0.7, R / 45);
  for (let i = 0; i < 9; i++) {
    const x = (rnd() - 0.5) * R * 0.36;
    c.beginPath();
    c.moveTo(x, by);
    for (let y = by; y > ty; y -= R * 0.1)
      c.lineTo(
        x * (0.55 + (0.45 * (y - ty)) / (by - ty)) + tx * (1 - (y - ty) / (by - ty)) + (rnd() - 0.5) * R * 0.03,
        y
      );
    c.stroke();
  }
  c.restore();
  for (const [a, l] of [
    [-2.2, 0.75],
    [-1.0, 0.7],
    [-1.65, 0.6]
  ]) {
    c.strokeStyle = rgba(RAMP.bark, 0.3);
    c.lineWidth = R * 0.07;
    c.beginPath();
    c.moveTo(tx, ty + R * 0.05);
    c.quadraticCurveTo(
      tx + Math.cos(a) * R * l * 0.5,
      ty + Math.sin(a) * R * l * 0.4,
      tx + Math.cos(a) * R * l,
      ty + Math.sin(a) * R * l
    );
    c.stroke();
  }
}
function greatBranches(c, R, rnd) {
  // winter: bare limbs fanning into the crown's space
  const br = (x, y, a, len, w, d) => {
    const ex = x + Math.cos(a) * len,
      ey = y + Math.sin(a) * len * 0.85;
    c.strokeStyle = rgba(RAMP.bark, d > 2 ? 0.3 : 0.45);
    c.lineWidth = Math.max(0.6, w);
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo((x + ex) / 2 + (rnd() - 0.5) * len * 0.2, (y + ey) / 2, ex, ey);
    c.stroke();
    if (d > 0)
      for (const sg of [-1, 1]) br(ex, ey, a + sg * (0.3 + rnd() * 0.35), len * (0.68 + rnd() * 0.1), w * 0.66, d - 1);
  };
  c.lineCap = 'round';
  for (const a of [-2.3, -1.85, -1.3, -0.85]) br(R * 0.05, -R * 0.25, a + (rnd() - 0.5) * 0.2, R * 0.55, R * 0.09, 4);
}
Object.assign(STAMPS, {
  bigtree: {
    cat: 'nature',
    name: 'Great tree',
    w: 4,
    h: 4,
    z: 3,
    hg: 6,
    tint: 'leaf',
    baseY: 1.25,
    crownR: 1.35,
    ownShadow: 1,
    draw(c, R, rnd) {
      greatTrunk(c, R, rnd);
      const S = c.canvas.width,
        oc = document.createElement('canvas');
      oc.width = oc.height = S;
      const o = oc.getContext('2d');
      o.setTransform(c.getTransform());
      const cy = -R * 0.82;
      o.save();
      o.translate(0, cy);
      treeCrown(o, R * 1.32, RAMP.leaf, rnd, R, 11);
      o.restore(); // main mass
      const sk = [
        [-0.95, 0.25, 0.42],
        [-0.45, 0.52, 0.36],
        [0.1, 0.6, 0.4],
        [0.62, 0.45, 0.38],
        [1.0, 0.15, 0.34]
      ]; // lower boughs, in shade
      for (const [x, y, r] of sk) {
        o.save();
        o.translate(R * (x + (rnd() - 0.5) * 0.15), cy + R * (y + (rnd() - 0.5) * 0.12));
        treeCrown(o, R * r * (0.85 + rnd() * 0.3), RAMP.leaf, rnd, R, 6);
        o.restore();
      }
      o.save();
      o.translate(-R * 0.2, cy - R * 0.38);
      treeCrown(o, R * 0.82, RAMP.leaf, rnd, R, 8);
      o.restore(); // sunlit crown top
      o.save();
      o.translate(R * 0.35, cy - R * 0.55);
      treeCrown(o, R * 0.45, RAMP.leaf, rnd, R, 6);
      o.restore();
      o.save();
      o.translate(-R * 0.55, cy - R * 0.7);
      treeCrown(o, R * 0.38, RAMP.leaf, rnd, R, 6);
      o.restore();
      o.globalCompositeOperation = 'source-atop';
      const sh = o.createLinearGradient(0, cy - R * 1.2, 0, cy + R * 1.25);
      sh.addColorStop(0, 'rgba(0,0,0,0)');
      sh.addColorStop(0.45, 'rgba(0,0,0,.08)');
      sh.addColorStop(1, 'rgba(0,8,0,.5)');
      o.fillStyle = sh;
      o.fillRect(-R * 2.6, -R * 2.6, R * 5.2, R * 5.2);
      const hi = o.createRadialGradient(-R * 0.55, cy - R * 0.9, 0, -R * 0.55, cy - R * 0.9, R * 1.1);
      hi.addColorStop(0, 'rgba(255,250,200,.22)');
      hi.addColorStop(1, 'rgba(255,250,200,0)');
      o.fillStyle = hi;
      o.fillRect(-R * 2.6, -R * 2.6, R * 5.2, R * 5.2);
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(oc, 0, 0);
      c.restore();
    },
    drawBare(c, R, rnd) {
      greatTrunk(c, R, rnd);
      greatBranches(c, R, rnd);
    }
  }
});
STAMP_KEYS.push('bigtree');
// ---- fireplaces (furniture): stone, grand marble, round central hearth. All give firelight; the light can be switched off per object.
function hearthFire(c, x, y, s, R, rnd) {
  // logs, embers and flames seen from above
  const g = c.createRadialGradient(x, y, 0, x, y, s * 1.3);
  g.addColorStop(0, 'rgba(255,170,60,.55)');
  g.addColorStop(1, 'rgba(255,90,20,0)');
  c.fillStyle = g;
  c.fillRect(x - s * 1.4, y - s * 1.4, s * 2.8, s * 2.8);
  c.lineCap = 'round';
  for (const [a, l] of [
    [0.35, 1],
    [-0.4, 0.95],
    [1.4, 0.7]
  ]) {
    for (const [col, w] of [
      ['#1a0e06', s * 0.34],
      ['#6b4223', s * 0.24]
    ]) {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(x - Math.cos(a) * s * l * 0.8, y - Math.sin(a) * s * l * 0.8);
      c.lineTo(x + Math.cos(a) * s * l * 0.8, y + Math.sin(a) * s * l * 0.8);
      c.stroke();
    }
  }
  for (let i = 0; i < 14; i++) {
    const a = rnd() * 6.28,
      d = s * 0.7 * Math.sqrt(rnd());
    disc(
      c,
      x + Math.cos(a) * d,
      y + Math.sin(a) * d,
      Math.max(0.6, s * (0.04 + rnd() * 0.05)),
      `rgba(255,${(150 + rnd() * 80) | 0},60,.9)`
    );
  }
  flame(c, x, y, s * 0.55);
}
Object.assign(STAMPS, {
  fireplace: {
    cat: 'furniture',
    name: 'Stone fireplace',
    w: 2,
    h: 1.2,
    z: 2,
    hg: 1.2,
    tint: 'stone',
    lp: 'campfire',
    lc: '#ffb35a',
    draw(c, R, rnd) {
      const W = R * 0.98,
        back = -R * 0.58,
        front = R * 0.3;
      c.fillStyle = 'rgba(10,9,8,.9)';
      c.fillRect(-W - 1, back - 1, 2 * W + 2, R * 1.18);
      c.fillStyle = linFill(c, 0, front, 0, R * 0.58, RAMP.stone, 0.7, 0.5);
      c.fillRect(-W * 0.9, front, W * 1.8, R * 0.27); // hearth slab
      c.strokeStyle = 'rgba(0,0,0,.25)';
      c.lineWidth = Math.max(0.6, R / 60);
      c.beginPath();
      for (let x = -W * 0.9 + R * 0.3; x < W * 0.9; x += R * 0.3) {
        c.moveTo(x, front);
        c.lineTo(x, R * 0.57);
      }
      c.stroke();
      for (const [x, y, w, h] of [
        [-W * 0.79, back + R * 0.38, W * 0.42, R * 0.76],
        [W * 0.79, back + R * 0.38, W * 0.42, R * 0.76],
        [0, back + R * 0.1, W * 2, R * 0.2]
      ])
        blockRect(c, x, y, w, h, 0, R); // cheeks and back
      c.fillStyle = '#0c0a08';
      c.fillRect(-W * 0.58, back + R * 0.2, W * 1.16, R * 0.68);
      const sg = c.createLinearGradient(0, back + R * 0.2, 0, front);
      sg.addColorStop(0, 'rgba(0,0,0,.6)');
      sg.addColorStop(1, 'rgba(40,30,22,.4)');
      c.fillStyle = sg;
      c.fillRect(-W * 0.58, back + R * 0.2, W * 1.16, R * 0.68);
      hearthFire(c, 0, back + R * 0.55, R * 0.3, R, rnd);
    }
  },
  fireplace_grand: {
    cat: 'furniture',
    name: 'Grand fireplace',
    w: 3,
    h: 1.4,
    z: 2,
    hg: 1.6,
    lp: 'campfire',
    lc: '#ffb35a',
    draw(c, R, rnd) {
      const W = R * 1.48,
        back = -R * 0.68,
        front = R * 0.32,
        marble = ['#5e5a55', '#8a857d', '#aaa49b', '#c6c0b6', '#ddd8cf', '#f1ede6'].map(hexRgb);
      c.fillStyle = 'rgba(10,9,8,.9)';
      c.fillRect(-W - 1, back - 1, 2 * W + 2, R * 1.38);
      c.fillStyle = linFill(c, 0, front, 0, R * 0.68, RAMP.stone, 0.45, 0.3);
      c.fillRect(-W * 0.95, front, W * 1.9, R * 0.35);
      c.strokeStyle = 'rgba(255,255,255,.18)';
      c.lineWidth = Math.max(0.6, R / 60);
      c.strokeRect(-W * 0.95 + 2, front + 2, W * 1.9 - 4, R * 0.35 - 4);
      const mant = (x, y, w, h) => {
        c.fillStyle = 'rgba(10,9,8,.9)';
        c.fillRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2);
        c.fillStyle = linFill(c, x - w / 2, y - h / 2, x + w / 2, y + h / 2, marble, 0.95, 0.55);
        c.fillRect(x - w / 2, y - h / 2, w, h);
        c.strokeStyle = 'rgba(120,110,100,.35)';
        c.lineWidth = Math.max(0.6, R / 70);
        c.beginPath();
        for (let i = 0; i < 3; i++) {
          const yy = y - h / 2 + h * rnd();
          c.moveTo(x - w / 2, yy);
          c.bezierCurveTo(
            x - w / 6,
            yy + (rnd() - 0.5) * h,
            x + w / 6,
            yy + (rnd() - 0.5) * h,
            x + w / 2,
            yy + (rnd() - 0.5) * h * 0.5
          );
        }
        c.stroke();
      };
      mant(0, back + R * 0.13, W * 2, R * 0.26);
      mant(-W * 0.82, back + R * 0.5, W * 0.36, R * 0.74);
      mant(W * 0.82, back + R * 0.5, W * 0.36, R * 0.74);
      for (const sx of [-1, 1]) {
        disc(c, sx * W * 0.82, back + R * 0.5, R * 0.1, 'rgba(0,0,0,.25)');
        disc(c, sx * W * 0.82, back + R * 0.48, R * 0.08, '#efe9de');
      }
      c.fillStyle = '#0b0908';
      c.fillRect(-W * 0.64, back + R * 0.26, W * 1.28, R * 0.74);
      hearthFire(c, 0, back + R * 0.62, R * 0.36, R, rnd);
      c.strokeStyle = '#151515';
      c.lineWidth = Math.max(1.5, R / 22);
      c.beginPath();
      c.moveTo(-W * 0.6, front - R * 0.03);
      c.lineTo(W * 0.6, front - R * 0.03);
      c.stroke(); // fender
      c.strokeStyle = '#c9a23a';
      c.lineWidth = Math.max(1, R / 40);
      c.stroke();
      for (const sx of [-1, 1]) {
        disc(c, sx * W * 0.45, back + R * 0.62, R * 0.07, '#141414');
        disc(c, sx * W * 0.45, back + R * 0.6, R * 0.045, '#c9a23a');
      }
    }
  },
  hearth: {
    cat: 'furniture',
    name: 'Round central hearth',
    w: 2,
    h: 2,
    z: 1,
    hg: 0.5,
    tint: 'stone',
    lp: 'campfire',
    lc: '#ffb35a',
    draw(c, R, rnd) {
      const r = R * 0.78;
      disc(c, 0, 0, r * 1.06, 'rgba(10,9,8,.85)');
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 6.2832 + rnd() * 0.1;
        c.save();
        c.rotate(a);
        blockRect(c, r * 0.84, 0, r * 0.3, r * 0.36, 0, R);
        c.restore();
      }
      disc(c, 0, 0, r * 0.68, '#100c09');
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.68);
      g.addColorStop(0, 'rgba(70,40,20,.5)');
      g.addColorStop(1, 'rgba(20,16,12,.9)');
      disc(c, 0, 0, r * 0.66, g);
      for (let i = 0; i < 18; i++) {
        const a = rnd() * 6.28,
          d = r * (0.35 + rnd() * 0.28);
        disc(
          c,
          Math.cos(a) * d,
          Math.sin(a) * d,
          R * (0.02 + rnd() * 0.03),
          `rgba(${(90 + rnd() * 50) | 0},${(80 + rnd() * 40) | 0},${(70 + rnd() * 30) | 0},.8)`
        );
      }
      hearthFire(c, 0, 0, r * 0.42, R, rnd);
    }
  }
});
STAMP_KEYS.push('fireplace', 'fireplace_grand', 'hearth');

function drawOwnShadow(ctx, o, st, P) {
  // a tree standing at its base: shadow falls away from the sun, crown-shaped, plus the trunk's line
  const R2 = P * o.s,
    rr = o.r || 0,
    b = st.baseY * R2,
    bx = o.x * P - Math.sin(rr) * b,
    by = o.y * P + Math.cos(rr) * b,
    H = st.hg * R2 * 0.55;
  const sx = bx + SUN.dx * H,
    sy = by + SUN.dy * H,
    L = Math.hypot(SUN.dx, SUN.dy),
    cr = st.crownR * R2,
    rnd = mulberry((o.v * 131 + 7) | 0);
  ctx.save();
  ctx.globalAlpha = Math.min(1, SUN.a * 1.1);
  ctx.filter = `blur(${(R2 * 0.1).toFixed(1)}px)`;
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.lineCap = 'round';
  ctx.lineWidth = R2 * 0.3;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(bx + (sx - bx) * 0.75, by + (sy - by) * 0.75);
  ctx.stroke();
  ctx.translate(sx, sy);
  ctx.rotate(Math.atan2(SUN.dy, SUN.dx));
  ctx.scale(1 + L * 2, 0.8);
  ctx.beginPath();
  ctx.arc(0, 0, cr * 0.78, 0, 7);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 6.28 + rnd() * 0.4,
      d = cr * 0.62,
      r = cr * (0.3 + rnd() * 0.12);
    ctx.moveTo(Math.cos(a) * d + r, Math.sin(a) * d);
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, 0, 7);
  }
  ctx.globalAlpha *= seasonFor(o.t, o.v, o.c).mode === 'bare' ? 0.18 : 0.8;
  ctx.fill();
  ctx.restore();
}
for (const [k, n] of [
  ['jgarden', ['Japanese garden', ['maple', 'sakura', 'jpine', 'mossrock', 'mossrock']]],
  ['bamboog', ['Bamboo grove', ['bamboo']]],
  ['sakurag', ['Cherry orchard', ['sakura']]]
])
  SCATTER_SETS[k] = { name: n[0], keys: n[1] };
