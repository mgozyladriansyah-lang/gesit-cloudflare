(function () {
  "use strict";

  var DISABLED_KEY = "gesit:pwa:update-disabled";
  var BUILD = (window.GESIT_PWA_VERSION || "task1-freeze");
  var TEXT_PATTERNS = [
    "Versi baru GESIT tersedia",
    "PWA update prompt",
    "Halaman user mobile menjadi user card",
    "PWA update prompt dibuat",
    "Bottom nav Super Admin",
    "v2026.08.11.25",
    "v2026.08.11.26"
  ];

  function markDisabled() {
    try {
      localStorage.setItem(DISABLED_KEY, "1");
      localStorage.setItem("gesit:pwa:update-seen", BUILD);
      localStorage.setItem("gesit:pwa:update-seen:" + BUILD, "1");
      localStorage.setItem("gesit:pwa:update-seen:2026.08.11.25", "1");
      localStorage.setItem("gesit:pwa:update-seen:2026.08.11.26", "1");
    } catch (e) {}
  }

  function looksLikeUpdatePrompt(el) {
    if (!el || el === document.documentElement || el === document.body) return false;
    var id = (el.id || "").toLowerCase();
    var cls = (el.className || "").toString().toLowerCase();
    if (id.indexOf("pwaupdate") >= 0 || id.indexOf("updatebanner") >= 0) return true;
    if (cls.indexOf("pwa-update") >= 0 || cls.indexOf("update-banner") >= 0) return true;
    var txt = (el.textContent || "").trim();
    if (!txt) return false;
    return TEXT_PATTERNS.some(function (p) { return txt.indexOf(p) >= 0; });
  }

  function hideElement(el) {
    if (!el || el.dataset.gesitTask1Hidden === "1") return;
    el.dataset.gesitTask1Hidden = "1";
    el.setAttribute("aria-hidden", "true");
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("pointer-events", "none", "important");
    el.classList.remove("show", "is-visible", "is-open", "active");
  }

  function hidePrompts() {
    markDisabled();
    var selectors = [
      "#pwaUpdateBanner", ".pwa-update-banner", ".update-banner", "[data-pwa-update-banner]",
      ".pwa-toast", ".pwa-update", ".install-update", ".app-update-banner"
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(hideElement);
    });

    Array.prototype.slice.call(document.querySelectorAll("body *")).forEach(function (el) {
      if (looksLikeUpdatePrompt(el)) hideElement(el);
    });
  }

  function neutralizeGlobals() {
    markDisabled();
    window.GESIT_DISABLE_PWA_UPDATE_PROMPT = true;
    window.GESIT_PWA_CHANGELOG_URL = "";

    var noop = function () { markDisabled(); return false; };
    var names = ["showUpdateBanner", "notifyUpdate", "showUpdateToast", "promptUpdate", "showPwaUpdate"];

    if (!window.GESIT_PWA) window.GESIT_PWA = {};
    names.forEach(function (name) { window.GESIT_PWA[name] = noop; });

    window.showUpdateBanner = noop;
    window.notifyUpdate = noop;
    window.promptUpdate = noop;
  }

  function bindClicks() {
    document.addEventListener("click", function (ev) {
      var target = ev.target;
      var txt = (target && target.textContent || "").toLowerCase();
      var updateCard = target && target.closest && target.closest("#pwaUpdateBanner,.pwa-update-banner,.update-banner,[data-pwa-update-banner]");
      var updateTextParent = target && target.closest && Array.prototype.slice.call(document.querySelectorAll("body *")).find(function (el) {
        try { return el.contains(target) && looksLikeUpdatePrompt(el); } catch (e) { return false; }
      });

      if (updateCard || updateTextParent || txt.indexOf("perbarui") >= 0 || txt.indexOf("update") >= 0 || txt.indexOf("nanti") >= 0 || txt.indexOf("riwayat") >= 0) {
        ev.preventDefault();
        ev.stopPropagation();
        markDisabled();
        hidePrompts();
        return false;
      }
    }, true);
  }

  function observe() {
    if (!window.MutationObserver || !document.body) return;
    var mo = new MutationObserver(function () { hidePrompts(); neutralizeGlobals(); });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "hidden"] });
  }

  function init() {
    neutralizeGlobals();
    bindClicks();
    hidePrompts();
    observe();
    [50, 150, 350, 800, 1500, 3000, 6000].forEach(function (ms) {
      setTimeout(function () { neutralizeGlobals(); hidePrompts(); }, ms);
    });
    console.info("[GESIT TASK1] PWA update prompt disabled temporarily for stabilization.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
