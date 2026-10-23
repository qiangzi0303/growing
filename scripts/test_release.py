"""Offline orchestration tests: no GitHub/Cloudflare writes are performed."""
import argparse
from contextlib import redirect_stdout
import io
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

import release


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(dir=release.ROOT / '.nmai/tmp')
        self.addCleanup(self.temp.cleanup)
        self.args = argparse.Namespace(check=False, offline=False, message=None, wait_minutes=1)
        with patch.object(release, 'ROOT', Path(self.temp.name)):
            self.r = release.Release(self.args)
        self.r.logs = Path(self.temp.name) / 'logs'
        self.r.logs.mkdir()
        quiet = redirect_stdout(io.StringIO())
        quiet.__enter__()
        self.addCleanup(quiet.__exit__, None, None, None)
        self.r.state_path = Path(self.temp.name) / 'state.json'
        self.r.state = {}
        self.r.local_preflight = Mock()
        self.r.remote_preflight = Mock()
        self.r.validate = Mock()
        self.r.unchanged = Mock()
        self.r.run = Mock(return_value='')
        self.r.live_check = Mock()
        self.r.has_config = Mock(return_value=False)

        def git(*args):
            if args[:2] == ('rev-parse', 'HEAD'):
                return 'abc'
            if args[:2] == ('status', '--porcelain'):
                return ''
            return 'existing-author'

        self.r.git = Mock(side_effect=git)

    def test_check_does_not_publish_or_record_release(self):
        self.args.check = True
        with patch.object(release.gh, 'publish') as publish, patch.object(release.gh, 'request') as request:
            self.r.execute()
        self.r.validate.assert_called_once()
        self.r.remote_preflight.assert_called_once()
        publish.assert_not_called()
        request.assert_not_called()
        self.r.run.assert_not_called()
        self.assertFalse(self.r.state_path.exists())

    def test_offline_check_does_not_access_remote(self):
        self.args.check = self.args.offline = True
        self.r.execute()
        self.r.remote_preflight.assert_not_called()

    def test_failed_validation_stops_before_commit(self):
        self.r.validate.side_effect = RuntimeError('test failed')
        with patch.object(release.gh, 'publish') as publish:
            with self.assertRaisesRegex(RuntimeError, 'test failed'):
                self.r.execute()
        self.r.run.assert_not_called()
        publish.assert_not_called()

    def test_failed_commit_stops_before_push(self):
        self.r.git.side_effect = lambda *a: 'M file' if a == ('status', '--porcelain') else 'existing-author'

        def run(title, *_args):
            if title == 'Commit project changes':
                raise RuntimeError('commit failed')
            return ''

        self.r.run.side_effect = run
        with patch.object(release.gh, 'publish') as publish:
            with self.assertRaisesRegex(RuntimeError, 'commit failed'):
                self.r.execute()
        publish.assert_not_called()

    def test_failed_migration_stops_before_deploy(self):
        self.r.wait_run = Mock(return_value={'html_url': 'web-ci'})
        self.r.wrangler = Mock(side_effect=RuntimeError('migration failed'))
        with patch.object(release.gh, 'publish', return_value='abc'), patch.object(release.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'migration failed'):
                self.r.execute()
        self.r.wrangler.assert_called_once_with('Apply production D1 migrations', 'd1', 'migrations',
                                               'apply', 'growing-db', '--remote')
        self.assertFalse(self.r.state.get('deployed'))

    def test_completed_commit_is_verified_without_republishing(self):
        self.r.state = {'sha': 'abc', 'complete': True, 'artifact': self.temp.name, 'android_run_number': 8}
        with patch.object(release, 'verify') as verify, patch.object(release.gh, 'publish') as publish:
            self.r.execute()
        verify.assert_called_once()
        self.r.live_check.assert_called_once()
        publish.assert_not_called()

    def test_failed_android_ci_stops_then_dispatches_new_version(self):
        run = {'id': 42, 'run_number': 8, 'run_attempt': 1, 'status': 'completed',
               'conclusion': 'failure', 'html_url': 'https://github.com/test/run/42'}
        self.r.runs = Mock(return_value=[run])
        with self.assertRaisesRegex(RuntimeError, 'CI failure'):
            self.r.wait_run('android-release.yml', 'abc')
        self.assertEqual(self.r.state['failed_android-release.yml'], '42:1')
        success = dict(run, id=43, run_number=9, conclusion='success')
        self.r.runs = Mock(side_effect=[[run], [success]])
        with patch.object(release.gh, 'request', return_value={'object': {'sha': 'abc'}}) as request, \
                patch.object(release.time, 'sleep'):
            result = self.r.wait_run('android-release.yml', 'abc')
        self.assertEqual(result['id'], 43)
        self.assertIn(unittest.mock.call(release.BASE + '/actions/workflows/android-release.yml/dispatches',
                                        'POST', {'ref': 'main'}),
                      request.call_args_list)

    def test_missing_web_ci_is_dispatched_only_once(self):
        success = {'id': 7, 'run_number': 9, 'status': 'completed', 'conclusion': 'success', 'html_url': 'ci'}
        self.r.runs = Mock(side_effect=[[], [], [success]])
        with patch.object(release.gh, 'request', return_value={'object': {'sha': 'abc'}}) as request, \
                patch.object(release.time, 'sleep'):
            self.r.wait_run('platform.yml', 'abc')
        writes = [c for c in request.call_args_list if len(c.args) > 1 and c.args[1] == 'POST']
        self.assertEqual(len(writes), 1)

    def test_resume_waiting_retry_does_not_dispatch_twice(self):
        self.r.state = {'retry_android-release.yml': '42:1', 'failed_android-release.yml': '42:1'}
        failed = {'id': 42, 'run_number': 8, 'run_attempt': 1, 'status': 'completed',
                  'conclusion': 'failure', 'html_url': 'old'}
        success = dict(failed, id=43, run_number=9, conclusion='success')
        self.r.runs = Mock(side_effect=[[failed], [success]])
        with patch.object(release.gh, 'request') as request, patch.object(release.time, 'sleep'):
            self.r.wait_run('android-release.yml', 'abc')
        request.assert_not_called()

    def test_source_changes_abort_release(self):
        self.r.git.side_effect = lambda *a: 'abc' if a == ('rev-parse', 'HEAD') else 'M file'
        with self.assertRaisesRegex(RuntimeError, 'Source changed'):
            release.Release.unchanged(self.r, 'abc')

    def test_resumes_deployed_commit_and_saves_report(self):
        self.r.state = {'sha': 'abc', 'deployed': True, 'worker_version': 'existing-worker'}
        self.r.wait_run = Mock(side_effect=[{'html_url': 'web-ci'}, {'html_url': 'android-ci', 'run_number': 9}])
        self.r.artifact = Mock(return_value=Path(self.temp.name))
        self.r.wrangler = Mock()
        with patch.object(release.gh, 'publish', return_value='abc'), \
                patch.object(release.gh, 'request', return_value={'object': {'sha': 'abc'}}), \
                patch.object(release.time, 'sleep'), \
                patch.object(release, 'verify', return_value={'versionName': '1.0.9'}):
            self.r.execute()
        self.r.wrangler.assert_not_called()
        self.assertTrue(self.r.state['complete'])
        self.assertTrue((self.r.logs / 'release-report.json').is_file())

    def test_failed_process_returns_error_with_log(self):
        with self.assertRaisesRegex(RuntimeError, r'exit 7'):
            release.Release.run(self.r, 'Deliberate failure', [sys.executable, '-c', 'raise SystemExit(7)'])

    def test_process_lock_prevents_concurrent_release_and_unlocks(self):
        data = Path(self.temp.name) / 'lock-data'
        command = [sys.executable, '-X', 'utf8', '-B', '-c',
                   'import sys;from pathlib import Path;sys.path.insert(0,' + repr(str(release.REPO / 'scripts')) + ');'
                   'import release;release.DATA=Path(' + repr(str(data)) + ');'
                   'lock=release.release_lock();lock.__enter__();lock.__exit__(None,None,None)']
        with patch.object(release, 'DATA', data):
            with release.release_lock():
                blocked = subprocess.run(command, capture_output=True, timeout=15, check=False)
                self.assertNotEqual(blocked.returncode, 0)
                self.assertIn(b'Another release process is running', blocked.stderr)
            unlocked = subprocess.run(command, capture_output=True, timeout=15, check=False)
            self.assertEqual(unlocked.returncode, 0, unlocked.stderr.decode(errors='replace'))


if __name__ == '__main__':
    unittest.main()
