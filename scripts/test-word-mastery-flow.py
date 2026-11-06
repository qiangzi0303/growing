"""Exercise word grading with isolated storage and mocked AI; never use student accounts."""
import json
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / '.nmai/tmp/word-oral-flow'
BASE = 'http://127.0.0.1:8796/'
OUT.mkdir(parents=True, exist_ok=True)
GOOD = {'meaningPassed': True, 'posPassed': True, 'feedback': '词义与词类正确。', 'errors': []}
BAD = {'meaningPassed': True, 'posPassed': False, 'feedback': '请再回忆词类。', 'errors': ['词类尚未掌握。']}


def check():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='msedge', headless=True)
        context = browser.new_context(viewport={'width': 1200, 'height': 1000}, reduced_motion='reduce')
        errors, checks, requests = [], [], []
        mode = 'good'

        def mock(route):
            body = route.request.post_data_json
            assert 'studentAnswer' in body['messages'][-1]['content']
            assert route.request.headers.get('authorization') == 'Bearer fake-account-key'
            requests.append(mode)
            if mode == 'network':
                route.abort('failed')
                return
            value = GOOD if mode == 'good' else BAD if mode == 'bad' else {'meaningPassed': 'true'}
            route.fulfill(status=200, content_type='application/json', body=json.dumps({'choices': [{'finish_reason': 'stop', 'message': {'content': json.dumps(value, ensure_ascii=False)}}]}))

        context.route('https://api.deepseek.com/chat/completions', mock)
        source = ROOT / 'growing/app/src/main/assets/web/app-design'
        context.route(BASE + 'course-ai.js', lambda r: r.fulfill(path=str(source / 'course-ai.js'), content_type='application/javascript'))
        context.route(BASE + 'course-ai.css', lambda r: r.fulfill(path=str(source / 'course-ai.css'), content_type='text/css'))
        context.route('**/api/realtime/config', lambda r: r.fulfill(status=200, content_type='application/json', body='{"configured":false}'))
        shell_html = '''<!doctype html><html><head><meta charset="utf-8"></head><body>
        <details id="account-menu" open><summary>我的账户</summary><p id="account-identity">Isolated test account</p></details>
        <iframe id="course" style="width:100%;height:1000px;border:0" src="/app-design/english-course.html?unit=english-8a-01&node=word:honest"></iframe>
        <script>
        window.testAccount='a';window.testAccounts={a:{},b:{}};
        window.GrowingCloud={storage:()=>{const owner=testAccount;if(!owner)throw Error('logged out');return {
          getItem:k=>{if(testAccount!==owner)throw Error('expired');return testAccounts[owner][k]||null;},
          setItem:(k,v)=>{if(testAccount!==owner)throw Error('expired');testAccounts[owner][k]=v;},
          removeItem:k=>{if(testAccount!==owner)throw Error('expired');delete testAccounts[owner][k];}
        };}};
        </script></body></html>'''
        context.route(BASE + 'word-flow-shell.html', lambda r: r.fulfill(status=200, content_type='text/html', body=shell_html))
        shell = context.new_page()
        shell.on('pageerror', lambda e: errors.append(str(e)))
        shell.goto(BASE + 'word-flow-shell.html')
        shell.add_script_tag(path=str(ROOT / 'growing/cloudflare/public/api-settings.js'))
        shell.locator('#open-api-settings').click()
        shell.locator('#course-ai-config input[name=apiKey]').fill('fake-account-key')
        shell.locator('#course-ai-config button[type=submit]').click()
        expect(shell.locator('.course-ai-state').first).to_have_text('已配置密钥')
        shell.locator('#close-api-settings').click()
        page = shell.query_selector('#course').content_frame()
        page.on('pageerror', lambda e: errors.append(str(e)))

        def goto(unit, word):
            url = f'word-ops-unit3/index.html?node=word:{word}' if unit == 3 else f'app-design/english-course.html?unit=english-8a-{unit:02}&node=word:{word}'
            page.goto(BASE + url)
            page.wait_for_selector('#english-course')

        def submit(selector, answer):
            form = page.locator(selector)
            form.locator('[name=answer]').fill(answer)
            form.locator('button[type=submit]').click()

        def oral(answer):
            submit('[data-word-oral]', answer)

        def key(unit):
            return 'wordops_8A_unit3' if unit == 3 else f'growing-english-course-v1:english-8a-{unit:02}'

        def read(unit):
            return page.evaluate('k=>JSON.parse(localStorage.getItem(k)||"null")', key(unit))

        def seed(unit, word):
            # Seed valid spelling evidence only; oral grading still uses the actual request path.
            page.evaluate('''({unit,id,key})=>{
                const legacy=unit===3,w=(legacy?UNIT3.words:GrowingEnglishVocabulary[unit]).find(w=>w.id===id);
                const d=WordMasteryRules.describe(w),practice={answers:Array(7).fill(d.word),pluralAnswer:d.plurals[0]||'',draft:''};
                const state=JSON.parse(localStorage.getItem(key)||'null')||(legacy?{}:{version:1,words:{},lessons:{},feynman:{}});
                if(legacy){state.wordRuns??={};state.wordRuns[id]={phase:'verify',answers:practice.answers,mastery:practice,seconds:15};}
                else state.words[id]={...state.words[id],practice};
                localStorage.setItem(key,JSON.stringify(state));
            }''', {'unit': unit, 'id': word, 'key': key(unit)})
            goto(unit, word)
            if unit != 3:
                page.locator('[data-action=recall]').click()
            expect(page.locator('.word-mastery')).to_have_attribute('data-stage', 'oral')

        def result():
            region = page.get_by_role('region', name='批改结果', exact=True)
            expect(region).to_be_visible()
            expect(region.get_by_role('heading')).to_have_count(0)
            expect(region.locator('.word-oral-checks p')).to_have_text(['拼写：✓', '词义：✓', '词类：✗' if mode == 'bad' else '词类：✓'])
            expect(region.get_by_text(BAD['feedback'] if mode == 'bad' else GOOD['feedback'], exact=True)).to_have_count(0)
            for mark in region.locator('.word-result-mark').all():
                correct = mark.inner_text() == '✓'
                expect(mark).to_have_accessible_name('正确' if correct else '错误')
                assert mark.evaluate('e=>getComputedStyle(e).color') == ('rgb(46, 125, 50)' if correct else 'rgb(189, 37, 37)')
            expect(region.locator('li')).to_have_text(BAD['errors'] if mode == 'bad' else [])
            expect(page.locator('[data-word-next]')).to_be_visible()

        # Real seven-answer flow, shared account setting and a retained failed result.
        page.locator('[data-action=recall]').click()
        for _ in range(7):
            submit('[data-word-recall]', 'honest')
        expect(page.locator('.word-mastery label')).to_have_text('说出词类以及中文意思')
        expect(page.locator('.word-mastery-progress')).to_have_text('拼写 7/7')
        assert page.locator('.word-mastery-progress').evaluate('e=>getComputedStyle(e).color') == 'rgb(46, 125, 50)'
        assert page.locator('.word-mastery-progress').evaluate('e=>Number(getComputedStyle(e).fontWeight)') >= 700
        assert page.locator('.word-mastery details,.word-mastery .course-ai-settings').count() == 0
        expect(page.locator('[data-word-oral] button[type=submit]')).to_have_text('提交')
        mode = 'bad'
        oral('诚实的，是动词')
        result()
        assert not read(1)['words']['honest'].get('protocol')
        expect(page.locator('.word-mastery h2')).to_have_text('honest')
        page.locator('[data-word-oral] textarea').fill('诚实的，是形容词')
        assert page.locator('.word-oral-result,[data-word-next]').count() == 0
        mode = 'malformed'
        oral('诚实的，是形容词')
        expect(page.locator('.word-mastery-status')).to_contain_text('格式不完整')
        assert page.locator('[data-word-next]').count() == 0
        mode = 'network'
        oral('诚实的，是形容词')
        expect(page.locator('.word-mastery-status')).to_contain_text('草稿和默写进度保留')
        mode = 'good'
        # Final-save failure retains correction, disables navigation and can be retried.
        page.evaluate('''()=>{window.savedSet=Storage.prototype.setItem;window.blockFinal=true;Storage.prototype.setItem=function(k,v){
            if(blockFinal&&k==='growing-english-course-v1:english-8a-01'&&JSON.parse(v).words.honest?.protocol==='word-mastery-v2')throw Error('test quota');
            return savedSet.call(this,k,v);
        };}''')
        oral('诚实的，是形容词')
        result()
        expect(page.locator('[data-word-next]')).to_be_disabled()
        page.evaluate('window.blockFinal=false')
        page.locator('[data-word-finish]').click()
        result()
        expect(page.locator('[data-word-next]')).to_be_enabled()
        assert read(1)['words']['honest']['protocol'] == 'word-mastery-v2'
        expect(page.locator('.word-mastery h2')).to_have_text('honest')
        page.locator('.word-mastery').screenshot(path=str(OUT / 'desktop-result.png'))
        page.locator('[data-word-next]').click()
        expect(page.locator('.word-name')).to_have_text('cheerful')
        checks.append('seven recalls; concise UI; account settings; failed/malformed/network results; edit invalidation; save failure retry; explicit next')

        # A failed oral answer can move on without awarding mastery.
        goto(4, 'shelf')
        page.locator('[data-action=recall]').click()
        for _ in range(7):
            submit('[data-word-recall]', 'shelf')
        expect(page.locator('.word-mastery')).to_have_attribute('data-stage', 'plural')
        submit('[data-word-plural]', 'shelves')
        mode = 'bad'
        oral('架子，是动词')
        result()
        page.locator('[data-word-next]').click()
        expect(page.locator('.word-name')).to_have_text('rose')
        assert not read(4)['words']['shelf'].get('protocol')
        checks.append('plural requirement retained; failed result may advance while remaining pending')

        # All ordinary classrooms share the new flow, including their final word.
        mode = 'good'
        for unit in (1, 2, 4, 5, 6, 7, 8):
            goto(unit, 'unused')
            last = page.evaluate('(n)=>GrowingEnglishVocabulary[n].at(-1).id', unit)
            seed(unit, last)
            oral('测试词义以及词类')
            result()
            expect(page.locator('[data-word-next]')).to_have_text('返回本单元')
            page.locator('[data-word-next]').click()
            expect(page.locator('.word-card').first).to_be_visible()
        checks.append('last word returns to current unit across all seven ordinary classrooms')

        # Legacy classroom must also read the account key and retain its result.
        goto(3, 'w2')
        seed(3, 'w2')
        rewards = read(3)['rewards']
        page.evaluate('''()=>{window.legacySavedSet=Storage.prototype.setItem;window.blockLegacy=true;Storage.prototype.setItem=function(k,v){
            if(blockLegacy&&k==='wordops_8A_unit3'&&JSON.parse(v).mastered?.w2?.protocol==='word-mastery-v2')throw Error('test quota');
            return legacySavedSet.call(this,k,v);
        };}''')
        oral('喂养，提供食物，是动词')
        result()
        expect(page.locator('[data-word-next]')).to_be_disabled()
        assert not read(3)['mastered'].get('w2')
        assert read(3)['rewards'] == rewards
        page.evaluate('window.blockLegacy=false')
        page.locator('[data-word-finish]').click()
        result()
        assert read(3)['mastered']['w2']['protocol'] == 'word-mastery-v2'
        expect(page.locator('.word-mastery h2')).to_have_text('feed')
        page.locator('[data-word-next]').click()
        expect(page.locator('#cardScene')).to_contain_text('钓鱼')
        checks.append('Unit 3 account settings, save failure rollback/retry, v2 mastery, retained feedback and explicit next')

        goto(3, 'w1')
        last = page.evaluate('UNIT3.words.at(-1).id')
        seed(3, last)
        shell.set_viewport_size({'width': 390, 'height': 844})
        page.locator('.word-mastery').screenshot(path=str(OUT / 'phone-oral.png'))
        oral('测试词义以及词类')
        result()
        expect(page.locator('[data-word-next]')).to_have_text('返回本单元')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        page.locator('.word-mastery').screenshot(path=str(OUT / 'phone-result.png'))
        page.locator('[data-word-next]').click()
        expect(page.locator('#libraryScene')).to_be_visible()
        checks.append('Unit 3 final word returns to its library; 390px layout')

        # Neither another account nor logout may fall back to unscoped settings.
        shell.evaluate("testAccount='b'")
        goto(1, 'caring')
        seed(1, 'caring')
        count = len(requests)
        oral('关心他人的，是形容词')
        expect(page.locator('.word-mastery-status')).to_contain_text('我的账户')
        assert len(requests) == count
        shell.evaluate('testAccount=null')
        oral('关心他人的，是形容词')
        expect(page.locator('.word-mastery-status')).to_contain_text('无法读取')
        assert len(requests) == count
        checks.append('other account and logout never reuse the saved account key')
        assert not errors, errors
        summary = {'status': 'PASS', 'checks': checks, 'mockedAIRequests': len(requests), 'pageErrors': errors, 'limits': ['Mocked AI only; no live service call', 'Phone viewport; no physical keyboard check']}
        (OUT / 'result.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
        browser.close()
        print(json.dumps(summary, ensure_ascii=False))


if __name__ == '__main__':
    try:
        check()
    except Exception:
        (OUT / 'error.txt').write_text(traceback.format_exc(), encoding='utf-8')
        print('FAIL: .nmai/tmp/word-oral-flow/error.txt')
        raise SystemExit(1)
