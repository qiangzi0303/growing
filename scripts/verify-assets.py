from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
web=root/'app/src/main/assets/web'
for name in ['app-design/index.html','app-design/home.css','app-design/units.html','app-design/study.html','app-design/knowledge.html','app-design/panorama.js','app-design/math-data.js','app-design/math-course.html','app-design/reward-engine.js','app-design/unit-rewards.js','word-ops-unit3/index.html','fraction-ops/分式作战_一分钟学习版.html']:
    path=web/name
    if not path.is_file():raise SystemExit('Missing required learning asset: '+name)
for path in web.rglob('*'):
    if path.is_file() and path.suffix in ('.html','.js','.css'):
        text=path.read_text(encoding='utf-8')
        if re.search(r'sk-[a-zA-Z0-9_-]{12,}',text):raise SystemExit('Embedded API credential detected; publishing blocked.')
        if path.suffix=='.html':
            from urllib.parse import urlsplit,unquote
            for link in re.findall(r'<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"',text):
                url=urlsplit(link)
                if not url.scheme and url.path and not url.path.startswith('/'):
                    resolved=(path.parent/unquote(url.path)).resolve()
                    if not resolved.is_relative_to(web.resolve()) or not resolved.is_file():raise SystemExit('Missing local web dependency in '+path.name)
for pattern in ['*.jks','*.keystore','signing.json']:
    if list(root.glob('**/'+pattern)):raise SystemExit('Private signing material must not be in this repository.')
print('Offline learning assets present; no embedded API credentials or signing files.')
