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
        await pg.evaluate("""() => { const m=__md, T=m.TERRAINS, id=k=>T.findIndex(t=>t.key===k), st=m.map.struct;
          m.paintCells(0,0,30,20,id('grass')); m.paintCells(12,9,19,14,id('moss')); 
          for(let t=0;t<20;t+=.3) m.paintCircle(22+Math.cos(t*.3)*3, 14+Math.sin(t*.3)*2.5, 1.3, id('water'));
          m.paintCells(14,2,22,8,id('gravel')); m.paintCells(2,2,11,9,id('tatami')); m.paintCells(2,9,11,10,id('engawa'));
          const W=st.walls, wall=(a,b,c,d)=>W.push({x1:a,y1:b,x2:c,y2:d,mat:'wood',th:.15});
          wall(2,2,11,2); wall(11,2,11,9); wall(2,9,2,2); wall(2,9,5,9); wall(7,9,11,9);
          st.doors.push({x:5,y:9,o:'h',type:'shoji'},{x:6,y:9,o:'h',type:'shoji'},{x:11,y:5,o:'v',type:'shoji'});
          const o=(t,x,y,r=0,s=1,v)=>st.objects.push({t,x,y,r,s,v:v??(x*13+y*7|0),f:0});
          o('chabudai',6.5,5.5); o('zabuton',5.6,5.5); o('zabuton',7.4,5.5); o('byobu',6.5,3); o('katana',9.8,7.8); o('bonsai',3,3); o('taiko',9.6,3.6); o('chochin',3,8); o('komodaru',3.4,6.5);
          o('torii',18,11.5); o('stepping',18,9.6,1.57); o('torou',16,6.5); o('torou',20,6.5); o('mossrock',16.5,4); o('mossrock',19.5,3.5,1,1.4); o('mossrock',17.8,5.2,2,.8);
          o('sakura',26,4); o('maple',13,15); o('jpine',24,9); o('bamboo',2,13); o('bamboo',3.6,14.2); o('bamboo',1.8,15.6); o('bamboo',4,16.6);
          o('redbridge',21,14,1.57); o('koi',24,15); o('koi',20.5,16); o('sakura',8,15); o('maple',10,18);
          st.roofs.push({x0:2,y0:2,x1:11,y1:9,mat:'kawara'}); m.map.layers[0].struct = st; m.structChanged(); }""")
        # roofs on a separate render: copper + hiwada
        await pg.evaluate("() => { const st=__md.map.struct; st.roofs.push({x0:24,y0:16,x1:29,y1:19,mat:'copper'},{x0:12,y0:17,x1:16,y1:20,mat:'hiwada'}); __md.structChanged(); }")
        for nm,opt in [('jp_day',"{}"),('jp_open',"{top:false}"),('jp_night',"{tod:'night',top:false}"),('jp_autumn',"{season:'autumn'}"),('jp_winter',"{season:'winter'}"),('jp_spring',"{season:'spring'}")]:
            d = await pg.evaluate(f"() => __md.renderFull(__md.map,48,false,{opt}).toDataURL()")
            open(nm+'.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.click('#stampTabs button[data-cat=japan]'); await pg.wait_for_timeout(400)
        print('japan stamps', await pg.evaluate("() => document.querySelectorAll('#stamps .stp').length"))
        await pg.locator('#stamps').screenshot(path='jp_panel.png')
        print('errors', errs); await b.close()
asyncio.run(main())
