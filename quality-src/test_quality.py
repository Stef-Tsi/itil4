"""Mobile regressions for coherent contrast edition, also run against the public URL."""
import json,os,sys,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=sys.argv[1];out=Path('test-results');out.mkdir(exist_ok=True);reports=[]
with sync_playwright() as p:
 for engine in os.environ.get('TEST_ENGINES','chromium,webkit').split(','):
  kw={'executable_path':os.environ['CHROMIUM_PATH']} if engine=='chromium' and os.environ.get('CHROMIUM_PATH') else {}
  browser=getattr(p,engine).launch(**kw)
  ctx=browser.new_context(viewport={'width':430,'height':932},has_touch=True,is_mobile=True,reduced_motion='reduce')
  page=ctx.new_page();page.set_default_timeout(20000)
  errors=[];failed=[];checks=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
  report={'engine':engine,'url':URL,'viewport':'430x932','checks':checks,'errors':errors,'failedResponses':failed}
  def ready():
   if 'External Content Notice' in page.title():
    report['externalContentNotice']=True;page.get_by_role('button',name='Open the page',exact=True).click()
   page.wait_for_function("window.SQQuality?.version==='coherent-contrast-1' && window.SQ_STRICT_QUESTIONS",timeout=90000)
  def launch():
   page.get_by_role('tab',name='Missions',exact=True).click()
   page.get_by_role('button',name='Start mixed training',exact=True).click()
  def state():return page.evaluate("JSON.parse(localStorage.getItem('service-quest-training-v1'))")
  def complete_matching(root):
   rows=root.locator('[data-slot]').evaluate_all('(els)=>els.map(e=>e.dataset.slot)')
   for row in rows:
    root.locator('[data-token="'+row+'"]').click()
    root.locator('[data-slot="'+row+'"]').click()
   return len(rows)
  try:
   page.goto(URL,wait_until='networkidle',timeout=90000);ready()
   counts=page.evaluate('({all:SQ_ALL_QUESTIONS.length,strict:SQ_STRICT_QUESTIONS.length,groups:SQ_TRAINING_DATA.matchingGroups.length})')
   assert counts=={'all':523,'strict':157,'groups':14},counts
   report.update(counts);checks.append('523 total cards; 157 curated contrast questions; 14 coherent matching families')
   check=page.evaluate("""()=>{
    const problems=[];let generated=0;
    for(const g of SQ_TRAINING_DATA.matchingGroups)for(let i=0;i<100;i++){
     const t=SQQuality.makeMatchingTask(g,i);generated++;
     if(t.rows.length!==Math.min(4,g.members.length)||t.options.length!==Math.min(6,g.members.length))problems.push(g.id+': counts');
     if(t.options.some(id=>!g.members.includes(id))||t.rows.some(id=>!t.options.includes(id)))problems.push(g.id+': foreign choice');
     if(new Set(t.options).size!==t.options.length||new Set(t.rows).size!==t.rows.length)problems.push(g.id+': duplicate');
     if(t.rows.some(id=>!t.statements[id]?.text||!t.statements[id]?.whyNl))problems.push(g.id+': explanation');
    }
    const bp={'1.1':2,'1.2':2,'1.3':1,'2.1':1,'2.2':5,'3.1':2,'4.1':1,'5.1':1,'5.2':1,'6.1':5,'6.2':2,'7.1':17};
    const valid=new Set(SQ_STRICT_QUESTIONS.map(q=>q.id));
    for(let i=0;i<200;i++){
     const exam=SQ_EXAM_SAMPLE(),c={};
     if(exam.length!==40||new Set(exam.map(q=>q.id)).size!==40)problems.push('exam count');
     for(const q of exam){c[q.criterion]=(c[q.criterion]||0)+1;if(!valid.has(q.id)||q.pool!=='contrast')problems.push('warmup in exam')}
     for(const k of Object.keys(bp))if(c[k]!==bp[k])problems.push('exam weight '+k);
    }
    return {problems,generated,examSamples:200};
   }""")
   assert not check['problems'],check
   report['generatedMatchingTasks']=check['generated'];report['examSamples']=check['examSamples']
   checks.append('1400 generated tasks contain only same-family choices; 200 exams have 40 unique curated cards and exact criterion distribution')
   launch();root=page.locator('#sq-training');expect(root).to_be_visible()
   expect(root).to_contain_text('CONTRAST UPDATE')
   root.locator('#sq-mode').select_option('matching')
   root.locator('#sq-family').select_option('service-value')
   root.locator('#sq-count').select_option('10')
   root.get_by_role('button',name='Start mission',exact=True).click()
   rows=root.locator('[data-slot]').evaluate_all('(els)=>els.map(e=>e.dataset.slot)')
   assert len(rows)==4 and root.locator('[data-token]').count()==6
   expect(root.locator('.sq-case')).to_contain_text('pharmacy')
   token=root.locator('[data-token="'+rows[0]+'"]')
   slot=root.locator('[data-slot="'+rows[0]+'"]')
   slot.scroll_into_view_if_needed()
   a=token.bounding_box();b=slot.bounding_box()
   page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down()
   page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=16);page.mouse.up()
   page.wait_for_timeout(500)
   expect(slot).to_have_class(re.compile('sq-filled'))
   assert state()['round']['tasks'][0]['answers'][rows[0]]==rows[0]
   root.locator('[data-token="'+rows[0]+'"]').click()
   root.locator('[data-slot="'+rows[1]+'"]').click()
   assert rows[0] not in state()['round']['tasks'][0]['answers']
   for i,row in enumerate(rows):
    choice=rows[(i+1)%4]
    root.locator('[data-token="'+choice+'"]').click()
    root.locator('[data-slot="'+row+'"]').click()
   root.get_by_role('button',name='Check answer',exact=True).click()
   expect(root.locator('.sq-feedback h3')).to_have_text('0 of 4 connections correct')
   assert root.locator('.sq-feedback-item-wrong').count()==4
   assert root.locator('.sq-feedback .sq-answer-wrong').count()>=4
   assert root.locator('.sq-feedback .sq-answer-correct').count()>=4
   assert root.locator('.sq-bank').count()==0
   expect(root.locator('.sq-feedback')).to_contain_text('Het beslissende verschil')
   page.screenshot(path=str(out/(engine+'-contrast-feedback.png')))
   checks.append('Related pharmacy case: pointer drag, tap, moving a placed term, red/green feedback and specific NL distinctions work')
   root.get_by_role('button',name='Next task',exact=True).click()
   expect(root.locator('.sq-case')).to_contain_text('retailer')
   root.get_by_role('button',name='Pause',exact=True).click()
   page.reload(wait_until='networkidle');ready();launch()
   expect(root.get_by_role('button',name='Resume task 2/10',exact=True)).to_be_visible()
   checks.append('An unfinished coherent mission resumes after reload; earlier XP remains saved')
   page.on('dialog',lambda d:d.accept())
   for family,expected in [('consumer-roles',3),('change-types',3),('four-dimensions',4),('svs-components',5)]:
    root.locator('#sq-mode').select_option('matching')
    root.locator('#sq-family').select_option(family)
    root.get_by_role('button',name='Start mission',exact=True).click()
    assert root.locator('[data-token]').count()==expected
    n=complete_matching(root)
    root.get_by_role('button',name='Check answer',exact=True).click()
    expect(root.locator('.sq-feedback h3')).to_have_text(f'{n} of {n} connections correct')
    root.get_by_role('button',name='Pause',exact=True).click()
   checks.append('3-choice roles/changes, 4 dimensions and 5 SVS components score correctly without unrelated padding')
   root.locator('#sq-family').select_option('auto')
   root.locator('#sq-mode').select_option('mixed')
   root.locator('#sq-count').select_option('20')
   root.get_by_role('button',name='Start mission',exact=True).click()
   tasks=state()['round']['tasks']
   expected=sum(len(t['rows']) if t['type']=='match' else 1 for t in tasks)
   assert len(tasks)==20
   strict_ids=set(page.evaluate('SQ_STRICT_QUESTIONS.map(q=>q.id)'))
   assert all(t['id'] in strict_ids for t in tasks if t['type']=='mcq')
   assert len({t['groupId'] for t in tasks if t['type']=='match'})==7
   for j in range(20):
    if root.locator('[data-token]').count():complete_matching(root)
    else:root.locator('[data-choice="0"]').click()
    root.get_by_role('button',name='Check answer',exact=True).click()
    root.get_by_role('button',name='See results' if j==19 else 'Next task',exact=True).click()
   assert state()['round']['correct']==expected and state()['round']['total']==expected
   checks.append('Completed 20 mixed tasks: seven different coherent families plus 13 curated MCQs, with correct total scoring')
   root.get_by_role('button',name='New mission',exact=True).click()
   root.locator('#sq-mode').select_option('mcq')
   root.get_by_role('button',name='Start mission',exact=True).click()
   assert state()['round']['tasks'][0]['id'] in strict_ids
   root.locator('[data-choice="1"]').click()
   root.get_by_role('button',name='Check answer',exact=True).click()
   expect(root.locator('.sq-feedback')).to_contain_text('Uitleg:')
   root.get_by_role('button',name='Pause',exact=True).click()
   root.locator('#sq-mode').select_option('warmup')
   root.get_by_role('button',name='Start mission',exact=True).click()
   assert all(t['id'] not in strict_ids for t in state()['round']['tasks'])
   root.get_by_role('button',name='Pause',exact=True).click()
   root.get_by_role('button',name='Learn first',exact=True).click()
   expect(root.get_by_role('heading',name='Utility',exact=True)).to_be_visible()
   root.get_by_role('button',name='Try this idea',exact=True).click()
   checks.append('Contrast and warm-up pools are separate; wrong MCQs have Dutch explanation; Learn first still works')
   assert root.evaluate('(e)=>e.scrollWidth<=e.clientWidth+2')
   root.get_by_role('button',name='Close',exact=True).click()
   page.get_by_role('tab',name='Exam arena',exact=True).click()
   report['examButtons']=page.get_by_role('button').all_text_contents()
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+2')
   assert not errors,errors;assert not failed,failed
   checks.append('Original Exam arena remains accessible; no missing assets, page errors or horizontal mobile overflow')
   report['passed']=True
  except Exception as ex:
   report['passed']=False;report['failure']=str(ex)
  finally:
   try:page.screenshot(path=str(out/(engine+'-last.png')),timeout=10000)
   except Exception as shot:report['screenshotWarning']=str(shot)
   reports.append(report);browser.close()
(out/'quality-report.json').write_text(json.dumps(reports,indent=2,ensure_ascii=False))
print(json.dumps(reports,indent=2,ensure_ascii=False))
sys.exit(0 if all(r.get('passed') for r in reports) else 1)
