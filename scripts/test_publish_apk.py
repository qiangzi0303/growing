"""Exercise both APK upload paths and checksum rejection without network access."""
from contextlib import redirect_stdout
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import importlib.util
spec = importlib.util.spec_from_file_location('publisher', Path(__file__).with_name('publish-apk.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


class PublisherTests(unittest.TestCase):
    def run_publish(self, *, large=False, verify_only=False, corrupt=False):
        payload = b'PK\x03\x04test-installation-bytes'
        manifest = dict(versionName='1.0.12', versionCode=12, apkUrl='growing-1.0.12.apk',
                        sizeBytes=len(payload), sha256=hashlib.sha256(payload).hexdigest())
        calls = []

        class Response(io.BytesIO):
            pass

        class Opener:
            def open(self, request, timeout):
                calls.append(request)
                if request.full_url.endswith('/downloads/update.json'):
                    return Response(json.dumps(manifest).encode())
                if '/downloads/' in request.full_url:
                    return Response(b'wrong bytes' if corrupt else payload)
                return Response(b'{}')

        temp_root = Path(__file__).resolve().parents[2]/'.nmai/tmp'
        temp_root.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=temp_root) as folder:
            folder = Path(folder)
            (folder/manifest['apkUrl']).write_bytes(payload)
            path = folder/'update.json'
            path.write_text(json.dumps(manifest), encoding='utf-8')
            args = ['publish-apk.py','--manifest',str(path),'--site','https://learn.test']
            if verify_only:
                args.append('--verify-only')
            with patch.object(sys,'argv',args), patch.object(publisher.urllib.request,'build_opener',return_value=Opener()), \
                    patch.dict(publisher.os.environ, {'APK_PUBLISH_TOKEN':'test-only-publisher'}), \
                    patch.object(publisher,'SINGLE_FILE_BYTES',8 if large else 100), \
                    patch.object(publisher,'PART_BYTES',8), redirect_stdout(io.StringIO()):
                publisher.main()
        return payload, manifest, calls

    def test_small_file_keeps_existing_upload_protocol(self):
        payload, manifest, calls = self.run_publish()
        writes = [r for r in calls if r.get_method() != 'GET']
        self.assertEqual(len(writes),2)
        self.assertEqual(writes[0].data,payload)
        self.assertTrue(writes[0].full_url.endswith('/files/'+manifest['sha256']+'.apk'))
        self.assertTrue(writes[1].full_url.endswith('/publish'))

    def test_large_file_uploads_hashed_parts_before_completion_and_publication(self):
        payload, manifest, calls = self.run_publish(large=True)
        writes = [r for r in calls if r.get_method() != 'GET']
        parts = writes[:-2]
        self.assertEqual(b''.join(r.data for r in parts),payload)
        expected = []
        for request in parts:
            checksum = hashlib.sha256(request.data).hexdigest()
            self.assertTrue(request.full_url.endswith('/parts/'+checksum))
            expected.append(dict(sha256=checksum,sizeBytes=len(request.data)))
        self.assertEqual(json.loads(writes[-2].data),dict(parts=expected))
        self.assertTrue(writes[-2].full_url.endswith('/files/'+manifest['sha256']+'.apk/complete'))
        self.assertTrue(writes[-1].full_url.endswith('/publish'))

    def test_verify_only_never_uploads_even_for_large_files(self):
        _, _, calls = self.run_publish(large=True,verify_only=True)
        self.assertTrue(all(r.get_method()=='GET' for r in calls))

    def test_downloaded_bytes_must_match_local_signed_apk(self):
        with self.assertRaisesRegex(RuntimeError,'checksum mismatch'):
            self.run_publish(large=True,corrupt=True)


if __name__ == '__main__':
    unittest.main()
