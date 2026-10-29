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
    assert.equal(await page.locator('nav.bar').count(),0,'fixed action bar should be absent on review landing');
    await stars.nth(scenario.rating-1).check({force:true});
    assert.equal(await page.locator('.review-rating-label').innerText(),scenario.rating+'/5 · '+['','Da migliorare','Non del tutto soddisfatta','Discreta','Molto positiva','Fantastica!'][scenario.rating]);
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),1,'Google must remain accessible at every rating');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
    assert.equal(overflow,false,'no horizontal viewport overflow');
    await page.getByRole('button',{name:'Invia feedback privato'}).click();
    await page.getByRole('heading',{name:/Grazie per il tuo feedback/}).waitFor({timeout:10000});
    assert.equal(feedback.length,1);
    assert.equal(feedback[0].rating,scenario.rating);
    assert.equal(feedback[0].token,token);
    assert.equal(await page.getByRole('heading',{name:/Grazie per il tuo feedback/}).count(),1);
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),1);
    await context.close();
    console.log('PASS '+scenario.name);
  }
} finally {await browser.close();}
