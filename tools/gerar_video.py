"""MP4 do hero para o celular: 1080², 30 fps, 4 peças x 7,6 s, fundo branco (entra com multiply).
uso: python tools/gerar_video.py  (servidor local em :8951)"""
import asyncio, subprocess, os
from playwright.async_api import async_playwright
W, H, FPS, TOTAL = 1080, 1080, 30, 4 * 5.2
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'video', 'hero.mp4')
async def main():
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-i', '-',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart',
        '-vf', 'scale=out_range=limited:out_color_matrix=bt709', '-color_range', 'tv', '-colorspace', 'bt709', OUT], stdin=subprocess.PIPE)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H + 400})
        await pg.goto(f'http://localhost:8951/?render&w={W}'); await pg.wait_for_function('window.__pronto')
        await pg.add_style_tag(content=f'#arteCv{{position:fixed!important;left:0;top:0;width:{W}px!important;height:{H}px!important;z-index:999;mix-blend-mode:normal!important}}body,.hero{{background:#fff!important}}.topo{{display:none}}')
        await pg.evaluate('__q(3)')
        await pg.screenshot(path=os.path.join(os.path.dirname(OUT), '..', 'img', 'hero-poster.png'), clip={'x': 0, 'y': 0, 'width': W, 'height': H})
        n = int(round(TOTAL * FPS))
        for i in range(n):
            await pg.evaluate(f'__q({i / FPS})')
            ff.stdin.write(await pg.screenshot(type='jpeg', quality=94, clip={'x': 0, 'y': 0, 'width': W, 'height': H}))
            if i % 100 == 0: print(i, '/', n, flush=True)
        await b.close()
    ff.stdin.close(); ff.wait()
    print('ok', os.path.getsize(OUT) // 1024, 'KB')
asyncio.run(main())
