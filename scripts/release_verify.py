"""Inspect signed CI artifacts without requiring a local Android SDK."""
import hashlib
import json
from pathlib import Path
import struct
import zipfile


def manifest_attributes(data, element='manifest'):
    strings = []
    offset = 8
    while offset < len(data):
        kind, header, size = struct.unpack_from('<HHI', data, offset)
        if size < 8 or offset + size > len(data):
            raise RuntimeError('Invalid Android manifest chunk')
        if kind == 1:
            count, _, flags, start, _ = struct.unpack_from('<IIIII', data, offset + 8)

            def length8(pos):
                a = data[pos]
                return (((a & 127) << 8) | data[pos + 1], pos + 2) if a & 128 else (a, pos + 1)

            for i in range(count):
                pos = offset + start + struct.unpack_from('<I', data, offset + header + i * 4)[0]
                if flags & 256:
                    _, pos = length8(pos)
                    n, pos = length8(pos)
                    value = data[pos:pos + n].decode('utf-8')
                else:
                    n = struct.unpack_from('<H', data, pos)[0]
                    pos += 2
                    if n & 32768:
                        n = ((n & 32767) << 16) | struct.unpack_from('<H', data, pos)[0]
                        pos += 2
                    value = data[pos:pos + n * 2].decode('utf-16-le')
                strings.append(value)
        elif kind == 0x102:
            name = struct.unpack_from('<I', data, offset + 20)[0]
            if strings[name] == element:
                begin, step, count = struct.unpack_from('<HHH', data, offset + 24)
                result = {}
                for i in range(count):
                    pos = offset + 16 + begin + i * step
                    name, raw = struct.unpack_from('<II', data, pos + 4)
                    dtype = data[pos + 15]
                    value = struct.unpack_from('<I', data, pos + 16)[0]
                    result[strings[name]] = strings[raw] if raw != 0xffffffff else strings[value] if dtype == 3 else value
                return result
        offset += size
    raise RuntimeError('Android manifest element not found')


def verify(repo, folder, run_number):
    from cryptography.hazmat.primitives.serialization import pkcs7
    from cryptography.hazmat.primitives import hashes

    def require(condition, message):
        if not condition:
            raise RuntimeError(message)

    identity = json.loads((repo / 'docs/release-identity.json').read_text(encoding='utf-8'))
    manifest = json.loads((folder / 'update.json').read_text(encoding='utf-8'))
    version = '1.0.' + str(run_number)
    filename = 'growing-' + version + '.apk'
    require(manifest['apkUrl'] == filename and manifest['versionName'] == version and
            manifest['versionCode'] == run_number, 'CI artifact version mismatch')
    apk = folder / filename
    digest = hashlib.sha256(apk.read_bytes()).hexdigest()
    require(digest == manifest['sha256'] and apk.stat().st_size == manifest['sizeBytes'],
            'APK does not match update manifest')
    checksums = {Path(name).name: checksum for checksum, name in (
        line.split() for line in (folder / 'SHA256SUMS.txt').read_text().splitlines() if line.strip())}
    require(checksums.get(filename) == digest, 'APK checksum mismatch')
    checked = 0
    # Android's ZIP packager writes UTF-8 names without always setting the ZIP UTF-8 flag.
    with zipfile.ZipFile(apk, metadata_encoding='utf-8') as archive:
        info = manifest_attributes(archive.read('AndroidManifest.xml'))
        require(info['package'] == identity['applicationId'] == manifest['packageName'], 'APK package mismatch')
        require(info['versionName'] == version and info['versionCode'] == run_number, 'Android version mismatch')
        fingerprints = []
        for name in archive.namelist():
            if name.startswith('META-INF/') and name.endswith(('.RSA', '.DSA', '.EC')):
                fingerprints.extend(cert.fingerprint(hashes.SHA256()).hex() for cert in
                                    pkcs7.load_der_pkcs7_certificates(archive.read(name)))
        require(identity['certificateSha256'].replace(':', '').lower() in fingerprints,
                'Fixed APK signing certificate mismatch')
        assets = repo / 'app/src/main/assets'
        expected = {'assets/' + p.relative_to(assets).as_posix(): p for p in assets.rglob('*') if p.is_file()}
        actual = {name for name in archive.namelist() if name.startswith('assets/') and not name.endswith('/')}
        require(actual == set(expected), 'APK packaged asset file list differs from local source')
        for name, source in expected.items():
            require(archive.read(name) == source.read_bytes(), 'APK asset differs: ' + name)
            checked += 1
    return {'versionName': version, 'versionCode': run_number, 'sha256': digest,
            'matchedAssets': checked, 'certificateSha256': identity['certificateSha256'], 'file': str(apk)}
