/* ---------- terrain definitions ----------
   prio: stacking order (higher sits on top and blends over lower)
   soft: multiplier on the map's edge blending
   edge: optional inner edge effect {color, w (cells)}          */
const TERRAINS = [
  {
    key: 'grass',
    name: 'Grass',
    prio: 3,
    soft: 1,
    ramp: ['#1d3616', '#2b4f1f', '#3b6628', '#4d7a31', '#64913d', '#80a952']
  },
  {
    key: 'dirt',
    name: 'Dirt',
    prio: 1,
    soft: 1,
    ramp: ['#36261a', '#4c3523', '#634630', '#78573b', '#8d6a49', '#a4805b']
  },
  {
    key: 'sand',
    name: 'Sand',
    prio: 2,
    soft: 1,
    ramp: ['#7f6a40', '#9b8152', '#b59862', '#c8ab74', '#d6bd8a', '#e5d2a4']
  },
  {
    key: 'rock',
    name: 'Cave rock',
    prio: 0,
    soft: 0.4,
    tile: 8,
    ramp: ['#1f2023', '#2c2d31', '#3a3c40', '#494b50', '#5a5c62', '#6e7076'],
    edge: { color: 'rgba(0,0,0,.6)', w: 0.14 }
  },
  {
    key: 'snow',
    name: 'Snow',
    prio: 4,
    soft: 1,
    ramp: ['#97a9b9', '#b0c0ce', '#c5d3de', '#d7e2eb', '#e7eef4', '#f5f8fb']
  },
  {
    key: 'water',
    name: 'Water',
    prio: 5,
    soft: 1,
    ramp: ['#0c2638', '#11344b', '#16435e', '#1d5473', '#296889', '#3b7f9f'],
    edge: { color: 'rgba(150,205,220,.55)', w: 0.38 }
  },
  {
    key: 'lava',
    name: 'Lava',
    prio: 6,
    soft: 0.8,
    tile: 8,
    ramp: ['#2c0a04', '#5c1306', '#972309', '#d1450e', '#ef7619', '#ffb54a'],
    edge: { color: 'rgba(28,8,4,.85)', w: 0.22 }
  },
  {
    key: 'cobble',
    name: 'Cobbles',
    prio: 7,
    soft: 0.03,
    ramp: ['#262628', '#383736', '#4b4845', '#5e5a55', '#736e67', '#89837a'],
    edge: { color: 'rgba(8,6,4,.65)', w: 0.1 }
  },
  {
    key: 'flag',
    name: 'Flagstone',
    prio: 8,
    soft: 0.03,
    ramp: ['#292722', '#3b3832', '#504b43', '#666056', '#7c7469', '#938a7c'],
    edge: { color: 'rgba(8,6,4,.65)', w: 0.1 }
  },
  {
    key: 'wood',
    name: 'Wood planks',
    prio: 9,
    soft: 0.02,
    ramp: ['#2a190d', '#3e2614', '#54341c', '#6a4325', '#81542e', '#99673a'],
    edge: { color: 'rgba(14,7,2,.75)', w: 0.08 }
  },
  // added later: indices must stay stable because saved maps store them
  {
    key: 'lrock',
    name: 'Light rock',
    prio: 0.5,
    soft: 0.4,
    tile: 8,
    ramp: ['#4b4842', '#5f5b54', '#746f67', '#8a847a', '#a19a8f', '#bab3a7'],
    edge: { color: 'rgba(20,16,12,.5)', w: 0.14 }
  },
  {
    key: 'forest',
    name: 'Forest',
    prio: 4.4,
    soft: 0.3,
    ramp: ['#0e1c0b', '#1a3014', '#27461d', '#365c26', '#4b7531', '#689442']
  },
  {
    key: 'pine',
    name: 'Pine forest',
    prio: 4.6,
    soft: 0.3,
    ramp: ['#0a1812', '#11271c', '#1a3927', '#254c32', '#336240', '#497b51']
  },
  // Japan pack
  {
    key: 'tatami',
    name: 'Tatami',
    prio: 9.6,
    soft: 0.02,
    ramp: ['#3e3f20', '#5a5a2c', '#76743c', '#8f8c4f', '#a8a466', '#bfbb84'],
    edge: { color: 'rgba(14,10,4,.75)', w: 0.08 }
  },
  {
    key: 'gravel',
    name: 'Raked gravel',
    prio: 2.5,
    soft: 0.15,
    ramp: ['#6f6e68', '#87867f', '#9e9d96', '#b4b3ac', '#c8c7c1', '#dbdad5']
  },
  {
    key: 'moss',
    name: 'Moss',
    prio: 3.2,
    soft: 1,
    ramp: ['#1c3013', '#294619', '#375d20', '#467329', '#588833', '#6f9e42']
  },
  {
    key: 'engawa',
    name: 'Light planks',
    prio: 9.2,
    soft: 0.02,
    ppc: 3,
    gen: 'wood',
    ramp: ['#3a2a1a', '#5a4128', '#7a5a38', '#94714a', '#ad8a5e', '#c4a477'],
    edge: { color: 'rgba(14,7,2,.7)', w: 0.07 }
  },
  // Underdark & caverns pack
  {
    key: 'wetrock',
    name: 'Wet cave rock',
    prio: 0.3,
    soft: 0.4,
    tile: 8,
    gen: 'wetrock',
    ramp: ['#15171a', '#22252a', '#30343a', '#40454c', '#535960', '#6b7179'],
    edge: { color: 'rgba(0,0,0,.6)', w: 0.14 }
  },
  {
    key: 'crystal',
    name: 'Crystal floor',
    prio: 1.5,
    soft: 0.3,
    gen: 'crystal',
    glow: '#7fe3ff',
    ramp: ['#0d1424', '#16223a', '#22355a', '#33507f', '#5a86b8', '#a6e4ff']
  },
  {
    key: 'cavemud',
    name: 'Cave mud',
    prio: 1.2,
    soft: 1,
    gen: 'mud',
    ramp: ['#1e160f', '#2e2117', '#3f2e20', '#51402c', '#665238', '#7d6747']
  },
  {
    key: 'biomoss',
    name: 'Glowing moss',
    prio: 3.3,
    soft: 1,
    gen: 'moss',
    glow: '#5effc0',
    ramp: ['#06201e', '#0b322c', '#12483c', '#1d6450', '#2f8c6c', '#5ad3a0']
  },
  // Jungle & coast pack
  {
    key: 'jungle',
    name: 'Jungle floor',
    prio: 3.5,
    soft: 1,
    gen: 'jungle',
    ramp: ['#0c1a0a', '#15290f', '#203a15', '#2d4e1c', '#3e6626', '#578335']
  },
  {
    key: 'beach',
    name: 'Beach sand',
    prio: 2.1,
    soft: 1,
    gen: 'beach',
    ramp: ['#a99470', '#c2ad86', '#d6c39c', '#e4d3ae', '#eee1c2', '#f7efdc']
  },
  {
    key: 'reef',
    name: 'Shallow reef',
    prio: 5.05,
    soft: 1,
    gen: 'reef',
    ramp: ['#0e4a5c', '#126275', '#177b8c', '#2496a3', '#3bb2b6', '#6ad0c8'],
    edge: { color: 'rgba(235,250,250,.6)', w: 0.3 }
  },
  {
    key: 'mangrove',
    name: 'Mangrove mud',
    prio: 1.3,
    soft: 1,
    gen: 'mud',
    ramp: ['#141a10', '#1f2717', '#2c3620', '#3a462a', '#4c5935', '#626f43']
  },
  // Ships & docks pack
  {
    key: 'deck',
    name: 'Ship deck',
    prio: 9.3,
    soft: 0.02,
    ppc: 3,
    gen: 'wood',
    ramp: ['#2e1c0c', '#4a2f16', '#664220', '#82552b', '#9c6a38', '#b58148'],
    edge: { color: 'rgba(10,5,2,.75)', w: 0.08 }
  },
  {
    key: 'pier',
    name: 'Pier boards',
    prio: 9.25,
    soft: 0.02,
    gen: 'pier',
    ramp: ['#121212', '#353431', '#504d48', '#6a665f', '#848077', '#a09a90'],
    edge: { color: 'rgba(5,5,5,.7)', w: 0.08 }
  },
  {
    key: 'quay',
    name: 'Quay stone',
    prio: 8.5,
    soft: 0.05,
    gen: 'quay',
    ramp: ['#22242a', '#36383d', '#4a4d52', '#606368', '#777a7f', '#919499'],
    edge: { color: 'rgba(5,5,8,.65)', w: 0.1 }
  },
  {
    key: 'brass',
    name: 'Brass plate',
    prio: 9.2,
    soft: 0.02,
    gen: 'plate',
    ramp: ['#1c1206', '#3e2a0e', '#6a4a18', '#9a7228', '#c49a40', '#ead07a'],
    edge: { color: 'rgba(8,5,2,.75)', w: 0.08 }
  },
  {
    key: 'ironplate',
    name: 'Riveted iron',
    prio: 9.15,
    soft: 0.02,
    gen: 'plate',
    ramp: ['#0e1013', '#22262c', '#363c44', '#4c535d', '#646c77', '#848c97'],
    edge: { color: 'rgba(4,4,6,.75)', w: 0.08 }
  },
  {
    key: 'grating',
    name: 'Iron grating',
    prio: 9.1,
    soft: 0.02,
    gen: 'grate',
    ramp: ['#060708', '#1c1e22', '#33363c', '#4a4e55', '#62666e', '#80848c'],
    edge: { color: 'rgba(4,4,6,.75)', w: 0.08 }
  },
  {
    key: 'soot',
    name: 'Sooty cobbles',
    prio: 8.4,
    soft: 0.1,
    gen: 'cobble',
    ramp: ['#121110', '#1d1b19', '#292623', '#36322e', '#45403a', '#55504a']
  },
  {
    key: 'deepwater',
    name: 'Deep water',
    prio: 5.1,
    soft: 1,
    gen: 'water',
    ramp: ['#03101a', '#051823', '#08202f', '#0c2a3c', '#11364b', '#18445c']
  }
];
// panel order and shortcuts (1–9, 0, then Shift+1…)
const DISPLAY = [
  'grass',
  'forest',
  'pine',
  'dirt',
  'sand',
  'rock',
  'lrock',
  'snow',
  'water',
  'deepwater',
  'lava',
  'cobble',
  'flag',
  'wood',
  'tatami',
  'engawa',
  'gravel',
  'moss',
  'wetrock',
  'crystal',
  'cavemud',
  'biomoss',
  'jungle',
  'beach',
  'reef',
  'mangrove',
  'deck',
  'pier',
  'quay',
  'brass',
  'ironplate',
  'grating',
  'soot'
].map(k => TERRAINS.findIndex(t => t.key === k));
/* ---------- palette: colour ramps generated from a base colour ---------- */
function hexToHsl(hex) {
  let [r, g, b] = hexRgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b),
    mn = Math.min(r, g, b),
    l = (mx + mn) / 2;
  let h = 0,
    s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const f = n => {
    const k = (n + h / 30) % 12,
      a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}
function rampFromHex(hex) {
  const [h, s, l] = hexToHsl(hex),
    out = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    out.push(
      hslToHex(
        (h + (0.6 - t) * 12 + 360) % 360,
        clamp(s * (0.62 + 0.24 * Math.sin(t * Math.PI)), 0, 1),
        clamp(l + (t - 0.62) * 0.62, 0.03, 0.96)
      )
    );
  }
  return out;
}
const PALETTE = [
  [
    'Greens',
    [
      ['Lush', '#4d7a31'],
      ['Spring', '#6c9a3a'],
      ['Olive', '#6f7436'],
      ['Sage', '#7d8f6a'],
      ['Jungle', '#2f6b3a'],
      ['Moss', '#557a3a'],
      ['Teal', '#3a7a64']
    ]
  ],
  [
    'Seasons',
    [
      ['Autumn', '#b3632a'],
      ['Gold leaf', '#c59a2c'],
      ['Russet', '#8a3f22'],
      ['Dry', '#a89a5a'],
      ['Snow', '#dfe7ee'],
      ['Frost', '#a9c3d3']
    ]
  ],
  [
    'Earth',
    [
      ['Dirt', '#78573b'],
      ['Clay', '#9a5b3c'],
      ['Ochre', '#b08a45'],
      ['Sand', '#c8ab74'],
      ['Red desert', '#a5583a'],
      ['Peat', '#4a3a2c']
    ]
  ],
  [
    'Stone',
    [
      ['Grey', '#6e7076'],
      ['Warm grey', '#847c70'],
      ['Slate', '#4f5a66'],
      ['Marble', '#b9b5ad'],
      ['Basalt', '#3a3a3e'],
      ['Sandstone', '#b89a72']
    ]
  ],
  [
    'Water',
    [
      ['River', '#1d5473'],
      ['Sea', '#1f4f8a'],
      ['Swamp', '#3f5a3a'],
      ['Glacier', '#8fb8c8'],
      ['Murky', '#3d4a3c']
    ]
  ],
  [
    'Built',
    [
      ['Oak', '#6a4325'],
      ['Dark wood', '#3e2a1c'],
      ['Pale wood', '#a98458'],
      ['Brick', '#8a3f30'],
      ['Terracotta', '#b5603e']
    ]
  ],
  [
    'Fantastic',
    [
      ['Lava', '#d1450e'],
      ['Arcane', '#6b4bc8'],
      ['Blight', '#6b7a2a'],
      ['Ethereal', '#7fd1c8'],
      ['Crimson', '#8a1d2a'],
      ['Gold', '#c9a23a'],
      ['Ash', '#5b5853'],
      ['Bone', '#d6cbb0']
    ]
  ]
];

const BUILTIN = TERRAINS.length;
// Recoloured terrains live in a fixed slot range so new built-in terrains never shift them.
// Saves made before this used slot 13 onwards (OLD_CUSTOM_BASE) and are converted when opened.
const CUSTOM_BASE = 64,
  OLD_CUSTOM_BASE = 13;
for (let i = BUILTIN; i < CUSTOM_BASE; i++) TERRAINS[i] = { ...TERRAINS[0], key: '_' + i, name: '', hole: true };
// per-map recoloured terrains live after the built-ins; indices stay stable (deleted ones leave a hole)
function customDef(c, j) {
  const bi = TERRAINS.findIndex((t, i) => i < BUILTIN && t.key === c.gen),
    b = TERRAINS[bi],
    ramp = rampFromHex(c.hex);
  const pname = PALETTE.flatMap(g => g[1]).find(x => x[1] === c.hex);
  return {
    ...b,
    key: 'c:' + j,
    gen: c.gen,
    hex: c.hex,
    baseIdx: bi,
    name: `${b.name} · ${pname ? pname[0] : c.hex}`,
    prio: b.prio + 0.001 * (j + 1),
    ramp,
    rgb: ramp.map(hexRgb),
    custom: true,
    edge:
      b.edge && b.key === 'water'
        ? {
            ...b.edge,
            color: (() => {
              const [r, g, bb] = hexRgb(ramp[5]);
              return `rgba(${r},${g},${bb},.55)`;
            })()
          }
        : b.edge
  };
}
function applyCustoms() {
  TERRAINS.length = CUSTOM_BASE;
  (map.custom || []).forEach((c, j) =>
    TERRAINS.push(c ? customDef(c, j) : { ...TERRAINS[0], key: 'c:' + j, hole: true })
  );
}
const keyLabel = pos => (pos < 10 ? String((pos + 1) % 10) : '⇧' + (pos - 9));
TERRAINS.forEach(t => (t.rgb = t.ramp.map(hexRgb)));
