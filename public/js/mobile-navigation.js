/* GESIT Mobile App Shell V2
   Role-aware bottom navigation, mobile sheet menu, fixed-topbar friendly. */
(function () {
  'use strict';
  var MobileNav = {
    mq: null, ready: false, nav: null, sheet: null, backdrop: null,
    activeTab: '',
    init: function () {
      if (MobileNav.ready) return;
      MobileNav.ready = true;
      MobileNav.mq = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
      MobileNav.ensureDom();
      MobileNav.patchRouter();
      MobileNav.bindResize();
      MobileNav.observeMenu();
      MobileNav.observeTabs();
      MobileNav.refresh();
      setTimeout(MobileNav.refresh, 350);
      setTimeout(MobileNav.refresh, 1200);
    },
    ensureDom: function () {
      var shell = document.getElementById('appShell') || document.body;
      MobileNav.nav = document.getElementById('mobileBottomNav');
      if (!MobileNav.nav) {
        MobileNav.nav = document.createElement('nav');
        MobileNav.nav.id = 'mobileBottomNav';
        MobileNav.nav.className = 'gesit-mobile-bottom-nav';
        MobileNav.nav.setAttribute('aria-label', 'Navigasi utama mobile');
        shell.appendChild(MobileNav.nav);
      }
      MobileNav.backdrop = document.getElementById('mobileMenuBackdrop');
      if (!MobileNav.backdrop) {
        MobileNav.backdrop = document.createElement('div');
        MobileNav.backdrop.id = 'mobileMenuBackdrop';
        MobileNav.backdrop.className = 'gesit-mobile-sheet-backdrop';
        document.body.appendChild(MobileNav.backdrop);
      }
      MobileNav.sheet = document.getElementById('mobileMenuSheet');
      if (!MobileNav.sheet) {
        MobileNav.sheet = document.createElement('section');
        MobileNav.sheet.id = 'mobileMenuSheet';
        MobileNav.sheet.className = 'gesit-mobile-sheet';
        MobileNav.sheet.setAttribute('aria-label', 'Daftar menu aplikasi');
        MobileNav.sheet.innerHTML = '<div class="gesit-mobile-sheet-head"><div><div class="gesit-mobile-sheet-title">Menu GESIT</div><div class="gesit-mobile-sheet-sub">Pilih modul tanpa membuka sidebar panjang.</div></div><button type="button" class="gesit-mobile-close" id="mobileMenuClose" aria-label="Tutup menu"></button></div><div class="gesit-mobile-menu-grid" id="mobileMenuGrid"></div>';
        document.body.appendChild(MobileNav.sheet);
      }
      MobileNav.backdrop.addEventListener('click', MobileNav.closeSheet);
      var close = document.getElementById('mobileMenuClose');
      if (close) close.addEventListener('click', MobileNav.closeSheet);
      if (typeof iconSvg === 'function' && close) close.innerHTML = iconSvg('x');
    },
    bindResize: function () {
      var fn = function () { MobileNav.applyMode(); MobileNav.updateActive(); };
      if (MobileNav.mq && MobileNav.mq.addEventListener) MobileNav.mq.addEventListener('change', fn);
      else if (MobileNav.mq && MobileNav.mq.addListener) MobileNav.mq.addListener(fn);
      window.addEventListener('resize', fn);
      window.addEventListener('orientationchange', fn);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) MobileNav.refresh(); });
    },
    observeMenu: function () {
      var nav = document.getElementById('sidebarNav');
      if (!nav || !window.MutationObserver) return;
      var timer = null;
      new MutationObserver(function () {
        clearTimeout(timer); timer = setTimeout(MobileNav.renderSheet, 120);
      }).observe(nav, { attributes: true, subtree: true, childList: true, attributeFilter: ['class', 'style'] });
    },
    observeTabs: function () {
      document.addEventListener('click', function (e) {
        var tab = e.target && e.target.closest ? e.target.closest('.tab[data-tab]') : null;
        if (!tab) return;
        MobileNav.activeTab = tab.getAttribute('data-tab') || '';
        setTimeout(MobileNav.updateActive, 30);
      }, true);
    },
    patchRouter: function () {
      if (!window.Router || Router.__mobilePatchV2) return;
      var oldGo = Router.go;
      Router.go = function (view) {
        var ret = oldGo.apply(Router, arguments);
        MobileNav.closeSheet();
        MobileNav.activeTab = '';
        setTimeout(MobileNav.updateActive, 0);
        setTimeout(MobileNav.renderSheet, 80);
        return ret;
      };
      Router.__mobilePatchV2 = true;
    },
    applyMode: function () {
      var active = !!(MobileNav.mq ? MobileNav.mq.matches : window.innerWidth <= 768);
      document.body.classList.toggle('gesit-mobile-shell', active);
      if (!active) MobileNav.closeSheet();
    },
    refresh: function () {
      MobileNav.applyMode();
      MobileNav.renderBottom();
      MobileNav.renderSheet();
      MobileNav.updateActive();
      if (typeof renderIcons === 'function') { renderIcons(MobileNav.nav); renderIcons(MobileNav.sheet); }
    },
    role: function () { return String(window.Auth && Auth.user && Auth.user.role || '').toLowerCase(); },
    can: function (view) { return !!(window.Router && Router.canOpen && Router.canOpen(view)); },
    landing: function () {
      var role = MobileNav.role();
      if (window.ROLE_SCOPE && ROLE_SCOPE[role] && ROLE_SCOPE[role].landing) return ROLE_SCOPE[role].landing;
      if (window.Router && Router.allowed && Router.allowed.length) return Router.allowed[0];
      return 'dashboard';
    },
    labelFor: function (view) { var meta = window.VIEW_META && VIEW_META[view]; return (meta && meta.title) || view; },
    iconFor: function (view) {
      var map = { dashboard:'dashboard', digitamu:'users', kendaraan:'car', ruangan:'door', atk:'box', approval:'inbox', magang:'grad', 'magang-self':'grad', tad:'clock', 'tad-self':'clock', security:'shield', agenda:'calendar', budaya:'star', sosmed:'megaphone', berita:'news', eco:'leaf', laporan:'chart', users:'usercog', pengaturan:'settings' };
      return map[view] || 'info';
    },
    bottomItems: function () {
      var role = MobileNav.role();
      if (role === 'magang') {
        return [
          { type:'tab', view:'magang-self', tab:'presensi', label:'Presensi', icon:'clock' },
          { type:'tab', view:'magang-self', tab:'logbook', label:'Logbook', icon:'clipboard' },
          { type:'tab', view:'magang-self', tab:'tugas', label:'Tugas', icon:'star' },
          { type:'tab', view:'magang-self', tab:'profil', label:'Data Saya', icon:'user' }
        ];
      }
      if (role === 'driver' || role === 'cso' || role === 'tad') {
        return [
          { type:'tab', view:'tad-self', tab:'presensi', label:'Presensi', icon:'clock' },
          { type:'tab', view:'tad-self', tab:'izin', label:'Izin', icon:'calendar' },
          { type:'view', view:'eco', label:'Eco', icon:'leaf' },
          { type:'tab', view:'tad-self', tab:'profil', label:'Data Saya', icon:'user' }
        ];
      }
      if (role === 'security') {
        return [
          { type:'view', view:'security', label:'Security', icon:'shield' },
          { type:'view', view:'digitamu', label:'Tamu', icon:'users' },
          { type:'view', view:'eco', label:'Eco', icon:'leaf' },
          { type:'profile', label:'Profil', icon:'user' }
        ];
      }
      var items = [
        { type:'view', view:'dashboard', label:'Beranda', icon:'dashboard' },
        { type:'sheet', label:'Layanan', icon:'menu' }
      ];
      if (MobileNav.can('approval')) items.push({ type:'view', view:'approval', label:'Approval', icon:'inbox' });
      else if (MobileNav.can('digitamu')) items.push({ type:'view', view:'digitamu', label:'Tamu', icon:'users' });
      else items.push({ type:'view', view:MobileNav.landing(), label:'Portal', icon:MobileNav.iconFor(MobileNav.landing()) });
      items.push({ type:'profile', label:'Profil', icon:'user' });
      return items.filter(function (it) { return !it.view || MobileNav.can(it.view); }).slice(0,4);
    },
    renderBottom: function () {
      if (!MobileNav.nav) return;
      var items = MobileNav.bottomItems();
      MobileNav.nav.innerHTML = items.map(function (it) {
        var a = it.view ? ' data-view="' + it.view + '"' : '';
        var t = it.tab ? ' data-tab-target="' + it.tab + '"' : '';
        return '<button type="button" class="gesit-mobile-nav-btn" data-mnav="' + it.type + '"' + a + t + '>' + (typeof iconSvg === 'function' ? iconSvg(it.icon) : '') + '<span>' + MobileNav.escape(it.label) + '</span></button>';
      }).join('');
      Array.prototype.slice.call(MobileNav.nav.querySelectorAll('button')).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var type = btn.getAttribute('data-mnav');
          if (type === 'view') MobileNav.go(btn.getAttribute('data-view'));
          else if (type === 'tab') MobileNav.goTab(btn.getAttribute('data-view'), btn.getAttribute('data-tab-target'));
          else if (type === 'sheet') MobileNav.openSheet();
          else if (type === 'profile') MobileNav.openProfile();
        });
      });
      if (typeof renderIcons === 'function') renderIcons(MobileNav.nav);
    },
    go: function (view) { if (view && window.Router && Router.go) Router.go(view); },
    goTab: function (view, tab) {
      if (!view) return;
      MobileNav.go(view);
      MobileNav.activeTab = tab || '';
      setTimeout(function () {
        var panel = document.querySelector('[data-view-panel="' + view + '"]');
        var btn = panel && panel.querySelector('.tabs .tab[data-tab="' + tab + '"]');
        if (btn) btn.click();
        MobileNav.updateActive();
      }, 120);
    },
    renderSheet: function () {
      var grid = document.getElementById('mobileMenuGrid'); if (!grid) return;
      var src = Array.prototype.slice.call(document.querySelectorAll('#sidebarNav .nav-item[data-view]'));
      var seen = {}, rows = [];
      src.forEach(function (node) {
        var view = node.getAttribute('data-view');
        if (!view || seen[view] || view === 'coming-soon') return;
        if (node.classList.contains('hidden') || node.classList.contains('is-locked')) return;
        if (!MobileNav.can(view)) return;
        seen[view] = true;
        var span = node.querySelector('span');
        rows.push({ view:view, label: span ? span.textContent : MobileNav.labelFor(view), icon:MobileNav.iconFor(view) });
      });
      grid.innerHTML = rows.map(function (r) {
        return '<button type="button" class="gesit-mobile-menu-item" data-mview="' + MobileNav.escapeAttr(r.view) + '">' + (typeof iconSvg === 'function' ? iconSvg(r.icon) : '') + '<span>' + MobileNav.escape(r.label) + '</span></button>';
      }).join('');
      Array.prototype.slice.call(grid.querySelectorAll('[data-mview]')).forEach(function (btn) { btn.addEventListener('click', function () { MobileNav.go(btn.getAttribute('data-mview')); }); });
      if (typeof renderIcons === 'function') renderIcons(grid);
      MobileNav.updateActive();
    },
    openProfile: function () { var chip = document.getElementById('userChip'); if (chip) chip.click(); },
    openSheet: function () { MobileNav.renderSheet(); if (MobileNav.sheet) MobileNav.sheet.classList.add('is-open'); if (MobileNav.backdrop) MobileNav.backdrop.classList.add('is-open'); document.body.style.overflow = 'hidden'; },
    closeSheet: function () { if (MobileNav.sheet) MobileNav.sheet.classList.remove('is-open'); if (MobileNav.backdrop) MobileNav.backdrop.classList.remove('is-open'); if (!document.querySelector('.modal-backdrop.is-open')) document.body.style.overflow = ''; },
    updateActive: function () {
      var cur = window.Router && Router.current;
      Array.prototype.slice.call(document.querySelectorAll('.gesit-mobile-nav-btn, .gesit-mobile-menu-item')).forEach(function (el) {
        var v = el.getAttribute('data-view') || el.getAttribute('data-mview');
        var tab = el.getAttribute('data-tab-target') || '';
        var on = v === cur && (!tab || tab === MobileNav.activeTab || MobileNav.activeTab === '');
        if (el.getAttribute('data-mnav') === 'sheet') on = false;
        if (el.getAttribute('data-mnav') === 'profile') on = false;
        el.classList.toggle('is-active', !!on);
      });
    },
    escape: function (s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
    escapeAttr: function (s) { return MobileNav.escape(s); }
  };
  window.GESITMobileNav = MobileNav;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', MobileNav.init); else MobileNav.init();
})();
