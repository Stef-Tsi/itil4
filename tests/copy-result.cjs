const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(require('node:path').resolve(__dirname,'../play.html'),'utf8');
for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!m[1].includes('application/json'))new vm.Script(m[2]);
const bank=JSON.parse(html.match(/const EN_QUESTIONS=(\[.*?\]);/)[1]);
const quota={'1.1':2,'1.2':2,'1.3':1,'2.1':1,'2.2':5,'3.1':2,'4.1':1,'5.1':1,'5.2':1,'6.1':5,'6.2':2,'7.1':17};
const paper=Object.entries(quota).flatMap(([criterion,n])=>bank.filter(q=>q.criterion===criterion).slice(0,n));
paper[paper.findIndex(q=>q.criterion==='1.2')]=bank.find(q=>q.style==='list'&&q.criterion==='1.2');
const record={revision:'strict-v5-20261012',date:'2026-10-13T08:19:00.000Z',exam:true,score:28,total:40,seconds:1260,duration:3600000,freshCount:40,answers:paper.map((q,i)=>{
 const order=[2,0,3,1],answer=order.indexOf(q.answer),chosen=i<28?answer:i===39?null:(answer+1)%4;
 return {...q,options:order.map(n=>q.options[n]),rationales:order.map(n=>q.rationales[n]),answer,chosen,good:chosen===answer};
})};
const current={...record,date:'2026-10-13T09:00:00.000Z',score:30};
const errors=[];
function boot(mode='success'){
 let copied=null;
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html.replace('renderAll();showScreen("examScreen");','window.__copyAudit={presentResult,resultReportText};renderAll();showScreen("examScreen");'),{runScripts:'dangerously',url:'https://raw.githack.com/Stef-Tsi/itil4/main/play.html',virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.Element.prototype.scrollTo=()=>{};
  w.localStorage.setItem('itil4-pocket-ops-v1',JSON.stringify({name:'PRIVATE-NAME',exams:[current,record],lastRun:current}));
  if(mode!=='missing')Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{if(mode==='denied')throw new Error('Not allowed');copied=text}}});
 }});
 return {dom,w:dom.window,get copied(){return copied}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const success=boot(),w=success.w;
 w.document.querySelector('[data-review="1"]').click();
 const field=w.document.querySelector('#resultReportText');
 assert(field.readOnly);assert(!w.document.querySelector('#resultReportPanel').open);
 w.document.querySelector('#copyResultReport').click();await tick();
 const report=success.copied;assert(report);
 assert(report.includes('Score: 28/40 (70%)'));assert(!report.includes('Score: 30/40'));
 assert(report.includes('Time used: 21:00'));assert(report.includes('Time limit: 60 minutes'));
 assert(report.includes('Question bank revision: strict-v5-20261012'));
 assert(!report.includes('PRIVATE-NAME'));assert.equal(field.value,report);
 assert.equal((report.match(/Question ID:/g)||[]).length,40);
 for(const a of record.answers){
  assert(report.includes(a.prompt));for(const o of a.options)assert(report.includes(o));for(const r of a.rationales)assert(report.includes(r));
  if(a.statements)for(const statement of a.statements)assert(report.includes(statement));
  assert(report.includes(`Correct answer: ${'ABCD'[a.answer]}. ${a.options[a.answer]}`));
  if(a.chosen!==null)assert(report.includes(`Your answer: ${'ABCD'[a.chosen]}. ${a.options[a.chosen]}`));
 }
 assert(report.includes('40. UNANSWERED'));assert(report.includes('Your answer: No answer selected'));
 for(const lo of Object.keys(quota).map(x=>'LO'+x[0]))assert(report.includes(lo+' —'));
 assert(w.document.querySelector('.toast').textContent.includes('Full result copied'));
 for(const mode of ['denied','missing']){
  const fallback=boot(mode),fw=fallback.w;fw.__copyAudit.presentResult(record);fw.document.querySelector('#copyResultReport').click();await tick();
  const text=fw.document.querySelector('#resultReportText');assert(fw.document.querySelector('#resultReportPanel').open);assert.equal(fw.document.activeElement,text);
  assert.equal(text.selectionStart,0);assert.equal(text.selectionEnd,text.value.length);assert(text.value.includes('Score: 28/40'));
  fallback.dom.window.close();
 }
 const drill={...record,exam:false,total:5,score:5,answers:record.answers.slice(0,5)};
 w.__copyAudit.presentResult(drill);const drillReport=w.document.querySelector('#resultReportText').value;
 assert(drillReport.includes('Mode: Practice drill'));assert(!drillReport.includes('pass mark'));assert.equal((drillReport.match(/Question ID:/g)||[]).length,5);
 success.dom.window.close();assert.deepEqual(errors,[]);
 console.log('PASS: 40-question report, 28/40 score and LO breakdown, complete shuffled options and rationales, list statements, unanswered question, historical result rather than latest run, clipboard success, denied/unavailable clipboard fallback, selectable read-only text, drill report, no name export, JavaScript syntax.');
 console.log('Typical full report length: '+report.length+' characters.');
})().catch(e=>{console.error(e);process.exitCode=1});
