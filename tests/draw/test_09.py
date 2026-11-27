from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':950}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto(TOOL_URL); await pg.wait_for_timeout(1200)
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k), st=m.map.struct;
          m.paintCells(0,0,30,20,id('grass')); for(let i=0;i<30;i++) m.paintCircle(25+Math.random()*5,16+Math.random()*4,1.2,id('lava'));
          m.paintCells(2,2,14,11,id('flag')); m.paintCells(16,2,26,10,id('wood'));
          const W=st.walls, wall=(a,b,c,d)=>W.push({x1:a,y1:b,x2:c,y2:d,mat:'stone',th:.25});
          for (const [x0,y0,x1,y1] of [[2,2,14,11],[16,2,26,10]]){ wall(x0,y0,x1,y0); wall(x1,y0,x1,y1); wall(x1,y1,x0,y1); wall(x0,y1,x0,y0); }
          st.doors.push({x:20,y:2,o:'h',type:'window'},{x:23,y:2,o:'h',type:'window'},{x:16,y:5,o:'v',type:'door'},{x:6,y:11,o:'h',type:'door'});
          const o=(t,x,y,s=1)=>st.objects.push({t,x,y,r:0,s,v:7,f:0});
          o('altar',8,3.5); o('brazier',4,4); o('brazier',12,4); o('sarco',5,8); o('sarco',11,8); o('torch',2.3,9); o('torch',13.7,9);
          o('table',21,6); o('lantern',21,6); o('bed',24,4); o('chair',20,6.8);
          o('fire',8,15); st.doors.push({x:3,y:11,o:'h',type:'opening'}); o('torch',23,9.6); o('tent',5,16); o('tent',11,16); for(let i=0;i<10;i++) o('oak',1+i*3,19);
          m.structChanged(); }""")
        await pg.wait_for_timeout(500)
        await pg.mouse.move(700,400); await pg.select_option('#todSel','night'); await pg.wait_for_timeout(700)
        await pg.screenshot(path='night_ui.png')
        for nm,night in [('day',False),('night',True)]:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,60,false,{{tod:'{'night' if night else 'day'}'}}).toDataURL()")
            open(f'{nm}.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.click('#bExport'); print(await pg.input_value('#eTod'), await pg.inner_text('#eHint')); await pg.click('#eCancel')
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('night after reload', await pg.evaluate("() => [__md.map.tod, document.getElementById('view').classList.contains('lit')]"))
        print('errors', errs); await b.close()
asyncio.run(main())
