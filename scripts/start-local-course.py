"""Start the standalone classroom in the background without changing its storage origin."""
from pathlib import Path
import argparse
import json
import subprocess
import sys
import time
from urllib.request import urlopen

root = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description='Start a local classroom with managed AI on its existing port.')
parser.add_argument('--port', type=int, default=8797)
options = parser.parse_args()
if not 1 <= options.port <= 65535:
    parser.error('--port must be between 1 and 65535')
origin = f'http://127.0.0.1:{options.port}'
health = origin + '/api/local-course-ai/health'


def ready():
    try:
        with urlopen(health, timeout=2) as response:
            return json.load(response).get('service') == 'growing-local-course'
    except (OSError, ValueError):
        return False


if not ready():
    logs = root / '.nmai/tmp'
    logs.mkdir(parents=True, exist_ok=True)
    log_path = logs / ('local-course-preview.log' if options.port == 8797 else f'local-course-preview-{options.port}.log')
    with log_path.open('ab') as log:
        child = subprocess.Popen([sys.executable, '-u', str(Path(__file__).with_name('local-course-preview.py')), '--port', str(options.port)],
                                 cwd=root, stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                                 creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    for _ in range(20):
        if ready():
            break
        if child.poll() is not None:
            raise SystemExit(f'本地课堂启动失败或 {options.port} 端口已被其他服务占用，请查看 {log_path}')
        time.sleep(.25)
    else:
        raise SystemExit(f'本地课堂尚未就绪，请查看 {log_path}')
print(f'本地课堂已就绪：{origin}/app-design/english-course.html')
