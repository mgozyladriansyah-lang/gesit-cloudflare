(function () {
  "use strict";

  var VER = "2026.08.11.26";

  function isMobile() {
    return window.matchMedia ? window.matchMedia("(max-width:768px)").matches : window.innerWidth <= 768;
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
    });
  }

  function norm(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function currentView() {
    return (window.Router && Router.current) || document.body.getAttribute("data-current-view") || "";
  }

  function activeRoot() {
    return document.querySelector(".view.is-active,[data-view-panel].is-active,.page.is-active") ||
      document.querySelector(".content") ||
      document.body;
  }

  function headers(table) {
    return Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) {
      return th.textContent.trim() || "Info";
    });
  }

  function isUsersArea(el) {
    return !!(el && el.closest('[data-view-panel="users"],#view-users,.users-view')) || currentView() === "users";
  }

  function labelTable(table) {
    var hs = headers(table);
    if (!hs.length) return false;

    table.querySelectorAll("tbody tr").forEach(function (tr) {
      Array.prototype.forEach.call(tr.children, function (td, i) {
        if (!td.getAttribute("data-label")) {
          td.setAttribute("data-label", hs[i] || "Info");
        }
      });
    });

    return true;
  }

  function cardTables() {
    if (!isMobile()) return;

    activeRoot().querySelectorAll("table").forEach(function (table) {
      if (table.closest("[data-no-mobile-card],.no-mobile-card") || isUsersArea(table)) return;
      if (labelTable(table)) table.classList.add("gesit-mobile-card-table");
    });
  }

  function tableOf(root) {
    return root ? root.querySelector("table") : null;
  }

  function headNorm(table) {
    return Array.prototype.map.call(table.querySelectorAll("thead th"), function (th) {
      return norm(th.textContent);
    });
  }

  function value(row, heads, labels) {
    var cells = Array.prototype.slice.call(row.children);

    for (var i = 0; i < heads.length; i++) {
      for (var j = 0; j < labels.length; j++) {
        if (heads[i].indexOf(labels[j]) >= 0) {
          return (cells[i] && cells[i].textContent || "").trim();
        }
      }
    }

    return "";
  }

  function actions(row) {
    var cells = Array.prototype.slice.call(row.children);
    var last = cells[cells.length - 1];
    if (!last) return "";

    var clone = last.cloneNode(true);
    clone.querySelectorAll("script,style").forEach(function (x) { x.remove(); });
    return clone.innerHTML;
  }

  function userCards() {
    if (!isMobile()) return;

    var root =
      document.querySelector('[data-view-panel="users"],#view-users,.users-view') ||
      (currentView() === "users" ? activeRoot() : null);

    if (!root) return;

    var table = tableOf(root);
    if (!table) return;

    var wrap = table.closest(".table-wrap,.table-responsive,.card,.data-table-wrap") || table.parentElement;
    var hs = headNorm(table);
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr")).filter(function (tr) {
      return tr.children.length;
    });

    if (!rows.length) return;

    var list = root.querySelector(".gesit-mobile-user-list");
    if (!list) {
      list = document.createElement("div");
      list.className = "gesit-mobile-user-list";
      wrap.parentNode.insertBefore(list, wrap.nextSibling);
    }

    list.innerHTML = rows.map(function (row) {
      var name = value(row, hs, ["nama", "name"]) || (row.children[0] && row.children[0].textContent.trim()) || "User";
      var username = value(row, hs, ["username", "user"]) || "";
      var role = value(row, hs, ["role", "peran"]) || "";
      var bagian = value(row, hs, ["bagian", "department", "unit"]) || "";
      var status = value(row, hs, ["status"]) || "";
      var initial = (name || username || "U").trim().slice(0, 2).toUpperCase();
      var statusClass = /aktif|active/i.test(status) ? "is-active" : "is-muted";

      return '<article class="gesit-user-card">' +
        '<div class="guc-avatar">' + esc(initial) + '</div>' +
        '<div class="guc-main">' +
        '<div class="guc-top"><strong>' + esc(name) + '</strong><span class="guc-status ' + statusClass + '">' + esc(status || "Status") + '</span></div>' +
        '<div class="guc-sub">' + esc(username) + (bagian ? " · " + esc(bagian) : "") + '</div>' +
        '<div class="guc-meta">' + (role ? '<span>' + esc(role) + '</span>' : "") + '</div>' +
        '<div class="guc-actions">' + actions(row) + '</div>' +
        '</div></article>';
    }).join("");

    table.classList.add("gesit-users-table-hidden-mobile");
  }

  function unlock() {
    var modal = document.querySelector(".modal-backdrop.is-open,.modal.show,.modal[open]");
    var sheet = document.querySelector("#mobileMenuSheet.is-open");

    if (!modal && !sheet) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.classList.remove("has-sheet-open", "user-menu-open", "modal-open", "has-modal-open", "approval-modal-open", "confirm-modal-open");
    }
  }

  function refresh() {
    try {
      document.body.classList.toggle("gesit-mobile-shell", isMobile());
      cardTables();
      userCards();
      unlock();
    } catch (e) {
      console.warn("[GESIT V26 mobile]", e);
    }
  }

  function burst() {
    [0, 250, 800, 1500, 3000].forEach(function (ms) {
      setTimeout(refresh, ms);
    });
  }

  function init() {
    refresh();
    burst();

    document.addEventListener("click", function () {
      setTimeout(refresh, 250);
      setTimeout(unlock, 900);
    }, true);

    document.addEventListener("touchend", function () {
      setTimeout(refresh, 250);
      setTimeout(unlock, 900);
    }, true);

    window.addEventListener("resize", function () {
      setTimeout(refresh, 120);
    }, { passive: true });

    window.addEventListener("orientationchange", burst, { passive: true });

    window.GESITMobileFinal = {
      version: VER,
      refresh: refresh
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
