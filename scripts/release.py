"""One command: validate, commit, publish main, deploy Worker, verify signed APK.

--check performs local validation and read-only remote preflight; never releases.
--offline skips remote preflight and is only valid with --check.
"""
import argparse
from contextlib import contextmanager
import datetime as dt
import importlib.util
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.request
import zipfile

import release_github as gh
from release_verify import verify

REPO = Path(__file__).resolve().parents[1]
ROOT = REPO.parent
DATA = ROOT / '.nmai/releases'
SITES = ('https://007yx.com', 'https://growing-platform.qiangzi0303.workers.dev')
ACCOUNT = '6f0c4aab0809106135ea599bb0fa6f3e'
DATABASE = '4c05083b-7ab5-4175-b3d6-9ac944b61716'
BASE = 'repos/' + gh.REPO


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


@contextmanager
def release_lock():
    DATA.mkdir(parents=True, exist_ok=True)
    with (DATA / 'release.lock').open('a+b') as stream:
        stream.seek(0)
        if os.name == 'nt':
            import msvcrt
            # Windows byte-range locks also prohibit reads by another process.
            if os.fstat(stream.fileno()).st_size == 0:
                stream.write(b'0')
                stream.flush()
            stream.seek(0)
            try:
                msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError:
                raise RuntimeError('Another release process is running.') from None
        else:
            import fcntl
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        try:
            yield
        finally:
            stream.seek(0)
            if os.name == 'nt':
                msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)


class Release:
    def __init__(self, args):
        self.args = args
        self.logs = ROOT / '.nmai/tmp/releases' / dt.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
        self.logs.mkdir(parents=True)
        self.number = 0
        self.env = dict(os.environ, PYTHONUTF8='1', PYTHONUNBUFFERED='1',
                        PYTHONDONTWRITEBYTECODE='1',
                        WRANGLER_SEND_METRICS='false', CLOUDFLARE_ACCOUNT_ID=ACCOUNT,
                        GIT_TERMINAL_PROMPT='0', GCM_INTERACTIVE='never', CI='true')
        self.node = shutil.which('node') or r'D:\AI\numa\node-v22.18.0-win-x64\node.exe'
        self.env['PATH'] = os.pathsep.join([str(Path(sys.executable).parent),
                                          str(Path(self.node).parent), self.env.get('PATH', '')])
        self.state_path = DATA / 'state.json'
        self.state = json.loads(self.state_path.read_text(encoding='utf-8')) if self.state_path.exists() else {}

    def run(self, title, command, cwd=REPO, timeout=900):
        self.number += 1
        log = self.logs / f'{self.number:02d}.log'
        print(f'[{self.number:02d}] {title}', flush=True)
        # Full output goes to a file: no huge stack/data-URI dumps in the terminal.
        with log.open('wb') as output:
            try:
                process = subprocess.run([str(s) for s in command], cwd=cwd, env=self.env,
                                         stdout=output, stderr=subprocess.STDOUT, timeout=timeout, check=False)
            except subprocess.TimeoutExpired:
                raise RuntimeError(f'{title} timed out; see {log}') from None
        if process.returncode:
            raise RuntimeError(f'{title} failed (exit {process.returncode}); see {log}')
        return log.read_text(encoding='utf-8', errors='replace')

    def git(self, *args):
        result = subprocess.run(['git', '-C', str(REPO), *args], env=self.env,
                                capture_output=True, timeout=60, check=False)
        if result.returncode:
            raise RuntimeError('Git check failed: ' + ' '.join(args[:2]))
        return result.stdout.decode('utf-8').strip()

    def wrangler(self, title, *args):
        return self.run(title, [self.node, 'node_modules/wrangler/bin/wrangler.js', *args], REPO / 'cloudflare')

    def record(self, **values):
        self.state.update(values)
        save(self.state_path, self.state)

    def local_preflight(self):
        if not (REPO / '.git').exists() or Path(self.git('rev-parse', '--show-toplevel')).resolve() != REPO:
            raise RuntimeError('Unexpected repository directory')
        if self.git('branch', '--show-current') != 'main':
            raise RuntimeError('Switch to main before releasing; no automatic branch changes are made.')
        if self.git('remote', 'get-url', 'origin') not in (
                'https://github.com/' + gh.REPO + '.git', 'git@github.com:' + gh.REPO + '.git'):
            raise RuntimeError('Unexpected Git remote')
        if self.git('ls-files', '-u'):
            raise RuntimeError('Resolve Git conflicts before releasing')
        for name in ('MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply'):
            if (REPO / '.git' / name).exists():
                raise RuntimeError('Finish the pending Git operation before releasing')
        config = json.loads((REPO / 'cloudflare/wrangler.jsonc').read_text(encoding='utf-8'))
        if (config['name'] != 'growing-platform' or not config.get('workers_dev') or
                config['d1_databases'][0]['database_id'] != DATABASE or
                config['kv_namespaces'][0]['id'] != 'd4791757e7614d3f91d25e069610de66' or
                not any(r['pattern'] == '007yx.com/*' for r in config.get('routes', []))):
            raise RuntimeError('Cloudflare release target changed; review configuration first')
        if importlib.util.find_spec('cryptography') is None:
            raise RuntimeError('Install cryptography in this Python environment before releasing')
        self.run('Node runtime', [self.node, '--version'])
        for name in ('typescript/bin/tsc', 'tsx/dist/cli.mjs', 'wrangler/bin/wrangler.js'):
            if not (REPO / 'cloudflare/node_modules' / name).is_file():
                raise RuntimeError('Cloudflare dependencies missing. Run npm ci in growing/cloudflare first.')
        self.check_changes()

    def check_changes(self):
        names = set(self.git('diff', '--name-only', '-z', 'HEAD').split('\0'))
        names.update(self.git('ls-files', '--others', '--exclude-standard', '-z').split('\0'))
        for name in names - {''}:
            path = REPO / name
            if not path.resolve().is_relative_to(REPO):
                raise RuntimeError('Changed path escapes the repository')
            if (path.suffix.lower() in ('.jks', '.keystore', '.p12', '.pem', '.key', '.pfx') or
                    path.name in ('signing.json', 'keystore.properties', 'local.properties') or
                    path.name.startswith(('.env', '.dev.vars')) or '.nmai' in path.parts):
                raise RuntimeError('Private/configuration file would be committed: ' + name)
            if path.is_file():
                content = path.read_bytes()
                if re.search(rb'(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)', content):
                    raise RuntimeError('Possible embedded credential in changed file: ' + name)

    def remote_preflight(self):
        repo = gh.request(BASE)
        if repo['full_name'] != gh.REPO or not repo.get('permissions', {}).get('push'):
            raise RuntimeError('GitHub credentials do not grant push permission to the expected repository')
        remote = gh.request(BASE + '/git/ref/heads/main')['object']['sha']
        self.git('merge-base', '--is-ancestor', remote, 'HEAD')
        secrets = {item['name'] for item in gh.request(BASE + '/actions/secrets?per_page=100')['secrets']}
        required = {'ANDROID_KEYSTORE_BASE64', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS',
                    'ANDROID_KEY_PASSWORD', 'APK_PUBLISH_TOKEN'}
        if not required.issubset(secrets):
            raise RuntimeError('Missing CI secrets: ' + ', '.join(sorted(required - secrets)))
        who = self.wrangler('Cloudflare authentication (read only)', 'whoami')
        if ACCOUNT not in who:
            raise RuntimeError('Cloudflare login does not include the configured account')

    def validate(self):
        self.run('Release orchestration tests (offline)', [sys.executable, '-B', REPO / 'scripts/test_release.py'])
        self.run('APK distribution tests (offline)', [sys.executable, '-B', REPO / 'scripts/test_publish_apk.py'])
        self.run('GitHub transport tests (offline)', [sys.executable, '-B', REPO / 'scripts/test_release_github.py'])
        for script in ('sync-platform.py', 'build-worker-assets.py', 'verify-assets.py'):
            self.run(script, [sys.executable, REPO / 'scripts' / script])
        tests = ['test-platform', 'handwriting.test', 'unit-summary.test', 'rewards.test', 'year8.test', 'math-lab.test', 'math-format.test', 'fraction-grading.test', 'panorama.test',
                 'english.test', 'english-visual.test', 'english-motion.test', 'physics.test', 'course-tools.test', 'course-ai.test']
        self.run('Web, handwriting and curriculum tests',
                 [self.node, '--test', *[REPO / 'scripts' / (name + '.cjs') for name in tests]])
        for script in ('test-speech.cjs', 'test-ai.cjs'):
            self.run(script, [self.node, REPO / 'scripts' / script])
        cloud = REPO / 'cloudflare'
        self.run('TypeScript compile check', [self.node, 'node_modules/typescript/bin/tsc', '--noEmit'], cloud)
        self.run('Worker behavior tests', [self.node, 'node_modules/tsx/dist/cli.mjs', '--test',
                 '--test-concurrency=1', *sorted(cloud.glob('test/*.test.ts'))], cloud)
        self.wrangler('Worker bundle (local dry run)', 'deploy', '--dry-run', '--outdir', '.wrangler/release-check')
        self.run('Git whitespace check', ['git', '-C', REPO, 'diff', '--check', 'HEAD'])
        self.check_changes()

    def unchanged(self, sha):
        if self.git('rev-parse', 'HEAD') != sha or self.git('status', '--porcelain'):
            raise RuntimeError('Source changed during release. Stop editing and rerun the batch file.')

    def runs(self, workflow, sha):
        values = gh.request(BASE + '/actions/workflows/' + workflow + '/runs?head_sha=' + sha + '&per_page=100')
        return [r for r in values['workflow_runs'] if r['head_sha'] == sha and r['head_branch'] == 'main']

    def wait_run(self, workflow, sha):
        deadline = time.monotonic() + self.args.wait_minutes * 60
        last = None
        requested_retry = self.state.get('retry_' + workflow)
        while time.monotonic() < deadline:
            self.unchanged(sha)
            runs = self.runs(workflow, sha)
            if not runs:
                # Some paths do not trigger Web CI. Dispatch once, bound to main after checking its SHA.
                key = 'dispatched_' + workflow
                if not self.state.get(key):
                    if gh.request(BASE + '/git/ref/heads/main')['object']['sha'] != sha:
                        raise RuntimeError('Remote main changed during release')
                    gh.request(BASE + '/actions/workflows/' + workflow + '/dispatches', 'POST', {'ref': 'main'})
                    self.record(**{key: True})
                status = 'waiting for workflow to start'
            else:
                run = max(runs, key=lambda r: (r['run_number'], r.get('run_attempt', 1)))
                status = str(run['id']) + ': ' + run['status']
                if run['status'] == 'completed':
                    if run['conclusion'] != 'success':
                        failure = str(run['id']) + ':' + str(run.get('run_attempt', 1))
                        key = 'failed_' + workflow
                        if failure == requested_retry:
                            time.sleep(25)
                            continue
                        if self.state.get(key) == failure:
                            if gh.request(BASE + '/git/ref/heads/main')['object']['sha'] != sha:
                                raise RuntimeError('Remote main changed before CI retry')
                            if workflow == 'android-release.yml':
                                # A job rerun could rebuild different APK bytes under an existing immutable version/tag.
                                gh.request(BASE + '/actions/workflows/' + workflow + '/dispatches', 'POST', {'ref': 'main'})
                            else:
                                gh.request(BASE + '/actions/runs/' + str(run['id']) + '/rerun-failed-jobs', 'POST')
                            requested_retry = failure
                            self.record(**{'retry_' + workflow: failure})
                            print('CI retry requested after: ' + run['html_url'], flush=True)
                            time.sleep(25)
                            continue
                        self.record(**{key: failure})
                        raise RuntimeError('CI ' + str(run['conclusion']) + ': ' + run['html_url'] +
                                           ' (rerun this batch to retry CI; a failed Android build gets a new version)')
                    print('CI passed: ' + run['html_url'], flush=True)
                    return run
            if status != last:
                print(workflow + ' - ' + status, flush=True)
                last = status
            time.sleep(25)
        raise RuntimeError('CI wait timed out. Rerun the batch to resume the same commit.')

    def artifact(self, run):
        artifacts = gh.request(BASE + '/actions/runs/' + str(run['id']) + '/artifacts')['artifacts']
        wanted = 'growing-signed-apk-' + str(run['run_number'])
        selected = [a for a in artifacts if a['name'] == wanted and not a['expired']]
        if len(selected) != 1:
            raise RuntimeError('Signed APK artifact missing/expired: ' + run['html_url'])
        folder = ROOT / 'apk' / ('build-' + str(run['run_number']))
        folder.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(gh.download(selected[0]['archive_download_url']))) as archive:
            for entry in archive.infolist():
                target = (folder / entry.filename).resolve()
                if not target.is_relative_to(folder.resolve()) or entry.file_size > 110 * 1024 * 1024:
                    raise RuntimeError('Unsafe APK artifact archive entry')
            archive.extractall(folder)
        return folder

    def live_check(self, folder):
        for site in SITES:
            self.run('Public APK and update manifest: ' + site,
                     [sys.executable, REPO / 'scripts/publish-apk.py', '--manifest', folder / 'update.json',
                      '--site', site, '--verify-only'])
            for route in ('/', '/api/health'):
                req = urllib.request.Request(site + route, headers={'User-Agent': 'Growing-Release-Check/1.0'})
                with urllib.request.urlopen(req, timeout=60) as response:
                    if response.status != 200:
                        raise RuntimeError('Site health check failed: ' + site + route)

    def execute(self):
        print('Logs: ' + str(self.logs), flush=True)
        self.local_preflight()
        if not self.args.offline:
            self.remote_preflight()
        self.validate()
        if self.args.check:
            print('CHECK PASSED. No commit, push, migration, deploy or workflow dispatch was performed.', flush=True)
            return
        if self.git('status', '--porcelain'):
            self.run('Stage project changes', ['git', '-C', REPO, 'add', '-A'])
            # Use existing repository identity without modifying local/global Git configuration.
            name = self.git('config', '--get', 'user.name') if self.has_config('user.name') else self.git('log', '-1', '--format=%an')
            email = self.git('config', '--get', 'user.email') if self.has_config('user.email') else self.git('log', '-1', '--format=%ae')
            message = self.args.message or 'Release ' + dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            self.run('Commit project changes', ['git', '-C', REPO, '-c', 'user.name=' + name,
                     '-c', 'user.email=' + email, 'commit', '-m', message])
        sha = self.git('rev-parse', 'HEAD')
        self.unchanged(sha)
        if self.state.get('sha') != sha:
            self.state = {'sha': sha}
            self.record()
        if self.state.get('complete'):
            folder = Path(self.state['artifact'])
            verify(REPO, folder, self.state['android_run_number'])
            self.live_check(folder)
            print('Already released this commit; public checks passed. No new APK version created.', flush=True)
            return
        print('Publishing commit ' + sha, flush=True)
        if gh.publish(REPO) != sha:
            raise RuntimeError('Published Git SHA mismatch')
        # Allow push-triggered runs to appear before considering workflow_dispatch.
        time.sleep(15)
        web = self.wait_run('platform.yml', sha)
        self.unchanged(sha)
        if not self.state.get('deployed'):
            self.wrangler('Apply production D1 migrations', 'd1', 'migrations', 'apply', 'growing-db', '--remote')
            deploy = self.wrangler('Deploy production Worker and website', 'deploy')
            match = re.search(r'Current Version ID:\s*([0-9a-f-]{36})', deploy)
            self.record(deployed=True, worker_version=match.group(1) if match else 'see deploy log')
        android = self.wait_run('android-release.yml', sha)
        self.unchanged(sha)
        folder = self.artifact(android)
        report = verify(REPO, folder, android['run_number'])
        self.live_check(folder)
        self.unchanged(sha)
        if gh.request(BASE + '/git/ref/heads/main')['object']['sha'] != sha:
            raise RuntimeError('Remote main changed before final verification')
        report.update(commit=sha, webCI=web['html_url'], androidCI=android['html_url'],
                      workerVersion=self.state.get('worker_version'), sites=SITES, logs=str(self.logs))
        save(self.logs / 'release-report.json', report)
        self.record(complete=True, artifact=str(folder), android_run_number=android['run_number'], report=report)
        print('RELEASE COMPLETE: ' + report['versionName'] + '\nWebsite: ' + SITES[0] +
              '\nAPK: ' + SITES[0] + '/downloads/growing-' + report['versionName'] + '.apk' +
              '\nReport: ' + str(self.logs / 'release-report.json'), flush=True)

    def has_config(self, key):
        return subprocess.run(['git', '-C', str(REPO), 'config', '--get', key],
                              capture_output=True, timeout=20, check=False).returncode == 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate without publishing')
    parser.add_argument('--offline', action='store_true', help='Skip remote preflight (requires --check)')
    parser.add_argument('--message', help='Optional Git commit message; default includes local time')
    parser.add_argument('--wait-minutes', type=int, default=60, help='CI wait limit per workflow')
    args = parser.parse_args()
    if args.offline and not args.check:
        parser.error('--offline requires --check')
    if args.wait_minutes < 1:
        parser.error('--wait-minutes must be positive')
    try:
        with release_lock():
            Release(args).execute()
        return 0
    except KeyboardInterrupt:
        print('STOPPED. Rerun the batch to resume.', flush=True)
        return 130
    except Exception as error:
        # Safe summary only, never print arbitrary stack traces or request bodies.
        print('RELEASE STOPPED: ' + str(error), flush=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
