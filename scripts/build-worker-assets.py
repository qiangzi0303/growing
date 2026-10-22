"""Stage only public web assets. All /learn/* requests are gated by the Worker."""
from pathlib import Path
import shutil
import subprocess

repo = Path(__file__).resolve().parents[1]
target = repo / 'cloudflare/public'
subprocess.run(['node', str(repo / 'scripts/export-english-rules.cjs')], check=True)
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
