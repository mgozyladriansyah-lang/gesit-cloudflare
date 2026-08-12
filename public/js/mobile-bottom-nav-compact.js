(function () {
  "use strict";

  var VER = "task4c-fix1-bottom-nav-compact";

  function isMobile() {
    return window.matchMedia
      ? window.matchMedia("(max-width: 768px)").matches
      : window.innerWidth <= 768;
  }

  function findBottomNav() {
    return document.querySelector(".mobile-bottom-nav, .bottom-nav, #mobileBottomNav, [data-mobile-bottom-nav]");
  }

  function compactNav() {
    try {
      var mobile = isMobile();
      document.body.classList.toggle("gesit-mobile-shell", mobile);
      if (!mobile) return;

      var nav = findBottomNav();
      if (!nav) return;

      nav.setAttribute("data-mobile-bottom-nav", "true");

      var h = Math.max(68, Math.ceil(nav.getBoundingClientRect().height || 78));
      h = Math.min(h, 86);
      document.documentElement.style.setProperty("--gesit-mobile-bottomnav-h", h + "px");

      var items = nav.querySelectorAll("button, a, [role='button'], .bottom-nav-item, .mobile-nav-item");
      items.forEach(function (item) {
        item.classList.add("gesit-bottom-nav-item");
        var svg = item.querySelector("svg");
        if (svg) {
          svg.setAttribute("width", "22");
          svg.setAttribute("height", "22");
        }
      });
    } catch (e) {
      console.warn("[GESIT TASK4C-FIX1 bottom nav]", e);
    }
  }

  function schedule() {
    setTimeout(compactNav, 0);
    setTimeout(compactNav, 250);
    setTimeout(compactNav, 900);
  }

  function init() {
    compactNav();
    schedule();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    window.addEventListener("pageshow", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule, { passive: true });
    document.addEventListener("click", function () { setTimeout(compactNav, 120); }, true);
    window.GESIT_TASK4C_BOTTOM_NAV = { version: VER, refresh: compactNav };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
