from _env import TOOL_URL, LAUNCH
import asyncio, base64
from playwright.async_api import async_playwright
F=TOOL_URL
SCENES = {
 'caves': """m.paintCells(0,0,30,20,id('wetrock')); for(let i=0;i<30;i++) m.paintCircle(4+Math.random()*8,4+Math.random()*10,1.3,id('cavemud'));
   for(let i=0;i<20;i++) m.paintCircle(20+Math.random()*7,3+Math.random()*6,1.1,id('crystal')); for(let i=0;i<20;i++) m.paintCircle(18+Math.random()*9,13+Math.random()*5,1.1,id('biomoss'));
   for(let t=0;t<30;t+=.3) m.paintCircle(t, 10+Math.sin(t*.3)*1.2, .9, id('water'));
   o('stalags',3,3); o('stalags',10,16); o('stalag',13,4); o('stalag',6,13); o('crystals',22,4); o('crystals',25,6); o('crystals',21,7.5); o('glowshroom',20,14); o('glowshroom',25,16); o('giantshroom',22,16.5);
   o('ropebridge',15,10,0); o('web',27,2.2); o('minecart',8,6.5); o('rails',8,8.5); o('rails',8,4.5); o('beams',5,8.2); o('eggs',27,11.5); o('bullseye',3,9,0);""",
 'jungle': """m.paintCells(0,0,30,20,id('jungle')); m.paintCells(0,12,30,20,id('beach')); for(let x=0;x<30;x+=.4) m.paintCircle(x, 18+Math.sin(x*.4)*1, 1.6, id('reef'));
   m.paintCells(20,0,30,8,id('mangrove'));
   o('jtree',3,3); o('jtree',8,5); o('palm',12,10); o('palm',17,12.5); o('palm',24,13); o('fern',6,9); o('fern',10,2); o('bigleaf',14,6); o('mangrove',23,3); o('mangrove',27,5);
   o('stilthut',17,5); o('totem',13,8.5); o('tikitorch',15.5,8); o('tikitorch',18.5,8); o('canoe',9,16,1.2); o('idol',4,11); o('coral',22,19); o('coral',26,18.5); o('shells',14,15); o('driftwood',20,15.5); o('ziggurat',27,10,0,.6);
   st.roofs.push({x0:1,y0:14,x1:5,y1:17,mat:'palm'});""",
 'ships': """m.paintCells(0,0,30,20,id('water')); m.paintCells(0,0,30,5,id('quay')); m.paintCells(6,5,10,13,id('pier')); m.paintCells(18,5,22,9,id('pier'));
   o('sloop',14,11,1.57); o('lighthouse',27,3,1.2); o('crane',3,3,1.57); o('cannon',23,7); o('ropecoil',7,6); o('bollard',6.3,12.6); o('bollard',9.7,12.6); o('anchor',20,6.5,.4); o('cargonet',12,2.5); o('crate',15,2.5); o('barrel',16,3); o('buoy',4,15); o('buoy',24,16); o('gangplank',10.9,9.5,1.57);
   o('shipwheel',19,8); o('grate',21,8); o('mast',25,12,0); o('lantern',8,6);""",
}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':950}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto(F); await pg.wait_for_timeout(1200)
        for name, js in SCENES.items():
            await pg.evaluate("() => { const st=__md.map.struct; st.objects=[]; st.roofs=[]; st.walls=[]; st.doors=[]; }")
            await pg.evaluate("() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k), st=m.map.struct; const o=(t,x,y,r=0,s=1)=>st.objects.push({t,x,y,r,s,v:(x*13+y*7)|0,f:0}); " + js + " m.structChanged(); }")
            for mode,opt in [('day',"{}"),('night',"{tod:'night'}")]:
                d = await pg.evaluate(f"() => __md.renderFull(__md.map,40,false,{opt}).toDataURL()")
                open(f'pack_{name}_{mode}.png','wb').write(base64.b64decode(d.split(',')[1]))
        for cat in ['cave','jungle','ship']:
            await pg.click(f'#stampTabs button[data-cat={cat}]'); await pg.wait_for_timeout(300)
            print(cat, await pg.evaluate("() => document.querySelectorAll('#stamps .stp').length"))
        print('errors', errs); await b.close()
asyncio.run(main())
