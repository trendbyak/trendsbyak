(function () {
  "use strict";

  function getPrice(product) {
    return Number(product.sale_price ?? product.sp ?? product.price ?? product.mrp ?? 0) || 0;
  }

  function getName(product) {
    return String(product.name || "").trim();
  }

  function getDate(product) {
    const value = product.created_at || product.updated_at || product.createdAt || product.id || 0;
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
    if (!document.getElementById("shopProductGrid") || !document.getElementById("shopToolbar")) return;
    if (document.getElementById("tbkShopSort")) return;

    addStyles();

    const toolbar = document.getElementById("shopToolbar");
    const wrap = document.createElement("div");
    wrap.className = "tbk-shop-sort-wrap";
    wrap.innerHTML = `
      <label for="tbkShopSort">Sort by</label>
      <select id="tbkShopSort" class="tbk-shop-sort" aria-label="Sort products">
        <option value="relevance">Relevance</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="newest">Newest</option>
        <option value="name-asc">Name: A to Z</option>
        <option value="name-desc">Name: Z to A</option>
      </select>`;
    toolbar.appendChild(wrap);

    const select = document.getElementById("tbkShopSort");
    select.addEventListener("change", function () {
      window.tbkShopSort = this.value;
      if (typeof renderProducts === "function") renderProducts();
    });

    const originalRender = window.renderProducts;
    if (typeof originalRender !== "function") return;

    window.renderProducts = function () {
      const sort = window.tbkShopSort || "relevance";
      if (sort === "relevance") return originalRender();

      const originalProducts = window.allProducts;
      if (!Array.isArray(originalProducts)) return originalRender();

      const originalAllProducts = window.allProducts;
      window.allProducts = [...originalAllProducts].sort((a, b) => {
        if (sort === "price-asc") return getPrice(a) - getPrice(b);
        if (sort === "price-desc") return getPrice(b) - getPrice(a);
        if (sort === "name-asc") return getName(a).localeCompare(getName(b));
        if (sort === "name-desc") return getName(b).localeCompare(getName(a));
        if (sort === "newest") return getDate(b) - getDate(a);
        return 0;
      });

      originalRender();
      window.allProducts = originalAllProducts;
    };
  }

  function waitForShop() {
    setup();
    if (!document.getElementById("tbkShopSort")) setTimeout(waitForShop, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForShop);
  } else {
    waitForShop();
  }
})();
