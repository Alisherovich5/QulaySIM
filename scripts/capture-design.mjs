/** Local design review. Auth, accounts and payment writes are browser fixtures.
 * No customer account is used and no request can create a real order. */
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const cli =
  process.env.PLAYWRIGHT_CLI ||
  resolve(homedir(), '.codex/skills/playwright/scripts/playwright_cli.sh')
const session = '-s=qulaysim-review'
const run = (code) =>
  execFileSync('bash', [cli, session, 'run-code', `async () => { ${code} }`], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
console.log(
  execFileSync('bash', [cli, session, 'open', 'http://127.0.0.1:5187'], { encoding: 'utf8' }),
)
console.log(
  run(`
  const errors = [];
  await page.context().clearCookies();
  await page.evaluate(()=>{localStorage.setItem('fastsim_lang','uz');localStorage.setItem('fastsim_theme','light');localStorage.removeItem('fastsim_cart')});
  page.on('pageerror', error => errors.push(error.message));
  const country = await (await page.request.get('http://127.0.0.1:5187/api/countries/turkey')).json();
  const plans = country.plans;
  const basePlan = plans.find(plan => plan.is_popular) || plans[0];
  let authenticated = false;
  let empty = false;
  const customer = {id: 999, email: 'traveler@example.com', full_name: 'Sayohatchi', created_at:'2026-08-01', has_purchases:true};
  const summary = {full_name: 'Sayohatchi', email: 'traveler@example.com', member_since:'2026-08-01', active_esims:1,total_esims:2,data_used_mb:1200,data_total_mb:10240,countries_connected:2,total_spent:19.50,orders_count:2,avatar_url:null,referral_enabled:true,passport:[{iso2:'TR',name:'Turkiya',esims:1},{iso2:'AE',name:'BAA',esims:1}]};
  const esim = {id: 999,iccid:'8999900000000000000',qr_payload:'DESIGN-PREVIEW-ONLY',qr_image:'/design-fixture/qr.png',status:'active',data_total_mb:10240,data_used_mb:1200,validity_days:30,activated_at:'2026-09-01',expires_at:'2026-09-30',created_at:'2026-09-01',paid_usd:'9.50',paid_uzs:'118750',plan:{...basePlan,title:'Turkiya · 10 GB',data_label:'10 GB'}};
  const order={id:999,status:'paid',subtotal:9.5,discount:0,total:9.5,created_at:'2026-09-01',paid_at:'2026-09-01',esims:[esim]};
  await page.route('**/design-fixture/qr.png', route => route.fulfill({path:'output/design-qr.svg',contentType:'image/svg+xml'}));
  await page.route('**/design-fixture/payment', route => route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="uz"><body style="font:16px system-ui;background:#f5f8f4;color:#153e35;display:grid;place-items:center;min-height:90vh;margin:0"><div style="max-width:310px;text-align:center;padding:30px"><h2>To‘lov provayderi</h2><p>Bu oynada to‘lov provayderining himoyalangan shakli ochiladi.</p><p style="font-size:13px;color:#62706a">Dizayn tekshiruvi uchun namuna. Haqiqiy to‘lov amalga oshirilmaydi.</p></div></body></html>'}));
  await page.route('**/api/**', async route => {
    const path = route.request().url().split('/api')[1].split('?')[0];
    const json = body => route.fulfill({json:body});
    if(path==='/auth/providers') return json({password:true,google:false,min_password_length:8});
    if(path==='/auth/refresh') return authenticated?json({access_token:'design-preview'}):route.fulfill({status:401,json:{}});
    if(path==='/auth/me') return authenticated?json(customer):route.fulfill({status:401,json:{}});
    if(path==='/account/summary') return json(empty?{...summary,active_esims:0,total_esims:0,data_used_mb:0,data_total_mb:0,total_spent:0,countries_connected:0,passport:[]}:summary);
    if(path==='/account/esims') return json(empty?[]:[esim,{...esim,id:998,iccid:'8999900000000000001',status:'pending',data_total_mb:3072,data_used_mb:0,activated_at:null,expires_at:null,plan:{...basePlan,title:'Turkiya · 3 GB'}}]);
    if(path==='/account/orders') return json(empty?[]:[order]);
    if(path==='/account/referrals') return json({code:'SAYOHAT-DEMO',invited:0,completed:0,pending:0,earned_uzs:0,rate:{label:'5%',percent:5,flat_uzs:null},next_rate:null,rewards:[],entries:[]});
    if(path==='/account/testimonial') return json({eligible:true,status:null,rating:null,location:null,text:null});
    if(path==='/checkout/quote') { const payload=route.request().postDataJSON(); const lines=payload.items.map(item=>{const plan=plans.find(p=>p.id===item.plan_id)||basePlan;return{plan_id:plan.id,title:plan.title,quantity:item.quantity,unit_price:plan.price_usd,line_total:plan.price_usd*item.quantity}});const total=lines.reduce((sum,line)=>sum+line.line_total,0);return json({subtotal:total,discount:0,total,promo_applied:false,promo_reason:'invalid',promo_message:null,promo_min_order_usd:null,lines}); }
    if(path==='/checkout') return json({payment_url:'/design-fixture/payment'});
    if(route.request().method()!=='GET') return route.fulfill({status:204,body:''});
    if(path.startsWith('/account/')) return json([]);
    return route.continue();
  });
  const results=[];
  async function capture(route,name,width=1440){
    await page.setViewportSize({width,height:width<768?844:1000});
    await page.goto('http://127.0.0.1:5187'+route);
    await page.waitForLoadState('networkidle');
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('img[loading="lazy"]').evaluateAll(images=>{for(const image of images)image.loading='eager'});
    await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('.reveal')).every(element=>getComputedStyle(element).opacity==='1'&&getComputedStyle(element).visibility==='visible'));
    await page.screenshot({path:'output/playwright/'+name+'.png',fullPage:true});
    results.push({route,width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),broken:await page.locator('img').evaluateAll(images=>images.filter(i=>i.complete&&!i.naturalWidth).length)});
  }
  const pages=[['/','home'],['/data-calculator','calculator'],['/destinations','destinations'],['/destinations/turkey','country'],['/destinations/region/europe','region'],['/global','global'],['/device-check','device'],['/support','support'],['/login','login'],['/register','register'],['/esim-nima','what-is-esim'],['/esim-ornatish','installation'],['/oferta','offer'],['/maxfiylik','privacy'],['/qaytarish','refund'],['/missing-page','404']];
  if (${process.env.DESIGN_PHASE !== 'private'}) for(const [route,name] of pages) for(const [width,kind] of [[1440,'desktop'],[390,'mobile']]) await capture(route,name+'-'+kind,width);
  await page.goto('http://127.0.0.1:5187/destinations/turkey');
  await page.getByRole('button',{name:'Tarifni tanlash',exact:true}).click();
  await page.waitForURL('**/checkout');
  await page.locator('.qs-checkout').waitFor({state:'visible'});
  await capture('/checkout','checkout-desktop');await capture('/checkout','checkout-mobile',390);
  authenticated=true;
  await page.context().addCookies([{name:'qs_session',value:'design-preview',domain:'127.0.0.1',path:'/'}]);
  for(const tab of ['map','esims','orders','settings','referral','review']) for(const [width,kind] of [[1440,'desktop'],[390,'mobile']]) await capture('/account?tab='+tab,'account-'+tab+'-'+kind,width);
  empty=true;await capture('/account?tab=esims','account-empty-mobile',390);empty=false;
  await capture('/checkout','checkout-signed-in-desktop');
  const paymentButton=page.locator('.qs-checkout .btn-primary');
  await paymentButton.click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({path:'output/playwright/payment-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'output/playwright/payment-mobile.png'});
  await page.keyboard.press('Escape');
  await page.context().clearCookies();authenticated=false;
  for(const width of [320,360,768,1024]) { await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:5187/');await page.waitForLoadState('networkidle');results.push({route:'/',width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}); }
  for(const route of ['/ru/','/en/','/ru/destinations','/en/destinations'])await capture(route,route.replaceAll('/','-').slice(1)+'language',390);
  await page.evaluate(()=>{localStorage.setItem('fastsim_lang','uz');localStorage.setItem('fastsim_theme','dark')});
  await capture('/','home-dark-desktop');await capture('/destinations/turkey','country-dark-mobile',390);
  await page.evaluate(()=>localStorage.setItem('fastsim_theme','light'));
  await page.goto('http://127.0.0.1:5187/');
  return {screens:results,errors};
`),
)
