"""Real browser checks for standard math, editing, legacy conversion and offline imported records.

Pass an isolated test server with the controlled vision fixture; never point seed routes at production.
"""
import argparse
import json
import time
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser=argparse.ArgumentParser()
parser.add_argument('--base',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args()
base=args.base.rstrip('/')
assert base.startswith('http://127.0.0.1:'),'Use an isolated local QA server'
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];failed=[]
def check(label,value):
    assert value,label
    checks.append(label)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    context=browser.new_context(viewport={'width':1280,'height':960})
    page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:failed.append({'path':r.url,'status':r.status}) if r.status>=400 and '/api/' not in r.url else None)
    try:
        page.set_content('<html><body style="padding:60px;background:white;font:30px Arial"><h1>Math Paper</h1><p>1. Simplify (x²-1)/(x-1), x ≠ 1.</p></body></html>')
        page.screenshot(path=str(out/'input.jpg'),type='jpeg')
        response=context.request.post(base+'/api/auth/register',headers={'X-Growing-Client':'1'},data={'username':'fmt_'+uuid.uuid4().hex[:12],'password':'Format-Test-1987!','displayName':'数学排版验证','role':'Student'})
        assert response.status==200
        student=response.json()['user']
        seeded=context.request.get(base+'/__qa__/seed-legacy?studentId='+student['id'])
        assert seeded.ok
        legacy_id=seeded.json()['id']
        def delay_conversion(route):
            time.sleep(13)  # A real vision request can exceed the ordinary API deadline.
            route.continue_()
        page.route('**/api/question-bank/questions/*/format',delay_conversion,times=1)
        page.goto(base+'/#question-bank')
        expect(page.locator('.bank-question')).to_have_count(1,timeout=20000)
        card=page.locator('.bank-question')
        check('legacy record automatically converts to typeset fractions',card.locator('.katex').count()>0 and '旧记录尚未' not in card.inner_text())
        check('legacy conversion survives the ordinary 12 second API deadline',card.locator('.katex').count()>0)
        converted=context.request.get(base+'/api/question-bank/questions?studentId='+student['id']).json()['rows'][0]
        check('legacy record keeps identity and revision',converted['id']==legacy_id and converted['revision']==4 and converted['format']=='math-text-v1')
        page.locator('[data-album]').set_input_files(str(out/'input.jpg'))
        expect(page.locator('[data-photos] li')).to_have_count(1)
        page.locator('[data-import]').click()
        expect(page.locator('[data-bank-status]')).to_contain_text('已自动录入 2 题',timeout=20000)
        expect(page.locator('.bank-question')).to_have_count(3)
        check('photo preview clears on successful transcription',page.locator('[data-photos] img').count()==0)
        check('no image questions or original image controls',page.locator('.bank-question img,[data-original],.bank-original').count()==0)
        state=context.request.get(base+'/__qa__/state?studentId='+student['id']).json()
        check('new imports do not persist photo pages',state['imagePages']==0)
        check('fraction and radical have mathematical layout',page.locator('.bank-question math mfrac').count()>0 and page.locator('.bank-question math msqrt').count()>0)
        page.locator('[data-filter]').select_option('math-8b-10')
        expect(page.locator('.bank-question')).to_have_count(2)
        card=page.locator('.bank-question').first
        card.locator('summary').first.click()
        editor=card.locator('textarea[name=text]')
        editor.fill('计算 \\(\\frac{1}{x}+\\sqrt{x}\\)。')
        expect(card.locator('[data-edit-preview] .katex')).to_have_count(2)
        check('live formula preview renders a fraction',card.locator('[data-edit-preview] .math-inline').first.locator('math mfrac').count()==1)
        editor.focus();editor.evaluate('(el)=>el.setSelectionRange(el.value.length,el.value.length)')
        card.locator('[data-math-template=fraction]').click()
        check('fraction insert writes editable LaTeX',editor.input_value().endswith('\\(\\frac{a}{b}\\)'))
        editor.fill('计算 \\(\\frac{1}{x}+\\sqrt{x}\\)。')
        card.locator('button[type=submit]').click()
        expect(page.locator('.bank-question').first.locator('.badge')).to_have_text('已核对')
        page.reload();expect(page.locator('.bank-question')).to_have_count(3)
        check('saved question survives reload with formulas',page.locator('.bank-question').first.locator('.math-prose .katex').count()>0)
        page.screenshot(path=str(out/'photo-desktop.png'),full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        check('photo bank has no mobile overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.screenshot(path=str(out/'photo-mobile.png'),full_page=True)
        page.locator('[data-album]').set_input_files(str(out/'input.jpg'))
        expect(page.locator('[data-photos] li')).to_have_count(1)
        context.request.get(base+'/__qa__/mode/ok')
        page.locator('[data-import]').click()
        expect(page.locator('[data-bank-status]')).to_contain_text('未重复添加',timeout=20000)
        check('duplicate upload does not create more records',page.locator('.bank-question').count()==3)
        # A different rendered photo reaches the recognizer instead of the duplicate shortcut.
        context.request.get(base+'/__qa__/mode/failure')
        page.locator('[data-album]').set_input_files(str(out/'photo-mobile.png'))
        expect(page.locator('[data-photos] li')).to_have_count(1)
        page.locator('[data-import]').click()
        expect(page.locator('[data-bank-status]')).to_contain_text('照片仍保留',timeout=20000)
        check('failed recognition retains source for retry without image records',page.locator('[data-photos] img').count()==1 and page.locator('.bank-question').count()==3)
        context.request.get(base+'/__qa__/mode/ok')
        page.goto(base)
        page.wait_for_selector('#course')
        frame=page.locator('#course').element_handle().content_frame()
        frame.goto(base+'/learn/app-design/math-wrong-questions.html')
        expect(frame.locator('.question')).to_have_count(53)
        check('all 53 imported records are text, not pictures',frame.locator('.question img').count()==0)
        check('no invalid typesetting among imported records',frame.locator('.math-format-error,.katex-error').count()==0)
        check('source corruption remains explicit', '原题遮挡' in frame.locator('#q53').inner_text() and '不清楚' in frame.locator('#q29').inner_text())
        for width in [1280,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            check('no question-page overflow '+str(width),frame.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            frame.locator('#search').fill('37')
            expect(frame.locator('.question')).to_have_count(1)
            frame.locator('.question').screenshot(path=str(out/('imported-q37-'+str(width)+'.png')))
            frame.locator('#search').fill('')
        context.set_offline(True)
        frame.locator('#unit').select_option('math-8b-10')
        expect(frame.locator('.question')).to_have_count(26)
        check('offline imported questions keep formulas',frame.locator('.katex').count()>0)
        check('no browser exceptions',not errors)
        check('all browser resources loaded',not failed)
        print(json.dumps({'passed':len(checks),'errors':errors,'failedResources':failed},ensure_ascii=False))
    finally:
        (out/'browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors,'failedResources':failed},ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
