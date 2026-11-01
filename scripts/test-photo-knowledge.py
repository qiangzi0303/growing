"""Photo import -> student archive -> actual companion instruction pipeline.

Uses ephemeral D1 and simulated vision/WebRTC; never calls a model or production API.
"""
import argparse,ast,json,re,uuid
from pathlib import Path
from playwright.sync_api import sync_playwright,expect

parser=argparse.ArgumentParser();parser.add_argument('--base',required=True);parser.add_argument('--output',required=True)
args=parser.parse_args();base=args.base.rstrip('/');assert base.startswith('http://127.0.0.1:')
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
repo=Path(__file__).resolve().parents[1]
tree=ast.parse((repo.parent/'app-design/companion-duck/tests/check_classroom.py').read_text(encoding='utf-8'))
mock=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='MOCK' for t in n.targets))
checks=[];errors=[]
def check(label,value=True):
    assert value,label
    checks.append(label)
def relocate_preview(route):
    response=route.fetch();source=response.text()
    # Exercise the packaged same-origin production path on an isolated loopback port.
    source=re.sub(r"  if\(\['localhost','127\.0\.0\.1'\]\.includes\(location\.hostname\)\)\{[^\n]+\}\n",'',source)
    route.fulfill(response=response,body=source)
def course_context(page):
    page.evaluate("window.dispatchEvent(new CustomEvent('duck:course-context',{detail:{id:'math:math-8b-10:add',title:'分式加减',subject:'math',mode:'learn',segments:['异分母先通分，减号后的分子整体变号。']}}))")
def record(frame):
    return frame.evaluate("JSON.parse(window.mockRTC.requests.filter(e=>e.type==='session.update').at(-1).session.instructions.split('\\n').at(-1))")

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
    ctx=browser.new_context(viewport={'width':1360,'height':1000});ctx.add_init_script(mock);ctx.route('**/course-duck.js*',relocate_preview)
    page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        page.set_content('<html><body style="background:white;padding:40px;font:30px Arial">1. 1/x - 1/(x+1) = (2x+1)/(x(x+1))</body></html>')
        image=out/'worksheet.jpg';page.screenshot(path=str(image),type='jpeg')
        response=ctx.request.post(base+'/api/auth/register',headers={'X-Growing-Client':'1'},data={'username':'archive_'+uuid.uuid4().hex[:10],'password':'Synthetic-Only-1987!','displayName':'拍照档案学生','role':'Student'})
        assert response.status==200;session=response.json()
        page.goto(base+'/#question-bank')
        expect(page.locator('[data-bank-work]')).to_be_visible()
        expect(page.locator('[data-students]')).to_contain_text('拍照档案学生')
        page.locator('[data-album]').set_input_files(str(image))
        expect(page.locator('[data-photos] li')).to_have_count(1)
        page.locator('[data-import]').click()
        expect(page.locator('[data-review-question]')).to_have_count(4)
        page.locator('.course-duck-launch').dblclick();page.get_by_role('button',name='学习档案',exact=True).click()
        card=page.locator('[data-knowledge-wrong]').first;expect(card).to_contain_text('拍照错题');expect(card).to_contain_text('通分后没有保留减号')
        card.locator('summary').click();expect(card).to_contain_text('把减法变成了加法')
        page.locator('.duck-knowledge').screenshot(path=str(out/'archive-desktop.png'))
        card.locator('details p').first.scroll_into_view_if_needed();expect(card.locator('details p').first).to_be_visible()
        page.locator('.duck-knowledge').screenshot(path=str(out/'archive-error-detail.png'))
        check('photo error, paper identity, grade and actual cause appear in learning archive')
        page.get_by_role('button',name='学习档案',exact=True).click();course_context(page)
        child=page.frame_locator('.course-duck-panel iframe');child.locator('#voice-toggle').click()
        duck=next(f for f in page.frames if 'companion-duck/index.html' in f.url)
        duck.wait_for_function('window.mockRTC.requests.some(e=>e.type===\'session.update\'&&e.session.instructions.includes(\'photo-grade-gap\'))',timeout=30000)
        data=record(duck);check('actual companion session receives the photo error for current topic',data['mistakeFocus'][0]['causeSource']=='photo-grade-gap' and data['mistakeFocus'][0]['status']=='needs-review')
        check('voice instructions distinguish student self-checks from AI grading',duck.evaluate("window.mockRTC.requests.filter(e=>e.type==='session.update').at(-1).session.instructions.includes('self-check')"))
        check('companion context excludes source images and full student answer','data:image' not in json.dumps(data) and 'studentAnswer' not in json.dumps(data))
        page.get_by_role('button',name='学习档案',exact=True).click()
        # Submit through the real form while the archive remains open, to verify automatic refresh.
        page.locator('[data-correction]').evaluate("form=>{form.elements.studentAnswer.value='订正：分子为 (x+1)-x=1。';form.requestSubmit()}")
        expect(page.locator('[data-knowledge-wrong]').first).to_contain_text('最近订正已通过',timeout=20000)
        duck.wait_for_function("(()=>{const e=window.mockRTC.requests.filter(e=>e.type==='session.update').at(-1);return e&&JSON.parse(e.session.instructions.split('\\n').at(-1)).mistakeFocus?.[0]?.status==='latest-correct'})()")
        check('saving correction refreshes open archive and active voice context without manual reload')
        check('original cause remains in corrected history',record(duck)['mistakeFocus'][0]['cause'].find('没有保留减号')>=0)
        page.set_viewport_size({'width':390,'height':844});page.locator('.duck-knowledge').screenshot(path=str(out/'archive-mobile.png'))
        page.locator('[data-knowledge-wrong] summary').first.click()
        page.locator('[data-knowledge-wrong] details p').first.scroll_into_view_if_needed()
        page.locator('.duck-knowledge').screenshot(path=str(out/'archive-mobile-detail.png'))
        check('mobile archive remains within viewport',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        # A native classroom uses the shipped bootstrap with an account-scoped native storage bridge.
        native=ctx.new_page();native.on('pageerror',lambda e:errors.append('native: '+str(e)))
        bootstrap=(repo/'app/src/main/assets/bootstrap.js').read_text(encoding='utf-8')
        native.add_init_script('''(()=>{const session=SESSION;const store=new Map([['growing-cloud-session-v1',JSON.stringify(session)],['growing-cloud-binding-v1',session.user.id]]);const ok=value=>JSON.stringify({ok:true,value});window.GrowingNative={cloudApiUrl:()=>location.origin,identityAccount:()=>session.user.id,get:k=>ok(store.get(k)??null),put:(k,v)=>{store.set(k,v);return ok(null);},keys:()=>ok([...store.keys()]),remove:k=>{store.delete(k);return ok(null);},clear:()=>{store.clear();return ok(null);},aiKey:()=>'',configureAi:()=>{}};})();'''.replace('SESSION',json.dumps(session))+bootstrap)
        native.goto(base+'/assets/web/app-design/math-course.html?chapter=math-8a-01');native.locator('.course-duck-launch').dblclick();native.get_by_role('button',name='学习档案',exact=True).click()
        expect(native.locator('[data-knowledge-wrong]').first).to_contain_text('最近订正已通过',timeout=20000)
        expect(native.locator('[data-knowledge-wrong]').first).to_contain_text('通分后没有保留减号')
        check('APK native classroom reads its authenticated cloud photo archive')
        native.close()
        response=ctx.request.post(base+'/api/auth/register',headers={'X-Growing-Client':'1'},data={'username':'archive_'+uuid.uuid4().hex[:10],'password':'Synthetic-Only-1987!','displayName':'另一位学生','role':'Student'})
        assert response.status==200;page.goto(base+'/#question-bank');page.reload();page.locator('.course-duck-launch').dblclick();page.get_by_role('button',name='学习档案',exact=True).click()
        expect(page.locator('.duck-knowledge h2')).to_contain_text('另一位学生');expect(page.locator('[data-knowledge-wrong]')).to_have_count(0)
        check('switching students does not expose the previous photo mistakes')
        check('no browser exceptions',not errors)
        print(json.dumps({'passed':len(checks),'errors':errors},ensure_ascii=False))
    finally:
        (out/'diagnostics.json').write_text(json.dumps({'url':page.url,'bankStatus':page.locator('[data-bank-status]').all_text_contents(),'archiveStatus':page.locator('.duck-knowledge').all_text_contents(),'photos':page.locator('[data-photos] li').count()},ensure_ascii=False,indent=2),encoding='utf-8')
        (out/'results.json').write_text(json.dumps({'checks':checks,'errors':errors,'voice':'simulated WebRTC; actual instructions inspected'},ensure_ascii=False,indent=2),encoding='utf-8')
        browser.close()
