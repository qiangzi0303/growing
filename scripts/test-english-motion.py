"""Render actual SVG keyframes and a full-cycle animation for visual gait review."""
import argparse, json, threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--output',required=True)
args=parser.parse_args()
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
repo=Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(repo/'app/src/main/assets/web')))
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    page=browser.new_page(viewport={'width':1280,'height':800},device_scale_factor=1)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(f'http://127.0.0.1:{server.server_port}/app-design/english-visual-lab.html?group=motion')
    page.wait_for_selector('#scene [data-person]')
    assert page.locator('#scene [data-person]').count()==2
    page.locator('#reference').select_option('shuffle')
    assert page.locator('#scene svg').get_attribute('data-reference')=='shuffle'
    page.locator('#compare').uncheck()
    assert page.locator('#scene [data-person]').count()==1
    # Capture four articulated poses per word at comparable gait phases.
    ids=page.evaluate('GrowingEnglishVisual.words.filter(w=>w.group==="motion").map(w=>w.id)')
    page.add_style_tag(content='body{background:#f6f6ee}body>*{display:none!important}#review{display:block!important;width:max-content}#review svg{width:640px;height:350px;display:block}')
    page.evaluate('document.body.insertAdjacentHTML("beforeend",\'<div id="review"></div>\')')
    for batch in range(2):
        sheet=Image.new('RGB',(1280,8*195),'#f6f6ee');draw=ImageDraw.Draw(sheet)
        for row,id in enumerate(ids[batch*8:batch*8+8]):
            draw.text((12,row*195+3),id,fill='#29463d')
            for col,phase in enumerate([.05,.25,.55,.82]):
                page.evaluate('([id,phase])=>{let M=GrowingEnglishVisual;document.getElementById("review").innerHTML=M.svg(id,phase/M.motionProfiles[id].cycles,"review");}',[id,phase])
                path=out/f'{id}-{col}.png';page.locator('#review').screenshot(path=str(path))
                with Image.open(path) as img:sheet.paste(img.resize((320,175)),(col*320,row*195+20))
        sheet.save(out/f'keyframes-{batch+1}.png')
    # Same wall time for every card: cadence, ground speed and hops stay comparable.
    page.add_style_tag(content='#review{display:grid!important;grid-template-columns:repeat(4,320px);gap:0}#review section{height:200px;overflow:hidden}#review h3{font:16px system-ui;margin:3px 12px}#review svg{width:320px;height:175px}')
    frames=[]
    for i in range(48):
        page.evaluate('(t)=>{let M=GrowingEnglishVisual;document.getElementById("review").innerHTML=M.words.filter(w=>w.group==="motion").map(w=>`<section><h3>${w.word}</h3>${M.svg(w,t,"film-"+w.id)}</section>`).join("");}',i/48)
        path=out/'film-frame.png';page.screenshot(path=str(path))
        with Image.open(path) as img:frames.append(img.convert('RGB').copy())
    frames[0].save(out/'all-motion.gif',save_all=True,append_images=frames[1:],duration=83,loop=0)
    assert not errors,errors
    (out/'motion-results.json').write_text(json.dumps({'words':len(ids),'keyframes':64,'animationFrames':48,'browserErrors':errors}),encoding='utf8')
    browser.close()
server.shutdown()
print('Rendered 64 keyframes, 48 animation frames; comparison controls passed.')
