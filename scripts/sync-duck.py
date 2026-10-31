"""Refresh public companion assets without copying the local proxy or private config."""
from pathlib import Path
import shutil

repo = Path(__file__).resolve().parents[1]
source = repo.parent / 'app-design/companion-duck'
target = repo / 'app/src/main/assets/web/app-design/companion-duck'
updated = 0
if source.is_dir():
    for path in source.rglob('*'):
        if not path.is_file() or path.suffix not in ('.html', '.css', '.js', '.svg', '.txt') or any(p in ('tests', '__pycache__') for p in path.parts):
            continue
        output = target / path.relative_to(source)
        if not output.is_file() or output.read_bytes() != path.read_bytes():
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, output)
            updated += 1
print(f'Public duck assets refreshed: {updated} files. Private configuration excluded.')
