/* =========================================================
   TRENDS BY AK — GLOBAL HEADER
   Loaded on customer-facing pages.
   ========================================================= */
(function () {
    "use strict";

    const WHATSAPP_URL = "https://wa.me/918433998962";
    const logoPath = (location.pathname.includes("/admin/") ? "../assets/logo.png" : "assets/logo.png");
    const root = document.querySelector(".site-header");
    if (!root) return;

    const path = location.pathname.split("/").pop() || "index.html";
    const isHome = path === "" || path === "index.html";

    const href = (homeAnchor, page) => isHome ? homeAnchor : page;

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
            <a href="${href("#categories", "index.html#categories")}">Categories</a>
            <a href="${href("#new-launches", "index.html#new-launches")}">New Launches</a>
            <a href="${href("#collections", "collections.html")}">Collections</a>
            <a href="${href("#instagram", "index.html#instagram")}">Instagram</a>
            <a href="${href("#reviews", "index.html#reviews")}">Reviews</a>
            <a href="shop.html">Shop</a>
            <a href="bulk-order.html">Bulk Orders</a>
            <a href="about.html">Our Story</a>
            <a href="account.html">Account</a>

            <button type="button" class="nav-search" id="globalSearchButton" aria-label="Search products">
                🔍 Search
            </button>

            <a href="cart.html" class="nav-cart">Cart <span id="cartCount">0</span></a>

            <a class="nav-whatsapp" href="${WHATSAPP_URL}" target="_blank" rel="noopener">
                WhatsApp
            </a>
        </nav>
    `;

    if (!document.getElementById("globalSearchOverlay")) {
        const overlay = document.createElement("div");
        overlay.id = "globalSearchOverlay";
        overlay.className = "search-overlay";
        overlay.innerHTML = `
            <div class="search-box" role="dialog" aria-modal="true" aria-label="Search products">
                <div class="search-box-top">
                    <input id="globalSearchInput" class="search-input" type="search" placeholder="Search products..." autocomplete="off">
                    <button id="globalSearchClose" class="search-close" type="button" aria-label="Close search">×</button>
                </div>
                <div id="globalSearchResults" class="search-results"></div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const menu = document.getElementById("globalMainNav");
    const menuButton = document.getElementById("globalMenuToggle");
    const searchButton = document.getElementById("globalSearchButton");
    const overlay = document.getElementById("globalSearchOverlay");
    const searchInput = document.getElementById("globalSearchInput");
    const closeButton = document.getElementById("globalSearchClose");
    const results = document.getElementById("globalSearchResults");

    menuButton?.addEventListener("click", () => {
        const open = menu.classList.toggle("is-open");
        menuButton.setAttribute("aria-expanded", String(open));
    });

    menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        menuButton?.setAttribute("aria-expanded", "false");
    }));

    function openSearch() {
        overlay.classList.add("is-open");
        document.body.classList.add("search-open");
        setTimeout(() => searchInput?.focus(), 50);
    }

    function closeSearch() {
        overlay.classList.remove("is-open");
        document.body.classList.remove("search-open");
    }

    searchButton?.addEventListener("click", openSearch);
    closeButton?.addEventListener("click", closeSearch);
    overlay?.addEventListener("click", e => {
        if (e.target === overlay) closeSearch();
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeSearch();
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            openSearch();
        }
    });

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
            results.innerHTML = `<div class="search-empty">Start typing to search our products.</div>`;
            return;
        }

        const matches = products.filter(p =>
            `${p.name} ${p.category}`.toLowerCase().includes(q)
        ).slice(0, 12);

        if (!matches.length) {
            results.innerHTML = `<div class="search-empty">No products found for “${escapeHtml(query)}”.</div>`;
            return;
        }

        results.innerHTML = matches.map(p => {
            const productUrl = `product.html?id=${encodeURIComponent(p.id || p.slug)}`;
            return `
                <a class="search-result" href="${productUrl}">
                    ${p.image ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy">` : ""}
                    <span class="search-result-info">
                        <span class="search-result-name">${escapeHtml(p.name)}</span>
                        <span class="search-result-category">${escapeHtml(p.category)}</span>
                        ${p.price !== "" ? `<span class="search-result-price">₹${escapeHtml(String(p.price))}</span>` : ""}
                    </span>
                </a>
            `;
        }).join("");
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
    }
    function escapeAttr(value) { return escapeHtml(value); }

    searchInput?.addEventListener("input", () => renderResults(searchInput.value));
    renderResults("");
    loadProducts();

    // Keep the existing cart badge in sync when the site's cart code updates localStorage.
    function syncCartCount() {
        const badge = document.getElementById("cartCount");
        if (!badge) return;
        try {
            const cart = JSON.parse(localStorage.getItem("cart") || "[]");
            badge.textContent = Array.isArray(cart)
                ? cart.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
                : 0;
        } catch (_) {}
    }
    syncCartCount();
    window.addEventListener("storage", syncCartCount);
    window.addEventListener("cartUpdated", syncCartCount);
})();
