import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';

const token='a'.repeat(64);
const base=process.env.REVIEW_E2E_BASE||'http://127.0.0.1:4321';
const scenarios=[
  {name:'iPhone narrow',device:devices['iPhone 13'],rating:1,threshold:3},
  {name:'Android mobile',device:devices['Pixel 7'],rating:3,threshold:3},
  {name:'desktop',device:{viewport:{width:1280,height:900}},rating:5,threshold:4},
];
const browser=await chromium.launch({headless:true});
try {
  for(const scenario of scenarios){
    const context=await browser.newContext(scenario.device);
    const page=await context.newPage();
    const feedback=[];
    await page.route('**/api/jenny/public/reviews/landing',route=>route.fulfill({
      status:200,contentType:'application/json',
      headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({feedback_submitted:false,highlight_threshold:scenario.threshold})
    }));
    await page.route('**/api/jenny/public/reviews/feedback',async route=>{
      const payload=route.request().postDataJSON();
      feedback.push(payload);
      await route.fulfill({status:200,contentType:'application/json',
        headers:{'access-control-allow-origin':'*'},body:'{"ok":true}'});
    });
    await page.goto(base+'/recensione/#'+token,{waitUntil:'domcontentloaded'});
    const stars=page.locator('input[name="rating"]');
    await stars.first().waitFor({state:'attached',timeout:10000});
    assert.equal(await stars.count(),5,scenario.name);
    const boxes = await page.locator('.review-star').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width };
    }));
    assert.ok(boxes.every(box => Math.abs(box.y - boxes[0].y) < 2), 'all five stars must share one horizontal row');
    assert.ok(boxes.every((box, index) => index === 0 || box.x >= boxes[index - 1].x + boxes[index - 1].width - 1), 'stars must not overlap');
    assert.equal(await page.locator('nav.bar').count(),0,'fixed action bar should be absent on review landing');
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),0,'initial step only shows stars');
    assert.equal(await page.getByRole('button',{name:'Invia feedback privato'}).count(),0,'private form absent initially');
    await stars.nth(scenario.rating-1).check({force:true});
    assert.equal(await page.locator('.review-rating-label').innerText(),scenario.rating+'/5 · '+['','Da migliorare','Non del tutto soddisfatta','Discreta','Molto positiva','Fantastica!'][scenario.rating]);
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),0,'save private feedback before offering Google');
    assert.equal(await page.getByRole('button',{name:'Invia feedback privato'}).count(),1,'all ratings get a private form');
    await page.locator('textarea').fill('La mia esperienza privata');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
    assert.equal(overflow,false,'no horizontal viewport overflow');
    await page.getByRole('button',{name:'Invia feedback privato'}).click();
    await page.getByRole('heading',{name:/Grazie per il tuo feedback/}).waitFor({timeout:10000});
    assert.equal(feedback.length,1);
    assert.equal(feedback[0].rating,scenario.rating);
    assert.equal(feedback[0].token,token);
    assert.equal(await page.getByRole('heading',{name:/Grazie per il tuo feedback/}).count(),1);
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),scenario.rating === 5 ? 1 : 0);
    assert.equal(feedback[0].text,'La mia esperienza privata');
    await page.route('**/api/jenny/public/reviews/landing',route=>route.fulfill({
      status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({feedback_submitted:true,feedback_rating:scenario.rating})
    }));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('heading',{name:/Grazie per il tuo feedback/}).waitFor();
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),scenario.rating === 5 ? 1 : 0,'saved rating restores completion step');
    assert.equal(await page.locator('textarea').count(),0,'saved feedback cannot be submitted twice');
    await context.close();
    console.log('PASS '+scenario.name);
  }

  for (const scenario of [
    {device:devices['iPhone 13'],rating:1,marketing:false,birth:''},
    {device:devices['Pixel 7'],rating:5,marketing:true,birth:'1990-05-20'}
  ]) {
    const context=await browser.newContext(scenario.device);
    const page=await context.newPage();
    const submissions=[];
    await page.route('**/api/jenny/public/reviews/public',async route=>{
      const body=route.request().postDataJSON();submissions.push(body);
      await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
        body:JSON.stringify({saved:true,token:body.submission_token,feedback_rating:body.rating})});
    });
    await page.route('**/api/jenny/public/reviews/landing',route=>route.fulfill({
      status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({feedback_submitted:true,feedback_rating:scenario.rating})}));
    await page.goto(base+'/lascia-una-recensione/',{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('input[name=marketing_consent]').isChecked(),false,'marketing must default off');
    await page.locator('#continue-review').click();
    assert.equal(await page.locator('#feedback-step').isVisible(),false,'contact fields and privacy must be completed first');
    await page.locator('input[name=first_name]').fill('Giulia');
    await page.locator('input[name=last_name]').fill('Rossi');
    await page.locator('input[name=phone]').fill('3331234567');
    if(scenario.birth) await page.locator('input[name=birth_date]').fill(scenario.birth);
    await page.locator('input[name=privacy_notice]').check();
    if(scenario.marketing) await page.locator('input[name=marketing_consent]').check();
    await page.locator('#continue-review').click();
    await page.locator('#feedback-step').waitFor({state:'visible'});
    const positions=await page.locator('.star').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().y));
    assert.ok(positions.every(y=>Math.abs(y-positions[0])<2),'public stars must be horizontal');
    await page.locator('input[name=rating]').nth(scenario.rating-1).check({force:true});
    await page.locator('textarea[name=text]').fill('Un messaggio privato 💗');
    await page.locator('#submit-review').click();
    await page.getByRole('heading',{name:/Grazie per il tuo feedback/}).waitFor();
    assert.equal(submissions.length,1);
    assert.equal(submissions[0].marketing_consent,scenario.marketing);
    assert.equal(submissions[0].birth_date,scenario.birth);
    assert.equal(submissions[0].rating,scenario.rating);
    assert.equal(submissions[0].privacy_notice,true);
    assert.match(submissions[0].submission_token,/^[a-f0-9]{64}$/);
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),scenario.rating===5?1:0);
    assert.equal(new URL(page.url()).search,'','no personal data in URL');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
    await context.close();
    console.log('PASS public review '+scenario.rating+' stars');
  }
} finally {await browser.close();}
