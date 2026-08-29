(function(){
  var base = document.currentScript ? document.currentScript.src.replace(/\/header-loader\.js(?:\?.*)?$/, '/') : '';
  if (!base) base = location.origin + '/';

  if (!document.querySelector('link[data-trends-header-css]')) {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = base + 'header.css';
    css.dataset.trendsHeaderCss = '1';
    document.head.appendChild(css);
  }

  var script = document.createElement('script');
  script.src = base + 'header.js';
  script.defer = true;
  document.head.appendChild(script);

  var auth = document.createElement('script');
  auth.src = base + 'auth-popup.js';
  auth.defer = true;
  document.head.appendChild(auth);

  if (/\/shop\.html(?:[?#]|$)/i.test(location.pathname)) {
    var sort = document.createElement('script');
    sort.src = base + 'shop-sort.js';
    sort.defer = false;
    document.body.appendChild(sort);
  }
})();
