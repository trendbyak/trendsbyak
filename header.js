/* =========================================================
   TRENDS BY AK — GLOBAL HEADER
   Shared customer-facing header.
   ========================================================= */
(function () {
    "use strict";

    const WHATSAPP_URL = "https://wa.me/918433998962";
    const INSTAGRAM_URL = "https://www.instagram.com/trendsbyak/";
    const logoPath = location.pathname.includes("/admin/") ? "../assets/logo.png" : "assets/logo.png";
    const root = document.querySelector(".site-header");
    if (!root) return;

    const path = location.pathname.split("/").pop() || "index.html";
    const isHome = path === "" || path === "index.html";
    const href = (homeAnchor, page) => isHome ? homeAnchor : page;

    const icon = {
        home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
        shop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1 12H5L4 9Z"/><path d="M7 9V7a5 5 0 0 1 10 0v2"/></svg>',
        wishlist: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.5-8.8 10.3-8.8 10.3S3.2 14.3 3.2 8.8A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.6Z"/></svg>',
        cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
        account: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
        instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
        chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
        search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>'
    };

    root.innerHTML = `
        <a class="brand" href="index.html" aria-label="Trends by AK Home">
            <img src="${logoPath}" alt="Trends by AK" class="site-logo-image">
            <span class="brand-copy">
                <strong>Trends by AK</strong>
                <small>Sustainable Luxury · Affordable</small>
            </span>
        </a>

        <button class="menu-toggle" id="globalMenuToggle" type="button" aria-label="Open menu" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>

        <nav class="main-nav" id="globalMainNav" aria-label="Main navigation">
            <a class="icon-link" href="${href("#home", "index.html#home")}" aria-label="Home" title="Home">${icon.home}<span class="sr-only">Home</span></a>
            <a class="icon-link" href="shop.html" aria-label="Shop" title="Shop">${icon.shop}<span class="sr-only">Shop</span></a>

            <div class="header-search-wrap">
                <div class="header-search">
                    ${icon.search}
                    <input id="globalSearchInput" class="header-search-input" type="search" placeholder="Search products..." autocomplete="off" aria-label="Search products">
                </div>
                <div id="globalSearchResults" class="header-search-results"></div>
            </div>

            <a class="icon-link" href="account.html#wishlist" aria-label="Wishlist" title="Wishlist">${icon.wishlist}<span class="sr-only">Wishlist</span></a>
            <a class="icon-link cart-icon-link" href="cart.html" aria-label="Cart" title="Cart">${icon.cart}<span class="cart-badge" id="cartCount">0</span><span class="sr-only">Cart</span></a>
            <a class="icon-link" href="account.html" aria-label="Account" title="Account">${icon.account}<span class="sr-only">Account</span></a>
            <a class="icon-link" href="${INSTAGRAM_URL}" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">${icon.instagram}<span class="sr-only">Instagram</span></a>

            <div class="more-menu">
                <button class="more-toggle" id="moreToggle" type="button" aria-expanded="false" aria-haspopup="true">
                    More ${icon.chevron}
                </button>
                <div class="more-dropdown" id="moreDropdown">
                    <a href="${href("#categories", "index.html#categories")}">Categories</a>
                    <a href="${href("#new-launches", "index.html#new-launches")}">New Launches</a>
                    <a href="${href("#collections", "collections.html")}">Collections</a>
                    <a href="${href("#reviews", "index.html#reviews")}">Reviews</a>
                    <a href="bulk-order.html">Bulk Orders</a>
                    <a href="track-order.html">Track Order</a>
                    <a href="${WHATSAPP_URL}" target="_blank" rel="noopener">WhatsApp</a>
                    <a href="policies.html">Policies</a>
                    <a href="contact.html">Contact Us</a>
                    <a href="https://rubans.in/" target="_blank" rel="noopener">Rubans.in</a>
                </div>
            </div>
        </nav>
    `;

    const menu = document.getElementById("globalMainNav");
    const menuButton = document.getElementById("globalMenuToggle");
    const searchInput = document.getElementById("globalSearchInput");
    const results = document.getElementById("globalSearchResults");
    const moreToggle = document.getElementById("moreToggle");
    const moreDropdown = document.getElementById("moreDropdown");

    menuButton?.addEventListener("click", () => {
        const open = menu.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(open));
    });

    moreToggle?.addEventListener("click", e => {
        e.stopPropagation();
        const open = moreDropdown.classList.toggle("is-open");
        moreToggle.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", e => {
        if (!e.target.closest(".more-menu")) {
            moreDropdown?.classList.remove("is-open");
            moreToggle?.setAttribute("aria-expanded", "false");
        }
    });

    menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        menuButton?.setAttribute("aria-expanded", "false");
    }));

    let products = [];

    function normaliseProduct(p) {
        return {
            id: p.id || p.product_id || "",
            name: p.name || p.title || "Product",
            category: p.category || p.categories || "",
            price: p.sale_price ?? p.price ?? "",
            image: p.image || p.image_url || p.main_image || "",
            slug: p.slug || p.id || ""
        };
    }

    async function loadProducts() {
        try {
            if (window.supabaseClient) {
                const { data } = await window.supabaseClient.from("products").select("*");
                if (Array.isArray(data)) products = data.map(normaliseProduct);
                return;
            }
            if (window.supabase && typeof window.supabase.createClient === "function" && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
                const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
                const { data } = await client.from("products").select("*");
                if (Array.isArray(data)) products = data.map(normaliseProduct);
            }
        } catch (error) {
            console.warn("Global product search could not load products.", error);
        }
    }

    function renderResults(query) {
        const q = query.trim().toLowerCase();
        if (!q) {
            results.innerHTML = "";
            results.classList.remove("is-visible");
            return;
        }
        const matches = products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(q)).slice(0, 8);
        if (!matches.length) {
            results.innerHTML = `<div class="search-empty">No products found for “${escapeHtml(query)}”.</div>`;
            results.classList.add("is-visible");
            return;
        }
        results.innerHTML = matches.map(p => {
            const productUrl = `product.html?id=${encodeURIComponent(p.id || p.slug)}`;
            return `<a class="search-result" href="${productUrl}">${p.image ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy">` : ""}<span class="search-result-info"><span class="search-result-name">${escapeHtml(p.name)}</span><span class="search-result-category">${escapeHtml(p.category)}</span>${p.price !== "" ? `<span class="search-result-price">₹${escapeHtml(String(p.price))}</span>` : ""}</span></a>`;
        }).join("");
        results.classList.add("is-visible");
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
    }
    function escapeAttr(value) { return escapeHtml(value); }

    searchInput?.addEventListener("input", () => renderResults(searchInput.value));
    document.addEventListener("click", e => {
        if (!e.target.closest(".header-search-wrap")) results?.classList.remove("is-visible");
    });
    renderResults("");
    loadProducts();

    function syncCartCount() {
        const badge = document.getElementById("cartCount");
        if (!badge) return;
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            badge.textContent = Array.isArray(cart) ? cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0) : 0;
        } catch (_) {}
    }
    syncCartCount();
    window.addEventListener("storage", syncCartCount);
    window.addEventListener("cartUpdated", syncCartCount);
})();
