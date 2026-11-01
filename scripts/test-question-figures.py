"""Real browser/canvas checks against the isolated photo-review QA server."""
import argparse,base64,io,json,uuid
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
from playwright.sync_api import sync_playwright,expect

p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--output',required=True);args=p.parse_args()
assert args.base.startswith('http://127.0.0.1:')
out=Path(args.output);out.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
def check(name,ok):
    assert ok,name
    checks.append(name)
def decode(uri):return Image.open(io.BytesIO(base64.b64decode(uri.split(',')[1]))).convert('RGB')

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    context=browser.new_context(viewport={'width':1360,'height':960});page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        # Source dimensions match the mock's real diagram coordinates.
        page.set_content('<body style="padding:40px;background:white;font:28px Arial"><h1>Homework</h1><p>1. Fraction question</p><p>2. Geometry question</p><svg width="700" height="260"><path d="M30 240 L650 240 M30 240 L650 10 M30 240 L450 160 M450 160 L450 240 M450 160 L425 90" fill="none" stroke="black" stroke-width="3"/></svg></body>')
        page.screenshot(path=str(out/'input.jpg'),type='jpeg')
        r=context.request.post(args.base+'/api/auth/register',headers={'X-Growing-Client':'1'},data={'username':'fig_'+uuid.uuid4().hex[:12],'password':'Figure-Test-1987!','displayName':'题图测试','role':'Student'})
        assert r.status==200;session=r.json();student=session['user']['id']
        image='data:image/jpeg;base64,'+base64.b64encode((out/'input.jpg').read_bytes()).decode()
        r=context.request.post(args.base+'/api/question-bank/import',headers={'X-Growing-Client':'1'},data={'studentId':student,'requestId':str(uuid.uuid4()),'mode':'grade','pages':[image]})
        assert r.status==200;paper=r.json();q=paper['questions'][1]
        def state():return context.request.get(args.base+'/api/question-bank/questions/'+q['id']+'/review?studentId='+student).json()['question']
        original=state()
        page.goto(args.base+'/#question-bank');card=page.locator('.bank-question').nth(1)
        card.locator('.question-figures').scroll_into_view_if_needed()
        expect(card.locator('.question-figures img').first).to_be_visible()
        crop=decode(card.locator('.question-figures img').first.get_attribute('src'))
        source=decode(image);expected=source.crop((54,259,734,528))
        check('diagram contains actual source pixels in the selected region',crop.size==expected.size and max(ImageStat.Stat(ImageChops.difference(crop,expected)).mean)<3)
        check('unconfirmed AI crops always retain a visible original page containing every diagram',card.locator('.question-figures img').count()==2 and card.locator('.question-figures img').nth(1).get_attribute('src')==image)
        card.locator('[data-figure-zoom]').first.click();expect(page.locator('.question-figure-dialog img')).to_be_visible();page.locator('[data-figure-close]').click()
        check('source diagram opens at full size',True)
        card.locator('[data-review-open]').click();expect(page.locator('.photo-review-result .question-figures img').first).to_be_visible()
        check('the same real diagram appears beside the question in the workbench',page.locator('.photo-review-result .question-figures img').first.get_attribute('src')==card.locator('.question-figures img').first.get_attribute('src'))
        card.locator('[data-figure-edit]').click();dialog=page.locator('.question-figure-dialog')
        dialog.locator('[data-figure-reset]').click()
        frame=dialog.locator('.figure-selector');frame.scroll_into_view_if_needed();box=frame.bounding_box()
        page.mouse.move(box['x']+.1*box['width'],box['y']+.2*box['height']);page.mouse.down();page.mouse.move(box['x']+.5*box['width'],box['y']+.5*box['height'],steps=8);page.mouse.up()
        dialog.locator('[data-figure-add]').click();dialog.locator('[data-figure-save]').click();expect(dialog).to_have_count(0)
        expect(card.locator('.question-figures img')).to_be_visible();changed=state()
        check('pointer selection persists normalized source coordinates',len(changed['figures'])==1 and abs(changed['figures'][0]['x']-.1)<.01 and abs(changed['figures'][0]['height']-.3)<.01)
        check('figure changes preserve original question revision and grade',changed['revision']==original['revision'] and changed['grades']==original['grades'])
        card.locator('[data-figure-edit]').click()
        dialog.locator('[data-figure-upload]').set_input_files(str(Path(__file__).resolve().parents[1]/'app/src/main/assets/web/app-design/math-midterm-figures/q4-original.webp'))
        expect(dialog).to_have_count(0);expect(card.locator('.question-figures')).to_contain_text('补传原图')
        check('a real uploaded diagram replaces the crop without duplicating a question',state()['hasFigureImage']==1 and page.locator('.bank-question').count()==4)
        page.reload();expect(card.locator('.question-figures')).to_contain_text('补传原图')
        check('uploaded diagram survives reload',True)
        card.screenshot(path=str(out/'figure-desktop.png'))
        for width in [390,320]:
            page.set_viewport_size({'width':width,'height':844});card.locator('[data-figure-zoom]').click();expect(dialog.locator('img')).to_be_visible()
            check('diagram and zoom fit narrow screen '+str(width),page.evaluate('document.documentElement.scrollWidth<=innerWidth') and dialog.evaluate('(d)=>d.scrollWidth<=d.clientWidth+1'))
            dialog.screenshot(path=str(out/('figure-zoom-'+str(width)+'.png')));dialog.locator('[data-figure-close]').click()
        # Historical paper without sources: attach to the original id and restore evidence separately.
        page.set_viewport_size({'width':1360,'height':960})
        missing=paper['questions'][3];delete=context.request.get(args.base+'/__qa__/discard-source/'+paper['paperId']);assert delete.ok
        page.reload();last=page.locator('.bank-question').nth(3);expect(last.locator('.question-figures')).to_contain_text('原稿未保留')
        last.locator('[data-figure-edit]').click();expect(dialog.locator('[data-page-upload]')).to_be_visible()
        dialog.locator('[data-page-upload]').set_input_files(str(out/'input.jpg'));expect(dialog).to_have_count(0)
        last.locator('.question-figures').scroll_into_view_if_needed();expect(last.locator('.question-figures img')).to_be_visible()
        check('legacy source restoration keeps the original question and grade history',state()['id']==q['id'] and state()['grades']==original['grades'])
        # Verify shipped native portal assets with a token-based bridge and no cookies.
        native=browser.new_context(viewport={'width':1280,'height':800})
        native.add_init_script("window.GrowingNative={cloudApiUrl:()=>location.origin};localStorage.setItem('growing-cloud-session-v1',JSON.stringify("+json.dumps(session)+"));")
        native_page=native.new_page();native_page.goto(args.base+'/assets/web/cloud/index.html#question-bank')
        native_page.locator('.bank-question .question-figures').first.scroll_into_view_if_needed();expect(native_page.locator('.bank-question .question-figures img').first).to_be_visible()
        check('APK portal loads real diagrams with Bearer authentication and no session cookie',True);native.close()
        check('no browser exceptions',not errors)
        print(json.dumps({'passed':len(checks),'errors':errors},ensure_ascii=False))
    finally:
        (out/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8');browser.close()
