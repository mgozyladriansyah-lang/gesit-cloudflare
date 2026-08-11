/* GESIT V24 Mobile Card UI
   - Desktop tetap tabel.
   - Mobile memakai card/list dari tabel.
   - Safe drawer untuk detail table agar tidak freeze karena modal desktop.
   - Tidak memakai observer berat atau timer loop.
*/
(function () {
  'use strict';
  var VER = '2026.08.11.24';
  var busy = false;
  function isMobile() { return window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function icon(name) { return typeof window.iconSvg === 'function' ? iconSvg(name) : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle></svg>'; }
  function visible(el) { if (!el) return false; var cs = getComputedStyle(el); var r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 10 && r.height > 10; }
  function activeRoot() { return document.querySelector('.view.is-active,[data-view-panel].is-active,.page.is-active') || document.querySelector('.content') || document.body; }

  function headersFor(table) { return Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); }); }
  function labelCells(table) {
    var headers = headersFor(table);
    if (!headers.length) return;
    table.querySelectorAll('tbody tr').forEach(function (tr) {
      Array.prototype.forEach.call(tr.children, function (td, i) {
        if (!td.getAttribute('data-label')) td.setAttribute('data-label', headers[i] || 'Info');
      });
    });
  }
  function tableToCards(table) {
    if (!table || table.dataset.mobileCardReady === VER) return;
    labelCells(table);
    table.dataset.mobileCardReady = VER;
    table.classList.add('gesit-mobile-card-table');
  }
  function refreshTables() {
    if (!isMobile()) return;
    var root = activeRoot();
    root.querySelectorAll('table').forEach(function (table) {
      if (table.closest('[data-no-mobile-card], .no-mobile-card')) return;
      tableToCards(table);
    });
  }

  function makeSafeDrawer() {
    var drawer = document.getElementById('gesitMobileSafeDrawer');
    if (drawer) return drawer;
    drawer = document.createElement('section');
    drawer.id = 'gesitMobileSafeDrawer';
    drawer.className = 'gesit-mobile-safe-drawer';
    drawer.innerHTML = '<div class="gmsd-scrim" data-gmsd-close="1"></div><div class="gmsd-card"><div class="gmsd-head"><strong>Detail</strong><button type="button" data-gmsd-close="1" aria-label="Tutup">' + icon('x') + '</button></div><div class="gmsd-body" id="gesitMobileSafeDrawerBody"></div></div>';
    document.body.appendChild(drawer);
    drawer.addEventListener('click', function (e) { if (e.target.closest('[data-gmsd-close]')) closeDrawer(); }, true);
    return drawer;
  }
  function closeDrawer() { var d=document.getElementById('gesitMobileSafeDrawer'); if(d) d.classList.remove('is-open'); unlockFreeze(); }
  function openDrawerFromRow(tr) {
    if (!tr) return false;
    var cells = Array.prototype.map.call(tr.children, function (td) {
      return { label: td.getAttribute('data-label') || 'Info', value: td.textContent.trim() };
    }).filter(function (x) { return x.value; });
    if (!cells.length) return false;
    var drawer = makeSafeDrawer();
    document.getElementById('gesitMobileSafeDrawerBody').innerHTML = cells.map(function (x) {
      return '<div class="gmsd-row"><span>' + esc(x.label) + '</span><strong>' + esc(x.value) + '</strong></div>';
    }).join('');
    drawer.classList.add('is-open');
    return true;
  }

  function unlockFreeze() {
    var visibleModal = Array.prototype.some.call(document.querySelectorAll('.modal-backdrop.is-open,.modal.show,.modal[open]'), visible);
    var d = document.getElementById('gesitMobileSafeDrawer');
    var visibleDrawer = d && d.classList.contains('is-open') && visible(d);
    var visibleSheet = document.querySelector('#mobileMenuSheet.is-open');
    if (!visibleModal && !visibleDrawer && !visibleSheet) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open','has-modal-open','approval-modal-open','confirm-modal-open','public-link-panel-open','has-sheet-open','user-menu-open');
      document.querySelectorAll('.modal-backdrop:not(.is-open):not(.show), .overlay.is-stale, .tour-blocker.is-stale').forEach(function (x) { x.remove(); });
    }
  }

  function guardedClick(e) {
    if (!isMobile()) return;
    var t = e.target;
    var detail = t.closest('[data-detail], [data-action="detail"], .btn-detail, .js-detail, button[title*="Detail"], a[title*="Detail"], button[aria-label*="Detail"], a[aria-label*="Detail"]');
    if (detail && !detail.dataset.allowDesktopModal) {
      var tr = detail.closest('tr');
      if (tr && openDrawerFromRow(tr)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return;
      }
    }
    window.setTimeout(unlockFreeze, 900);
    window.setTimeout(unlockFreeze, 1800);
  }

  function refresh() {
    if (busy) return;
    busy = true;
    window.requestAnimationFrame(function () {
      try { refreshTables(); unlockFreeze(); } finally { busy = false; }
    });
  }
  function init() {
    refresh();
    document.addEventListener('click', guardedClick, true);
    document.addEventListener('touchend', guardedClick, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeDrawer(); unlockFreeze(); } }, true);
    window.addEventListener('resize', function () { setTimeout(refresh, 80); }, { passive:true });
    window.addEventListener('orientationchange', function () { setTimeout(refresh, 140); }, { passive:true });
    window.GESITMobileCardUI = { version: VER, refresh: refresh, unlock: unlockFreeze, openDrawerFromRow: openDrawerFromRow };
    try { document.documentElement.setAttribute('data-gesit-mobile-card-ui-v24', VER); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
