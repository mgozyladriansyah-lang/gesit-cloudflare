(function () {
  "use strict";
  var VER = "task4f-final-mobile-bottom-nav";

  function isMobile() {
    return window.matchMedia ? window.matchMedia("(max-width:768px)").matches : window.innerWidth <= 768;
  }

  function norm(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function injectStyle() {
    var old = document.getElementById("gesit-task4f-nav-style");
    if (old) old.remove();

    var css = `
@media (max-width:768px) {
  body.gesit-mobile-shell .mobile-bottom-nav:not(#gesitMobileFinalNav),
  body.gesit-mobile-shell .bottom-nav:not(#gesitMobileFinalNav),
  body.gesit-mobile-shell #mobileBottomNav:not(#gesitMobileFinalNav),
  body.gesit-mobile-shell [data-mobile-bottom-nav]:not(#gesitMobileFinalNav) {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  body.gesit-mobile-shell #gesitMobileFinalNav {
    display: grid !important;
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
    position: fixed !important;
    left: 10px !important;
    right: 10px !important;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 8px) !important;
    height: 76px !important;
    min-height: 76px !important;
    max-height: 76px !important;
    z-index: 2147481200 !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    align-items: center !important;
    gap: 4px !important;
    padding: 8px !important;
    border-radius: 24px !important;
    background: rgba(255,255,255,.98) !important;
    border: 1px solid rgba(15,143,134,.16) !important;
    box-shadow: 0 16px 34px rgba(15,23,42,.14) !important;
    backdrop-filter: blur(14px) !important;
    -webkit-backdrop-filter: blur(14px) !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  body.gesit-mobile-shell #gesitMobileFinalNav button {
    all: unset !important;
    min-width: 0 !important;
    width: 100% !important;
    height: 58px !important;
    max-height: 58px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
    padding: 4px 2px !important;
    border-radius: 18px !important;
    color: #64748b !important;
    font-size: 10.5px !important;
    font-weight: 800 !important;
    line-height: 1.05 !important;
    text-align: center !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    box-sizing: border-box !important;
    cursor: pointer !important;
    touch-action: manipulation !important;
  }

  body.gesit-mobile-shell #gesitMobileFinalNav button.is-active,
  body.gesit-mobile-shell #gesitMobileFinalNav button[aria-current="page"] {
    background: rgba(20,184,166,.12) !important;
    color: #0f8f86 !important;
  }

  body.gesit-mobile-shell #gesitMobileFinalNav svg {
    width: 22px !important;
    height: 22px !important;
    min-width: 22px !important;
    min-height: 22px !important;
    max-width: 22px !important;
    max-height: 22px !important;
    display: block !important;
    flex: 0 0 22px !important;
    stroke-width: 2 !important;
  }

  body.gesit-mobile-shell #gesitMobileFinalNav span {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    font-size: 10.5px !important;
    line-height: 1.05 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  body.gesit-mobile-shell .content,
  body.gesit-mobile-shell main.content,
  body.gesit-mobile-shell .main,
  body.gesit-mobile-shell main.main {
    padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px) + 40px) !important;
  }

  body.gesit-mobile-shell .notification-center-button,
  body.gesit-mobile-shell #notificationCenterButton,
  body.gesit-mobile-shell .notify-center-button,
  body.gesit-mobile-shell .notify-fab,
  body.gesit-mobile-shell [data-notification-center] {
    bottom: calc(76px + env(safe-area-inset-bottom, 0px) + 18px) !important;
    right: 16px !important;
    z-index: 2147481300 !important;
  }
}`;
    var style = document.createElement("style");
    style.id = "gesit-task4f-nav-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function icon(name) {
    var paths = {
      home: '<path d="M3 10.5 12 3l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9V20H4.5A1.5 1.5 0 0 1 3 18.5v-8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      services: '<path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      users: '<path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 8c0-1.7-1-3.2-2.5-3.7M6.5 15.3C5 15.8 4 17.3 4 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      approval: '<path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      profile: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      tamu: '<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3 2.5-5 5-5s5 2 5 5m-1.5-4.5c.8-.4 1.7-.5 2.5-.5 2.5 0 5 2 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      eco: '<path d="M5 19c8 0 14-6 14-14C11 5 5 11 5 19Zm0 0c0-5 3-8 7-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || paths.home) + '</svg>';
  }

  function getUser() {
    try { if (window.Store && typeof Store.get === "function") return Store.get("user") || Store.get("authUser") || Store.get("currentUser") || null; } catch(e) {}
    try { if (window.Auth && Auth.user) return Auth.user; if (window.Auth && Auth.currentUser) return Auth.currentUser; } catch(e) {}
    try { var raw = localStorage.getItem("gesit:user") || localStorage.getItem("GESIT_USER") || localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; } catch(e) {}
    return null;
  }

  function role() {
    var u = getUser() || {};
    return norm(u.role || u.peran || u.user_role || "");
  }

  function navModel() {
    var r = role();
    if (/^(super_admin|admin)$/i.test(r)) return [["home","Beranda","home"],["services","Layanan","services"],["users","User","users"],["approval","Approval","approval"]];
    if (/magang/i.test(r)) return [["presensi","Presensi","home"],["services","Logbook","services"],["services","Izin","services"],["profile","Profil","profile"]];
    if (/security/i.test(r)) return [["home","Security","home"],["tamu","Tamu","tamu"],["services","Layanan","services"],["profile","Profil","profile"]];
    if (/(driver|cso|tad)/i.test(r)) return [["home","Presensi","home"],["services","Izin","services"],["eco","Eco","eco"],["profile","Profil","profile"]];
    return [["home","Beranda","home"],["services","Layanan","services"],["tamu","Tamu","tamu"],["profile","Profil","profile"]];
  }

  function currentAction() {
    var cur = "";
    try { cur = norm((window.Router && Router.current) || document.body.getAttribute("data-current-view") || ""); } catch(e) {}
    if (cur.indexOf("user") >= 0) return "users";
    if (cur.indexOf("approval") >= 0) return "approval";
    if (cur.indexOf("tamu") >= 0 || cur.indexOf("digitamu") >= 0) return "tamu";
    if (cur.indexOf("eco") >= 0) return "eco";
    return "home";
  }

  function ensureNav() {
    var nav = document.getElementById("gesitMobileFinalNav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "gesitMobileFinalNav";
      nav.setAttribute("aria-label", "Navigasi utama mobile GESIT");
      document.body.appendChild(nav);
    }
    return nav;
  }

  function render() {
    if (!isMobile()) return;
    document.body.classList.add("gesit-mobile-shell");
    injectStyle();
    var nav = ensureNav();
    var active = currentAction();
    nav.innerHTML = navModel().map(function (item) {
      var action = item[0], label = item[1], ico = item[2];
      return '<button type="button" data-gesit-final-nav-action="' + action + '" aria-label="' + label + '"' + (active === action ? ' class="is-active" aria-current="page"' : '') + '>' + icon(ico) + '<span>' + label + '</span></button>';
    }).join("");
  }

  function tryView(names) {
    for (var i=0; i<names.length; i++) {
      var name = names[i];
      try { if (window.Router && typeof Router.canOpen === "function" && Router.canOpen(name) === false) continue; } catch(e) {}
      try { if (window.Router && typeof Router.go === "function") { Router.go(name); return true; } } catch(e) {}
      try { var el = document.querySelector('[data-view="'+name+'"],[data-view-panel="'+name+'"]'); if (el) { el.click(); return true; } } catch(e) {}
    }
    return false;
  }

  function openProfile() {
    var btn = document.querySelector("#userMenuBtn,#userMenuToggle,.user-menu-toggle,.topbar-user,.avatar-btn,.user-chip");
    if (btn) { btn.click(); return true; }
    try { if (window.UserMenu && typeof UserMenu.toggle === "function") { UserMenu.toggle(); return true; } } catch(e) {}
    return false;
  }

  function route(action) {
    if (action === "home" || action === "presensi") return tryView(["dashboard","home","pusat-data","portal-magang","portal-tad"]);
    if (action === "users") return tryView(["users","manajemen-user","user-management"]);
    if (action === "approval") return tryView(["approval","approval_center","approval-center","approvals"]);
    if (action === "tamu") return tryView(["digitamu","tamu","guest"]);
    if (action === "eco") return tryView(["eco","eco-office"]);
    if (action === "profile") return openProfile();
    if (action === "services") {
      var btn = document.querySelector("#mobileServicesBtn,[data-mobile-services],.mobile-services-btn");
      if (btn) { btn.click(); return true; }
      return tryView(["services","layanan","kendaraan","ruangan","atk"]);
    }
    return false;
  }

  function bind() {
    if (window.__GESIT_TASK4F_BOUND__) return;
    window.__GESIT_TASK4F_BOUND__ = true;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("#gesitMobileFinalNav [data-gesit-final-nav-action]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      route(btn.getAttribute("data-gesit-final-nav-action"));
      setTimeout(render, 150);
    }, true);
  }

  function schedule() { [0,250,900,1800].forEach(function(ms){ setTimeout(render, ms); }); }

  function init() {
    bind();
    schedule();
    window.addEventListener("resize", schedule, { passive:true });
    window.addEventListener("orientationchange", schedule, { passive:true });
    document.addEventListener("visibilitychange", schedule, { passive:true });
    document.addEventListener("click", function(){ setTimeout(render, 200); }, true);
    window.GESIT_TASK4F_FINAL_NAV = { version: VER, refresh: render };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
