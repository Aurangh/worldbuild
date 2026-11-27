from _env import TOOL_URL, LAUNCH
import asyncio
from playwright.async_api import async_playwright
F=TOOL_URL
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(F); await pg.wait_for_timeout(1200)
        r = await pg.evaluate("""() => { const M=__md.map; M.hgt=new Int8Array(M.cols*M.rows); M.hgt[5]=-3; M.hgt[7]=6;
          const j=JSON.parse(JSON.stringify(projectJSON(M))); const m2=parseProject(j); return [typeof j.hgt, m2.hgt[5], m2.hgt[7], m2.hgt.length===M.cols*M.rows]; }""")
        print(r, errs); await b.close()
asyncio.run(main())
