#!/usr/bin/env python3
"""Build site/draw/index.html from tools/draw/index.template.html and tools/draw/src/*.js.

The tool ships as ONE standalone HTML file. Its script lives in tools/draw/src/ as numbered
files that are joined in order (they share one global scope, exactly like the single file).
  python3 tools/draw/build.py          write site/draw/index.html
  python3 tools/draw/build.py --check  fail if site/draw/index.html is out of date
"""
import pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = ROOT / 'tools' / 'draw'
OUT = ROOT / 'site' / 'draw' / 'index.html'

def build():
    js = ''.join(p.read_text() for p in sorted((HERE / 'src').glob('*.js')))
    tpl = (HERE / 'index.template.html').read_text()
    assert tpl.count('/*@modules*/') == 1, 'template needs exactly one /*@modules*/ marker'
    return tpl.replace('/*@modules*/', js.rstrip('\n'))

if __name__ == '__main__':
    html = build()
    if '--check' in sys.argv:
        if OUT.read_text() != html:
            sys.exit('site/draw/index.html is out of date: run python3 tools/draw/build.py')
        print('build is up to date')
    else:
        OUT.write_text(html); print(f'wrote {OUT.relative_to(ROOT)} ({len(html.encode()):,} bytes)')
