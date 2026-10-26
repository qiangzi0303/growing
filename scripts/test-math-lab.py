"""Real Chromium checks for every mathematics experiment and course entry.

Run with --output pointing to a project-local QA artifact directory.
No accounts, network services, or production data are used.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--chrome', default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
args.output.mkdir(parents=True, exist_ok=True)
checks, errors = [], []


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


server = ThreadingHTTPServer(('127.0.0.1', 0), partial(
    Handler, directory=str(repo / 'app/src/main/assets/web')))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
lab = base + '/app-design/math-explore-lab.html'


def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.chrome, headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 960})
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(lab)
        page.wait_for_selector('#experiments button')
        definitions = page.evaluate('''() => GrowingMathLab.experiments.map(e=>({
          id:e.id, chapter:e.chapter, name:e.name, controls:e.controls, answer:e.answer
        }))''')
        chapters = page.evaluate('() => GrowingMath.chapters.map(c=>({id:c.id,number:c.number}))')
        for chapter in chapters:
            page.select_option('#chapter', chapter['id'])
            for e in (e for e in definitions if e['chapter'] == chapter['number']):
                page.locator(f'[data-experiment="{e["id"]}"]').click()
                check(page.locator('#lab-title').inner_text() == e['name'], e['id'] + ': navigates')
                before = page.locator('#diagram').inner_html()
                for c in e['controls']:
                    for value in [c['min'], c['max']]:
                        page.locator('#input-' + c['key']).evaluate('''(el,v)=>{
                          el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));
                        }''', value)
                        check(float(page.locator('#value-' + c['key']).inner_text()) == value,
                              e['id'] + ':' + c['key'] + ': accepts ' + str(value))
                        check(not page.locator('#diagram').locator('parsererror').count(),
                              e['id'] + ': valid SVG')
                        check('NaN' not in page.locator('#diagram').inner_html(), e['id'] + ': finite drawing')
                page.click('#reset')
                check(page.locator('#diagram').inner_html() == before, e['id'] + ': reset restores scene')
                outside = page.evaluate('''() => [...document.querySelectorAll('#diagram text')]
                  .filter(el=>{const b=el.getBBox();return b.x < -2 || b.x+b.width > 722 || b.y < -2 || b.y+b.height > 362;})
                  .map(el=>el.textContent)''')
                check(not outside, e['id'] + ': SVG labels inside view ' + str(outside))
                control = max(e['controls'], key=lambda c: (c['max'] - c['min']) / c['step'])
                page.select_option('#animate-key', control['key'])
                page.click('#play')
                page.wait_for_function('old=>document.querySelector("#diagram").innerHTML!==old', arg=before)
                check(page.locator('#play').get_attribute('aria-pressed') == 'true', e['id'] + ': animation changes scene')
                page.click('#play')
                paused = page.locator('#diagram').inner_html()
                page.wait_for_timeout(80)
                check(page.locator('#diagram').inner_html() == paused, e['id'] + ': pause stops animation')
                page.click('#step')
                check(page.locator('#diagram').inner_html() != paused, e['id'] + ': single step updates')
                page.click(f'[data-answer="{e["answer"]}"]')
                check('预测正确' in page.locator('#feedback').inner_text(), e['id'] + ': quiz feedback')
                page.click('#random')
                for c in e['controls']:
                    value = float(page.locator('#value-' + c['key']).inner_text())
                    check(c['min'] <= value <= c['max'], e['id'] + ': random within bounds')
            entry = (base + '/fraction-ops/分式作战_一分钟学习版.html' if chapter['number'] == 10 else
                     base + '/app-design/math-course.html?chapter=' + chapter['id'])
            page.goto(entry)
            anchor = page.locator('a[href*="math-explore-lab.html"]').first
            check(anchor.is_visible(), chapter['id'] + ': classroom entry visible')
            anchor.click()
            page.wait_for_selector('#lab-title')
            check(page.locator('#chapter').input_value() == chapter['id'], chapter['id'] + ': entry opens matching unit')
            check(page.locator('#course-back').get_attribute('href') is not None, chapter['id'] + ': return link')
        page.goto(lab + '?chapter=math-8a-05&experiment=linear')
        page.locator('#lab-title').wait_for()
        page.screenshot(path=str(args.output / 'desktop-function.png'), full_page=True)
        page.click('#quiz-hide')
        check(page.locator('#quiz-open').is_visible(), 'quiz can collapse')
        page.click('#quiz-open')
        check(page.locator('#quiz').is_visible(), 'quiz can reopen')
        page.click('#about')
        check(page.locator('#about-dialog').is_visible(), 'explanation opens')
        page.keyboard.press('Escape')
        check(not page.locator('#about-dialog').is_visible(), 'explanation closes with Escape')
        page.locator('#input-k').focus()
        old = page.locator('#input-k').input_value()
        page.keyboard.press('ArrowRight')
        check(page.locator('#input-k').input_value() != old, 'range control supports keyboard')
        for width, height in [(768, 1024), (360, 800), (320, 740), (1024, 768)]:
            page.set_viewport_size({'width': width, 'height': height})
            for chapter in chapters:
                page.select_option('#chapter', chapter['id'])
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'),
                      f'{width}px {chapter["id"]}: no horizontal page overflow')
            if width == 360:
                page.select_option('#chapter', 'math-8b-10')
                page.locator('[data-experiment="fraction-equation"]').click()
                page.locator('#input-a').evaluate('el=>{el.value=1;el.dispatchEvent(new Event("input",{bubbles:true}));}')
                check('无解' in page.locator('#stats').inner_text(), 'mobile shows extraneous root rejection')
                page.screenshot(path=str(args.output / 'mobile-fraction.png'), full_page=True)
        page.emulate_media(reduced_motion='reduce')
        page.goto(lab)
        page.wait_for_selector('#lab-title')
        check(page.locator('#play').get_attribute('aria-pressed') == 'false', 'reduced motion starts without autoplay')
        context.set_offline(True)
        page.click('#step')
        check(page.locator('#diagram').inner_html() != '', 'loaded experiment works offline')
        check(not errors, 'no browser JavaScript errors')
        context.close()
        browser.close()
finally:
    server.shutdown()
    (args.output / 'browser-results.json').write_text(json.dumps({
        'checks': checks, 'errors': errors, 'count': len(checks)
    }, ensure_ascii=False, indent=2), encoding='utf-8')

print(f'PASS: {len(checks)} browser behavior checks across 11 chapters / {len(definitions)} experiments')
