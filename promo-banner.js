(function(){
  if(!/\/index\.html$|\/$/.test(location.pathname)) return;
  const SUPABASE_URL='https://ltxrycmreumoqfpcbwnb.supabase.co';
  const SUPABASE_KEY='sb_publishable_wdc4ImKB1f0Q-v4Po9DOwA_xIpPXHkh';
  const FALLBACK_IMAGES=[
    'https://fashionalley.co.in/image/cache/catalog/HAIR%20PINS/43ce71db-dc2c-48a7-a973-1d8f1f8524e8-300x300.jpg',
    'https://fashionalley.co.in/image/cache/catalog/WhatsApp%20Image%202026-06-29%20at%203.53.00%20PM%20(2)-300x300.jpeg'
  ];
  const slides=[
    {k:'NEW & NOTEWORTHY',t:'Little luxuries. Made for you.',d:'Fresh jewellery, hair accessories, scrunchies & thoughtful gifts.',b:'Shop New Arrivals',h:'shop.html',a:'NEW',preferred:788},
    {k:'EVERYDAY JEWELLERY',t:'Pieces you’ll actually wear.',d:'Elegant everyday styles with anti-tarnish options for effortless dressing.',b:'Shop Jewellery',h:'shop.html?category=Jewellery',a:'JEWELLERY',preferred:529,match:p=>/jewellery|jewelry|necklace|earring|bracelet|kada|ring/i.test((p.category||'')+' '+(p.name||''))},
    {k:'SCRUNCHIES IN BULK',t:'Need scrunchies in bulk?',d:'Made for return gifts, weddings, birthdays, events, boutiques & gifting.',b:'Enquire for Bulk',h:'bulk-order.html',a:'BULK',preferred:759,match:p=>/scrunch/i.test((p.category||'')+' '+(p.name||''))},
    {k:'THOUGHTFUL GIFTING',t:'A little something, beautifully chosen.',d:'Curated gifting options for celebrations, favours and special moments.',b:'Explore Gifts',h:'shop.html?category=Gifts',a:'GIFTING',preferred:708,match:p=>/gift|hamper|return/i.test((p.category||'')+' '+(p.name||''))},
    {k:'SHOP DIRECT',t:'Beautiful. Useful. Affordable.',d:'Shop directly from Trends by AK and discover pieces selected with care.',b:'Shop Everything',h:'shop.html',a:'AK',preferred:533,match:p=>/jewellery|jewelry|necklace|earring|bracelet|kada|ring|hair|scrunch|gift/i.test((p.category||'')+' '+(p.name||''))}
  ];
  async function getProducts(){
    try{
      const r=await fetch(SUPABASE_URL+'/rest/v1/products?select=id,name,category,image_url,status,created_at&status=eq.active&image_url=not.is.null&order=created_at.desc&limit=40',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
      if(!r.ok) return [];
      const data=await r.json();
      return Array.isArray(data)?data.filter(p=>p.image_url):[];
    }catch(e){return []}
  }
  async function getSettings(){
    try{
      const r=await fetch(SUPABASE_URL+'/rest/v1/homepage_banner_settings?id=eq.1&select=banner_size,rotation_seconds',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
      if(!r.ok)return {banner_size:'standard',rotation_seconds:5};
      const d=await r.json();
      return d[0]||{banner_size:'standard',rotation_seconds:5};
    }catch(e){return {banner_size:'standard',rotation_seconds:5}}
  }
  function init(products,settings){
    if(document.querySelector('.trends-promo-banner')) return;
    const header=document.querySelector('.site-header'); if(!header)return;
    const css=document.createElement('link');css.rel='stylesheet';css.href='promo-banner.css?v=20261001';document.head.appendChild(css);
    const used=new Set();
    slides.forEach(s=>{
      let p=products.find(x=>!used.has(x.id)&&s.match(x));
      if(!p)p=products.find(x=>!used.has(x.id));
      if(p)used.add(p.id);
      s.image=p&&p.image_url?p.image_url:FALLBACK_IMAGES[slides.indexOf(s)%FALLBACK_IMAGES.length];
      s.productId=p&&p.id?p.id:'';
    });
    const wrap=document.createElement('section');wrap.className='trends-promo-banner banner-'+(settings.banner_size||'standard');wrap.setAttribute('aria-label','Trends by AK offers and highlights');
    wrap.innerHTML='<div class="trends-promo-track"></div><button class="trends-promo-arrow trends-promo-prev" type="button" aria-label="Previous banner">‹</button><button class="trends-promo-arrow trends-promo-next" type="button" aria-label="Next banner">›</button><div class="trends-promo-dots"></div><div class="trends-promo-progress"></div>';
    const track=wrap.querySelector('.trends-promo-track'),dots=wrap.querySelector('.trends-promo-dots');
    slides.forEach((s,i)=>{
      const el=document.createElement('article');el.className='trends-promo-slide';
      const img=s.image?'<img class="trends-promo-image" src="'+s.image+'" alt="" loading="'+(i?'lazy':'eager')+'">':'';
      el.innerHTML='<div class="trends-promo-copy"><p class="trends-promo-kicker">'+s.k+'</p><h2 class="trends-promo-title">'+s.t+'</h2><p class="trends-promo-text">'+s.d+'</p><a class="trends-promo-btn" href="'+s.h+'">'+s.b+' →</a></div><div class="trends-promo-art" aria-hidden="true">'+img+'</div>';
      track.appendChild(el);
      const dot=document.createElement('button');dot.className='trends-promo-dot'+(i===0?' is-active':'');dot.type='button';dot.setAttribute('aria-label','Go to banner '+(i+1));dot.addEventListener('click',()=>go(i,true));dots.appendChild(dot);
    });
    header.insertAdjacentElement('afterend',wrap);
    let index=0,timer=null,duration=Math.max(3000,Math.min(15000,Number(settings.rotation_seconds)||5))*1000;
    function render(){track.style.transform='translate3d(-'+(index*100)+'%,0,0)';wrap.querySelectorAll('.trends-promo-dot').forEach((d,i)=>d.classList.toggle('is-active',i===index));const p=wrap.querySelector('.trends-promo-progress');p.style.transition='none';p.style.width='0';requestAnimationFrame(()=>{p.style.transition='width '+duration+'ms linear';p.style.width='100%'})}
    function go(n,manual){index=(n+slides.length)%slides.length;render();if(manual)restart()}
    function restart(){clearInterval(timer);timer=setInterval(()=>go(index+1,false),duration)}
    wrap.querySelector('.trends-promo-prev').addEventListener('click',()=>go(index-1,true));
    wrap.querySelector('.trends-promo-next').addEventListener('click',()=>go(index+1,true));
    wrap.addEventListener('mouseenter',()=>clearInterval(timer));wrap.addEventListener('mouseleave',restart);
    render();restart();
  }
  async function boot(){const [products,settings]=await Promise.all([getProducts(),getSettings()]);init(products,settings)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();