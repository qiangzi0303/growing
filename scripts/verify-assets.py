from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
web=root/'app/src/main/assets/web'
if not (web/'app-design/english-visual-atlas.svg').is_file():raise SystemExit('Missing English SVG vocabulary atlas')
if not (web/'app-design/english-motion.js').is_file():raise SystemExit('Missing articulated English motion model')
if not (web/'app-design/english-motion-NOTICE.txt').is_file():raise SystemExit('Missing Xiaohei character attribution and license')
for name in ['english-visual-quiz.html','english-visual-quiz.js']:
    if not (web/'app-design'/name).is_file():raise SystemExit('Missing English visual quiz asset: '+name)
for name in ['math-format.js','math-format.css','vendor/katex/katex.min.js','vendor/katex/katex.min.css','vendor/katex/LICENSE.txt']:
    if not (web/'cloud'/name).is_file():raise SystemExit('Missing offline math typesetting asset: '+name)
if not (web/'app-design/math-wrong-questions-transcribed.js').is_file():raise SystemExit('Missing standard math question transcriptions')
for name in ['math-explore-lab.html','math-lab.css','math-lab-models.js','math-lab.js','triangle-centers.html','triangle-centers.css']:
    if not (web/'app-design'/name).is_file():raise SystemExit('Missing Math interactive asset: '+name)
for name in ['growth-assessment.html','growth-assessment.css','growth-assessment-core.js','growth-assessment-original.js','growth-quadrant-data.js','growth-quadrant-core.js','growth-quadrant-LICENSE.txt']:
    if not (web/'app-design'/name).is_file():raise SystemExit('Missing growth assessment asset: '+name)
for name in ['unit-summary.html','unit-summary.css','unit-summary-core.js','unit-summary.js','unit-summary-legacy.js']:
    if not (web/'app-design'/name).is_file():raise SystemExit('Missing unit summary asset: '+name)
for name in ['english-course.html','english-course.css','english-course.js','english-vocabulary.js','english-lessons.js','english-engine.js','word-mastery-rules.js','word-mastery.js','word-mastery.css','english-visual-lab.html','english-visual-lab.css','english-visual-lab.js','english-visual-data.js']:
    if not (web/'app-design'/name).is_file():raise SystemExit('Missing English learning asset: '+name)
for name in ['physics-course.html','physics-knowledge.html','physics-sound-lab.html','physics-explore-lab.html','physics-course.css','physics-builder.js','physics-data.js','physics-figures.js']+['physics-'+chapter+'.js' for chapter in ['sound','light','lenses','thermal','motion']]:
    if not (web/'app-design'/name).is_file():raise SystemExit('Missing Physics learning asset: '+name)
for name in ['app-design/index.html','app-design/home.css','app-design/units.html','app-design/study.html','app-design/knowledge.html','app-design/panorama.js','app-design/math-data.js','app-design/math-course.html','app-design/reward-engine.js','app-design/unit-rewards.js','word-ops-unit3/index.html','fraction-ops/分式作战_一分钟学习版.html']:
    path=web/name
    if not path.is_file():raise SystemExit('Missing required learning asset: '+name)
for path in web.rglob('*'):
    if path.is_file() and path.suffix in ('.html','.js','.css'):
        text=path.read_text(encoding='utf-8')
        if re.search(r'sk-[a-zA-Z0-9_-]{12,}',text):raise SystemExit('Embedded API credential detected; publishing blocked.')
        if path.suffix=='.html':
            from urllib.parse import urlsplit,unquote
            for link in re.findall(r'<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"',text):
                url=urlsplit(link)
                if not url.scheme and url.path and not url.path.startswith('/'):
                    resolved=(path.parent/unquote(url.path)).resolve()
                    if not resolved.is_relative_to(web.resolve()) or not resolved.is_file():raise SystemExit('Missing local web dependency in '+path.name)
for pattern in ['*.jks','*.keystore','signing.json']:
    if list(root.glob('**/'+pattern)):raise SystemExit('Private signing material must not be in this repository.')
print('Offline learning assets present; no embedded API credentials or signing files.')
