/* ---------- storage (IndexedDB) ---------- */
let db = null;
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('map-drawing', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('maps', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function idb(mode, fn) {
  return new Promise((res, rej) => {
    const tx = db.transaction('maps', mode),
      st = tx.objectStore('maps');
    const r = fn(st);
    tx.oncomplete = () => res(r && r.result);
    tx.onerror = () => rej(tx.error);
  });
}
const dbPut = rec => idb('readwrite', st => st.put(rec));
const dbGet = id => idb('readonly', st => st.get(id));
const dbAll = () => idb('readonly', st => st.getAll());
const dbDel = id => idb('readwrite', st => st.delete(id));
function lsSet(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch (e) {}
}
function lsGet(k) {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
}

function thumbnail() {
  const w = 220,
    h = Math.max(1, Math.round((w * map.rows) / map.cols));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  for (const l of map.layers)
    if (l.visible) {
      const lc = layerCanvases(l);
      x.globalAlpha = l.opacity;
      x.drawImage(lc.t, 0, 0, w, h);
      if (l === map.layers[0]) x.drawImage(reliefCanvas, 0, 0, w, h);
      x.drawImage(lc.s, 0, 0, w, h);
    }
  x.globalAlpha = 1;
  return c.toDataURL('image/jpeg', 0.75);
}
const extraLayers = m =>
  (m.layers || [])
    .slice(1)
    .map(l => ({
      id: l.id,
      name: l.name,
      visible: l.visible,
      opacity: l.opacity,
      dm: l.dm,
      labels: l.labels,
      struct: l.struct
    }));
function toRecord(m, withThumb) {
  return {
    id: m.id,
    name: m.name,
    cols: m.cols,
    rows: m.rows,
    ft: m.ft,
    seed: m.seed,
    soft: m.soft,
    base: m.base,
    R,
    cb: CUSTOM_BASE,
    labels: m.layers ? m.layers[0].labels : m.labels,
    struct: m.layers ? m.layers[0].struct : m.struct,
    layers: extraLayers(m),
    activeLayer: m.activeLayer,
    custom: m.custom || [],
    grid: m.grid,
    px: m.px,
    unit: m.unit,
    hcols: m.hcols,
    hrows: m.hrows,
    tod: m.tod || 'day',
    nightStr: m.nightStr,
    lightRad: m.lightRad,
    occlude: m.occlude !== false,
    season: m.season || 'summer',
    showTop: m.showTop !== false,
    rules: m.rules === '5e' ? '5e' : '35',
    hgt: hasHeights(m) ? m.hgt.slice() : null,
    relief: m.relief === 'contour' ? 'contour' : 'cliffs',
    created: m.created || Date.now(),
    updated: Date.now(),
    thumb: withThumb ? thumbnail() : m.thumb
  };
}
let saveTimer = 0;
function touchSave() {
  dirtySave = true;
  $('stSave').textContent = 'Unsaved changes…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 1500);
}
async function saveNow() {
  clearTimeout(saveTimer);
  if (!db || !map) return;
  try {
    const rec = toRecord(map, true);
    map.thumb = rec.thumb;
    await dbPut(rec);
    dirtySave = false;
    $('stSave').textContent = 'Saved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    lsSet('md-last', map.id);
  } catch (err) {
    $('stSave').textContent = 'Save failed: ' + err.message;
  }
}
function fromRecord(r) {
  const m = fromRecord0(r),
    n = m.cols * R * m.rows * R;
  return migrateCustom(
    ensureLayers(
      m,
      (r.layers || [])
        .filter(l => l && l.labels && l.labels.length === n)
        .map(l => ({
          id: String(l.id || uid()),
          name: String(l.name || 'Layer').slice(0, 40),
          visible: l.visible !== false,
          opacity: clamp(+l.opacity || 1, 0.05, 1),
          dm: !!l.dm,
          labels: new Uint8Array(l.labels),
          struct: cleanStruct(l.struct)
        })),
      r.activeLayer
    ),
    r.cb ?? OLD_CUSTOM_BASE
  );
}
function migrateCustom(m, oldBase) {
  const n = (m.custom || []).length;
  if (oldBase === CUSTOM_BASE || !n) return m;
  for (const l of m.layers) {
    const lab = l.labels;
    for (let i = 0; i < lab.length; i++) {
      const v = lab[i];
      if (v >= oldBase && v < oldBase + n) lab[i] = CUSTOM_BASE + v - oldBase;
    }
  }
  if (m.base >= oldBase && m.base < oldBase + n) m.base = CUSTOM_BASE + m.base - oldBase;
  return m;
}
function fromRecord0(r) {
  return gridInit({
    rules: r.rules === '5e' ? '5e' : '35',
    showTop: r.showTop !== false,
    season: r.season,
    occlude: r.occlude !== false,
    tod: TOD[r.tod] ? r.tod : r.night ? 'night' : 'day',
    nightStr: r.nightStr,
    lightRad: r.lightRad,
    grid: r.grid,
    px: r.px,
    unit: r.unit,
    hcols: r.hcols | 0,
    hrows: r.hrows | 0,
    id: r.id,
    name: r.name,
    cols: r.cols,
    rows: r.rows,
    ft: r.ft,
    seed: r.seed,
    soft: r.soft ?? 0.6,
    base: r.base,
    labels: new Uint8Array(r.labels),
    struct: cleanStruct(r.struct),
    custom: cleanCustom(r.custom),
    hgt: r.hgt && r.hgt.length === r.cols * r.rows ? new Int8Array(r.hgt) : null,
    relief: r.relief === 'contour' ? 'contour' : 'cliffs',
    created: r.created,
    thumb: r.thumb
  });
}

function openMap(m) {
  map = gridInit(m);
  if (!map.layers) ensureLayers(map);
  map.custom = map.custom || [];
  LV.forEach(c => {
    c.t.remove();
    c.s.remove();
  });
  LV.clear();
  {
    const al = map.layers.find(l => l.id === map.activeLayer) || map.layers[0];
    map.labels = al.labels;
    map.struct = al.struct;
  }
  $('nightStr').value = map.nightStr ?? 0.7;
  $('lightRad').value = map.lightRad ?? 1;
  $('occlude').checked = map.occlude !== false;
  $('lightRules').value = map.rules === '5e' ? '5e' : '35';
  $('reliefSel').value = map.relief === 'contour' ? 'contour' : 'cliffs';
  applyCustoms();
  buildCustomPanel();
  undoStack = [];
  redoStack = [];
  updUndo();
  texCache.clear();
  if (curTerrain >= TERRAINS.length || TERRAINS[curTerrain].hole) selectTerrain(DISPLAY[0]);
  else selectTerrain(curTerrain);
  $('mapName').value = map.name;
  $('soft').value = map.soft;
  syncOutputs();
  updateInfo();
  applyTop();
  SEASON = map.season || 'summer';
  $('seasonSel').value = SEASON;
  buildStampPanel();
  map.tod = map.tod || (map.night ? 'night' : 'day');
  setSun(map.tod);
  setupCanvas();
  buildLayerPanel();
  fit();
  lsSet('md-last', map.id);
  $('stSave').textContent = 'Saved';
}
window.addEventListener('beforeunload', () => {
  if (dirtySave) saveNow();
});

/* ---------- dialogs ---------- */
DISPLAY.forEach(i => {
  const o = document.createElement('option');
  o.value = i;
  o.textContent = TERRAINS[i].name;
  $('nBase').appendChild(o);
});
let dlgEdit = false;
function newHint() {
  const g = $('nGrid').value,
    hex = g !== 'square',
    c = +$('nCols').value || 0,
    r = +$('nRows').value || 0,
    f = +$('nFt').value || 0,
    px = +$('nPx').value || 0,
    u = $('nUnit').value || 'ft';
  const w = hex ? 'hexes' : 'squares';
  $('nColsL').textContent = `Width (${w})`;
  $('nRowsL').textContent = `Height (${w})`;
  $('nPxL').textContent = hex ? 'Hex size (px, centre to centre)' : 'Square size (px)';
  $('nFtL').textContent = hex ? 'Distance per hex' : 'Distance per square';
  const e = hex ? hexExtent(g, c, r) : { w: c, h: r };
  $('nHint').innerHTML =
    (hex
      ? `Hex size = distance between the centres of two neighbouring hexes (flat side to flat side), the same value most VTTs and trackers call "grid size".<br>`
      : '') +
    `Tracker image: <b>${Math.round(e.w * px)} × ${Math.round(e.h * px)} px</b>` +
    (hex ? '' : ` · ${+(c * f).toFixed(2)} × ${+(r * f).toFixed(2)} ${u}`);
}
['nCols', 'nRows', 'nFt', 'nPx', 'nUnit', 'nGrid'].forEach(id => ($(id).oninput = $(id).onchange = newHint));
$('nGrid').addEventListener('change', () => {
  if (dlgEdit) return;
  const hex = $('nGrid').value !== 'square';
  if (hex && $('nUnit').value === 'ft' && +$('nFt').value === 5) {
    $('nFt').value = 6;
    $('nUnit').value = 'miles';
  }
  if (!hex && $('nUnit').value === 'miles') {
    $('nFt').value = 5;
    $('nUnit').value = 'ft';
  }
  newHint();
});
function openMapDialog(edit) {
  dlgEdit = edit;
  $('nTitle').textContent = edit ? 'Map settings' : 'New map';
  $('nOk').textContent = edit ? 'Save' : 'Create';
  for (const id of ['nGrid', 'nCols', 'nRows', 'nBase']) $(id).disabled = edit;
  if (edit) {
    $('nName').value = map.name;
    $('nGrid').value = map.grid;
    $('nCols').value = isHex(map) ? map.hcols : map.cols;
    $('nRows').value = isHex(map) ? map.hrows : map.rows;
    $('nPx').value = map.px;
    $('nFt').value = map.ft;
    $('nUnit').value = map.unit;
    $('nBase').value = map.base;
  } else {
    $('nName').value = 'Untitled map';
    for (const id of ['nGrid', 'nCols', 'nRows', 'nPx', 'nFt', 'nUnit'])
      $(id).value = lsGet('md-new-' + id) ?? $(id).defaultValue ?? $(id).value;
    if (!$('nGrid').value) $('nGrid').value = 'square';
  }
  newHint();
  $('dlgNew').showModal();
}
$('bNew').onclick = () => openMapDialog(false);
$('bMapSet').onclick = () => openMapDialog(true);
$('nCancel').onclick = () => $('dlgNew').close();
$('nOk').onclick = async () => {
  const px = clamp(Math.round(+$('nPx').value) || 40, 8, 400),
    ft = Math.max(0.01, +$('nFt').value || 5),
    unit = ($('nUnit').value.trim() || 'ft').slice(0, 12),
    name = $('nName').value.trim() || 'Untitled map';
  if (dlgEdit) {
    map.name = name;
    map.px = px;
    map.ft = ft;
    map.unit = unit;
    $('mapName').value = name;
    updateInfo();
    applyView();
    touchSave();
    $('dlgNew').close();
    return;
  }
  const grid = $('nGrid').value,
    cols = clamp(Math.round(+$('nCols').value) || 30, 2, 200),
    rows = clamp(Math.round(+$('nRows').value) || 20, 2, 200);
  for (const id of ['nGrid', 'nCols', 'nRows', 'nPx', 'nFt', 'nUnit']) lsSet('md-new-' + id, $(id).value);
  await saveNow();
  openMap(blankMap(name, cols, rows, ft, +$('nBase').value, { grid, px, unit }));
  await saveNow();
  $('dlgNew').close();
};

async function showLibrary() {
  await saveNow();
  const list = (await dbAll()).sort((a, b) => b.updated - a.updated),
    box = $('libList');
  box.innerHTML = '';
  if (!list.length) box.innerHTML = '<div class="hint">No saved maps yet.</div>';
  for (const r of list) {
    const c = document.createElement('div');
    c.className = 'card' + (r.id === map.id ? ' cur' : '');
    c.innerHTML = `<img alt=""><div class="meta"><b></b><small>${r.hcols ? `${r.hcols}×${r.hrows} hex` : `${r.cols}×${r.rows} sq`} · ${r.px || 40} px · ${new Date(r.updated).toLocaleDateString()}</small></div><div class="acts"><button data-a="open">Open</button><button data-a="dup">Copy</button><button data-a="ren">Rename</button><button data-a="del">Delete</button></div>`;
    c.querySelector('img').src = r.thumb || '';
    c.querySelector('b').textContent = r.name;
    const act = async a => {
      if (a === 'open') {
        openMap(fromRecord(r));
        $('dlgLib').close();
      }
      if (a === 'dup') {
        const m = fromRecord(r);
        m.id = uid();
        m.name = r.name + ' (copy)';
        m.created = Date.now();
        await dbPut({ ...toRecord(m, false), thumb: r.thumb });
        showLibrary();
      }
      if (a === 'ren') {
        const n = prompt('Rename map', r.name);
        if (n && n.trim()) {
          if (r.id === map.id) {
            map.name = n.trim();
            $('mapName').value = map.name;
            await saveNow();
          } else {
            r.name = n.trim();
            await dbPut(r);
          }
          showLibrary();
        }
      }
      if (a === 'del') {
        if (r.id === map.id) {
          alert('This map is open. Open another map first.');
          return;
        }
        if (confirm(`Delete "${r.name}"? This cannot be undone.`)) {
          await dbDel(r.id);
          showLibrary();
        }
      }
    };
    c.querySelectorAll('button').forEach(b => (b.onclick = () => act(b.dataset.a)));
    c.querySelector('img').onclick = () => act('open');
    box.appendChild(c);
  }
  if (!$('dlgLib').open) $('dlgLib').showModal();
}
$('bLib').onclick = showLibrary;
$('libClose').onclick = () => $('dlgLib').close();
$('libBackup').onclick = async () => {
  const list = await dbAll();
  const out = { format: 'map-drawing-library/1', maps: list.map(projectJSON) };
  download(
    new Blob([JSON.stringify(out)], { type: 'application/json' }),
    `map-drawing-library_${new Date().toISOString().slice(0, 10)}.json`
  );
};

function cleanCustom(a) {
  return (Array.isArray(a) ? a : []).map(c =>
    c && /^#[0-9a-f]{6}$/i.test(c.hex) && TERRAINS.some((t, i) => i < BUILTIN && t.key === c.gen)
      ? { gen: c.gen, hex: c.hex.toLowerCase() }
      : null
  );
}
function cleanStruct(o) {
  const s = emptyStruct();
  if (!o) return s;
  const num = v => +v || 0;
  for (const w of o.walls || [])
    s.walls.push({
      x1: num(w.x1),
      y1: num(w.y1),
      x2: num(w.x2),
      y2: num(w.y2),
      mat: WALLMATS[w.mat] ? w.mat : 'stone',
      th: clamp(num(w.th) || 0.25, 0.05, 2)
    });
  for (const d of o.doors || [])
    s.doors.push({
      x: num(d.x) | 0,
      y: num(d.y) | 0,
      o: d.o === 'v' ? 'v' : 'h',
      type: ['door', 'double', 'secret', 'portcullis', 'window', 'opening', 'shoji'].includes(d.type) ? d.type : 'door'
    });
  for (const b of o.objects || [])
    if (STAMPS[b.t])
      s.objects.push({
        t: b.t,
        x: num(b.x),
        y: num(b.y),
        r: num(b.r),
        s: clamp(num(b.s) || 1, 0.2, 5),
        v: num(b.v) | 0,
        f: b.f ? 1 : 0,
        ...(/^#[0-9a-f]{6}$/i.test(b.c || '') ? { c: b.c } : {}),
        ...(LIGHT_PRESETS[b.lp] ? { lp: b.lp } : {}),
        ...(b.off ? { off: 1 } : {})
      });
  for (const l of o.labels || [])
    if (l && String(l.text || '').trim())
      s.labels.push({
        x: num(l.x),
        y: num(l.y),
        text: String(l.text).slice(0, 80),
        size: clamp(num(l.size) || 0.5, 0.15, 3)
      });
  for (const r of o.roofs || [])
    s.roofs.push({
      x0: num(r.x0),
      y0: num(r.y0),
      x1: num(r.x1),
      y1: num(r.y1),
      mat: ROOFMATS[r.mat] ? r.mat : 'tiles',
      ...(/^#[0-9a-f]{6}$/i.test(r.c || '') ? { c: r.c } : {})
    });
  for (const t of o.stairs || []) {
    const a = t.arc,
      arc =
        a && [a.cx, a.cy, a.r0, a.r1, a.a0, a.a1].every(v => isFinite(+v)) && +a.r1 > +a.r0 && +a.r0 >= 0
          ? {
              cx: num(a.cx),
              cy: num(a.cy),
              r0: num(a.r0),
              r1: num(a.r1),
              a0: num(a.a0),
              a1: clamp(num(a.a1), num(a.a0) - 63, num(a.a0) + 63)
            }
          : null;
    if ((t.kind === 'grand' || t.kind === 'half') && DIRV[t.dir] && isFinite(+t.fx) && isFinite(+t.fy)) {
      const opt = {};
      for (const k of STAIR_OPTS[t.kind])
        if (t.opt && t.opt[k] != null)
          opt[k] = k === 'turnSide' ? (t.opt[k] === 'l' ? 'l' : 'r') : clamp(num(t.opt[k]), 0, 360);
      s.stairs.push(
        compositeBBox({
          kind: t.kind,
          fx: num(t.fx),
          fy: num(t.fy),
          dir: t.dir,
          len: clamp(num(t.len) || 3, 1, 40),
          opt,
          h0: clamp(num(t.h0), -40, 200),
          h1: clamp(num(t.h1), -40, 200)
        })
      );
      continue;
    }
    s.stairs.push({
      x0: num(t.x0),
      y0: num(t.y0),
      x1: num(t.x1),
      y1: num(t.y1),
      dir: 'nsew'.includes(t.dir) && t.dir ? t.dir : 's',
      ...(arc ? { arc, h0: clamp(num(t.h0), -40, 200), h1: clamp(num(t.h1), -40, 200) } : {})
    });
  }
  return s;
}
function projectJSON(m) {
  return {
    format: 'map-drawing/1',
    name: m.name,
    cols: m.cols,
    rows: m.rows,
    ft: m.ft,
    seed: m.seed,
    soft: m.soft,
    base: TERRAINS[m.base].key,
    R,
    terrains: TERRAINS.map(t => t.key),
    custom: m.custom || [],
    grid: m.grid,
    px: m.px,
    unit: m.unit,
    hcols: m.hcols,
    hrows: m.hrows,
    tod: m.tod || 'day',
    nightStr: m.nightStr,
    lightRad: m.lightRad,
    occlude: m.occlude !== false,
    season: m.season || 'summer',
    showTop: m.showTop !== false,
    rules: m.rules === '5e' ? '5e' : '35',
    struct: m.layers ? m.layers[0].struct : m.struct || emptyStruct(),
    labels: u8ToB64(new Uint8Array(m.layers ? m.layers[0].labels : m.labels)),
    hgt: hasHeights(m) ? u8ToB64(new Uint8Array(m.hgt.buffer.slice(0))) : undefined,
    relief: m.relief === 'contour' ? 'contour' : 'cliffs',
    layers: extraLayers(m).map(l => ({ ...l, labels: u8ToB64(new Uint8Array(l.labels)) }))
  };
}
function parseProject(o) {
  if (!o || o.format !== 'map-drawing/1') throw new Error('Not a Map Drawing project file');
  const cols = o.cols | 0,
    rows = o.rows | 0;
  if (cols < 1 || rows < 1 || cols > 400 || rows > 400) throw new Error('Bad map size');
  const src = b64ToU8(o.labels),
    rr = o.R | 0;
  if (src.length !== cols * rr * rows * rr) throw new Error('Terrain data is the wrong size');
  const custom = cleanCustom(o.custom);
  const remap = (o.terrains || []).map(k =>
    /^c:\d+$/.test(k)
      ? custom[+k.slice(2)]
        ? CUSTOM_BASE + +k.slice(2)
        : 0
      : Math.max(
          0,
          TERRAINS.findIndex((t, i) => i < BUILTIN && t.key === k)
        )
  );
  const decode = (sv, empty) => {
    const out = new Uint8Array(cols * R * rows * R),
      W = cols * R,
      SW = cols * rr;
    for (let y = 0; y < rows * R; y++)
      for (let x = 0; x < W; x++) {
        const v = sv[Math.floor((y * rr) / R) * SW + Math.floor((x * rr) / R)];
        out[y * W + x] = v === 255 && empty ? 255 : remap.length ? (remap[v] ?? 0) : v;
      }
    return out;
  };
  const labels = decode(src, false);
  const extras = (o.layers || [])
    .map(l => {
      try {
        const sv = b64ToU8(l.labels);
        if (sv.length !== src.length) return null;
        return {
          id: uid(),
          name: String(l.name || 'Layer').slice(0, 40),
          visible: l.visible !== false,
          opacity: clamp(+l.opacity || 1, 0.05, 1),
          dm: !!l.dm,
          labels: decode(sv, true),
          struct: cleanStruct(l.struct)
        };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
  const base = Math.max(
    0,
    TERRAINS.findIndex((t, i) => i < BUILTIN && t.key === o.base)
  );
  const grid = ['square', 'hexflat', 'hexpointy'].includes(o.grid) ? o.grid : 'square';
  if (grid !== 'square') {
    const e = hexExtent(grid, o.hcols | 0, o.hrows | 0);
    if (!(o.hcols > 0 && o.hrows > 0) || Math.ceil(e.w - 1e-6) !== cols || Math.ceil(e.h - 1e-6) !== rows)
      throw new Error('Hex grid size does not match the map');
  }
  return gridInit({
    id: uid(),
    name: String(o.name || 'Imported map'),
    cols,
    rows,
    ft: +o.ft || 5,
    seed: o.seed | 0,
    soft: +o.soft || 0.6,
    base,
    labels,
    struct: cleanStruct(o.struct),
    custom,
    created: Date.now(),
    grid,
    px: o.px,
    unit: typeof o.unit === 'string' ? o.unit.slice(0, 12) : 'ft',
    hcols: o.hcols | 0,
    hrows: o.hrows | 0,
    tod: TOD[o.tod] ? o.tod : o.night ? 'night' : 'day',
    nightStr: clamp(+o.nightStr || 0.7, 0.3, 0.95),
    lightRad: clamp(+o.lightRad || 1, 0.5, 2.5),
    occlude: o.occlude !== false,
    season: ['spring', 'summer', 'autumn', 'winter'].includes(o.season) ? o.season : 'summer',
    showTop: o.showTop !== false,
    rules: o.rules === '5e' ? '5e' : '35',
    relief: o.relief === 'contour' ? 'contour' : 'cliffs',
    hgt: (() => {
      try {
        const b = o.hgt && b64ToU8(o.hgt);
        return b && b.length === cols * rows ? new Int8Array(b.buffer.slice(0)).map(v => clamp(v, H_MIN, H_MAX)) : null;
      } catch (e) {
        return null;
      }
    })(),
    _extras: extras
  });
}
$('bImport').onclick = () => $('fileIn').click();
$('fileIn').onchange = async () => {
  const f = $('fileIn').files[0];
  $('fileIn').value = '';
  if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    const items = o.format === 'map-drawing-library/1' ? o.maps : [o];
    let last = null;
    for (const it of items) {
      const m = parseProject(it),
        ex = m._extras;
      delete m._extras;
      ensureLayers(m, ex);
      await dbPut(toRecord(m, false));
      last = m;
    }
    await saveNow();
    if (last) openMap(last);
    await saveNow();
  } catch (err) {
    alert('Import failed: ' + err.message);
  }
};

function expSettings() {
  const prof = document.querySelector('input[name=prof]:checked').value;
  const P = prof === 'tracker' ? map.px : clamp(Math.round(+$('ePx').value) || 80, 8, 400);
  return {
    prof,
    P,
    grid: prof !== 'tracker' && $('eGrid').checked,
    dm: prof === 'dm',
    labels: prof !== 'tracker' && $('eLabels').checked,
    tod: $('eTod').value,
    season: $('eSeason').value,
    top: $('eTop').checked
  };
}
const expName = s =>
  `${slug(map.name)}${s.top === false ? '_open' : ''}${s.season && s.season !== 'summer' ? '_' + s.season : ''}${s.tod && s.tod !== 'day' ? '_' + s.tod : ''}_${isHex(map) ? `hex-${map.grid === 'hexflat' ? 'flat' : 'pointy'}_${map.hcols}x${map.hrows}` : `${map.cols}x${map.rows}`}_${s.P}px${s.dm ? '_DM' : ''}.png`;
function expHint() {
  const s = expSettings();
  $('expPlayerOpts').style.opacity = s.prof !== 'tracker' ? 1 : 0.35;
  $('ePx').disabled = $('eGrid').disabled = $('eLabels').disabled = s.prof === 'tracker';
  const [ow, oh] = exportSize(map, s.P);
  $('eHint').innerHTML = `Output: <b>${ow} × ${oh} px</b> — <code>${expName(s)}</code>`;
}
document.querySelectorAll('input[name=prof]').forEach(
  r =>
    (r.onchange = () => {
      $('eLabels').checked = r.value === 'dm';
      expHint();
    })
);
$('eLabels').onchange = expHint;
$('eTod').onchange = expHint;
$('eTop').onchange = expHint;
$('eSeason').onchange = expHint;
$('ePx').oninput = expHint;
$('eGrid').onchange = expHint;
$('bExport').onclick = () => {
  const hx = isHex(map);
  $('eTrkTxt').textContent = hx
    ? `${map.px} px hexes (${map.grid === 'hexflat' ? 'flat' : 'pointy'} top)`
    : `${map.px} × ${map.px} px per square`;
  $('eTrkHint').textContent = hx
    ? `Set the tracker's hex size to ${map.px} px; the image starts on the edge of the first hex.`
    : `Set the tracker's grid to ${map.px} px; the image starts on a square corner.`;
  $('eTod').value = map.tod || 'day';
  $('eTop').checked = map.showTop !== false;
  $('eSeason').value = map.season || 'summer';
  if (!$('dlgExp').dataset.touched) $('ePx').value = Math.min(400, map.px * 2);
  expHint();
  $('dlgExp').showModal();
};
$('ePx').addEventListener('input', () => ($('dlgExp').dataset.touched = 1));
$('eCancel').onclick = () => $('dlgExp').close();
$('eOk').onclick = async () => {
  const s = expSettings();
  $('busy').classList.add('on');
  await new Promise(r => setTimeout(r, 30));
  try {
    const c = renderFull(map, s.P, s.grid, { dm: s.dm, labels: s.labels, tod: s.tod, season: s.season, top: s.top });
    c.toBlob(b => {
      download(b, expName(s));
      $('busy').classList.remove('on');
    }, 'image/png');
  } catch (err) {
    $('busy').classList.remove('on');
    alert('Export failed: ' + err.message);
  }
};
$('eJson').onclick = () =>
  download(
    new Blob([JSON.stringify(projectJSON(map))], { type: 'application/json' }),
    `${slug(map.name)}.mapdraw.json`
  );

/* ---------- boot ---------- */
(async function boot() {
  buildPacksPanel();
  buildTerrainPanel();
  applyPacks();
  buildPalette();
  setActive(null);
  rollPre();
  selectTerrain(DISPLAY[0]);
  setTool('brush');
  syncOutputs();
  resizeOverlay();
  try {
    db = await openDB();
  } catch (e) {
    $('stSave').textContent = 'Storage unavailable — use Export project to keep work';
  }
  let m = null;
  if (db) {
    const last = lsGet('md-last');
    if (last) {
      const r = await dbGet(last);
      if (r) m = fromRecord(r);
    }
    if (!m) {
      const all = await dbAll();
      if (all.length) {
        all.sort((a, b) => b.updated - a.updated);
        m = fromRecord(all[0]);
      }
    }
  }
  if (!m) m = blankMap('Untitled map', 30, 20, 5, 0, { grid: 'square', px: 40 });
  openMap(m);
  if (db) saveNow();
  window.__md = {
    toScr: (x, y) => toScr(x, y),
    layersApi: () => map.layers,
    setActiveLayer: id => setActiveLayer(id),
    get map() {
      return map;
    },
    renderFull,
    paintCells,
    paintCircle,
    floodFill,
    TERRAINS,
    structChanged,
    drawStructView
  };
})();
