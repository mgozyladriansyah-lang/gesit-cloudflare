(function () {
  "use strict";

  var VER = "task4b-mobile-shell-scroll";

  function isMobile() {
    return window.matchMedia
      ? window.matchMedia("(max-width: 768px)").matches
      : window.innerWidth <= 768;
  }

  function findTopbar() {
    return document.querySelector(".topbar, header.topbar, .app-topbar, .mobile-topbar, .app-header, header.app-header");
  }

  function apply() {
    try {
      var mobile = isMobile();
      document.body.classList.toggle("gesit-mobile-shell", mobile);
      if (!mobile) return;

      var topbar = findTopbar();
      if (topbar) {
        var h = Math.max(56, Math.ceil(topbar.getBoundingClientRect().height || 64));
        document.documentElement.style.setProperty("--gesit-mobile-topbar-h", h + "px");
      }

      var bottomNav = document.querySelector(".mobile-bottom-nav, .bottom-nav, #mobileBottomNav");
      if (bottomNav) {
        var bh = Math.max(72, Math.ceil(bottomNav.getBoundingClientRect().height || 86));
        document.documentElement.style.setProperty("--gesit-mobile-bottomnav-h", bh + "px");
      }
    } catch (e) {
      console.warn("[GESIT TASK4B mobile shell]", e);
    }
  }

  function schedule() {
    setTimeout(apply, 0);
    setTimeout(apply, 250);
    setTimeout(apply, 900);
  }

  function init() {
    apply();
    schedule();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    window.addEventListener("pageshow", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule, { passive: true });
    document.addEventListener("click", function () { setTimeout(apply, 150); }, true);
    window.GESIT_TASK4_MOBILE_SHELL = { version: VER, refresh: apply };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
