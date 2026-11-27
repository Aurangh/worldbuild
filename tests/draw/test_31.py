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
        await pg.evaluate("""() => { const T=__md.TERRAINS, id=k=>T.findIndex(t=>t.key===k), M=__md.map, st=M.struct; st.objects=[]; st.walls=[]; st.stairs=[]; st.doors=[]; st.labels=[]; M.hgt=null;
          __md.paintCells(0,0,M.cols,M.rows,id('stone')); __md.paintCells(1,1,19,19,id('flag')); __md.paintCells(21,1,29,19,id('wood')); __md.structChanged(); }""")
        async def at(x,y): return await pg.evaluate(f"() => {{ const [sx,sy]=__md.toScr({x},{y}), b=document.getElementById('view').getBoundingClientRect(); return [b.left+sx,b.top+sy]; }}")
        async def drag(a, z):
            await pg.mouse.move(*a); await pg.mouse.down(); await pg.mouse.move(*z, steps=6); await pg.mouse.up(); await pg.wait_for_timeout(80)
        await pg.keyboard.press('t')
        # grand: foot at (10,18) dragging north 4 squares
        await pg.select_option('#stairShape', 'grand')
        print('rows grand', await pg.evaluate("() => ['grandRows','halfRows','stairWRow','stairHRow'].map(i=>document.getElementById(i).style.display||'shown')"))
        await drag(await at(10.2, 18), await at(10.2, 14))
        print('grand', await pg.evaluate("() => { const s=__md.map.struct.stairs[0]; return s && [s.kind, s.dir, s.fx, s.fy, s.len, s.h0*5, s.h1*5, +s.x0.toFixed(2), +s.y0.toFixed(2), +s.x1.toFixed(2), +s.y1.toFixed(2)]; }"))
        # half-turn: foot at (23,18) north, 3 squares, turning right
        await pg.select_option('#stairShape', 'half')
        await drag(await at(23.3, 18), await at(23.3, 15))
        print('half', await pg.evaluate("() => { const s=__md.map.struct.stairs[1]; return s && [s.kind, s.dir, s.fx, s.fy, s.len, s.h0*5, s.h1*5, s.opt.turnSide, s.opt.halfTurn]; }"))
        # L-variant, turning left
        await pg.select_option('#halfTurn', '90'); await pg.select_option('#turnSide', 'l')
        await drag(await at(27.5, 18), await at(27.5, 15))
        print('L', await pg.evaluate("() => { const s=__md.map.struct.stairs[2]; return s && [s.opt.halfTurn, s.opt.turnSide, +s.x0.toFixed(2), +s.x1.toFixed(2)]; }"))
        # straight now drawn uphill: drag north -> stairs go down to the south (dir 's')
        await pg.select_option('#stairShape', 'straight')
        await drag(await at(2.5, 6.5), await at(2.5, 3.5))
        print('straight dir (down)', await pg.evaluate("() => __md.map.struct.stairs[3] && __md.map.struct.stairs[3].dir"))
        # balustrade wall across the gallery
        await pg.evaluate("() => { __md.map.struct.walls.push({x1:3,y1:7,x2:17,y2:7,mat:'balustrade',th:.15}); __md.structChanged(); }")
        print('balustrade blocks light?', await pg.evaluate("() => lightBlockers(__md.map).length"))
        # select the half-turn and edit: mirror + width
        await pg.keyboard.press('v'); await pg.mouse.click(*(await at(23.5, 17))); await pg.wait_for_timeout(150)
        print('select half', await pg.evaluate("() => [selStair, document.getElementById('halfRows').style.display||'shown', document.getElementById('stairMir').style.display||'shown']"))
        await pg.click('#stairMir'); print('mirrored', await pg.evaluate("() => __md.map.struct.stairs[1].opt.turnSide"))
        await pg.keyboard.press('Control+z'); print('undo', await pg.evaluate("() => __md.map.struct.stairs[1].opt.turnSide"))
        # move the grand staircase by dragging its central flight
        await drag(await at(10.5, 16), await at(9.5, 16)); print('moved grand fx', await pg.evaluate("() => __md.map.struct.stairs[0].fx"))
        await drag(await at(9.5, 16), await at(10.5, 16))
        for name,opt in [('day','{}'),('night',"{tod:'night'}")]:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,48,false,{opt}).toDataURL()"); open(f'stairs2_{name}.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.keyboard.press('Control+s'); await pg.wait_for_timeout(800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('after reload', await pg.evaluate("() => __md.map.struct.stairs.map(s => s.kind || (s.arc ? 'arc' : 'straight'))"))
        j = await pg.evaluate("() => { const m = parseProject(JSON.parse(JSON.stringify(projectJSON(__md.map)))); return m.struct.stairs.map(s => s.kind ? [s.kind, s.opt.turnSide||'', s.opt.sideTurn==null?'':s.opt.sideTurn] : 'other'); }")
        print('project round trip', j)
        print('errors', errs); await b.close()
asyncio.run(main())
