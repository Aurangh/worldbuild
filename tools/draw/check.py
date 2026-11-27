#!/usr/bin/env python3
"""Static checks for the Map Drawing tool: the build is current, and no two top-level
functions or constants share a name (in one shared scope a later one silently replaces
an earlier one: this caught two real bugs)."""
import pathlib, re, subprocess, sys
from collections import Counter
ROOT = pathlib.Path(__file__).resolve().parents[2]
ok = subprocess.run([sys.executable, str(ROOT / 'tools/draw/build.py'), '--check']).returncode == 0
js = ''.join(p.read_text() for p in sorted((ROOT / 'tools/draw/src').glob('*.js')))
names = re.findall(r'^(?:async )?function (\w+)\s*\(', js, re.M) + re.findall(r'^(?:const|let|var) (\w+)\s*=', js, re.M)
dups = sorted(n for n, c in Counter(names).items() if c > 1)
if dups: print('duplicate top-level names:', ', '.join(dups)); ok = False
else: print(f'no duplicate names among {len(names)} top-level functions and constants')
sys.exit(0 if ok else 1)
