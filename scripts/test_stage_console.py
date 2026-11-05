import importlib.util
from pathlib import Path
import tempfile
import unittest

TEMP = Path(__file__).resolve().parents[2] / '.nmai/tmp'

spec = importlib.util.spec_from_file_location('stage_console', Path(__file__).with_name('stage-console.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class StageConsoleTests(unittest.TestCase):
    def test_exact_copy_and_expected_cleanup(self):
        with tempfile.TemporaryDirectory(dir=TEMP) as temp:
            root = Path(temp).resolve()
            dist, public = root / 'dist', root / 'public'
            (dist / 'assets').mkdir(parents=True)
            (dist / 'index.html').write_text('html')
            (dist / 'assets/a.js').write_text('js')
            (public / 'console').mkdir(parents=True)
            (public / 'console/old.js').write_text('old')
            expected = module.stage_console(dist, public)
            for file in public.rglob('*'):
                if file.is_file() and file not in expected:
                    file.unlink()
            self.assertEqual({p.relative_to(public).as_posix() for p in expected}, {'console/index.html', 'console/assets/a.js'})
            self.assertEqual((public / 'console/assets/a.js').read_text(), 'js')
            self.assertFalse((public / 'console/old.js').exists())

    def test_missing_dist_and_overlapping_paths_rejected(self):
        with tempfile.TemporaryDirectory(dir=TEMP) as temp:
            root = Path(temp).resolve()
            with self.assertRaises(ValueError):
                module.stage_console(root / 'missing', root / 'public')
            (root / 'index.html').write_text('html')
            with self.assertRaises(ValueError):
                module.stage_console(root, root / 'public')

    def test_symlinks_cannot_escape(self):
        with tempfile.TemporaryDirectory(dir=TEMP) as temp:
            root = Path(temp).resolve()
            dist = root / 'dist'
            dist.mkdir()
            (dist / 'index.html').write_text('html')
            outside = root / 'outside'
            outside.write_text('private')
            try:
                (dist / 'secret').symlink_to(outside)
            except OSError:
                self.skipTest('OS does not allow symlink creation')
            with self.assertRaises(ValueError):
                module.stage_console(dist, root / 'public')

    def test_destination_cannot_escape_public(self):
        with tempfile.TemporaryDirectory(dir=TEMP) as temp:
            root = Path(temp).resolve()
            dist, public, outside = root / 'dist', root / 'public', root / 'outside'
            dist.mkdir()
            public.mkdir()
            outside.mkdir()
            (dist / 'index.html').write_text('html')
            try:
                (public / 'console').symlink_to(outside, target_is_directory=True)
            except OSError:
                self.skipTest('OS does not allow symlink creation')
            with self.assertRaises(ValueError):
                module.stage_console(dist, public)
            self.assertFalse((outside / 'index.html').exists())
