"""Sync the reviewed project H5 into Android; never copy credentials or private files."""
from pathlib import Path
import json,re

repo=Path(__file__).resolve().parents[1]
project=repo.parent
web=repo/'app/src/main/assets/web'
files=[p.relative_to(project) for p in (project/'app-design').iterdir() if p.is_file() and p.suffix in ('.html','.css','.js')]
files += [Path('word-ops-unit3/index.html'),Path('fraction-ops/分式作战_一分钟学习版.html')]
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
for name in ['rewards.test.cjs','panorama.test.cjs','year8.test.cjs']:
    source=(project/'app-design/tests'/name).read_text(encoding='utf-8')
    source=source.replace("require('../","require('../app/src/main/assets/web/app-design/")
    (repo/'scripts'/name).write_text(source,encoding='utf-8',newline='\n')
print(json.dumps({'offline_files':len(files),'credentials_removed':removed,'rule_tests':3}))
