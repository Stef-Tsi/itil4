const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {JSDOM, VirtualConsole} = require('jsdom');
const target = process.argv[2] || '../play.html';
const html = fs.readFileSync(require('node:path').resolve(__dirname, target), 'utf8');
const bank = JSON.parse(html.match(/const EN_QUESTIONS=(\[.*?\]);/)[1]);
const criteria = {'1.1':2,'1.2':2,'1.3':1,'2.1':1,'2.2':5,'3.1':2,'4.1':1,'5.1':1,'5.2':1,'6.1':5,'6.2':2,'7.1':17};
const weights = {LO1:5,LO2:6,LO3:2,LO4:1,LO5:2,LO6:7,LO7:17};
const revision = 'strict-v6-20261111';
const store = 'itil4-pocket-ops-v1', sessionStore = 'itil4-pocket-ops-session-v1';
const errors = [];
const count = (items, field) => items.reduce((a,q) => (a[q[field]]=(a[q[field]]||0)+1,a),{});
const copy = x => JSON.parse(JSON.stringify(x));
assert.equal(bank.length,168);
assert.equal(new Set(bank.map(q=>q.id)).size,168);
assert.equal(new Set(bank.map(q=>q.prompt)).size,168);
for (const q of bank) {
  assert.equal(q.options.length,4); assert.equal(new Set(q.options).size,4);
  assert.equal(q.rationales.length,4); assert(q.rationales.every(r=>typeof r==='string'&&r.length>25));
  assert.equal(q.lang,'en'); assert.equal(q.reviewedOn,'2026-11-11');
  assert.equal(q.bloom,['1.1','6.1','6.2'].includes(q.criterion)?1:2);
  assert.equal(q.explanation,q.rationales[q.answer]);
  if(q.style==='list') {
    assert.equal(q.statements.length,4);
    assert(q.options.every(o=>/^[1-4] and [1-4]$/.test(o)));
    assert(!q.prompt.includes('NOT'));
  }
  assert(!/\b(uitleg|waarom|fout|klant|gebruiker|alleen|antwoord)\b/i.test(JSON.stringify(q)));
}
assert(bank.some(q=>q.criterion==='5.2'&&q.topic==='Deliver and support'));
assert(bank.some(q=>q.criterion==='1.2'&&q.topic==='Organization'));
assert(bank.some(q=>q.options[q.answer]==='Governance'));
assert(bank.some(q=>q.options[q.answer]==='Problem control'));
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('application/json'));
scripts.forEach(m=>new vm.Script(m[2]));
// Instrument only the local test copy; no test hooks are published in the app.
const instrumented = html.replace('renderAll();showScreen("examScreen");',
  'window.__audit={pickExam,weakQuestions,normalizeProgress,normalizeSession,parseBackup,backupData,restoreBackup,coverage,get bank(){return EN_QUESTIONS},set pendingImport(value){pendingImport=value},get progress(){return P},get session(){return session},getQuestion:sessionQuestion};renderAll();showScreen("examScreen");');
function boot(preload={}) {
  const vc = new VirtualConsole(); vc.on('jsdomError',e=>errors.push(e.message));
  return new JSDOM(instrumented,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://raw.githack.com/Stef-Tsi/itil4/main/play.html',virtualConsole:vc,
    beforeParse(w){w.scrollTo=()=>{};w.Element.prototype.scrollTo=()=>{};for(const [key,value] of Object.entries(preload))w.localStorage.setItem(key,value);}});
}
function click(w,selector){const el=w.document.querySelector(selector);assert(el,`Missing ${selector}`);el.click();}
function begin(w){click(w,'[data-mode="exam"]');click(w,'[data-modal-action="start-exam"]');}
function checkPaper(paper){
  assert.equal(paper.length,40);assert.equal(new Set(paper.map(q=>q.id)).size,40);
  assert.deepEqual(count(paper,'criterion'),criteria);
  assert.deepEqual(count(paper,'lo'),weights);
  assert.equal(paper.filter(q=>q.bloom===1).length,9);
  assert.equal(paper.filter(q=>q.bloom===2).length,31);
}

const first=boot(), w=first.window;
assert(w.document.querySelector('#examScreen').classList.contains('active'));
const seen=new Set();
for(let i=0;i<3;i++){
  const paper=copy(w.__audit.pickExam());checkPaper(paper);
  assert(paper.every(q=>!seen.has(q.id)),'First three papers must not reuse questions');
  paper.forEach(q=>{seen.add(q.id);w.__audit.progress.examUsed.push(q.id);});
}
w.__audit.progress.examUsed=[];
for(let i=0;i<100;i++)checkPaper(copy(w.__audit.pickExam()));
// Every rendered explanation must refer to the selected option, even after shuffling.
begin(w);let s=w.__audit.session;
assert.equal(s.duration,3600000);assert.equal(s.revision,revision);checkPaper(s.questionIds.map(id=>bank.find(q=>q.id===id)));
let changedPositions=0;
for(const id of s.questionIds){
  const original=bank.find(q=>q.id===id),version=s.questionVersions[id];
  assert.equal(version.options[version.answer],original.options[original.answer]);
  for(let i=0;i<4;i++)assert.equal(version.rationales[i],original.rationales[original.options.indexOf(version.options[i])]);
  if(version.answer!==0)changedPositions++;
}
assert(changedPositions>0,'Answer positions must be shuffled');
const incorrect=[];
for(let i=0;i<40;i++){
  const q=w.__audit.getQuestion(s.questionIds[i]),choice=i<32?q.answer:(q.answer+1)%4;
  click(w,`[data-answer="${choice}"]`);
  assert(w.document.querySelector('#feedback').classList.contains('hidden'));
  assert.equal(w.document.querySelector('#feedback').textContent,'');
  assert(w.document.querySelector('#hintBtn').classList.contains('hidden'));
  if(i>=32)incorrect.push({id:q.id,choice,reason:q.rationales[choice]});
  click(w,'#nextBtn');
}
click(w,'#submitExam');
assert.equal(w.document.querySelector('#resultScore').textContent,'32/40');
assert.equal(w.document.querySelectorAll('#reviewList .review-item').length,40);
assert.equal(w.document.querySelectorAll('#reviewList .option-comparison li').length,160);
const record=JSON.parse(w.localStorage.getItem(store)).exams[0];
assert.equal(record.answers.length,40);assert.equal(record.score,32);assert.equal(record.freshCount,40);
for(const wrong of incorrect){
  const item=record.answers.find(a=>a.id===wrong.id);assert.equal(item.rationales[item.chosen],wrong.reason);
  assert(w.document.querySelector('#reviewList').textContent.includes(wrong.reason));
}
assert.equal(w.__audit.progress.total,0,'Exam answers must not enter drill accuracy');
assert.equal(w.__audit.progress.xp,128);
const xp=w.__audit.progress.xp;
click(w,'#closeResult');click(w,'[data-review="0"]');assert.equal(w.__audit.progress.xp,xp);
click(w,'#closeResult');begin(w);s=w.__audit.session;
assert.equal(s.freshCount,40);assert(s.questionIds.every(id=>!record.answers.some(a=>a.id===id)));
click(w,'#submitExam');assert.equal(w.document.querySelector('#modalTitle').textContent,'Submit with unanswered questions?');
click(w,'[data-modal-action="close"]');
click(w,'#nextBtn');click(w,'#examPrevious');assert.equal(w.__audit.session.index,0);
click(w,'#flagBtn');assert(w.__audit.session.flags.includes(0));
const saved=w.localStorage.getItem(sessionStore),progress=w.localStorage.getItem(store);
const resumed=boot({[sessionStore]:saved,[store]:progress}), rw=resumed.window;
click(rw,'#resumeBtn');assert.deepEqual(copy(rw.__audit.session.questionVersions),JSON.parse(saved).questionVersions);
assert.equal(rw.__audit.session.duration,3600000);
click(rw,'#battleClose');click(rw,'[data-modal-action="leave"]');
click(rw,'#quickBtn');assert.equal(rw.document.querySelector('#modalTitle').textContent,'A saved session is still open');
click(rw,'[data-modal-action="resume-saved"]');assert.equal(rw.__audit.session.mode,'exam');

const expiredState=JSON.parse(saved);expiredState.startedAt=Date.now()-expiredState.duration-5000;
const expired=boot({[sessionStore]:JSON.stringify(expiredState),[store]:progress}), ew=expired.window;
click(ew,'#resumeBtn');assert.equal(ew.document.querySelector('#resultScore').textContent,'0/40');
assert.equal(JSON.parse(ew.localStorage.getItem(store)).exams.length,2);
assert.equal(ew.localStorage.getItem(sessionStore),null);

const practice=boot(),pw=practice.window;
click(pw,'#quickBtn');const pq=pw.__audit.getQuestion(pw.__audit.session.questionIds[0]),wrongChoice=(pq.answer+1)%4;
click(pw,`[data-answer="${wrongChoice}"]`);
assert(pw.document.querySelector('#feedback').textContent.includes('Why your answer is wrong:'));
assert(pw.document.querySelector('#feedback').textContent.includes(pq.rationales[wrongChoice]));
const queue=copy(pw.__audit.weakQuestions(10,bank));assert(queue.some(q=>q.id===pq.id));
assert.equal(pw.__audit.progress.total,1);assert.equal(pw.__audit.progress.correct,0);

const extra=boot(),tw=extra.window;tw.document.querySelector('#examDuration').value='75';
tw.document.querySelector('#examDuration').dispatchEvent(new tw.Event('change'));begin(tw);assert.equal(tw.__audit.session.duration,4500000);
const oldSession={...JSON.parse(saved),revision:'strict-v3-20261004'};delete oldSession.questionSnapshots;
const migration=boot({[sessionStore]:JSON.stringify(oldSession),[store]:JSON.stringify({xp:500,exams:[{...record,revision:'strict-v3-20261004'}]})}),mw=migration.window;
assert.equal(mw.localStorage.getItem(sessionStore),null);assert(mw.localStorage.getItem(sessionStore+'-archived'));
assert.equal(mw.__audit.progress.xp,500);assert.equal(mw.document.querySelectorAll('[data-review]').length,1);assert(mw.document.querySelector('#examHistory').textContent.includes('earlier revision'));assert(!mw.document.querySelector('#examReadiness').textContent.includes('average')); 
begin(mw);assert.equal(mw.__audit.session.revision,revision);

// A v4 run retains the original prompt and shuffled answers when resumed after update.
const oldBank=bank.map(q=>({...q,id:q.id.replace('strict-v5-','strict-v4-')}));
const oldMap=Object.fromEntries(oldBank.map(q=>[q.id,q]));
const v4={...JSON.parse(saved),revision:'strict-v4-20261005',startedAt:Date.now()};
v4.questionIds=v4.questionIds.map(id=>id.replace('strict-v5-','strict-v4-'));
if(!v4.questionIds.includes('strict-v4-021'))v4.questionIds[v4.questionIds.findIndex(id=>oldMap[id].criterion==='2.1')]='strict-v4-021';
v4.questionVersions=Object.fromEntries(v4.questionIds.map(id=>{const q=oldMap[id],order=[2,0,3,1];return [id,{options:order.map(i=>q.options[i]),rationales:order.map(i=>q.rationales[i]),answer:1}]}));
delete v4.questionSnapshots;
const oldProgress={...copy(w.__audit.progress),exposed:['strict-v4-021'],examUsed:['strict-v4-021'],byQuestion:{'strict-v4-021':{correct:0,total:1,lastCorrect:false,lastAt:1}}};
const legacy=boot({[sessionStore]:JSON.stringify(v4),[store]:JSON.stringify(oldProgress)}),lw=legacy.window;
assert(lw.__audit.progress.exposed.includes('strict-v5-021'));
assert(lw.__audit.progress.examUsed.includes('strict-v5-021'));
assert.equal(lw.__audit.progress.byQuestion['strict-v5-021'].lastCorrect,false);
click(lw,'#resumeBtn');
assert(lw.__audit.getQuestion('strict-v4-021').prompt.includes('A team combines'));
assert.equal(lw.__audit.session.revision,'strict-v4-20261005');
assert(lw.document.querySelector('#battleTitle').textContent.includes('Earlier revision'));
click(lw,`[data-jump="${v4.questionIds.indexOf('strict-v4-021')}"]`);
assert(lw.document.querySelector('#questionText').textContent.includes('A team combines'));
click(lw,'[data-answer="1"]');click(lw,'#submitExam');click(lw,'[data-modal-action="submit-open"]');
assert.equal(lw.document.querySelector('#resultScore').textContent,'1/40');
assert.equal(lw.__audit.progress.exams[0].revision,'strict-v4-20261005');
assert(lw.document.querySelector('#resultSubtitle').textContent.includes('Earlier content revision'));

// Revision 5 snapshots must keep their original wording after the new content revision.
const v5Session=JSON.parse(saved);v5Session.revision='strict-v5-20261012';
const oldQuestionId=v5Session.questionIds[0];
v5Session.questionSnapshots[oldQuestionId].prompt='Saved revision 5 wording must survive';
const previous=boot({[sessionStore]:JSON.stringify(v5Session),[store]:progress}),prev=previous.window;
click(prev,'#resumeBtn');
assert.equal(prev.__audit.getQuestion(oldQuestionId).prompt,'Saved revision 5 wording must survive');
assert(prev.document.querySelector('#battleTitle').textContent.includes('Earlier revision'));
previous.window.close();

// Content edits do not reset familiarity; full snapshots and progress round-trip in backups.
const backup=copy(rw.__audit.backupData());
const parsed=rw.__audit.parseBackup(JSON.stringify(backup));
assert.deepEqual(copy(parsed.progress),copy(rw.__audit.progress));
assert.deepEqual(copy(parsed.session.questionSnapshots),copy(rw.__audit.session.questionSnapshots));
assert.throws(()=>rw.__audit.parseBackup('{"foo":"bar"}'));
assert.throws(()=>rw.__audit.parseBackup('not json'));
const oldStyle=rw.__audit.parseBackup(JSON.stringify(rw.__audit.progress));assert.equal(oldStyle.session,null);
const importing=boot(),iw=importing.window;iw.__audit.pendingImport=JSON.parse(JSON.stringify(parsed));iw.__audit.restoreBackup();
assert.deepEqual(copy(iw.__audit.progress),copy(parsed.progress));
click(iw,'#resumeBtn');assert.deepEqual(copy(iw.__audit.session.questionSnapshots),copy(parsed.session.questionSnapshots));

// Boundary scoring and changing an exam answer use the last selected option.
const boundaries=[];
for(const desiredScore of [25,26]){
 const dom=boot(),bw=dom.window;boundaries.push(dom);begin(bw);const bs=bw.__audit.session;
 for(let i=0;i<40;i++){const q=bw.__audit.getQuestion(bs.questionIds[i]);click(bw,`[data-answer="${(q.answer+1)%4}"]`);if(i<desiredScore)click(bw,`[data-answer="${q.answer}"]`);click(bw,'#nextBtn')}
 assert.equal(bw.document.querySelector('#summaryTimer').textContent.length,5);
 click(bw,'#submitExam');assert.equal(bw.document.querySelector('#resultScore').textContent,`${desiredScore}/40`);
 assert.equal(bw.document.querySelector('#resultTitle').textContent,desiredScore===26?'Practice exam passed':'Below the pass mark');
 const earned=bw.__audit.progress.xp;click(bw,'#submitExam');assert.equal(bw.__audit.progress.xp,earned);
}

// All questions remain reviewable after any shuffle; every option has its own explanation.
for(const q of bank){assert(q.rationales.every(r=>r.length>25));assert.equal(q.explanation,q.rationales[q.answer]);}
const facts=JSON.parse(html.match(/const EN_FACTS=(\[.*?\]);/)[1]);assert.equal(facts.length,111);
assert.equal(new Set(facts.map(f=>f.id)).size,111);
assert(!facts.find(f=>f.id==='en7-ci-purpose').memory.includes('baseline'));
assert(!facts.find(f=>f.id==='en7-change-purpose').memory.includes('These characteristics'));
assert(facts.some(f=>f.id==='en7-error-control'));assert(facts.some(f=>f.id==='en7-problem-control'));
const item21=bank.find(q=>q.id==='strict-v5-021');assert(!item21.prompt.includes('A team combines'));

// Flashcard search handles no results; keyboard can flip cards and answer questions.
const learning=boot(),cw=learning.window;click(cw,'[data-screen="learnScreen"]');click(cw,'[data-learn="cards"]');
const search=cw.document.querySelector('#cardSearch');search.value='no-such-concept-xyz';search.dispatchEvent(new cw.Event('input'));
assert.equal(cw.document.querySelector('#flashCount').textContent,'0/0');assert(cw.document.querySelector('#cardKnown').disabled);
search.value='workaround';search.dispatchEvent(new cw.Event('input'));assert(!cw.document.querySelector('#cardKnown').disabled);
const card=cw.document.querySelector('#flashCard');card.focus();card.dispatchEvent(new cw.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert(card.querySelector('.flash-back'));
click(cw,'[data-screen="homeScreen"]');click(cw,'[data-mode="english"]');assert.equal(cw.__audit.session.questionIds.length,10);assert(cw.__audit.session.questionIds.every(id=>bank.find(q=>q.id===id).bloom===1));
const cq=cw.__audit.getQuestion(cw.__audit.session.questionIds[0]);cw.document.dispatchEvent(new cw.KeyboardEvent('keydown',{key:'abcd'[cq.answer],bubbles:true}));assert.equal(cw.__audit.session.score,1);
assert(cw.document.querySelector('#coverageNote').textContent.includes('Coverage measures exposure'));

// Historical mistake retry must not overwrite an unrelated saved exam.
click(rw,'#battleClose');click(rw,'[data-modal-action="leave"]');
click(rw,'[data-screen="examScreen"]');click(rw,'[data-review="0"]');click(rw,'#retryErrors');
assert.equal(rw.document.querySelector('#modalTitle').textContent,'A saved session is still open');
assert.equal(JSON.parse(rw.localStorage.getItem(sessionStore)).mode,'exam');
rw.document.dispatchEvent(new rw.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));

// Quota failures retain the latest in-memory session instead of stale browser data.
const quota=boot(),qw=quota.window;click(qw,'#quickBtn');
qw.Storage.prototype.setItem=function(){throw new qw.DOMException('Storage full','QuotaExceededError')};
const qq=qw.__audit.getQuestion(qw.__audit.session.questionIds[0]);click(qw,`[data-answer="${qq.answer}"]`);
assert(!qw.document.querySelector('#storageWarning').classList.contains('hidden'));
assert.equal(qw.__audit.backupData().progress.total,1);
click(qw,'#battleClose');click(qw,'[data-modal-action="leave"]');click(qw,'#resumeBtn');
assert.equal(qw.__audit.session.answers[0],qq.answer);assert.equal(qw.__audit.session.score,1);
assert(qw.__audit.session.feedback);

for(const d of [first,resumed,expired,practice,extra,migration,legacy,importing,learning,quota,...boundaries])d.window.close();
assert.deepEqual(errors,[]);
console.log('PASS: 168 complete English items; 100 exact 40-question blueprints; 9/31 Bloom quotas; three disjoint fresh papers; shuffled options and matched rationales; delayed exam feedback; 32/40 grading; full review; no double rewards; practice mistake queue; blank-answer warning; navigation and flags; saved-session protection and resume; expired-session submission; 60/75 minutes; legacy resume preserves full question versions; migration preserves familiarity and history; backup import/export; 25/40 and 26/40 boundaries; 111 cards; empty searches; keyboard controls; historical retry protects saved exams.');
