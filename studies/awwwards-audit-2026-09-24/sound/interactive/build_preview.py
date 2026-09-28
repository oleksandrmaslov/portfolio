"""Generate a local audition of the canonical landing, without changing it."""
from pathlib import Path
import hashlib,json,re
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[3]
source=REPO/'index.html'
html=source.read_text()
html=html.replace('<head>','<head>\n  <base href="../../../../">\n  <meta name="robots" content="noindex">',1)
html=re.sub(r'<title>.*?</title>','<title>M.O. — generative sound preview</title>',html,count=1,flags=re.S)
for name in ['carrier-field','sound-controller','score']:
    html=re.sub(r'\s*<script src="app/landing/audio/'+name+r'\.js[^\"]*"></script>','',html)
scripts='\n'.join('<script src="studies/awwwards-audit-2026-09-24/sound/interactive/'+name+'"></script>' for name in ['score.js','engine.js','portfolio-bridge.js'])
marker='  <!-- Solid materials (plain JS, defined before the rig/cards run) -->'
assert marker in html
html=html.replace(marker,scripts+'\n'+marker,1)
html=html.replace('</head>','<link rel="stylesheet" href="studies/awwwards-audit-2026-09-24/sound/interactive/preview.css">\n</head>',1)
(HERE/'universe.html').write_text(html)
(HERE/'preview-source.json').write_text(json.dumps({'source':'index.html','sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'reuses':'app/landing/runtime.js','changes':'Local base URL; replacement audio scripts; preview controls. Canonical files unchanged.'},indent=2)+'\n')
print('Generated local universe preview from the canonical landing.')
