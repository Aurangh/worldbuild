#!/usr/bin/env python3
"""Run every Map Drawing browser test; fail if any test crashes or the page logs an error.
  pip install playwright && python3 -m playwright install chromium
  python3 tests/draw/run.py            all tests
  python3 tests/draw/run.py 25 31      only test_25.py and test_31.py
"""
import pathlib, subprocess, sys, tempfile, re
HERE = pathlib.Path(__file__).resolve().parent
pick = set(sys.argv[1:])
tests = [p for p in sorted(HERE.glob('test_*.py')) if not pick or p.stem.split('_')[1].lstrip('0') in {x.lstrip('0') for x in pick}]
failed = []
with tempfile.TemporaryDirectory() as tmp:   # tests write their renders here
    for t in tests:
        r = subprocess.run([sys.executable, str(t)], cwd=tmp, capture_output=True, text=True, timeout=600, env={**__import__('os').environ, 'PYTHONPATH': str(HERE)})
        out = r.stdout + r.stderr
        bad = r.returncode != 0 or 'Traceback' in out or re.search(r"errors \[(?!\])", out)
        print(f"{'FAIL' if bad else 'ok  '} {t.name}")
        if bad: failed.append(t.name); print('\n'.join('    ' + l for l in out.strip().splitlines()[-15:]))
print(f'\n{len(tests) - len(failed)}/{len(tests)} passed')
sys.exit(1 if failed else 0)
