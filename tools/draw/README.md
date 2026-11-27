# Map Drawing — source

The tool ships as one standalone file, `site/draw/index.html`. Its source lives here and is
joined into that file by a small build step, so the published tool stays a single offline file.

```
tools/draw/index.template.html   page markup and styles, with a /*@modules*/ marker for the script
tools/draw/src/*.js              the script, in numbered files joined in order (one shared scope)
tools/draw/build.py              writes site/draw/index.html   (--check: fail if it is out of date)
tools/draw/check.py              build is current + no duplicate top-level names
tests/draw/run.py                browser tests (Playwright); any page error fails the run
```

## Editing

1. Edit a file in `tools/draw/src/` (or the template).
2. `python3 tools/draw/build.py`
3. `python3 tools/draw/check.py && python3 tests/draw/run.py`
4. Commit the source and the rebuilt `site/draw/index.html` together.

Formatting: `npx prettier@3 --config tools/draw/.prettierrc.json --write tools/draw/src/*.js`

All files share one global scope, as in the single file: a top-level function or constant
with a name already used elsewhere silently replaces the earlier one. `check.py` refuses that.

## Where things are

| File | What it holds |
| --- | --- |
| 00-core.js | constants, sun and season state, small utilities |
| 01-terrain.js | terrain list (append only: saved maps store indices), colour ramps |
| 02-textures.js | procedural, tileable terrain textures |
| 03-map-grid.js | map state, square and hex grid geometry |
| 04-walls-stairs-doors.js | walls, wall materials, wall chains, all stair shapes, doors, structure drawing |
| 05-objects.js | object registry and the core objects (nature, dungeon, furniture, camp, world icons) |
| 06-packs.js | theme pack objects (Japan, caverns, jungle, ships, steampunk), great tree, fireplaces |
| 07-sprites-roofs-labels.js | object sprites and seasons, object drawing, roofs, labels |
| 08-lighting.js | light presets, night and time of day, light blocking |
| 09-render-view-layers.js | renderer, exports, view, layers |
| 10-heights.js | ground height and relief styles |
| 11-stair-tools-editing.js | stair drawing tools, overlay, measuring, structure editing |
| 12-input.js | painting, undo, pointer, touch and pen |
| 13-panels-keyboard.js | side panel, packs, layers panel, palette, keyboard |
| 14-storage-dialogs-boot.js | saving (IndexedDB), project files, dialogs, start-up |
