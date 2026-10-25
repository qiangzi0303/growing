"""Import the reviewed 53 source question blocks without reconstructing damaged text."""
from pathlib import Path
import hashlib
import json
import shutil
import pymupdf
from PIL import Image

repo = Path(__file__).resolve().parents[1]
project = repo.parent
source = project / 'math/1025141010.pdf'
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
if source_hash != 'b2427c42c4c0ce6aae3e5d32e3558d0dcdaddd306f5c90d11d1de5d8245d92f2':
    raise ValueError('The source PDF changed; review question boundaries before importing.')
design = project / 'app-design'
packaged = repo / 'app/src/main/assets/web/app-design'
# Reviewed label positions in the 1.4x render. Each block ends before the next label.
starts = [
    [25,186,549,724], [25,482,800], [25,172,347,605,900],
    [25,212,377,540,716], [25], [25,721,917], [25,372,523,670],
    [25,533], [25,226,493,809], [25,183,477], [25,216,486,942],
    [25,293,654,994], [25,212,595], [25,421,603,796], [25,298,582], [25]
]
triangles = {1,2,3,4,5,6,13,14,15,16,18,19,21,22,25,27}
reals = {7,8,9,10,11,12,23}
factors = {17,20,24,26}
def unit(number):
    if number in triangles: return 'math-8a-01'
    if number in reals: return 'math-8a-02'
    if number in factors: return 'math-8b-09'
    return 'math-8b-10'

doc = pymupdf.open(source)
if len(doc) != 16 or sum(map(len, starts)) != 53:
    raise ValueError('The reviewed source must contain 16 pages and 53 question blocks.')
output = design / 'math-wrong-questions/1025141010'
number = 0
manifest = []
for index, page in enumerate(doc):
    pix = page.get_pixmap(matrix=pymupdf.Matrix(1.4,1.4), alpha=False)
    image = Image.frombytes('RGB', (pix.width,pix.height), pix.samples)
    if image.size != (833,1179):
        raise ValueError(f'Unexpected source page size: {image.size}')
    positions = starts[index]
    for j, top in enumerate(positions):
        number += 1
        bottom = positions[j+1]-10 if j+1<len(positions) else image.height-65
        crop = image.crop((30,max(0,top-8),813,bottom))
        ink = crop.convert('L').point(lambda v:255 if v<180 else 0)
        box = ink.getbbox()
        if not box:
            raise ValueError(f'Empty question {number}')
        crop = crop.crop((0,0,crop.width,min(crop.height,box[3]+14)))
        relative = Path(unit(number)) / f'{number:02}.jpg'
        target = output / relative
        target.parent.mkdir(parents=True,exist_ok=True)
        crop.save(target,quality=94,subsampling=0)
        manifest.append({'number':number,'page':index+1,'unitId':unit(number),'image':relative.as_posix()})

manifest_path = output / 'manifest.json'
manifest_path.write_text(json.dumps({
    'source':source.name,'sha256':source_hash,
    'pages':len(doc),'questions':manifest
},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name in ['math-wrong-questions.html','math-wrong-questions.js','math-wrong-questions.css','math-wrong-questions-data.js','question-attempts.js','question-attempts.css']:
    shutil.copyfile(design/name,packaged/name)
shutil.copytree(output,packaged/'math-wrong-questions/1025141010',dirs_exist_ok=True)
print(json.dumps({'pages':len(doc),'questions':number,'units':{
    u:sum(q['unitId']==u for q in manifest)
    for u in sorted({q['unitId'] for q in manifest})
}},ensure_ascii=False))
