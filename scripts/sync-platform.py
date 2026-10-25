"""Keep the web portal shared by Cloudflare Workers and offline APK."""
from pathlib import Path
import shutil
repo = Path(__file__).resolve().parents[1]
source = repo / 'platform-web'
for name in ['question-attempts.js','question-attempts.css']:
    shutil.copyfile(repo / 'app/src/main/assets/web/app-design' / name,source / name)
shutil.copyfile(repo / 'app/src/main/assets/web/app-design/handwriting-core.js', source / 'handwriting-core.js')
target = repo / 'app/src/main/assets/web/cloud'
target.mkdir(parents=True, exist_ok=True)
for file in source.iterdir():
    if file.suffix in ('.html', '.css', '.js'):
        shutil.copyfile(file, target / file.name)
print('Shared platform web assets synced to APK.')
