from _env import TOOL_URL, LAUNCH
import asyncio
from playwright.async_api import async_playwright
F=TOOL_URL
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':950}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await pg.goto(F); await pg.wait_for_timeout(1200)
        await pg.evaluate("() => { __md.map.struct.objects = [{t:'barrel',x:5,y:5,r:0,s:1,v:1,f:0}]; __md.map.struct.roofs=[{x0:10,y0:4,x1:13,y1:7,mat:'slate'}]; __md.structChanged(); }")
        async def at(x,y):
            r = await pg.evaluate(f"() => {{ const [sx,sy] = __md.toScr({x},{y}), b = document.getElementById('view').getBoundingClientRect(); return [b.left+sx, b.top+sy]; }}")
            return r
        async def dragf(a,bb):
            await pg.mouse.move(*a); await pg.mouse.down(); 
            for i in range(1,9): await pg.mouse.move(a[0]+(bb[0]-a[0])*i/8, a[1]+(bb[1]-a[1])*i/8)
            await pg.mouse.up(); await pg.wait_for_timeout(100)
        objs = lambda: pg.evaluate("() => __md.map.struct.objects.map(o=>[o.t,o.x,o.y])")
        # 1. stamp tool: drag existing barrel -> moves, no new object
        await pg.keyboard.press('s'); await dragf(await at(5,5), await at(8,6))
        print('stamp drag', await objs())
        # 2. stamp tool: tap on barrel -> places a new object
        a = await at(8,6); await pg.mouse.click(*a); print('stamp tap', len(await objs()))
        # 3. select tool across layers: add a layer, make it active, drag barrel (on base)
        await pg.evaluate("() => { __md.map.struct.objects.pop(); __md.structChanged(); }")
        await pg.click('#bAddLayer'); await pg.wait_for_timeout(200)
        print('layers', await pg.evaluate("() => __md.layersApi().length"), 'active', await pg.evaluate("() => __md.map.activeLayer"))
        await pg.keyboard.press('v'); await dragf(await at(8,6), await at(6,9))
        print('select other layer', await objs(), 'active', await pg.evaluate("() => __md.map.activeLayer"))
        # 4. arrows nudge
        await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('Shift+ArrowDown'); print('nudge', await objs())
        await pg.keyboard.press('Control+z'); print('undo', await objs())
        # 5. roof move
        await dragf(await at(11.5,5.5), await at(14.5,8.5)); print('roof', await pg.evaluate("() => __md.map.layers[0].struct.roofs"))
        print('errors', errs); await b.close()
asyncio.run(main())
