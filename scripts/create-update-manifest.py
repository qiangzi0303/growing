"""Generate update.json beside a signed APK. Upload the APK first and JSON last."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import quote


def create_manifest(apk, version_code, version_name, notes=''):
    apk = Path(apk)
    if not apk.is_file() or apk.suffix != '.apk' or apk.stat().st_size == 0:
        raise ValueError('A non-empty signed .apk file is required')
    if not 1 <= version_code <= 2147483647:
        raise ValueError('versionCode must be a positive Android integer')
    if not version_name.strip() or len(version_name) > 80 or any(ord(c) < 32 for c in version_name):
        raise ValueError('Invalid versionName')
    with apk.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    return {
        'schemaVersion': 1,
        'packageName': 'com.qiangzi0303.growing',
        'versionCode': version_code,
        'versionName': version_name,
        'apkUrl': quote(apk.name, safe=''),
        'notes': notes.strip()[:4000],
        'sizeBytes': apk.stat().st_size,
        'sha256': digest,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apk', required=True, type=Path)
    parser.add_argument('--version-code', required=True, type=int)
    parser.add_argument('--version-name', required=True)
    parser.add_argument('--notes-file', type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    notes = args.notes_file.read_text(encoding='utf-8') if args.notes_file else ''
    result = create_manifest(args.apk, args.version_code, args.version_name, notes)
    # A relative apkUrl works when these files share the same hosting directory.
    if args.output.resolve().parent != args.apk.resolve().parent:
        parser.error('Place update.json in the same directory as the APK')
    if args.output.resolve() == args.apk.resolve():
        parser.error('Output must not overwrite the APK')
    temporary = args.output.with_name(args.output.name + '.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(args.output)
    print(f'Created {args.output} for {args.apk.name} (code {args.version_code})')


if __name__ == '__main__':
    main()
