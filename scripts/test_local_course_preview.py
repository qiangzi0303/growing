import importlib.util
import json
from pathlib import Path
import threading
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

spec = importlib.util.spec_from_file_location('local_preview', Path(__file__).with_name('local-course-preview.py'))
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class LocalPreviewTests(unittest.TestCase):
    def setUp(self):
        self.loads = 0
        def config():
            self.loads += 1
            return {'models': [{'id': 'chat', 'apiKey': 'fixture-secret'}]}
        self.server = preview.create_server(0, config)
        self.origin = f'http://127.0.0.1:{self.server.server_port}'
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def get(self, path, headers=None):
        try:
            response = urlopen(Request(self.origin + path, headers=headers or {}), timeout=3)
        except HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, response.read().decode('utf-8')

    def test_same_origin_config_uses_existing_loader_without_caching(self):
        status, headers, body = self.get(preview.CONFIG_ROUTE, {'X-Growing-Local': '1', 'Origin': self.origin})
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body)['models'][0]['apiKey'], 'fixture-secret')
        self.assertEqual(headers['Cache-Control'], 'no-store, private')
        self.assertIsNone(headers.get('Access-Control-Allow-Origin'))
        self.assertEqual(self.loads, 1)

    def test_other_origins_and_missing_client_header_cannot_read_config(self):
        for headers in [{}, {'X-Growing-Local': '1', 'Origin': 'https://other.test'},
                        {'X-Growing-Local': '1', 'Host': 'other.test'},
                        {'X-Growing-Local': '1', 'Sec-Fetch-Site': 'cross-site'}]:
            status, _, body = self.get(preview.CONFIG_ROUTE, headers)
            self.assertEqual(status, 403)
            self.assertNotIn('fixture-secret', body)
        self.assertEqual(self.loads, 0)

    def test_classroom_is_served_but_project_sources_and_credentials_are_not(self):
        self.assertEqual(self.get('/app-design/english-course.html')[0], 200)
        for path in ['/.nmai/duck-realtime.json', '/growing/cloudflare/.dev.vars', '/%2e%2e/%2e%2e/.dev.vars', '/app-design/tests/course-ai.test.cjs']:
            self.assertEqual(self.get(path)[0], 404)

    def test_failure_is_safe_and_auth_expiry_is_actionable(self):
        def failure():
            raise RuntimeError('fixture-secret')
        self.server.config_loader = failure
        status, _, body = self.get(preview.CONFIG_ROUTE, {'X-Growing-Local': '1'})
        self.assertEqual(status, 503)
        self.assertNotIn('fixture-secret', body)
        def expired():
            raise PermissionError('private authorization detail')
        self.server.config_loader = expired
        status, _, body = self.get(preview.CONFIG_ROUTE, {'X-Growing-Local': '1'})
        self.assertEqual(status, 503)
        self.assertIn('授权已过期', body)
        self.assertNotIn('private authorization detail', body)


if __name__ == '__main__':
    unittest.main()
