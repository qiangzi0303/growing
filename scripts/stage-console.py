"""Copy a completed console build into Worker public; return its cleanup registry."""
from pathlib import Path
import shutil


def stage_console(dist: Path, public: Path) -> set[Path]:
    if dist.is_symlink() or public.is_symlink():
        raise ValueError('Console source and public roots must not be links.')
    dist, public = dist.resolve(), public.resolve()
    target = public / 'console'
    if not (dist / 'index.html').is_file():
        raise ValueError('Console dist/index.html is missing; build console-web first.')
    if dist == public or dist in public.parents or public in dist.parents:
        raise ValueError('Console source and public directories must not overlap.')
    if target.resolve() != target:
        raise ValueError('Console destination must stay inside public.')
    sources = list(dist.rglob('*'))
    destinations = []
    # Validate every path before copying anything, including existing destination links.
    for source in sources:
        if source.is_symlink() or not source.resolve().is_relative_to(dist):
            raise ValueError('Console source links are not allowed.')
        destination = target / source.relative_to(dist)
        if destination.resolve() != destination:
            raise ValueError('Console destination links are not allowed.')
        if source.is_file():
            destinations.append((source, destination))
    expected = set()
    for source, destination in destinations:
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists() or source.read_bytes() != destination.read_bytes():
            shutil.copyfile(source, destination)
        expected.add(destination)
    return expected
