"""Prints do hero em tempos fixos e da página em vários tamanhos.
uso: python tools/ver.py [url]  -> _ref/ver/*.png"""
import sys, os, asyncio
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8951/'
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '_ref', 'ver')
os.makedirs(OUT, exist_ok=True)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        await pg.goto(URL + '?render&w=800'); await pg.wait_for_function('window.__pronto')
        for t in (0.3, 0.7, 1.1, 1.6, 2.2, 4.6):
            await pg.evaluate(f'__q({t})')
            await pg.locator('#arteCv').screenshot(path=f'{OUT}/hero-{t}.png')
        for w, h, nome in ((1440, 900, 'pc'), (1366, 768, 'note'), (1920, 1080, 'fhd'), (390, 844, 'cel'), (320, 640, 'cel320'), (844, 390, 'deitado'), (768, 1024, 'tablet')):
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, has_touch=w < 900, is_mobile=w < 600)
            q = await ctx.new_page(); await q.goto(URL); await q.wait_for_timeout(2500)
            await q.screenshot(path=f'{OUT}/{nome}.png')
            ov = await q.evaluate('''[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1&&!e.closest('.faixa')&&getComputedStyle(e).position!=='fixed'}).map(e=>e.className||e.tagName).slice(0,8)''')
            await q.evaluate('document.querySelectorAll(".rev").forEach(e=>e.classList.add("vis"))')
            for y in range(0, 30000, 500):
                await q.evaluate(f'scrollTo(0,{y})'); await q.wait_for_timeout(60)
            await q.evaluate('scrollTo(0,0)'); await q.wait_for_timeout(1300)
            await q.screenshot(path=f'{OUT}/{nome}-full.png', full_page=True)
            print(nome, 'overflow:', ov, 'scrollW', await q.evaluate('document.documentElement.scrollWidth'))
            await ctx.close()
        await b.close()

asyncio.run(main())
