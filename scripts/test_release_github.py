"""Offline transport tests for safe retries and interrupted object uploads."""
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

import release_github as gh


class TransportTests(unittest.TestCase):
    def test_idempotent_git_object_request_retries_network_timeout(self):
        with patch.object(gh,'token',return_value='fixture-only'), \
                patch.object(gh.opener,'open',side_effect=[TimeoutError(),io.BytesIO(b'{"sha":"ok"}')]) as request, \
                patch.object(gh.time,'sleep'),redirect_stdout(io.StringIO()):
            self.assertEqual(gh.request('repos/test/git/blobs','POST',{}),{'sha':'ok'})
        self.assertEqual(request.call_count,2)

    def test_forbidden_request_is_not_retried(self):
        error=urllib.error.HTTPError('https://api.github.com/test',403,'Forbidden',{},None)
        with patch.object(gh,'token',return_value='fixture-only'),patch.object(gh.opener,'open',side_effect=error) as request:
            with self.assertRaisesRegex(RuntimeError,'HTTP 403'):
                gh.request('repos/test/git/blobs','POST',{})
        self.assertEqual(request.call_count,1)

    def test_dispatch_timeout_is_not_retried(self):
        with patch.object(gh,'token',return_value='fixture-only'),patch.object(gh.opener,'open',side_effect=TimeoutError()) as request:
            with self.assertRaisesRegex(RuntimeError,'network request failed'):
                gh.request('repos/test/actions/workflows/build.yml/dispatches','POST',{})
        self.assertEqual(request.call_count,1)

    def test_resume_reuses_only_objects_with_verified_server_identity(self):
        parent,commit,blob,tree,base_tree=[c*40 for c in 'abcde']
        def git(command,**kwargs):
            args=command[3:]
            if args[0]=='rev-list':return (commit+'\n').encode()
            if args[:2]==['cat-file','-p']:
                return (f'tree {tree}\nparent {parent}\nauthor Test <test@example.test> 1700000000 +0000\ncommitter Test <test@example.test> 1700000000 +0000\n\nFixture\n').encode()
            if args[0]=='ls-tree':return f'100644 blob {blob}\tfixture.txt\0'.encode()
            if args[0]=='diff':return b'fixture.txt\0'
            if args[0]=='rev-parse':return base_tree.encode()
            if args[:2]==['cat-file','blob']:return b'fixture bytes'
            raise AssertionError(args)
        calls=[];fail_tree=True
        def api(path,method='GET',body=None):
            nonlocal fail_tree
            calls.append((path,method))
            if method=='GET':return {'object':{'sha':parent}}
            if path.endswith('/git/blobs'):return {'sha':blob}
            if path.endswith('/git/trees'):
                if fail_tree:fail_tree=False;raise RuntimeError('connection interrupted')
                return {'sha':tree}
            if path.endswith('/git/commits'):return {'sha':commit}
            if method=='PATCH':self.assertFalse(body['force']);return {}
            raise AssertionError(path)
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2]/'.nmai/tmp') as folder, \
                patch.object(gh.subprocess,'check_output',side_effect=git), \
                patch.object(gh.subprocess,'run'),patch.object(gh,'request',side_effect=api),redirect_stdout(io.StringIO()):
            repo=Path(folder)/'repo'
            with self.assertRaisesRegex(RuntimeError,'connection interrupted'):gh.publish(repo)
            saved=json.loads((Path(folder)/'.nmai/releases/github-objects.json').read_text())
            self.assertEqual(saved['objects'],[blob]);self.assertEqual(saved['base'],parent)
            self.assertEqual(gh.publish(repo),commit)
        self.assertEqual(sum(path.endswith('/git/blobs') for path,method in calls),1)


if __name__=='__main__':
    unittest.main()
