from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':900}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto(TOOL_URL); await pg.wait_for_timeout(1200)
        # new blank map: dirt base
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k);
          m.paintCells(0,0,30,20,id('rock')); m.paintCells(0,0,30,20,id('rock')); }""")
        # cell->screen helper
        async def scr(cx,cy):
            return await pg.evaluate(f"""() => {{ const r=document.getElementById('view').getBoundingClientRect(); const t=document.getElementById('mapCanvas').style.transform; const m=t.match(/translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([\\d.]+)\\)/); const vp=document.getElementById('mapCanvas').width/__md.map.cols; const z=+m[3]*vp; return [r.left+ +m[1]+{cx}*z, r.top+ +m[2]+{cy}*z]; }}""")
        async def click(cx,cy):
            x,y = await scr(cx,cy); await pg.mouse.click(x,y)
        async def dragc(a,bb):
            x,y=await scr(*a); X,Y=await scr(*bb); await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(X,Y,steps=6); await pg.mouse.up()
        # select flagstone, room tool
        await pg.keyboard.press('Shift+Digit2'); await pg.keyboard.press('o')
        await dragc((3.5,3.5),(12.5,10.5))
        await pg.keyboard.press('Shift+Digit3')
        await dragc((15.5,3.5),(24.5,9.5))
        # corridor walls with wall tool
        await pg.keyboard.press('w')
        for pt in [(13,6),(15,6)]: await click(*pt)
        await pg.keyboard.press('Escape')
        await click(13,8); await click(15,8); await click(15,8)
        # paint corridor floor
        await pg.keyboard.press('Shift+Digit2'); await pg.keyboard.press('r'); await dragc((13.5,6.5),(14.5,7.5))
        # doors
        await pg.keyboard.press('d')
        await pg.select_option('#doorType','door'); await click(13,6.5); await click(15,7.5)
        await pg.select_option('#doorType','double'); await click(7.5,11)
        await pg.select_option('#doorType','secret'); await click(20.5,10)
        await pg.select_option('#doorType','window'); await click(19.5,3)
        await pg.select_option('#doorType','portcullis'); await click(3,6.5)
        # cave walls
        await pg.select_option('#wallMat','cave'); await pg.select_option('#wallTh','0.4')
        await pg.keyboard.press('w')
        for pt in [(2,13),(10,13),(14,17),(26,16),(28,12),(28,12)]: await click(*pt)
        # stairs
        await pg.keyboard.press('t'); await dragc((9.5,4.5),(9.5,7.5))
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='ui3.png')
        d = await pg.evaluate("() => __md.renderFull(__md.map,80,false,{dm:true}).toDataURL()")
        open('struct80.png','wb').write(base64.b64decode(d.split(',')[1]))
        n = await pg.evaluate("() => JSON.stringify([__md.map.struct.walls.length,__md.map.struct.doors.length,__md.map.struct.stairs.length])")
        print('struct', n)
        await pg.keyboard.press('Control+z'); n2 = await pg.evaluate("() => __md.map.struct.stairs.length"); print('after undo stairs', n2)
        await pg.keyboard.press('Control+Shift+z')
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1200)
        print('reload', await pg.evaluate("() => JSON.stringify([__md.map.struct.walls.length,__md.map.struct.doors.length,__md.map.struct.stairs.length])"))
        print('errors', errs); await b.close()
asyncio.run(main())
