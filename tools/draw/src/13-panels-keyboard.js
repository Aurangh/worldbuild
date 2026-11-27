/* ---------- UI: tools, terrains, settings ---------- */
const TOOL_NAMES = {
  height:
    'Ground height — paint with the brush size · 5 ft a step · drops of 10 ft or more become cliffs · Shift-click picks a height',
  brush: 'Terrain brush',
  cell: 'Cell paint',
  rect: 'Rectangle fill',
  fill: 'Flood fill',
  eraser: 'Eraser',
  pick: 'Picker',
  measure: 'Ruler',
  pan: 'Pan',
  room: 'Room — rectangle: drag · polygon: click corners, click the first one (or Enter) to close · round: drag from the centre · floor uses the selected terrain',
  wall: 'Wall — click corners; click the last point again, right-click or Esc to finish · Shift: straight/45° · Alt: quarter-square snap',
  door: 'Door — click a square edge; clicking an existing door replaces it',
  roof: 'Roof — drag over a building; hide the layer to see inside',
  label:
    'Label — click to add (numbers become room badges), click a label to edit, drag to move · labels export only on the DM map unless you tick Include labels',
  stamp: 'Place object — tap to place · drag an object that is already there to move it · , and . rotate',
  scatter: 'Scatter — paint objects with the brush size and density',
  select:
    'Select & move — drag any object, label, roof or stairs (on any visible layer) · arrows nudge (Shift: 1 square) · Del delete · , . rotate · - = resize · Ctrl+D copy',
  stairs:
    'Stairs — straight, grand and half-turn: drag from the foot uphill · curved: press the centre, drag to the outer edge, then drag around from the bottom step · pillar: tap',
  xstruct: 'Remove — click or drag over walls, doors, stairs'
};
function setTool(t) {
  setTimeout(updateLightRow, 0);
  setTimeout(updateStairRow, 0);
  if (t !== 'stairs') {
    curveDraft = null;
    cstairDraft = null;
  }
  if (t !== 'select') selStair = null;
  $('heightRow').style.display = t === 'height' ? '' : 'none';
  if (t !== 'wall') wallDraft = null;
  if (t !== 'room') roomDraft = null;
  if (t !== 'select') selObj = null;
  tool = t;
  document.querySelectorAll('#tools button').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  $('stTool').textContent = TOOL_NAMES[t];
  if (t !== 'measure') ruler = null;
  view.style.cursor = t === 'pan' ? 'grab' : '';
  drawOverlay();
}
document.querySelectorAll('#tools button').forEach(b => (b.onclick = () => setTool(b.dataset.tool)));

function buildTerrainPanel() {
  const box = $('terrains');
  box.innerHTML = '';
  const hidT = hiddenTerrains();
  DISPLAY.forEach((i, pos) => {
    const t = TERRAINS[i];
    if (hidT.has(t.key)) return;
    const d = document.createElement('div');
    d.className = 'tsw';
    d.dataset.i = i;
    d.title = `${t.name} (${keyLabel(pos).replace('⇧', 'Shift+')})`;
    const c = document.createElement('canvas');
    c.width = 104;
    c.height = 46;
    const tex = genTexture(i, 20, 12345);
    const cx = c.getContext('2d');
    cx.fillStyle = cx.createPattern(tex, 'repeat');
    cx.fillRect(0, 0, 104, 46);
    d.appendChild(c);
    const s = document.createElement('span');
    s.innerHTML = `${t.name}<i>${keyLabel(pos)}</i>`;
    d.appendChild(s);
    d.onclick = () => {
      selectTerrain(i);
      if (tool === 'eraser' || tool === 'pick' || tool === 'pan' || tool === 'measure') setTool('brush');
    };
    box.appendChild(d);
  });
}
function buildStampPanel() {
  const box = $('stamps');
  box.innerHTML = '';
  for (const k of STAMP_KEYS) {
    const st = STAMPS[k];
    if (st.cat !== stampCat) continue;
    const d = document.createElement('div');
    d.className = 'stp' + (k === curStamp ? ' on' : '');
    d.title = st.name;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 52;
    const x = c.getContext('2d');
    const R = Math.min(52, (64 / Math.max(st.w, st.h)) * 0.75),
      sp = getSprite(k, 7, R);
    x.globalAlpha = 0.45;
    x.drawImage(sp.sh, 32 - sp.size / 2 + 2, 26 - sp.size / 2 + 3);
    x.globalAlpha = 1;
    x.drawImage(sp.c, 32 - sp.size / 2, 26 - sp.size / 2);
    d.appendChild(c);
    const sp2 = document.createElement('span');
    sp2.textContent = st.name;
    d.appendChild(sp2);
    d.onclick = () => {
      curStamp = k;
      placeLight = { lp: null, off: false };
      setTimeout(updateLightRow, 0);
      rollPre();
      buildStampPanel();
      if (tool === 'scatter') $('scatterSet').value = 'current';
      else setTool('stamp');
    };
    box.appendChild(d);
  }
}
document.querySelectorAll('#stampTabs button').forEach(
  b =>
    (b.onclick = () => {
      stampCat = b.dataset.cat;
      document.querySelectorAll('#stampTabs button').forEach(x => x.classList.toggle('on', x === b));
      buildStampPanel();
    })
);
for (const [k, v] of Object.entries(SCATTER_SETS)) {
  const o = document.createElement('option');
  o.value = k;
  o.textContent = v.name;
  $('scatterSet').appendChild(o);
}
$('scatterSet').value = 'forest';
function showSel() {
  updateLightRow();
  if (selObj === null || !map.struct.objects[selObj]) {
    $('stTool').textContent = TOOL_NAMES[tool];
    return;
  }
  const o = map.struct.objects[selObj];
  $('stTool').textContent =
    `Selected: ${STAMPS[o.t].name} · size ${Math.round(o.s * 100)}% · ${Math.round(((((o.r * 180) / Math.PI) % 360) + 360) % 360)}°`;
}
/* ---------- theme packs: show or hide each pack's object tab and terrain swatches ---------- */
const PACKS = {
  japan: { name: 'Japan', cats: ['japan'], terrains: ['tatami', 'engawa', 'gravel', 'moss'] },
  caves: { name: 'Underdark & caverns', cats: ['cave'], terrains: ['wetrock', 'crystal', 'cavemud', 'biomoss'] },
  jungle: { name: 'Jungle & coast', cats: ['jungle'], terrains: ['jungle', 'beach', 'reef', 'mangrove'] },
  ships: { name: 'Ships & docks', cats: ['ship'], terrains: ['deck', 'pier', 'quay'] },
  steam: { name: 'Steampunk', cats: ['steam'], terrains: ['brass', 'ironplate', 'grating', 'soot'] }
};
const packsOff = () => new Set((lsGet('md-packs-off') || '').split('|').filter(Boolean));
const hiddenCats = () => {
  const off = packsOff();
  return new Set(
    Object.entries(PACKS)
      .filter(([k]) => off.has(k))
      .flatMap(([, p]) => p.cats)
  );
};
const hiddenTerrains = () => {
  const off = packsOff();
  return new Set(
    Object.entries(PACKS)
      .filter(([k]) => off.has(k))
      .flatMap(([, p]) => p.terrains)
  );
};
function buildPacksPanel() {
  const box = $('packs');
  box.innerHTML = '';
  const off = packsOff();
  for (const [k, p] of Object.entries(PACKS)) {
    const r = document.createElement('div');
    r.className = 'row';
    r.innerHTML = `<label for="pk_${k}">${p.name}</label><input type="checkbox" id="pk_${k}" ${off.has(k) ? '' : 'checked'}>`;
    r.querySelector('input').onchange = ev => {
      const o = packsOff();
      ev.target.checked ? o.delete(k) : o.add(k);
      lsSet('md-packs-off', [...o].join('|'));
      applyPacks();
    };
    box.appendChild(r);
  }
  const note = document.createElement('div');
  note.className = 'hint';
  note.style.cssText = 'font-size:11.5px;color:var(--dim)';
  note.textContent = 'Hiding a pack only tidies the panel; maps that use it still draw it.';
  box.appendChild(note);
}
function applyPacks() {
  const hc = hiddenCats();
  document.querySelectorAll('#stampTabs button').forEach(b => (b.style.display = hc.has(b.dataset.cat) ? 'none' : ''));
  if (hc.has(stampCat)) {
    stampCat = 'nature';
    document.querySelectorAll('#stampTabs button').forEach(x => x.classList.toggle('on', x.dataset.cat === 'nature'));
  }
  buildTerrainPanel();
  buildStampPanel();
  selectTerrain(curTerrain);
}

/* ---------- layers panel ---------- */
const LAYER_PRESETS = {
  empty: ['Layer', {}],
  roofs: ['Roofs', {}],
  upper: ['Upper floor', { opacity: 0.6 }],
  event: ['After event', {}],
  dm: ['DM notes', { dm: true }]
};
function buildLayerPanel() {
  const box = $('layers');
  if (!box || !map) return;
  box.innerHTML = '';
  [...map.layers].reverse().forEach(l => {
    const i = map.layers.indexOf(l),
      base = i === 0;
    const d = document.createElement('div');
    d.className = 'lay' + (l.id === map.activeLayer ? ' on' : '');
    d.title = 'Click to draw on this layer';
    d.innerHTML = `<input type="checkbox" ${l.visible ? 'checked' : ''} title="Show / hide"><span class="nm"></span><span class="ctl">${base ? '' : '<button data-a="up" title="Move up">▲</button><button data-a="dn" title="Move down">▼</button><button data-a="dm" title="DM only">DM</button><button data-a="del" title="Delete layer">×</button>'}<button data-a="ren" title="Rename">✎</button></span>${base ? '' : `<input type="range" min="0.1" max="1" step="0.05" value="${l.opacity}" title="Opacity">`}`;
    d.querySelector('.nm').textContent = l.name;
    if (l.dm) {
      const sm = document.createElement('small');
      sm.textContent = 'DM only';
      d.querySelector('.nm').appendChild(sm);
    }
    d.onclick = ev => {
      if (ev.target.closest('input,button')) return;
      setActiveLayer(l.id);
    };
    d.querySelector('input[type=checkbox]').onchange = ev => {
      l.visible = ev.target.checked;
      syncLayerDOM();
      drawStructView();
      drawReliefView();
      touchSave();
    };
    const rg = d.querySelector('input[type=range]');
    if (rg)
      rg.oninput = () => {
        l.opacity = +rg.value;
        syncLayerDOM();
        touchSave();
      };
    d.querySelectorAll('button').forEach(
      b =>
        (b.onclick = () => {
          const a = b.dataset.a,
            L = map.layers;
          if (a === 'ren') {
            const n = prompt('Layer name', l.name);
            if (n && n.trim()) {
              l.name = n.trim().slice(0, 40);
              buildLayerPanel();
              touchSave();
            }
            return;
          }
          if (a === 'dm') {
            l.dm = !l.dm;
            buildLayerPanel();
            touchSave();
            return;
          }
          if (a === 'up' && i < L.length - 1) {
            [L[i], L[i + 1]] = [L[i + 1], L[i]];
          }
          if (a === 'dn' && i > 1) {
            [L[i], L[i - 1]] = [L[i - 1], L[i]];
          }
          if (a === 'del') {
            if (!confirm(`Delete layer "${l.name}" and everything on it?`)) return;
            L.splice(i, 1);
            undoStack = [];
            redoStack = [];
            updUndo();
            if (map.activeLayer === l.id) setActiveLayer('base');
          }
          syncLayerDOM();
          drawStructView();
          buildLayerPanel();
          touchSave();
        })
    );
    box.appendChild(d);
  });
  const al = activeLayer();
  $('stLayer').textContent = 'Layer: ' + al.name;
}
$('bAddLayer').onclick = () => {
  const [name, o] = LAYER_PRESETS[$('newLayerType').value];
  const n = map.layers.filter(l => l.name.startsWith(name)).length;
  const l = newLayer(n ? `${name} ${n + 1}` : name, o);
  map.layers.push(l);
  syncLayerDOM();
  renderLayer(l, 0, 0, map.cols, map.rows);
  setActiveLayer(l.id);
  drawStructView();
  touchSave();
  if ($('newLayerType').value === 'roofs') setTool('roof');
};

/* ---------- palette UI ---------- */
let activeHex = null;
function buildPalette() {
  const box = $('palette');
  box.innerHTML = '';
  const g0 = document.createElement('div');
  g0.className = 'pals';
  const none = document.createElement('div');
  none.className = 'sw none' + (activeHex === null ? ' on' : '');
  none.title = 'Default colours';
  none.onclick = () => setActive(null);
  g0.appendChild(none);
  box.appendChild(g0);
  for (const [g, list] of PALETTE) {
    const h = document.createElement('div');
    h.className = 'palg';
    h.textContent = g;
    box.appendChild(h);
    const row = document.createElement('div');
    row.className = 'pals';
    for (const [n, hex] of list) {
      const d = document.createElement('div');
      d.className = 'sw' + (activeHex === hex ? ' on' : '');
      d.title = n;
      d.style.background = `linear-gradient(90deg,${rampFromHex(hex).join(',')})`;
      d.onclick = () => setActive(hex);
      row.appendChild(d);
    }
    box.appendChild(row);
  }
}
function setActive(hex) {
  activeHex = hex;
  buildPalette();
  $('acBig').style.background = hex || 'repeating-linear-gradient(45deg,#2a2d35 0 4px,#353943 4px 8px)';
  $('acRamp').innerHTML = hex
    ? rampFromHex(hex)
        .map(c => `<i style="background:${c}"></i>`)
        .join('')
    : '<i style="background:none;color:var(--dim);font-style:normal;font-size:11px;padding-left:4px">default colours</i>';
  if (hex) {
    $('pickCol').value = hex;
    $('pickHex').value = hex;
  }
  $('bRecolour').disabled = !hex;
  drawOverlay();
}
$('pickCol').oninput = () => {
  $('pickHex').value = $('pickCol').value;
  setActive($('pickCol').value.toLowerCase());
};
$('pickHex').onchange = () => {
  let v = $('pickHex').value.trim();
  if (!v.startsWith('#')) v = '#' + v;
  if (/^#[0-9a-f]{6}$/i.test(v)) setActive(v.toLowerCase());
  else $('pickHex').value = activeHex || '';
};
$('bRecolour').onclick = () => {
  if (!activeHex) return;
  const T = TERRAINS[curTerrain],
    gen = T.gen || T.key;
  let j = map.custom.findIndex(c => c && c.gen === gen && c.hex === activeHex);
  if (j < 0) {
    j = map.custom.length;
    map.custom.push({ gen, hex: activeHex });
    applyCustoms();
    buildCustomPanel();
    touchSave();
  }
  selectTerrain(CUSTOM_BASE + j);
  if (!['brush', 'cell', 'rect', 'fill', 'room'].includes(tool)) setTool('brush');
};
function terrainSwatch(i, keyTxt) {
  const t = TERRAINS[i],
    d = document.createElement('div');
  d.className = 'tsw';
  d.dataset.i = i;
  d.title = t.name;
  const c = document.createElement('canvas');
  c.width = 104;
  c.height = 46;
  const cx = c.getContext('2d');
  cx.fillStyle = cx.createPattern(genTex(t, 20, 12345, t.baseIdx ?? i), 'repeat');
  cx.fillRect(0, 0, 104, 46);
  d.appendChild(c);
  const s = document.createElement('span');
  s.innerHTML = `<b style="font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.name}</b><i>${keyTxt}</i>`;
  d.appendChild(s);
  d.onclick = () => {
    selectTerrain(i);
    if (['eraser', 'pick', 'pan', 'measure'].includes(tool)) setTool('brush');
  };
  return d;
}
function buildCustomPanel() {
  const box = $('customs');
  box.innerHTML = '';
  let n = 0;
  TERRAINS.forEach((t, i) => {
    if (!t.custom) return;
    n++;
    const d = terrainSwatch(i, '');
    const x = document.createElement('button');
    x.className = 'del';
    x.textContent = '×';
    x.title = 'Remove this colour (painted areas go back to the default colour)';
    x.onclick = ev => {
      ev.stopPropagation();
      if (!confirm(`Remove ${t.name}? Areas painted with it return to ${TERRAINS[t.baseIdx].name}.`)) return;
      for (const L of map.layers) {
        const lab = L.labels;
        for (let k = 0; k < lab.length; k++) if (lab[k] === i) lab[k] = t.baseIdx;
      }
      if (map.base === i) map.base = t.baseIdx;
      map.custom[i - CUSTOM_BASE] = null;
      applyCustoms();
      buildCustomPanel();
      if (curTerrain === i) selectTerrain(t.baseIdx);
      undoStack = [];
      redoStack = [];
      updUndo();
      renderAllLayers();
      touchSave();
    };
    d.appendChild(x);
    box.appendChild(d);
  });
  $('customsHead').style.display = n ? '' : 'none';
  selectTerrain(curTerrain);
}

function selectTerrain(i) {
  curTerrain = i;
  document.querySelectorAll('.tsw').forEach(d => d.classList.toggle('on', +d.dataset.i === i));
}

function syncOutputs() {
  $('nightOut').textContent = Math.round(+$('nightStr').value * 100) + '%';
  $('lightOut').textContent = Math.round(+$('lightRad').value * 100) + '%';
  $('objSizeOut').textContent = Math.round(+$('objSize').value * 100) + '%';
  $('densityOut').textContent = Math.round(+$('density').value * 100) + '%';
  $('brushOut').textContent = +$('brushSize').value + ' sq';
  $('softOut').textContent = (+$('soft').value).toFixed(2) + ' sq';
  $('gridOpOut').textContent = Math.round($('gridOp').value * 100) + '%';
}
$('brushSize').oninput = () => {
  syncOutputs();
  drawOverlay();
};
let softTimer = 0;
$('soft').oninput = () => {
  syncOutputs();
  map.soft = +$('soft').value;
  clearTimeout(softTimer);
  softTimer = setTimeout(() => {
    renderView(0, 0, map.cols, map.rows);
    touchSave();
  }, 120);
};
$('gridOn').onchange = drawOverlay;
$('gridOp').oninput = () => {
  syncOutputs();
  drawOverlay();
};
$('ruleMode').onchange = drawOverlay;
$('showSecret').onchange = drawStructView;
$('objSize').oninput = () => {
  syncOutputs();
  drawOverlay();
};
$('density').oninput = syncOutputs;
$('tintObj').onchange = drawOverlay;
$('showLabels').onchange = drawStructView;
function setTod(t) {
  map.tod = t;
  setSun(t);
  drawStructView();
  drawReliefView();
  touchSave();
}
function toggleNight() {
  setTod(TOD_ORDER[(TOD_ORDER.indexOf(map.tod || 'day') + 1) % TOD_ORDER.length]);
}
$('todSel').onchange = () => setTod($('todSel').value);
function applySeason() {
  SEASON = map.season || 'summer';
  $('seasonSel').value = SEASON;
  renderAllLayers();
  drawStructView();
  buildStampPanel();
}
function applyTop() {
  SHOW_TOP = map.showTop !== false;
  $('bTop').classList.toggle('on', SHOW_TOP);
  $('bTop').textContent = SHOW_TOP ? '⌂ Roofs & trees' : '⌂ Roofs & trees: off';
}
function toggleTop() {
  map.showTop = !(map.showTop !== false);
  applyTop();
  renderAllLayers();
  drawStructView();
  touchSave();
}
$('bTop').onclick = toggleTop;
$('seasonSel').onchange = () => {
  map.season = $('seasonSel').value;
  applySeason();
  touchSave();
};
const narrow = () => matchMedia('(max-width:1100px)').matches;
function sideState() {
  const open = narrow()
    ? document.body.classList.contains('side-open')
    : !document.body.classList.contains('side-collapsed');
  $('sideTab').textContent = open ? '›' : '‹';
}
function toggleSide() {
  if (narrow()) document.body.classList.toggle('side-open');
  else {
    document.body.classList.toggle('side-collapsed');
    lsSet('md-side', document.body.classList.contains('side-collapsed') ? '0' : '1');
  }
  sideState();
  setTimeout(() => {
    resizeOverlay();
    drawOverlay();
  }, 30);
}
$('bSide').onclick = toggleSide;
$('sideTab').onclick = toggleSide;
if (lsGet('md-side') === '0') document.body.classList.add('side-collapsed');
addEventListener('resize', sideState);
// collapsible panel sections: each heading folds the controls under it
(function () {
  const side = $('side'),
    kids = [...side.children];
  let sec = null;
  const closed = new Set((lsGet('md-closed') || '').split('|').filter(Boolean));
  for (const el of kids) {
    if (el.tagName === 'H3') {
      sec = document.createElement('div');
      sec.className = 'sec';
      side.insertBefore(sec, el);
      const key = el.textContent.trim();
      sec.dataset.key = key;
      if (closed.has(key)) sec.classList.add('closed');
      const s2 = sec;
      el.onclick = () => {
        s2.classList.toggle('closed');
        lsSet('md-closed', [...side.querySelectorAll('.sec.closed')].map(x => x.dataset.key).join('|'));
      };
    }
    if (sec) sec.appendChild(el);
  }
})();
setTimeout(sideState, 0);
$('fingerNav').onchange = () => lsSet('md-fingernav', $('fingerNav').checked ? '1' : '0');
$('penPressure').onchange = () => lsSet('md-pressure', $('penPressure').checked ? '1' : '0');
$('showTouchBar').onchange = () => setTouchUI($('showTouchBar').checked);
function nudgeSel(kind) {
  const o = selObj !== null ? map.struct.objects[selObj] : null;
  if (o) {
    pushUndo();
    if (kind === 'rl' || kind === 'rr') o.r = +(o.r + ((kind === 'rr' ? 1 : -1) * Math.PI) / 12).toFixed(3);
    else if (kind === 'smaller' || kind === 'bigger')
      o.s = +clamp(o.s + (kind === 'smaller' ? -0.1 : 0.1), 0.2, 5).toFixed(3);
    else if (kind === 'del') {
      map.struct.objects.splice(selObj, 1);
      selObj = null;
    }
    structChanged();
    drawOverlay();
    showSel();
    return;
  }
  if (kind === 'rl' || kind === 'rr') {
    preRot += ((kind === 'rr' ? 1 : -1) * Math.PI) / 12;
    drawOverlay();
    return;
  }
  if (kind === 'smaller' || kind === 'bigger') {
    const sl = ['stamp', 'scatter'].includes(tool) ? $('objSize') : $('brushSize'),
      st = sl === $('objSize') ? 0.1 : 0.25;
    sl.value = clamp(+sl.value + (kind === 'bigger' ? st : -st), +sl.min, +sl.max);
    syncOutputs();
    drawOverlay();
  }
}
document.querySelectorAll('#touchBar button').forEach(
  b =>
    (b.onclick = () => {
      const a = b.dataset.a;
      if (a === 'undo') undo();
      else if (a === 'redo') redo();
      else if (a === 'fit') fit();
      else if (a === 'done') {
        curveDraft = null;
        if (roomDraft) {
          finishRoomDraft();
          return;
        }
        wallDraft = null;
        ruler = null;
        rectDrag = null;
        selObj = null;
        showSel();
        drawOverlay();
      } else nudgeSel(a);
    })
);
$('fingerNav').checked = lsGet('md-fingernav') === '1';
$('penPressure').checked = lsGet('md-pressure') === '1';
setTouchUI(
  lsGet('md-touchbar') === '1' || (lsGet('md-touchbar') === null && matchMedia('(pointer: coarse)').matches),
  false
);
$('lightRules').onchange = () => {
  map.rules = $('lightRules').value;
  updateLightRow();
  nightSoon();
  drawOverlay();
  touchSave();
};
$('showRanges').onchange = drawOverlay;
$('occlude').onchange = () => {
  map.occlude = $('occlude').checked;
  nightSoon();
  touchSave();
};
$('nightStr').oninput = () => {
  map.nightStr = +$('nightStr').value;
  syncOutputs();
  nightSoon();
  touchSave();
};
$('lightRad').oninput = () => {
  map.lightRad = +$('lightRad').value;
  syncOutputs();
  nightSoon();
  touchSave();
};
$('objRandRot').onchange = () => {
  preRot = 0;
  rollPre();
  drawOverlay();
};
$('wallTh').onchange = drawOverlay;
$('roomShape').onchange = () => {
  roomDraft = null;
  circleDrag = null;
  drawOverlay();
};
$('bReroll').onclick = () => {
  map.seed = (Math.random() * 1e9) | 0;
  texCache.clear();
  renderView(0, 0, map.cols, map.rows);
  drawStructView();
  touchSave();
};
$('bUndo').onclick = undo;
$('bRedo').onclick = redo;
$('bFit').onclick = fit;
$('mapName').onchange = () => {
  map.name = $('mapName').value.trim() || 'Untitled map';
  $('mapName').value = map.name;
  touchSave();
};

function updateInfo() {
  const hx = isHex(map),
    [tw, th] = exportSize(map, map.px);
  $('mapInfo').innerHTML = hx
    ? `<b>${map.hcols} × ${map.hrows}</b> hexes (${map.grid === 'hexflat' ? 'flat' : 'pointy'} top)<br><b>${map.ft} ${map.unit}</b> per hex<br>Hex size: <b>${map.px} px</b> centre to centre<br>Tracker export: <b>${tw} × ${th} px</b><br>Base terrain: <b>${TERRAINS[map.base].name}</b>`
    : `<b>${map.cols} × ${map.rows}</b> squares<br><b>${+(map.cols * map.ft).toFixed(2)} × ${+(map.rows * map.ft).toFixed(2)} ${map.unit}</b> (${map.ft} ${map.unit} per square)<br>Square size: <b>${map.px} px</b><br>Tracker export: <b>${tw} × ${th} px</b><br>Base terrain: <b>${TERRAINS[map.base].name}</b>`;
}

/* ---------- keyboard ---------- */
const KEYS = {
  b: 'brush',
  c: 'cell',
  r: 'rect',
  f: 'fill',
  e: 'eraser',
  i: 'pick',
  m: 'measure',
  h: 'pan',
  w: 'wall',
  o: 'room',
  d: 'door',
  t: 'stairs',
  x: 'xstruct',
  s: 'stamp',
  a: 'scatter',
  v: 'select',
  l: 'label',
  u: 'roof',
  g: 'height'
};
addEventListener('keydown', e => {
  if (
    e.target.matches('input[type=text],input[type=number],input.name,select') ||
    document.querySelector('dialog[open]')
  )
    return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === 'y') {
    e.preventDefault();
    redo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === 's') {
    e.preventDefault();
    saveNow();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === 'd' && selObj !== null) {
    e.preventDefault();
    pushUndo();
    const o = { ...map.struct.objects[selObj] };
    o.x += 0.5;
    o.y += 0.5;
    map.struct.objects.push(o);
    selObj = map.struct.objects.length - 1;
    structChanged();
    drawOverlay();
    return;
  }
  if (
    !e.ctrlKey &&
    !e.metaKey &&
    (k === ',' || k === '.' || k === '-' || k === '=' || k === '+' || k === 'delete' || k === 'backspace')
  ) {
    if (selObj !== null && map.struct.objects[selObj]) {
      e.preventDefault();
      pushUndo();
      const o = map.struct.objects[selObj];
      if (k === ',' || k === '.') o.r = +(o.r + ((k === '.' ? 1 : -1) * Math.PI) / 12).toFixed(3);
      else if (k === '-' || k === '=' || k === '+') o.s = +clamp(o.s + (k === '-' ? -0.1 : 0.1), 0.2, 5).toFixed(3);
      else {
        map.struct.objects.splice(selObj, 1);
        selObj = null;
      }
      structChanged();
      drawOverlay();
      showSel();
      return;
    }
    if (tool === 'stamp' && (k === ',' || k === '.')) {
      preRot += ((k === '.' ? 1 : -1) * Math.PI) / 12;
      drawOverlay();
      return;
    }
  }
  if (selObj !== null && map.struct.objects[selObj] && /^arrow/.test(k) && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const o = map.struct.objects[selObj],
      st = e.shiftKey ? 1 : $('objSnap').checked ? 0.5 : 0.1,
      dx = k === 'arrowleft' ? -st : k === 'arrowright' ? st : 0,
      dy = k === 'arrowup' ? -st : k === 'arrowdown' ? st : 0;
    if (!e.repeat) pushUndo();
    o.x = +clamp(o.x + dx, 0, map.cols).toFixed(3);
    o.y = +clamp(o.y + dy, 0, map.rows).toFixed(3);
    structChanged();
    drawOverlay();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'Space') {
    spaceDown = true;
    view.style.cursor = 'grab';
    e.preventDefault();
    return;
  }
  if (KEYS[k]) {
    setTool(KEYS[k]);
    return;
  }
  if (/^Digit[0-9]$/.test(e.code)) {
    const n = +e.code.slice(5),
      pos = e.shiftKey ? 9 + n : n === 0 ? 9 : n - 1;
    if (n > 0 || !e.shiftKey) {
      if (DISPLAY[pos] !== undefined) selectTerrain(DISPLAY[pos]);
    }
    return;
  }
  if (k === '[' || k === ']') {
    const s = $('brushSize');
    s.value = clamp(+s.value + (k === ']' ? 0.25 : -0.25), +s.min, +s.max);
    syncOutputs();
    drawOverlay();
    return;
  }
  if (k === 'n') {
    toggleNight();
    return;
  }
  if (k === 'k') {
    toggleTop();
    return;
  }
  if (k === 'g') {
    $('gridOn').checked = !$('gridOn').checked;
    drawOverlay();
    return;
  }
  if (k === 'enter' && roomDraft) {
    finishRoomDraft();
    return;
  }
  if (k === 'escape' || k === 'enter') {
    curveDraft = null;
    cstairDraft = null;
    ruler = null;
    rectDrag = null;
    drag = null;
    wallDraft = null;
    roomDraft = null;
    circleDrag = null;
    selObj = null;
    drawOverlay();
  }
});
addEventListener('keyup', e => {
  if (e.code === 'Space') {
    spaceDown = false;
    view.style.cursor = tool === 'pan' ? 'grab' : '';
  }
});
addEventListener('resize', () => {
  resizeOverlay();
});
