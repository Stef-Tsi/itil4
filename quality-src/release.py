"""Keep a release internally consistent even when a preview CDN caches old branch files."""
from pathlib import Path
import hashlib,json,shutil
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'training'
assert (OUT/'quality-audit.json').is_file(), 'Build and audit the contrast edition first'
h=hashlib.sha256()
for p in sorted(OUT.rglob('*')):
    if p.is_file():
        h.update(str(p.relative_to(OUT)).encode());h.update(b'\0');h.update(p.read_bytes())
revision=h.hexdigest()
name='contrast-'+revision[:14]
old='/Stef-Tsi/itil4/service-quest-training/training'
base='/Stef-Tsi/itil4/service-quest-training/'+name
release=ROOT/name
if release.exists():
    # This directory is generated exclusively from the current deterministic build.
    shutil.rmtree(release)
shutil.copytree(OUT,release)
for p in release.rglob('*'):
    if p.is_file() and p.suffix in ('.html','.js','.css','.rsc','.json','.svg','.txt'):
        original=p.read_text(encoding='utf-8')
        p.write_text(original.replace(old,base),encoding='utf-8')
info={'revision':revision,'directory':name,'assetBase':base,'entryPath':name+'/index.html','version':'coherent-contrast-1'}
(release/'release.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
(OUT/'release.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
# A refreshed stable entry points to the same coherent release. Old pinned links remain untouched.
(OUT/'index.html').write_text((release/'index.html').read_text(encoding='utf-8'),encoding='utf-8')
print(json.dumps(info,indent=2))
