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
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k), st=m.map.struct; st.objects=[]; st.roofs=[]; st.walls=[];
          m.paintCells(0,0,30,20,id('grass')); for(let x=0;x<30;x+=.4) m.paintCircle(x,15+Math.sin(x*.3),1.1,id('dirt'));
          const o=(t,x,y,s=1)=>st.objects.push({t,x,y,r:0,s,v:(x*13+y*7)|0,f:0});
          o('bigtree',6,7); o('bigtree',16,8,1.25); o('oak',24,6); o('barrel',8,11.5); o('bigtree',25,13,.8); m.structChanged(); }""")
        for name,js in [('day',"{}"),('golden',"{tod:'golden'}"),('night',"{tod:'night'}")]:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,40,false,{js}).toDataURL()")
            open(f'tree_{name}.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.evaluate("() => { document.getElementById('seasonSel') }")
        d = await pg.evaluate("() => __md.renderFull(__md.map,90,false,{}).toDataURL()")
        open('tree_big.png','wb').write(base64.b64decode(d.split(',')[1]))
        print('errors', errs); await b.close()
asyncio.run(main())
