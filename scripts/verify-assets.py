from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
web=root/'app/src/main/assets/web'
for name in ['app-design/index.html','app-design/home.css','word-ops-unit3/index.html','fraction-ops/分式作战_一分钟学习版.html']:
    path=web/name
    if not path.is_file():raise SystemExit('Missing required learning asset: '+name)
    if re.search(r'sk-[a-zA-Z0-9_-]{12,}',path.read_text(encoding='utf-8')):raise SystemExit('Embedded API credential detected; publishing blocked.')
for pattern in ['*.jks','*.keystore','signing.json']:
    if list(root.glob('**/'+pattern)):raise SystemExit('Private signing material must not be in this repository.')
print('Offline learning assets present; no embedded API credentials or signing files.')
