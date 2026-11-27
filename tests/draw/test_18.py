from _env import TOOL_URL, LAUNCH
import asyncio
from playwright.async_api import async_playwright
F=TOOL_URL
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(F); await pg.wait_for_timeout(1000)
        r = await pg.evaluate("""() => { // an old-format save: custom terrain stored at slot 13, no 'cb' field
          const n = 10*8*10*8, labels = new Uint8Array(n); for (let i=0;i<n;i++) labels[i] = i < n/2 ? 13 : 0;
          const rec = { id:'old1', name:'Old', cols:10, rows:10, ft:5, seed:1, soft:.6, base:0, R:8, labels, struct:{walls:[],doors:[],stairs:[],objects:[],labels:[],roofs:[]}, custom:[{gen:'grass',hex:'#b3632a'}] };
          const m = fromRecord(rec); openMap(m);
          const L = __md.map.labels; return [L[0], L[n-1], __md.TERRAINS[L[0]].name, __md.TERRAINS.length]; }""")
        print('migrated', r)
        print('errors', errs); await b.close()
asyncio.run(main())
