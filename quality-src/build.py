"""Post-process the existing uncompressed export. Does not overwrite the original game."""
from pathlib import Path
from collections import Counter
import json, subprocess, hashlib, re
ROOT=Path(__file__).resolve().parent.parent
SRC=ROOT/'quality-src';OUT=ROOT/'training'
def jd(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))
def replace_once(s,old,new):
    assert s.count(old)==1,('Unexpected source occurrence',old[:120],s.count(old))
    return s.replace(old,new,1)
def array_expr(s,start):
    depth=0;quote=None;escape=False
    for i in range(start,len(s)):
        c=s[i]
        if quote:
            if escape:escape=False;continue
            if c=='\\':escape=True;continue
            if c==quote:quote=None
            continue
        if c in ('"',"'",'`'):quote=c;continue
        if c=='[':depth+=1
        if c==']':
            depth-=1
            if depth==0:return s[start:i+1]
    raise ValueError('Unclosed data array')
s=(ROOT/'service-quest/_next/static/chunks/game-DXb1F_Z4.js').read_text()
expr=array_expr(s,s.index('th=[Q(')+3)
node="const Q=(id,criterion,tag,prompt,options,why,hook)=>({id,criterion,lo:Number(criterion[0]),tag,prompt,options,why,hook,challenge:true});process.stdout.write(JSON.stringify("+expr+"));"
reviewed=json.loads(subprocess.check_output(['node','-e',node],text=True))
assert len(reviewed)==80
notes=dict(line.split('|',1) for line in (SRC/'review-nl.txt').read_text().splitlines() if line.strip())
assert set(notes)=={q['id'] for q in reviewed}
# Explicit checks on two previously transposed editorial notes.
notes['x724']='2 en 3 zijn juist: gesprekken met klanten en gebruikers en gemeten serviceresultaten vullen elkaar aan. Provider-aannames zonder controle zijn onvoldoende. Losse componentbeschikbaarheid is geen volledige vervanging voor de echte service-ervaring.'
notes['x725']='Een SLA bevat duidelijke, gezamenlijk begrijpelijke targets die bij businessbehoeften passen. Niet alles wat intern meetbaar is, is een zinvolle servicebelofte. Bespreek eerst relevante outcomes; laat lokale teamtargets niet het beeld van de hele service vervangen.'
for q in reviewed:
    q.update(whyNl=notes[q['id']],pool='contrast',reviewed=True,kind='list' if 'TWO' in q['prompt'] else 'missing-word' if '[?]' in q['prompt'] else 'standard')
    if q['id']=='x109':q['options'][3]='Service relationship management'
    if q['id']=='x711':
        q['options'][1]='Retain ownership within the first team until it identifies the cause'
        q['options'][2]='Resolve the incident record when a specialist accepts the handover'
        q['options'][3]='Delay restoration while a separate team completes cause analysis'
    if q['id']=='x722':q['options'][3]='Optimize each local queue without coordinating the overall user experience'
new=[]
for p in sorted(SRC.glob('contrast-*.txt')):
    for line in p.read_text().splitlines():
        if not line.strip():continue
        v=line.split('|');assert len(v)==10,(p,len(v))
        criterion,tag,prompt,*tail=v;opts=tail[:4];why,nl,hook=tail[4:]
        new.append(dict(id='contrast-'+str(len(new)+1).zfill(3),criterion=criterion,lo=int(criterion[0]),tag=tag,prompt=prompt.replace('\\n','\n'),options=opts,why=why,whyNl=nl,hook=hook,challenge=True,pool='contrast',reviewed=True,kind='list' if 'TWO' in prompt else 'negative' if 'avoided' in prompt else 'standard'))
assert len(new)==77,len(new)
strict=reviewed+new
text=(OUT/'training-data.js').read_text();data=json.loads(text.removeprefix('window.SQ_TRAINING_DATA=').rstrip().removesuffix(';'))
for q in data['questions']:q['pool']='warmup';q['challenge']=False
extra=[
 ('goods','Goods','Resources whose ownership is transferred to the consumer.','Bij goederen gaat eigendom naar de consument. Toegang geeft gebruik zonder eigendomsoverdracht; service actions zijn uitgevoerd werk.','Goods = ownership transferred.'),
 ('access','Access to resources','Use of provider resources without ownership being transferred.','Toegang geeft gebruik van providermiddelen terwijl het eigendom daar blijft. Het is geen eigendomsoverdracht of alleen een verrichte handeling.','Access = use, not ownership.'),
 ('service-actions','Service actions','Activities performed by the provider to meet an agreed consumer need.','Service actions zijn afgesproken handelingen door de provider. Onderscheid uitgevoerd werk van een gekocht goed of toegang tot middelen.','Service actions = work performed.'),
 ('guiding-principles','Guiding principles','Recommendations that help guide an organization across changing circumstances.','Guiding principles geven brede richting in uiteenlopende situaties. Ze zijn geen ketenfasen of gedetailleerde universele procedures.','Guidance across circumstances.'),
 ('svs-improvement','Continual improvement','Recurring activity at all levels to keep performance aligned with stakeholder expectations.','Continual improvement als SVS-component is doorlopend verbeteren op alle niveaus. Dit is breder dan één Improve-activiteit in een specifieke waardestroom.','Improvement throughout the system.')]
data['matchingTerms']=[dict(id=i,term=t,definition=d,nl=n,hook=h) for i,t,d,n,h in extra]
concepts={c['id']:c for c in data['concepts']+data['matchingTerms']}
groups=[];group=None;variant=None
for line in (SRC/'matching.txt').read_text().splitlines():
    if not line.strip():continue
    if line.startswith('@'):
        i,los,title,context,note=line[1:].split('|');variant=dict(context=context,entries=[])
        group=dict(id=i,los=list(map(int,los.split(','))),title=title,note=note,variants=[variant]);groups.append(group)
    elif line.startswith('~'):
        variant=dict(context=line[1:],entries=[]);group['variants'].append(variant)
    else:
        i,text,nl=line.split('|');assert i in concepts,i
        variant['entries'].append(dict(id=i,text=text,whyNl=nl))
assert len(groups)==14,len(groups)
for g in groups:
    g['members']=[e['id'] for e in g['variants'][0]['entries']]
    assert 3<=len(g['members'])<=7 and len(set(g['members']))==len(g['members']),g['id']
    for v in g['variants']:
        assert set(e['id'] for e in v['entries'])==set(g['members']),g['id']
        assert len(set(e['text'] for e in v['entries']))==len(v['entries'])
for q in strict:
    assert len(q['options'])==len(set(q['options']))==4,q['id']
    assert len(q['whyNl'])>=100 and len(q['why'])>=60,q['id']
assert len({q['id'] for q in strict})==len({q['prompt'] for q in strict})==len(strict)
counts=Counter(q['criterion'] for q in strict)
blueprint={'1.1':2,'1.2':2,'1.3':1,'2.1':1,'2.2':5,'3.1':2,'4.1':1,'5.1':1,'5.2':1,'6.1':5,'6.2':2,'7.1':17}
assert all(counts[c]>=n for c,n in blueprint.items())
data.update(version='training-contrast-2026-09-07',qualityVersion='coherent-contrast-1',strictQuestions=strict,matchingGroups=groups)
data['questions'].extend(new)
(OUT/'training-data.js').write_text('window.SQ_TRAINING_DATA='+jd(data)+';\n')
# Reuse the touch controls and red/green feedback. Replace only selection and task content.
s=(OUT/'training.js').read_text()
s=replace_once(s,'round=P.round;home()','round=P.round;migrateQualityRound();home()')
s=s.replace("'TERM MATCH · 4 / 6'","'TERM MATCH · '+t.rows.length+' / '+t.options.length")
s=s.replace('Object.keys(t.answers).length<4','Object.keys(t.answers).length<t.rows.length')
s=s.replace("+' / 4 placed · Not checked yet.'","+' / '+t.rows.length+' placed · Not checked yet.'")
s=s.replace('Each matching task counts as four checks.','Each matching statement counts as one check.')
s=s.replace('<span class="sq-eyebrow">LO${q.lo} · ${esc(q.kind||\'practice\')}</span>', '<span class="sq-eyebrow">${t.checked?\'LO\'+q.lo+\' · \'+esc(q.tag):round.mode===\'warmup\'?\'WARM-UP · RECALL\':\'CONTRAST PRACTICE · CHOOSE ONE\'}</span>')
s=replace_once(s,"window.SQTraining={open,version:DATA.version,uiVersion:'matching-visibility-2'};",(SRC/'runtime.js').read_text()+"\nwindow.SQTraining={open,version:DATA.version,uiVersion:'coherent-contrast-1'};")
# Guided one-card rounds also need a version marker for later resume.
s=s.replace("round={version:1,tasks:","round={version:2,qualityVersion:'coherent-contrast-1',tasks:")
(OUT/'training.js').write_text(s)
css=(OUT/'training.css').read_text()+'\n.sq-case{border:1px solid #456786;border-radius:14px;background:#12273a;padding:14px;margin:14px 0}.sq-case b{color:#bcdcff}.sq-case p{margin:7px 0 0;line-height:1.55}.sq-statement-review{padding:10px;border-left:3px solid #829bb2;background:#101f30}.sq-grid select{max-width:100%}.sq-status{flex-wrap:wrap}\n'
(OUT/'training.css').write_text(css)
# Use only curated peers in the exam pool. Preserve old IDs for historic saves.
f=OUT/'_next/static/chunks/game-DXb1F_Z4.js';s=f.read_text()
old="if(window.SQ_TRAINING_DATA){const extra=window.SQ_TRAINING_DATA.questions;rh.push(...extra);th.push(...extra.filter(q=>q.challenge));extra.forEach(q=>n_.set(q.id,q));window.SQ_ALL_QUESTIONS=rh;window.dispatchEvent(new Event('sq-training-ready'));}"
hook="""if(window.SQ_TRAINING_DATA){const d=window.SQ_TRAINING_DATA;const bank=new Map([...rh,...d.questions,...d.strictQuestions].map(q=>[q.id,q]));rh.splice(0,rh.length,...bank.values());th.splice(0,th.length,...d.strictQuestions);n_.clear();rh.forEach(q=>n_.set(q.id,q));window.SQ_ALL_QUESTIONS=rh;window.SQ_STRICT_QUESTIONS=th;window.SQ_EXAM_SAMPLE=()=>i_();window.dispatchEvent(new Event('sq-training-ready'));}"""
s=replace_once(s,old,hook)
# Native missions and smart review also use the curated pool, not the warm-up generator.
a=s.index('function a_(');b=s.index('function o_(',a);part=s[a:b]
part=part.replace('rh.filter','(window.SQ_STRICT_QUESTIONS||rh).filter')
s=s[:a]+part+s[b:]
s=s.replace('e===`mission`?6:8','e===`mission`?20:10')
s=s.replace('W||z.mode===`learn`?U.tag:nh[U.lo-1].area','W||z.mode===`learn`?U.tag:`Choose one answer`')
s=s.replace('(0,h.jsx)(`p`,{children:U.why}),','(0,h.jsx)(`p`,{children:U.why}),U.whyNl?(0,h.jsx)(`p`,{lang:`nl`,children:U.whyNl}):null,')
s=s.replace('Match four statements to six terms, or practise multiple-choice questions.', 'Match related terms in one shared situation, or practise contrast questions.')
f.write_text(s)
# Give every changed asset a content hash, including the main compiled module.
for p in OUT.rglob('*'):
    if p.is_file() and p.suffix in ('.html','.js','.rsc') and p!=f:
        text=p.read_text();text=text.replace('game-DXb1F_Z4.js','game-DXb1F_Z4.js?v='+hashlib.sha256(f.read_bytes()).hexdigest()[:12]);p.write_text(text)
f=OUT/'index.html';s=f.read_text()
for asset in ('training.js','training.css','training-data.js'):
    digest=hashlib.sha256((OUT/asset).read_bytes()).hexdigest()[:12]
    s=re.sub(r'"'+re.escape(asset)+r'(?:\?v=[a-f0-9]+)?"','"'+asset+'?v='+digest+'"',s)
s=s.replace('446<!-- --> original questions','523<!-- --> original questions')
f.write_text(s)
report={'version':data['qualityVersion'],'newContrastQuestions':len(new),'reviewedExistingQuestions':len(reviewed),'strictQuestionCount':len(strict),'warmupCards':366,'totalQuestionCards':523,'matchingFamilies':len(groups),'matchingSituations':sum(len(g['variants']) for g in groups),'strictByCriterion':dict(counts),'examBlueprint':blueprint,'qualityChecks':['All 77 new questions and 80 existing exam-style questions reviewed for one defensible keyed answer and related distractors','Every strict question has comparative Dutch feedback','Basic automatic term drills excluded from exam and default missions','All matching statements and choices drawn from one explicitly defined family','No unrelated padding for families with only three or four valid terms','Question and answer order shuffled; topic labels hidden before answering','No claim of calibrated difficulty or guaranteed exam success'],'limitations':['The 366 basic cards are retained as warm-up material, not independently certified exam preparation.','Bank difficulty has not been measured against real exam cohorts.','Matching is an instructional format, not the official exam format.'],'references':[{'label':'PeopleCert ITIL 4 Foundation exam format','url':'https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-4-foundation-2565'},{'label':'AXELOS Foundation sample paper (2019): format reference, not copied into this bank','url':'https://www.globalknowledge.com/-/media/global-knowledge/documents/customer-documents/itil-foundation/2-enitil4fnd2019samplepaper1questionbkv13.pdf?sc_lang=en-gb'}]}
(OUT/'quality-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,indent=2,ensure_ascii=False))
