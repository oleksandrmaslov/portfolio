"""Fetch a small, pinned selection of CC0 VCSL instrument recordings."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
TREE = json.loads((ROOT / 'VCSL-tree.json').read_text())
COMMIT = TREE['sha']
choices = {
    'GrandPno_Main_Sus_' + n + '_v1_rr1.wav'
    for n in ['G1', 'C2', 'F2', 'A2', 'C3', 'E3', 'G3', 'B3', 'D4', 'F4', 'A4', 'C5']
} | {
    'Vibes_soft_' + n + '_v1_' + rr + '_Main.wav'
    for n, rr in [('F2','rr1'), ('A2','rr1'), ('C3','rr2'), ('E3','rr2'), ('G3','rr1'), ('B3','rr1'), ('D4','rr1'), ('F4','rr1'), ('A4','rr1'), ('C5','rr1')]
} | {
    'Marimba_hit_Outrigger_' + n + '_soft_01.wav'
    for n in ['G2', 'B2', 'C4', 'F3', 'G4']
} | {'wood_click_pp_rr1.wav', 'wood_click_pp_rr2.wav', 'wood_click_pp_rr3.wav'}
paths = [item['path'] for item in TREE['tree'] if Path(item['path']).name in choices]
assert len(paths) == len(choices), (len(paths), len(choices))
(ROOT / 'sources').mkdir(exist_ok=True)

def fetch(path):
    url = 'https://raw.githubusercontent.com/sgossner/VCSL/' + COMMIT + '/' + quote(path, safe='/')
    dest = ROOT / 'sources' / Path(path).name
    if not dest.exists():
        with urlopen(url, timeout=90) as response:
            dest.write_bytes(response.read())
    return {'file': dest.name, 'original_path': path, 'url': url,
            'sha256': hashlib.sha256(dest.read_bytes()).hexdigest(), 'license': 'CC0-1.0'}

if __name__ == '__main__':
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        manifest = list(pool.map(fetch, paths + ['LICENSE']))
    (ROOT / 'sources.json').write_text(json.dumps({'library': 'Versilian Community Sample Library',
        'project_url': 'https://versilian-studios.com/vcsl/', 'commit': COMMIT,
        'files': manifest}, indent=2) + '\n')
    print(f'Downloaded {len(manifest)-1} CC0 recordings and the license.')
