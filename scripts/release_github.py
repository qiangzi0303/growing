"""GitHub release transport. Credentials stay in memory, outside command lines/logs."""
import base64
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request
from urllib.parse import urlsplit

REPO = 'qiangzi0303/growing'
API = 'https://api.github.com/'
_token = None


class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        result = super().redirect_request(req, fp, code, msg, headers, newurl)
        if result is not None and urlsplit(req.full_url).hostname != urlsplit(newurl).hostname:
            result.remove_header('Authorization')
        return result


opener = urllib.request.build_opener(SafeRedirect())


def token():
    global _token
    if _token:
        return _token
    _token = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    if not _token:
        env = dict(os.environ, GIT_TERMINAL_PROMPT='0', GCM_INTERACTIVE='never')
        result = subprocess.run(['git', 'credential', 'fill'],
                                input='protocol=https\nhost=github.com\n\n', text=True,
                                capture_output=True, timeout=45, env=env, check=False)
        fields = dict(line.split('=', 1) for line in result.stdout.splitlines() if '=' in line)
        _token = fields.get('password')
    if not _token:
        raise RuntimeError('GitHub credential unavailable. Sign in with Git Credential Manager or set GH_TOKEN.')
    return _token


def download(url):
    if urlsplit(url).hostname != 'api.github.com':
        raise RuntimeError('Unexpected GitHub API download origin')
    req = urllib.request.Request(url, headers={
        'Authorization': 'Bearer ' + token(), 'User-Agent': 'Growing-Release/1.0'})
    with opener.open(req, timeout=120) as response:
        return response.read()


def request(path, method='GET', body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers={
        'Authorization': 'Bearer ' + token(), 'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Growing-Release/1.0'})
    try:
        with opener.open(req, timeout=45) as response:
            raw = response.read()
            return json.loads(raw) if raw else {'ok': True}
    except urllib.error.HTTPError as error:
        # Never dump response/request bodies that may contain private material.
        raise RuntimeError(f'GitHub HTTP {error.code}: {method} {path.split("?")[0]}') from None


def publish(directory):
    """Push linear commits through the Git objects API, checking all object IDs."""
    def git(*args):
        return subprocess.check_output(['git', '-C', str(directory), *args], timeout=120)

    remote = request('repos/' + REPO + '/git/ref/heads/main')['object']['sha']
    subprocess.run(['git', '-C', str(directory), 'merge-base', '--is-ancestor', remote, 'HEAD'],
                   check=True, capture_output=True, timeout=30)
    commits = git('rev-list', '--reverse', remote + '..HEAD').decode().splitlines()

    def person(value):
        match = re.fullmatch(r'(.+) <([^>]+)> (\d+) ([+-]\d{4})', value)
        if not match:
            raise RuntimeError('Unsupported Git author format')
        name, email, stamp, offset = match.groups()
        minutes = (int(offset[1:3]) * 60 + int(offset[3:])) * (1 if offset[0] == '+' else -1)
        date = datetime.datetime.fromtimestamp(int(stamp), datetime.timezone(
            datetime.timedelta(minutes=minutes))).isoformat()
        return {'name': name, 'email': email, 'date': date}

    for sha in commits:
        header, message = git('cat-file', '-p', sha).decode('utf-8').split('\n\n', 1)
        lines = header.splitlines()
        if sum(line.startswith('parent ') for line in lines) != 1:
            raise RuntimeError('Only linear commits are supported; remote main was not updated.')
        fields = dict(line.split(' ', 1) for line in lines)
        parent = fields['parent']
        if parent != remote:
            raise RuntimeError('Diverged history; refusing to force push.')
        entries = {}
        for item in git('ls-tree', '-r', '-z', sha).split(b'\0'):
            if not item:
                continue
            metadata, path = item.split(b'\t', 1)
            mode, kind, blob = metadata.decode().split(' ')
            if kind != 'blob':
                raise RuntimeError('Submodules are not supported by this release transport')
            entries[path.decode('utf-8')] = {'mode': mode, 'type': kind, 'sha': blob}
        tree = []
        # Disable rename detection so renamed files are represented as delete + add.
        changed = [path for path in git('diff', '--no-renames', '--name-only', '-z', parent, sha).split(b'\0') if path]
        for index, path in enumerate(changed, 1):
            if index == 1 or index % 25 == 0 or index == len(changed):
                print(f'GitHub objects: {sha[:8]} {index}/{len(changed)}', flush=True)
            path = path.decode('utf-8')
            if path not in entries:
                tree.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': None})
                continue
            entry = entries[path]
            blob = request('repos/' + REPO + '/git/blobs', 'POST', {
                'content': base64.b64encode(git('cat-file', 'blob', entry['sha'])).decode(),
                'encoding': 'base64'})
            if blob['sha'] != entry['sha']:
                raise RuntimeError('Git blob identity mismatch')
            tree.append({'path': path, **entry})
        created = request('repos/' + REPO + '/git/trees', 'POST', {
            'base_tree': git('rev-parse', parent + '^{tree}').decode().strip(), 'tree': tree})
        if created['sha'] != fields['tree']:
            raise RuntimeError('Git tree identity mismatch')
        created = request('repos/' + REPO + '/git/commits', 'POST', {
            'message': message, 'tree': fields['tree'], 'parents': [remote],
            'author': person(fields['author']), 'committer': person(fields['committer'])})
        if created['sha'] != sha:
            raise RuntimeError('Git commit identity mismatch; remote main was not updated.')
        remote = sha
    if commits:
        request('repos/' + REPO + '/git/refs/heads/main', 'PATCH', {'sha': remote, 'force': False})
    return remote
