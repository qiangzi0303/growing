from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
identity=json.loads((root/'docs/release-identity.json').read_text())
expected=identity['certificateSha256'].replace(':','').lower()
text=Path(sys.argv[1]).read_text()
match=re.search(r'Signer #1 certificate SHA-256 digest: ([a-fA-F0-9]+)',text)
if not match or match.group(1).lower()!=expected:raise SystemExit('Signing certificate mismatch. Release blocked to protect upgrade compatibility.')
print('Fixed release certificate verified.')
