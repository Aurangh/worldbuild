from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
F = TOOL_URL
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':950}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(F); await pg.wait_for_timeout(1200)
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k), st=m.map.struct;
          m.paintCells(0,0,30,20,id('grass'));
          const rooms=[[2,2,6,5,'tiles'],[9,2,15,4,'slate'],[2,9,10,15,'tiles']];
          const W=st.walls, wall=(a,b,c,d)=>W.push({x1:a,y1:b,x2:c,y2:d,mat:'stone',th:.25});
          for (const [x0,y0,x1,y1,mat] of rooms){ m.paintCells(x0,y0,x1,y1,id('wood')); wall(x0,y0,x1,y0); wall(x1,y0,x1,y1); wall(x1,y1,x0,y1); wall(x0,y1,x0,y0); st.roofs.push({x0,y0,x1,y1,mat}); }
          st.objects.push({t:'table',x:6,y:12,r:0,s:1,v:1,f:0},{t:'bed',x:3.5,y:11,r:0,s:1,v:1,f:0});
          for(let i=0;i<6;i++) st.objects.push({t:'oak',x:19+i*1.8,y:11+(i%2)*2,r:i,s:1,v:i*13,f:0});
          st.objects.push({t:'pine',x:20,y:16,r:0,s:1,v:3,f:0}); m.paintCells(22,15,30,20,id('forest'));
          m.structChanged(); }""")
        d = await pg.evaluate("() => __md.renderFull(__md.map,50,false,{top:false}).toDataURL()")
        open('open_view.png','wb').write(base64.b64decode(d.split(',')[1]))
        # UI: toggle via button, polygon room, round room, collapse side + section
        await pg.click('#bTop'); await pg.wait_for_timeout(400)
        print('top off:', await pg.evaluate("() => __md.map.showTop"))
        async def scr(cx,cy):
            return await pg.evaluate(f"""() => {{ const r=document.getElementById('view').getBoundingClientRect(); const t=document.getElementById('mapCanvas').style.transform; const m=t.match(/translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([\\d.]+)\\)/); const vp=document.getElementById('mapCanvas').width/__md.map.cols; const z=+m[3]*vp; return [r.left+ +m[1]+{cx}*z, r.top+ +m[2]+{cy}*z]; }}""")
        async def click(cx,cy):
            x,y=await scr(cx,cy); await pg.mouse.click(x,y)
        await pg.keyboard.press('Shift+Digit2'); await pg.keyboard.press('o'); await pg.select_option('#roomShape','poly')
        w0 = await pg.evaluate("() => __md.map.struct.walls.length")
        for pt in [(13,7),(18,7),(18,9),(16,9),(16,13),(13,13)]: await click(*pt)
        await pg.wait_for_timeout(200); await pg.screenshot(path='poly_preview.png')
        await click(13,7)
        print('poly walls added', await pg.evaluate("() => __md.map.struct.walls.length") - w0)
        await pg.select_option('#roomShape','circle'); x,y=await scr(25,6); X,Y=await scr(28,6)
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.move(X,Y,steps=5); await pg.mouse.up()
        print('circle walls', await pg.evaluate("() => __md.map.struct.walls.length") - w0)
        await pg.keyboard.press('Control+z'); print('after undo', await pg.evaluate("() => __md.map.struct.walls.length") - w0)
        await pg.keyboard.press('Control+Shift+z')
        await pg.keyboard.press('s'); r0 = await pg.evaluate("() => preRot"); await pg.click('#touchBar button[data-a=rr]') if await pg.is_visible('#touchBar') else None
        await pg.click('#sideTab'); await pg.wait_for_timeout(300)
        print('collapsed', await pg.evaluate("() => [document.body.classList.contains('side-collapsed'), getComputedStyle(document.getElementById('side')).display, document.getElementById('sideTab').textContent]"))
        await pg.screenshot(path='collapsed.png')
        await pg.click('#sideTab'); await pg.wait_for_timeout(300)
        await pg.click('#side h3 >> text=Colour'); await pg.wait_for_timeout(200)
        print('colour section closed', await pg.evaluate("() => document.querySelector('.sec[data-key=\"Colour\"]').classList.contains('closed')"))
        await pg.screenshot(path='panel.png')
        d = await pg.evaluate("() => __md.renderFull(__md.map,40,false).toDataURL()"); open('poly_rooms.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('reload', await pg.evaluate("() => [__md.map.showTop, document.body.classList.contains('side-collapsed'), document.querySelector('.sec[data-key=\"Colour\"]').classList.contains('closed')]"))
        print('errors', errs); await b.close()
asyncio.run(main())
