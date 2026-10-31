"""Keep the web portal shared by Cloudflare Workers and offline APK."""
from pathlib import Path
import shutil
import subprocess
import runpy
repo = Path(__file__).resolve().parents[1]
runpy.run_path(str(repo / 'scripts/sync-duck.py'))
subprocess.run(['node', str(repo / 'scripts/vendor-math-format.cjs')], check=True)
source = repo / 'platform-web'
for name in ('course-ai.js', 'course-ai.css'):
    shutil.copyfile(repo / 'app/src/main/assets/web/app-design' / name, source / name)
for name in ['question-attempts.js','question-attempts.css']:
    shutil.copyfile(repo / 'app/src/main/assets/web/app-design' / name,source / name)
shutil.copyfile(repo / 'app/src/main/assets/web/app-design/handwriting-core.js', source / 'handwriting-core.js')
target = repo / 'app/src/main/assets/web/cloud'
target.mkdir(parents=True, exist_ok=True)
for file in source.iterdir():
    if file.suffix in ('.html', '.css', '.js'):
        shutil.copyfile(file, target / file.name)
shutil.copytree(source / 'vendor', target / 'vendor', dirs_exist_ok=True)
print('Shared platform web assets synced to APK.')
