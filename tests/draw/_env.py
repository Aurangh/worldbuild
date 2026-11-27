"""Shared settings for the Map Drawing browser tests."""
import os, pathlib
TOOL = pathlib.Path(__file__).resolve().parents[2] / 'site' / 'draw' / 'index.html'
TOOL_URL = os.environ.get('DRAW_URL', TOOL.as_uri())
_chrome = os.environ.get('CHROME', '/usr/bin/google-chrome')
LAUNCH = dict(args=['--no-sandbox'], **({'executable_path': _chrome} if os.path.exists(_chrome) else {}))
