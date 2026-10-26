"""Browser and independent geometry checks for the imported four-centers lesson.

Default: temporary static server. --base URL --login-stdin: real protected Worker,
with {username,password} read from stdin and navigation inside the course frame.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
from pathlib import Path
import random
import threading
import sys
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--base')
parser.add_argument('--login-stdin', action='store_true')
parser.add_argument('--output', required=True)
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
repo = Path(__file__).resolve().parents[1]
server = None
if not args.base:
    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *unused):
            pass
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(repo / 'app/src/main/assets/web')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
    prefix = '/app-design/'
else:
    base, prefix = args.base.rstrip('/'), '/learn/app-design/'
credentials = json.load(sys.stdin) if args.login_stdin else None
errors, failures, external, checks = [], [], [], []

def check(condition, label):
    assert condition, label
    checks.append(label)

def distance(p, q):
    return math.hypot(p['x'] - q['x'], p['y'] - q['y'])

def close(a, b, label, tolerance=1e-7):
    check(math.isclose(a, b, rel_tol=tolerance, abs_tol=tolerance), label)

def verify_geometry(frame, points):
    data = frame.evaluate('(points)=>{P=points;render();return geometry();}', points)
    check(data is not None, 'nondegenerate geometry')
    a, b, c = [points[k] for k in 'ABC']
    # Definition-based checks, independent of the implementation formulas.
    for vertex in [b, c]:
        close(distance(data['O'], a), distance(data['O'], vertex), 'circumcenter equidistant from vertices')
    for u, v in [(a, b), (a, c), (b, c)]:
        i = data['I']
        normal_distance = abs((v['x']-u['x'])*(i['y']-u['y'])-(v['y']-u['y'])*(i['x']-u['x'])) / distance(u, v)
        close(normal_distance, data['r'], 'incenter equidistant from sides')
    for vertex, midpoint in [(a, data['Ma']), (b, data['Mb']), (c, data['Mc'])]:
        close(distance(vertex, data['G']), 2 * distance(data['G'], midpoint), 'centroid divides median 2:1')
    for vertex, u, v in [(a, b, c), (b, a, c), (c, a, b)]:
        h = data['H']
        dot = (h['x']-vertex['x'])*(v['x']-u['x'])+(h['y']-vertex['y'])*(v['y']-u['y'])
        close(dot, 0, 'altitude through orthocenter', 1e-6)
    close(distance(data['G'], data['H']), 2 * distance(data['O'], data['G']), 'Euler distance ratio')
    for coord in ['x', 'y']:
        close(data['G'][coord], (2*data['O'][coord]+data['H'][coord])/3, 'Euler collinearity')
    return data

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe', headless=True)
    context = browser.new_context(viewport={'width': 1366, 'height': 900}, has_touch=True)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: failures.append({'url': response.url, 'status': response.status}) if response.status >= 400 and (not credentials or '/learn/' in response.url) else None)
    def route_request(route):
        if not route.request.url.startswith(base):
            external.append(route.request.url)
            route.abort()
        else:
            route.continue_()
    context.route('**/*', route_request)
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
        frame.goto(base + prefix + 'math-explore-lab.html?chapter=math-8a-01')
        frame.locator('#experiments a[href="triangle-centers.html"]').click()
        frame.wait_for_selector('#board [data-v="A"]')
        check(frame.locator('.center-item').count() == 4, 'four centers available from triangle lab')
        check('r = 2S' in frame.locator('#infoFormula').inner_text(), 'formula available without CDN')
        for key, symbol in [('incenter', 'I'), ('circumcenter', 'O'), ('centroid', 'G'), ('orthocenter', 'H')]:
            frame.locator('[data-key="'+key+'"]').click()
            check(frame.locator('#board text').filter(has_text=symbol).count() > 0, 'show center ' + key)
        for shape in ['acute', 'right', 'obtuse', 'equilateral']:
            frame.select_option('#shape', shape)
            check({'acute': '锐角', 'right': '直角', 'obtuse': '钝角', 'equilateral': '等边'}[shape] in frame.locator('#liveData').inner_text(), 'classify ' + shape)
            points = frame.evaluate('P')
            data = verify_geometry(frame, points)
            if shape == 'right':
                close(distance(data['H'], points['B']), 0, 'right-triangle orthocenter at right-angle vertex')
            if shape == 'equilateral':
                frame.check('#tglEuler')
                check('方向不唯一' in frame.locator('#board').text_content(), 'equilateral Euler exception explained')
                for key in ['I', 'O', 'H']:
                    close(distance(data['G'], data[key]), 0, 'equilateral centers coincide')
        rng = random.Random(901)
        for _ in range(18):
            points = {k: {'x': rng.uniform(100, 900), 'y': rng.uniform(100, 600)} for k in 'ABC'}
            verify_geometry(frame, points)
        for points in [dict(A={'x': 200, 'y': 300}, B={'x': 500, 'y': 300}, C={'x': 800, 'y': 300}), dict(A={'x': 200, 'y': 300}, B={'x': 200, 'y': 300}, C={'x': 800, 'y': 300})]:
            check(frame.evaluate('(points)=>{P=points;render();return geometry();}', points) is None, 'degenerate triangle handled')
            check('退化' in frame.locator('#liveData').inner_text(), 'degenerate warning visible')
            check(not frame.locator('#board [cx="NaN"], #board [x1="NaN"]').count(), 'no invalid geometry rendered')
        frame.click('#resetBtn')
        before = frame.evaluate('P.A.x')
        location = frame.evaluate('()=>{const p=svg.createSVGPoint();p.x=P.A.x;p.y=P.A.y;const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};}')
        # getScreenCTM coordinates are local to the course frame.
        offset = page.locator('#course').bounding_box() if credentials else {'x': 0, 'y': 0}
        x, y = location['x']+offset['x'], location['y']+offset['y']
        page.mouse.move(x, y)
        page.mouse.down()
        page.mouse.move(x+30, y+15, steps=8)
        page.mouse.up()
        check(abs(frame.evaluate('P.A.x')-before) > 10, 'mouse drag changes geometry')
        frame.click('#stepBtn')
        value = frame.evaluate('P.A.x')
        frame.click('#demoBtn')
        page.wait_for_timeout(250)
        check(abs(frame.evaluate('P.A.x')-value) > 1, 'animation changes vertices')
        frame.click('#demoBtn')
        check(not frame.evaluate('demoRun'), 'pause stops animation')
        frame.click('#demoBtn')
        frame.click('#resetBtn')
        check(not frame.evaluate('demoRun') and frame.evaluate('P.A.x') == 500, 'reset stops playback and restores vertices')
        frame.locator('#quizHide').click()
        check(not frame.locator('#quiz').is_visible(), 'quiz collapses')
        frame.locator('#quizFab').click()
        check(frame.locator('#quiz').is_visible(), 'quiz reopens')
        frame.locator('#quizBody button').nth(1).click()
        check(frame.locator('#quizBody button').nth(1).is_disabled(), 'quiz provides feedback')
        frame.locator('#sidebar').evaluate('(el)=>el.scrollTop=0')
        page.screenshot(path=str(out/'triangle-centers-desktop.png'), full_page=True)
        frame.locator('#labBack').click()
        frame.wait_for_function('document.querySelector("#chapter")?.value === "math-8a-01"')
        check(frame.locator('#chapter').input_value() == 'math-8a-01', 'back returns to triangle lab')
        frame.select_option('#chapter', 'math-8a-02')
        check(frame.locator('.center-lab-link').count() == 0, 'four-center entry only in triangle chapter')
        frame.select_option('#chapter', 'math-8a-01')
        frame.locator('.center-lab-link').click()
        frame.wait_for_url('**/triangle-centers.html')
        frame.wait_for_selector('#board [data-v="A"]')
        page.set_viewport_size({'width': 390, 'height': 844})
        frame.goto(base + prefix + 'triangle-centers.html')
        frame.wait_for_selector('#board [data-v="A"]')
        check(frame.locator('#sidebar').evaluate('(el)=>el.getBoundingClientRect().right') <= 0, 'mobile starts with unobstructed canvas')
        frame.click('#menuBtn')
        frame.locator('[data-key="centroid"]').click()
        frame.locator('#vertexX').focus()
        value = frame.evaluate('P.A.x')
        page.keyboard.press('ArrowRight')
        close(frame.evaluate('P.A.x'), value+1, 'keyboard slider moves selected vertex')
        frame.click('#menuBtn')
        frame.wait_for_function('document.querySelector("#sidebar").getBoundingClientRect().right <= 0')
        location = frame.evaluate('()=>{const p=svg.createSVGPoint();p.x=P.A.x;p.y=P.A.y;const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};}')
        offset = page.locator('#course').bounding_box() if credentials else {'x': 0, 'y': 0}
        x, y = location['x']+offset['x'], location['y']+offset['y']
        value = frame.evaluate('P.A.x')
        cdp = context.new_cdp_session(page)
        cdp.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':x,'y':y}]})
        cdp.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':x+25,'y':y+10}]})
        cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})
        check(abs(frame.evaluate('P.A.x')-value)>10, 'touch drag changes geometry')
        context.set_offline(True)
        value = frame.evaluate('P.A.x')
        frame.click('#stepBtn')
        check(frame.evaluate('P.A.x') != value, 'offline interaction works')
        context.set_offline(False)
        page.screenshot(path=str(out/'triangle-centers-mobile.png'), full_page=True)
        check(frame.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'mobile has no horizontal overflow')
        check(not errors, 'no browser errors')
        check(not failures, 'no failed course resources')
        check(not external, 'no external network dependencies')
        print(json.dumps({'passed': len(checks), 'errors': errors, 'failedResources': failures, 'externalRequests': external}))
    finally:
        (out/'triangle-centers-results.json').write_text(json.dumps({'checks': checks, 'errors': errors, 'failedResources': failures, 'externalRequests': external}, ensure_ascii=False, indent=2), encoding='utf-8')
        context.close()
        browser.close()
        if server:
            server.shutdown()
