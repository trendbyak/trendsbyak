(function () {
  "use strict";

  function getPrice(product) {
    return Number(product.sale_price ?? product.sp ?? product.price ?? product.mrp ?? 0) || 0;
  }
  function getName(product) { return String(product.name || "").trim(); }
  function getDate(product) {
    const value = product.created_at || product.updated_at || product.createdAt || 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : Number(product.id) || 0;
  }
  function addStyles() {
    if (document.getElementById("tbkShopSortStyles")) return;
    const style = document.createElement("style");
    style.id = "tbkShopSortStyles";
    style.textContent = `
      .tbk-shop-sort-wrap{display:flex;align-items:center;gap:9px;margin-left:auto;white-space:nowrap}
      .tbk-shop-sort-wrap label{font-size:11px;color:#777;font-weight:600}
      .tbk-shop-sort{height:42px;border:1px solid #ddd6cc;border-radius:10px;padding:0 34px 0 12px;background:#fff;color:#1d1b19;font:500 12px inherit;outline:none;cursor:pointer}
      .tbk-shop-sort:focus{border-color:#b28a4b}
      @media(max-width:700px){.tbk-shop-sort-wrap{margin-left:0;width:100%;justify-content:space-between}.tbk-shop-sort{flex:1}}
    `;
    document.head.appendChild(style);
  }
  function setup() {
    const toolbar = document.querySelector(".shop-toolbar");
    const grid = document.getElementById("shopProductGrid");
    if (!toolbar || !grid || document.getElementById("tbkShopSort")) return;
    addStyles();
    const wrap = document.createElement("div");
    wrap.className = "tbk-shop-sort-wrap";
    wrap.innerHTML = `<label for="tbkShopSort">Sort by</label><select id="tbkShopSort" class="tbk-shop-sort" aria-label="Sort products"><option value="relevance">Relevance</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="newest">Newest</option><option value="name-asc">Name: A to Z</option><option value="name-desc">Name: Z to A</option></select>`;
    toolbar.appendChild(wrap);
    document.getElementById("tbkShopSort").addEventListener("change", function () {
      window.tbkShopSort = this.value;
      if (typeof renderProducts === "function") renderProducts();
    });
  }
  function sortRenderedCards() {
    const grid = document.getElementById("shopProductGrid");
    const select = document.getElementById("tbkShopSort");
    if (!grid || !select) return;
    const cards = [...grid.querySelectorAll(".shop-product-card")];
    if (!cards.length || select.value === "relevance") return;
    cards.sort((a,b) => {
      const priceA = Number((a.querySelector(".shop-price-row strong")?.textContent || "").replace(/[^0-9.]/g,"")) || 0;
      const priceB = Number((b.querySelector(".shop-price-row strong")?.textContent || "").replace(/[^0-9.]/g,"")) || 0;
      const nameA = a.querySelector(".shop-product-info h3 a")?.textContent.trim() || "";
      const nameB = b.querySelector(".shop-product-info h3 a")?.textContent.trim() || "";
      if (select.value === "price-asc") return priceA - priceB;
      if (select.value === "price-desc") return priceB - priceA;
      if (select.value === "name-asc") return nameA.localeCompare(nameB);
      if (select.value === "name-desc") return nameB.localeCompare(nameA);
      if (select.value === "newest") return Number(b.querySelector("a.shop-product-image")?.href.match(/id=([^&]+)/)?.[1] || 0) - Number(a.querySelector("a.shop-product-image")?.href.match(/id=([^&]+)/)?.[1] || 0);
      return 0;
    });
    cards.forEach(card => grid.appendChild(card));
  }
  function start() {
    setup();
    const select = document.getElementById("tbkShopSort");
    if (select && typeof window.renderProducts === "function" && !window.tbkSortObserver) {
      window.tbkSortObserver = new MutationObserver(() => {
        clearTimeout(window.tbkSortTimer);
        window.tbkSortTimer = setTimeout(sortRenderedCards, 0);
      });
      window.tbkSortObserver.observe(document.getElementById("shopProductGrid"), {childList:true});
      select.addEventListener("change", () => setTimeout(sortRenderedCards, 0));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  setTimeout(start, 250);
  setTimeout(start, 750);
})();
