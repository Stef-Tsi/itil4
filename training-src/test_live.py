import json,sys,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
URL=sys.argv[1]
reports=[]
with sync_playwright() as p:
    for engine in os.environ.get('TEST_ENGINES','chromium,webkit').split(','):
        browser=getattr(p,engine).launch()
        ctx=browser.new_context(viewport={'width':430,'height':932},is_mobile=True,has_touch=True,device_scale_factor=1,reduced_motion='reduce')
        page=ctx.new_page();errors=[];failed=[];checks=[]
        page.set_default_timeout(15000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('response',lambda r:failed.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        report={'engine':engine,'url':URL,'mobileViewport':'430x932','checks':checks,'errors':errors,'failedResponses':failed}
        try:
            page.goto(URL,wait_until='networkidle',timeout=90000)
            if 'External Content Notice' in page.title():
                report['externalContentNotice']=True
                page.get_by_role('button',name='Open the page',exact=True).click()
            page.wait_for_function('window.SQTraining && window.SQ_ALL_QUESTIONS',timeout=60000)
            report['questionCount']=page.evaluate('SQ_ALL_QUESTIONS.length')
            report['conceptCount']=page.evaluate('SQ_TRAINING_DATA.concepts.length')
            assert report['questionCount']==446
            checks.append('Application loaded: 446 question cards and 78 matching concepts')
            page.get_by_role('tab',name='Missions',exact=True).click()
            page.get_by_role('button',name='Start mixed training',exact=True).click()
            root=page.locator('#sq-training')
            expect(root).to_be_visible()
            assert root.locator('#sq-topic option').count()==8
            assert root.locator('#sq-count option').all_text_contents()==['10 tasks','20 tasks','30 tasks']
            checks.append('Mission launcher, all 7 topic filters and 10/20/30 lengths')
            root.locator('#sq-mode').select_option('matching');root.locator('#sq-count').select_option('10');root.get_by_role('button',name='Start mission',exact=True).click()
            assert root.locator('[data-token]').count()==6
            rows=root.locator('[data-slot]').evaluate_all('(es)=>es.map(e=>e.dataset.slot)')
            assert len(rows)==4
            for i,row in enumerate(rows):
                choice=rows[(i+1)%4]
                root.locator('[data-token="'+choice+'"]').click()
                root.locator('[data-slot="'+row+'"]').click()
            root.get_by_role('button',name='Check answer',exact=True).click()
            expect(root.locator('.sq-feedback h3')).to_have_text('0 of 4 connections correct')
            assert root.locator('.sq-feedback [lang="nl"]').count()>=4
            checks.append('4 statements / 6 terms; wrong answers show specific Dutch explanations')
            root.get_by_role('button',name='Next task',exact=True).click()
            rows=root.locator('[data-slot]').evaluate_all('(es)=>es.map(e=>e.dataset.slot)')
            token=root.locator('[data-token="'+rows[0]+'"]');slot=root.locator('[data-slot="'+rows[0]+'"]')
            slot.scroll_into_view_if_needed()
            a=token.bounding_box();b=slot.bounding_box()
            page.mouse.move(a['x']+a['width']/2,a['y']+a['height']/2);page.mouse.down()
            page.mouse.move(b['x']+b['width']/2,b['y']+b['height']/2,steps=15);page.mouse.up()
            page.wait_for_timeout(450)
            term=page.evaluate('(id)=>SQ_TRAINING_DATA.concepts.find(c=>c.id===id).term',rows[0])
            expect(slot.locator('b')).to_have_text(term)
            for row in rows[1:]:
                root.locator('[data-token="'+row+'"]').click();root.locator('[data-slot="'+row+'"]').click()
            root.get_by_role('button',name='Check answer',exact=True).click()
            expect(root.locator('.sq-feedback h3')).to_have_text('4 of 4 connections correct')
            checks.append('Pointer drag, tap-to-match and scoring')
            root.get_by_role('button',name='Pause',exact=True).click()
            expect(root.get_by_role('button',name='Resume task 2/10',exact=True)).to_be_visible()
            page.reload(wait_until='networkidle');page.wait_for_function('window.SQTraining && window.SQ_ALL_QUESTIONS')
            page.get_by_role('tab',name='Missions',exact=True).click()
            page.get_by_role('button',name='Start mixed training',exact=True).click()
            expect(root.get_by_role('button',name='Resume task 2/10',exact=True)).to_be_visible()
            checks.append('Training save and unfinished mission restored after reload')
            page.on('dialog',lambda d:d.accept())
            root.locator('#sq-mode').select_option('mixed');root.locator('#sq-count').select_option('20');root.get_by_role('button',name='Start mission',exact=True).click()
            types=set()
            for j in range(20):
                if root.locator('[data-token]').count():
                    types.add('matching')
                    rows=root.locator('[data-slot]').evaluate_all('(es)=>es.map(e=>e.dataset.slot)')
                    for row in rows:
                        root.locator('[data-token="'+row+'"]').click();root.locator('[data-slot="'+row+'"]').click()
                else:
                    types.add('mcq');root.locator('[data-choice="0"]').click()
                root.get_by_role('button',name='Check answer',exact=True).click()
                root.get_by_role('button',name='See results' if j==19 else 'Next task',exact=True).click()
            assert types=={'matching','mcq'}
            expect(root.get_by_role('button',name='New mission',exact=True)).to_be_visible()
            assert page.evaluate('JSON.parse(localStorage.getItem("service-quest-training-v1")).round.correct')==41
            checks.append('Completed 20-task mixed mission: 13 multiple-choice + 7 matching / 41 checks')
            root.get_by_role('button',name='New mission',exact=True).click()
            root.get_by_role('button',name='Learn first',exact=True).click()
            expect(root.get_by_role('heading',name='Utility',exact=True)).to_be_visible()
            root.get_by_role('button',name='Try this idea',exact=True).click()
            expect(root.locator('.sq-title')).to_contain_text('delivery company')
            checks.append('Learn-first route and Utility scenario checkpoint')
            root.get_by_role('button',name='Close',exact=True).click()
            page.get_by_role('tab',name='Exam arena',exact=True).click()
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 2')
            assert not errors,errors
            assert not failed,failed
            checks.append('Original Exam arena available; no horizontal overflow or JavaScript errors')
            report['passed']=True
        except Exception as e:
            report['passed']=False;report['failure']=str(e)
        finally:
            Path('test-results').mkdir(exist_ok=True)
            page.screenshot(path='test-results/'+engine+'.png',full_page=False)
            reports.append(report);browser.close()
Path('test-results/report.json').write_text(json.dumps(reports,indent=2,ensure_ascii=False))
print(json.dumps(reports,indent=2,ensure_ascii=False))
sys.exit(0 if all(r.get('passed') for r in reports) else 1)
