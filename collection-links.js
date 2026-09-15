(function(){"use strict";
function rewrite(){
  var grid=document.getElementById("collectionGrid")||document.getElementById("homepageCollections");
  if(!grid)return;
  grid.querySelectorAll("a.collection-card").forEach(function(link){
    if(link.dataset.collectionRouted==="1")return;
    var id=link.getAttribute("data-collection-id");
    var heading=link.querySelector(".collection-content h3,h3");
    var name=heading?heading.textContent.trim():"";
    if(!name)return;
    link.href="collection.html?"+(id?"id="+encodeURIComponent(id)+"&":"")+"name="+encodeURIComponent(name);
    link.dataset.collectionRouted="1";
  });
}
function start(){
  rewrite();
  var grid=document.getElementById("collectionGrid")||document.getElementById("homepageCollections");
  if(grid&&!grid.dataset.collectionObserver){
    var observer=new MutationObserver(rewrite);
    observer.observe(grid,{childList:true,subtree:true});
    grid.dataset.collectionObserver="1";
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
setTimeout(start,300);setTimeout(start,1000);setTimeout(start,2000);
})();
