"""Run desktop and touch typing flows without writing any student account data."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '.nmai/tmp/sentence-demo-preview/v3'
OUT.mkdir(parents=True, exist_ok=True)
URL = 'http://127.0.0.1:8796/app-design/english-sentence-demo.html?v=3'


def answer(page, text, next_task=True):
    page.locator('#typing-answer').fill(text)
    page.locator('#typing-answer').press('Space')
    assert page.locator('[data-action=next]').is_visible()
    if next_task:
        page.locator('[data-action=next]').press('Space')


def all_words(page, words):
    for word in words:
        answer(page, word['en'])
    assert page.locator('.exercise').get_attribute('data-phase') == 'sentence'


def screenshot(page, name):
    page.evaluate('document.fonts.ready')
    page.screenshot(path=str(OUT / (name + '.png')), full_page=True)


def check():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(URL)
        page.wait_for_selector('[data-action=start]')
        sentences = page.evaluate('SentenceDemo.sentences')
        prompts = page.evaluate('SentenceDemo.sentences.map(SentenceDemo.wordPrompts)')
        total_tasks = sum(len(words) + 1 for words in prompts)
        page.evaluate("localStorage.setItem('growing-english-course-v1:english-8a-02','protected-existing-record');localStorage.setItem('growing-unit-rewards-v1:english-8a-02','protected-reward')")
        before = page.evaluate('({...localStorage})')
        assert page.locator('.word-bank').count() == 0
        screenshot(page, 'desktop-preview')
        assert page.locator('.grammar-group').count() == 3
        assert page.locator('.phonetic').count() == len(prompts[0])
        page.keyboard.press('Space')
        assert page.evaluate('document.activeElement.id') == 'typing-answer'
        screenshot(page, 'desktop-empty')
        page.locator('#typing-answer').press('Enter')
        assert page.locator('#points').inner_text() == '0'
        page.locator('#typing-answer').fill('zz')
        assert 'wrong' in page.locator('#typing-answer').get_attribute('class')
        # Unsubmitted edits do not count as mistakes.
        answer(page, prompts[0][0]['en'], next_task=False)
        assert page.locator('#points').inner_text() == '1000'
        screenshot(page, 'desktop-correct')
        page.locator('[data-action=next]').press('Space')
        page.locator('#typing-answer').fill('looks')
        screenshot(page, 'desktop-error')
        page.locator('#typing-answer').press('Space')
        assert page.locator('#typing-answer').input_value() == 'looks'
        assert page.locator('#combo').inner_text() == '0'
        page.locator('#typing-answer').press('Backspace')
        assert 'correct' in page.locator('#typing-answer').get_attribute('class')
        page.locator('#typing-answer').press('Enter')
        assert page.locator('.feedback').inner_text() == 'Good'
        page.locator('[data-action=next]').press('Enter')
        all_words(page, prompts[0][2:])
        page.locator('#typing-answer').press_sequentially('I look forward to join the drama club.')
        page.locator('#typing-answer').press('Enter')
        assert '介词' in page.locator('.feedback').inner_text()
        page.locator('#typing-answer').fill('')
        page.locator('#typing-answer').press_sequentially(sentences[0]['en'])
        screenshot(page, 'desktop-sentence')
        page.locator('#typing-answer').press('Space')
        assert page.locator('#points').inner_text() == '7600'
        page.dispatch_event('#answer-form', 'submit')
        assert page.locator('#points').inner_text() == '7600'
        page.locator('[data-action=next]').press('Space')
        for index in range(1, 10):
            page.locator('[data-action=start]').click()
            if index == 1:
                page.locator('[data-action=reveal]').click()
                assert page.locator('.revealed-answer').inner_text() == prompts[index][0]['en']
                assert page.locator('[data-action=next]').count() == 0
                page.locator('[data-action=reveal]').click()
                assert page.locator('.revealed-answer').inner_text() == ''
            if index == 3:
                answer(page, prompts[index][0]['en'], next_task=False)
                earned = page.locator('#points').inner_text()
                combo = page.locator('#combo').inner_text()
                page.locator('[data-action=redo]').click()
                page.locator('#typing-answer').fill('wrong')
                page.locator('#typing-answer').press('Enter')
                page.locator('[data-action=reveal]').click()
                answer(page, prompts[index][0]['en'], next_task=False)
                assert page.locator('#points').inner_text() == earned
                assert page.locator('#combo').inner_text() == combo
                page.locator('[data-action=next]').click()
                all_words(page, prompts[index][1:])
            else:
                all_words(page, prompts[index])
            if index == 2:
                page.locator('[data-action=reveal]').click()
                screenshot(page, 'desktop-revealed')
                assert page.locator('[data-action=next]').count() == 0
            answer(page, sentences[index]['en'], next_task=False)
            page.locator('[data-action=next]').press('Space')
        assert page.locator('.result-list > li').count() == 10
        assert page.locator('#points').inner_text() == str(total_tasks * 1000 - 3400)
        assert page.locator('.result-metrics strong').nth(0).inner_text() == '7 / 10'
        assert page.locator('.result-status').nth(3).inner_text() == '独立完成'
        assert page.evaluate('({...localStorage})') == before
        screenshot(page, 'desktop-results')
        page.locator('[data-action=retry]').click()
        assert '（1/9）' in page.locator('.progress-line').inner_text()
        assert page.locator('#points').inner_text() == '0'
        assert page.locator('#combo').inner_text() == '0'
        # Check tablet sizing with the actual rendered font, then a real touch context.
        page.set_viewport_size({'width': 768, 'height': 1024})
        screenshot(page, 'tablet-preview')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        mobile = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, reduced_motion='reduce')
        phone = mobile.new_page()
        phone.on('pageerror', lambda error: errors.append(str(error)))
        phone.goto('http://127.0.0.1:8796/app-design/english-course.html?unit=english-8a-02')
        phone.get_by_role('link', name='句子闯关', exact=True).tap()
        phone.locator('.topic-list a').first.tap()
        phone.locator('[data-action=start]').tap()
        phone.locator('#typing-answer').tap()
        phone.evaluate('window.initialTypingInput = document.activeElement')
        phone.keyboard.insert_text('I ')
        assert phone.locator('[data-action=next]').is_visible()
        assert phone.evaluate('initialTypingInput === document.activeElement')
        phone.locator('[data-action=next]').tap()
        assert phone.evaluate('initialTypingInput === document.activeElement && initialTypingInput === document.querySelector("#typing-answer")')
        phone.locator('#typing-answer').dispatch_event('compositionstart')
        phone.locator('#typing-answer').fill('look')
        phone.locator('#typing-answer').press('Enter')
        assert phone.locator('[data-action=next]').count() == 0
        phone.locator('#typing-answer').dispatch_event('compositionend', {'data': 'look'})
        phone.locator('#typing-answer').press('Space')
        phone.locator('[data-action=next]').tap()
        assert '（3/9）' in phone.locator('.progress-line').inner_text()
        phone.reload()
        mobile_before = phone.evaluate('({...localStorage})')
        screenshot(phone, 'phone-preview')
        for index, item in enumerate(sentences):
            phone.locator('[data-action=start]').tap()
            if index == 0:
                phone.locator('#typing-answer').fill('Iz')
                screenshot(phone, 'phone-error')
            all_words(phone, prompts[index])
            phone.locator('#typing-answer').fill(item['en'])
            if index == 9:
                assert phone.evaluate('document.documentElement.scrollWidth <= innerWidth')
                assert phone.locator('.typing-mirror').bounding_box()['height'] > 100
                screenshot(phone, 'phone-long')
            phone.locator('#typing-answer').press('End')
            phone.keyboard.insert_text(' ')
            assert phone.locator('[data-action=next]').is_visible()
            phone.locator('[data-action=next]').tap()
        assert phone.locator('#points').inner_text() == str(total_tasks * 1000)
        assert phone.locator('#combo').inner_text() == str(total_tasks)
        assert phone.evaluate('({...localStorage})') == mobile_before
        screenshot(phone, 'phone-results')
        phone.locator('[data-action=restart]').tap()
        phone.locator('[data-action=start]').tap()
        phone.evaluate("window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices:()=>[{lang:'en-US'}],cancel:()=>{},speak:u=>{window.testSpeech=u;u.onerror()}}})")
        phone.locator('[data-action=speak]').tap()
        assert '未能完成' in phone.locator('.audio-status').inner_text()
        answer(phone, prompts[0][0]['en'])
        phone.evaluate('testSpeech.onerror()')
        assert phone.locator('.audio-status').inner_text() == ''
        assert phone.locator('#points').inner_text() == '1000'
        phone.get_by_role('link', name='返回 Unit 2', exact=True).tap()
        assert '比较不同的校园生活' in phone.locator('#lesson-title').inner_text()
        assert not errors, errors
        summary = {'status': 'PASS', 'tasksPerRound': total_tasks, 'checks': ['sentence-local counter, reset on next sentence', 'three reference toolbar buttons', 'IPA, word classes, grammar groups', 'space/Enter and Backspace correction', 'reveal remains an exercise, toggle to hide', 'redo keeps points/combo/independence', 'desktop mixed ten-sentence round', 'touch independent ten-sentence round', 'IME and mobile input-only space', 'same native editor and focus', 'old course/reward storage unchanged', 'speech failure and stale callback mock', 'classroom entry/return', '1440/768/390 screenshots'], 'pageErrors': errors, 'limits': ['No physical phone keyboard test', 'No human audio playback test', 'Local demo, no deployment']}
        (OUT / 'result.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
        browser.close()
        print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    check()
