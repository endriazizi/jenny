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
    const fields=await page.locator('.contact-grid input').evaluateAll(elements=>elements.map(el=>{
      const s=getComputedStyle(el);return {height:el.getBoundingClientRect().height,radius:s.borderRadius,border:s.border,padding:s.padding,font:s.fontSize};
    }));
    assert.equal(fields.length,4);
    assert.ok(fields.every(field=>Math.abs(field.height-fields[0].height)<2 && field.height>=44),'contact inputs must have equal usable heights');
    assert.ok(fields.every(field=>field.radius===fields[0].radius && field.border===fields[0].border && field.padding===fields[0].padding && field.font===fields[0].font),'text, telephone and birthday must have matching styles');
    const identity=await page.locator('.footer-identity').evaluate(el=>{
      const photo=el.querySelector('.footer-photo')?.getBoundingClientRect();
      const copy=el.querySelector('.footer-copy').getBoundingClientRect();
      return {sideBySide:!photo || photo.right<=copy.left,within:copy.right<=innerWidth};
    });
    assert.ok(identity.sideBySide && identity.within,'footer text must sit beside the portrait without overflow');
    assert.equal(await page.locator('input[name=marketing_consent]').isChecked(),false,'marketing must default off');
    await page.locator('#continue-review').click();
    assert.equal(await page.locator('#feedback-step').isVisible(),false,'contact fields and privacy must be completed first');
    await page.locator('input[name=first_name]').fill('Giulia');
    await page.locator('input[name=last_name]').fill('Rossi');
    await page.locator('input[name=phone]').fill('3331234567');
    const birthday=page.locator('input[name=birth_date]');
    assert.equal(await birthday.inputValue(),'','birthday starts empty');
    assert.equal(await birthday.getAttribute('inputmode'),'numeric');
    await birthday.fill('31022000');
    await birthday.blur();
    assert.equal(await birthday.evaluate(el=>el.checkValidity()),false,'impossible date must be rejected');
    await birthday.fill('31122999');
    assert.equal(await birthday.evaluate(el=>el.checkValidity()),false,'future date must be rejected');
    await birthday.fill('');
    if(scenario.birth) {
      await birthday.pressSequentially('20091989');
      assert.equal(await birthday.inputValue(),'20/09/1989','separators are inserted automatically');
      await birthday.fill('29/02/2000');
      assert.equal(await birthday.evaluate(el=>el.checkValidity()),true,'leap day is accepted');
      await birthday.fill('');
      await birthday.pressSequentially('20091989');
      await birthday.press('End');
      await birthday.press('Backspace');
      assert.equal(await birthday.inputValue(),'20/09/198','year remains editable');
      await birthday.press('9');
      assert.equal(await birthday.inputValue(),'20/09/1989');
      await birthday.fill(scenario.birth);
      assert.equal(await birthday.inputValue(),'20/05/1990','ISO autofill is converted to Italian display');
    }
    await page.locator('input[name=privacy_notice]').check();
    if(scenario.marketing) await page.locator('input[name=marketing_consent]').check();
    await page.locator('#continue-review').click();
    await page.locator('#feedback-step').waitFor({state:'visible'});
    assert.equal(await page.locator('input[name=rating]:checked').count(),0,'highlight must not preselect a rating');
    const positions=await page.locator('.star').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().y));
    assert.ok(positions.every(y=>Math.abs(y-positions[0])<2),'public stars must be horizontal');
    await page.locator('input[name=rating]').nth(scenario.rating-1).check({force:true});
    assert.equal(await page.locator('input[name=rating]:checked').inputValue(),String(scenario.rating));
    if(scenario.rating===5) {
      const colors=await page.locator('.star').evaluateAll(elements=>elements.map(el=>getComputedStyle(el).backgroundColor));
      assert.notEqual(colors[4],colors[3],'selected fifth star must have a distinct highlight');
    }
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
  for (const googleAvailable of [true, false]) {
    const context=await browser.newContext(devices['iPhone 13']);
    const page=await context.newPage();let saved=false;let writes=0;
    await page.route('**/api/jenny/public/reviews/landing',route=>route.fulfill({
      status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({feedback_submitted:saved,feedback_rating:saved?5:null,google_available:googleAvailable})}));
    await page.route('**/api/jenny/public/reviews/feedback',async route=>{
      writes++;saved=true;await route.abort('failed');
    });
    await page.goto(base+'/recensione/#'+token,{waitUntil:'domcontentloaded'});
    await page.locator('input[name=rating]').nth(4).check({force:true});
    await page.getByRole('button',{name:'Invia feedback privato'}).click();
    await page.getByRole('heading',{name:/Grazie per il tuo feedback/}).waitFor();
    assert.equal(writes,1,'lost response must not cause a duplicate feedback write');
    assert.equal(await page.getByRole('link',{name:/Scrivi una recensione su Google/}).count(),googleAvailable?1:0,'no Google CTA without a valid configured destination');
    await context.close();
    console.log('PASS saved feedback recovery; Google configured='+googleAvailable);
  }
  {
    const context=await browser.newContext(devices['Pixel 7']);const page=await context.newPage();
    await page.route('**/api/jenny/public/reviews/landing',route=>route.fulfill({
      status:404,contentType:'application/json',headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({error:'not_found',message:'Link non disponibile.'})}));
    await page.goto(base+'/recensione/#'+token,{waitUntil:'domcontentloaded'});
    await page.getByText('Link non disponibile.',{exact:true}).waitFor();
    assert.equal(await page.locator('textarea,input[name=rating]').count(),0,'revoked link cannot accept feedback');
    await context.close();console.log('PASS revoked personal link');
  }
  for(const width of [320,393,768,1280]) {
    const context=await browser.newContext({viewport:{width,height:900}});
    const page=await context.newPage();
    await page.route('**/api/jenny/public/catalog',route=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({branding:{hero_url:'/api/jenny/public/media/'+ 'b'.repeat(24)+'.jpg',hero_alt:'Jenny'}})}));
    await page.route('**/api/jenny/public/media/'+ 'b'.repeat(24)+'.jpg',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="600"><rect width="480" height="600" fill="pink"/></svg>'}));
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    const hero=page.locator('.hero-art img[src*="'+ 'b'.repeat(24)+'"]');
    await hero.waitFor();
    const heroStyle=await hero.evaluate(el=>({fit:getComputedStyle(el).objectFit,width:el.getBoundingClientRect().width}));
    assert.equal(heroStyle.fit,'cover','dynamic hero must retain responsive image styles');
    assert.ok(heroStyle.width<=Math.min(width,480),'dynamic portrait must fit its frame');
    const guide=page.locator('#come-prenotare');
    assert.equal(await guide.locator('li').count(),3);
    const layout=await guide.evaluate(el=>{
      const r=el.getBoundingClientRect();return {height:r.height,left:r.left,right:r.right};
    });
    assert.ok(layout.height<520,'three booking steps should remain compact');
    assert.ok(layout.left>=-1 && layout.right<=width+1,'guide must fit viewport');
    const cta=page.locator('.hero .btn-primary');
    const href=await cta.getAttribute('href');
    if(href==='/prenota/') {
      assert.match(await cta.innerText(),/Prenota online/);
      assert.match(await guide.innerText(),/codice ricevuto via email/);
    }
    await context.close();console.log('PASS compact booking guide '+width+'px');
  }
} finally {await browser.close();}

