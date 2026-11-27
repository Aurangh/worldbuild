from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
F=TOOL_URL
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':950}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto(F); await pg.wait_for_timeout(1200)
        await pg.evaluate("() => { const st=__md.map.struct; st.objects=[]; st.walls=[]; st.stairs=[]; st.doors=[]; st.labels=[]; __md.map.hgt=null; __md.paintCells(0,0,__md.map.cols,__md.map.rows,__md.TERRAINS.findIndex(t=>t.key==='flag')); __md.structChanged(); }")
        async def at(x,y): return await pg.evaluate(f"() => {{ const [sx,sy]=__md.toScr({x},{y}), b=document.getElementById('view').getBoundingClientRect(); return [b.left+sx,b.top+sy]; }}")
        async def drag(pts):
            await pg.mouse.move(*pts[0]); await pg.mouse.down()
            for q in pts[1:]: await pg.mouse.move(*q, steps=3)
            await pg.mouse.up(); await pg.wait_for_timeout(80)
        import math
        await pg.keyboard.press('t'); await pg.select_option('#stairShape', 'curved')
        print('rows', await pg.evaluate("() => ['stairRow','stairWRow','pillarRow','stairHRow','stairEdRow'].map(i=>document.getElementById(i).style.display||'shown')"))
        # 1. curved: centre (8,8), outer edge radius 4 to the south, sweep 3/4 turn clockwise
        await drag([await at(8,8), await at(8,10), await at(8,12)])
        print('stage', await pg.evaluate("() => curveDraft && [curveDraft.stage, curveDraft.r1, +curveDraft.a0.toFixed(2)]"))
        pts=[await at(8+4*math.cos(math.pi/2+a), 8+4*math.sin(math.pi/2+a)) for a in [i*0.2 for i in range(0,25)]]
        await drag(pts)
        print('curved', await pg.evaluate("() => { const s=__md.map.struct.stairs[0]; return s && [s.arc.r0, s.arc.r1, +(s.arc.a1-s.arc.a0).toFixed(2), s.h0*5, s.h1*5]; }"))
        # 2. pillar: tap at (20,8), 30 ft tall
        await pg.select_option('#stairShape', 'pillar'); await pg.fill('#stairH0','0'); await pg.fill('#stairH1','30')
        await pg.mouse.click(*(await at(20.2,8.1)))
        print('pillar', await pg.evaluate("() => { const s=__md.map.struct.stairs[1]; return s && [s.arc.cx, s.arc.cy, s.arc.r0, s.arc.r1, +((s.arc.a1-s.arc.a0)/6.2832).toFixed(2), s.h1*5, __md.map.struct.walls.length]; }"))
        # 3. edit: select the curved stair on its ring, change heights, mirror; clicking the middle selects nothing
        await pg.keyboard.press('v'); await pg.mouse.click(*(await at(8,8)))
        print('middle selects', await pg.evaluate("() => selStair"))
        await pg.mouse.click(*(await at(8-3.5,8))); await pg.wait_for_timeout(150)
        print('ring selects', await pg.evaluate("() => [selStair, document.getElementById('stairEdRow').style.display||'shown', document.getElementById('stairH1').value]"))
        await pg.fill('#stairH1','40'); await pg.dispatch_event('#stairH1','change'); await pg.click('#stairMir')
        print('edited', await pg.evaluate("() => { const s=__md.map.struct.stairs[0]; return [s.h1*5, +(s.arc.a1-s.arc.a0).toFixed(2)]; }"))
        await pg.keyboard.press('Control+z'); print('undo mirror', await pg.evaluate("() => +(__md.map.struct.stairs[0].arc.a1-__md.map.struct.stairs[0].arc.a0).toFixed(2)"))
        d = await pg.evaluate("() => __md.renderFull(__md.map,48,false,{}).toDataURL()"); open('stairs_tool.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.keyboard.press('Control+s'); await pg.wait_for_timeout(800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('after reload', await pg.evaluate("() => __md.map.struct.stairs.map(s => s.arc ? [s.h1*5, +(s.arc.a1-s.arc.a0).toFixed(2)] : 'straight')"))
        print('errors', errs); await b.close()
asyncio.run(main())
