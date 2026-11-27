from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':1000}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept(d.default_value or 'x')))
        await pg.goto(TOOL_URL); await pg.wait_for_timeout(1200)
        async def scr(cx,cy):
            return await pg.evaluate(f"""() => {{ const r=document.getElementById('view').getBoundingClientRect(); const t=document.getElementById('mapCanvas').style.transform; const m=t.match(/translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([\\d.]+)\\)/); const vp=document.getElementById('mapCanvas').width/__md.map.cols; const z=+m[3]*vp; return [r.left+ +m[1]+{cx}*z, r.top+ +m[2]+{cy}*z]; }}""")
        async def click(cx,cy):
            x,y = await scr(cx,cy); await pg.mouse.click(x,y)
        async def dragc(a,bb):
            x,y=await scr(*a); X,Y=await scr(*bb); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(X,Y,steps=6); await pg.mouse.up()
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k); m.paintCells(0,0,30,20,id('grass')); }""")
        # autumn grass: select grass, palette autumn, recolour, paint area
        await pg.click('.tsw[data-i="0"]'); await pg.click('.sw[title="Autumn"]'); await pg.click('#bRecolour')
        await pg.keyboard.press('r'); await dragc((0.5,0.5),(13.5,19.5))
        # arcane flagstone room
        await pg.keyboard.press('Shift+Digit2'); await pg.click('.sw[title="Marble"]'); await pg.click('#bRecolour')
        await pg.keyboard.press('o'); await dragc((15.5,1.5),(28.5,9.5))
        await pg.keyboard.press('Shift+Digit3'); await pg.keyboard.press('o'); await dragc((15.5,11.5),(28.5,18.5))
        # dungeon stamps in marble room
        await pg.keyboard.press('s'); await pg.click('#stampTabs button[data-cat=dungeon]')
        for name,pt in [('Altar',(22,3)),('Sarcophagus',(18,6)),('Sarcophagus',(26,6)),('Brazier',(20,3)),('Brazier',(24,3)),('Chest',(17,8.5)),('Bones',(22,7)),('Pit',(22,5.5)),('Trapdoor',(27.5,8.5))]:
            await pg.click(f'.stp[title="{name}"]'); await click(*pt)
        await pg.click('#stampTabs button[data-cat=furniture]')
        await pg.evaluate("() => { const c=document.getElementById('objRandRot'); c.checked=false; c.dispatchEvent(new Event('change')); }")
        for name,pt in [('Rug',(22,15)),('Table',(22,15)),('Chair',(21,14.2)),('Chair',(23,14.2)),('Bed',(17,13.5)),('Bookshelf',(25,12.3)),('Barrel',(27.6,17.5)),('Crate',(26.7,17.6)),('Sacks',(27.5,16.4)),('Round table',(18,17))]:
            await pg.click(f'.stp[title="{name}"]'); await click(*pt)
        await pg.click('#stampTabs button[data-cat=camp]')
        await pg.evaluate("() => { const c=document.getElementById('objRandRot'); c.checked=true; c.dispatchEvent(new Event('change')); }")
        for name,pt in [('Tent',(4,4)),('Tent',(8,3)),('Campfire',(6,7)),('Bedroll',(3,8)),('Wagon',(11,9)),('Well',(4,14)),('Fence',(8,17)),('Woodpile',(9,6)),('Signpost',(13,15)),('Rowboat',(13,2))]:
            await pg.click(f'.stp[title="{name}"]'); await click(*pt)
        # tinted trees: autumn tint scatter
        await pg.click('#stampTabs button[data-cat=nature]')
        await pg.click('.sw[title="Gold leaf"]'); await pg.evaluate("() => { const c=document.getElementById('tintObj'); c.checked=true; c.dispatchEvent(new Event('change')); }")
        await pg.keyboard.press('a'); await pg.select_option('#scatterSet','forest')
        await pg.evaluate("() => { const b=document.getElementById('brushSize'); b.value=3; b.dispatchEvent(new Event('input')); }")
        await dragc((1,17),(6,19))
        # labels
        await pg.keyboard.press('l'); await click(22,2); await click(20,13)
        await pg.select_option('#labelSize','1.3'); await click(6.5,11.5)
        await pg.wait_for_timeout(600); await pg.screenshot(path='ui7.png')
        d = await pg.evaluate("() => __md.renderFull(__md.map,80,false,{dm:true,labels:true}).toDataURL()")
        open('p4.png','wb').write(base64.b64decode(d.split(',')[1]))
        print(await pg.evaluate("() => JSON.stringify({custom:__md.map.custom, labels:__md.map.struct.labels.length, objs:__md.map.struct.objects.length})"))
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('reload', await pg.evaluate("() => JSON.stringify({custom:__md.map.custom.length, T:__md.TERRAINS.length, labels:__md.map.struct.labels.length})"))
        print('errors', errs); await b.close()
asyncio.run(main())
