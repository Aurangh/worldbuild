/* ---------- painting ---------- */
function paintCircle(cx, cy, rad, tid) {
  const W = map.cols * R,
    H = map.rows * R,
    sx = cx * R,
    sy = cy * R,
    sr = Math.max(0.6, rad * R),
    sr2 = sr * sr,
    lab = map.labels;
  const x0 = Math.max(0, Math.floor(sx - sr)),
    x1 = Math.min(W - 1, Math.ceil(sx + sr)),
    y0 = Math.max(0, Math.floor(sy - sr)),
    y1 = Math.min(H - 1, Math.ceil(sy + sr));
  for (let y = y0; y <= y1; y++) {
    const dy = y + 0.5 - sy;
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - sx;
      if (dx * dx + dy * dy <= sr2) lab[y * W + x] = tid;
    }
  }
  markDirty(cx - rad - 1, cy - rad - 1, cx + rad + 1, cy + rad + 1);
}
function paintCells(c0, r0, c1, r1, tid) {
  const W = map.cols * R,
    lab = map.labels;
  c0 = clamp(c0, 0, map.cols);
  c1 = clamp(c1, 0, map.cols);
  r0 = clamp(r0, 0, map.rows);
  r1 = clamp(r1, 0, map.rows);
  for (let y = r0 * R; y < r1 * R; y++) lab.fill(tid, y * W + c0 * R, y * W + c1 * R);
  markDirty(c0, r0, c1, r1);
}
function paintHex(c, r, tid) {
  const [hx, hy] = hexCenter(map, c, r),
    W = map.cols * R,
    H = map.rows * R,
    lab = map.labels;
  const x0 = Math.max(0, Math.floor((hx - HR) * R)),
    x1 = Math.min(W - 1, Math.ceil((hx + HR) * R)),
    y0 = Math.max(0, Math.floor((hy - HR) * R)),
    y1 = Math.min(H - 1, Math.ceil((hy + HR) * R));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const h = pixelToHex(map, (x + 0.5) / R, (y + 0.5) / R);
      if (h && h[0] === c && h[1] === r) lab[y * W + x] = tid;
    }
  markDirty(hx - 1, hy - 1, hx + 1, hy + 1);
}
function floodFill(cx, cy, tid) {
  const W = map.cols * R,
    H = map.rows * R,
    sx = Math.floor(cx * R),
    sy = Math.floor(cy * R);
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
  const lab = map.labels,
    target = lab[sy * W + sx];
  if (target === tid) return;
  const q = new Int32Array(W * H);
  let qh = 0,
    qt = 0;
  q[qt++] = sy * W + sx;
  lab[sy * W + sx] = tid;
  let mnx = sx,
    mxx = sx,
    mny = sy,
    mxy = sy;
  while (qh < qt) {
    const i = q[qh++],
      x = i % W,
      y = (i / W) | 0;
    if (x < mnx) mnx = x;
    if (x > mxx) mxx = x;
    if (y < mny) mny = y;
    if (y > mxy) mxy = y;
    if (x > 0 && lab[i - 1] === target) {
      lab[i - 1] = tid;
      q[qt++] = i - 1;
    }
    if (x < W - 1 && lab[i + 1] === target) {
      lab[i + 1] = tid;
      q[qt++] = i + 1;
    }
    if (y > 0 && lab[i - W] === target) {
      lab[i - W] = tid;
      q[qt++] = i - W;
    }
    if (y < H - 1 && lab[i + W] === target) {
      lab[i + W] = tid;
      q[qt++] = i + W;
    }
  }
  markDirty(mnx / R - 1, mny / R - 1, mxx / R + 2, mxy / R + 2);
}
function rectBounds(rd) {
  const a = [Math.min(rd.a[0], rd.b[0]), Math.min(rd.a[1], rd.b[1])],
    b = [Math.max(rd.a[0], rd.b[0]) + 1, Math.max(rd.a[1], rd.b[1]) + 1];
  return [
    [clamp(a[0], 0, map.cols), clamp(a[1], 0, map.rows)],
    [clamp(b[0], 0, map.cols), clamp(b[1], 0, map.rows)]
  ];
}

/* ---------- undo ---------- */
const snapState = copy => ({
  lid: map.activeLayer,
  labels: copy ? map.labels.slice() : map.labels,
  struct: JSON.stringify(map.struct),
  hgt: map.hgt ? (copy ? map.hgt.slice() : map.hgt) : null
});
function restoreState(s) {
  selObj = null;
  const l = map.layers.find(x => x.id === s.lid);
  if (!l) return;
  l.labels = s.labels;
  l.struct = JSON.parse(s.struct);
  if (s.hgt !== undefined && (s.hgt || map.hgt)) {
    map.hgt = s.hgt;
    drawReliefView();
  }
  setActiveLayer(l.id);
  renderLayer(l, 0, 0, map.cols, map.rows);
  drawStructView();
  touchSave();
  updUndo();
}
function pushUndo() {
  undoStack.push(snapState(true));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  updUndo();
}
function undo() {
  if (!undoStack.length) return;
  wallDraft = null;
  redoStack.push(snapState(false));
  restoreState(undoStack.pop());
}
function redo() {
  if (!redoStack.length) return;
  wallDraft = null;
  undoStack.push(snapState(false));
  restoreState(redoStack.pop());
}
function updUndo() {
  $('bUndo').disabled = !undoStack.length;
  $('bRedo').disabled = !redoStack.length;
}

/* ---------- pointer handling ---------- */
let drag = null,
  spaceDown = false;
/* ---------- touch & pen ---------- */
const touches = new Map();
let pinch = null,
  penSeen = false,
  lastPen = 0;
function setTouchUI(on, store = true) {
  document.body.classList.toggle('touch', on);
  $('showTouchBar').checked = on;
  if (store) lsSet('md-touchbar', on ? '1' : '0');
}
function notePointer(e) {
  if (e.pointerType === 'pen') {
    lastPen = performance.now();
    if (!penSeen) {
      penSeen = true;
      if (lsGet('md-fingernav') === null) {
        $('fingerNav').checked = true;
      }
      if (lsGet('md-touchbar') === null) setTouchUI(true, false);
    }
  }
  if (e.pointerType === 'touch' && lsGet('md-touchbar') === null) setTouchUI(true, false);
}
function cancelDragFromTouch() {
  if (!drag) return;
  const d = drag;
  drag = null;
  rectDrag = null;
  if (performance.now() - d.t0 < 450 && undoStack.length > d.u0) {
    undo();
    redoStack.pop();
    updUndo();
  }
  drawOverlay();
}
const brushRad = e => {
  const b = +$('brushSize').value / 2;
  return e && e.pointerType === 'pen' && $('penPressure').checked && e.pressure > 0
    ? b * (0.25 + 0.95 * Math.min(1, e.pressure))
    : b;
};
const isPenEraser = e => e.pointerType === 'pen' && (e.button === 5 || e.buttons & 32);
view.addEventListener('contextmenu', e => e.preventDefault());
view.addEventListener('pointerdown', e => {
  if (e.target.closest && e.target.closest('#touchBar, #sideTab')) return; // buttons floating over the map
  view.setPointerCapture(e.pointerId);
  notePointer(e);
  if (document.body.classList.contains('side-open')) {
    document.body.classList.remove('side-open');
    sideState();
  }
  const rect = view.getBoundingClientRect(),
    sx = e.clientX - rect.left,
    sy = e.clientY - rect.top,
    [cx, cy] = toCell(sx, sy);
  mods = { alt: e.altKey, shift: e.shiftKey };
  if (e.pointerType === 'touch') {
    touches.set(e.pointerId, [sx, sy]);
    if (touches.size >= 2) {
      if (drag && drag.touch) cancelDragFromTouch();
      else if (drag && drag.mode === 'pan') drag = null;
      const [a, b] = [...touches.values()],
        c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z0: zoom, cell: toCell(c[0], c[1]) };
      return;
    }
    if ($('fingerNav').checked || performance.now() - lastPen < 1500) {
      drag = { mode: 'pan', sx, sy, px: panX, py: panY, touch: true, t0: performance.now(), u0: undoStack.length };
      return;
    }
  }
  const penErase = isPenEraser(e);
  if (tool === 'wall' && wallDraft && e.button === 2) {
    endWall();
    return;
  }
  if (!penErase && (e.button === 1 || e.button === 2 || spaceDown || tool === 'pan')) {
    drag = { mode: 'pan', sx, sy, px: panX, py: panY };
    view.style.cursor = 'grabbing';
    return;
  }
  if (e.button !== 0 && !penErase) return;
  const eff = penErase ? 'eraser' : tool,
    tid = eff === 'eraser' ? (baseActive() ? map.base : 255) : curTerrain,
    u0 = undoStack.length;
  switch (eff) {
    case 'brush':
    case 'eraser':
      pushUndo();
      paintCircle(cx, cy, brushRad(e), tid);
      drag = { mode: 'paint', lx: cx, ly: cy, tid };
      break;
    case 'cell':
      pushUndo();
      if (isHex(map)) {
        const h = pixelToHex(map, cx, cy);
        if (h) paintHex(h[0], h[1], tid);
        drag = { mode: 'cell', tid, last: h && h.join() };
        break;
      }
      paintCells(Math.floor(cx), Math.floor(cy), Math.floor(cx) + 1, Math.floor(cy) + 1, tid);
      drag = { mode: 'cell', tid };
      break;
    case 'rect':
      rectDrag = { a: [Math.floor(cx), Math.floor(cy)], b: [Math.floor(cx), Math.floor(cy)] };
      drag = { mode: 'rect' };
      drawOverlay();
      break;
    case 'fill':
      pushUndo();
      floodFill(cx, cy, tid);
      break;
    case 'height': {
      const lvEl = $('hLevel');
      if (e.shiftKey) {
        const H = ensureHgt(),
          c = Math.floor(cx),
          r = Math.floor(cy);
        if (c >= 0 && r >= 0 && c < map.cols && r < map.rows) {
          lvEl.value = H[r * map.cols + c];
          $('hOut').textContent = heightLabel(+lvEl.value);
        }
        break;
      }
      pushUndo();
      paintHeight(cx, cy, brushRad(e), +lvEl.value);
      drag = { mode: 'hpaint', lx: cx, ly: cy };
      break;
    }
    case 'pick': {
      const W = map.cols * R,
        x = Math.floor(cx * R),
        y = Math.floor(cy * R);
      if (x >= 0 && y >= 0 && x < W && y < map.rows * R) {
        let v = map.labels[y * W + x];
        if (v === 255)
          for (const l of [...shownLayers(map)].reverse()) {
            if (l.labels[y * W + x] !== 255) {
              v = l.labels[y * W + x];
              break;
            }
          }
        if (v !== 255) {
          selectTerrain(v);
          setTool('brush');
        }
      }
      break;
    }
    case 'measure': {
      const p0 = isHex(map) ? pixelToHex(map, cx, cy) : [Math.floor(cx), Math.floor(cy)];
      if (!p0) break;
      ruler = { a: p0, b: p0.slice() };
      drag = { mode: 'measure' };
      drawOverlay();
      break;
    }
    case 'room':
      if ($('roomShape').value === 'poly') {
        const p = snapPt(cx, cy, mods, roomDraft && roomDraft.pts[roomDraft.pts.length - 1]);
        if (!roomDraft) roomDraft = { pts: [p] };
        else {
          const f = roomDraft.pts[0],
            l = roomDraft.pts[roomDraft.pts.length - 1];
          if (
            (roomDraft.pts.length >= 3 && Math.hypot(p[0] - f[0], p[1] - f[1]) < 0.01) ||
            (l[0] === p[0] && l[1] === p[1])
          )
            finishRoomDraft();
          else roomDraft.pts.push(p);
        }
        drawOverlay();
        break;
      }
      if ($('roomShape').value === 'circle') {
        const c = snapPt(cx, cy, { alt: true }, null);
        circleDrag = { c, r: 0 };
        drag = { mode: 'circle' };
        drawOverlay();
        break;
      }
    // falls through to the rectangle room
    case 'stairs':
      if ($('stairShape').value === 'grand' || $('stairShape').value === 'half') {
        cstairDraft = { kind: $('stairShape').value, sx: cx, sy: cy, s: null };
        drag = { mode: 'cstair' };
        drawOverlay();
        break;
      }
      if ($('stairShape').value === 'pillar') {
        placePillar(cx, cy);
        break;
      }
      if ($('stairShape').value === 'curved') {
        if (!curveDraft) {
          curveDraft = { c: [snapHalf(cx), snapHalf(cy)], r1: 0, a0: 0, sweep: 0, stage: 1 };
        } else {
          curveDraft.stage = 3;
          curveDraft.last = curveDraft.a0;
          curveDraft.sweep = 0;
          const an = Math.atan2(cy - curveDraft.c[1], cx - curveDraft.c[0]);
          curveDraft.sweep = normAng(an - curveDraft.a0);
          curveDraft.last = an;
        }
        drag = { mode: 'curve' };
        drawOverlay();
        break;
      }
    // falls through to straight stairs
    case 'roof': {
      const c = [clamp(Math.floor(cx), 0, map.cols - 1), clamp(Math.floor(cy), 0, map.rows - 1)];
      rectDrag = { a: c, b: c.slice(), room: tool === 'room', stairs: tool === 'stairs', roof: tool === 'roof' };
      drag = { mode: 'rect' };
      drawOverlay();
      break;
    }
    case 'wall': {
      const last = wallDraft && wallDraft.pts[wallDraft.pts.length - 1],
        p = snapPt(cx, cy, mods, last);
      if (!wallDraft) wallDraft = { pts: [p], started: false };
      else if (last[0] === p[0] && last[1] === p[1]) wallDraft = null;
      else {
        if (!wallDraft.started) {
          pushUndo();
          wallDraft.started = true;
        }
        map.struct.walls.push({ x1: last[0], y1: last[1], x2: p[0], y2: p[1], mat: wallMat(), th: wallTh() });
        wallDraft.pts.push(p);
        structChanged();
      }
      drawOverlay();
      break;
    }
    case 'door': {
      const ed = nearestEdge(cx, cy);
      if (!ed) break;
      pushUndo();
      const st = map.struct,
        nd = { ...ed, type: $('doorType').value };
      const i = st.doors.findIndex(d => d.x === ed.x && d.y === ed.y && d.o === ed.o);
      if (i >= 0) st.doors[i] = nd;
      else st.doors.push(nd);
      structChanged();
      break;
    }
    case 'xstruct': {
      drag = { mode: 'xstruct', pushed: false };
      eraseStructAt(cx, cy);
      break;
    }
    case 'stamp': {
      const [x, y] = objPos(cx, cy);
      if (x < 0 || y < 0 || x > map.cols || y > map.rows) break;
      {
        const hi = hitObject(cx, cy);
        if (hi !== null) {
          const o = map.struct.objects[hi];
          drag = { mode: 'stampHold', i: hi, sx: cx, sy: cy, x, y, ox: cx - o.x, oy: cy - o.y };
          break;
        }
      }
      pushUndo();
      placeObject(curStamp, x, y, objSize(), preRot, preVar);
      rollPre();
      structChanged();
      drawOverlay();
      break;
    }
    case 'scatter':
      pushUndo();
      scatterAt(cx, cy);
      drag = { mode: 'scatter', lx: cx, ly: cy };
      break;
    case 'label': {
      const i = $('showLabels').checked ? hitLabel(cx, cy) : null;
      if (i !== null) {
        const l = map.struct.labels[i];
        drag = { mode: 'label', i, ox: cx - l.x, oy: cy - l.y, moved: false };
        break;
      }
      if (cx < 0 || cy < 0 || cx > map.cols || cy > map.rows) break;
      const txt = prompt('Label text (a number like 1, 2, 12a makes a room badge):', nextBadge());
      if (txt && txt.trim()) {
        pushUndo();
        map.struct.labels.push({
          x: +cx.toFixed(2),
          y: +cy.toFixed(2),
          text: txt.trim().slice(0, 80),
          size: +$('labelSize').value
        });
        $('showLabels').checked = true;
        drawStructView();
        touchSave();
      }
      break;
    }
    case 'select': {
      const h = hitMovable(cx, cy);
      selObj = null;
      selStair = h && h.kind === 'stairs' ? h.i : null;
      setTimeout(updateStairRow, 0);
      if (h && h.kind === 'objects') {
        selObj = h.i;
        const o = map.struct.objects[selObj];
        drag = { mode: 'move', ox: cx - o.x, oy: cy - o.y, pushed: false };
        showSel();
      } else if (h && h.kind === 'labels') {
        const l = map.struct.labels[h.i];
        drag = { mode: 'label', i: h.i, ox: cx - l.x, oy: cy - l.y, moved: false, noEdit: true };
      } else if (h) {
        drag = {
          mode: 'moveRect',
          kind: h.kind,
          i: h.i,
          sx: cx,
          sy: cy,
          r0: JSON.parse(JSON.stringify(map.struct[h.kind][h.i])),
          pushed: false
        };
        $('stTool').textContent = 'Moving ' + (h.kind === 'roofs' ? 'roof' : 'stairs');
      } else $('stTool').textContent = TOOL_NAMES.select;
      drawOverlay();
      break;
    }
  }
  if (e.pointerType === 'touch') {
    if (drag) Object.assign(drag, { touch: true, t0: performance.now(), u0 });
    else drag = { mode: 'tap', touch: true, t0: performance.now(), u0 };
  }
});
view.addEventListener('pointermove', e => {
  if (e.target.closest && e.target.closest('#touchBar, #sideTab') && !drag) return;
  const rect = view.getBoundingClientRect(),
    sx = e.clientX - rect.left,
    sy = e.clientY - rect.top,
    [cx, cy] = toCell(sx, sy);
  if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
    touches.set(e.pointerId, [sx, sy]);
    if (pinch && touches.size >= 2) {
      const [a, b] = [...touches.values()],
        c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      zoom = clamp((pinch.z0 * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.d0, 3, 200);
      panX = c[0] - pinch.cell[0] * zoom;
      panY = c[1] - pinch.cell[1] * zoom;
      applyView();
      return;
    }
    if (pinch) return;
  }
  if (e.pointerType === 'pen') lastPen = performance.now();
  hover = [cx, cy];
  mods = { alt: e.altKey, shift: e.shiftKey };
  const ix = Math.floor(cx),
    iy = Math.floor(cy);
  if (isHex(map)) {
    const hx = pixelToHex(map, cx, cy);
    $('stCell').textContent = hx ? `Hex ${hx[0] + 1}, ${hx[1] + 1}  ·  ${map.ft} ${map.unit} across` : '—';
  } else
    $('stCell').textContent =
      ix >= 0 && iy >= 0 && ix < map.cols && iy < map.rows
        ? `Square ${ix + 1}, ${iy + 1}  ·  ${+(ix * map.ft).toFixed(2)}–${+((ix + 1) * map.ft).toFixed(2)} ${map.unit}, ${+(iy * map.ft).toFixed(2)}–${+((iy + 1) * map.ft).toFixed(2)} ${map.unit}`
        : '—';
  if (drag) {
    if (drag.mode === 'pan') {
      panX = drag.px + sx - drag.sx;
      panY = drag.py + sy - drag.sy;
      applyView();
      return;
    }
    if (drag.mode === 'cstair' && cstairDraft) {
      cstairDraft.s = draftComposite(cstairDraft, cx, cy);
      drawOverlay();
    }
    if (drag.mode === 'curve' && curveDraft) {
      const cd = curveDraft,
        an = Math.atan2(cy - cd.c[1], cx - cd.c[0]);
      if (cd.stage === 1) {
        cd.r1 = Math.max(0, snapHalf(Math.hypot(cx - cd.c[0], cy - cd.c[1])));
        cd.a0 = an;
      } else {
        cd.sweep = clamp(cd.sweep + normAng(an - cd.last), -20 * Math.PI, 20 * Math.PI);
        cd.last = an;
      }
      drawOverlay();
    }
    if (drag.mode === 'hpaint') {
      const rad = brushRad(e),
        dist = Math.hypot(cx - drag.lx, cy - drag.ly),
        steps = Math.max(1, Math.ceil(dist / Math.max(0.2, rad * 0.4)));
      for (let i = 1; i <= steps; i++)
        paintHeight(
          drag.lx + ((cx - drag.lx) * i) / steps,
          drag.ly + ((cy - drag.ly) * i) / steps,
          rad,
          +$('hLevel').value
        );
      drag.lx = cx;
      drag.ly = cy;
    }
    if (drag.mode === 'paint') {
      const rad = brushRad(e),
        dist = Math.hypot(cx - drag.lx, cy - drag.ly),
        steps = Math.max(1, Math.ceil(dist / Math.max(0.05, rad * 0.35)));
      for (let i = 1; i <= steps; i++)
        paintCircle(drag.lx + ((cx - drag.lx) * i) / steps, drag.ly + ((cy - drag.ly) * i) / steps, rad, drag.tid);
      drag.lx = cx;
      drag.ly = cy;
    }
    if (drag.mode === 'cell' && isHex(map)) {
      const h = pixelToHex(map, cx, cy);
      if (h && h.join() !== drag.last) {
        paintHex(h[0], h[1], drag.tid);
        drag.last = h.join();
      }
    } else if (drag.mode === 'cell') {
      const W = map.cols * R;
      if (
        ix >= 0 &&
        iy >= 0 &&
        ix < map.cols &&
        iy < map.rows &&
        map.labels[(iy * R + R / 2) * W + ix * R + R / 2] !== drag.tid
      )
        paintCells(ix, iy, ix + 1, iy + 1, drag.tid);
    }
    if (drag.mode === 'rect') {
      rectDrag.b = [clamp(ix, 0, map.cols - 1), clamp(iy, 0, map.rows - 1)];
    }
    if (drag.mode === 'xstruct') eraseStructAt(cx, cy);
    if (drag.mode === 'circle' && circleDrag) {
      circleDrag.r = Math.round(Math.hypot(cx - circleDrag.c[0], cy - circleDrag.c[1]) * 2) / 2;
    }
    if (drag.mode === 'label') {
      const l = map.struct.labels[drag.i];
      if (l && (drag.moved || Math.hypot(cx - drag.ox - l.x, cy - drag.oy - l.y) > 0.15)) {
        if (!drag.moved) {
          pushUndo();
          drag.moved = true;
        }
        l.x = +(cx - drag.ox).toFixed(2);
        l.y = +(cy - drag.oy).toFixed(2);
        structChanged();
      }
    }
    if (drag.mode === 'scatter' && Math.hypot(cx - drag.lx, cy - drag.ly) > +$('brushSize').value * 0.25) {
      scatterAt(cx, cy);
      drag.lx = cx;
      drag.ly = cy;
    }
    if (drag.mode === 'stampHold' && Math.hypot(cx - drag.sx, cy - drag.sy) > 0.2) {
      selObj = drag.i;
      Object.assign(drag, { mode: 'move', pushed: false, fromStamp: true });
      $('stTool').textContent = 'Moving ' + STAMPS[map.struct.objects[selObj].t].name;
    }
    if (drag.mode === 'moveRect') {
      const r = map.struct[drag.kind][drag.i],
        dx = Math.round(cx - drag.sx),
        dy = Math.round(cy - drag.sy),
        w = drag.r0.x1 - drag.r0.x0,
        h = drag.r0.y1 - drag.r0.y0;
      if (r && (dx || dy || drag.pushed)) {
        if (!drag.pushed) {
          pushUndo();
          drag.pushed = true;
        }
        r.x0 = clamp(drag.r0.x0 + dx, 0, map.cols - w);
        r.y0 = clamp(drag.r0.y0 + dy, 0, map.rows - h);
        r.x1 = r.x0 + w;
        r.y1 = r.y0 + h;
        if (r.arc) {
          r.arc.cx = drag.r0.arc.cx + r.x0 - drag.r0.x0;
          r.arc.cy = drag.r0.arc.cy + r.y0 - drag.r0.y0;
        }
        if (r.kind) {
          r.fx = drag.r0.fx + r.x0 - drag.r0.x0;
          r.fy = drag.r0.fy + r.y0 - drag.r0.y0;
        }
        structChanged();
      }
    }
    if (drag.mode === 'move' && selObj !== null) {
      if (!drag.pushed) {
        pushUndo();
        drag.pushed = true;
        selObj = selObj;
      }
      const o = map.struct.objects[selObj];
      if (o) {
        const [x, y] = objPos(cx - drag.ox, cy - drag.oy);
        o.x = +clamp(x, 0, map.cols).toFixed(3);
        o.y = +clamp(y, 0, map.rows).toFixed(3);
        structChanged();
      }
    }
    if (drag.mode === 'measure') {
      if (isHex(map)) {
        const h = pixelToHex(map, cx, cy);
        if (h) ruler.b = h;
      } else ruler.b = [clamp(ix, 0, map.cols - 1), clamp(iy, 0, map.rows - 1)];
    }
  }
  drawOverlay();
});
function endDrag() {
  if (!drag) return;
  if (drag.mode === 'cstair') {
    drag = null;
    const s2 = cstairDraft && cstairDraft.s;
    cstairDraft = null;
    if (s2 && s2.x0 >= 0 && s2.y0 >= 0 && s2.x1 <= map.cols && s2.y1 <= map.rows) {
      pushUndo();
      map.struct.stairs.push(s2);
      structChanged();
    }
    drawOverlay();
    return;
  }
  if (drag.mode === 'curve') {
    drag = null;
    const cd = curveDraft;
    if (!cd) return;
    if (cd.stage === 1) {
      if (cd.r1 >= 0.5) {
        cd.stage = 2;
        $('stTool').textContent =
          'Curved stairs — now drag around the curve, starting from the bottom step · Esc cancels';
      } else curveDraft = null;
    } else {
      if (Math.abs(cd.sweep) > 0.15) placeCurve(cd);
      curveDraft = null;
      $('stTool').textContent = TOOL_NAMES.stairs;
    }
    drawOverlay();
    return;
  }
  if (drag.mode === 'stampHold') {
    const d = drag;
    drag = null;
    pushUndo();
    placeObject(curStamp, d.x, d.y, objSize(), preRot, preVar);
    rollPre();
    structChanged();
    drawOverlay();
    return;
  }
  if (drag.mode === 'move' && drag.fromStamp) {
    drag = null;
    selObj = null;
    $('stTool').textContent = TOOL_NAMES.stamp;
    drawOverlay();
    return;
  }
  if (drag.mode === 'moveRect') {
    drag = null;
    $('stTool').textContent = TOOL_NAMES.select;
    return;
  }
  if (drag.mode === 'label' && !drag.moved && drag.noEdit) {
    drag = null;
    return;
  }
  if (drag.mode === 'label' && !drag.moved) {
    const l = map.struct.labels[drag.i],
      d = drag;
    drag = null;
    const txt = prompt('Edit label (leave empty to delete):', l.text);
    if (txt !== null) {
      pushUndo();
      if (txt.trim()) {
        l.text = txt.trim().slice(0, 80);
        l.size = +$('labelSize').value;
      } else map.struct.labels.splice(d.i, 1);
      drawStructView();
      touchSave();
    }
    return;
  }
  if (drag.mode === 'rect' && rectDrag) {
    const [a, b] = rectBounds(rectDrag);
    if (b[0] > a[0] && b[1] > a[1]) {
      pushUndo();
      if (rectDrag.roof) {
        map.struct.roofs.push({ x0: a[0], y0: a[1], x1: b[0], y1: b[1], mat: $('roofMat').value, ...objTint() });
        structChanged();
      } else if (rectDrag.stairs) {
        map.struct.stairs.push({
          x0: a[0],
          y0: a[1],
          x1: b[0],
          y1: b[1],
          dir: { n: 's', s: 'n', e: 'w', w: 'e' }[stairDir(rectDrag)]
        });
        structChanged();
      } else {
        paintCells(a[0], a[1], b[0], b[1], curTerrain);
        if (rectDrag.room) {
          const mt = wallMat(),
            th = wallTh(),
            W = map.struct.walls,
            P4 = [
              [a[0], a[1]],
              [b[0], a[1]],
              [b[0], b[1]],
              [a[0], b[1]]
            ];
          for (let i = 0; i < 4; i++) {
            const p = P4[i],
              q = P4[(i + 1) % 4];
            W.push({ x1: p[0], y1: p[1], x2: q[0], y2: q[1], mat: mt, th });
          }
          structChanged();
        }
      }
    }
    rectDrag = null;
  }
  if (drag.mode === 'circle' && circleDrag) {
    if (circleDrag.r >= 1) buildRoom(circlePts(circleDrag.c, circleDrag.r));
    circleDrag = null;
  }
  if (drag.mode === 'pan') view.style.cursor = '';
  drag = null;
  drawOverlay();
}
function eraseStructAt(cx, cy) {
  const h = hitStruct(cx, cy);
  if (!h) return;
  if (!drag || !drag.pushed) {
    pushUndo();
    if (drag) drag.pushed = true;
  }
  map.struct[h.kind].splice(h.i, 1);
  structChanged();
  drawOverlay();
}
function pointerEnd(e) {
  if (e.pointerType === 'touch') {
    touches.delete(e.pointerId);
    if (pinch) {
      if (touches.size < 2) pinch = null;
      if (touches.size === 1) {
        const [p] = [...touches.values()];
        drag = { mode: 'pan', sx: p[0], sy: p[1], px: panX, py: panY, touch: true, t0: 0, u0: 0 };
      } else drag = null;
      return;
    }
  }
  if (drag && drag.mode === 'tap') {
    drag = null;
    return;
  }
  endDrag();
}
view.addEventListener('pointerup', pointerEnd);
view.addEventListener('pointercancel', pointerEnd);
view.addEventListener('pointerleave', () => {
  hover = null;
  drawOverlay();
});
view.addEventListener(
  'wheel',
  e => {
    e.preventDefault();
    const rect = view.getBoundingClientRect(),
      sx = e.clientX - rect.left,
      sy = e.clientY - rect.top,
      [cx, cy] = toCell(sx, sy);
    zoom = clamp(zoom * Math.pow(1.0015, -e.deltaY), 3, 200);
    panX = sx - cx * zoom;
    panY = sy - cy * zoom;
    applyView();
  },
  { passive: false }
);
