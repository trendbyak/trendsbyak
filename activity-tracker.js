(function(){
'use strict';
if(window.__TAK_ACTIVITY_TRACKER__) return;
window.__TAK_ACTIVITY_TRACKER__=true;
const SUPABASE_URL='https://ltxrycmreumoqfpcbwnb.supabase.co';
const SUPABASE_KEY='sb_publishable_wdc4ImKB1f0Q-v4Po9DOwA_xIpPXHkh';
if(!window.supabase)return;
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const KEY='tak_activity_session',VIS='tak_activity_visitor',now=()=>new Date().toISOString();
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const makeId=()=>window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
let session=read(KEY,null);
if(!session||!session.id||Date.now()-new Date(session.started_at).getTime()>30*60000){session={id:makeId(),started_at:now()};write(KEY,session)}
let visitor=localStorage.getItem(VIS);if(!visitor){visitor=makeId();try{localStorage.setItem(VIS,visitor)}catch{}}
let customerId=null,customerProfile=null,lastPage=location.href;
const device=()=>innerWidth<768?'mobile':innerWidth<1024?'tablet':'desktop';
const source=()=>{try{const u=new URL(location.href),p=u.searchParams;if(p.get('utm_source'))return p.get('utm_source');if(document.referrer)return new URL(document.referrer).hostname||'direct';return 'direct'}catch{return 'direct'}};
async function identify(data){if(!data)return null;const clean={full_name:data.name||data.full_name||null,email:data.email||null,phone:data.phone||data.mobile||null,whatsapp_phone:data.whatsapp_phone||data.phone||data.mobile||null,last_seen_at:now(),updated_at:now()};if(!clean.email&&!clean.phone)return null;let q=db.from('customers').select('*').limit(1);q=clean.email?q.eq('email',clean.email):q.eq('phone',clean.phone);const r=await q.maybeSingle();if(r.data){customerId=r.data.id;customerProfile={...r.data,...clean};await db.from('customers').update(clean).eq('id',customerId)}else{const n=await db.from('customers').insert(clean).select('*').single();if(!n.error){customerId=n.data.id;customerProfile=n.data}}return customerId}
async function event(name,extra){const u=new URL(location.href);const payload={event_name:name,session_id:session.id,visitor_id:visitor,page_url:location.href,page_path:location.pathname,referrer:document.referrer||null,source:source(),medium:u.searchParams.get('utm_medium'),campaign:u.searchParams.get('utm_campaign'),device_type:device(),user_agent:navigator.userAgent,customer_id:customerId,metadata:extra||{},created_at:now()};try{await db.from('analytics_events').insert(payload)}catch(e){console.debug('activity event',e)}}
async function syncCart(){const cart=read('trendsbyak_cart',[]);if(!Array.isArray(cart)||!cart.length)return;const subtotal=cart.reduce((s,x)=>s+Number(x.price||0)*Number(x.quantity||0),0);const items=cart.map(x=>({product_id:x.product_id||x.id||null,variant_id:x.variant_id||null,name:x.name||x.product_name||'Item',variant_size:x.variant_size||x.size||null,variant_color:x.variant_color||x.color||null,quantity:Number(x.quantity||1),price:Number(x.price||0)}));let profile=customerProfile||{};if(!profile.phone&&!profile.email){const saved=read('tak_customer',null);if(saved)profile=saved}const row={session_id:session.id,customer_id:customerId,customer_name:profile.full_name||profile.name||null,customer_email:profile.email||null,customer_phone:profile.phone||profile.whatsapp_phone||null,items,subtotal,checkout_started:/checkout\.html$/i.test(location.pathname),recovery_status:'abandoned',last_activity_at:now(),updated_at:now()};try{await db.from('abandoned_carts').upsert(row,{onConflict:'session_id'})}catch(e){console.debug('cart sync',e)}}
async function heartbeat(){const page=document.title||location.pathname;let productId=null;const m=new URL(location.href).searchParams.get('id');if(m&&/product\.html$/i.test(location.pathname)&&/^\d+$/.test(m))productId=Number(m);const row={visitor_id:visitor,session_id:session.id,customer_id:customerId,page,page_url:location.href,last_seen:now(),started_at:session.started_at,product_id:productId,device_type:device(),source:source()};try{await db.from('live_visitors').upsert(row,{onConflict:'visitor_id'})}catch(e){}if(lastPage!==location.href){await event('page_view',{title:document.title});lastPage=location.href}else{await event('page_heartbeat',{title:document.title})}await syncCart()}
window.TAKTracker={event,identify,heartbeat};
window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')event('page_hidden')});
window.addEventListener('pagehide',()=>event('page_leave'));
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;if(/add.*cart|cart/i.test((b.textContent||'')+' '+(b.className||'')))event('add_to_cart_click')});
document.addEventListener('submit',e=>{const f=e.target;if(!f||!f.querySelector)return;const val=n=>f.querySelector(`[name="${n}"],#${n}`)?.value?.trim();const data={name:val('name')||val('customer_name')||val('full_name'),email:val('email')||val('customer_email'),phone:val('phone')||val('customer_phone')||val('mobile')};if(data.name||data.email||data.phone){customerProfile={full_name:data.name||null,email:data.email||null,phone:data.phone||null};write('tak_customer',customerProfile);identify(data).then(()=>event('customer_identified'))}event('form_submit',{form_id:f.id||null})});
heartbeat();setInterval(heartbeat,30000);
})();
