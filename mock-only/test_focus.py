import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
URL=sys.argv[1]
OUT=Path(os.environ.get('REPORT_DIR','test-results'));OUT.mkdir(parents=True,exist_ok=True)
reports=[]
with sync_playwright() as p:
 for engine in os.environ.get('TEST_ENGINES','chromium').split(','):
  args={'headless':True}
  if engine=='chromium':args.update(executable_path=os.environ.get('CHROME_BIN','/usr/bin/google-chrome'),args=['--no-sandbox'])
  browser=getattr(p,engine).launch(**args)
  ctx=browser.new_context(viewport={'width':430,'height':932},is_mobile=True,has_touch=True,reduced_motion='reduce')
  page=ctx.new_page();errors=[];failed=[];checks=[];page.set_default_timeout(10000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('response',lambda r:failed.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
  page.on('dialog',lambda d:d.accept())
  r={'url':URL,'engine':engine,'viewport':'430x932','checks':checks,'errors':errors,'failedResponses':failed}
  def act(a):return page.locator('[data-act="'+a+'"]')
  def setup(n,topic='all'):
   if not page.locator('#count').count():
    if act('home').count():act('home').first.click()
   page.locator('#count').fill(str(n));page.locator('#topic').select_option(topic)
   page.get_by_role('button',name='Start focus block',exact=True).click()
  try:
   page.goto(URL,wait_until='networkidle',timeout=90000)
   if 'External Content Notice' in page.title():
    page.get_by_role('button',name='Open the page',exact=True).click()
   page.wait_for_function('window.ITILFocus && window.FocusHelp',timeout=60000)
   assert page.evaluate('ITILFocus.questionCount')==157
   assert page.locator('#count').input_value()=='3'
   r['version']=page.evaluate('ITILFocus.version')
   checks.append('157 existing contrast questions loaded; default focus length is three')
   assert page.evaluate('''()=>{const bank=new Map(MOCK_DATA.questions.map(q=>[q.id,q]));for(let i=0;i<200;i++){const ids=ITILFocus.paper();if(ids.length!==40||new Set(ids).size!==40)throw Error('Duplicate paper');let counts={};for(const id of ids){const c=bank.get(id).criterion;counts[c]=(counts[c]||0)+1}for(const [c,n]of Object.entries(ITILFocus.blueprint))if(counts[c]!==n)throw Error('Blueprint mismatch')};for(const n of [1,3,5,7,10,20,40]){const ids=ITILFocus.focus(n,'all');if(ids.length!==n||new Set(ids).size!==n)throw Error('Wrong block length')};for(const q of bank.values()){const s=FocusHelp.strategy(q),g=FocusHelp.guide(q);if(s.steps.length!==3||!q.why||!q.whyNl||!g.example||!g.distinction)throw Error('Missing help')};return true}''')
   checks.append('200 complete papers validated; custom 1/3/5/7/10/20/40 blocks unique; English/NL help available for every question')
   for invalid in ('0','41','2.5'):
    page.locator('#count').fill(invalid)
    assert not page.locator('#count').evaluate('(e)=>e.checkValidity()')
   page.locator('#count').fill('40');page.locator('#topic').select_option('4')
   page.get_by_role('button',name='Start focus block',exact=True).click()
   expect(page.locator('#form-error')).to_be_visible()
   setup(3)
   assert page.locator('.option').count()==4
   assert page.locator('#timer').count()==0 and page.locator('#feedback').count()==0
   expect(act('check')).to_be_disabled()
   first_question=page.locator('.question').inner_text()
   page.locator('[data-choice="1"]').click();act('check').click()
   expect(page.locator('#feedback')).to_be_visible()
   expect(page.locator('#why-en')).to_have_attribute('lang','en')
   assert len(page.locator('#why-en').inner_text())>50
   assert page.locator('#feedback .wrong').count()>=1
   page.get_by_text('Nederlandse uitleg',exact=True).click()
   assert page.locator('#feedback p[lang="nl"]').is_visible()
   page.get_by_text('How to read this type of question',exact=True).click()
   assert page.locator('#feedback ol li').count()==3
   page.get_by_text('More help: the distinction + an example',exact=True).click()
   page.screenshot(path=str(OUT/(engine+'-explanation.png')),full_page=True)
   checks.append('Focus is untimed; no spoilers before checking; wrong/correct colours, English explanations, expanded tips and optional Dutch help')
   act('next-focus').first.click();second_question=page.locator('.question').inner_text()
   act('home').click();act('resume').click()
   assert page.locator('.question').inner_text()==second_question
   page.locator('[data-choice="0"]').click();act('check').click();act('next-focus').first.click()
   third_question=page.locator('.question').inner_text()
   act('unknown').click();act('next-focus').first.click()
   expect(page.locator('.score')).to_have_text('1 / 3')
   expect(page.get_by_role('heading',name='That is enough for one block.',exact=True)).to_be_visible()
   act('review-wrong').click();assert page.locator('#feedback').count()==1
   act('review-next').click();act('review-next').click()
   act('next-block').click()
   assert page.locator('.question').inner_text() not in [first_question,second_question,third_question]
   checks.append('Completed three-question block, paused/resumed in same tab, reviewed errors, next block prioritises unseen questions')
   setup(7,'practices')
   for i in range(7):
    page.locator('[data-choice="0"]').click();act('check').click();act('next-focus').first.click()
   expect(page.locator('.score')).to_have_text('7 / 7')
   checks.append('Custom seven-question practices-only block completes at exactly seven with no pass/fail claim')
   act('home').click()
   page.get_by_text('Full mock · 40 questions / 60 minutes',exact=True).click();act('start-exam').click()
   assert page.locator('#timer').count()==1 and page.locator('#feedback').count()==0
   assert page.locator('text=Remember').count()==0
   assert act('check').count()==0 and act('unknown').count()==0
   page.locator('[data-choice="1"]').click();act('flag').click();act('next-exam').click()
   page.locator('[data-choice="0"]').click();act('prev').click()
   expect(page.locator('[data-choice="1"]')).to_have_attribute('aria-pressed','true')
   expect(act('flag')).to_have_attribute('aria-pressed','true')
   act('clear').click();page.locator('[data-choice="0"]').click()
   act('submit').click()
   expect(page.locator('.score')).to_have_text('2 / 40')
   page.get_by_text('Results by topic',exact=True).click()
   assert page.locator('.topic').count()==7
   act('review-all').click();assert page.locator('#why-en').count()==1
   checks.append('Full mock: 40 questions, 60-minute deadline, no early help, change/clear/flag/navigation, unanswered score zero and seven-topic result')
   act('results').click();act('home').click()
   page.get_by_text('Full mock · 40 questions / 60 minutes',exact=True).click();act('start-exam').click()
   page.locator('[data-choice="0"]').click()
   page.evaluate('Date.now = ()=>'+str(int(time.time()*1000)+3700000))
   expect(page.locator('.score')).to_have_text('1 / 40',timeout=6000)
   expect(page.get_by_text('Time expired.',exact=False)).to_be_visible()
   checks.append('Timer catches elapsed wall-clock time and automatically submits selected/unanswered answers correctly')
   act('home').click()
   for w in (375,430):
    page.set_viewport_size({'width':w,'height':932});assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
   page.screenshot(path=str(OUT/(engine+'-home.png')),full_page=True)
   assert not errors,errors
   assert not failed,failed
   checks.append('No horizontal overflow at 375/430px; no uncaught JavaScript or missing-resource errors')
   r['passed']=True
  except Exception as e:
   r['passed']=False;r['failure']=str(e);page.screenshot(path=str(OUT/(engine+'-failure.png')),full_page=True)
  finally:
   reports.append(r);browser.close()
(OUT/'focus-report.json').write_text(json.dumps(reports,indent=2,ensure_ascii=False))
print(json.dumps(reports,indent=2,ensure_ascii=False))
sys.exit(0 if all(x.get('passed') for x in reports) else 1)
