"""Build an uncompressed Service Quest training edition; preserve the original export."""
from pathlib import Path
import json, shutil, hashlib
ROOT=Path(__file__).resolve().parent.parent
SRC=ROOT/'training-src'
OUT=ROOT/'training'
BASE='/Stef-Tsi/itil4/service-quest-training/training'
concepts=[]
for p in sorted(SRC.glob('concepts-*.txt')):
    for line in p.read_text(encoding='utf-8').splitlines():
        if not line.strip():continue
        v=line.split('|');assert len(v)==8,(p,v)
        key,crit,term,definition,nl,hook,scenario,distractors=v
        concepts.append(dict(id=key,criterion=crit,lo=int(crit[0]),term=term,definition=definition,nl=nl,hook=hook,scenario=scenario,distractors=distractors.split(',')))
C={c['id']:c for c in concepts}
assert len(C)==len(concepts)==78
questions=[]
for c in concepts:
    ds=[C[x] for x in c['distractors']]
    assert len(ds)==3 and c not in ds and len({d['term'] for d in [c]+ds})==4,c['id']
    for kind in ('identify','definition','scenario'):
        opts=[x['term'] for x in [c]+ds]
        reasons=[x['definition'] for x in [c]+ds]
        if kind=='identify':prompt='Which term BEST matches this description?\n'+c['definition']
        elif kind=='definition':
            prompt='Which statement BEST describes '+c['term']+'?'
            opts=reasons[:];reasons=[x['term']+': '+x['definition'] for x in [c]+ds]
        else:prompt=c['scenario']
        questions.append(dict(id='train-'+c['id']+'-'+kind,criterion=c['criterion'],lo=c['lo'],tag=c['term'],conceptId=c['id'],kind=kind,prompt=prompt,options=opts,why=c['term']+': '+c['definition']+' '+' '.join(x['term']+': '+x['definition'] for x in ds),whyNl=c['nl'],hook=c['hook'],optionReasons=reasons,optionReasonsNl=[x['nl'] for x in [c]+ds],challenge=kind=='scenario'))
for p in sorted(SRC.glob('scenarios-*.txt')):
    for i,line in enumerate(p.read_text(encoding='utf-8').splitlines()):
        if not line.strip():continue
        v=line.split('|');assert len(v)==10,(p,i)
        crit,tag,prompt,*tail=v
        options=tail[:4];why,nl,hook=tail[4:]
        questions.append(dict(id='train-'+p.stem+'-'+str(i+1),criterion=crit,lo=int(crit[0]),tag=tag,kind='scenario',prompt=prompt,options=options,why=why,whyNl=nl,hook=hook,challenge=True))
assert len({q['id'] for q in questions})==len(questions)
assert len({q['prompt'] for q in questions})==len(questions)
for q in questions:assert len(q['options'])==len(set(q['options']))==4,q['id']
if OUT.exists():shutil.rmtree(OUT)
shutil.copytree(ROOT/'service-quest',OUT)
for path in OUT.rglob('*'):
    if path.is_file() and path.suffix in ('.html','.js','.css','.rsc','.json','.svg','.txt'):
        text=path.read_text(encoding='utf-8')
        path.write_text(text.replace('/itil4/service-quest',BASE),encoding='utf-8')
data=dict(version='training-live-1',concepts=concepts,questions=questions)
(OUT/'training-data.js').write_text('window.SQ_TRAINING_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
for f in ('training.js','training.css'):shutil.copy2(SRC/f,OUT/f)
p=OUT/'index.html';s=p.read_text(encoding='utf-8')
s=s.replace('182<!-- --> original questions',str(182+len(questions))+'<!-- --> original questions')
s=s.replace('<head>','<head><link rel="stylesheet" href="training.css"><script src="training-data.js"></script><script src="training.js" defer></script>',1)
# Version only changed UI assets, keeping the same origin and local save key.
for asset in ('training.js','training.css'):
    digest=hashlib.sha256((OUT/asset).read_bytes()).hexdigest()[:12]
    s=s.replace('"'+asset+'"','"'+asset+'?v='+digest+'"')
p.write_text(s,encoding='utf-8')
p=OUT/'_next/static/chunks/game-DXb1F_Z4.js';s=p.read_text(encoding='utf-8')
old='value:`missions`,children:['
assert s.count(old)==1
card='(0,h.jsxs)(`section`,{className:`sq-launch`,children:[(0,h.jsx)(`p`,{children:`NEW · ENGLISH TRAINING MISSIONS`}),(0,h.jsx)(`h2`,{children:`Know the terms. Make the right connection.`}),(0,h.jsx)(`p`,{children:`Mixed rounds of 10, 20 or 30 tasks. Match four statements to six terms, or practise multiple-choice questions. Detailed English and Dutch feedback.`}),(0,h.jsx)(`button`,{className:`btn primary`,onClick:()=>window.SQTraining.open(),children:`Start mixed training`})]}),'
s=s.replace(old,old+card,1)
hook="\nif(window.SQ_TRAINING_DATA){const extra=window.SQ_TRAINING_DATA.questions;rh.push(...extra);th.push(...extra.filter(q=>q.challenge));extra.forEach(q=>n_.set(q.id,q));window.SQ_ALL_QUESTIONS=rh;window.dispatchEvent(new Event('sq-training-ready'));}\n"
assert s.count('export{h_ as default};')==1
s=s.replace('export{h_ as default};',hook+'export{h_ as default};')
p.write_text(s,encoding='utf-8')
(OUT/'.nojekyll').touch()
stats=dict(addedQuestions=len(questions),concepts=len(concepts),scenarioQuestions=sum(q['kind']=='scenario' for q in questions),definitionExercises=sum(q['kind']!='scenario' for q in questions),publicURL='https://raw.githack.com'+BASE+'/index.html',note='Original practice material. Matching is a learning exercise, not an official exam format. No content accreditation or guarantee of exam equivalence.')
(OUT/'build-info.json').write_text(json.dumps(stats,indent=2),encoding='utf-8')
print(json.dumps(stats,indent=2))
