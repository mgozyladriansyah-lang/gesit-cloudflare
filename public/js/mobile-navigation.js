/* GESIT V25 Final Mobile Navigation Baseline
   - Tanpa banner fokus.
   - Tanpa warna role baru.
   - Super Admin/Admin: tombol Profil diganti User.
   - Tidak memakai MutationObserver, setInterval, atau patch Router.
*/
(function () {
  'use strict';
  var VER = '2026.08.11.25';
  var mq = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
  function isMobile() { return mq ? mq.matches : window.innerWidth <= 768; }
  function byId(id) { return document.getElementById(id); }
  function role() { return String(window.Auth && Auth.user && Auth.user.role || '').toLowerCase(); }
  function can(view) {
    if (!view) return true;
    try {
      if (window.Router && typeof Router.canOpen === 'function') return !!Router.canOpen(view);
      if (window.Router && typeof Router.canAccess === 'function') return !!Router.canAccess(view);
      if (window.Router && Array.isArray(Router.allowed)) return Router.allowed.indexOf(view) !== -1;
    } catch (e) {}
    return true;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function icon(name) {
    if (typeof window.iconSvg === 'function') return iconSvg(name);
    var paths = {
      dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
      menu:'<path d="M4 7h16M4 12h16M4 17h16"></path>',
      usercog:'<path d="M15 19a6 6 0 0 0-12 0"></path><circle cx="9" cy="7" r="4"></circle><circle cx="17" cy="17" r="3"></circle><path d="M17 14v-2M17 22v-2M14.4 15.5l-1.7-1M21.3 20l-1.7-1M14.4 18.5l-1.7 1M21.3 14l-1.7 1"></path>',
      inbox:'<path d="M4 4h16l-2 9h-4a2 2 0 0 1-4 0H6L4 4z"></path><path d="M4 13v7h16v-7"></path>',
      chart:'<path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M8 15l3-3 3 2 5-6"></path>',
      users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
      clock:'<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
      clipboard:'<path d="M8 4h8l1 2h3v14H4V6h3l1-2z"></path><path d="M9 12h6M9 16h6"></path>',
      briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5h8v2M3 12h18"></path>',
      calendar:'<rect x="3" y="4" width="18" height="18" rx="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path>',
      leaf:'<path d="M20 4c-8 0-14 6-14 14"></path><path d="M20 4c0 8-6 14-14 14"></path>',
      shield:'<path d="M12 2l8 4v6c0 5-3.4 9-8 10-4.6-1-8-5-8-10V6l8-4z"></path>',
      x:'<path d="M18 6L6 18M6 6l12 12"></path>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.dashboard) + '</svg>';
  }
  function currentView() { return (window.Router && Router.current) || document.body.getAttribute('data-current-view') || 'dashboard'; }
  function setCurrentView(view) { try { document.body.setAttribute('data-current-view', view || currentView()); } catch (e) {} }
  function safeUnlock() {
    var activeModal = Array.prototype.some.call(document.querySelectorAll('.modal-backdrop.is-open,.modal.show,.modal[open]'), function (m) {
      var r = m.getBoundingClientRect(); var cs = getComputedStyle(m);
      return r.width > 10 && r.height > 10 && cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    if (!activeModal && !document.querySelector('#mobileMenuSheet.is-open')) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open','has-modal-open','approval-modal-open','confirm-modal-open','public-link-panel-open','has-sheet-open','user-menu-open');
    }
  }
  function go(view) {
    if (!view) return;
    closeSheet(); safeUnlock(); setCurrentView(view);
    if (window.Router && typeof Router.go === 'function') Router.go(view); else location.hash = '#' + view;
    setTimeout(function () {
      setCurrentView(view); refreshActive();
      if (window.GESITMobileCardUI && typeof GESITMobileCardUI.refresh === 'function') GESITMobileCardUI.refresh();
      if (window.GESITMobileUserUI && typeof GESITMobileUserUI.refresh === 'function') GESITMobileUserUI.refresh();
    }, 120);
  }
  function goTab(view, tab) {
    go(view);
    setTimeout(function () {
      var panel = document.querySelector('[data-view-panel="' + view + '"]') || document.querySelector('#view-' + view) || document;
      var btn = panel.querySelector('.tab[data-tab="' + tab + '"], [data-tab="' + tab + '"]');
      if (btn) btn.click();
      safeUnlock(); refreshActive();
    }, 180);
  }
  function itemsForRole() {
    var r = role();
    if (r === 'super_admin' || r === 'admin') {
      return [
        { type:'view', view:'dashboard', label:'Beranda', icon:'dashboard' },
        { type:'sheet', label:'Layanan', icon:'menu' },
        { type:'view', view:'users', label:'User', icon:'usercog' },
        can('approval') ? { type:'view', view:'approval', label:'Approval', icon:'inbox' } : { type:'view', view:'laporan', label:'Laporan', icon:'chart' }
      ].filter(function (x) { return !x.view || can(x.view); });
    }
    if (r === 'kabag') {
      return [
        { type:'view', view:'dashboard', label:'Beranda', icon:'dashboard' },
        { type:'view', view:'approval', label:'Approval', icon:'inbox' },
        { type:'sheet', label:'Layanan', icon:'menu' },
        { type:'view', view:'laporan', label:'Laporan', icon:'chart' }
      ].filter(function (x) { return !x.view || can(x.view); });
    }
    if (r === 'magang') {
      return [
        { type:'tab', view:'magang-self', tab:'presensi', label:'Presensi', icon:'clock' },
        { type:'tab', view:'magang-self', tab:'logbook', label:'Logbook', icon:'clipboard' },
        { type:'tab', view:'magang-self', tab:'profil', label:'Data Saya', icon:'users' },
        { type:'tab', view:'magang-self', tab:'tugas', label:'briefcase' === 'never' ? 'Tugas' : 'Tugas', icon:'briefcase' }
      ].filter(function (x) { return can(x.view); });
    }
    if (r === 'driver' || r === 'cso' || r === 'tad') {
      return [
        { type:'tab', view:'tad-self', tab:'presensi', label:'Presensi', icon:'clock' },
        { type:'tab', view:'tad-self', tab:'izin', label:'Izin', icon:'calendar' },
        { type:'view', view:'eco', label:'Eco', icon:'leaf' },
        { type:'tab', view:'tad-self', tab:'profil', label:'Profil', icon:'users' }
      ].filter(function (x) { return !x.view || can(x.view); });
    }
    if (r === 'security') {
      return [
        { type:'view', view:'security', label:'Patroli', icon:'shield' },
        { type:'view', view:'digitamu', label:'Tamu', icon:'users' },
        { type:'view', view:'eco', label:'Eco', icon:'leaf' },
        { type:'sheet', label:'Menu', icon:'menu' }
      ].filter(function (x) { return !x.view || can(x.view); });
    }
    return [
      { type:'view', view:'dashboard', label:'Beranda', icon:'dashboard' },
      { type:'sheet', label:'Layanan', icon:'menu' },
      can('digitamu') ? { type:'view', view:'digitamu', label:'Tamu', icon:'users' } : { type:'view', view:'eco', label:'Eco', icon:'leaf' },
      { type:'sheet', label:'Menu', icon:'menu' }
    ].filter(function (x) { return !x.view || can(x.view); });
  }
  function ensureDom() {
    var shell = document.getElementById('appShell') || document.body;
    var nav = byId('mobileBottomNav');
    if (!nav) { nav = document.createElement('nav'); nav.id = 'mobileBottomNav'; nav.className = 'gesit-mobile-bottom-nav'; nav.setAttribute('aria-label', 'Navigasi utama mobile'); shell.appendChild(nav); }
    var backdrop = byId('mobileMenuBackdrop');
    if (!backdrop) { backdrop = document.createElement('div'); backdrop.id = 'mobileMenuBackdrop'; backdrop.className = 'gesit-mobile-sheet-backdrop'; document.body.appendChild(backdrop); }
    var sheet = byId('mobileMenuSheet');
    if (!sheet) {
      sheet = document.createElement('section'); sheet.id = 'mobileMenuSheet'; sheet.className = 'gesit-mobile-sheet'; sheet.setAttribute('aria-label', 'Menu mobile');
      sheet.innerHTML = '<div class="gesit-mobile-sheet-head"><div><strong>Menu GESIT</strong><span>Pilih modul yang ingin dikelola.</span></div><button type="button" id="mobileMenuClose" aria-label="Tutup">' + icon('x') + '</button></div><div class="gesit-mobile-menu-grid" id="mobileMenuGrid"></div>';
      document.body.appendChild(sheet);
    }
    backdrop.onclick = closeSheet;
    var close = byId('mobileMenuClose'); if (close) close.onclick = closeSheet;
  }
  function renderBottom() {
    var nav = byId('mobileBottomNav'); if (!nav) return;
    nav.innerHTML = itemsForRole().slice(0, 4).map(function (it) {
      return '<button type="button" class="gesit-mobile-nav-btn" data-mnav="' + esc(it.type) + '"' + (it.view ? ' data-view="' + esc(it.view) + '"' : '') + (it.tab ? ' data-tab-target="' + esc(it.tab) + '"' : '') + '>' + icon(it.icon) + '<span>' + esc(it.label) + '</span></button>';
    }).join('');
    nav.querySelectorAll('[data-mnav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-mnav');
        if (type === 'view') go(btn.getAttribute('data-view'));
        else if (type === 'tab') goTab(btn.getAttribute('data-view'), btn.getAttribute('data-tab-target'));
        else openSheet();
      }, { passive:false });
    });
    refreshActive();
  }
  function iconFor(view) {
    var m = {dashboard:'dashboard',digitamu:'users',kendaraan:'car',ruangan:'calendar',atk:'inbox',approval:'inbox',magang:'users','magang-self':'users',tad:'clock','tad-self':'clock',security:'shield',eco:'leaf',laporan:'chart',users:'usercog',pengaturan:'settings',agenda:'calendar'};
    return m[view] || 'dashboard';
  }
  function labelFor(view) {
    var m = {digitamu:'DIGITAMU',kendaraan:'Kendaraan',ruangan:'Ruangan',atk:'ATK',magang:'Magang',approval:'Approval',laporan:'Laporan',users:'Manajemen User',pengaturan:'Pengaturan',eco:'Eco Office'};
    return m[view] || view;
  }
  function menuRows() {
    var rows = [], seen = {};
    document.querySelectorAll('#sidebarNav .nav-item[data-view], [data-view-menu]').forEach(function (n) {
      var view = n.getAttribute('data-view') || n.getAttribute('data-view-menu');
      if (!view || seen[view] || !can(view)) return;
      if (n.classList.contains('hidden') || n.classList.contains('is-locked')) return;
      seen[view] = true;
      var label = (n.querySelector('span') && n.querySelector('span').textContent) || n.getAttribute('aria-label') || labelFor(view);
      rows.push({ view:view, label:label, icon:iconFor(view) });
    });
    if (!rows.length) ['digitamu','kendaraan','ruangan','atk','magang','approval','laporan','users','pengaturan','eco'].forEach(function (v) { if (can(v)) rows.push({ view:v, label:labelFor(v), icon:iconFor(v) }); });
    return rows;
  }
  function renderSheet() {
    var grid = byId('mobileMenuGrid'); if (!grid) return;
    grid.innerHTML = menuRows().map(function (r) { return '<button type="button" class="gesit-mobile-menu-item" data-mview="' + esc(r.view) + '">' + icon(r.icon) + '<span>' + esc(r.label) + '</span></button>'; }).join('');
    grid.querySelectorAll('[data-mview]').forEach(function (btn) { btn.addEventListener('click', function () { go(btn.getAttribute('data-mview')); }, { passive:false }); });
  }
  function openSheet() { renderSheet(); byId('mobileMenuSheet').classList.add('is-open'); byId('mobileMenuBackdrop').classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeSheet() { var s=byId('mobileMenuSheet'), b=byId('mobileMenuBackdrop'); if(s) s.classList.remove('is-open'); if(b) b.classList.remove('is-open'); safeUnlock(); }
  function refreshActive() {
    var cur = currentView();
    document.querySelectorAll('#mobileBottomNav [data-mnav], #mobileMenuGrid [data-mview]').forEach(function (el) {
      var v = el.getAttribute('data-view') || el.getAttribute('data-mview');
      el.classList.toggle('is-active', !!v && v === cur);
    });
  }
  function applyMode() { document.body.classList.toggle('gesit-mobile-shell', isMobile()); if (!isMobile()) closeSheet(); }
  function refresh() { ensureDom(); applyMode(); renderBottom(); renderSheet(); refreshActive(); safeUnlock(); }
  function init() {
    refresh();
    window.addEventListener('resize', function () { setTimeout(refresh, 80); }, { passive:true });
    window.addEventListener('orientationchange', function () { setTimeout(refresh, 140); }, { passive:true });
    document.addEventListener('click', function () { setTimeout(function () { safeUnlock(); refreshActive(); }, 700); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeSheet(); safeUnlock(); } }, true);
    window.GESITMobileNav = { version: VER, refresh: refresh, go: go, goTab: goTab, safeUnlock: safeUnlock };
    try { document.documentElement.setAttribute('data-gesit-mobile-nav-v25', VER); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
