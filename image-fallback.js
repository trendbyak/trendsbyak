(function(){
  function nextImage(img){
    let list=[];
    try{list=JSON.parse(img.getAttribute('data-fallbacks')||'[]')}catch{}
    const tried=img.dataset.tried?Number(img.dataset.tried):0;
    if(tried<list.length){img.dataset.tried=String(tried+1);img.src=list[tried];return true}
    const parent=img.parentElement;
    if(parent){const fallback=parent.querySelector('.no-image,.category-fallback,.instagram-placeholder');if(fallback){img.style.display='none';fallback.style.display='flex';return true}}
    img.style.display='none';return false;
  }
  document.addEventListener('error',e=>{const img=e.target;if(img&&img.tagName==='IMG')nextImage(img)},true);
  window.TAKImageFallback={next:nextImage};
})();
