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
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k), M=m.map, st=M.struct; st.objects=[]; st.walls=[]; st.roofs=[]; st.doors=[];
          m.paintCells(0,0,M.cols,M.rows,id('grass'));
          m.paintCells(1,1,17,17,id('water')); m.paintCells(2,2,16,16,id('deepwater')); m.paintCells(4,4,14,14,id('grass')); m.paintCells(4,4,14,14,id('cobble'));
          m.paintCells(8,14,10,17,id('wood'));
          const W=(pts,mat,th)=>{ for(let i=0;i<pts.length-1;i++) st.walls.push({x1:pts[i][0],y1:pts[i][1],x2:pts[i+1][0],y2:pts[i+1][1],mat,th}); };
          W([[5,5],[13,5],[13,13],[5,13],[5,5]],'rampart',1);
          st.doors.push({x:8,y:13,o:'h',type:'portcullis'});
          // cave room drawn on rock
          m.paintCells(19,0,30,20,id('rock')); m.paintCells(20,3,28,10,id('cavemud')); m.paintCells(21,11,27,17,id('cavemud')); m.paintCells(23,9,25,12,id('cavemud'));
          W([[20,3],[28,3],[28,10],[25,10],[25,11],[27,11],[27,17],[21,17],[21,11],[23,11],[23,10],[20,10],[20,3]],'cave',.25);
          const o=(t,x,y,s=1)=>st.objects.push({t,x,y,r:0,s,v:(x*13+y*7)|0,f:0}); o('stalags',22,5); o('crystals',26,15); o('tower',5,5); o('oak',3,18.5);
          M.hgt=new Int8Array(M.cols*M.rows); m.structChanged(); }""")
        for name,js in [('day',"{}"),('night',"{tod:'night'}")]:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,44,false,{js}).toDataURL()")
            open(f'fort_{name}.png','wb').write(base64.b64decode(d.split(',')[1]))
        # relief style switch + persistence
        await pg.evaluate("() => { const M=__md.map; for(let y=2;y<8;y++)for(let x=1;x<4;x++) M.hgt[y*M.cols+x]=3; }")
        await pg.keyboard.press('g'); await pg.select_option('#reliefSel','contour')
        d = await pg.evaluate("() => __md.renderFull(__md.map,44,false,{}).toDataURL()"); open('fort_contour.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.keyboard.press('Control+s'); await pg.wait_for_timeout(800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('relief after reload', await pg.evaluate("() => [__md.map.relief, document.getElementById('reliefSel').value]"))
        print('errors', errs); await b.close()
asyncio.run(main())
