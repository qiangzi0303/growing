"""Cross-device browser/native-adapter checks against an isolated local Worker/D1.

python scripts/test-cloud-progress.py --base http://127.0.0.1:PORT --output PATH
No production data or accounts are used. Android network/storage also have Java tests.
"""
import argparse,json,time
from pathlib import Path
from urllib.parse import urlparse,quote
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser()
p.add_argument('--base',required=True)
p.add_argument('--output',type=Path,required=True)
p.add_argument('--chrome',default=r'C:\Program Files\Google\Chrome\Application\chrome.exe')
args=p.parse_args()
assert urlparse(args.base).hostname in ('127.0.0.1','localhost'), 'Use an isolated local database'
args.output.mkdir(parents=True,exist_ok=True)
repo=Path(__file__).resolve().parents[1]
password='Local-QA-Password-2026'
checks=[];errors=[]
run_id=str(time.time_ns())[-8:]
student_name='cloud_a_'+run_id
active_page=None
def check(name,condition=True):
    assert condition,name
    checks.append(name)
def data(ctx):
    r=ctx.request.get(args.base+'/api/student/state')
    assert r.status==200
    return {x['key']:x for x in r.json()}
def wait_data(ctx,key,predicate):
    end=time.monotonic()+9
    while time.monotonic()<end:
        rows=data(ctx)
        if key in rows and predicate(json.loads(rows[key]['value'])): return rows[key]
        time.sleep(.15)
    diagnostic=active_page.evaluate('(k)=>({value:window.GrowingCloud?.storage().getItem(k)})',key) if active_page else None
    raise AssertionError('Server did not save '+key+'; '+json.dumps(diagnostic,ensure_ascii=True))
def track(page):page.on('pageerror',lambda e:errors.append(str(e)))
def home(page):page.locator('#course').wait_for(timeout=15000)
def value(page,key):return page.evaluate('(k)=>window.GrowingCloud.storage().getItem(k)',key)
def write(page,key,obj):page.evaluate('(x)=>window.GrowingCloud.storage().setItem(x.key,JSON.stringify(x.value))',{'key':key,'value':obj})
def register(ctx,name):
    r=ctx.request.post(args.base+'/api/auth/register',headers={'X-Growing-Client':'1'},data={'username':name,'password':password,'displayName':name,'role':'Student'})
    assert r.status==200
    return r.json()
def login(ctx,name):
    page=ctx.new_page();track(page);page.goto(args.base+'/')
    page.locator('#auth [name=username]').fill(name)
    page.locator('#auth [name=password]').fill(password)
    page.locator('#auth button[type=submit]').click();home(page)
    return page

try:
 with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=args.chrome,headless=True)
    a=browser.new_context();account=register(a,student_name);sid=account['user']['id']
    seeds={
      'growing-math-lessons-v1':{'version':1,'topics':{}},
      'growing-physics-lessons-v1':{'version':1,'topics':{}},
      'growing-english-course-v1:english-8a-01':{'version':1,'words':{},'lessons':{}},
      'growing-diagnosis-year8-v1:math-8a-01':{'draft':'测评尚未完成'},
      'growing-diagnosis-year8-v1:math-8a-02':{'draft':'数学诊断草稿'},
      'growing-diagnosis-physics-v1:physics-8a-02':{'draft':'物理诊断草稿'},
      'growing-english-doubts-v1:english-8a-01':{'draft':'an English question','messages':[]},
      'fraction-minute-v1':{'topics':{},'connection':{'apiKey':'fake-device-only-key'}},
    }
    for key, item in seeds.items():
        saved={k:v for k,v in item.items() if k!='connection'}
        response=a.request.put(args.base+'/api/student/state/'+quote(key,safe=''),headers={'X-Growing-Client':'1'},data={'revision':0,'value':json.dumps(saved,ensure_ascii=False)})
        assert response.status==200
    seed_script='if(!localStorage.getItem("qa-seeded")){localStorage.setItem("qa-seeded","1");localStorage.setItem('+json.dumps('growing-user:'+sid+':fraction-minute-v1')+','+json.dumps(json.dumps(seeds['fraction-minute-v1']))+');}'
    a.add_init_script(seed_script)
    pa=a.new_page();active_page=pa;track(pa);pa.goto(args.base+'/');home(pa)
    check('The web classroom has no cloud-save status display',pa.locator('#sync-status,#growing-cloud-status').count()==0)
    rows=data(a)
    pa.wait_for_function('(keys)=>keys.every(k=>window.GrowingCloud.storage().getItem(k)!==null)',arg=list(seeds))
    check('Cloud records restore automatically',all(k in rows for k in seeds))
    check('AI connection stays private on the old device','connection' not in json.loads(rows['fraction-minute-v1']['value']) and 'fake-device-only-key' in value(pa,'fraction-minute-v1'))
    lesson=pa.locator('#course').content_frame
    # Use the actual lesson button, then verify its saved record in D1.
    pa.frames[1].goto(args.base+'/learn/app-design/math-course.html?chapter=math-8a-01')
    lesson.locator('#mark-read').click()
    local_seen=pa.frames[1].evaluate('JSON.parse(localStorage.getItem("growing-math-lessons-v1")).topics')
    assert any(r.get('seen') for r in local_seen.values()),json.dumps({'local':local_seen,'warning':lesson.locator('.storage-warning').all_text_contents(),'pageErrors':errors},ensure_ascii=True)
    wait_data(a,'growing-math-lessons-v1',lambda d:any(r.get('seen') for r in d.get('topics',{}).values()))
    check('A real lesson interaction saves automatically to the server')
    draft='growing-english-doubts-v1:english-8a-01'
    changed=[False]
    def during_upload(route):
        response=route.fetch()
        if not changed[0]:
            changed[0]=True;write(pa,draft,{'draft':'second edit while saving','messages':[]})
        route.fulfill(response=response)
    upload_route='**/api/student/state/'+quote(draft,safe='')
    pa.route(upload_route,during_upload)
    write(pa,draft,{'draft':'first edit','messages':[]})
    wait_data(a,draft,lambda d:d.get('draft')=='second edit while saving')
    pa.unroute(upload_route,during_upload)
    check('An edit made during an upload is saved in a subsequent request')
    b=browser.new_context(viewport={'width':390,'height':844});pb=login(b,student_name)
    pb.wait_for_function('(keys)=>keys.every(k=>window.GrowingCloud.storage().getItem(k)!==null)',arg=list(seeds))
    check('New device restores all cloud keys in the background',all(value(pb,k) is not None for k in seeds))
    check('New device restores the actual math progress',any(r.get('seen') for r in json.loads(value(pb,'growing-math-lessons-v1'))['topics'].values()))
    check('New device has no old device AI key','connection' not in json.loads(value(pb,'fraction-minute-v1')))
    write(pb,'growing-diagnosis-year8-v1:math-8a-02',{'draft':'device B newer'})
    wait_data(b,'growing-diagnosis-year8-v1:math-8a-02',lambda d:d.get('draft')=='device B newer')
    pa.evaluate('window.dispatchEvent(new Event("online"))')
    pa.wait_for_function('(s)=>JSON.parse(localStorage.getItem("growing-user:"+s+":growing-diagnosis-year8-v1:math-8a-02")).draft==="device B newer"',arg=sid)
    check('Background reconciliation restores changes made on the other device without leaving the course')
    home(pa)
    a.set_offline(True)
    with pa.expect_event('requestfailed',predicate=lambda r:r.url==args.base+'/api/student/state'):
        write(pa,draft,{'draft':'offline edit retained','messages':[]})
    check('Offline writes are retained without a cloud-save notice',json.loads(value(pa,draft))['draft']=='offline edit retained' and pa.locator('#sync-status,#growing-cloud-status').count()==0 and pa.locator('#message').inner_text()=='')
    a.set_offline(False)
    wait_data(a,draft,lambda d:d.get('draft')=='offline edit retained')
    check('Reconnection automatically uploads offline edits')
    # Both devices change the same document; cloud wins automatically.
    write(pb,'growing-diagnosis-physics-v1:physics-8a-02',{'draft':'cloud version'})
    wait_data(b,'growing-diagnosis-physics-v1:physics-8a-02',lambda d:d.get('draft')=='cloud version')
    write(pa,'growing-diagnosis-physics-v1:physics-8a-02',{'draft':'local competing version'})
    pa.wait_for_function('(s)=>JSON.parse(localStorage.getItem("growing-user:"+s+":growing-diagnosis-physics-v1:physics-8a-02")).draft==="cloud version"',arg=sid)
    check('Simultaneous edits automatically adopt cloud without asking for a version',pa.locator('.conflict,[data-choice]').count()==0 and json.loads(data(a)['growing-diagnosis-physics-v1:physics-8a-02']['value'])['draft']=='cloud version')
    check('Mobile learning shell has no horizontal overflow',pb.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    pb.screenshot(path=str(args.output/'new-device-mobile.png'),full_page=True)
    c=browser.new_context();register(c,'cloud_b_'+run_id);pc=c.new_page();track(pc);pc.goto(args.base+'/');home(pc)
    check('A different student cannot see the first student progress',value(pc,'growing-math-lessons-v1') is None and value(pc,draft) is None)
    d=browser.new_context();d.request.post(args.base+'/api/auth/login',headers={'X-Growing-Client':'1'},data={'username':student_name,'password':password})
    pd=d.new_page();track(pd);pd.route('**/api/student/state',lambda r:r.fulfill(status=503,json={'error':'QA temporary outage'}))
    with pd.expect_response(lambda r:r.url==args.base+'/api/student/state' and r.status==503):
        pd.goto(args.base+'/')
    home(pd)
    check('A new device enters lessons while background restore retries',pd.locator('#course').count()==1 and pd.locator('#sync-now').count()==0)
    check('A failed background restore shows no cloud-save status notice',pd.locator('#sync-status,#growing-cloud-status').count()==0 and pd.locator('#message').inner_text()=='')
    e=browser.new_context();legacy_account=register(e,'cloud_old_'+run_id)
    legacy_key='growing-diagnosis-year8-v1:math-8a-02'
    e.request.put(args.base+'/api/student/state/'+legacy_key,headers={'X-Growing-Client':'1'},data={'revision':0,'value':json.dumps({'draft':'already on server'})})
    e.add_init_script('if(!localStorage.getItem("qa-old-seeded")){localStorage.setItem("qa-old-seeded","1");localStorage.setItem("growing-diagnosis-year8-v1:math-8a-02",JSON.stringify({draft:"old unscoped record"}))}')
    pe=e.new_page();track(pe);pe.goto(args.base+'/');home(pe)
    pe.wait_for_function('()=>JSON.parse(window.GrowingCloud.storage().getItem("growing-diagnosis-year8-v1:math-8a-02"))?.draft==="already on server"')
    check('Legacy browser records never override cloud or require a version choice',pe.locator('#migrate-legacy,.conflict,[data-choice]').count()==0 and json.loads(data(e)[legacy_key]['value'])['draft']=='already on server')
    check('Unscoped legacy cache is retained without importing it',pe.evaluate('localStorage.getItem("growing-diagnosis-year8-v1:math-8a-02").includes("old unscoped record")'))
    e.request.post(args.base+'/api/auth/logout',headers={'X-Growing-Client':'1'},data={})
    register(e,'cloud_next_'+run_id);pe.goto(args.base+'/');home(pe)
    check('A different student cannot claim an unscoped old browser record',pe.locator('#migrate-legacy').count()==0 and value(pe,legacy_key) is None)
    # Run the shipped native storage/bootstrap/agent in a real browser with D1 APIs.
    n=browser.new_context(viewport={'width':390,'height':844})
    fixture='''(()=>{const original=window.localStorage;const read=k=>original.getItem('native:'+k),put=(k,v)=>original.setItem('native:'+k,v),keys=()=>Object.keys(original).filter(k=>k.startsWith('native:')).map(k=>k.slice(7));const ok=value=>JSON.stringify({ok:true,value});window.GrowingNative={get:k=>ok(read(k)),put:(k,v)=>{put(k,v);return ok()},remove:k=>{original.removeItem('native:'+k);return ok()},clear:()=>{keys().forEach(k=>original.removeItem('native:'+k));return ok()},keys:()=>ok(keys()),cloudApiUrl:()=>BASE,identityAccount:()=>ID,confirmIdentity:()=>ok(),openLearning:()=>{original.setItem('qa-before-open',read('growing-math-lessons-v1'));location.href=BASE+'/assets/web/app-design/index.html';return ok()},aiKey:()=>'',configureAi:()=>{}};if(!read('growing-cloud-session-v1')){put('growing-cloud-session-v1',SESSION);put('growing-cloud-binding-v1',ID)}})();'''.replace('BASE',json.dumps(args.base)).replace('SESSION',json.dumps(json.dumps({'token':account['token'],'user':account['user']}))).replace('ID',json.dumps(sid))
    n.add_init_script(fixture+'\n'+(repo/'app/src/main/assets/bootstrap.js').read_text(encoding='utf8')+'\n'+(repo/'platform-web/sync-core.js').read_text(encoding='utf8')+'\n'+(repo/'platform-web/cloud-agent.js').read_text(encoding='utf8'))
    pn=n.new_page();track(pn);pn.goto(args.base+'/assets/web/cloud/index.html')
    pn.locator('.subjects').wait_for(timeout=15000)
    pn.wait_for_function('()=>JSON.parse(GrowingNative.get("growing-math-lessons-v1")).value!==null')
    check('Native entry restores cloud records in the lesson background')
    pn.goto(args.base+'/assets/web/app-design/study.html?subject=math&term=upper&unit=math-8a-03')
    pn.locator('iframe').content_frame.locator('#mark-read').wait_for()
    pn.evaluate('document.querySelector("iframe").contentWindow.localStorage.setItem("growing-english-doubts-v1:english-8a-01",JSON.stringify({draft:"native iframe auto-save",messages:[]}))')
    wait_data(a,draft,lambda d:d.get('draft')=='native iframe auto-save')
    check('Native nested iframe writes trigger automatic upload without manual sync')
    check('Native lessons have no floating cloud-save status',pn.locator('#growing-cloud-status,#sync-status').count()==0)
    pn.screenshot(path=str(args.output/'native-mobile.png'),full_page=True)
    pn.route('**/api/student/state',lambda r:r.abort())
    check('Native background-save failures stay silent',pn.evaluate('GrowingCloudFlush()') is False and pn.locator('#growing-cloud-status,#sync-status').count()==0)
    pn.unroute('**/api/student/state')
    check('Native background save resumes without a status display',pn.evaluate('GrowingCloudFlush()') is True and pn.locator('#growing-cloud-status,#sync-status').count()==0)
    pn.route('**/api/auth/me',lambda r:r.abort())
    pn.goto(args.base+'/assets/web/cloud/index.html');pn.locator('.subjects').wait_for()
    check('A confirmed student with existing records resumes automatically without choosing an offline cache',pn.locator('#offline-course').count()==0)
    fresh=browser.new_context();fresh.add_init_script(fixture+'\n'+(repo/'app/src/main/assets/bootstrap.js').read_text(encoding='utf8')+'\n'+(repo/'platform-web/sync-core.js').read_text(encoding='utf8'))
    pf=fresh.new_page();track(pf);pf.route('**/api/auth/me',lambda r:r.abort());pf.goto(args.base+'/assets/web/cloud/index.html');pf.locator('.subjects').wait_for()
    check('A native device with a confirmed bound session opens the course list without cached progress or reconnect choices',pf.locator('#offline-course,#retry-startup').count()==0)
    check('No uncaught browser errors',not errors)
    browser.close()
finally:
 (args.output/'browser-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'pageErrors':errors},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'passed':len(checks),'pageErrors':errors},ensure_ascii=False))
