from _env import TOOL_URL, LAUNCH
import asyncio, base64, json
from playwright.async_api import async_playwright
F=TOOL_URL
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**LAUNCH)
        pg = await b.new_page(viewport={'width':1400,'height':950}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type=='error' and errs.append(m.text))
        await pg.goto(F); await pg.wait_for_timeout(1200)
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k), M=m.map, st=M.struct; st.objects=[]; st.walls=[]; st.roofs=[];
          m.paintCells(0,0,M.cols,M.rows,id('grass')); m.paintCells(3,3,12,9,id('rock')); m.paintCells(18,10,23,14,id('dirt'));
          const H=new Int8Array(M.cols*M.rows), set=(x0,y0,x1,y1,v)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)H[y*M.cols+x]=v;};
          set(2,2,13,10,1); set(3,3,12,9,3); set(5,4,9,7,4);         // stepped hill with a cliff
          set(13,4,17,6,2); set(17,4,20,6,1);                         // ramp down east
          set(18,10,23,14,-2);                                       // pit
          M.hgt=H; const o=(t,x,y,s=1)=>st.objects.push({t,x,y,r:0,s,v:(x*13+y*7)|0,f:0});
          o('oak',25,4); o('bigtree',26,15); o('lighthouse',7,5.5,.6); o('pillar',15,12); o('barrel',20,12); m.structChanged(); }""")
        print('pillar?', await pg.evaluate("() => !!__md.map.struct.objects.find(o=>o.t==='pillar')"))
        for name,js in [('day',"{}"),('golden',"{tod:'golden'}"),('night',"{tod:'night'}")]:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,40,false,{js}).toDataURL()")
            open(f'hgt_{name}.png','wb').write(base64.b64decode(d.split(',')[1]))
        # tool: paint via pointer, undo, persistence, json round trip
        await pg.keyboard.press('g'); vis = await pg.evaluate("() => document.getElementById('heightRow').style.display")
        await pg.fill('#hLevel', '5'); await pg.dispatch_event('#hLevel','input'); print('row', repr(vis), await pg.text_content('#hOut'))
        a = await pg.evaluate("() => { const [sx,sy]=__md.toScr(26.5,3.5), b=document.getElementById('view').getBoundingClientRect(); return [b.left+sx,b.top+sy]; }")
        await pg.mouse.click(*a); print('painted', await pg.evaluate("() => __md.map.hgt[3*__md.map.cols+26]"))
        await pg.keyboard.press('Control+z'); print('undone', await pg.evaluate("() => __md.map.hgt[3*__md.map.cols+26]"))
        j = await pg.evaluate("() => JSON.stringify(__md.projectJSON ? __md.projectJSON(__md.map) : null)")
        print('json has hgt', j != 'null' and '"hgt"' in j)
        await pg.keyboard.press('Control+s'); await pg.wait_for_timeout(800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('after reload', await pg.evaluate("() => __md.map.hgt ? [__md.map.hgt[5*__md.map.cols+6], __md.map.hgt[11*__md.map.cols+19]] : null"))
        print('errors', errs); await b.close()
asyncio.run(main())
