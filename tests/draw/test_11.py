from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':950}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto(TOOL_URL); await pg.wait_for_timeout(1200)
        async def scr(cx,cy):
            return await pg.evaluate(f"""() => {{ const r=document.getElementById('view').getBoundingClientRect(); const t=document.getElementById('mapCanvas').style.transform; const m=t.match(/translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([\\d.]+)\\)/); const vp=document.getElementById('mapCanvas').width/__md.map.cols; const z=+m[3]*vp; return [r.left+ +m[1]+{cx}*z, r.top+ +m[2]+{cy}*z]; }}""")
        async def dragc(a,bb):
            x,y=await scr(*a); X,Y=await scr(*bb); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(X,Y,steps=6); await pg.mouse.up()
        async def click(cx,cy):
            x,y=await scr(cx,cy); await pg.mouse.click(x,y)
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k); m.paintCells(0,0,30,20,id('grass')); }""")
        # base: two rooms with furniture
        await pg.keyboard.press('Shift+Digit3'); await pg.keyboard.press('o'); await dragc((3.5,3.5),(11.5,10.5)); await dragc((16.5,4.5),(26.5,12.5))
        await pg.keyboard.press('s'); await pg.click('#stampTabs button[data-cat=furniture]')
        for nm,pt in [('Table',(7.5,6.5)),('Bed',(5,8)),('Barrel',(10,4.5)),('Round table',(21,8))]:
            await pg.click(f'.stp[title="{nm}"]'); await click(*pt)
        # roofs layer
        await pg.select_option('#newLayerType','roofs'); await pg.click('#bAddLayer')
        await dragc((3.5,3.5),(11.5,10.5))
        await pg.select_option('#roofMat','thatch'); await dragc((16.5,4.5),(26.5,12.5))
        # event layer: water flood terrain on overlay
        await pg.select_option('#newLayerType','event'); await pg.click('#bAddLayer')
        await pg.keyboard.press('Digit9'); await pg.keyboard.press('r'); await dragc((0.5,14.5),(29.5,19.5))
        await pg.keyboard.press('e'); await dragc((5,16),(20,17))
        n = await pg.evaluate("() => __md.map.layers.map(l=>[l.name,l.visible,l.struct.roofs.length,l.labels.filter(v=>v!==255).length])"); print(n)
        await pg.wait_for_timeout(400); await pg.screenshot(path='layers_ui.png')
        d = await pg.evaluate("() => __md.renderFull(__md.map,50,false).toDataURL()"); open('layers_roofs.png','wb').write(base64.b64decode(d.split(',')[1]))
        # hide roofs layer via panel checkbox (roofs is 2nd from top)
        await pg.evaluate("() => { const rows=[...document.querySelectorAll('#layers .lay')]; const r=rows.find(x=>x.querySelector('.nm').textContent.startsWith('Roofs')); const c=r.querySelector('input[type=checkbox]'); c.checked=false; c.dispatchEvent(new Event('change')); }")
        d = await pg.evaluate("() => __md.renderFull(__md.map,50,false).toDataURL()"); open('layers_noroof.png','wb').write(base64.b64decode(d.split(',')[1]))
        # undo across layers
        await pg.keyboard.press('Control+z'); print('undo active', await pg.evaluate("() => __md.map.activeLayer===__md.map.layers[2].id"))
        await pg.keyboard.press('Control+Shift+z')
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('reload', await pg.evaluate("() => __md.map.layers.map(l=>[l.name,l.visible,l.struct.roofs.length,l.labels.filter(v=>v!==255).length])"))
        # json roundtrip
        await pg.evaluate("() => { const o = JSON.parse(JSON.stringify(projectJSON(__md.map))); const m = parseProject(o); window.__ex = m._extras.length; }")
        print('json extras', await pg.evaluate("() => window.__ex"))
        print('errors', errs); await b.close()
asyncio.run(main())
