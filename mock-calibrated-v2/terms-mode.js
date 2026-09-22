(()=>{
'use strict';
const KEY='itil4-terms-lab-v1',DAY=864e5,INT=[0,6e5,DAY,3*DAY,7*DAY,14*DAY,30*DAY];
const rows=[
['utility','Core','Utility','Useful functionality or removal of a constraint for the consumer.','Not reliability, availability, capacity or security.','Utility = what it DOES.'],
['warranty','Core','Warranty','Assurance that agreed conditions of use are met, such as availability, capacity, continuity and security.','Not the feature list or a commercial guarantee period.','Warranty = can I RELY on it?'],
['output','Core','Output','A deliverable produced by an activity.','Not the stakeholder result enabled by that deliverable.','Output = what came OUT.'],
['outcome','Core','Outcome','A result for a stakeholder enabled by outputs.','Not the report, dashboard or other deliverable itself.','Outcome = what changed for someone.'],
['value','Core','Value','Benefits, usefulness and importance as perceived by stakeholders.','Not automatically the same as low cost or technical quality.','Value is perceived.'],
['cost','Core','Cost','Money or resources spent on an activity or resource.','A service can remove one cost while introducing another.','Cost = resources spent.'],
['risk','Core','Risk','A possible event that could cause harm or make objectives harder to achieve.','A service can reduce some risks while creating others.','Risk = possible harm.'],
['service','Core','Service','A way to enable value by helping consumers achieve desired outcomes while some specific costs and risks are managed for them.','Not just software, hardware or a feature list.','Service = enable outcomes.'],
['product','Core','Product','A configuration of organizational resources designed to offer value.','Not the customer-facing description of the offering.','Product = configured resources.'],
['offering','Core','Service offering','A description of one or more services for a target consumer group.','Not the underlying product or the ongoing relationship.','Offering = what is offered to whom.'],
['relationship','Core','Service relationship','Cooperation between provider and consumer, including provision and consumption activities.','Not only a contract or only provider work.','Relationship = provider + consumer together.'],
['service-management','Core','Service management','Organizational capabilities used to enable value through services.','Not one process, tool or service desk.','Service management = capabilities around services.'],
['customer','Roles','Customer','Defines service requirements and is accountable for outcomes from service consumption.','Not necessarily the person who uses the service or funds it.','Customer = requirements + outcomes.'],
['user','Roles','User','Uses the service.','Seniority does not define the role.','User = uses.'],
['sponsor','Roles','Sponsor','Authorizes budget for service consumption.','Can also be customer or user, but budget authority is the clue.','Sponsor = budget.'],
['focus-value','Principles','Focus on value','Connect work to value for customers and other stakeholders.','Not simply doing whatever one customer asks.','Who gets value, and how?'],
['start','Principles','Start where you are','Assess the current state and reuse what already works before replacing it.','Not never changing existing work.','Look first; do not restart blindly.'],
['iterate','Principles','Progress iteratively with feedback','Move in manageable steps and use feedback frequently.','Not one huge delivery followed by feedback only at the end.','Small step → feedback → next step.'],
['collaborate','Principles','Collaborate and promote visibility','Involve the right people and make relevant work and information visible.','Not invite everyone to everything.','Right people + visible work.'],
['holistic','Principles','Think and work holistically','Consider the whole system and how parts interact.','Not optimize one component while ignoring end-to-end effects.','Whole service, not isolated parts.'],
['simple','Principles','Keep it simple and practical','Use the minimum steps needed to achieve the objective.','Not remove controls that are genuinely necessary.','Every step must earn its place.'],
['optimize','Principles','Optimize and automate','Improve work first, then automate suitable parts where useful.','Not automate a bad process unchanged.','Optimize first; automate second.'],
['people','Dimensions','Organizations and people','Roles, skills, culture, structure, communication and capacity of people.','Not mainly tools, supplier contracts or workflow design.','People, skills, culture, structure.'],
['info-tech','Dimensions','Information and technology','Information, knowledge, applications, infrastructure and technology needed by services.','Not mainly staffing or supplier relationships.','Data + technology.'],
['partners','Dimensions','Partners and suppliers','External organizations, sourcing choices, contracts and supplier relationships.','Not the internal flow of work itself.','Outside parties and sourcing.'],
['streams','Dimensions','Value streams and processes','How activities, workflows, controls and processes combine to create value.','Not mainly people skills or technology architecture.','How work flows end to end.'],
['svs','SVS','Service value system (SVS)','The overall system showing how components and activities work together to enable value.','Not the same as the service value chain alone.','SVS = the whole system.'],
['governance','SVS','Governance','Evaluation, direction and monitoring used to direct and control an organization.','Not day-to-day service delivery.','Evaluate → direct → monitor.'],
['svc','SVS','Service value chain','The operating model with six interconnected activities used in value streams.','Not a mandatory linear six-step process.','Value chain = flexible operating model.'],
['value-stream','SVS','Value stream','A specific combination of activities used to create and deliver products and services.','Not every value chain activity exactly once.','Value stream = route through the work.'],
['practice','SVS','Practice','Organizational resources arranged to perform work or achieve an objective.','Not identical to a process or value chain activity.','Practice = resources for a purpose.'],
['plan','Value chain','Plan','Creates shared understanding of vision, current status and improvement direction.','Not detailed design of one change.','Plan = shared direction.'],
['improve','Value chain','Improve','Ensures continual improvement across products, services and practices.','Not limited to a separate improvement team.','Improve = improvement everywhere.'],
['engage','Value chain','Engage','Builds understanding of stakeholder needs and maintains good relationships.','Not merely talking to users.','Engage = understand and relate.'],
['design','Value chain','Design and transition','Ensures products and services meet expectations for quality, cost and time-to-market as they are designed or changed.','Not moving code into an environment.','Design/transition = shape the service or change.'],
['obtain','Value chain','Obtain/build','Ensures service components are available when and where needed and meet agreed specifications.','Not making a release available to users.','Obtain/build = get the components.'],
['deliver','Value chain','Deliver and support','Ensures live services are delivered and supported according to agreed expectations.','Not long-term strategy or supplier sourcing.','Deliver/support = run and support live services.'],
['incident','Support','Incident','An unplanned interruption or reduction in service quality.','Not the underlying cause.','Incident = service affected now.'],
['incident-mgmt','Support','Incident management','Restores normal service operation quickly and reduces negative impact.','Not primarily root-cause removal.','Incident management = restore first.'],
['problem','Support','Problem','A cause or potential cause of one or more incidents.','Not the interruption itself.','Problem = cause.'],
['known-error','Support','Known error','A problem that has been analysed but is not yet resolved.','Not a permanently fixed problem.','Known error = understood, unresolved problem.'],
['workaround','Support','Workaround','A temporary way to reduce impact without eliminating the underlying cause.','Not the permanent fix.','Workaround = cope without fixing the cause.'],
['request','Support','Service request','A predefined, user-initiated request that is part of normal service delivery.','Not automatically an incident because a user contacted support.','Request = normal predefined ask.'],
['desk','Support','Service desk','The central contact point that captures demand for incident resolution and service requests.','Not required to perform every specialist fix itself.','Service desk = contact point.'],
['change','Changes','Change enablement','Assesses risk, authorizes changes and manages scheduling to maximize successful changes.','Not deployment or release execution.','Change enablement = assess and authorize.'],
['standard','Changes','Standard change','A low-risk, well-understood, documented change that is pre-authorized under an agreed model.','Common or routine alone is not enough; pre-authorization is decisive.','Standard = pre-authorized model.'],
['normal','Changes','Normal change','A change that is not standard or emergency and needs assessment and authorization appropriate to risk.','Normal does not mean routine or pre-approved.','Normal = assess, then authorize.'],
['emergency','Changes','Emergency change','A change that must be implemented quickly using an expedited assessment and authorization route.','Urgent does not mean uncontrolled.','Emergency = expedited, still controlled.'],
['deployment','Changes','Deployment management','Moves new or changed components to live or other environments.','Not the decision to make features available for use.','Deployment = move/install.'],
['release','Changes','Release management','Makes new or changed services or features available for use.','Can happen after deployment; the two are not synonyms.','Release = available for use.'],
['event','Technical','Event','A change of state significant for managing a service or configuration item.','Not every event is an incident.','Event = significant state change.'],
['monitor','Technical','Monitoring and event management','Observes services and components and records or responds to selected changes of state.','Not primarily restoring interrupted service.','Monitoring = observe; event = state change.'],
['config','Technical','Service configuration management','Provides reliable information about configuration items and their relationships.','Not mainly financial lifecycle control of assets.','Configuration = what is connected to what.'],
['asset','Technical','IT asset management','Manages IT asset lifecycles to maximize value and control costs and risks.','Not mainly mapping service relationships between components.','Asset = lifecycle, value, cost, risk.'],
['security','Technical','Information security management','Protects information needed by the organization, including confidentiality, integrity and availability.','Not just passwords or secrecy.','Security = confidentiality + integrity + availability.'],
['relationship-mgmt','Relationships','Relationship management','Establishes and nurtures links between the organization and stakeholders.','Not mainly supplier performance or service target measurement.','Relationship = stakeholder connection.'],
['supplier','Relationships','Supplier management','Ensures suppliers and their performance support quality services.','Not the same as general stakeholder relationship management.','Supplier = external provider performance.'],
['slm','Relationships','Service level management','Sets clear business-based service targets and assesses delivery against them.','Not merely technical component metrics.','Service level = meaningful target + review.'],
['vision','Improvement','What is the vision?','Connect the improvement to organizational vision, goals and objectives.','Not the current-state baseline.','Vision = why and direction.'],
['now','Improvement','Where are we now?','Establish the current state and factual baseline.','Not the future target.','Now = baseline.'],
['want','Improvement','Where do we want to be?','Define the desired future state and measurable targets.','Not yet the detailed action plan.','Want = target.'],
['how','Improvement','How do we get there?','Develop the approach and actions needed to reach the target.','Not the execution itself.','How = plan the route.'],
['action','Improvement','Take action','Carry out the agreed improvement work.','Not planning or evaluation.','Action = do the work.'],
['did','Improvement','Did we get there?','Evaluate results against the agreed target.','Not simply checking whether tasks were completed.','Did = compare result to target.'],
['momentum','Improvement','How do we keep the momentum going?','Embed learning, sustain gains and continue improving.','Not stop because one project finished.','Momentum = learn, embed, continue.']
];
const C=rows.map(r=>({id:r[0],g:r[1],term:r[2],cue:r[3],not:r[4],mem:r[5]})),byTerm=new Map(C.map(c=>[c.term,c]));
const Q=[
['A service has every feature users need, but it is frequently unavailable. What is primarily weak?',['Utility','Warranty'],'Warranty','Functionality exists; assurance of use is weak.'],
['A dashboard is delivered. The manager then makes a faster decision. What is the faster decision?',['Output','Outcome'],'Outcome','The dashboard is the deliverable; the result for the manager is the outcome.'],
['A director approves the budget but does not define requirements or use the service. Which role?',['Sponsor','Customer','User'],'Sponsor','Budget authorization points to sponsor.'],
['A routine low-risk change follows a documented model and needs no fresh authorization each time. Which type?',['Standard change','Normal change','Emergency change'],'Standard change','Pre-authorization under an agreed model is decisive.'],
['A new version is installed in production, but the feature stays disabled. What happened?',['Deployment management','Release management','Change enablement'],'Deployment management','Components moved to production; they are not yet available for use.'],
['An already deployed feature is switched on for customers. Which practice is most direct?',['Release management','Deployment management','Change enablement'],'Release management','The feature becomes available for use.'],
['Users cannot submit orders. A restart restores service. What is the immediate focus?',['Incident management','Problem management'],'Incident management','Immediate restoration is incident management.'],
['The same worker crashes weekly and engineers investigate the memory leak. What are they managing?',['Problem','Incident'],'Problem','The focus is the underlying cause.'],
['The root cause is understood but not yet fixed. What is it now called?',['Known error','Workaround','Incident'],'Known error','Analysed but unresolved problem = known error.'],
['Users follow a temporary manual process while the defect remains. What is that process?',['Workaround','Known error','Normal change'],'Workaround','It reduces impact without removing the cause.'],
['CPU crosses an alert threshold but users are unaffected. What has definitely occurred?',['Event','Incident'],'Event','A significant state change can exist without an incident.'],
['The team needs to know which database, server and API support a service. Which practice?',['Service configuration management','IT asset management'],'Service configuration management','The relationships between configuration items are the clue.'],
['The team tracks licence cost, ownership, renewal and disposal. Which practice?',['IT asset management','Service configuration management'],'IT asset management','Lifecycle, value, cost and risk point to asset management.'],
['A manager discusses a customer’s changing priorities and satisfaction. Which practice?',['Relationship management','Service level management','Supplier management'],'Relationship management','The stakeholder relationship is the main subject.'],
['A hosting vendor repeatedly misses commitments. Which practice?',['Supplier management','Relationship management','Service level management'],'Supplier management','The named external supplier and its performance are decisive.'],
['A team agrees a business-relevant end-to-end target and reviews delivery against it. Which practice?',['Service level management','Monitoring and event management','Relationship management'],'Service level management','Meaningful service targets and review are the clue.'],
['Duplicate approvals are removed before a request flow is automated. Which principle fits MOST directly?',['Optimize and automate','Keep it simple and practical','Start where you are'],'Optimize and automate','Optimization before automation is explicit.'],
['Before replacing a support process, the team observes it and reuses what works. Which principle fits BEST?',['Start where you are','Progress iteratively with feedback','Think and work holistically'],'Start where you are','Assess and reuse the current state.'],
['A small improvement is delivered, feedback is gathered, then the next step is chosen. Which principle?',['Progress iteratively with feedback','Focus on value','Collaborate and promote visibility'],'Progress iteratively with feedback','Small steps plus feedback are explicit.'],
['One server metric improves but the full customer journey becomes slower. Which principle was neglected?',['Think and work holistically','Optimize and automate','Focus on value'],'Think and work holistically','One component was optimized without the whole system.'],
['Support staff lack skills for a new platform. Which dimension is MOST direct?',['Organizations and people','Information and technology','Partners and suppliers','Value streams and processes'],'Organizations and people','Skills and capability of staff are the direct clue.'],
['Customer data is unreliable and the integration platform is unsuitable. Which dimension is MOST direct?',['Information and technology','Organizations and people','Partners and suppliers','Value streams and processes'],'Information and technology','Data and platform are direct clues.'],
['A service depends heavily on a cloud provider and contract design. Which dimension?',['Partners and suppliers','Information and technology','Organizations and people','Value streams and processes'],'Partners and suppliers','Sourcing and supplier dependence are central.'],
['A request passes through nine hand-offs and duplicate approvals. Which dimension?',['Value streams and processes','Organizations and people','Information and technology','Partners and suppliers'],'Value streams and processes','The issue is how work flows.'],
['Which is the WHOLE system rather than only its operating model?',['Service value system (SVS)','Service value chain'],'Service value system (SVS)','The value chain is one component of the wider SVS.'],
['Different needs use different combinations of value chain activities. What is each specific route called?',['Value stream','Service value chain','Practice'],'Value stream','A value stream is the specific combination for a need.'],
['The team agrees organization-wide direction, current status and priorities. Which value chain activity fits BEST?',['Plan','Engage','Improve'],'Plan','Shared direction and current status point to Plan.'],
['The team is understanding stakeholder needs and maintaining communication. Which activity fits BEST?',['Engage','Plan','Deliver and support'],'Engage','Stakeholder needs and relationships are central.'],
['A missing software component must be acquired or built to specification. Which activity fits BEST?',['Obtain/build','Design and transition','Deliver and support'],'Obtain/build','Getting or building the required component is the clue.'],
['A live service is operated and users are supported against agreed expectations. Which activity?',['Deliver and support','Obtain/build','Engage'],'Deliver and support','Live delivery and support are explicit.'],
['The team measures current performance before setting a target. Which improvement step?',['Where are we now?','Where do we want to be?','Did we get there?'],'Where are we now?','A factual baseline comes before the target.'],
['The target is known; the team now decides actions, owners and milestones. Which step?',['How do we get there?','Take action','Where do we want to be?'],'How do we get there?','The route and plan are being designed, not executed.'],
['The team compares actual results with the target after implementation. Which step?',['Did we get there?','How do we keep the momentum going?','Where are we now?'],'Did we get there?','Evaluation against the target is the clue.'],
['A user asks for approved software access through a predefined workflow. What is this?',['Service request','Incident'],'Service request','It is a normal predefined user-initiated request.'],
['A central contact point records a user issue and routes it to a specialist. Which practice?',['Service desk','Incident management','Service request management'],'Service desk','The central contact and communication role is decisive.'],
['An urgent production security fix needs accelerated assessment and approval. Which change type?',['Emergency change','Normal change','Standard change'],'Emergency change','Urgency creates an expedited route, not no control.'],
['A production change is neither pre-authorized nor urgent and must be assessed for risk. Which type?',['Normal change','Standard change','Emergency change'],'Normal change','It needs assessment and authorization appropriate to risk.'],
['A team evaluates, directs and monitors organizational activity. What is this?',['Governance','Service value chain','Service management'],'Governance','Evaluate, direct and monitor are governance actions.'],
['A package describes service access, support and onboarding for a target group. What is it?',['Service offering','Product','Service relationship'],'Service offering','It is the consumer-facing description of what is offered.'],
['People, tools, information and working methods are arranged to achieve an objective. What concept?',['Practice','Process','Value stream'],'Practice','A practice is the broader set of organizational resources.']
].map((x,i)=>({id:'q'+(i+1),text:x[0],options:x[1],answer:x[2],why:x[3]}));
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{s:{},q:{}}}catch{return {s:{},q:{}}}}let S=load();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}
function st(id){return S.s[id]||(S.s[id]={seen:0,g:0,a:0,b:0,box:0,due:0,last:0})}
function mark(id,r){const x=st(id);x.seen++;x.last=Date.now();if(r==='g'){x.g++;x.box=Math.min(6,x.box+1);x.due=Date.now()+INT[x.box]}else if(r==='a'){x.a++;x.box=Math.max(0,x.box-1);x.due=Date.now()+6e5}else{x.b++;x.box=0;x.due=Date.now()+12e4}save()}
function mastery(c){const x=st(c.id);return x.seen?Math.max(0,Math.min(1,(x.g+.45*x.a)/(x.seen+1)*(.55+.075*Math.min(6,x.box)))):0}
function weak(n=20){const now=Date.now();return [...C].sort((a,b)=>(((st(a.id).due||0)<=now?0:1)-((st(b.id).due||0)<=now?0:1))||mastery(a)-mastery(b)||st(a.id).seen-st(b.id).seen||st(a.id).last-st(b.id).last).slice(0,n)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mix(a){a=[...a];for(let i=a.length-1;i;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function kpi(){return {seen:C.filter(c=>st(c.id).seen).length,avg:Math.round(C.reduce((n,c)=>n+mastery(c),0)/C.length*100),due:C.filter(c=>(st(c.id).due||0)<=Date.now()).length}}
const SORTS=[
 {name:'Change types',bins:['Standard change','Normal change','Emergency change'],cards:[
  ['Pre-authorized routine model','Standard change'],['Needs assessment + authorization','Normal change'],['Fast route, still controlled','Emergency change'],
  ['Low risk + well understood','Standard change'],['Not standard and not urgent','Normal change'],['Must happen as soon as practical','Emergency change']]},
 {name:'Change / deploy / release',bins:['Change enablement','Deployment management','Release management'],cards:[
  ['Assess risk + authorize','Change enablement'],['Move components to an environment','Deployment management'],['Make feature available to users','Release management'],
  ['Manage change schedule','Change enablement'],['Install version in production','Deployment management'],['Switch on already-deployed feature','Release management']]},
 {name:'Incident / problem',bins:['Incident','Problem','Known error','Workaround'],cards:[
  ['Service is interrupted now','Incident'],['Underlying cause','Problem'],['Analysed but not fixed','Known error'],['Temporary way around the issue','Workaround'],
  ['Restore service quickly','Incident'],['Why does it keep happening?','Problem']]},
 {name:'Consumer roles',bins:['Customer','Sponsor','User'],cards:[
  ['Defines requirements','Customer'],['Authorizes budget','Sponsor'],['Uses the service','User'],
  ['Accountable for consumption outcomes','Customer'],['Pays / approves spending','Sponsor'],['Actually works with it','User']]},
 {name:'Core value terms',bins:['Utility','Warranty','Output','Outcome'],cards:[
  ['Does the needed job','Utility'],['Can be relied on under agreed conditions','Warranty'],['Thing produced by work','Output'],['Result for a stakeholder','Outcome'],
  ['Fit for purpose','Utility'],['Fit for use','Warranty']]},
 {name:'Relationship practices',bins:['Relationship management','Supplier management','Service level management'],cards:[
  ['Stakeholder relationship','Relationship management'],['External supplier performance','Supplier management'],['Business-based service target','Service level management'],
  ['Changing customer priorities','Relationship management'],['Vendor misses commitments','Supplier management'],['Review delivery against target','Service level management']]},
 {name:'Technical look-alikes',bins:['Service configuration management','IT asset management','Monitoring and event management'],cards:[
  ['CI relationships','Service configuration management'],['Lifecycle, cost and ownership','IT asset management'],['Observe state changes','Monitoring and event management'],
  ['Which database supports this app?','Service configuration management'],['Licence renewal and disposal','IT asset management'],['Threshold alert','Monitoring and event management']]}
];
const ORDER=[
 ['What is the vision?','Where are we now?','Where do we want to be?','How do we get there?','Take action','Did we get there?','How do we keep the momentum going?']
];
function css(){
 if(document.getElementById('tl-css'))return;
 const e=document.createElement('style');e.id='tl-css';
 e.textContent='.tl-grid{display:grid;gap:10px}.tl-grid.two{grid-template-columns:1fr 1fr}.tl-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.tl-kpi{padding:9px;border:1px solid rgba(255,255,255,.14);border-radius:12px;text-align:center}.tl-kpi b{display:block;font-size:1.25rem}.tl-line{display:grid;grid-template-columns:minmax(130px,.38fr) 1fr;gap:10px;padding:9px 0;border-top:1px solid rgba(255,255,255,.08)}.tl-good{border-color:#55c985!important}.tl-bad{border-color:#ee7474!important}.tl-warn{border-color:#dfb54d!important}.tl-selected{outline:3px solid currentColor;transform:translateY(-1px)}.tl-done{opacity:.38}.tl-pairbox{display:grid;grid-template-columns:1fr 1.35fr;gap:10px}.tl-paircol{display:grid;gap:8px;align-content:start}.tl-pair{min-height:58px;text-align:left}.tl-bins{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));margin:12px 0}.tl-bin{min-height:70px;border:2px dashed rgba(255,255,255,.22);border-radius:12px;padding:10px;text-align:center}.tl-bin.tl-selected{border-style:solid}.tl-cardbig{font-size:1.1rem;padding:16px;min-height:70px;width:100%;text-align:center}.tl-order{display:grid;gap:8px}.tl-order-row{display:grid;grid-template-columns:auto 1fr auto auto;gap:8px;align-items:center}.tl-order-row button{padding:8px 10px}.tl-mini{font-size:.86rem;opacity:.8}.tl-score{text-align:center;font-size:1.1rem;margin:10px 0}.tl-copy{width:100%;box-sizing:border-box;margin:10px 0;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.18);color:inherit;font:inherit}@media(max-width:600px){.tl-grid.two,.tl-line{grid-template-columns:1fr}.tl-pairbox{grid-template-columns:1fr}.tl-order-row{grid-template-columns:auto 1fr auto auto}}';
 document.head.appendChild(e)
}
function shell(x){
 css();
 document.getElementById('app').innerHTML='<header class="row"><div><span class="kicker">ITIL 4 · TERMS LAB</span><b>Tap, match, sort</b></div><button id="tl-back">Back</button></header>'+x;
 document.getElementById('tl-back').onclick=()=>location.reload();window.scrollTo(0,0)
}
function inject(){
 if(document.getElementById('terms-lab-card'))return;
 const full=[...document.querySelectorAll('#app .card')].find(x=>x.querySelector('details'));if(!full)return;
 const p=kpi(),e=document.createElement('section');e.className='card';e.id='terms-lab-card';
 e.innerHTML='<span class="kicker">EXAM TERMS LAB</span><h2>Learn by tapping, matching and sorting</h2><p>No free-text answers. Short pieces, close concepts, weak spots repeat automatically.</p><div class="tl-kpis"><div class="tl-kpi"><b>'+p.seen+'/'+C.length+'</b><span>seen</span></div><div class="tl-kpi"><b>'+p.avg+'%</b><span>mastery</span></div><div class="tl-kpi"><b>'+p.due+'</b><span>due</span></div></div><button class="primary full" id="tl-open">Open Exam Terms Lab</button>';
 full.parentNode.insertBefore(e,full);e.querySelector('#tl-open').onclick=home
}
function home(){
 const p=kpi(),w=weak(5);
 shell('<section class="card"><h1 class="screen-title">Less typing. More doing.</h1><p class="muted">Tap two things that belong together, sort clues into the right term, or put steps in order.</p><div class="tl-kpis"><div class="tl-kpi"><b>'+p.seen+'/'+C.length+'</b><span>seen</span></div><div class="tl-kpi"><b>'+p.avg+'%</b><span>mastery</span></div><div class="tl-kpi"><b>'+p.due+'</b><span>due</span></div></div></section><section class="card"><div class="tl-grid two"><button class="primary" id="pairs">1 · Match pairs</button><button id="sort">2 · Sort close terms</button><button id="order">3 · Put steps in order</button><button id="contrast">4 · Exam close-call</button><button id="copy">Optional · Copy a term</button><button id="map">Cheat sheet</button></div><p class="small section-gap">Recommended: Match pairs → Sort close terms → Exam close-call. Full mock only after a couple of these short rounds.</p></section><section class="card"><span class="kicker">WEAKEST / LEAST SEEN</span>'+w.map(c=>'<div class="tl-line"><b>'+esc(c.term)+'</b><span>'+esc(c.mem)+'</span></div>').join('')+'</section>');
 document.getElementById('pairs').onclick=pairGame;document.getElementById('sort').onclick=sortGame;document.getElementById('order').onclick=orderGame;document.getElementById('contrast').onclick=contrast;document.getElementById('copy').onclick=copyGame;document.getElementById('map').onclick=map
}
function choosePairCards(){
 const selected=[];for(const c of weak(20)){if(selected.length>=4)break;if(!selected.some(x=>x.mem===c.mem))selected.push(c)}
 while(selected.length<4){const c=C[Math.floor(Math.random()*C.length)];if(!selected.includes(c))selected.push(c)}
 return selected
}
function pairGame(){
 const cards=choosePairCards(),termCards=mix(cards),defs=mix(cards);
 shell('<section class="card"><span class="kicker">MATCH PAIRS · TAP OR DRAG</span><h1 class="screen-title">Which meaning belongs to which term?</h1><p class="small">Tap a term, then tap the definition that belongs to it. The definition does not contain the answer. On desktop you can also drag.</p><div class="tl-score" id="pair-score">0 / 4 matched</div><div class="tl-pairbox"><div class="tl-paircol">'+termCards.map(c=>'<button class="tl-pair" draggable="true" data-term="'+esc(c.id)+'"><b>'+esc(c.term)+'</b></button>').join('')+'</div><div class="tl-paircol">'+defs.map(c=>'<button class="tl-pair" data-def="'+esc(c.id)+'">'+esc(c.cue)+'</button>').join('')+'</div></div><div id="pair-fb"></div></section>');
 let chosen=null,done=new Set(),right=0;
 const terms=[...document.querySelectorAll('[data-term]')],defsEls=[...document.querySelectorAll('[data-def]')];
 function selectTerm(b){if(done.has(b.dataset.term))return;terms.forEach(x=>x.classList.remove('tl-selected'));chosen=b.dataset.term;b.classList.add('tl-selected')}
 function tryPair(def){
  if(!chosen||done.has(def.dataset.def))return;
  const termEl=document.querySelector('[data-term="'+chosen+'"]'),ok=chosen===def.dataset.def,c=C.find(x=>x.id===chosen);
  if(ok){done.add(chosen);right++;termEl.classList.remove('tl-selected');termEl.classList.add('tl-good','tl-done');def.classList.add('tl-good','tl-done');termEl.disabled=true;def.disabled=true;mark(chosen,'g');chosen=null;document.getElementById('pair-score').textContent=right+' / 4 matched';if(right===4)document.getElementById('pair-fb').innerHTML='<section class="feedback"><h2>✓ Round complete</h2><button class="primary full" id="pair-next">Next matching round</button><button class="full" id="pair-sort">Now sort close terms</button></section>',document.getElementById('pair-next').onclick=pairGame,document.getElementById('pair-sort').onclick=sortGame}
  else{termEl.classList.add('tl-bad');def.classList.add('tl-bad');if(c)mark(c.id,'b');setTimeout(()=>{termEl.classList.remove('tl-bad');def.classList.remove('tl-bad')},550)}
 }
 terms.forEach(b=>{b.onclick=()=>selectTerm(b);b.ondragstart=e=>{chosen=b.dataset.term;e.dataTransfer.setData('text/plain',chosen);selectTerm(b)}});
 defsEls.forEach(b=>{b.onclick=()=>tryPair(b);b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();chosen=e.dataTransfer.getData('text/plain')||chosen;tryPair(b)}})
}
function sortGame(){
 const set=SORTS[Math.floor(Math.random()*SORTS.length)],cards=mix(set.cards).slice(0,6),queue=[...cards];let score=0;
 shell('<section class="card"><span class="kicker">SORT CLOSE TERMS</span><h1 class="screen-title">'+esc(set.name)+'</h1><p class="small">Tap a clue, then tap the bucket it belongs in. You can also drag the clue on desktop.</p><div class="tl-bins">'+set.bins.map(b=>'<button class="tl-bin" data-bin="'+esc(b)+'"><b>'+esc(b)+'</b></button>').join('')+'</div><div id="sort-card"></div><div class="tl-score" id="sort-score">0 / '+cards.length+' correct</div><div id="sort-fb"></div></section>');
 let current=null;
 function show(){if(!queue.length){document.getElementById('sort-card').innerHTML='';document.getElementById('sort-fb').innerHTML='<section class="feedback"><h2>✓ Sorted</h2><button class="primary full" id="sort-next">Another sort</button><button class="full" id="sort-exam">Exam close-call</button></section>';document.getElementById('sort-next').onclick=sortGame;document.getElementById('sort-exam').onclick=contrast;return}current=queue[0];document.getElementById('sort-card').innerHTML='<button class="tl-cardbig" draggable="true" id="clue">'+esc(current[0])+'</button>';const clue=document.getElementById('clue');clue.ondragstart=e=>e.dataTransfer.setData('text/plain',current[1])}
 function choose(bin,el){if(!current)return;const ok=bin===current[1];if(ok){score++;const cc=byTerm.get(current[1]);if(cc)mark(cc.id,'g');el.classList.add('tl-good');queue.shift();document.getElementById('sort-score').textContent=score+' / '+cards.length+' correct';setTimeout(()=>{el.classList.remove('tl-good');show()},280)}else{const cc=byTerm.get(current[1]);if(cc)mark(cc.id,'b');el.classList.add('tl-bad');setTimeout(()=>el.classList.remove('tl-bad'),500)}}
 document.querySelectorAll('[data-bin]').forEach(b=>{b.onclick=()=>choose(b.dataset.bin,b);b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();choose(b.dataset.bin,b)}});show()
}
function orderGame(){
 let a=mix(ORDER[0]);
 function render(){
  shell('<section class="card"><span class="kicker">PUT IN ORDER</span><h1 class="screen-title">Continual improvement model</h1><p class="small">Use ↑ and ↓. No typing.</p><div class="tl-order">'+a.map((x,i)=>'<div class="tl-order-row"><b>'+(i+1)+'</b><span>'+esc(x)+'</span><button data-up="'+i+'" '+(i===0?'disabled':'')+'>↑</button><button data-down="'+i+'" '+(i===a.length-1?'disabled':'')+'>↓</button></div>').join('')+'</div><button class="primary full section-gap" id="order-check">Check order</button><div id="order-fb"></div></section>');
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;[a[i-1],a[i]]=[a[i],a[i-1]];render()});
  document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{const i=+b.dataset.down;[a[i+1],a[i]]=[a[i],a[i+1]];render()});
  document.getElementById('order-check').onclick=()=>{const ok=a.every((x,i)=>x===ORDER[0][i]);if(ok){ORDER[0].forEach(t=>{const c=byTerm.get(t);if(c)mark(c.id,'g')});document.getElementById('order-fb').innerHTML='<section class="feedback"><h2>✓ Correct order</h2><button class="primary full" id="order-again">Shuffle again</button></section>';document.getElementById('order-again').onclick=orderGame}else{document.getElementById('order-fb').innerHTML='<section class="feedback bad"><h2>Not yet</h2><p>Move the steps again. Tip: first vision, then baseline, then target.</p></section>'}}
 }render()
}
function pickQ(){return Q.map(q=>{const c=byTerm.get(q.answer),s=S.q[q.id]||{seen:0,wrong:0};return {q,w:(s.wrong+1)*3+(c?(1-mastery(c))*4:1)+1/(s.seen+1)+Math.random()}}).sort((a,b)=>b.w-a.w)[Math.floor(Math.random()*8)].q}
function contrast(){
 const q=pickQ(),opts=mix(q.options);
 shell('<section class="card"><span class="kicker">EXAM CLOSE-CALL</span><h1 class="question screen-title">'+esc(q.text)+'</h1><div class="options">'+opts.map((o,i)=>'<button class="option" data-o="'+esc(o)+'"><span class="letter">'+'ABCD'[i]+'</span><span>'+esc(o)+'</span></button>').join('')+'</div><div id="fb"></div></section>');
 document.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-o]').forEach(x=>x.disabled=true);const right=b.dataset.o===q.answer,s=S.q[q.id]||(S.q[q.id]={seen:0,wrong:0});s.seen++;if(!right)s.wrong++;save();const cc=byTerm.get(q.answer);if(cc)mark(cc.id,right?'g':'b');b.classList.add(right?'tl-good':'tl-bad');document.querySelectorAll('[data-o]').forEach(x=>{if(x.dataset.o===q.answer)x.classList.add('tl-good')});document.getElementById('fb').innerHTML='<section class="feedback '+(right?'':'bad')+'"><h2>'+(right?'✓ Correct':'✕ Not quite')+'</h2><p><b>'+esc(q.answer)+'</b> — '+esc(q.why)+'</p>'+(cc?'<div class="tip">'+esc(cc.mem)+'</div>':'')+'<button class="primary full" id="next">Next close-call</button><button class="full" id="to-pair">Back to matching</button></section>';document.getElementById('next').onclick=contrast;document.getElementById('to-pair').onclick=pairGame})
}
function copyGame(){
 const c=weak(10)[Math.floor(Math.random()*4)]||C[0];
 shell('<section class="card"><span class="kicker">OPTIONAL · COPY ONCE</span><h1 class="screen-title">'+esc(c.term)+'</h1><p class="tl-mini">If copying helps the spelling stick, type exactly what you see. This is optional and not the main learning mode.</p><input id="copy-input" class="tl-copy" autocomplete="off" spellcheck="false" placeholder="'+esc(c.term)+'"><button class="primary full" id="copy-check">Check</button><div id="copy-fb"></div></section>');
 const i=document.getElementById('copy-input');i.focus();document.getElementById('copy-check').onclick=()=>{const ok=i.value.trim().toLowerCase()===c.term.toLowerCase();document.getElementById('copy-fb').innerHTML='<section class="feedback '+(ok?'':'bad')+'"><h2>'+(ok?'✓ Exact':'Almost')+'</h2><p>'+esc(c.mem)+'</p><button class="primary full" id="copy-next">Next</button></section>';if(ok)mark(c.id,'g');document.getElementById('copy-next').onclick=copyGame}
}
function map(){
 const G=[...new Set(C.map(c=>c.g))];
 shell('<section class="card"><span class="kicker">CHEAT SHEET</span><h1 class="screen-title">Short memory lines</h1><p class="small">Only use this when you are stuck. Training should mostly be matching and sorting.</p></section>'+G.map(g=>'<section class="card"><h2>'+esc(g)+'</h2>'+C.filter(c=>c.g===g).map(c=>'<div class="tl-line"><b>'+esc(c.term)+'</b><span>'+esc(c.mem)+'</span></div>').join('')+'</section>').join('')+'<section class="card"><button class="primary full" id="train">Start matching</button></section>');document.getElementById('train').onclick=pairGame
}
css();inject();new MutationObserver(inject).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();