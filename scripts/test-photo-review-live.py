"""Send a synthetic two-question worksheet through the configured vision service.

Only the isolated loopback QA server is accepted. No production account/data is used.
"""
import argparse
import json
import uuid
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

parser=argparse.ArgumentParser()
parser.add_argument('--base',required=True)
parser.add_argument('--output',required=True)
args=parser.parse_args();base=args.base.rstrip('/')
assert base.startswith('http://127.0.0.1:')
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
result={}
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True)
    context=browser.new_context(viewport={'width':1150,'height':1300})
    page=context.new_page()
    try:
        page.set_content('''<html lang="zh-CN"><body style="padding:55px;font:25px/1.8 Microsoft YaHei,Arial;background:white;color:#121212"><h1>初二数学课堂作业</h1><h2>1. 分式计算</h2><p>计算 1/x - 1/(x+1)，其中 x≠0 且 x≠-1。</p><p style="color:#184682">我的作答：公分母为 x(x+1)。<br>1/x - 1/(x+1) = [(x+1)+x]/[x(x+1)]<br>= (2x+1)/[x(x+1)]。</p><h2>2. 几何证明</h2><p>已知 OP 平分 ∠AOB，点 P 在 OP 上，PD⊥OA 于 D，PE⊥OB 于 E。求证 PD=PE。</p><svg viewBox="0 0 700 320" width="700" height="320" style="display:block;margin:auto"><path d="M50 270 L650 270 M50 270 L570 30 M50 270 L350 200 M350 200 L350 270 M350 200 L324 144 M338 270 L338 258 L350 258" fill="none" stroke="#222" stroke-width="3"/><g font-size="26"><text x="20" y="300">O</text><text x="650" y="300">A</text><text x="580" y="35">B</text><text x="355" y="195">P</text><text x="355" y="300">D</text><text x="300" y="132">E</text></g></svg><p style="color:#184682">我的证明：∠PDO=∠PEO=90°；∠DOP=∠EOP；OP=OP。<br>根据 AAS，△PDO≌△PEO，所以 PD=PE。</p></body></html>''')
        page.screenshot(path=str(out/'synthetic-worksheet.jpg'),type='jpeg',quality=88,full_page=True)
        response=context.request.post(base+'/api/auth/register',headers={'X-Growing-Client':'1'},data={'username':'livephoto_'+uuid.uuid4().hex[:10],'password':'Synthetic-Only-1987!','displayName':'合成作业验证','role':'Student'})
        assert response.status==200
        session=response.json();student=session['user']['id']
        assert context.request.get(base+'/__qa__/mode/real').status==200
        page.goto(base+'/#question-bank');expect(page.locator('[data-album]')).to_be_visible()
        page.locator('[data-album]').set_input_files(str(out/'synthetic-worksheet.jpg'))
        with page.expect_response('**/api/question-bank/import',timeout=115000) as pending:
            page.locator('[data-import]').click()
        imported=pending.value;data=imported.json();result['importStatus']=imported.status;result['import']=data
        (out/'live-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        assert imported.status==200,'Live import failed; see live-results.json'
        assert len(data['questions'])==2,'Expected both questions'
        algebra,geometry=data['questions']
        assert algebra['grades'][0]['result']['verdict'] in ('partial','incorrect')
        assert geometry['grades'][0]['result']['verdict']=='correct'
        assert any(k['nodeId']=='add' for k in algebra['grades'][0]['result']['knowledge'])
        assert any(m['modelId']==10 for m in geometry['grades'][0]['result']['models'])
        expect(page.locator('[data-review-question]')).to_have_count(2,timeout=15000)
        first_score=algebra['grades'][0]['result']['score']
        with page.expect_response('**/followup',timeout=115000) as followup:
            page.locator('[data-followup-preset="只提示下一步"]').click()
        response=followup.value;result['followupStatus']=response.status;result['followup']=response.json()
        assert response.status==200
        expect(page.locator('[data-review-grade] option')).to_have_count(1)
        page.locator('.photo-correct-form summary').click()
        page.locator('[data-correction] textarea').fill('订正：通分后的分子为 (x+1)-x=1，所以结果是 1/[x(x+1)]，x不等于0且不等于-1。')
        with page.expect_response('**/correct',timeout=115000) as correction:
            page.locator('[data-correction] button').click()
        response=correction.value;result['correctionStatus']=response.status;result['correction']=response.json()
        assert response.status==200
        assert result['correction']['grade']['result']['verdict']=='correct'
        expect(page.locator('[data-review-grade] option')).to_have_count(2)
        page.locator('[data-review-grade]').select_option(index=0)
        expect(page.locator('.photo-verdict')).to_contain_text(str(first_score)+' / 100')
        page.screenshot(path=str(out/'live-desktop.png'),full_page=True)
        result['passed']=True
        print('Live vision passed: 2 questions, actual error, knowledge link, geometry model 10, follow-up and correction; initial grade preserved.')
    finally:
        (out/'live-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        context.request.get(base+'/__qa__/mode/ok')
        browser.close()
