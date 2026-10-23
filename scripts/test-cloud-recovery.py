"""Real browser/fetch recovery tests. Requires playwright and an installed Chrome.

Run: python scripts/test-cloud-recovery.py [--chrome PATH] [--output DIRECTORY]
Only the native bridge and server responses are fixtures; fetch/timers are real.
"""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import argparse
import json
import threading
import time

from playwright.sync_api import sync_playwright

args = argparse.ArgumentParser()
args.add_argument('--chrome', default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
args.add_argument('--output', type=Path)
options = args.parse_args()
repo = Path(__file__).resolve().parents[1]
checks = []
errors = []
state = {'mode': 'stall', 'calls': [], 'release': threading.Event()}
profile = {'id': '00000000-0000-4000-8000-000000000001', 'role': 'Student',
           'roleSelectionRequired': True, 'displayName': '旧账号测试', 'username': 'legacy'}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(repo / 'platform-web'), **kw)

    def log_message(self, *a):
        pass

    def do_GET(self):
        if not self.path.startswith('/api/'):
            return super().do_GET()
        state['calls'].append(self.path)
        mode = state['mode']
        if mode == 'disconnect':
            self.connection.close()
            return
        payload = json.dumps(profile).encode()
        if mode == 'stall':
            state['release'].wait(25)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        if mode == 'body-stall':
            self.wfile.flush()
            state['release'].wait(25)
        try:
            self.wfile.write(payload)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass


server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'


def check(name, passed=True):
    assert passed, name
    checks.append(name)


def open_page(browser, mode, cached=True):
    state.update(mode=mode, calls=[], release=threading.Event())
    context = browser.new_context(viewport={'width': 390, 'height': 844})
    context.add_init_script('window.GrowingNative={cloudApiUrl:()=>'+json.dumps(base)+',identityAccount:()=>""};'+
        ('localStorage.setItem("growing-cloud-session-v1",'+json.dumps(json.dumps({'token': 'test-only', 'user': profile}))+');' if cached else ''))
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/')
    return context, page


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=options.chrome, headless=True)
        ctx, page = open_page(browser, 'stall', cached=False)
        page.locator('#auth').wait_for(timeout=2000)
        check('Unlinked native account immediately sees login/role guidance without requesting cloud', not state['calls'])
        check('Legacy guidance explains login then role selection', '登录后选择学生或家长' in page.locator('#app').inner_text())
        ctx.close()

        for mode in ['stall', 'body-stall', 'disconnect']:
            started = time.monotonic()
            ctx, page = open_page(browser, mode)
            page.locator('#retry-startup').wait_for(timeout=16000)
            elapsed = time.monotonic() - started
            check(mode + ' returns an actionable error within the deadline', elapsed < 16)
            check(mode + ' never unlocks a pending role', page.locator('#start-course').count() == 0)
            check(mode + ' keeps cached session for retry', page.evaluate('!!localStorage.getItem("growing-cloud-session-v1")'))
            if mode == 'stall' and options.output:
                options.output.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(options.output / 'timeout-mobile.png'), full_page=True)
            state['mode'] = 'ok'
            state['release'].set()
            page.locator('#retry-startup').click()
            page.locator('#choose-role').wait_for()
            check(mode + ' reconnects and requires explicit role selection', page.locator('#choose-role select').input_value() == '')
            check(mode + ' has no mobile horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            ctx.close()

        ctx, page = open_page(browser, 'stall')
        page.locator('#startup-login').click()
        page.locator('#auth').wait_for()
        state['release'].set()
        page.wait_for_timeout(500)
        check('Late startup response cannot replace the requested login form', page.locator('#auth').count() == 1 and page.locator('#choose-role').count() == 0)
        ctx.close()
        check('No uncaught browser errors', not errors)
        browser.close()
finally:
    state['release'].set()
    server.shutdown()
    server.server_close()
print(json.dumps({'passed': len(checks), 'checks': checks}, ensure_ascii=False, indent=2))
