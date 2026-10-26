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
        for group,count in [('space',17),('motion',16)]:
            frame.locator('[data-group="'+group+'"]').click()
            check(frame.locator('#word-list button').count()==count,'complete '+group+' vocabulary')
            ids = frame.locator('#word-list button').evaluate_all('(els)=>els.map(el=>el.dataset.word)')
            for word in ids:
                frame.locator('#word-list [data-word="'+word+'"]').click()
                check(frame.locator('#scene svg').get_attribute('data-word')==word,'select '+word)
                check(frame.locator('#sentence').inner_text() and frame.locator('#hint').inner_text(),'example and distinction '+word)
                # Every rendered scene is valid XML, with finite coordinates.
                markup=frame.locator('#scene').inner_html()
                ET.fromstring(markup)
                check(not any(s in markup for s in ['NaN','Infinity','undefined']), 'valid SVG '+word)
                frame.locator('#progress').evaluate('(el)=>{el.value=200;el.dispatchEvent(new Event("input",{bubbles:true}));}')
                before=frame.locator('#scene').inner_html()
                frame.click('#step')
                check(frame.locator('#scene').inner_html()!=before,'single-step '+word)
                frame.click('#play')
                check(frame.locator('#play').get_attribute('aria-pressed')=='true','start '+word)
                page.wait_for_timeout(70)
                frame.click('#play')
                check(frame.locator('#play').get_attribute('aria-pressed')=='false','pause '+word)
                frame.click('#reset')
                check(frame.locator('#progress').input_value()=='0','reset '+word)
                frame.locator('#progress').focus()
                page.keyboard.press('ArrowRight')
                check(frame.locator('#progress').input_value()=='1','keyboard timeline '+word)
        frame.select_option('#speed','2')
        frame.click('#next')
        check(frame.locator('#word').inner_text()=='walk','next wraps category')
        frame.click('#previous')
        check(frame.locator('#word').inner_text()=='sprint','previous wraps category')
        frame.click('#quiz-play')
        before=frame.locator('#quiz-scene').inner_html()
        page.wait_for_timeout(180)
        check(frame.locator('#quiz-scene').inner_html()!=before,'independent quiz animation')
        frame.click('#quiz-play')
        correct=frame.locator('#quiz-scene svg').get_attribute('data-word').replace('-',' ')
        frame.locator('#quiz-answers button').filter(has_text=correct).click()
        check('答对了' in frame.locator('#quiz-feedback').inner_text(),'quiz correct answer feedback')
        frame.click('#quiz-toggle')
        check(not frame.locator('#quiz-content').is_visible(),'quiz collapses')
        frame.click('#quiz-toggle')
        check(frame.locator('#quiz-content').is_visible(),'quiz reopens')
        with page.expect_download() as download_info:
            frame.locator('.atlas-link').click()
        download_info.value.save_as(str(out/'english-visual-atlas.svg'))
        atlas=ET.parse(out/'english-visual-atlas.svg')
        check(len(atlas.findall('.//{http://www.w3.org/2000/svg}svg'))==33,'downloadable atlas includes all 33 vector scenes')
        frame.locator('[data-group="space"]').click()
        frame.locator('#word-list [data-word="over"]').click()
        frame.locator('#progress').evaluate('(el)=>{el.value=500;el.dispatchEvent(new Event("input",{bubbles:true}));}')
        page.evaluate('scrollTo(0,0)')
        page.screenshot(path=str(out/'english-space-desktop.png'),full_page=True)
        frame.locator('[data-group="motion"]').click()
        frame.locator('#word-list [data-word="skip"]').click()
        page.evaluate('scrollTo(0,0)')
        page.screenshot(path=str(out/'english-motion-desktop.png'),full_page=True)
        for width in [768,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            check(frame.evaluate('document.documentElement.scrollWidth<=innerWidth'),'no overflow at '+str(width))
            box=frame.locator('#play').bounding_box()
            check(box['width']>40 and box['height']>=44,'usable playback controls '+str(width))
            frame.click('#help-open')
            check(frame.locator('#help').is_visible(),'help dialog '+str(width))
            frame.click('#help-close')
            if width==390:
                page.evaluate('scrollTo(0,0)')
                page.screenshot(path=str(out/'english-mobile.png'),full_page=True)
        context.set_offline(True)
        frame.click('#step')
        frame.locator('#word-list [data-word="run"]').click()
        check(frame.locator('#word').inner_text()=='run','offline vocabulary selection')
        context.set_offline(False)
        page.emulate_media(reduced_motion='reduce')
        check(frame.locator('#play').get_attribute('aria-pressed')=='false','reduced motion stays paused')
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
