// Contrast update: one coherent family per matching task. No unrelated fillers.
const QUALITY_VERSION='coherent-contrast-1';
for(const term of DATA.matchingTerms||[]) C.set(term.id,term);
function refreshBank(){
 Q=new Map([...(window.SQ_ALL_QUESTIONS||[]),...DATA.questions,...DATA.strictQuestions].map(q=>[q.id,q]));
}
function migrateQualityRound(){
 if(round && round.qualityVersion!==QUALITY_VERSION){
  P.previousRound=round;round=null;P.round=null;
  saveWarning='The question selection has been upgraded. Start a new mission; your earlier XP and answers are kept. The previous round is included in an export.';
  save();
 }
}
function home(){
 header();
 const rec=Object.values(P.records),attempts=rec.reduce((s,r)=>s+r.attempts,0),correct=rec.reduce((s,r)=>s+r.correct,0);
 const families=DATA.matchingGroups.map(g=>`<option value="${esc(g.id)}">${esc(g.title)}</option>`).join('');
 show(`<div class="sq-hero"><span class="sq-eyebrow">CONTRAST UPDATE · ENGLISH / NL HELP</span>
 <h1 data-heading tabindex="-1">Learn the difference.<br>Not the giveaway.</h1>
 <p>Related terms, one shared situation. Different topics between tasks — never random unrelated choices inside a matching task.</p></div>
 <div class="sq-panel"><div class="sq-status"><span class="sq-badge">${DATA.strictQuestions.length} contrast questions</span><span>${DATA.matchingGroups.length} matching families</span></div>
 <div class="sq-grid">
 <label>Mission length<select id="sq-count"><option value="10">10 tasks</option><option value="20" selected>20 tasks</option><option value="30">30 tasks</option></select></label>
 <label>Task types<select id="sq-mode"><option value="mixed">Mixed: contrast + matching</option><option value="matching">Matching: related terms</option><option value="mcq">Contrast questions only</option><option value="review">Smart review: contrast questions</option><option value="warmup">Warm-up: basic recall only</option></select></label>
 <label>Topic<select id="sq-topic"><option value="all">All topics between tasks</option><option value="1">LO1 · Core terms</option><option value="2">LO2 · Guiding principles</option><option value="3">LO3 · Four dimensions</option><option value="4">LO4 · Service value system</option><option value="5">LO5 · Service value chain</option><option value="6">LO6 · Practices and terms</option><option value="7">LO7 · Practices in detail</option></select></label>
 <label>Matching family<select id="sq-family"><option value="auto">Rotate related families</option>${families}</select></label></div>
 <div class="sq-actions">${button('Start mission','start',true)}${button('Learn first','learn')}</div>
 ${round&&!round.finished?`<div class="sq-actions">${button(`Resume task ${round.index+1}/${round.tasks.length}`,'resume',true)}</div>`:''}
 <p class="sq-note">Usually four statements and six related choices. Roles and change types use three valid choices; dimensions use four. No off-topic filler answers. Longer single-topic missions can be shorter if that pool runs out — no duplicate question cards within a mission.</p>
 <p class="sq-note"><b>Exam arena</b> uses the reviewed multiple-choice pool, not the warm-up generator. Matching is only a learning exercise. These original questions are not calibrated against your real exam and do not guarantee a pass.</p></div>
 <div class="sq-panel"><b>Training progress</b><p>${correct}/${attempts} checks correct · ${P.rounds} completed missions · ${P.xp} training XP</p>
 <p class="sq-note">Historic totals include earlier practice and are not an exam-readiness score. ${Q.size} cards remain available in total; basic recall is kept separate from contrast practice.</p>
 <div class="sq-actions">${button('Export progress','export')}${button('Back to city','close')}</div></div>`);
 root.querySelector('#sq-topic').addEventListener('change',()=>{
  const lo=root.querySelector('#sq-topic').value;
  for(const opt of root.querySelectorAll('#sq-family option')){
   const g=DATA.matchingGroups.find(g=>g.id===opt.value);
   opt.disabled=!!g&&lo!=='all'&&!g.los.includes(Number(lo));
  }
  root.querySelector('#sq-family').value='auto';
 });
}
function makeMatchingTask(group,variantIndex=0){
 const variant=group.variants[variantIndex%group.variants.length];
 const entries=mix(variant.entries),rows=entries.slice(0,Math.min(4,entries.length)).map(e=>e.id);
 const options=mix([...rows,...mix(group.members.filter(id=>!rows.includes(id))).slice(0,Math.max(0,6-rows.length))]);
 const statements=Object.fromEntries(variant.entries.filter(e=>rows.includes(e.id)).map(e=>[e.id,{text:e.text,whyNl:e.whyNl}]));
 return{type:'match',groupId:group.id,context:variant.context,groupNote:group.note,title:group.title,rows,options,statements,answers:{},checked:false};
}
function start(){
 if(round&&!round.finished&&!confirm('Replace the unfinished mission? Checked answers and XP stay saved.'))return;
 const count=Number(root.querySelector('#sq-count').value),mode=root.querySelector('#sq-mode').value,lo=root.querySelector('#sq-topic').value,family=root.querySelector('#sq-family').value;
 const strictIds=new Set(DATA.strictQuestions.map(q=>q.id));
 const pool=(mode==='warmup'?[...Q.values()].filter(q=>!strictIds.has(q.id)):DATA.strictQuestions).filter(q=>lo==='all'||String(q.lo)===lo);
 const ranked=rank(pool,mode==='review'),unique=[],seen=new Set();
 for(const q of ranked)if(!seen.has(q.id)){seen.add(q.id);unique.push(q)}
 const available=DATA.matchingGroups.filter(g=>(lo==='all'||g.los.includes(Number(lo)))&&(family==='auto'||g.id===family));
 if((mode==='matching'||mode==='mixed')&&!available.length){saveWarning='Choose a matching family belonging to the selected topic.';home();return}
 let familyBag=[],mc=0;const tasks=[];
 const types=mode==='matching'?Array(count).fill('match'):mode==='mixed'?mix(Array.from({length:count},(_,i)=>i%3===0?'match':'mcq')):Array(count).fill('mcq');
 P.familySeen=P.familySeen||{};
 for(const type of types){
  if(type==='match'){
   if(!familyBag.length)familyBag=mix(available);
   const g=familyBag.pop(),v=P.familySeen[g.id]||0;
   tasks.push(makeMatchingTask(g,v));P.familySeen[g.id]=v+1;
  }else{
   const q=unique[mc++];if(q)tasks.push({type:'mcq',id:q.id,order:mix([0,1,2,3]),choice:null,checked:false});
  }
 }
 if(!tasks.length){saveWarning='There are no questions for this selection. Choose another topic.';home();return}
 round={version:2,qualityVersion:QUALITY_VERSION,tasks,index:0,correct:0,total:0,xp:0,mode,lo,finished:false};
 save();renderTask();
}
function matchContent(t){
 const count=Object.keys(t.answers).length,remaining=t.options.length-t.rows.length;
 const bank=t.checked?'':`<div class="sq-bank" aria-label="Related terms" lang="en">${t.options.map(id=>{
  const row=t.rows.findIndex(row=>t.answers[row]===id);
  return `<button class="sq-token ${row>=0?'sq-used':''}" data-token="${esc(id)}" aria-pressed="false"><span>${esc(C.get(id).term)}</span><small class="sq-token-status">${row>=0?'Placed in '+(row+1)+' · move':'Drag or tap'}</small></button>`;
 }).join('')}</div>`;
 return `<h2 class="sq-title" data-heading tabindex="-1">Match each statement to its term.</h2>
 <div class="sq-case" lang="en"><b>${esc(t.title)}</b><p>${esc(t.context)}</p></div>
 <p class="sq-note">Drag a term onto a statement, or tap a term and then a statement. Use each term once. ${remaining?remaining+' choices are left over.':'All choices belong to this family; there are no filler terms.'}</p>
 ${bank}<p id="sq-selection" class="sq-toast" aria-live="polite">${t.checked?'Answers checked. Review each connection below.':count+' / '+t.rows.length+' placed · Blue means placed, not checked.'}</p>
 <div class="sq-slots" lang="en">${t.rows.map((id,i)=>{
  const answer=t.answers[id],filled=!!answer,right=answer===id,state=t.checked?(right?'sq-good':'sq-bad'):filled?'sq-filled':'';
  const status=t.checked?(right?'✓ Correct':'✕ Incorrect'):filled?'Placed · not checked':'Empty';
  return `<button class="sq-slot ${state}" data-slot="${esc(id)}" ${t.checked?'disabled':''}>
  <span class="sq-slot-heading"><span class="sq-slot-number">${i+1}</span><span class="sq-slot-status">${status}</span></span>
  <span class="sq-statement">${esc(t.statements[id].text)}</span>
  <span class="sq-answer-chip ${filled?'':'sq-empty-chip'}"><small>${filled?(t.checked?'YOUR ANSWER':'PLACED TERM'):'CHOOSE A TERM'}</small><b>${filled?esc(C.get(answer).term):'↓ Drop or tap here'}</b></span>
  ${t.checked&&!right?`<span class="sq-answer-correct sq-correction">✓ Correct term: ${esc(C.get(id).term)}</span>`:''}
  ${filled&&!t.checked?'<span class="sq-change-note">Choose another term to change this answer.</span>':''}</button>`;
 }).join('')}</div>`;
}
function matchFeedback(t){
 const right=t.rows.filter(id=>t.answers[id]===id).length;
 return `<section class="sq-feedback sq-match-feedback" aria-live="polite"><h3>${right} of ${t.rows.length} connections correct</h3>
 <p lang="nl">${esc(t.groupNote)}</p>${t.rows.map((id,i)=>{
  const c=C.get(id),chosen=C.get(t.answers[id]),ok=id===t.answers[id];
  return `<div class="sq-term sq-feedback-item ${ok?'sq-feedback-item-correct':'sq-feedback-item-wrong'}">
   <strong class="sq-feedback-status ${ok?'sq-answer-correct':'sq-answer-wrong'}">${ok?'✓':'✕'} Statement ${i+1} · ${ok?'Correct':'Incorrect'}</strong>
   <p lang="en" class="sq-statement-review">${esc(t.statements[id].text)}</p>
   ${!ok?`<p class="sq-answer-wrong" lang="nl"><b>✕ Jouw keuze: ${esc(chosen?.term)}</b></p>`:''}
   <p class="sq-answer-correct" lang="en"><b>✓ Correct answer: ${esc(c.term)}</b></p>
   <p lang="nl"><b>Het beslissende verschil:</b> ${esc(t.statements[id].whyNl)}</p>
   <p lang="en">${esc(c.definition)}</p>
   ${!ok?`<p lang="nl"><b>Vergelijk met jouw keuze:</b> ${esc(chosen?.nl)}</p>`:''}
   <p><b>Remember:</b> ${esc(c.hook)}</p></div>`;
 }).join('')}<small>Same-family learning exercise, not an official exam format.</small></section>`;
}
// Keep colour improvements, save key and existing progress. Expose read-only generators for regression checks.
window.SQQuality={version:QUALITY_VERSION,makeMatchingTask,strictIds:()=>DATA.strictQuestions.map(q=>q.id)};
