/* English questions, NL support, pointer/tap matching. No remote dependencies or decoding. */
(()=>{'use strict';
const DATA=window.SQ_TRAINING_DATA,KEY='service-quest-training-v1';if(!DATA)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mix=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const C=new Map(DATA.concepts.map(x=>[x.id,x]));
const blank=()=>({version:1,xp:0,records:{},round:null,rounds:0,learned:[]});
let P=blank(),saveWarning='',root=null,round=null,selected=null,drag=null,ignoreClickUntil=0,previousFocus=null,learnIndex=0;
try{const raw=localStorage.getItem(KEY);if(raw){let p=JSON.parse(raw);if(p.version===1&&p.records&&typeof p.records==='object'&&Number.isFinite(p.xp)){P={...blank(),...p};if(!Array.isArray(P.learned))P.learned=[]}}}catch{saveWarning='Saved training progress could not be read. The original save has not been deleted.'}
let Q=new Map();
function refreshBank(){Q=new Map((window.SQ_ALL_QUESTIONS||DATA.questions).map(q=>[q.id,q]))}
function save(){P.round=round;try{localStorage.setItem(KEY,JSON.stringify(P))}catch{saveWarning='This browser cannot save progress. Keep this tab open; export your training progress before leaving.'}}
function note(){return saveWarning?`<p class="sq-storage-warning" role="status">${esc(saveWarning)}</p>`:''}
function button(text,action,primary=false,extra=''){return `<button class="sq-btn ${primary?'sq-primary':''}" data-act="${action}" ${extra}>${text}</button>`}
function show(html){root.querySelector('.sq-wrap').innerHTML=note()+html;root.style.setProperty('--sq-top-height',root.querySelector('.sq-top').offsetHeight+'px');root.scrollTop=0;root.querySelector('[data-heading]')?.focus({preventScroll:true})}
function header(){root.querySelector('.sq-top b').textContent='SERVICE QUEST · TRAINING';root.querySelector('.sq-top small').textContent=`${P.xp} training XP · English questions / NL help`}
function open(){refreshBank();if(!root){root=document.createElement('section');root.id='sq-training';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Service Quest training missions');root.hidden=true;root.innerHTML='<header class="sq-top"><div><b></b><small></small></div>'+button('Close','close')+'</header><main class="sq-wrap"></main>';document.body.appendChild(root);root.addEventListener('click',handleClick);root.addEventListener('pointerdown',pointerDown);root.addEventListener('pointermove',pointerMove);root.addEventListener('pointerup',pointerUp);root.addEventListener('pointercancel',clearDrag);root.addEventListener('keydown',keyDown)}previousFocus=document.activeElement;root.hidden=false;document.body.style.overflow='hidden';header();round=P.round;migrateQualityRound();home()}
function close(){save();clearDrag();root.hidden=true;document.body.style.overflow='';previousFocus?.focus?.()}
function home(){header();const rec=Object.values(P.records),attempts=rec.reduce((s,r)=>s+r.attempts,0),correct=rec.reduce((s,r)=>s+r.correct,0);show(`<div class="sq-hero"><span class="sq-eyebrow">TRAINING EDITION · MORE PRACTICE, NOT EXAM DUMPS</span><h1 data-heading tabindex="-1">Learn the terms.<br>Connect the ideas.</h1><p>Four statements. Six possible terms. Plus English multiple-choice questions, short situations and detailed feedback.</p></div><div class="sq-panel"><div class="sq-status"><span class="sq-badge">${Q.size} question cards</span><span>${C.size} terms</span></div><div class="sq-grid"><label>Mission length<select id="sq-count"><option value="10">10 tasks</option><option value="20" selected>20 tasks</option><option value="30">30 tasks</option></select></label><label>Task types<select id="sq-mode"><option value="mixed">Mixed: questions + matching</option><option value="matching">Matching: 4 statements / 6 terms</option><option value="mcq">Multiple-choice only</option><option value="review">Smart review: weak and unseen</option></select></label><label>Topic<select id="sq-topic"><option value="all">All topics shuffled</option><option value="1">LO1 · Core terms</option><option value="2">LO2 · Guiding principles</option><option value="3">LO3 · Four dimensions</option><option value="4">LO4 · Service value system</option><option value="5">LO5 · Service value chain</option><option value="6">LO6 · Practices and terms</option><option value="7">LO7 · Practices in detail</option></select></label></div><div class="sq-actions">${button('Start mission','start',true)}${button('Learn first','learn')}</div>${round&&!round.finished?`<div class="sq-actions">${button(`Resume task ${round.index+1}/${round.tasks.length}`,'resume',true)}</div>`:''}<p class="sq-note">One matching task contains four connections. Matching is a learning exercise, not an official exam question format. Use <b>Exam arena</b> in the main game for a timed paper.</p></div><div class="sq-panel"><b>Training progress</b><p>${correct}/${attempts} checks correct · ${P.rounds} completed missions · ${P.xp} training XP</p><p class="sq-note">These practice results are not a prediction of passing an exam. Training XP is saved separately from the original city game.</p><div class="sq-actions">${button('Export progress','export')}${button('Back to city','close')}</div><p class="sq-saved">Saved in this browser on this device. No account or payment.</p></div>`)}
function rank(items,weak=false){return mix(items).map(q=>{let r=P.records[q.id],priority=!r?60:!r.lastRight?100:r.due<=Date.now()?70:10;return{q,score:priority+(weak?0:Math.random()*50)}}).sort((a,b)=>b.score-a.score).map(x=>x.q)}
function start(){if(round&&!round.finished&&!confirm('Replace the unfinished mission? Checked answers and XP stay saved.'))return;let count=Number(root.querySelector('#sq-count').value),mode=root.querySelector('#sq-mode').value,lo=root.querySelector('#sq-topic').value;let pool=[...Q.values()].filter(q=>lo==='all'||String(q.lo)===lo),ranked=rank(pool,mode==='review'),unique=[],groups=new Set();for(const q of ranked){let g=q.conceptId||q.id;if(!groups.has(g)){unique.push(q);groups.add(g)}}for(const q of ranked)if(!unique.includes(q))unique.push(q);let cp=DATA.concepts.filter(c=>lo==='all'||String(c.lo)===lo),rowBag=mix(cp),mc=0;const tasks=[];let types=mode==='matching'?Array(count).fill('match'):mode==='mixed'?mix(Array.from({length:count},(_,i)=>i%3===0?'match':'mcq')):Array(count).fill('mcq');for(const type of types){if(type==='match'){if(rowBag.length<4)rowBag=mix(cp);let rows=rowBag.splice(0,4);if(rows.length<4)rows=[...rows,...mix(DATA.concepts.filter(c=>!rows.includes(c))).slice(0,4-rows.length)];let ids=rows.map(c=>c.id),distractors=[...new Set(rows.flatMap(c=>c.distractors))].filter(id=>!ids.includes(id));if(distractors.length<2)distractors=DATA.concepts.filter(c=>!ids.includes(c.id)).map(c=>c.id);tasks.push({type:'match',rows:mix(ids),options:mix([...ids,...mix(distractors).slice(0,2)]),answers:{},checked:false})}else{const q=unique[mc++];if(!q)break;tasks.push({type:'mcq',id:q.id,order:mix([0,1,2,3]),choice:null,checked:false})}}round={version:1,tasks,index:0,correct:0,total:0,xp:0,mode,lo,finished:false};save();renderTask()}
function current(){return round?.tasks[round.index]}

// Placement is blue until checked: colour must not give away the answer.
function matchContent(t){
 const count=Object.keys(t.answers).length;
 const bank=t.checked?'':`<div class="sq-bank" aria-label="Six terms" lang="en">${t.options.map(id=>{
  const row=t.rows.findIndex(row=>t.answers[row]===id);
  return `<button class="sq-token ${row>=0?'sq-used':''}" data-token="${esc(id)}" aria-pressed="false"><span>${esc(C.get(id).term)}</span><small class="sq-token-status">${row>=0?'Placed in '+(row+1)+' · move':'Drag or tap'}</small></button>`;
 }).join('')}</div>`;
 return `<h2 class="sq-title" data-heading tabindex="-1">Match each statement to its term.</h2>
 <p class="sq-note">Drag a term onto a statement, or tap a term and then a statement. Use each term once. Two terms are left over.</p>
 ${bank}<p id="sq-selection" class="sq-toast" aria-live="polite">${t.checked?'Answers checked. Review each connection below.':count+' / 4 placed · Blue means placed, not yet checked.'}</p>
 <div class="sq-slots" lang="en">${t.rows.map((id,i)=>{
  const answer=t.answers[id],filled=Boolean(answer),right=answer===id;
  const state=t.checked?(right?'sq-good':'sq-bad'):filled?'sq-filled':'';
  const status=t.checked?(right?'✓ Correct':'✕ Incorrect'):filled?'Placed · not checked':'Empty';
  return `<button class="sq-slot ${state}" data-slot="${esc(id)}" ${t.checked?'disabled':''}>
   <span class="sq-slot-heading"><span class="sq-slot-number">${i+1}</span><span class="sq-slot-status">${status}</span></span>
   <span class="sq-statement">${esc(C.get(id).definition)}</span>
   <span class="sq-answer-chip ${filled?'':'sq-empty-chip'}"><small>${filled?(t.checked?'YOUR ANSWER':'PLACED TERM'):'CHOOSE A TERM'}</small><b>${filled?esc(C.get(answer).term):'↓ Drop or tap here'}</b></span>
   ${t.checked&&!right?`<span class="sq-answer-correct sq-correction">✓ Correct term: ${esc(C.get(id).term)}</span>`:''}
   ${filled&&!t.checked?'<span class="sq-change-note">Choose another term to change this answer.</span>':''}
  </button>`;
 }).join('')}</div>`;
}
function matchFeedback(t){
 const right=t.rows.filter(id=>t.answers[id]===id).length;
 return `<section class="sq-feedback sq-match-feedback" aria-live="polite"><h3>${right} of 4 connections correct</h3>${t.rows.map((id,i)=>{
  const c=C.get(id),chosen=C.get(t.answers[id]),ok=id===t.answers[id];
  return `<div class="sq-term sq-feedback-item ${ok?'sq-feedback-item-correct':'sq-feedback-item-wrong'}">
   <strong class="sq-feedback-status ${ok?'sq-answer-correct':'sq-answer-wrong'}">${ok?'✓':'✕'} Statement ${i+1} · ${ok?'Correct':'Incorrect'}</strong>
   ${!ok?`<p class="sq-answer-wrong" lang="nl"><b>✕ Jouw keuze: ${esc(chosen?.term)}</b></p>`:''}
   <p class="sq-answer-correct" lang="en"><b>✓ Correct answer: ${esc(c.term)}</b></p>
   <p lang="en">${esc(c.definition)}</p><p lang="nl">${esc(c.nl)}</p>
   ${!ok?`<p lang="nl"><b>Waarom jouw keuze niet past:</b><br>${esc(chosen?.nl)}</p>`:''}
   <p><b>Remember:</b> ${esc(c.hook)}</p>
  </div>`;
 }).join('')}<small>Matching builds understanding. It is not part of the official multiple-choice exam format.</small></section>`;
}

function renderTask(){header();selected=null;const t=current();if(!t){home();return}if(t.type==='mcq'&&!Q.has(t.id)){round=null;save();home();return}let top=`<div class="sq-status"><span class="sq-badge">${t.type==='match'?'TERM MATCH · '+t.rows.length+' / '+t.options.length:'MULTIPLE CHOICE · EN'}</span><b>Task ${round.index+1} / ${round.tasks.length}</b></div><div class="sq-progress"><i style="width:${round.index/round.tasks.length*100}%"></i></div>`;let content='';if(t.type==='mcq'){let q=Q.get(t.id);content=`<span class="sq-eyebrow">${t.checked?'LO'+q.lo+' · '+esc(q.tag):round.mode==='warmup'?'WARM-UP · RECALL':'CONTRAST PRACTICE · CHOOSE ONE'}</span><h2 class="sq-title" data-heading tabindex="-1" lang="en">${esc(q.prompt)}</h2><div class="sq-options" lang="en">${t.order.map((i,j)=>`<button class="sq-option ${t.checked?(i===0?'sq-good':i===t.choice?'sq-bad':''):t.choice===i?'sq-selected':''}" data-choice="${i}" aria-pressed="${t.choice===i}" ${t.checked?'disabled':''}><span class="sq-letter">${'ABCD'[j]}</span><span>${esc(q.options[i])}</span></button>`).join('')}</div>`}else{content=matchContent(t)}show(top+content+`<div class="sq-actions">${button(t.checked?(round.index===round.tasks.length-1?'See results':'Next task'):'Check answer',t.checked?'next':'check',true,t.checked?'':(t.type==='mcq'?t.choice===null:Object.keys(t.answers).length<t.rows.length)?'disabled':'')}${button('Pause','pause')}</div>`+(t.checked?feedback(t):''))}
function assign(row,term){let t=current();if(!t||t.checked||!t.rows.includes(row)||!t.options.includes(term))return;for(const k of Object.keys(t.answers))if(t.answers[k]===term)delete t.answers[k];t.answers[row]=term;selected=null;save();const scroll=root.scrollTop;renderTask();root.scrollTop=scroll;const slot=[...root.querySelectorAll('[data-slot]')].find(el=>el.dataset.slot===row);slot?.classList.add('sq-just-placed');slot?.focus({preventScroll:true});root.querySelector('#sq-selection').textContent=C.get(term).term+' placed in '+(t.rows.indexOf(row)+1)+'. '+Object.keys(t.answers).length+' / '+t.rows.length+' placed · Not checked yet.'}
function record(id,right){const old=P.records[id]||{attempts:0,correct:0};P.records[id]={attempts:old.attempts+1,correct:old.correct+Number(right),lastRight:right,due:Date.now()+(right?86400000:120000)};round.total++;if(right)round.correct++;const xp=right?10:2;round.xp+=xp;P.xp+=xp}
function check(){const t=current();if(!t||t.checked)return;if(t.type==='mcq'){if(t.choice===null)return;record(t.id,t.choice===0)}else{if(Object.keys(t.answers).length<t.rows.length)return;t.rows.forEach(id=>record('match-'+id,t.answers[id]===id))}t.checked=true;save();renderTask();root.querySelector('.sq-feedback')?.scrollIntoView({behavior:'smooth',block:'start'})}
function feedback(t){if(t.type==='mcq'){let q=Q.get(t.id),right=t.choice===0;return `<section class="sq-feedback ${right?'sq-feedback-correct':'sq-feedback-wrong'}" aria-live="polite"><h3 class="${right?'sq-answer-correct':'sq-answer-wrong'}">${right?'Correct.':'Not quite — here is the distinction.'}</h3><p class="sq-answer-correct" lang="en"><b>✓ Correct answer:</b> ${esc(q.options[0])}</p>${!right?`<p class="sq-answer-wrong" lang="en"><b>✕ Your answer:</b> ${esc(q.options[t.choice])}</p>`:''}<p lang="en">${esc(q.why)}</p>${q.whyNl?`<p lang="nl"><b>Uitleg:</b> ${esc(q.whyNl)}</p>`:''}${q.optionReasons?`<details ${right?'':'open'}><summary>Why the other options do not fit</summary>${q.options.map((o,i)=>`<div class="sq-term"><strong class="${i===0?'sq-answer-correct':i===t.choice?'sq-answer-wrong':'sq-answer-neutral'}" lang="en">${esc(o)}</strong><p lang="en">${esc(q.optionReasons[i])}</p>${q.optionReasonsNl?.[i]?`<p lang="nl">${esc(q.optionReasonsNl[i])}</p>`:''}</div>`).join('')}</details>`:''}<p><b>Remember:</b> ${esc(q.hook)}</p><small>Original practice question · ${q.criterion?'Syllabus criterion '+esc(q.criterion):'LO'+q.lo}. Not official exam material.</small></section>`}return matchFeedback(t)}
function next(){if(!current()?.checked)return;if(round.index<round.tasks.length-1){round.index++;save();renderTask()}else{round.finished=true;P.rounds++;save();results()}}
function results(){header();const wrong=round.tasks.filter(t=>t.type==='mcq'?t.choice!==0:t.rows.some(id=>t.answers[id]!==id));show(`<span class="sq-eyebrow">MISSION COMPLETE</span><h1 data-heading tabindex="-1">You made ${round.total} connections and decisions.</h1><div class="sq-panel"><div class="sq-result-num">${round.correct} / ${round.total}</div><p>Correct checks · +${round.xp} training XP</p><p class="sq-note">Each matching statement counts as one check. This is a practice score, not an exam prediction.</p><div class="sq-actions">${button('New mission','home',true)}${button('Review mistakes','mistakes')}${button('Back to city','close')}</div></div>${wrong.length?`<p class="sq-muted">${wrong.length} tasks need another look. Smart review gives weak and unseen questions priority.</p>`:'<p>All checks correct. Practise again later to check what you retain.</p>'}`)}
function mistakes(){const wrong=round.tasks.filter(t=>t.type==='mcq'?t.choice!==0:t.rows.some(id=>t.answers[id]!==id));show(`<h1 data-heading tabindex="-1">Review your mistakes</h1>${button('Back to results','results')}<p class="sq-note">Read the distinction, not just the correct letter.</p>${wrong.map(t=>t.type==='mcq'?`<h2 class="sq-title" lang="en">${esc(Q.get(t.id).prompt)}</h2>${feedback(t)}`:feedback(t)).join('')||'<p>No mistakes this round.</p>'}`)}
function learn(){const c=DATA.concepts[learnIndex%DATA.concepts.length];show(`<span class="sq-eyebrow">LEARN FIRST · ${learnIndex+1}/${DATA.concepts.length} · LO${c.lo}</span><h1 data-heading tabindex="-1" lang="en">${esc(c.term)}</h1><div class="sq-panel"><p lang="en">${esc(c.definition)}</p><p lang="nl">${esc(c.nl)}</p><p><b>Remember:</b> ${esc(c.hook)}</p><details><summary>Compare with similar terms</summary>${c.distractors.map(id=>{let d=C.get(id);return `<div class="sq-term"><strong>${esc(d.term)}</strong><p lang="en">${esc(d.definition)}</p><p lang="nl">${esc(d.nl)}</p></div>`}).join('')}</details></div><div class="sq-actions">${button('Previous','learn-prev')}${button('Try this idea','try',true)}${button('Next idea','learn-next')}</div>${button('Mission menu','home')}<p class="sq-note">Reading is not counted as mastery. Try the idea without looking back, then revisit it after a break.</p>`)}
function tryIdea(){if(round&&!round.finished&&!confirm('Pause and replace your unfinished mission with this one question? Checked answers stay saved.'))return;const c=DATA.concepts[learnIndex];round={version:2,qualityVersion:'coherent-contrast-1',tasks:[{type:'mcq',id:'train-'+c.id+'-scenario',order:mix([0,1,2,3]),choice:null,checked:false}],index:0,correct:0,total:0,xp:0,finished:false,mode:'guided'};save();renderTask()}
function exportSave(){save();const b=new Blob([JSON.stringify(P,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='service-quest-training-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function handleClick(e){if(Date.now()<ignoreClickUntil)return;const t=current();let el=e.target.closest('[data-choice]');if(el&&t&&!t.checked){t.choice=Number(el.dataset.choice);save();const y=root.scrollTop;renderTask();root.scrollTop=y;return}el=e.target.closest('[data-token]');if(el&&t&&!t.checked){select(el.dataset.token);return}el=e.target.closest('[data-slot]');if(el&&t&&!t.checked){if(selected)assign(el.dataset.slot,selected);else root.querySelector('#sq-selection').textContent='Tap a term first, then this statement.';return}const action=e.target.closest('[data-act]')?.dataset.act;if(!action)return;({close,home,start,resume:renderTask,check,next,pause:()=>{save();home()},results,mistakes,learn,'learn-next':()=>{learnIndex=(learnIndex+1)%DATA.concepts.length;learn()},'learn-prev':()=>{learnIndex=(learnIndex-1+DATA.concepts.length)%DATA.concepts.length;learn()},try:tryIdea,export:exportSave})[action]?.()}
function select(id){selected=selected===id?null:id;root.querySelectorAll('[data-token]').forEach(b=>{const yes=b.dataset.token===selected;b.classList.toggle('sq-selected',yes);b.setAttribute('aria-pressed',String(yes))});root.querySelector('#sq-selection').textContent=selected?'Selected: '+C.get(selected).term+'. Tap a statement.':'Choose a term.'}
function pointerDown(e){let b=e.target.closest('[data-token]');if(!b||current()?.checked||e.button!==0)return;drag={id:b.dataset.token,x:e.clientX,y:e.clientY,pointer:e.pointerId,el:b,moved:false,ghost:null};b.setPointerCapture(e.pointerId)}
function pointerMove(e){if(!drag||e.pointerId!==drag.pointer)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;if(!drag.moved)return;e.preventDefault();if(!drag.ghost){drag.ghost=document.createElement('div');drag.ghost.className='sq-ghost';drag.ghost.textContent=C.get(drag.id).term;document.body.appendChild(drag.ghost)}drag.ghost.style.left=Math.max(5,Math.min(innerWidth-220,e.clientX-75))+'px';drag.ghost.style.top=e.clientY-60+'px';root.querySelectorAll('.sq-over').forEach(n=>n.classList.remove('sq-over'));document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]')?.classList.add('sq-over');if(e.clientY>innerHeight-70)root.scrollTop+=14;else if(e.clientY<140)root.scrollTop-=14}
function pointerUp(e){if(!drag||drag.pointer!==e.pointerId)return;const d=drag,slot=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');clearDrag();if(d.moved){ignoreClickUntil=Date.now()+400;if(slot)assign(slot.dataset.slot,d.id);else select(d.id)}}
function clearDrag(){if(!drag)return;drag.ghost?.remove();try{drag.el.releasePointerCapture(drag.pointer)}catch{}root?.querySelectorAll('.sq-over').forEach(n=>n.classList.remove('sq-over'));drag=null}
function keyDown(e){if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const items=[...root.querySelectorAll('button:not(:disabled),select,summary,a[href]')].filter(n=>n.getClientRects().length),first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}
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

window.SQTraining={open,version:DATA.version,uiVersion:'coherent-contrast-1'};
})();
