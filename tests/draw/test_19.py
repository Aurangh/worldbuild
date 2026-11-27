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
          m.paintCells(0,0,30,20,id('rock')); m.paintCells(1,1,14,10,id('flag')); m.paintCells(16,1,29,10,id('flag')); m.paintCells(1,12,29,19,id('flag'));
          for(let i=0;i<20;i++) m.paintCircle(24+Math.random()*4,15+Math.random()*3,.9,id('lava'));
          const W=st.walls, wall=(a,b,c,d)=>W.push({x1:a,y1:b,x2:c,y2:d,mat:'stone',th:.25});
          for (const [x0,y0,x1,y1] of [[1,1,14,10],[16,1,29,10],[1,12,29,19]]){ wall(x0,y0,x1,y0); wall(x1,y0,x1,y1); wall(x1,y1,x0,y1); wall(x0,y1,x0,y0); }
          const o=(t,x,y,r=0,extra={})=>st.objects.push({t,x,y,r,s:1,v:3,f:0,...extra});
          o('torch',7.5,1.4); o('candle'in{}?'x':'altar',4,5); o('lantern',22.5,5.5); o('bullseye',2,15.5,0); o('torch',12,18.6,0,{off:1}); o('brazier',8,15.5);
          m.map.tod='night'; m.structChanged(); }""")
        await pg.select_option('#todSel','night'); await pg.wait_for_timeout(300)
        for rules in ['35','5e']:
            await pg.select_option('#lightRules', rules); await pg.wait_for_timeout(300)
            d = await pg.evaluate("() => __md.renderFull(__md.map,40,false,{tod:'night'}).toDataURL()")
            open(f'light_{rules}.png','wb').write(base64.b64decode(d.split(',')[1]))
        await pg.check('#showRanges'); await pg.wait_for_timeout(300); await pg.screenshot(path='light_rings.png')
        # select the lantern and switch it off via the light row, then preset change
        await pg.keyboard.press('v')
        x,y = await pg.evaluate("""() => { const r=document.getElementById('view').getBoundingClientRect(); const t=document.getElementById('mapCanvas').style.transform; const m=t.match(/translate\\(([-\\d.]+)px, ?([-\\d.]+)px\\) scale\\(([\\d.]+)\\)/); const vp=document.getElementById('mapCanvas').width/__md.map.cols; const z=+m[3]*vp; return [r.left+ +m[1]+22.5*z, r.top+ +m[2]+5.5*z]; }""")
        await pg.mouse.click(x,y); await pg.wait_for_timeout(200)
        print('light row:', await pg.is_visible('#lightRow'), await pg.input_value('#lightPreset'))
        await pg.select_option('#lightPreset','daylight'); await pg.wait_for_timeout(200)
        print('lantern now', await pg.evaluate("() => JSON.stringify(__md.map.struct.objects.find(o=>o.t==='lantern'))"))
        # packs toggle
        await pg.uncheck('#pk_japan'); await pg.wait_for_timeout(200)
        print('japan tab hidden:', await pg.evaluate("() => getComputedStyle(document.querySelector('#stampTabs button[data-cat=japan]')).display"), 'tatami swatch:', await pg.evaluate("() => !!document.querySelector('.tsw[data-i=\"'+__md.TERRAINS.findIndex(t=>t.key==='tatami')+'\"]')"))
        await pg.check('#pk_japan')
        await pg.wait_for_timeout(1800); await pg.reload(); await pg.wait_for_timeout(1500)
        print('reload rules', await pg.evaluate("() => [__md.map.rules, __md.map.struct.objects.find(o=>o.t==='lantern').lp]"))
        print('errors', errs); await b.close()
asyncio.run(main())
