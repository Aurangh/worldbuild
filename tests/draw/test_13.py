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
          m.paintCells(0,0,24,16,id('grass')); m.paintCells(2,2,10,9,id('flag'));
          const W=st.walls, wall=(a,b,c,d)=>W.push({x1:a,y1:b,x2:c,y2:d,mat:'stone',th:.25});
          wall(2,2,10,2); wall(10,2,10,9); wall(10,9,2,9); wall(2,9,2,2); st.doors.push({x:6,y:9,o:'h',type:'door'},{x:10,y:5,o:'v',type:'window'});
          const o=(t,x,y,s=1,c)=>st.objects.push({t,x,y,r:0,s,v:5+x|0,f:0,...(c?{c}:{})});
          o('brazier',4,4); o('torch',9.6,7.5,1,'#5aa0ff'); o('altar',6,3.4); o('torch',2.4,7.5,1,'#6aff7a');
          for(let i=0;i<5;i++) o('oak',14+i*2,3+(i%2)*2); o('fire',17,11); o('tent',14,12); o('pillar',21,11); o('pillar',21,13);
          st.roofs.push({x0:12,y0:7,x1:16,y1:10,mat:'slate'}); m.structChanged(); }""")
        for t in ['day','dawn','golden','dusk','night']:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,40,false,{{tod:'{t}'}}).toDataURL()")
            open(f'tod_{t}.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.select_option('#todSel','dusk'); await pg.wait_for_timeout(600); await pg.screenshot(path='tod_ui.png')
        await pg.click('#bExport'); print(await pg.inner_text('#eHint')); await pg.click('#eCancel')
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('reload tod', await pg.evaluate("() => [__md.map.tod, document.getElementById('todSel').value, document.getElementById('view').classList.contains('lit')]"))
        print('errors', errs); await b.close()
asyncio.run(main())
