(function () {
  "use strict";
  var VER = "task4e-bottom-nav-visibility-final";

  function isMobile() {
    return window.matchMedia ? window.matchMedia("(max-width:768px)").matches : window.innerWidth <= 768;
  }

  function icon(name) {
    var paths = {
      home: '<path d="M3 10.5 12 3l9 7.5v8a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9V20H4.5A1.5 1.5 0 0 1 3 18.5v-8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      services: '<path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      users: '<path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 8c0-1.7-1-3.2-2.5-3.7M6.5 15.3C5 15.8 4 17.3 4 19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      approval: '<path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
      profile: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      tamu: '<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3 2.5-5 5-5s5 2 5 5m-1.5-4.5c.8-.4 1.7-.5 2.5-.5 2.5 0 5 2 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      security: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
      eco: '<path d="M5 19c8 0 14-6 14-14C11 5 5 11 5 19Zm0 0c0-5 3-8 7-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || paths.home) + '</svg>';
  }

  function norm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }

  function getUser() {
    try { if (window.Store && typeof Store.get === "function") return Store.get("user") || Store.get("authUser") || Store.get("currentUser") || null; } catch (e) {}
    try { if (window.Auth && Auth.user) return Auth.user; if (window.Auth && Auth.currentUser) return Auth.currentUser; } catch (e) {}
    try { var raw = localStorage.getItem("gesit:user") || localStorage.getItem("GESIT_USER") || localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; } catch (e) {}
    return null;
  }

  function role() {
    var u = getUser() || {};
    return norm(u.role || u.peran || u.user_role || "");
  }

  function targetNav() {
    var roleName = role();
    if (/^(super_admin|admin)$/i.test(roleName)) return [
      ["home", "Beranda", "home"], ["services", "Layanan", "services"], ["users", "User", "users"], ["approval", "Approval", "approval"]
    ];
    if (/security/i.test(roleName)) return [
      ["security", "Security", "security"], ["tamu", "Tamu", "tamu"], ["services", "Layanan", "services"], ["profile", "Profil", "profile"]
    ];
    if (/magang/i.test(roleName)) return [
      ["presensi", "Presensi", "home"], ["logbook", "Logbook", "services"], ["izin", "Izin", "services"], ["profile", "Profil", "profile"]
    ];
    if (/(driver|cso|tad)/i.test(roleName)) return [
      ["presensi", "Presensi", "home"], ["izin", "Izin", "services"], ["eco", "Eco", "eco"], ["profile", "Profil", "profile"]
    ];
    return [["home", "Beranda", "home"], ["services", "Layanan", "services"], ["tamu", "Tamu", "tamu"], ["profile", "Profil", "profile"]];
  }

  function findExistingNavs() {
    return Array.prototype.slice.call(document.querySelectorAll("#mobileBottomNav,.mobile-bottom-nav,.bottom-nav,[data-mobile-bottom-nav],#gesitMobileFallbackNav"));
  }

  function pickNav() {
    var navs = findExistingNavs().filter(function (n) { return n && n.isConnected; });
    if (!navs.length) return null;
    navs.sort(function (a, b) {
      if (a.id === "gesitMobileFallbackNav") return 1;
      if (b.id === "gesitMobileFallbackNav") return -1;
      return 0;
    });
    return navs[0];
  }

  function ensureFallback() {
    var nav = document.getElementById("gesitMobileFallbackNav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "gesitMobileFallbackNav";
      nav.className = "mobile-bottom-nav";
      nav.setAttribute("data-mobile-bottom-nav", "true");
      document.body.appendChild(nav);
    }
    return nav;
  }

  function tryView(names) {
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      try { if (window.Router && typeof Router.canOpen === "function" && Router.canOpen(name) === false) continue; } catch (e) {}
      try { if (window.Router && typeof Router.go === "function") { Router.go(name); return true; } } catch (e) {}
      try { var el = document.querySelector('[data-view="' + name + '"],[data-view-panel="' + name + '"]'); if (el) { el.click(); return true; } } catch (e) {}
    }
    return false;
  }

  function openProfile() {
    var btn = document.querySelector("#userMenuBtn,#userMenuToggle,.user-menu-toggle,.topbar-user,.avatar-btn,.user-chip");
    if (btn) { btn.click(); return true; }
    try { if (window.UserMenu && typeof UserMenu.toggle === "function") { UserMenu.toggle(); return true; } } catch (e) {}
    return false;
  }

  function route(action) {
    if (action === "home" || action === "presensi" || action === "security") return tryView(["dashboard", "home", "pusat-data", "portal-magang", "portal-tad", "security"]);
    if (action === "users") return tryView(["users", "manajemen-user", "user-management"]);
    if (action === "approval") return tryView(["approval", "approval_center", "approval-center", "approvals"]);
    if (action === "tamu") return tryView(["digitamu", "tamu", "guest"]);
    if (action === "eco") return tryView(["eco", "eco-office"]);
    if (action === "profile") return openProfile();
    if (action === "services" || action === "logbook" || action === "izin") {
      var btn = document.querySelector("#mobileServicesBtn,[data-mobile-services],.mobile-services-btn");
      if (btn) { btn.click(); return true; }
      return tryView(["services", "layanan", "kendaraan", "ruangan", "atk"]);
    }
    return false;
  }

  function renderItem(item, active) {
    var action = item[0], label = item[1], iconName = item[2];
    return '<button type="button" data-gesit-nav-action="' + action + '" aria-label="' + label + '"' + (active ? ' class="is-active" aria-current="page"' : '') + '>' + icon(iconName) + '<span>' + label + '</span></button>';
  }

  function activeAction() {
    var cur = "";
    try { cur = norm((window.Router && Router.current) || document.body.getAttribute("data-current-view") || ""); } catch (e) {}
    if (cur.indexOf("user") >= 0) return "users";
    if (cur.indexOf("approval") >= 0) return "approval";
    if (cur.indexOf("tamu") >= 0 || cur.indexOf("digitamu") >= 0) return "tamu";
    if (cur.indexOf("eco") >= 0) return "eco";
    return "home";
  }

  function apply() {
    if (!isMobile()) return;
    document.body.classList.add("gesit-mobile-shell");
    var nav = pickNav() || ensureFallback();
    findExistingNavs().forEach(function (n) { if (n !== nav) n.setAttribute("hidden", "hidden"); });
    nav.removeAttribute("hidden");
    nav.setAttribute("data-mobile-bottom-nav", "true");
    nav.classList.add("mobile-bottom-nav", "gesit-bottom-nav-normalized");
    var active = activeAction();
    nav.innerHTML = targetNav().map(function (item) { return renderItem(item, item[0] === active); }).join("");
  }

  function bind() {
    if (window.__GESIT_TASK4E_BOUND__) return;
    window.__GESIT_TASK4E_BOUND__ = true;
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-gesit-nav-action]");
      if (!btn) return;
      var nav = btn.closest("#mobileBottomNav,.mobile-bottom-nav,.bottom-nav,[data-mobile-bottom-nav],#gesitMobileFallbackNav");
      if (!nav) return;
      e.preventDefault();
      e.stopPropagation();
      route(btn.getAttribute("data-gesit-nav-action"));
      setTimeout(apply, 150);
    }, true);
  }

  function schedule() { [0, 250, 900, 1800].forEach(function (ms) { setTimeout(apply, ms); }); }
  function init() {
    bind(); schedule();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule, { passive: true });
    window.GESIT_TASK4E_BOTTOM_NAV = { version: VER, refresh: apply };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
