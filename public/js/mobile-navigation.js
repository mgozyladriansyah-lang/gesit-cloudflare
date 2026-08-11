/* GESIT V24 Final Mobile Navigation Baseline
   Fokus:
   - Tidak membuat banner fokus/role.
   - Tidak mengubah warna tema role.
   - Super Admin/Admin: Profil diganti User.
   - Tanpa DOM observer, tanpa periodic timer, tanpa patch Router.
*/
(function () {
  'use strict';
  var VER = '2026.08.11.24';
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
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle></svg>';
  }
  function currentView() { return (window.Router && Router.current) || document.body.getAttribute('data-current-view') || 'dashboard'; }
  function setCurrentView(view) { try { document.body.setAttribute('data-current-view', view || currentView()); } catch (e) {} }

  function safeUnlock() {
    var activeModal = Array.prototype.some.call(document.querySelectorAll('.modal-backdrop.is-open,.modal.show,.modal[open]'), function (m) {
      var r = m.getBoundingClientRect();
      var cs = getComputedStyle(m);
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
    safeUnlock();
    setCurrentView(view);
    if (window.Router && typeof Router.go === 'function') Router.go(view);
    else location.hash = '#' + view;
    closeSheet();
    setTimeout(function () {
      setCurrentView(view);
      refreshActive();
      if (window.GESITMobileCardUI && typeof GESITMobileCardUI.refresh === 'function') GESITMobileCardUI.refresh();
    }, 80);
  }
  function goTab(view, tab) {
    go(view);
    setTimeout(function () {
      var panel = document.querySelector('[data-view-panel="' + view + '"]') || document.querySelector('#view-' + view) || document;
      var btn = panel.querySelector('.tab[data-tab="' + tab + '"], [data-tab="' + tab + '"]');
      if (btn) btn.click();
      safeUnlock();
      refreshActive();
      if (window.GESITMobileCardUI && typeof GESITMobileCardUI.refresh === 'function') GESITMobileCardUI.refresh();
    }, 160);
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
        { type:'tab', view:'magang-self', tab:'profil', label:'Data Saya', icon:'user' },
        { type:'tab', view:'magang-self', tab:'tugas', label:'Tugas', icon:'briefcase' }
      ].filter(function (x) { return can(x.view); });
    }
    if (r === 'driver' || r === 'cso' || r === 'tad') {
      return [
        { type:'tab', view:'tad-self', tab:'presensi', label:'Presensi', icon:'clock' },
        { type:'tab', view:'tad-self', tab:'izin', label:'Izin', icon:'calendar' },
        { type:'view', view:'eco', label:'Eco', icon:'leaf' },
        { type:'tab', view:'tad-self', tab:'profil', label:'Profil', icon:'user' }
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
    var shell = byId('appShell') || document.body;
    var nav = byId('mobileBottomNav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'mobileBottomNav';
      nav.className = 'gesit-mobile-bottom-nav';
      nav.setAttribute('aria-label', 'Navigasi utama mobile');
      shell.appendChild(nav);
    }
    var backdrop = byId('mobileMenuBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobileMenuBackdrop';
      backdrop.className = 'gesit-mobile-sheet-backdrop';
      document.body.appendChild(backdrop);
    }
    var sheet = byId('mobileMenuSheet');
    if (!sheet) {
      sheet = document.createElement('section');
      sheet.id = 'mobileMenuSheet';
      sheet.className = 'gesit-mobile-sheet';
      sheet.setAttribute('aria-label', 'Menu mobile');
      sheet.innerHTML = '<div class="gesit-mobile-sheet-head"><div><strong>Menu GESIT</strong><span>Pilih modul yang ingin dikelola.</span></div><button type="button" id="mobileMenuClose" aria-label="Tutup">' + icon('x') + '</button></div><div class="gesit-mobile-menu-grid" id="mobileMenuGrid"></div>';
      document.body.appendChild(sheet);
    }
    backdrop.onclick = closeSheet;
    var close = byId('mobileMenuClose');
    if (close) close.onclick = closeSheet;
  }

  function renderBottom() {
    var nav = byId('mobileBottomNav');
    if (!nav) return;
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
    var m = {dashboard:'dashboard',digitamu:'users',kendaraan:'car',ruangan:'door',atk:'box',approval:'inbox',magang:'grad','magang-self':'grad',tad:'clock','tad-self':'clock',security:'shield',eco:'leaf',laporan:'chart',users:'usercog',pengaturan:'settings',agenda:'calendar'};
    return m[view] || 'dashboard';
  }
  function labelFor(view) {
    var m = {digitamu:'DIGITAMU',kendaraan:'Kendaraan',ruangan:'Ruangan',atk:'ATK',magang:'Magang',approval:'Approval',laporan:'Laporan',users:'Manajemen User',pengaturan:'Pengaturan',eco:'Eco Office'};
    return m[view] || view;
  }
  function menuRows() {
    var rows = [];
    var seen = {};
    document.querySelectorAll('#sidebarNav .nav-item[data-view], [data-view-menu]').forEach(function (n) {
      var view = n.getAttribute('data-view') || n.getAttribute('data-view-menu');
      if (!view || seen[view] || !can(view)) return;
      if (n.classList.contains('hidden') || n.classList.contains('is-locked')) return;
      seen[view] = true;
      var label = (n.querySelector('span') && n.querySelector('span').textContent) || n.getAttribute('aria-label') || view;
      rows.push({ view:view, label:label, icon:iconFor(view) });
    });
    if (!rows.length) {
      ['digitamu','kendaraan','ruangan','atk','magang','approval','laporan','users','pengaturan','eco'].forEach(function (v) {
        if (can(v)) rows.push({ view:v, label:labelFor(v), icon:iconFor(v) });
      });
    }
    return rows;
  }
  function renderSheet() {
    var grid = byId('mobileMenuGrid');
    if (!grid) return;
    grid.innerHTML = menuRows().map(function (r) {
      return '<button type="button" class="gesit-mobile-menu-item" data-mview="' + esc(r.view) + '">' + icon(r.icon) + '<span>' + esc(r.label) + '</span></button>';
    }).join('');
    grid.querySelectorAll('[data-mview]').forEach(function (btn) {
      btn.addEventListener('click', function () { go(btn.getAttribute('data-mview')); }, { passive:false });
    });
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
    try { document.documentElement.setAttribute('data-gesit-mobile-nav-v24', VER); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
