"""Stage only public web assets. All /learn/* requests are gated by the Worker."""
from pathlib import Path
import shutil
import subprocess
import runpy

repo = Path(__file__).resolve().parents[1]
subprocess.run(['node', str(repo / 'scripts/build-duck-catalog.cjs')], check=True)
runpy.run_path(str(repo / 'scripts/sync-duck.py'))
target = repo / 'cloudflare/public'
shutil.copyfile(repo / 'app/src/main/assets/web/app-design/handwriting-core.js', repo / 'platform-web/handwriting-core.js')
# The shell must load connection settings for parents as well as students.
for name in ('course-ai.js', 'course-ai.css'):
    shared = repo / 'app/src/main/assets/web/app-design' / name
    shutil.copyfile(shared, repo / 'platform-web' / name)
    shutil.copyfile(shared, repo / 'app/src/main/assets/web/cloud' / name)
subprocess.run(['node', str(repo / 'scripts/export-english-rules.cjs')], check=True)
subprocess.run(['node', str(repo / 'scripts/build-english-visual-atlas.cjs')], check=True)
subprocess.run(['node', str(repo / 'scripts/vendor-math-format.cjs')], check=True)
# This is a generated, ignored directory. Preserve unchanged files during dev reload.
target.mkdir(parents=True, exist_ok=True)
expected = set()
def copy(source, destination):
    expected.add(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists() or source.read_bytes() != destination.read_bytes():
        shutil.copyfile(source, destination)
for file in (repo / 'platform-web').iterdir():
    if file.suffix in ('.html', '.css', '.js'):
        copy(file, target / file.name)
for file in (repo / 'platform-web/vendor').rglob('*'):
    if file.is_file():
        copy(file, target / file.relative_to(repo / 'platform-web'))
source = repo / 'app/src/main/assets/web'
for file in source.rglob('*'):
    if file.is_file():
        copy(file, target / 'learn' / file.relative_to(source))
for file in target.rglob('*'):
    if file.is_file() and file not in expected:
        file.unlink()
files = [p for p in target.rglob('*') if p.is_file()]
large = [str(p.relative_to(target)) for p in files if p.stat().st_size > 25 * 1024 * 1024]
if large:
    raise SystemExit('Workers Static Assets 25 MiB limit exceeded: ' + ', '.join(large))
if len(files) > 20_000:
    raise SystemExit('Static asset count exceeds the initial deployment limit.')
print(f'Workers assets staged: {len(files)} files, {sum(p.stat().st_size for p in files):,} bytes.')
