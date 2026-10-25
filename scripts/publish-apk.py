"""Upload a verified CI APK to the site's private publish API, then verify public bytes."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit

MAX_APK_BYTES = 100 * 1024 * 1024
SINGLE_FILE_BYTES = 25 * 1024 * 1024
PART_BYTES = 20 * 1024 * 1024

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *_args, **_kwargs): return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--site')
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    site = (args.site or json.loads((repo/'platform-site.json').read_text(encoding='utf-8'))['apiBaseUrl']).rstrip('/')
    uri = urlsplit(site)
    if uri.scheme != 'https' or not uri.hostname or uri.username or uri.password or uri.path or uri.query or uri.fragment:
        raise ValueError('Publish site must be an HTTPS origin')
    manifest = json.loads(args.manifest.read_text(encoding='utf-8'))
    filename = 'growing-' + manifest['versionName'] + '.apk'
    if manifest['apkUrl'] != filename or Path(filename).name != filename or '/' in filename or '\\' in filename:
        raise ValueError('Manifest must reference its own local APK filename')
    apk = args.manifest.parent/filename
    data = apk.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    if not data or len(data) > MAX_APK_BYTES or len(data) != manifest['sizeBytes'] or digest != manifest['sha256']:
        raise ValueError('APK size or checksum does not match manifest, or exceeds 100 MiB')
    token = os.environ.get('APK_PUBLISH_TOKEN', '')
    if not args.verify_only and not token:
        raise RuntimeError('APK_PUBLISH_TOKEN is required; never pass it on the command line')
    opener = urllib.request.build_opener(NoRedirect())

    def send(path, method='GET', body=None, authenticated=False):
        headers = {'User-Agent':'Growing-CI-Publisher','X-Growing-Client':'1','Cache-Control':'no-cache'}
        if authenticated: headers['Authorization'] = 'Bearer ' + token
        if body is not None: headers['Content-Type'] = 'application/octet-stream' if method=='PUT' else 'application/json'
        for attempt, delay in enumerate([2,4,8,16,30,0]):
            try:
                request = urllib.request.Request(site+path,data=body,headers=headers,method=method)
                with opener.open(request,timeout=60) as response:
                    return response.read()
            except urllib.error.HTTPError as error:
                if error.code not in (429,500,502,503,504) or not delay:
                    raise RuntimeError(f'Publish site returned HTTP {error.code} for {path}; credentials were not logged') from None
            except urllib.error.URLError:
                if not delay: raise RuntimeError('Publish site network request failed: '+path) from None
            print('Site distribution is not ready; retrying ('+str(attempt+1)+').',flush=True)
            time.sleep(delay)
        raise RuntimeError('Site request failed')

    if not args.verify_only:
        if len(data) <= SINGLE_FILE_BYTES:
            send('/api/releases/files/'+digest+'.apk','PUT',data,True)
        else:
            parts = []
            count = (len(data) + PART_BYTES - 1) // PART_BYTES
            for index, offset in enumerate(range(0, len(data), PART_BYTES), 1):
                part = data[offset:offset+PART_BYTES]
                checksum = hashlib.sha256(part).hexdigest()
                print(f'Uploading APK part {index}/{count}.', flush=True)
                send('/api/releases/parts/'+checksum,'PUT',part,True)
                parts.append({'sha256':checksum,'sizeBytes':len(part)})
            send('/api/releases/files/'+digest+'.apk/complete','POST',json.dumps({'parts':parts}).encode('utf-8'),True)
        send('/api/releases/publish','POST',json.dumps(manifest,ensure_ascii=False).encode('utf-8'),True)
    for delay in [2,4,8,16,30,0]:
        remote = json.loads(send('/downloads/update.json'))
        if remote['versionCode'] >= manifest['versionCode']: break
        if not delay: raise RuntimeError('Site still advertises an older version after KV propagation retries')
        print('Waiting for the new APK to reach this download location.',flush=True)
        time.sleep(delay)
    downloaded = send('/downloads/'+filename)
    if len(downloaded) != len(data) or hashlib.sha256(downloaded).hexdigest() != digest:
        raise RuntimeError('Public APK download checksum mismatch')
    print('Cloudflare APK verified: '+filename+' ('+str(len(data))+' bytes)')
    print('Update manifest: '+site+'/downloads/update.json')


if __name__ == '__main__':
    main()
