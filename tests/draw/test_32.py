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
          __md.paintCells(0,0,M.cols,M.rows,id('grass')); __md.paintCells(2,2,14,10,id('wood')); __md.paintCells(15,2,27,10,id('flag')); __md.paintCells(2,11,27,18,id('flag'));
          const W=(a,b,c,d)=>st.walls.push({x1:a,y1:b,x2:c,y2:d,mat:'stone',th:.25});
          W(2,2,27,2); W(2,2,2,18); W(27,2,27,18); W(2,18,27,18); W(14,2,14,10); W(2,10,27,10);
          st.doors.push({x:8,y:10,o:'h',type:'door'},{x:20,y:10,o:'h',type:'double'},{x:4,y:2,o:'h',type:'window'},{x:10,y:2,o:'h',type:'window'},{x:2,y:5,o:'v',type:'window'},{x:14,y:6,o:'v',type:'door'},{x:12,y:18,o:'h',type:'double'},{x:27,y:14,o:'v',type:'window'},{x:18,y:2,o:'h',type:'portcullis'});
          const o=(t,x,y,r=0,s=1)=>st.objects.push({t,x,y,r,s,v:(x*13+y*7)|0,f:0});
          o('fireplace',8,2.85); o('fireplace_grand',21,2.95); o('hearth',14.5,14.5); o('table',6,6.5); o('chair',6,5.6); o('rug',21,6.5); o('rtable',9,14.5);
          __md.structChanged(); }""")
        for name,opt in [('day','{}'),('night',"{tod:'night'}")]:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,48,false,{opt}).toDataURL()"); open(f'doors_{name}.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.keyboard.press('s'); await pg.click('#stampTabs button[data-cat=furniture]'); await pg.wait_for_timeout(200)
        print('furniture buttons', await pg.evaluate("() => [...document.querySelectorAll('#stamps .stp')].map(b=>b.title||b.textContent).filter(t=>/fire|hearth/i.test(t))"))
        print('errors', errs); await b.close()
asyncio.run(main())
