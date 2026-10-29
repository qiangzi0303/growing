"""Sync the reviewed project H5 into Android; never copy credentials or private files."""
from pathlib import Path
import json,re,shutil
import runpy,subprocess

repo=Path(__file__).resolve().parents[1]
project=repo.parent
web=repo/'app/src/main/assets/web'
runpy.run_path(str(repo/'scripts/stage-math-papers.py'))
subprocess.run(['node',str(repo/'scripts/build-parallel-links.cjs')],check=True)
subprocess.run(['node',str(repo/'scripts/build-wrong-question-links.cjs')],check=True)
deferred={'physics-'+name+'.js' for name in ['matter','particles','forces','dynamics','pressure','lower-figures']}
files=[p.relative_to(project) for p in (project/'app-design').iterdir() if p.is_file() and p.suffix in ('.html','.css','.js') and p.name not in deferred]
# Preserve previously copied drafts outside the APK assets, without deleting them.
for name in sorted(deferred):
    previous=web/'app-design'/name
    if previous.is_file():
        backup=project/'.nmai/tmp/physics-lower-deferred-assets'/name
        backup.parent.mkdir(parents=True,exist_ok=True)
        if not backup.exists():previous.rename(backup)
files += [Path('word-ops-unit3/index.html'),Path('fraction-ops/分式作战_一分钟学习版.html')]
for page in range(1,9):
    name='geometry-source-'+str(page)+'.webp'
    shutil.copyfile(project/'app-design'/name,web/'app-design'/name)
removed=0
for relative in sorted(files):
    source=project/relative
    text,count=re.subn(r'sk-[a-zA-Z0-9_-]{12,}','GROWING_CONFIGURED_ON_DEVICE',source.read_text(encoding='utf-8'))
    removed+=count
    if relative.as_posix()=='app-design/math-course.js':
        text=text.replace('AI检查在 NumaAI 网页预览中联网使用。','AI检查需联网，请在账号设置中配置自己的DeepSeek API Key。')
    target=web/relative
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(text,encoding='utf-8',newline='\n')
tests=['rewards.test.cjs','panorama.test.cjs','year8.test.cjs','english.test.cjs','physics.test.cjs','course-tools.test.cjs','course-ai.test.cjs']
for name in tests:
    source=(project/'app-design/tests'/name).read_text(encoding='utf-8')
    source=source.replace("require('../","require('../app/src/main/assets/web/app-design/")
    source=source.replace("require.resolve('../","require.resolve('../app/src/main/assets/web/app-design/")
    (repo/'scripts'/name).write_text(source,encoding='utf-8',newline='\n')
print(json.dumps({'offline_files':len(files),'credentials_removed':removed,'rule_tests':len(tests)}))
