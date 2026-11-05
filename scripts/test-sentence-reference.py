"""Regression checks for the public reference's sentence-local task flow."""
from playwright.sync_api import sync_playwright

URL = 'http://127.0.0.1:8796/app-design/english-sentence-demo.html'


def check():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.goto(URL)
        assert '（1/9）' in page.locator('.progress-line').inner_text()
        assert page.get_by_role('progressbar').get_attribute('aria-valuemax') == '9'
        page.keyboard.press('Space')
        assert page.locator('.support-actions button').all_text_contents() == ['播放发音', '提交', '显示答案']
        page.locator('[data-action=reveal]').click()
        assert page.locator('[data-action=reveal]').inner_text() == '隐藏答案'
        assert page.locator('[data-action=next]').count() == 0
        assert page.get_by_role('progressbar').get_attribute('aria-valuenow') == '0'
        page.locator('[data-action=reveal]').click()
        assert page.locator('.revealed-answer').inner_text() == ''
        page.locator('#typing-answer').fill('I')
        page.locator('#typing-answer').press('Space')
        assert page.locator('.support-actions button').all_text_contents() == ['播放发音', '下一题', '重答']
        assert page.get_by_role('progressbar').get_attribute('aria-valuenow') == '0'
        points = page.locator('#points').inner_text()
        page.locator('[data-action=redo]').click()
        page.locator('#typing-answer').fill('I')
        page.locator('#typing-answer').press('Enter')
        assert page.locator('#points').inner_text() == points
        page.locator('[data-action=next]').press('Space')
        assert '（2/9）' in page.locator('.progress-line').inner_text()
        words=page.evaluate('SentenceDemo.wordPrompts(SentenceDemo.sentences[0])')
        for word in words[1:]:
            page.locator('#typing-answer').fill(word['en'])
            page.locator('#typing-answer').press('Space')
            page.locator('[data-action=next]').press('Space')
        assert '（9/9）' in page.locator('.progress-line').inner_text()
        assert page.get_by_role('progressbar').get_attribute('aria-valuenow') == '8'
        page.locator('#typing-answer').fill(page.evaluate('SentenceDemo.sentences[0].en'))
        page.locator('#typing-answer').press('Enter')
        assert page.get_by_role('progressbar').get_attribute('aria-valuenow') == '8'
        page.locator('[data-action=next]').press('Space')
        assert '（1/8）' in page.locator('.progress-line').inner_text()
        assert page.get_by_role('progressbar').get_attribute('aria-valuenow') == '0'
        # Redo is practice only: both word and sentence replays keep earned statistics.
        page.reload()
        page.keyboard.press('Space')
        page.locator('#typing-answer').fill('I')
        page.locator('#typing-answer').press('Enter')
        page.locator('[data-action=redo]').click()
        page.locator('#typing-answer').fill('zz')
        page.locator('#typing-answer').press('Enter')
        assert page.locator('#combo').inner_text() == '1'
        page.locator('[data-action=reveal]').click()
        page.locator('#typing-answer').fill('I')
        page.locator('#typing-answer').press('Enter')
        assert page.locator('#points').inner_text() == '1000'
        assert page.locator('#combo').inner_text() == '1'
        browser.close()
        print('PASS: sentence-local progress, three-button states, reveal toggle, redo without duplicate scoring, next-sentence reset')


if __name__ == '__main__':
    check()
