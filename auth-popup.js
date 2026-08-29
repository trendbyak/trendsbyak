(function () {
  "use strict";

  const SUPABASE_URL = "https://ltxrycmreumoqfpcbwnb.supabase.co";
  const SUPABASE_KEY = "sb_publishable_wdc4ImKB1f0Q-v4Po9DOwA_xIpPXHkh";
  const ACCOUNT_URL = "account.html";

  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve(window.supabase);
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload = () => resolve(window.supabase);
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function injectStyles() {
    if (document.getElementById("trendsAuthStyles")) return;
    const style = document.createElement("style");
    style.id = "trendsAuthStyles";
    style.textContent = `
      .tbk-auth-overlay{position:fixed;inset:0;z-index:100000;background:rgba(41,37,31,.58);display:none;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(5px)}
      .tbk-auth-overlay.is-open{display:flex}
      .tbk-auth-card{position:relative;width:min(430px,100%);background:#fffaf3;border:1px solid rgba(178,138,80,.28);box-shadow:0 25px 80px rgba(0,0,0,.25);padding:30px}
      .tbk-auth-close{position:absolute;right:14px;top:14px;width:36px;height:36px;border:1px solid #dfd1bd;background:transparent;color:#29251f;font-size:20px;cursor:pointer}
      .tbk-auth-logo{display:block;width:54px;height:54px;border-radius:50%;object-fit:cover;margin:0 auto 14px}
      .tbk-auth-card h2{font-family:"Playfair Display",serif;text-align:center;margin:0 0 6px;font-size:28px;color:#29251f}
      .tbk-auth-sub{text-align:center;color:#786f64;font-size:12px;line-height:1.6;margin:0 0 20px}
      .tbk-auth-tabs{display:flex;border-bottom:1px solid #dfd1bd;margin-bottom:18px}
      .tbk-auth-tab{flex:1;border:0;background:transparent;padding:11px;color:#786f64;font-weight:600;cursor:pointer}
      .tbk-auth-tab.active{color:#29251f;border-bottom:2px solid #b28a50}
      .tbk-auth-form{display:none}.tbk-auth-form.active{display:block}
      .tbk-auth-form label{display:block;font-size:11px;font-weight:700;margin:12px 0 6px;color:#29251f}
      .tbk-auth-form input{width:100%;padding:12px;border:1px solid #dfd1bd;background:#fff;color:#29251f;font:inherit;outline:none}
      .tbk-auth-form input:focus{border-color:#b28a50}
      .tbk-auth-submit{width:100%;margin-top:16px;padding:13px;border:0;background:#29251f;color:#fff;cursor:pointer;font-weight:700}
      .tbk-auth-submit:disabled{opacity:.6;cursor:not-allowed}
      .tbk-auth-message{min-height:18px;margin-top:10px;font-size:11px;text-align:center;color:#a33}
      .tbk-auth-message.success{color:#357335}
      .tbk-auth-guest{display:block;width:100%;margin-top:10px;padding:11px;border:1px solid #dfd1bd;background:transparent;color:#29251f;cursor:pointer}
      .tbk-auth-footer{text-align:center;margin-top:15px;font-size:10px;color:#786f64;line-height:1.5}
      body.tbk-auth-open{overflow:hidden}
      @media(max-width:520px){.tbk-auth-card{padding:25px 20px}.tbk-auth-card h2{font-size:25px}}
    `;
    document.head.appendChild(style);
  }

  function createModal() {
    if (document.getElementById("tbkAuthOverlay")) return;
    const overlay = document.createElement("div");
    overlay.id = "tbkAuthOverlay";
    overlay.className = "tbk-auth-overlay";
    overlay.innerHTML = `
      <div class="tbk-auth-card" role="dialog" aria-modal="true" aria-labelledby="tbkAuthTitle">
        <button class="tbk-auth-close" id="tbkAuthClose" type="button" aria-label="Close">×</button>
        <img class="tbk-auth-logo" src="assets/logo.png" alt="Trends by AK">
        <h2 id="tbkAuthTitle">Welcome to Trends by AK</h2>
        <p class="tbk-auth-sub">Sign in to save your wishlist, track orders and keep your account ready on this browser.</p>
        <div class="tbk-auth-tabs">
          <button class="tbk-auth-tab active" data-auth-tab="login" type="button">Sign In</button>
          <button class="tbk-auth-tab" data-auth-tab="signup" type="button">Create Account</button>
        </div>
        <form class="tbk-auth-form active" id="tbkLoginForm">
          <label>Email</label><input id="tbkLoginEmail" type="email" autocomplete="email" required>
          <label>Password</label><input id="tbkLoginPassword" type="password" autocomplete="current-password" required>
          <button class="tbk-auth-submit" type="submit">Sign In</button>
          <div class="tbk-auth-message" id="tbkLoginMessage"></div>
        </form>
        <form class="tbk-auth-form" id="tbkSignupForm">
          <label>Full Name</label><input id="tbkSignupName" type="text" autocomplete="name" required>
          <label>Mobile Number</label><input id="tbkSignupPhone" type="tel" autocomplete="tel" required>
          <label>Email</label><input id="tbkSignupEmail" type="email" autocomplete="email" required>
          <label>Password</label><input id="tbkSignupPassword" type="password" minlength="6" autocomplete="new-password" required>
          <button class="tbk-auth-submit" type="submit">Create Account</button>
          <div class="tbk-auth-message" id="tbkSignupMessage"></div>
        </form>
        <button class="tbk-auth-guest" id="tbkAuthGuest" type="button">Continue as Guest</button>
        <div class="tbk-auth-footer">Your login stays active on this browser until you sign out.</div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function openAuth() {
    const overlay = document.getElementById("tbkAuthOverlay");
    if (!overlay) return;
    overlay.classList.add("is-open");
    document.body.classList.add("tbk-auth-open");
    setTimeout(() => document.getElementById("tbkLoginEmail")?.focus(), 50);
  }

  function closeAuth() {
    const overlay = document.getElementById("tbkAuthOverlay");
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.classList.remove("tbk-auth-open");
  }

  function message(id, text, success) {
    const el = document.getElementById(id);
    el.textContent = text || "";
    el.className = "tbk-auth-message" + (success ? " success" : "");
  }

  async function init() {
    injectStyles();
    createModal();

    const sdk = await loadSupabase();
    const client = sdk.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    window.trendsByAkSupabase = client;

    document.querySelectorAll("[data-auth-tab]").forEach(tab => tab.addEventListener("click", () => {
      document.querySelectorAll("[data-auth-tab]").forEach(t => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".tbk-auth-form").forEach(f => f.classList.toggle("active", f.id === (tab.dataset.authTab === "login" ? "tbkLoginForm" : "tbkSignupForm")));
      message("tbkLoginMessage", "");
      message("tbkSignupMessage", "");
    }));

    document.getElementById("tbkAuthClose").onclick = closeAuth;
    document.getElementById("tbkAuthGuest").onclick = () => {
      sessionStorage.setItem("tbk_guest_choice", "1");
      closeAuth();
    };
    document.getElementById("tbkAuthOverlay").addEventListener("click", e => { if (e.target.id === "tbkAuthOverlay") closeAuth(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeAuth(); });

    document.getElementById("tbkLoginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Signing in...";
      message("tbkLoginMessage", "");
      const { error } = await client.auth.signInWithPassword({
        email: document.getElementById("tbkLoginEmail").value.trim(),
        password: document.getElementById("tbkLoginPassword").value
      });
      if (error) {
        message("tbkLoginMessage", error.message);
        btn.disabled = false; btn.textContent = "Sign In";
        return;
      }
      sessionStorage.removeItem("tbk_guest_choice");
      closeAuth();
      window.dispatchEvent(new CustomEvent("tbkAuthChanged"));
    });

    document.getElementById("tbkSignupForm").addEventListener("submit", async e => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Creating account...";
      message("tbkSignupMessage", "");
      const { data, error } = await client.auth.signUp({
        email: document.getElementById("tbkSignupEmail").value.trim(),
        password: document.getElementById("tbkSignupPassword").value,
        options: { data: {
          full_name: document.getElementById("tbkSignupName").value.trim(),
          phone: document.getElementById("tbkSignupPhone").value.trim()
        }}
      });
      if (error) {
        message("tbkSignupMessage", error.message);
        btn.disabled = false; btn.textContent = "Create Account";
        return;
      }
      if (data.session) {
        sessionStorage.removeItem("tbk_guest_choice");
        closeAuth();
        window.dispatchEvent(new CustomEvent("tbkAuthChanged"));
      } else {
        message("tbkSignupMessage", "Account created. Please confirm your email, then sign in.", true);
        btn.disabled = false; btn.textContent = "Create Account";
      }
    });

    const { data: { session } } = await client.auth.getSession();
    if (!session && !sessionStorage.getItem("tbk_guest_choice")) openAuth();

    client.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        sessionStorage.removeItem("tbk_guest_choice");
        closeAuth();
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();