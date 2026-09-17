(function(){
  if(!/\/index\.html$|\/$/.test(location.pathname)) return;
  function init(){
    if(document.querySelector('.trends-promo-banner')) return;
    var header=document.querySelector('.site-header');
    if(!header) return;
    var css=document.createElement('link');css.rel='stylesheet';css.href='promo-banner.css?v=20260917';document.head.appendChild(css);
    var slides=[
      {k:'NEW & NOTEWORTHY',t:'Little luxuries. Made for you.',d:'Fresh jewellery, hair accessories, scrunchies & thoughtful gifts.',b:'Shop New Arrivals',h:'shop.html',a:'NEW'},
      {k:'EVERYDAY JEWELLERY',t:'Pieces you’ll actually wear.',d:'Elegant everyday styles with anti-tarnish options for effortless dressing.',b:'Shop Jewellery',h:'shop.html?category=Jewellery',a:'JEWELLERY'},
      {k:'SCRUNCHIES IN BULK',t:'Need scrunchies in bulk?',d:'Made for return gifts, weddings, birthdays, events, boutiques & gifting.',b:'Enquire for Bulk',h:'bulk-order.html',a:'BULK'},
      {k:'THOUGHTFUL GIFTING',t:'A little something, beautifully chosen.',d:'Curated gifting options for celebrations, favours and special moments.',b:'Explore Gifts',h:'shop.html?category=Gifts',a:'GIFTING'},
      {k:'SHOP DIRECT',t:'Beautiful. Useful. Affordable.',d:'Shop directly from Trends by AK and discover pieces selected with care.',b:'Shop Everything',h:'shop.html',a:'AK'}
    ];
    var wrap=document.createElement('section');wrap.className='trends-promo-banner';wrap.setAttribute('aria-label','Trends by AK offers and highlights');
    wrap.innerHTML='<div class="trends-promo-track"></div><button class="trends-promo-arrow trends-promo-prev" type="button" aria-label="Previous banner">‹</button><button class="trends-promo-arrow trends-promo-next" type="button" aria-label="Next banner">›</button><div class="trends-promo-dots"></div><div class="trends-promo-progress"></div>';
    var track=wrap.querySelector('.trends-promo-track'),dots=wrap.querySelector('.trends-promo-dots');
    slides.forEach(function(s,i){
      var el=document.createElement('article');el.className='trends-promo-slide';
      el.innerHTML='<div class="trends-promo-copy"><p class="trends-promo-kicker">'+s.k+'</p><h2 class="trends-promo-title">'+s.t+'</h2><p class="trends-promo-text">'+s.d+'</p><a class="trends-promo-btn" href="'+s.h+'">'+s.b+' →</a></div><div class="trends-promo-art" aria-hidden="true"><strong>'+s.a+'</strong></div>';
      track.appendChild(el);
      var dot=document.createElement('button');dot.className='trends-promo-dot'+(i===0?' is-active':'');dot.type='button';dot.setAttribute('aria-label','Go to banner '+(i+1));dot.addEventListener('click',function(){go(i,true)});dots.appendChild(dot);
    });
    header.insertAdjacentElement('afterend',wrap);
    var index=0,timer=null,progressTimer=null,startX=0,moved=false,duration=5000;
    function render(){track.style.transform='translate3d(-'+(index*100)+'%,0,0)';wrap.querySelectorAll('.trends-promo-dot').forEach(function(d,i){d.classList.toggle('is-active',i===index)});var p=wrap.querySelector('.trends-promo-progress');p.style.transition='none';p.style.width='0';requestAnimationFrame(function(){p.style.transition='width '+duration+'ms linear';p.style.width='100%'})}
    function go(n,manual){index=(n+slides.length)%slides.length;render();if(manual)restart()}
    function restart(){clearInterval(timer);clearTimeout(progressTimer);timer=setInterval(function(){go(index+1,false)},duration)}
    wrap.querySelector('.trends-promo-prev').addEventListener('click',function(){go(index-1,true)});
    wrap.querySelector('.trends-promo-next').addEventListener('click',function(){go(index+1,true)});
    wrap.addEventListener('mouseenter',function(){clearInterval(timer)});wrap.addEventListener('mouseleave',restart);
    wrap.addEventListener('touchstart',function(e){startX=e.touches[0].clientX;moved=false;clearInterval(timer)},{passive:true});
    wrap.addEventListener('touchmove',function(e){if(Math.abs(e.touches[0].clientX-startX)>12)moved=true},{passive:true});
    wrap.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45)go(index+(dx<0?1:-1),true);else restart()},{passive:true});
    render();restart();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();