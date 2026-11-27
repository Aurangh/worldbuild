from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':980}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto(TOOL_URL); await pg.wait_for_timeout(1200)
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k);
          const st=m.map.struct; st.walls=[];st.doors=[];st.stairs=[];st.objects=[];
          m.paintCells(0,0,30,20,id('grass'));
          for(let i=0;i<40;i++) m.paintCircle(18+Math.random()*10, 12+Math.random()*7, 1.2, id('dirt'));
          for(let t=0;t<22;t+=.3) m.paintCircle(t, 15+Math.sin(t*.4)*1.5, 1.1, id('water'));
          m.paintCells(18,2,27,9,id('flag')); m.structChanged(); }""")
        async def scr(cx,cy):
            return await pg.evaluate(f"""() => {{ const r=document.getElementById('view').getBoundingClientRect(); const t=document.getElementById('mapCanvas').style.transform; const m=t.match(/translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([\\d.]+)\\)/); const vp=document.getElementById('mapCanvas').width/__md.map.cols; const z=+m[3]*vp; return [r.left+ +m[1]+{cx}*z, r.top+ +m[2]+{cy}*z]; }}""")
        async def click(cx,cy):
            x,y = await scr(cx,cy); await pg.mouse.click(x,y)
        async def dragpath(pts):
            x,y=await scr(*pts[0]); await pg.mouse.move(x,y); await pg.mouse.down()
            for q in pts[1:]:
                X,Y=await scr(*q); await pg.mouse.move(X,Y,steps=8)
            await pg.mouse.up()
        # scatter woodland
        await pg.keyboard.press('a')
        await pg.evaluate("() => { document.getElementById('brushSize').value=4; document.getElementById('brushSize').dispatchEvent(new Event('input')); }")
        await dragpath([(2,2),(12,2),(12,7),(2,9),(8,11)])
        await pg.select_option('#scatterSet','pines'); await dragpath([(14,1),(15,8)])
        await pg.select_option('#scatterSet','marsh'); await pg.evaluate("() => { document.getElementById('brushSize').value=2; document.getElementById('brushSize').dispatchEvent(new Event('input')); }")
        await dragpath([(1,13),(20,16)])
        await pg.select_option('#scatterSet','debris'); await dragpath([(17,10),(27,11)])
        # ruins stamps
        await pg.keyboard.press('s'); await pg.click('#stampTabs button[data-cat=ruins]')
        await pg.click('.stp[title=Pillar]')
        for pt in [(19,3),(26,3),(19,8),(26,8)]: await click(*pt)
        await pg.click('.stp[title="Statue"]'); await click(22.5,5.5)
        await pg.click('.stp[title="Fallen pillar"]'); await click(23,12.5)
        await pg.click('.stp[title="Broken wall"]'); await click(20,17.5)
        await pg.click('.stp[title="Fallen arch"]'); await click(25,16)
        await pg.click('.stp[title="Old tiles"]'); await click(28,13)
        await pg.click('#stampTabs button[data-cat=nature]')
        for name,pt in [('Boulder',(16,12)),('Log',(10,11)),('Stump',(12,10)),('Dead tree',(14,18)),('Mushrooms',(11,12)),('Flowers',(5,11))]:
            await pg.click(f'.stp[title="{name}"]'); await click(*pt)
        # select & move a boulder
        await pg.keyboard.press('v'); x,y=await scr(16,12); X,Y=await scr(17,13)
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(X,Y,steps=5); await pg.mouse.up()
        await pg.keyboard.press('Period'); await pg.keyboard.press('Equal')
        sel = await pg.inner_text('#stTool'); print(sel)
        await pg.wait_for_timeout(500); await pg.screenshot(path='ui5.png')
        d = await pg.evaluate("() => __md.renderFull(__md.map,80,false).toDataURL()")
        open('obj80.png','wb').write(base64.b64decode(d.split(',')[1]))
        print(await pg.evaluate("() => { const c={}; for (const o of __md.map.struct.objects) c[o.t]=(c[o.t]||0)+1; return JSON.stringify(c); }"))
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('after reload', await pg.evaluate("() => __md.map.struct.objects.length"))
        print('errors', errs); await b.close()
asyncio.run(main())
