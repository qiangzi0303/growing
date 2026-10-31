"""Exercise every SVG vocabulary lesson, both catalog entries and mobile/offline UI."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import threading
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base')
parser.add_argument('--login-stdin',action='store_true')
parser.add_argument('--output',required=True)
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
repo = Path(__file__).resolve().parents[1]
credentials = json.load(sys.stdin) if args.login_stdin else None
server = None
if args.base:
    base, prefix = args.base.rstrip('/'), '/learn/app-design/'
else:
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *unused):
            pass
    server = ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(repo/'app/src/main/assets/web')))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base, prefix = f'http://127.0.0.1:{server.server_port}', '/app-design/'
checks, errors, failures, external = [], [], [], []
def check(condition,label):
    assert condition,label
    checks.append(label)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    context = browser.new_context(viewport={'width':1366,'height':1000},accept_downloads=True)
    page = context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:failures.append({'url':r.url,'status':r.status}) if r.status>=400 and (not credentials or '/learn/' in r.url) else None)
    def route_request(route):
        if not route.request.url.startswith(base):
            external.append(route.request.url)
            route.abort()
        else:
            route.continue_()
    context.route('**/*',route_request)
    try:
        if credentials:
            page.goto(base)
            page.locator('#auth input[name="username"]').fill(credentials['username'])
            page.locator('#auth input[name="password"]').fill(credentials['password'])
            page.locator('#auth button[type="submit"]').click()
            page.wait_for_selector('#course')
            frame = page.locator('#course').element_handle().content_frame()
        else:
            frame = page.main_frame
        for term in ['upper','lower']:
            frame.goto(base+prefix+'units.html?subject=english&term='+term)
            link = frame.locator('.english-animation-button')
            link.click()
            frame.wait_for_selector('#scene svg')
            check('term='+term in frame.locator('#catalog-back').get_attribute('href'),'return preserves '+term)
        check(frame.locator('#play,#step,#reset,#speed,#progress,#quiz-scene,#quiz-answers').count()==0,'learning has no playback controls or quiz')
        for group,count in [('space',17),('motion',16)]:
            frame.locator('[data-group="'+group+'"]').click()
            check(frame.locator('#word-list button').count()==count,'complete '+group+' vocabulary')
            ids=frame.locator('#word-list button').evaluate_all('(els)=>els.map(el=>el.dataset.word)')
            for word in ids:
                frame.locator('#word-list [data-word="'+word+'"]').click()
                check(frame.locator('#scene svg').get_attribute('data-word')==word,'select '+word)
                check(frame.locator('#sentence').inner_text() and frame.locator('#hint').inner_text(),'example and distinction '+word)
                markup=frame.locator('#scene').inner_html()
                ET.fromstring(markup)
                check(not any(s in markup for s in ['NaN','Infinity','undefined']),'valid SVG '+word)
                if group=='motion' or word in ['into','out-of','across','through','around','towards','away-from','over']:
                    page.wait_for_timeout(120)
                    check(frame.locator('#scene').inner_html()!=markup,'automatic animation '+word)
        frame.click('#next')
        check(frame.locator('#word').inner_text()=='walk','next wraps category')
        frame.click('#previous')
        check(frame.locator('#word').inner_text()=='sprint','previous wraps category')
        with page.expect_download() as download_info:
            frame.locator('.atlas-link').click()
        download_info.value.save_as(str(out/'english-visual-atlas.svg'))
        atlas=ET.parse(out/'english-visual-atlas.svg')
        check(len(atlas.findall('.//{http://www.w3.org/2000/svg}svg'))==33,'atlas contains 33 scenes')
        frame.locator('#word-list [data-word="skip"]').click()
        page.screenshot(path=str(out/'english-motion-desktop.png'),full_page=True)
        for width in [768,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            check(frame.evaluate('document.documentElement.scrollWidth<=innerWidth'),'no learning overflow '+str(width))
            # Query and measure in one evaluation: animation replaces these SVG nodes every frame.
            boxes=frame.evaluate("Array.from(document.querySelectorAll('#scene [data-person]'),e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};})")
            check(len(boxes)==2 and abs(boxes[0]['y']-boxes[1]['y'])<80 and boxes[1]['x']>boxes[0]['x']+50,'side by side characters '+str(width))
            if width<=390:
                check(frame.locator('#scene svg').get_attribute('viewBox')=='0 0 400 350','compact horizontal viewBox '+str(width))
                frame.locator('#scene').screenshot(path=str(out/('comparison-'+str(width)+'.png')))
            frame.click('#help-open')
            before=frame.locator('#scene').inner_html()
            page.wait_for_timeout(150)
            check(frame.locator('#scene').inner_html()==before,'help suspends animation '+str(width))
            frame.click('#help-close')
            page.wait_for_timeout(150)
            check(frame.locator('#scene').inner_html()!=before,'close help resumes animation '+str(width))
            if width==390:
                page.screenshot(path=str(out/'english-mobile.png'),full_page=True)
        frame.select_option('#reference','run')
        check(frame.locator('#scene svg').get_attribute('data-reference')=='run','change reference')
        frame.locator('#compare').uncheck()
        check(frame.locator('#scene [data-person]').count()==1,'disable comparison')
        frame.locator('#compare').check()
        context.set_offline(True)
        frame.locator('#word-list [data-word="run"]').click()
        check(frame.locator('#word').inner_text()=='run','offline word selection')
        context.set_offline(False)
        page.emulate_media(reduced_motion='reduce')
        frame.wait_for_function("document.getElementById('play-status').textContent==='自动慢速循环'")
        check(frame.locator('#play-status').inner_text()=='自动慢速循环','reduced motion slow loop')
        before=frame.locator('#scene').inner_html()
        page.wait_for_timeout(180)
        check(frame.locator('#scene').inner_html()!=before,'reduced motion still automatic')
        page.emulate_media(reduced_motion='no-preference')
        check(frame.locator('#quiz-scene,#quiz-answers').count()==0,'no question initialized in learning')
        frame.click('#quiz-link')
        frame.wait_for_selector('#quiz-answers button')
        check('english-visual-quiz.html' in frame.url and 'term=lower' in frame.url,'explicit navigation to quiz with term')
        check('word=run' in frame.locator('#learn-back').get_attribute('href'),'return link preserves original word')
        for group,count in [('motion',16),('space',17)]:
            frame.locator('[data-group="'+group+'"]').click()
            if group=='motion':
                page.screenshot(path=str(out/'english-motion-quiz-mobile.png'),full_page=True)
            seen=set()
            for index in range(count):
                svg=frame.locator('#quiz-scene svg')
                word=svg.get_attribute('data-word')
                check(word not in seen,'quiz covers '+word)
                seen.add(word)
                check(frame.locator('#quiz-answers button').count()==3,'three choices '+word)
                check(frame.locator('#quiz-scene text').count()==0 and word not in svg.get_attribute('aria-label'),'no answer hint '+word)
                before=frame.locator('#quiz-scene').inner_html()
                if group=='motion':
                    page.wait_for_timeout(120)
                    check(frame.locator('#quiz-scene').inner_html()!=before,'quiz loops '+word)
                correct=word.replace('-',' ')
                buttons=frame.locator('#quiz-answers button')
                if index%2==0:
                    buttons.filter(has_text=__import__('re').compile('^'+correct+'$')).click()
                    check('答对了' in frame.locator('#quiz-feedback').inner_text(),'correct feedback '+word)
                else:
                    for button in buttons.all():
                        if button.inner_text()!=correct:
                            button.click()
                            break
                    check('正确表达' in frame.locator('#quiz-feedback').inner_text(),'incorrect feedback '+word)
                check(frame.locator('#quiz-answers button:disabled').count()==3,'answer locks choices '+word)
                page.wait_for_timeout(80)
                check(svg.get_attribute('data-word')==word,'no automatic next question '+word)
                frame.click('#quiz-next')
        for width in [768,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            check(frame.evaluate('document.documentElement.scrollWidth<=innerWidth'),'no quiz overflow '+str(width))
        page.screenshot(path=str(out/'english-quiz-mobile.png'),full_page=True)
        frame.click('#learn-back')
        frame.wait_for_selector('#scene svg')
        check(frame.locator('#word').inner_text()=='run' and 'term=lower' in frame.url,'return restores learning word and term')
        check(frame.locator('#quiz-scene,#quiz-answers').count()==0,'return keeps learning free of quiz')
        before=frame.locator('#scene').inner_html()
        page.wait_for_timeout(150)
        check(frame.locator('#scene').inner_html()!=before,'return resumes learning automatically')
        frame.click('#catalog-back')
        frame.wait_for_selector('.english-animation-button')
        check('term=lower' in frame.url,'return to originating catalog')
        for subject in ['math','physics']:
            frame.goto(base+prefix+'units.html?subject='+subject)
            frame.wait_for_selector('.unit-row')
            check(frame.locator('.english-animation-button').count()==0,'English entry isolated from '+subject)
        check(not errors,'no JavaScript errors')
        check(not failures,'no failed lesson resources')
        check(not external,'no external lesson dependencies')
        print(json.dumps({'passed':len(checks),'errors':errors,'failedResources':failures,'externalRequests':external}))
    finally:
        (out/'results.json').write_text(json.dumps({'checks':checks,'errors':errors,'failedResources':failures,'externalRequests':external},ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
        if server:
            server.shutdown()
