(function () {
  "use strict";

  var VER = "task4d-role-bottom-nav-dedupe";

  function isMobile() {
    return window.matchMedia ? window.matchMedia("(max-width:768px)").matches : window.innerWidth <= 768;
  }

  function norm(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function getUser() {
    try {
      if (window.Store && typeof Store.get === "function") {
        return Store.get("user") || Store.get("authUser") || Store.get("currentUser") || null;
      }
    } catch (e) {}
    try {
      if (window.Auth && Auth.user) return Auth.user;
      if (window.Auth && Auth.currentUser) return Auth.currentUser;
    } catch (e) {}
    try {
      var raw = localStorage.getItem("gesit:user") || localStorage.getItem("GESIT_USER") || localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {}
    return null;
  }

  function getRole() {
    var u = getUser() || {};
    return norm(u.role || u.peran || u.user_role || "");
  }

  function navRoot() {
    return document.querySelector("#mobileBottomNav,.mobile-bottom-nav,.bottom-nav,[data-mobile-bottom-nav]");
  }

  function navItems(root) {
    if (!root) return [];
    var candidates = root.querySelectorAll("button,a,[role='button'],.bottom-nav-item,.mobile-nav-item,.gesit-bottom-nav-item");
    var list = Array.prototype.filter.call(candidates, function (el) {
      return el && el.closest("#mobileBottomNav,.mobile-bottom-nav,.bottom-nav,[data-mobile-bottom-nav]") === root;
    });
    if (list.length) return list;
    return Array.prototype.filter.call(root.children || [], function (el) { return !!el; });
  }

  function labelOf(el) {
    return norm(el.innerText || el.textContent || el.getAttribute("aria-label") || el.title || "");
  }

  function setLabel(el, label) {
    el.setAttribute("aria-label", label);
    el.title = label;
    var spans = el.querySelectorAll("span");
    if (spans.length) {
      spans[spans.length - 1].textContent = label;
      return;
    }
    var labelNode = document.createElement("span");
    labelNode.textContent = label;
    el.appendChild(labelNode);
  }

  function tryView(names) {
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      try {
        if (window.Router && typeof Router.canOpen === "function" && Router.canOpen(name) === false) continue;
      } catch (e) {}
      try {
        if (window.Router && typeof Router.go === "function") {
          Router.go(name);
          return true;
        }
      } catch (e) {}
      try {
        var target = document.querySelector('[data-view="' + name + '"],[data-view-panel="' + name + '"]');
        if (target) { target.click(); return true; }
      } catch (e) {}
    }
    return false;
  }

  function openProfile() {
    var btn = document.querySelector("#userMenuBtn,#userMenuToggle,.user-menu-toggle,.topbar-user,.avatar-btn,.user-chip");
    if (btn) { btn.click(); return true; }
    try {
      if (window.UserMenu && typeof UserMenu.toggle === "function") {
        UserMenu.toggle();
        return true;
      }
    } catch (e) {}
    return false;
  }

  function bindAction(el, action) {
    el.dataset.gesitNavAction = action;
  }

  function routeAction(action) {
    if (action === "users") return tryView(["users", "manajemen-user", "user-management"]);
    if (action === "approval") return tryView(["approval", "approval_center", "approval-center", "approvals"]);
    if (action === "tamu") return tryView(["digitamu", "tamu", "guest"]);
    if (action === "profile") return openProfile();
    if (action === "home") return tryView(["dashboard", "home", "pusat-data"]);
    return false;
  }

  function intercept() {
    if (window.__GESIT_TASK4D_INTERCEPT__) return;
    window.__GESIT_TASK4D_INTERCEPT__ = true;
    document.addEventListener("click", function (e) {
      var item = e.target.closest("[data-gesit-nav-action]");
      if (!item) return;
      var root = navRoot();
      if (!root || !root.contains(item)) return;
      var action = item.dataset.gesitNavAction;
      if (!action || action === "services") return;
      e.preventDefault();
      e.stopPropagation();
      routeAction(action);
    }, true);
  }

  function fixNav() {
    if (!isMobile()) return;
    var root = navRoot();
    if (!root) return;
    root.setAttribute("data-mobile-bottom-nav", "true");
    root.classList.add("gesit-bottom-nav-normalized");

    var items = navItems(root);
    if (!items.length) return;

    var role = getRole();
    var isAdmin = /^(super_admin|admin)$/i.test(role);
    var isSecurity = /security/i.test(role);
    var isMagang = /magang/i.test(role);
    var isTad = /(driver|cso|tad)/i.test(role);

    items.forEach(function (el) {
      var label = labelOf(el);
      if (label.indexOf("beranda") >= 0 || label.indexOf("home") >= 0) bindAction(el, "home");
      if (label.indexOf("layanan") >= 0) bindAction(el, "services");
    });

    if (isAdmin && items.length >= 4) {
      setLabel(items[0], "Beranda"); bindAction(items[0], "home");
      setLabel(items[1], "Layanan"); bindAction(items[1], "services");
      setLabel(items[2], "User"); bindAction(items[2], "users");
      setLabel(items[3], "Approval"); bindAction(items[3], "approval");
      return;
    }

    if (isMagang && items.length >= 4) {
      setLabel(items[0], "Presensi"); bindAction(items[0], "home");
      setLabel(items[1], "Logbook"); bindAction(items[1], "services");
      setLabel(items[2], "Izin"); bindAction(items[2], "services");
      setLabel(items[3], "Profil"); bindAction(items[3], "profile");
      return;
    }

    if (isSecurity && items.length >= 4) {
      setLabel(items[0], "Security"); bindAction(items[0], "home");
      setLabel(items[1], "Tamu"); bindAction(items[1], "tamu");
      setLabel(items[2], "Layanan"); bindAction(items[2], "services");
      setLabel(items[3], "Profil"); bindAction(items[3], "profile");
      return;
    }

    if (isTad && items.length >= 4) {
      setLabel(items[0], "Presensi"); bindAction(items[0], "home");
      setLabel(items[1], "Izin"); bindAction(items[1], "services");
      setLabel(items[2], "Eco"); bindAction(items[2], "services");
      setLabel(items[3], "Profil"); bindAction(items[3], "profile");
      return;
    }

    items.forEach(function (el) {
      var label = labelOf(el);
      if (label === "menu" || label.indexOf("menu") >= 0 || label.indexOf("profil") >= 0) {
        setLabel(el, "Profil");
        bindAction(el, "profile");
      }
    });
  }

  function schedule() {
    setTimeout(fixNav, 0);
    setTimeout(fixNav, 250);
    setTimeout(fixNav, 900);
    setTimeout(fixNav, 1800);
  }

  function init() {
    intercept();
    schedule();
    document.addEventListener("click", function () { setTimeout(fixNav, 150); }, true);
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    window.GESIT_TASK4D_ROLE_NAV = { version: VER, refresh: fixNav };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
