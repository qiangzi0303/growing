"""Standalone loopback classrooms with the administrator's managed chat configuration.

Only public web assets are served. Configuration is read through the developer's
Cloudflare authorization and kept in memory; no cloud login or learning data is changed.
"""
import argparse
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import subprocess
from urllib.parse import unquote, urlsplit
from urllib.request import getproxies

REPO = Path(__file__).resolve().parents[1]
PUBLIC = REPO / 'app/src/main/assets/web'
CONFIG_ROUTE = '/api/local-course-ai/config'


def load_config():
    node = shutil.which('node')
    if not node:
        raise RuntimeError('Node unavailable')
    env = os.environ.copy()
    for name, value in getproxies().items():
        if name in ('http', 'https'):
            env.setdefault(name.upper() + '_PROXY', value)
    result = subprocess.run([
        node, str(REPO / 'cloudflare/node_modules/tsx/dist/cli.mjs'),
        str(REPO / 'scripts/local-course-ai-config.mts')
    ], cwd=REPO, env=env, capture_output=True, timeout=45,
        creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if result.returncode == 3:
        raise PermissionError('Cloudflare 本机授权已过期，请重新登录 Cloudflare 后重试。')
    if result.returncode:
        raise RuntimeError('Managed configuration unavailable')
    data = json.loads(result.stdout)
    if not data.get('models') or not data['models'][0].get('apiKey'):
        raise RuntimeError('Managed chat model unavailable')
    return data


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def local_request(self):
        host = self.headers.get('Host', '')
        return (host in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}')
                and self.headers.get('Origin') in (None, 'http://' + host)
                and self.headers.get('Sec-Fetch-Site') in (None, 'none', 'same-origin'))

    def json_response(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store, private')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if not self.local_request():
            return self.json_response(403, {'error': '请从本机课堂页面访问。'})
        path = urlsplit(self.path).path
        if path == '/api/local-course-ai/health':
            return self.json_response(200, {'service': 'growing-local-course', 'version': 1})
        if path == CONFIG_ROUTE:
            if self.headers.get('X-Growing-Local') != '1':
                return self.json_response(403, {'error': '请从本机课堂页面读取 AI 配置。'})
            try:
                return self.json_response(200, self.server.config_loader())
            except PermissionError:
                return self.json_response(503, {'error': 'Cloudflare 本机授权已过期，请重新登录 Cloudflare 后重试；学习草稿已保留。'})
            except (OSError, ValueError, RuntimeError, subprocess.SubprocessError):
                return self.json_response(503, {'error': '本机暂时无法读取后台 AI 配置，请检查网络与 Cloudflare 授权后重试。'})
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/app-design/index.html')
            self.end_headers()
            return
        super().do_GET()

    def send_head(self):
        relative = unquote(urlsplit(self.path).path).lstrip('/')
        parts = Path(relative).parts
        file = (PUBLIC / relative).resolve()
        if (not self.local_request() or '\\' in relative or ':' in relative
                or any(p.startswith('.') or p in ('tests', 'node_modules') for p in parts)
                or not file.is_relative_to(PUBLIC.resolve()) or not file.is_file()):
            self.send_error(404)
            return None
        return super().send_head()

    def log_message(self, *_):
        pass  # Do not log classroom prompts, credentials or request URLs.


def create_server(port=8797, config_loader=load_config):
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.config_loader = config_loader
    return server


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8797)
    options = parser.parse_args()
    with create_server(options.port) as server:
        print(f'Local classrooms: http://127.0.0.1:{server.server_port}/app-design/english-course.html', flush=True)
        server.serve_forever()
