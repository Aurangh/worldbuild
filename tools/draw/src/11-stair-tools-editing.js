/* ---------- curved stairs: centre → outer edge → sweep; spiral stair in a narrow pillar ---------- */
let curveDraft = null,
  selStair = null;
const snapHalf = v => Math.round(v * 2) / 2,
  normAng = a => Math.atan2(Math.sin(a), Math.cos(a));
const riseFt = (sweep, rm) => Math.max(5, Math.round((Math.abs(sweep) * rm * 5 * 0.6) / 5) * 5); // a normal stair pitch along the centreline
function stairHeights(sweep, rm) {
  const h0 = Math.round((+$('stairH0').value || 0) / 5) * 5,
    v = $('stairH1').value.trim();
  return [h0, v === '' ? h0 + riseFt(sweep, rm) : Math.round(+v / 5) * 5];
}
function editingStair() {
  const s = selStair !== null && map.struct.stairs[selStair];
  return tool === 'select' && s && (s.arc || s.kind) ? s : null;
}
function updateStairRow() {
  const ed = editingStair(),
    kind = ed ? ed.kind || 'curved' : $('stairShape').value,
    on = tool === 'stairs' || !!ed,
    show = (id, v) => {
      $(id).style.display = v ? '' : 'none';
    };
  show('stairRow', on);
  if (!on) return;
  show('stairShapeRow', !ed);
  show('stairWRow', kind === 'curved' || kind === 'half');
  show('pillarRow', !ed && kind === 'pillar');
  show('grandRows', kind === 'grand');
  show('halfRows', kind === 'half');
  show('stairHRow', kind !== 'straight');
  show('stairEdRow', !!ed);
  show('stairMir', !!ed && (!!ed.arc || ed.kind === 'half'));
  if (ed) {
    $('stairH0').value = Math.round(ed.h0 * 5);
    $('stairH1').value = Math.round(ed.h1 * 5);
    if (ed.arc) $('stairW').value = ed.arc.r1 - ed.arc.r0 > 1.5 ? '2' : '1';
    if (ed.kind) for (const k of STAIR_OPTS[ed.kind]) if (ed.opt && ed.opt[k] != null) $(k).value = String(ed.opt[k]);
  } else if (tool === 'stairs') $('stairH1').value = '';
}
function placeCurve(cd) {
  const w = +$('stairW').value,
    r1 = cd.r1,
    r0 = Math.max(0.12, r1 - w),
    [h0, h1] = stairHeights(cd.sweep, (r0 + r1) / 2);
  pushUndo();
  map.struct.stairs.push({
    x0: cd.c[0] - r1,
    y0: cd.c[1] - r1,
    x1: cd.c[0] + r1,
    y1: cd.c[1] + r1,
    dir: 's',
    arc: { cx: cd.c[0], cy: cd.c[1], r0, r1, a0: +cd.a0.toFixed(4), a1: +(cd.a0 + cd.sweep).toFixed(4) },
    h0: h0 / 5,
    h1: h1 / 5
  });
  structChanged();
}
function placePillar(cx, cy) {
  const D = +$('pillarD').value,
    R = D / 2,
    c = D % 2 ? [Math.floor(cx) + 0.5, Math.floor(cy) + 0.5] : [Math.round(cx), Math.round(cy)];
  if (c[0] - R < 0 || c[1] - R < 0 || c[0] + R > map.cols || c[1] + R > map.rows) return;
  const g = Math.asin(Math.min(0.95, 0.42 / R)),
    mat = ['rampart', 'cave'].includes(wallMat()) ? 'stone' : wallMat(),
    n = 18,
    A = Math.PI / 2;
  pushUndo();
  for (let i = 0; i < n; i++) {
    const a = A + g + ((2 * Math.PI - 2 * g) * i) / n,
      b = A + g + ((2 * Math.PI - 2 * g) * (i + 1)) / n; // round wall, open at the south
    map.struct.walls.push({
      x1: +(c[0] + Math.cos(a) * R).toFixed(3),
      y1: +(c[1] + Math.sin(a) * R).toFixed(3),
      x2: +(c[0] + Math.cos(b) * R).toFixed(3),
      y2: +(c[1] + Math.sin(b) * R).toFixed(3),
      mat,
      th: 0.2
    });
  }
  const r1 = R - 0.13,
    r0 = 0.14,
    h0 = Math.round((+$('stairH0').value || 0) / 5) * 5,
    v = $('stairH1').value.trim(),
    h1 = v === '' ? h0 + 20 : Math.max(h0 + 5, Math.round(+v / 5) * 5);
  const sweep = Math.min(20 * Math.PI, ((h1 - h0) / 10) * 2 * Math.PI),
    a0 = A + g + 0.05; // tight spiral: about 10 ft per turn
  map.struct.stairs.push({
    x0: c[0] - r1,
    y0: c[1] - r1,
    x1: c[0] + r1,
    y1: c[1] + r1,
    dir: 's',
    arc: { cx: c[0], cy: c[1], r0, r1, a0: +a0.toFixed(4), a1: +(a0 + sweep).toFixed(4) },
    h0: h0 / 5,
    h1: h1 / 5
  });
  structChanged();
}
function stairEdit(fn) {
  const s = editingStair();
  if (!s) return;
  pushUndo();
  fn(s);
  structChanged();
  updateStairRow();
}
$('stairShape').onchange = () => {
  curveDraft = null;
  cstairDraft = null;
  updateStairRow();
  drawOverlay();
};
$('stairW').onchange = () =>
  stairEdit(s => {
    if (s.arc) s.arc.r0 = Math.max(0.12, s.arc.r1 - +$('stairW').value);
  });
let cstairDraft = null;
const readStairOpt = kind => {
  const o = {};
  for (const k of STAIR_OPTS[kind]) o[k] = k === 'turnSide' ? $(k).value : +$(k).value;
  return o;
};
for (const k of new Set([...STAIR_OPTS.grand, ...STAIR_OPTS.half]))
  $(k).addEventListener('change', () =>
    stairEdit(s => {
      if (!s.kind || !STAIR_OPTS[s.kind].includes(k)) return;
      s.opt = s.opt || {};
      s.opt[k] = k === 'turnSide' ? $(k).value : +$(k).value;
      compositeBBox(s);
    })
  );
function draftComposite(cd, cx, cy) {
  const dx = cx - cd.sx,
    dy = cy - cd.sy;
  if (Math.hypot(dx, dy) < 0.5) return null;
  const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n',
    len = Math.max(1, Math.round(Math.abs(dir === 'e' || dir === 'w' ? dx : dy)));
  const opt = readStairOpt(cd.kind),
    w = cd.kind === 'grand' ? opt.grandW : opt.stairW,
    across = v => (w % 2 ? Math.floor(v) + 0.5 : Math.round(v));
  const fx = dir === 'n' || dir === 's' ? across(cd.sx) : Math.round(cd.sx),
    fy = dir === 'n' || dir === 's' ? Math.round(cd.sy) : across(cd.sy);
  const h0 = Math.round((+$('stairH0').value || 0) / 5) * 5,
    v = $('stairH1').value.trim(),
    h1 = v !== '' ? Math.round(+v / 5) * 5 : h0 + (cd.kind === 'grand' ? 20 : 2 * flightRise(len));
  return compositeBBox({ kind: cd.kind, fx, fy, dir, len, opt, h0: h0 / 5, h1: h1 / 5 });
}
function drawCompositePreview() {
  const s2 = cstairDraft && cstairDraft.s;
  if (!s2) return;
  const p2 = stairParts(s2);
  const path = q => {
    octx.beginPath();
    q.forEach((v, i) => {
      const [x, y] = toScr(v[0], v[1]);
      i ? octx.lineTo(x, y) : octx.moveTo(x, y);
    });
    octx.closePath();
  };
  octx.fillStyle = 'rgba(217,164,65,.18)';
  octx.strokeStyle = '#d9a441';
  octx.lineWidth = 2;
  octx.setLineDash([6, 4]);
  for (const q of [...p2.outlines, ...p2.landings.map(t => t.poly)]) {
    path(q);
    octx.fill();
    octx.stroke();
  }
  octx.setLineDash([]);
  const ok = s2.x0 >= 0 && s2.y0 >= 0 && s2.x1 <= map.cols && s2.y1 <= map.rows,
    [lx, ly] = toScr((s2.x0 + s2.x1) / 2, s2.y0);
  label(
    ok
      ? `${s2.h0 * 5} → ${(s2.h0 + s2.h1) * 2.5} → ${s2.h1 * 5} ft · ${s2.len * 5} ft flight`
      : 'Does not fit on the map',
    lx,
    ly - 14
  );
}
$('stairH0').onchange = () =>
  stairEdit(s => {
    s.h0 = Math.round((+$('stairH0').value || 0) / 5);
  });
$('stairH1').onchange = () =>
  stairEdit(s => {
    const v = $('stairH1').value.trim();
    if (v !== '') s.h1 = Math.round(+v / 5);
  });
$('stairRev').onclick = () =>
  stairEdit(s => {
    [s.h0, s.h1] = [s.h1, s.h0];
  });
$('stairMir').onclick = () =>
  stairEdit(s => {
    if (s.arc) s.arc.a1 = +(2 * s.arc.a0 - s.arc.a1).toFixed(4);
    else if (s.kind === 'half') {
      s.opt.turnSide = s.opt.turnSide === 'l' ? 'r' : 'l';
      compositeBBox(s);
    }
  });
function drawCurvePreview() {
  const cd = curveDraft;
  if (!cd) return;
  const [sx, sy] = toScr(cd.c[0], cd.c[1]),
    w = +$('stairW').value;
  octx.fillStyle = '#d9a441';
  octx.beginPath();
  octx.arc(sx, sy, 4, 0, 7);
  octx.fill();
  if (cd.r1 > 0) {
    const R1 = cd.r1 * zoom,
      R0 = Math.max(0.12, cd.r1 - w) * zoom;
    octx.strokeStyle = 'rgba(217,164,65,.6)';
    octx.lineWidth = 1.5;
    octx.setLineDash([5, 4]);
    for (const r of [R0, R1]) {
      octx.beginPath();
      octx.arc(sx, sy, r, 0, 7);
      octx.stroke();
    }
    octx.setLineDash([]);
    octx.strokeStyle = '#d9a441';
    octx.lineWidth = 2;
    octx.beginPath();
    octx.moveTo(sx + Math.cos(cd.a0) * R0, sy + Math.sin(cd.a0) * R0);
    octx.lineTo(sx + Math.cos(cd.a0) * R1, sy + Math.sin(cd.a0) * R1);
    octx.stroke();
    if (Math.abs(cd.sweep) > 0.01) {
      const a1 = cd.a0 + cd.sweep,
        ccw = cd.sweep < 0;
      octx.fillStyle = 'rgba(217,164,65,.28)';
      octx.beginPath();
      octx.arc(sx, sy, R1, cd.a0, a1, ccw);
      octx.arc(sx, sy, R0, a1, cd.a0, !ccw);
      octx.closePath();
      octx.fill();
      octx.stroke();
      const [h0, h1] = stairHeights(cd.sweep, (cd.r1 + Math.max(0.12, cd.r1 - w)) / 2),
        turns = Math.abs(cd.sweep) / (2 * Math.PI);
      label(
        `${h0} → ${h1} ft · ${turns >= 1 ? turns.toFixed(1) + ' turns' : Math.round((Math.abs(cd.sweep) * 180) / Math.PI) + '°'}`,
        sx + Math.cos(a1) * (R1 + 22),
        sy + Math.sin(a1) * (R1 + 22)
      );
    } else label(`${cd.r1 * map.ft * 2} ft across`, sx, sy - R1 - 14);
  }
}
function drawOverlay() {
  const w = view.clientWidth,
    h = view.clientHeight;
  octx.clearRect(0, 0, w, h);
  if (!map) return;
  if (map.exW < map.cols || map.exH < map.rows) {
    octx.fillStyle = 'rgba(8,9,12,.82)';
    octx.fillRect(panX + map.exW * zoom, panY, (map.cols - map.exW) * zoom + 1, map.rows * zoom + 1);
    octx.fillRect(panX, panY + map.exH * zoom, map.exW * zoom, (map.rows - map.exH) * zoom + 1);
  }
  if ($('gridOn').checked && zoom >= 5 && isHex(map)) {
    octx.strokeStyle = `rgba(0,0,0,${$('gridOp').value})`;
    octx.lineWidth = 1;
    octx.beginPath();
    const [vx0, vy0] = toCell(0, 0),
      [vx1, vy1] = toCell(w, h),
      fl = map.grid === 'hexflat';
    const c0 = Math.max(0, Math.floor(fl ? vx0 / (1.5 * HR) : vx0) - 1),
      c1 = Math.min(map.hcols, Math.ceil(fl ? vx1 / (1.5 * HR) : vx1) + 1);
    const r0 = Math.max(0, Math.floor(fl ? vy0 : vy0 / (1.5 * HR)) - 1),
      r1 = Math.min(map.hrows, Math.ceil(fl ? vy1 : vy1 / (1.5 * HR)) + 1);
    hexGridPath(octx, map, zoom, c0, r0, c1, r1, panX, panY);
    octx.stroke();
  } else if ($('gridOn').checked && zoom >= 5) {
    octx.strokeStyle = `rgba(0,0,0,${$('gridOp').value})`;
    octx.lineWidth = 1;
    octx.beginPath();
    const cx0 = Math.max(0, Math.floor(-panX / zoom)),
      cx1 = Math.min(map.cols, Math.ceil((w - panX) / zoom));
    const cy0 = Math.max(0, Math.floor(-panY / zoom)),
      cy1 = Math.min(map.rows, Math.ceil((h - panY) / zoom));
    for (let i = cx0; i <= cx1; i++) {
      const x = Math.round(panX + i * zoom) + 0.5;
      octx.moveTo(x, panY);
      octx.lineTo(x, panY + map.rows * zoom);
    }
    for (let j = cy0; j <= cy1; j++) {
      const y = Math.round(panY + j * zoom) + 0.5;
      octx.moveTo(panX, y);
      octx.lineTo(panX + map.cols * zoom, y);
    }
    octx.stroke();
  }
  if (rectDrag) {
    const [a, b] = rectBounds(rectDrag);
    const [sx, sy] = toScr(a[0], a[1]);
    octx.fillStyle = 'rgba(217,164,65,.18)';
    octx.strokeStyle = '#d9a441';
    octx.lineWidth = 2;
    octx.setLineDash([6, 4]);
    octx.fillRect(sx, sy, (b[0] - a[0]) * zoom, (b[1] - a[1]) * zoom);
    octx.strokeRect(sx, sy, (b[0] - a[0]) * zoom, (b[1] - a[1]) * zoom);
    octx.setLineDash([]);
    const kind = rectDrag.roof
      ? ' roof'
      : rectDrag.stairs
        ? ' stairs, up ' + { n: '↑', s: '↓', e: '→', w: '←' }[stairDir(rectDrag)]
        : rectDrag.room
          ? ' room'
          : ' sq';
    label(`${b[0] - a[0]} × ${b[1] - a[1]}${kind}`, sx + ((b[0] - a[0]) * zoom) / 2, sy - 14);
  }
  if (tool === 'stairs') {
    drawCurvePreview();
    drawCompositePreview();
  }
  if (tool === 'room' && roomDraft) {
    const P2 = roomDraft.pts.map(p => toScr(p[0], p[1])),
      hp = hover ? snapPt(hover[0], hover[1], mods, roomDraft.pts[roomDraft.pts.length - 1]) : null,
      H2 = hp && toScr(hp[0], hp[1]);
    octx.fillStyle = 'rgba(217,164,65,.15)';
    octx.strokeStyle = '#f1d79c';
    octx.lineWidth = 2;
    octx.setLineDash([6, 4]);
    octx.beginPath();
    P2.forEach(([x, y], i) => (i ? octx.lineTo(x, y) : octx.moveTo(x, y)));
    if (H2) octx.lineTo(H2[0], H2[1]);
    octx.closePath();
    octx.fill();
    octx.stroke();
    octx.setLineDash([]);
    P2.forEach(([x, y], i) => {
      octx.fillStyle = i === 0 ? '#9fd88a' : '#f1d79c';
      octx.strokeStyle = '#000';
      octx.lineWidth = 1.5;
      octx.beginPath();
      octx.arc(x, y, i === 0 ? 7 : 4.5, 0, 7);
      octx.fill();
      octx.stroke();
    });
    label(
      roomDraft.pts.length >= 3 ? 'Click the green corner, Enter or Done to finish' : 'Click the corners of the room',
      P2[0][0],
      P2[0][1] - 20
    );
  }
  if (circleDrag) {
    const [sx, sy] = toScr(circleDrag.c[0], circleDrag.c[1]);
    octx.strokeStyle = '#f1d79c';
    octx.lineWidth = 2;
    octx.setLineDash([6, 4]);
    octx.beginPath();
    octx.arc(sx, sy, circleDrag.r * zoom, 0, 7);
    octx.stroke();
    octx.setLineDash([]);
    label(
      `radius ${circleDrag.r} sq · ${+(circleDrag.r * map.ft).toFixed(1)} ${map.unit}`,
      sx,
      sy - circleDrag.r * zoom - 16
    );
  }
  if (tool === 'wall' && (wallDraft || hover)) {
    const last = wallDraft && wallDraft.pts[wallDraft.pts.length - 1];
    const hp = hover ? snapPt(hover[0], hover[1], mods, last) : null;
    if (last && hp) {
      const [ax, ay] = toScr(last[0], last[1]),
        [bx, by] = toScr(hp[0], hp[1]);
      octx.strokeStyle = 'rgba(0,0,0,.6)';
      octx.lineWidth = +$('wallTh').value * zoom + 3;
      octx.lineCap = 'square';
      octx.beginPath();
      octx.moveTo(ax, ay);
      octx.lineTo(bx, by);
      octx.stroke();
      octx.strokeStyle = 'rgba(241,215,156,.8)';
      octx.lineWidth = +$('wallTh').value * zoom;
      octx.stroke();
      octx.lineCap = 'butt';
      const len = Math.hypot(hp[0] - last[0], hp[1] - last[1]);
      if (len > 0)
        label(
          `${Math.round(len * 10) / 10} sq · ${Math.round(len * map.ft * 10) / 10} ft`,
          (ax + bx) / 2,
          (ay + by) / 2 - 18
        );
    }
    if (hp) {
      const [px, py] = toScr(hp[0], hp[1]);
      octx.fillStyle = '#f1d79c';
      octx.strokeStyle = '#000';
      octx.lineWidth = 1.5;
      octx.beginPath();
      octx.arc(px, py, 4.5, 0, 7);
      octx.fill();
      octx.stroke();
    }
  }
  if ($('showRanges').checked) {
    octx.save();
    for (const L0 of shownLayers(map))
      for (const o of L0.struct.objects) {
        const L = lightOf(o, map);
        if (!L) continue;
        const lr = map.lightRad ?? 1,
          [sx, sy] = toScr(o.x, o.y);
        const ring = (r, dash, col) => {
          octx.strokeStyle = col;
          octx.lineWidth = 1.6;
          octx.setLineDash(dash);
          octx.beginPath();
          if (L.cone) {
            const h = (L.cone * Math.PI) / 360;
            octx.moveTo(sx, sy);
            octx.arc(sx, sy, r * zoom, L.dir - h, L.dir + h);
            octx.closePath();
          } else octx.arc(sx, sy, r * zoom, 0, 7);
          octx.stroke();
        };
        if (L.b > 0) ring(L.b * lr, [], 'rgba(255,214,110,.95)');
        ring(L.o * lr, [6, 5], 'rgba(255,214,110,.75)');
      }
    octx.restore();
  }
  if (tool === 'stamp' && hover) {
    const [x, y] = objPos(hover[0], hover[1]),
      sp = getSprite(curStamp, preVar, viewP * objSize(), objTint().c),
      [sx, sy] = toScr(x, y);
    octx.save();
    octx.globalAlpha = 0.7;
    octx.translate(sx, sy);
    octx.rotate(preRot);
    octx.scale(zoom / viewP, zoom / viewP);
    octx.drawImage(sp.c, -sp.size / 2, -sp.size / 2);
    octx.restore();
  }
  if (selObj !== null && map.struct.objects[selObj]) {
    const o = map.struct.objects[selObj],
      st = STAMPS[o.t],
      [sx, sy] = toScr(o.x, o.y),
      r = Math.max(st.w, st.h) * o.s * 0.55 * zoom;
    octx.strokeStyle = '#000';
    octx.lineWidth = 4;
    octx.beginPath();
    octx.arc(sx, sy, r, 0, 7);
    octx.stroke();
    octx.strokeStyle = '#f1d79c';
    octx.lineWidth = 2;
    octx.setLineDash([6, 4]);
    octx.stroke();
    octx.setLineDash([]);
    octx.beginPath();
    octx.moveTo(sx, sy);
    octx.lineTo(sx + Math.cos(o.r) * r, sy + Math.sin(o.r) * r);
    octx.stroke();
  }
  if (tool === 'door' && hover) {
    const e = nearestEdge(hover[0], hover[1]);
    if (e) {
      const [x1, y1] = toScr(e.x, e.y),
        [x2, y2] = e.o === 'h' ? toScr(e.x + 1, e.y) : toScr(e.x, e.y + 1);
      octx.strokeStyle = 'rgba(0,0,0,.7)';
      octx.lineWidth = 8;
      octx.beginPath();
      octx.moveTo(x1, y1);
      octx.lineTo(x2, y2);
      octx.stroke();
      octx.strokeStyle = '#f1d79c';
      octx.lineWidth = 4;
      octx.stroke();
    }
  }
  if (tool === 'xstruct' && hover) {
    const h = hitStruct(hover[0], hover[1]);
    if (h) {
      octx.strokeStyle = '#ff7070';
      octx.lineWidth = 3;
      octx.setLineDash([5, 4]);
      if (h.kind === 'walls') {
        const w = map.struct.walls[h.i],
          [ax, ay] = toScr(w.x1, w.y1),
          [bx, by] = toScr(w.x2, w.y2);
        octx.beginPath();
        octx.moveTo(ax, ay);
        octx.lineTo(bx, by);
        octx.stroke();
      }
      if (h.kind === 'doors') {
        const [cx, cy] = doorCenter(map.struct.doors[h.i]),
          [sx, sy] = toScr(cx, cy);
        octx.beginPath();
        octx.arc(sx, sy, zoom * 0.5, 0, 7);
        octx.stroke();
      }
      if (h.kind === 'objects') {
        const o = map.struct.objects[h.i],
          [sx, sy] = toScr(o.x, o.y);
        octx.beginPath();
        octx.arc(sx, sy, Math.max(STAMPS[o.t].w, STAMPS[o.t].h) * o.s * 0.5 * zoom, 0, 7);
        octx.stroke();
      }
      if (h.kind === 'labels') {
        const l = map.struct.labels[h.i],
          [sx, sy] = toScr(l.x, l.y);
        octx.beginPath();
        octx.arc(sx, sy, l.size * zoom * 0.8, 0, 7);
        octx.stroke();
      }
      if (h.kind === 'roofs') {
        const r = map.struct.roofs[h.i],
          [sx, sy] = toScr(r.x0, r.y0);
        octx.strokeRect(sx, sy, (r.x1 - r.x0) * zoom, (r.y1 - r.y0) * zoom);
      }
      if (h.kind === 'stairs') {
        const s = map.struct.stairs[h.i],
          [sx, sy] = toScr(s.x0, s.y0);
        octx.strokeRect(sx, sy, (s.x1 - s.x0) * zoom, (s.y1 - s.y0) * zoom);
      }
      octx.setLineDash([]);
    }
  }
  if (ruler) {
    const ca = isHex(map) ? hexCenter(map, ruler.a[0], ruler.a[1]) : [ruler.a[0] + 0.5, ruler.a[1] + 0.5],
      cb = isHex(map) ? hexCenter(map, ruler.b[0], ruler.b[1]) : [ruler.b[0] + 0.5, ruler.b[1] + 0.5];
    const [ax, ay] = toScr(ca[0], ca[1]),
      [bx, by] = toScr(cb[0], cb[1]);
    octx.strokeStyle = 'rgba(0,0,0,.6)';
    octx.lineWidth = 5;
    octx.beginPath();
    octx.moveTo(ax, ay);
    octx.lineTo(bx, by);
    octx.stroke();
    octx.strokeStyle = '#7fd0e8';
    octx.lineWidth = 2.5;
    octx.stroke();
    for (const [x, y] of [
      [ax, ay],
      [bx, by]
    ]) {
      octx.fillStyle = '#7fd0e8';
      octx.beginPath();
      octx.arc(x, y, 4, 0, 7);
      octx.fill();
    }
    const m = measure(ruler.a, ruler.b);
    label(`${m.sq} ${isHex(map) ? (m.sq === 1 ? 'hex' : 'hexes') : 'sq'} · ${m.ft} ${map.unit}`, bx, by - 18);
  }
  if (hover && !ruler && !rectDrag) {
    const [cx, cy] = hover;
    if (tool === 'brush' || tool === 'eraser' || tool === 'scatter') {
      const r = (+$('brushSize').value / 2) * zoom,
        [sx, sy] = toScr(cx, cy);
      octx.strokeStyle = 'rgba(0,0,0,.7)';
      octx.lineWidth = 3;
      octx.beginPath();
      octx.arc(sx, sy, Math.max(2, r), 0, 7);
      octx.stroke();
      octx.strokeStyle = tool === 'eraser' ? '#e89a9a' : tool === 'scatter' ? '#9fd88a' : '#f1d79c';
      octx.lineWidth = 1.3;
      octx.stroke();
    } else if (isHex(map) && (tool === 'cell' || tool === 'fill' || tool === 'measure')) {
      const hx = pixelToHex(map, cx, cy);
      if (hx) {
        const [hcx, hcy] = hexCenter(map, hx[0], hx[1]),
          k = hexCorners(map, hcx, hcy);
        octx.strokeStyle = '#f1d79c';
        octx.lineWidth = 2;
        octx.beginPath();
        k.forEach(([x, y], i) => {
          const [sx, sy] = toScr(x, y);
          i ? octx.lineTo(sx, sy) : octx.moveTo(sx, sy);
        });
        octx.closePath();
        octx.stroke();
      }
    } else if (
      tool === 'cell' ||
      tool === 'rect' ||
      tool === 'fill' ||
      tool === 'measure' ||
      tool === 'room' ||
      tool === 'stairs' ||
      tool === 'roof'
    ) {
      const ix = Math.floor(cx),
        iy = Math.floor(cy);
      if (ix >= 0 && iy >= 0 && ix < map.cols && iy < map.rows) {
        const [sx, sy] = toScr(ix, iy);
        octx.strokeStyle = '#f1d79c';
        octx.lineWidth = 1.5;
        octx.strokeRect(sx + 0.5, sy + 0.5, zoom - 1, zoom - 1);
      }
    }
  }
}
function label(text, x, y) {
  octx.font = '600 13px system-ui,sans-serif';
  const w = octx.measureText(text).width + 14;
  octx.fillStyle = 'rgba(15,17,21,.92)';
  octx.strokeStyle = '#3a4050';
  octx.lineWidth = 1;
  octx.beginPath();
  octx.roundRect(x - w / 2, y - 11, w, 22, 5);
  octx.fill();
  octx.stroke();
  octx.fillStyle = '#e8ecf2';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillText(text, x, y);
}

/* ---------- measuring ---------- */
function measure(a, b) {
  const dx = Math.abs(b[0] - a[0]),
    dy = Math.abs(b[1] - a[1]),
    mode = $('ruleMode').value;
  let sq;
  if (isHex(map)) sq = hexDist(map, a, b);
  else if (mode === '35') {
    const diag = Math.min(dx, dy),
      straight = Math.max(dx, dy) - diag;
    sq = straight + diag + Math.floor(diag / 2);
  } else if (mode === 'flat') sq = Math.max(dx, dy);
  else sq = Math.round(Math.hypot(dx, dy) * 10) / 10;
  return { sq, ft: Math.round(sq * map.ft * 10) / 10 };
}

/* ---------- structure editing helpers ---------- */
let wallDraft = null,
  mods = { alt: false, shift: false };
let curStamp = 'oak',
  stampCat = 'nature',
  selObj = null,
  preRot = 0,
  preVar = 1;
function rollPre() {
  preVar = (Math.random() * 1e6) | 0;
  if ($('objRandRot').checked) preRot = Math.random() * 6.2832;
}
const objSize = () => +$('objSize').value;
function objPos(cx, cy) {
  if (!$('objSnap').checked) return [cx, cy];
  if (isHex(map)) {
    const h = pixelToHex(map, cx, cy);
    return h ? hexCenter(map, h[0], h[1]) : [cx, cy];
  }
  return [Math.round(cx * 2) / 2, Math.round(cy * 2) / 2];
}
const objTint = () => ($('tintObj').checked && activeHex ? { c: activeHex } : {});
let placeLight = { lp: null, off: false }; // light settings for the next object placed
function placeObject(t, x, y, sc, rot, v) {
  const st = STAMPS[t],
    L = {};
  if (st.light || st.lp) {
    if (placeLight.lp && placeLight.lp !== st.lp) L.lp = placeLight.lp;
    if (placeLight.off) L.off = 1;
  }
  map.struct.objects.push({
    t,
    x: +x.toFixed(3),
    y: +y.toFixed(3),
    r: +rot.toFixed(3),
    s: +sc.toFixed(3),
    v,
    f: 0,
    ...objTint(),
    ...L
  });
}
for (const [k, p] of Object.entries(LIGHT_PRESETS)) {
  const op = document.createElement('option');
  op.value = k;
  op.textContent = p.name;
  $('lightPreset').appendChild(op);
}
// The light row edits the selected light, or sets up the next light to be placed.
function updateLightRow() {
  const o = selObj !== null ? map.struct.objects[selObj] : null,
    so = o && (STAMPS[o.t].light || STAMPS[o.t].lp) ? o : null;
  const placing = !so && tool === 'stamp' && (STAMPS[curStamp].light || STAMPS[curStamp].lp);
  $('lightRow').style.display = so || placing ? '' : 'none';
  if (!so && !placing) return;
  const st = STAMPS[so ? so.t : curStamp],
    R2 = map.rules === '5e' ? '5e' : '35';
  for (const op of $('lightPreset').options) {
    const pr = LIGHT_PRESETS[op.value][R2];
    op.textContent = `${LIGHT_PRESETS[op.value].name} — ${pr[0] ? pr[0] + '/' : ''}${pr[1]} ft`;
  }
  $('lightRowLbl').textContent = so ? 'Selected light' : 'Light';
  $('lightPreset').value = (so ? so.lp : placeLight.lp) || st.lp || 'torch';
  $('lightOn').checked = so ? !so.off : !placeLight.off;
}
$('lightPreset').onchange = $('lightOn').onchange = () => {
  const o = selObj !== null ? map.struct.objects[selObj] : null;
  if (o && (STAMPS[o.t].light || STAMPS[o.t].lp)) {
    pushUndo();
    const st = STAMPS[o.t];
    if ($('lightPreset').value === st.lp) delete o.lp;
    else o.lp = $('lightPreset').value;
    if ($('lightOn').checked) delete o.off;
    else o.off = 1;
    structChanged();
    drawOverlay();
  } else {
    placeLight = { lp: $('lightPreset').value, off: !$('lightOn').checked };
  }
};
function scatterAt(cx, cy) {
  const rad = +$('brushSize').value / 2,
    set = SCATTER_SETS[$('scatterSet').value],
    keys = set.keys || [curStamp],
    objs = map.struct.objects;
  const near = objs.filter(o => Math.hypot(o.x - cx, o.y - cy) < rad + 2);
  const want = Math.ceil((+$('density').value * Math.PI * rad * rad) / Math.max(0.35, avgArea(keys)));
  let have = near.filter(o => Math.hypot(o.x - cx, o.y - cy) < rad).length,
    tries = 0;
  while (have < want && tries++ < 40) {
    const a = Math.random() * 6.2832,
      d = rad * Math.sqrt(Math.random()),
      x = cx + Math.cos(a) * d,
      y = cy + Math.sin(a) * d;
    if (x < 0 || y < 0 || x > map.cols || y > map.rows) continue;
    const t = keys[(Math.random() * keys.length) | 0],
      st = STAMPS[t],
      sc = objSize() * (0.8 + Math.random() * 0.4),
      fr = Math.max(st.w, st.h) * sc * 0.5;
    if (
      near.some(o => {
        const so = STAMPS[o.t];
        return (
          Math.hypot(o.x - x, o.y - y) < (fr + Math.max(so.w, so.h) * o.s * 0.5) * (st.z >= 3 && so.z >= 3 ? 0.55 : 0.7)
        );
      })
    )
      continue;
    const o = {
      t,
      x: +x.toFixed(3),
      y: +y.toFixed(3),
      r: +(Math.random() * 6.2832).toFixed(3),
      s: +sc.toFixed(3),
      v: (Math.random() * 1e6) | 0,
      f: 0,
      ...objTint()
    };
    objs.push(o);
    near.push(o);
    have++;
  }
  structChanged();
}
const avgArea = keys =>
  keys.reduce((a, k) => a + STAMPS[k].w * STAMPS[k].h * objSize() * objSize() * 0.6, 0) / keys.length;
const wallMat = () => $('wallMat').value,
  wallTh = () => +$('wallTh').value;
$('wallMat').addEventListener('change', () => {
  const r = $('wallMat').value === 'rampart',
    t = +$('wallTh').value;
  if (r && t < 0.9) $('wallTh').value = '1';
  if (!r && t >= 0.9) $('wallTh').value = '0.25';
});
function snapPt(cx, cy, md, from) {
  const q = md.alt ? 4 : 1;
  let x = Math.round(cx * q) / q,
    y = Math.round(cy * q) / q;
  if (md.shift && from) {
    let dx = x - from[0],
      dy = y - from[1];
    if (Math.abs(dx) > 2 * Math.abs(dy)) dy = 0;
    else if (Math.abs(dy) > 2 * Math.abs(dx)) dx = 0;
    else {
      const m = Math.max(Math.abs(dx), Math.abs(dy));
      dx = Math.sign(dx) * m;
      dy = Math.sign(dy) * m;
    }
    x = from[0] + dx;
    y = from[1] + dy;
  }
  return [clamp(x, 0, map.cols), clamp(y, 0, map.rows)];
}
function nearestEdge(cx, cy) {
  const fx = cx - Math.floor(cx),
    fy = cy - Math.floor(cy),
    dh = Math.min(fy, 1 - fy),
    dv = Math.min(fx, 1 - fx);
  const e =
    dh < dv ? { x: Math.floor(cx), y: Math.round(cy), o: 'h' } : { x: Math.round(cx), y: Math.floor(cy), o: 'v' };
  if (e.x < 0 || e.y < 0 || (e.o === 'h' ? e.x >= map.cols || e.y > map.rows : e.x > map.cols || e.y >= map.rows))
    return null;
  return e;
}
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1,
    dy = y2 - y1,
    l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}
function nextBadge() {
  let n = 0;
  for (const l of map.struct.labels) if (isBadge(l.text)) n = Math.max(n, parseInt(l.text));
  return String(n + 1);
}
function hitObject(cx, cy) {
  const o = map.struct.objects;
  let best = null,
    bd = 1e9;
  for (let i = o.length - 1; i >= 0; i--) {
    const b = o[i],
      st = STAMPS[b.t],
      r = Math.max(0.3, Math.max(st.w, st.h) * b.s * 0.42),
      d = Math.hypot(cx - b.x, cy - b.y);
    if (d < r && d / r < bd) {
      bd = d / r;
      best = i;
    }
  }
  return best;
}
function stairHit(s, cx, cy) {
  if (s.kind) {
    const p = stairParts(s);
    return [...p.steps, ...p.landings].some(t => inPolyPts(cx, cy, t.poly));
  }
  if (!s.arc) return cx >= s.x0 && cx <= s.x1 && cy >= s.y0 && cy <= s.y1;
  const A = s.arc,
    d = Math.hypot(cx - A.cx, cy - A.cy);
  if (d < A.r0 - 0.15 || d > A.r1 + 0.15) return false;
  if (Math.abs(A.a1 - A.a0) >= 2 * Math.PI) return true;
  const t = (A.a1 > A.a0 ? 1 : -1) * normAng(Math.atan2(cy - A.cy, cx - A.cx) - A.a0);
  return (
    (t >= -0.05 && t <= Math.abs(A.a1 - A.a0) + 0.05) || (t < 0 && t + 2 * Math.PI <= Math.abs(A.a1 - A.a0) + 0.05)
  );
}
function hitObjectAnyLayer(cx, cy) {
  let i = hitObject(cx, cy);
  if (i !== null) return i;
  for (const l of map.layers.slice().reverse()) {
    if (!l.visible || l.id === map.activeLayer) continue;
    const keep = map.struct;
    map.struct = l.struct;
    i = hitObject(cx, cy);
    map.struct = keep;
    if (i !== null) {
      setActiveLayer(l.id);
      return i;
    }
  }
  return null;
}
function hitMovable(cx, cy) {
  // what the Select tool can pick up, top-most first
  if ($('showLabels').checked) {
    const i = hitLabel(cx, cy);
    if (i !== null) return { kind: 'labels', i };
  }
  const i = hitObjectAnyLayer(cx, cy);
  if (i !== null) return { kind: 'objects', i };
  const st = map.struct;
  for (let j = (st.roofs || []).length - 1; j >= 0; j--) {
    const r = st.roofs[j];
    if (SHOW_TOP && cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1) return { kind: 'roofs', i: j };
  }
  for (let j = st.stairs.length - 1; j >= 0; j--) if (stairHit(st.stairs[j], cx, cy)) return { kind: 'stairs', i: j };
  return null;
}
function hitLabel(cx, cy) {
  const L = map.struct.labels;
  for (let i = L.length - 1; i >= 0; i--) {
    const l = L[i];
    if (
      isBadge(l.text)
        ? Math.hypot(cx - l.x, cy - l.y) < l.size * 0.8
        : Math.abs(cx - l.x) < l.text.length * l.size * 0.3 + 0.15 && Math.abs(cy - l.y) < l.size * 0.6
    )
      return i;
  }
  return null;
}
function hitStruct(cx, cy) {
  const st = map.struct;
  if ($('showLabels').checked) {
    const i = hitLabel(cx, cy);
    if (i !== null) return { kind: 'labels', i };
  }
  {
    const i = hitObject(cx, cy);
    if (i !== null) return { kind: 'objects', i };
  }
  for (let i = (st.roofs || []).length - 1; i >= 0; i--) {
    const r = st.roofs[i];
    if (cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1) return { kind: 'roofs', i };
  }
  for (let i = st.doors.length - 1; i >= 0; i--) {
    const [x, y] = doorCenter(st.doors[i]);
    if (Math.hypot(cx - x, cy - y) < 0.42) return { kind: 'doors', i };
  }
  for (let i = st.walls.length - 1; i >= 0; i--) {
    const w = st.walls[i];
    if (segDist(cx, cy, w.x1, w.y1, w.x2, w.y2) < w.th / 2 + 0.2) return { kind: 'walls', i };
  }
  for (let i = st.stairs.length - 1; i >= 0; i--) if (stairHit(st.stairs[i], cx, cy)) return { kind: 'stairs', i };
  return null;
}
function stairDir(rd) {
  const dx = rd.b[0] - rd.a[0],
    dy = rd.b[1] - rd.a[1];
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy < 0 ? 'n' : 's';
}
function endWall() {
  wallDraft = null;
  drawOverlay();
}
/* polygon and round rooms */
let roomDraft = null,
  circleDrag = null;
function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i],
      [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function fillPolygon(pts, tid) {
  const W = map.cols * R,
    H = map.rows * R,
    lab = map.labels,
    xs = pts.map(p => p[0]),
    ys = pts.map(p => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs) * R)),
    x1 = Math.min(W - 1, Math.ceil(Math.max(...xs) * R)),
    y0 = Math.max(0, Math.floor(Math.min(...ys) * R)),
    y1 = Math.min(H - 1, Math.ceil(Math.max(...ys) * R));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) if (pointInPoly((x + 0.5) / R, (y + 0.5) / R, pts)) lab[y * W + x] = tid;
  markDirty(Math.min(...xs) - 1, Math.min(...ys) - 1, Math.max(...xs) + 1, Math.max(...ys) + 1);
}
function buildRoom(pts) {
  if (pts.length < 3) return;
  pushUndo();
  fillPolygon(pts, curTerrain);
  const mt = wallMat(),
    th = wallTh();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i],
      q = pts[(i + 1) % pts.length];
    if (Math.hypot(q[0] - p[0], q[1] - p[1]) > 1e-6)
      map.struct.walls.push({ x1: p[0], y1: p[1], x2: q[0], y2: q[1], mat: mt, th });
  }
  structChanged();
}
function finishRoomDraft() {
  if (roomDraft && roomDraft.pts.length >= 3) buildRoom(roomDraft.pts);
  roomDraft = null;
  drawOverlay();
}
function circlePts(c, r) {
  const n = clamp(Math.round(r * 6), 10, 48),
    out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([+(c[0] + Math.cos(a) * r).toFixed(3), +(c[1] + Math.sin(a) * r).toFixed(3)]);
  }
  return out;
}
