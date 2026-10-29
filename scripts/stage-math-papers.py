"""Package reviewed project papers with portable links for the learning site/APK."""
from pathlib import Path
import re

project = Path(__file__).resolve().parents[2]
source = project / 'math/期中试卷'
target = project / 'app-design'
names = {
    '期中复习卷_题目还原.html': 'math-exam-midterm.html',
    '期中卷_知识图谱.html': 'math-exam-midterm-graph.html',
    '期中卷_知识图谱导航.js': 'math-exam-midterm-graph.js',
}
for original, packaged in names.items():
    text = (source / original).read_text(encoding='utf-8')
    text = text.replace('../../growing/app/src/main/assets/web/app-design/', '')
    for old, new in names.items():
        text = text.replace(old, new)
    if packaged.endswith('.html'):
        nav = '<nav class="paper-site-nav" aria-label="试卷导航"><a href="units.html?subject=math&term=upper">← 我的试卷</a> · <a href="math-exam-midterm-graph.html">交互知识图谱</a> · <a href="math-exam-midterm.html">无答案试卷</a></nav>'
        text = re.sub(r'(<body\b[^>]*>)', lambda m: m[0] + nav, text, count=1)
        text = text.replace('</head>', '<style>.paper-site-nav{padding:14px 20px;font:14px/1.8 "Microsoft YaHei",sans-serif;background:#f7f8f3;color:#765331}.paper-site-nav a{display:inline-block;padding:6px;color:inherit}.paper-site-nav a:focus-visible{outline:2px solid currentColor}@media print{.paper-site-nav{display:none!important}}</style></head>', 1)
    (target / packaged).write_text(text, encoding='utf-8', newline='\n')
print('Packaged 3 reviewed math paper assets with local course links.')
