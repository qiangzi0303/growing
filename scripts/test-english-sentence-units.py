"""Exercise real unit entry points, all topic rounds and a touch round in isolated storage."""
import json
import traceback
from pathlib import Path
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '.nmai/tmp/sentence-units'
BASE = 'http://127.0.0.1:8796/'
OUT.mkdir(parents=True, exist_ok=True)


def shot(page, name):
    page.evaluate('document.fonts.ready')
    page.screenshot(path=str(OUT / (name + '.png')), full_page=True)


def finish_sentence(page, sentence, mobile=False, reveal=False):
    page.locator('[data-action=start]').click()
    words = page.evaluate('(s)=>SentenceDemo.wordPrompts(s)', sentence)
    assert page.get_by_role('progressbar').get_attribute('aria-valuenow') == '0'
    page.evaluate('window.keptEditor=document.querySelector("#typing-answer")')
    for index, expected in enumerate([w['en'] for w in words] + [sentence['en']]):
        if reveal and index == 0:
            page.locator('[data-action=reveal]').click()
            page.locator('[data-action=reveal]').click()
        editor = page.locator('#typing-answer')
        editor.fill(expected)
        editor.press('Enter')
        assert page.locator('[data-action=next]').is_visible()
        assert page.get_by_role('progressbar').get_attribute('aria-valuenow') == str(index)
        if mobile:
            assert page.evaluate('keptEditor===document.querySelector("#typing-answer") && document.activeElement===keptEditor')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.locator('[data-action=next]').click()
        if index < len(words):
            assert page.evaluate('keptEditor===document.querySelector("#typing-answer")')
    return len(words) + 1


def check():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page()
        page.set_default_timeout(7000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + 'app-design/english-sentence-demo.html')
        units = page.evaluate('Object.values(SentenceDemo.units)')
        counts = {'units': 0, 'topics': 0, 'sentences': 0, 'tasks': 0}
        for unit in units:
            uid = unit['id']
            entry = 'word-ops-unit3/index.html' if unit['number'] == 3 else 'app-design/english-course.html?unit=' + uid
            page.goto(BASE + entry)
            link = page.get_by_role('link', name='句子闯关', exact=True)
            assert ('unit=' + uid) in link.get_attribute('href')
            link.click()
            assert page.locator('.topic-list a').count() == len(unit['topics'])
            assert ('Unit ' + str(unit['number'])) in page.locator('h1').inner_text()
            if unit['number'] in (1, 3):
                shot(page, 'desktop-unit-' + str(unit['number']))
            chooser = page.url
            counts['units'] += 1
            for tindex, topic in enumerate(unit['topics']):
                if tindex:
                    page.goto(chooser)
                page.locator('.topic-list a').nth(tindex).click()
                selected = page.evaluate('SentenceDemo.getPractice(new URLSearchParams(location.search).get("unit"),new URLSearchParams(location.search).get("topic"))')
                assert selected['unit']['id'] == uid and selected['topic']['id'] == topic['id']
                sentences = selected['sentences']
                assert page.locator('.back-link').get_attribute('href') == selected['backHref']
                page.evaluate('(id)=>{localStorage.setItem("growing-english-course-v1:"+id,"protected-existing-record");localStorage.setItem("growing-unit-rewards-v1:"+id,"protected-reward")}', uid)
                before = page.evaluate('({...localStorage})')
                total = 0
                for index, sentence in enumerate(sentences):
                    total += finish_sentence(page, sentence, reveal=tindex == 0 and index == 0)
                assert page.locator('.result-list > li').count() == 10
                assert page.locator('#points').inner_text() == str(total * 1000 - (1000 if tindex == 0 else 0))
                assert page.evaluate('({...localStorage})') == before
                if tindex == 0:
                    assert page.locator('.result-metrics strong').first.inner_text() == '9 / 10'
                    page.locator('[data-action=retry]').click()
                    assert page.locator('#points').inner_text() == '0'
                    assert page.locator('.prompt').inner_text() == sentences[0]['zh']
                    finish_sentence(page, sentences[0])
                    assert page.locator('.result-list > li').count() == 1
                    page.locator('[data-action=restart]').click()
                else:
                    page.locator('[data-action=restart]').click()
                assert page.locator('#points').inner_text() == '0'
                assert page.locator('.prompt').inner_text() == sentences[0]['zh']
                assert page.evaluate('({...localStorage})') == before
                counts['topics'] += 1
                counts['sentences'] += 10
                counts['tasks'] += total
                print(json.dumps({'unit': uid, 'topic': topic['id'], 'status': 'PASS'}), flush=True)
            # A return must remain usable with actual restored course data.
            page.evaluate('(id)=>{localStorage.removeItem("growing-english-course-v1:"+id);localStorage.removeItem("growing-unit-rewards-v1:"+id)}', uid)
            page.locator('.back-link').click()
            assert entry.split('?')[0] in page.url
            assert page.get_by_role('link', name='句子闯关', exact=True).is_visible()

        for query in ({'unit': 'english-8b-01', 'topic': 'reading'}, {'unit': '__proto__'}, {'unit': 'constructor', 'topic': 'reading'}, {'unit': 'english-8a-02', 'topic': 'missing'}):
            page.goto(BASE + 'app-design/english-sentence-demo.html?' + urlencode(query))
            assert page.get_by_role('heading', name='暂时无法开始练习').is_visible()
            assert page.locator('#typing-answer').count() == 0

        (OUT / 'desktop-result.json').write_text(json.dumps({'status': 'PASS', **counts, 'pageErrors': errors}, ensure_ascii=False, indent=2), encoding='utf-8')

        phone_context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        phone = phone_context.new_page()
        phone.on('pageerror', lambda error: errors.append(str(error)))
        phone.goto(BASE + 'app-design/english-sentence-demo.html?unit=english-8a-08')
        shot(phone, 'phone-unit-8')
        phone.locator('.topic-list a').nth(2).tap()
        phone.wait_for_url('**topic=when-while')
        phone.wait_for_selector('[data-action=start]')
        selected = phone.evaluate('SentenceDemo.getPractice("english-8a-08","when-while")')
        mobile_before = phone.evaluate('({...localStorage})')
        for index, sentence in enumerate(selected['sentences']):
            if index == 9:
                shot(phone, 'phone-long-preview')
            finish_sentence(phone, sentence, mobile=True)
        assert phone.locator('.result-list > li').count() == 10
        assert phone.evaluate('({...localStorage})') == mobile_before
        shot(phone, 'phone-results')
        assert not errors, 'Unexpected browser errors; see error report'
        result = {'status': 'PASS', **counts, 'mobileSentences': 10, 'pageErrors': errors,
                  'checks': ['all real classroom entry/return links', 'all topic rounds', 'retry and restart keep selected unit/topic',
                             'sentence-local progress', 'isolated old storage remains unchanged', 'invalid route handling',
                             'touch editor node and focus', '390px long sentences'],
                  'limits': ['no physical phone keyboard test', 'no human audio listening', 'not deployed']}
        (OUT / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        browser.close()
        print(json.dumps(result, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    try:
        check()
    except Exception:
        (OUT / 'error.txt').write_text(traceback.format_exc(), encoding='utf-8')
        print('FAIL: .nmai/tmp/sentence-units/error.txt', flush=True)
        raise SystemExit(1)
