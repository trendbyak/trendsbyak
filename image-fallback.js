(function(){
  const API='https://ltxrycmreumoqfpcbwnb.supabase.co/functions/v1/image-proxy';
  const allowed=/^(https?:)?\\/\\/(www\\.)?(fashionalley\\.co\\.in|shumajewellers\\.com|cdn\\.shopify\\.com|shascollections\\.com|sonalbeadsnx\\.com|jewelsmars\\.com|rukmini1\\.flixcart\\.com|rukminim2\\.flixcart\\.com|static-assets-web\\.flixcart\\.com|m\\.media-amazon\\.com|smartpos\\.amazon\\.in|indsmartcart\\.com|unboxkar\\.com)$/i;
  function normalize(u){return String(u||'').replace(/^\\/\\//,'https://')}
  function proxy(u){u=normalize(u);try{const x=new URL(u);if(allowed.test(x.origin))return API+'?url='+encodeURIComponent(x.href)}catch{}return u}
  function cleanList(img){
    let list=[];try{list=JSON.parse(img.getAttribute('data-fallbacks')||'[]')}catch{}
    return list.filter(u=>!String(u).includes('facebook.com/tr?')).map(proxy);
  }
  function prepare(img){
    if(!img||img.tagName!=='IMG'||img.dataset.takPrepared)return;
    img.dataset.takPrepared='1';
    let list=cleanList(img);
    img.setAttribute('data-fallbacks',JSON.stringify(list));
    const src=normalize(img.getAttribute('src')||'');
    if(src.includes('facebook.com/tr?')){img.removeAttribute('src');if(list.length){img.src=list.shift();img.setAttribute('data-fallbacks',JSON.stringify(list));}}
    else if(src)img.src=proxy(src);
  }
  function nextImage(img){
    prepare(img);
    const list=cleanList(img);
    const tried=img.dataset.tried?Number(img.dataset.tried):0;
    if(tried<list.length){img.dataset.tried=String(tried+1);img.src=list[tried];return true}
    const parent=img.parentElement;
    if(parent){const fallback=parent.querySelector('.no-image,.category-fallback,.instagram-placeholder');if(fallback){img.style.display='none';fallback.style.display='flex';return true}}
    img.style.display='none';return false;
  }
  function scan(root=document){root.querySelectorAll('img').forEach(prepare)}
  document.addEventListener('error',e=>{const img=e.target;if(img&&img.tagName==='IMG')nextImage(img)},true);
  document.addEventListener('DOMContentLoaded',()=>scan());
  new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{if(n.nodeType===1){if(n.tagName==='IMG')prepare(n);scan(n)}}))).observe(document.documentElement,{childList:true,subtree:true});
  window.TAKImageFallback={next:nextImage,prepare};
})();