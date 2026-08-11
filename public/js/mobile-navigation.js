/* GESIT Mobile App Shell V5 UX
   - Critical CSS injected from JS to avoid HP cache/CSS mismatch.
   - Mobile topbar has brand/greeting before scroll, then switches to page title on scroll.
   - Role-aware bottom nav with stronger pressed/active feedback.
   - Profile button opens user menu reliably, with role-specific fallback. */
(function () {
  'use strict';

  function injectCss() {
    if (document.getElementById('gesit-mobile-shell-critical-css-v4')) return;
    var css = `
@media (max-width: 768px) {
  body.gesit-mobile-shell #appShell.is-visible { padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px)) !important; }
  body.gesit-mobile-shell .topbar {
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important;
    z-index: 11020 !important; min-height: calc(62px + env(safe-area-inset-top, 0px)) !important;
    padding: calc(7px + env(safe-area-inset-top, 0px)) 12px 8px !important;
    border-bottom: 1px solid rgba(15,118,110,.14) !important;
    background: rgba(255,255,255,.96) !important;
    box-shadow: 0 9px 28px rgba(15,23,42,.09) !important;
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    display:flex !important; align-items:center !important; gap:10px !important;
  }
  body.gesit-mobile-shell .main { padding-top: calc(72px + env(safe-area-inset-top, 0px)) !important; }
  body.gesit-mobile-shell .content { padding-top: 12px !important; padding-bottom: calc(118px + env(safe-area-inset-bottom, 0px)) !important; }
  body.gesit-mobile-shell .topbar-menu-btn, body.gesit-mobile-shell .topbar-now,
  body.gesit-mobile-shell .topbar-page-hint, body.gesit-mobile-shell .chip-label,
  body.gesit-mobile-shell .user-meta, body.gesit-mobile-shell .user-chip > svg[data-icon="chevron"] { display: none !important; }
  body.gesit-mobile-shell .topbar-context { display:none !important; }
}
#gesitMobileTopbarBrand {
  display:none;
}
@media (max-width: 768px) {
  body.gesit-mobile-shell #gesitMobileTopbarBrand {
    display:flex !important; flex:1 1 auto; min-width:0; align-items:center; gap:10px;
    padding-left:2px;
  }
  body.gesit-mobile-shell #gesitMobileTopbarBrand .mtb-logo {
    width:36px; height:36px; border-radius:14px; display:grid; place-items:center; flex:0 0 auto;
    color:#0f766e; background:linear-gradient(135deg,#ccfbf1,#ffffff); box-shadow:inset 0 0 0 1px rgba(20,184,166,.25), 0 8px 22px rgba(13,148,136,.14);
  }
  body.gesit-mobile-shell #gesitMobileTopbarBrand .mtb-logo svg { width:19px !important; height:19px !important; }
  body.gesit-mobile-shell #gesitMobileTopbarBrand .mtb-text { min-width:0; flex:1 1 auto; }
  body.gesit-mobile-shell #gesitMobileTopbarBrand .mtb-title {
    display:block; color:#0f172a; font-size:14.5px; font-weight:900; line-height:1.1;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-.2px;
  }
  body.gesit-mobile-shell #gesitMobileTopbarBrand .mtb-sub {
    display:block; margin-top:3px; color:#64748b; font-size:11.5px; font-weight:650; line-height:1.1;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }
  body.gesit-mobile-shell #gesitMobileTopbarBrand.is-scrolled .mtb-title { color:#0f766e; }
  body.gesit-mobile-shell #gesitMobileTopbarBrand.is-scrolled .mtb-logo { color:#fff; background:linear-gradient(135deg,#14b8a6,#0f766e); }
  body.gesit-mobile-shell .topbar-help-btn { width:42px !important; height:42px !important; border-radius:16px !important; flex:0 0 auto; }
  body.gesit-mobile-shell .topbar-approval-chip { border-radius:16px !important; min-width:44px !important; flex:0 0 auto; }
  body.gesit-mobile-shell .user-chip { width:46px !important; height:46px !important; padding:0 !important; display:grid !important; place-items:center !important; flex:0 0 auto; }
  body.gesit-mobile-shell .user-avatar { width:34px !important; height:34px !important; }
}
#mobileBottomNav.gesit-mobile-bottom-nav {
  position: fixed !important; left: 10px !important; right: 10px !important;
  bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important; z-index: 11000 !important;
  display: none !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 7px !important; padding: 8px !important; margin: 0 !important;
  border: 1px solid rgba(15,118,110,.18) !important; border-radius: 26px !important;
  background: rgba(255,255,255,.94) !important;
  box-shadow: 0 18px 50px rgba(15,23,42,.20), inset 0 1px 0 rgba(255,255,255,.75) !important;
  overflow: visible !important; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
}
@media (max-width: 768px) { body.gesit-mobile-shell #appShell.is-visible #mobileBottomNav.gesit-mobile-bottom-nav { display: grid !important; } }
#mobileBottomNav .gesit-mobile-nav-btn {
  appearance:none !important; -webkit-appearance:none !important; border:0 !important;
  border-radius:19px !important; background:transparent !important; color:#64748b !important;
  min-width:0 !important; min-height:58px !important; height:58px !important; padding:7px 4px 6px !important;
  display:grid !important; place-items:center !important; gap:4px !important;
  font:inherit !important; font-size:10.5px !important; font-weight:800 !important; line-height:1.08 !important;
  text-align:center !important; position:relative !important; isolation:isolate !important;
  transition:background .18s ease, color .18s ease, transform .16s ease, box-shadow .18s ease !important;
  -webkit-tap-highlight-color: transparent;
}
#mobileBottomNav .gesit-mobile-nav-btn svg { width:20px !important; height:20px !important; max-width:20px !important; max-height:20px !important; stroke-width:2.15 !important; position:relative; z-index:1; transition:transform .16s ease; }
#mobileBottomNav .gesit-mobile-nav-btn span { display:block !important; position:relative; z-index:1; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; max-width:100% !important; }
#mobileBottomNav .gesit-mobile-nav-btn:active, #mobileBottomNav .gesit-mobile-nav-btn.is-pressing { transform: translateY(-2px) scale(.96) !important; background:rgba(20,184,166,.10) !important; }
#mobileBottomNav .gesit-mobile-nav-btn.is-active {
  color:#0f766e !important; background:linear-gradient(180deg,#ffffff,#ecfeff) !important;
  box-shadow:0 12px 26px rgba(13,148,136,.20), inset 0 0 0 1px rgba(20,184,166,.34) !important;
  transform:translateY(-6px) !important;
}
#mobileBottomNav .gesit-mobile-nav-btn.is-active::before {
  content:""; position:absolute; left:50%; top:-13px; width:44px; height:5px; border-radius:999px;
  transform:translateX(-50%); background:linear-gradient(90deg,#14b8a6,#0d9488); box-shadow:0 8px 18px rgba(13,148,136,.34);
}
#mobileBottomNav .gesit-mobile-nav-btn.is-active::after {
  content:""; position:absolute; inset:8px 10px auto; height:22px; border-radius:999px;
  background:radial-gradient(circle at 50% 0, rgba(20,184,166,.18), transparent 75%); z-index:0;
}
#mobileBottomNav .gesit-mobile-nav-btn.is-active svg { transform: translateY(-1px) scale(1.08); }
#mobileMenuBackdrop.gesit-mobile-sheet-backdrop { position:fixed !important; inset:0 !important; z-index:10980 !important; display:none !important; background:rgba(15,23,42,.30) !important; }
#mobileMenuBackdrop.gesit-mobile-sheet-backdrop.is-open { display:block !important; }
#mobileMenuSheet.gesit-mobile-sheet {
  position:fixed !important; left:0 !important; right:0 !important; bottom:0 !important; z-index:10990 !important;
  display:none !important; max-height:min(78dvh,620px) !important;
  padding:12px 14px calc(100px + env(safe-area-inset-bottom, 0px)) !important;
  border-radius:30px 30px 0 0 !important; background:#fff !important;
  box-shadow:0 -24px 70px rgba(15,23,42,.24) !important; overflow:auto !important; -webkit-overflow-scrolling:touch;
}
#mobileMenuSheet.gesit-mobile-sheet.is-open { display:block !important; }
#mobileMenuSheet .gesit-mobile-sheet-head { position:sticky; top:-12px; z-index:2; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:4px 0 12px; background:#fff; }
#mobileMenuSheet .gesit-mobile-sheet-title { font-size:15px; font-weight:900; color:#0f172a; }
#mobileMenuSheet .gesit-mobile-sheet-sub { font-size:12px; color:#64748b; margin-top:2px; }
#mobileMenuSheet .gesit-mobile-close { width:40px; height:40px; border:0; border-radius:14px; background:#f1f5f9; color:#334155; display:grid; place-items:center; }
#mobileMenuSheet .gesit-mobile-close svg { width:18px !important; height:18px !important; }
#mobileMenuSheet .gesit-mobile-menu-grid { display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:10px !important; }
#mobileMenuSheet .gesit-mobile-menu-item {
  border:1px solid #e2e8f0 !important; border-radius:18px !important; background:#fff !important; color:#0f172a !important;
  padding:12px !important; min-height:78px !important; text-align:left !important; display:grid !important; align-content:space-between !important; gap:8px !important;
  font:inherit !important; box-shadow:0 8px 26px rgba(15,23,42,.05) !important; position:relative; overflow:hidden;
}
#mobileMenuSheet .gesit-mobile-menu-item::after { content:""; position:absolute; inset:auto -22px -32px auto; width:74px; height:74px; border-radius:50%; background:rgba(20,184,166,.10); }
#mobileMenuSheet .gesit-mobile-menu-item svg { width:21px !important; height:21px !important; max-width:21px !important; max-height:21px !important; color:#0d9488; }
#mobileMenuSheet .gesit-mobile-menu-item span { display:block; font-size:12.5px; font-weight:800; line-height:1.2; position:relative; z-index:1; }
#mobileMenuSheet .gesit-mobile-menu-item.is-active { border-color:rgba(13,148,136,.38) !important; background:#f0fdfa !important; }
@media (min-width: 769px) { #mobileBottomNav, #mobileMenuSheet, #mobileMenuBackdrop { display:none !important; } }

/* V5: mobile scroll and guided tour compatibility */
@media (max-width: 768px) {
  html, body.gesit-mobile-shell {
    min-height: 100% !important;
    height: auto !important;
    overflow-y: auto !important;
    overscroll-behavior-y: contain;
  }
  body.gesit-mobile-shell .main,
  body.gesit-mobile-shell .content,
  body.gesit-mobile-shell .view.is-active {
    min-height: auto !important;
    height: auto !important;
    overflow: visible !important;
  }
  body.gesit-mobile-shell .view.is-active {
    padding-bottom: calc(138px + env(safe-area-inset-bottom, 0px)) !important;
  }
}
body.gesit-tour-active #mobileBottomNav,
body.gesit-tour-active #mobileMenuSheet,
body.gesit-tour-active #mobileMenuBackdrop {
  display: none !important;
  pointer-events: none !important;
}
body.gesit-tour-active .topbar {
  z-index: 9000 !important;
}
body.gesit-tour-active .tour-blocker { z-index: 13000 !important; }
body.gesit-tour-active .tour-spot { z-index: 13001 !important; }
body.gesit-tour-active .tour-tip {
  z-index: 13002 !important;
  max-height: calc(100dvh - 28px - env(safe-area-inset-bottom, 0px)) !important;
  overflow: auto !important;
}
body.gesit-tour-active .tour-tip-actions {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
}
body.gesit-tour-active .tour-tip-actions button {
  min-height: 42px !important;
  touch-action: manipulation !important;
}
@media (max-width: 768px) {
  body.gesit-tour-active .tour-tip {
    left: 12px !important;
    right: 12px !important;
    bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;
    top: auto !important;
    width: auto !important;
    max-width: none !important;
    padding-bottom: 14px !important;
  }
}

`;
    var st = document.createElement('style');
    st.id = 'gesit-mobile-shell-critical-css-v4';
    st.textContent = css;
    document.head.appendChild(st);
  }

  var MobileNav = {
    mq: null, ready: false, nav: null, sheet: null, backdrop: null, activeTab: '', lastRole: '',
    init: function () {
      if (MobileNav.ready) return;
      MobileNav.ready = true;
      injectCss();
      MobileNav.mq = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
      MobileNav.ensureDom();
      MobileNav.patchRouter();
      MobileNav.patchAuthReady();
      MobileNav.bindResize();
      MobileNav.bindScroll();
      MobileNav.observeTour();
      MobileNav.observeMenu();
      MobileNav.observeTabs();
      MobileNav.refresh();
      setTimeout(MobileNav.refresh, 300);
      setTimeout(MobileNav.refresh, 1200);
      setInterval(function () {
        var role = MobileNav.role();
        if (role !== MobileNav.lastRole) MobileNav.refresh();
      }, 1000);
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
        MobileNav.sheet.innerHTML = '<div class="gesit-mobile-sheet-head"><div><div class="gesit-mobile-sheet-title">Menu GESIT</div><div class="gesit-mobile-sheet-sub">Pilih modul sesuai akses akun Anda.</div></div><button type="button" class="gesit-mobile-close" id="mobileMenuClose" aria-label="Tutup menu"></button></div><div class="gesit-mobile-menu-grid" id="mobileMenuGrid"></div>';
        document.body.appendChild(MobileNav.sheet);
      }
      MobileNav.backdrop.onclick = MobileNav.closeSheet;
      var close = document.getElementById('mobileMenuClose');
      if (close) close.onclick = MobileNav.closeSheet;
      if (typeof iconSvg === 'function' && close) close.innerHTML = iconSvg('x');
      MobileNav.ensureTopbarBrand();
    },
    ensureTopbarBrand: function () {
      var topbar = document.querySelector('.topbar');
      if (!topbar) return;
      var brand = document.getElementById('gesitMobileTopbarBrand');
      if (!brand) {
        brand = document.createElement('div');
        brand.id = 'gesitMobileTopbarBrand';
        brand.innerHTML = '<span class="mtb-logo"></span><span class="mtb-text"><span class="mtb-title"></span><span class="mtb-sub"></span></span>';
        topbar.insertBefore(brand, topbar.firstChild);
      }
      var logo = brand.querySelector('.mtb-logo');
      if (logo && typeof iconSvg === 'function') logo.innerHTML = iconSvg('dashboard');
      MobileNav.updateTopbarBrand();
    },
    patchRouter: function () {
      if (!window.Router || Router.__mobilePatchV4) return;
      var oldGo = Router.go;
      Router.go = function (view) {
        var ret = oldGo.apply(Router, arguments);
        MobileNav.closeSheet();
        MobileNav.activeTab = '';
        setTimeout(MobileNav.refresh, 40);
        return ret;
      };
      Router.__mobilePatchV4 = true;
    },
    patchAuthReady: function () {
      if (!window.App || App.__mobilePatchV4) return;
      if (typeof App.onUserReady === 'function') {
        var old = App.onUserReady;
        App.onUserReady = function () {
          var ret = old.apply(App, arguments);
          setTimeout(MobileNav.refresh, 80);
          setTimeout(MobileNav.refresh, 500);
          return ret;
        };
        App.__mobilePatchV4 = true;
      }
    },
    bindResize: function () {
      var fn = function () { MobileNav.applyMode(); MobileNav.updateActive(); MobileNav.updateTopbarBrand(); };
      if (MobileNav.mq && MobileNav.mq.addEventListener) MobileNav.mq.addEventListener('change', fn);
      else if (MobileNav.mq && MobileNav.mq.addListener) MobileNav.mq.addListener(fn);
      window.addEventListener('resize', fn);
      window.addEventListener('orientationchange', fn);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) MobileNav.refresh(); });
    },
    bindScroll: function () {
      window.addEventListener('scroll', MobileNav.updateTopbarBrand, { passive: true });
      document.addEventListener('scroll', MobileNav.updateTopbarBrand, { passive: true });
    },

    observeTour: function () {
      var sync = function () {
        var active = !!document.querySelector('.tour-tip, .tour-blocker, .tour-spot');
        document.body.classList.toggle('gesit-tour-active', active);
        if (active) MobileNav.closeSheet();
      };
      sync();
      if (window.MutationObserver) {
        new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
      }
      document.addEventListener('click', function () { setTimeout(sync, 60); }, true);
    },
    observeMenu: function () {
      var nav = document.getElementById('sidebarNav');
      if (!nav || !window.MutationObserver) return;
      var timer = null;
      new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(MobileNav.renderSheet, 120); })
        .observe(nav, { attributes: true, subtree: true, childList: true, attributeFilter: ['class', 'style'] });
    },
    observeTabs: function () {
      document.addEventListener('click', function (e) {
        var tab = e.target && e.target.closest ? e.target.closest('.tab[data-tab]') : null;
        if (!tab) return;
        MobileNav.activeTab = tab.getAttribute('data-tab') || '';
        setTimeout(MobileNav.updateActive, 30);
      }, true);
    },
    role: function () { return String(window.Auth && Auth.user && Auth.user.role || '').toLowerCase(); },
    userName: function () { return String(window.Auth && Auth.user && (Auth.user.nama || Auth.user.nama_lengkap || Auth.user.username) || ''); },
    can: function (view) { return !!(window.Router && Router.canOpen && Router.canOpen(view)); },
    landing: function () {
      var role = MobileNav.role();
      if (window.ROLE_SCOPE && ROLE_SCOPE[role] && ROLE_SCOPE[role].landing) return ROLE_SCOPE[role].landing;
      if (window.Router && Router.allowed && Router.allowed.length) return Router.allowed[0];
      return 'dashboard';
    },
    applyMode: function () {
      var active = !!(MobileNav.mq ? MobileNav.mq.matches : window.innerWidth <= 768);
      document.body.classList.toggle('gesit-mobile-shell', active);
      if (!active) MobileNav.closeSheet();
    },
    refresh: function () {
      injectCss();
      MobileNav.lastRole = MobileNav.role();
      MobileNav.applyMode();
      MobileNav.ensureTopbarBrand();
      MobileNav.renderBottom();
      MobileNav.renderSheet();
      MobileNav.updateActive();
      MobileNav.updateTopbarBrand();
      if (typeof renderIcons === 'function') { renderIcons(MobileNav.nav); renderIcons(MobileNav.sheet); }
    },
    currentMeta: function () {
      var view = window.Router && Router.current || MobileNav.landing();
      var meta = window.VIEW_META && VIEW_META[view] || { title: view, sub: '' };
      return { view: view, title: meta.title || view, sub: meta.sub || '' };
    },
    updateTopbarBrand: function () {
      var brand = document.getElementById('gesitMobileTopbarBrand');
      if (!brand) return;
      var y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var meta = MobileNav.currentMeta();
      var role = MobileNav.role();
      var nama = MobileNav.userName();
      var isScrolled = y > 42;
      brand.classList.toggle('is-scrolled', isScrolled);
      var title = brand.querySelector('.mtb-title');
      var sub = brand.querySelector('.mtb-sub');
      var logo = brand.querySelector('.mtb-logo');
      if (logo && typeof iconSvg === 'function') logo.innerHTML = iconSvg(isScrolled ? MobileNav.iconFor(meta.view) : 'rocket');
      if (title) title.textContent = isScrolled ? meta.title : 'GESIT Mobile';
      if (sub) {
        if (isScrolled) sub.textContent = meta.sub || 'Halaman aktif';
        else sub.textContent = (nama ? 'Halo, ' + nama : 'Siap bekerja') + (role ? ' · ' + MobileNav.roleLabel(role) : '');
      }
    },
    roleLabel: function (role) {
      return { super_admin:'Super Admin', admin:'Admin', kabag:'Kabag', staff:'Staff', magang:'Magang', driver:'Driver', cso:'CSO', security:'Security', tad:'TAD' }[role] || role;
    },
    iconFor: function (view) {
      var map = { dashboard:'dashboard', digitamu:'users', kendaraan:'car', ruangan:'door', atk:'box', approval:'inbox', magang:'grad', 'magang-self':'grad', tad:'clock', 'tad-self':'clock', security:'shield', agenda:'calendar', budaya:'star', sosmed:'megaphone', berita:'news', eco:'leaf', laporan:'chart', users:'usercog', pengaturan:'settings' };
      return map[view] || 'info';
    },
    labelFor: function (view) { var meta = window.VIEW_META && VIEW_META[view]; return (meta && meta.title) || view; },
    bottomItems: function () {
      var role = MobileNav.role();
      if (role === 'magang') {
        return [
          { type:'tab', view:'magang-self', tab:'presensi', label:'Presensi', icon:'clock' },
          { type:'tab', view:'magang-self', tab:'logbook', label:'Logbook', icon:'clipboard' },
          { type:'tab', view:'magang-self', tab:'izin', label:'Izin', icon:'calendar' },
          { type:'tab', view:'magang-self', tab:'profil', label:'Profil', icon:'user' }
        ].filter(function (it) { return MobileNav.can(it.view); });
      }
      if (role === 'driver' || role === 'cso' || role === 'tad') {
        return [
          { type:'tab', view:'tad-self', tab:'presensi', label:'Presensi', icon:'clock' },
          { type:'tab', view:'tad-self', tab:'izin', label:'Izin', icon:'calendar' },
          { type:'view', view:'eco', label:'Eco', icon:'leaf' },
          { type:'tab', view:'tad-self', tab:'profil', label:'Profil', icon:'user' }
        ].filter(function (it) { return MobileNav.can(it.view); });
      }
      if (role === 'security') {
        return [
          { type:'view', view:'security', label:'Patroli', icon:'shield' },
          { type:'view', view:'digitamu', label:'Tamu', icon:'users' },
          { type:'view', view:'eco', label:'Eco', icon:'leaf' },
          { type:'profile', label:'Profil', icon:'user' }
        ].filter(function (it) { return !it.view || MobileNav.can(it.view); });
      }
      if (role === 'admin' || role === 'super_admin' || role === 'kabag') {
        var third = MobileNav.can('approval') ? { type:'view', view:'approval', label:'Approval', icon:'inbox' } : { type:'view', view:'laporan', label:'Laporan', icon:'chart' };
        var fourth = (role === 'admin' || role === 'super_admin') && MobileNav.can('users')
          ? { type:'view', view:'users', label:'User', icon:'usercog' }
          : { type:'profile', label:'Profil', icon:'user' };
        return [
          { type:'view', view:'dashboard', label:'Beranda', icon:'dashboard' },
          { type:'sheet', label:'Layanan', icon:'menu' },
          third,
          fourth
        ].filter(function (it) { return !it.view || MobileNav.can(it.view); });
      }
      return [
        { type:'view', view:MobileNav.landing(), label:'Beranda', icon:MobileNav.iconFor(MobileNav.landing()) },
        { type:'sheet', label:'Layanan', icon:'menu' },
        MobileNav.can('eco') ? { type:'view', view:'eco', label:'Eco', icon:'leaf' } : { type:'view', view:'digitamu', label:'Tamu', icon:'users' },
        { type:'profile', label:'Profil', icon:'user' }
      ].filter(function (it) { return !it.view || MobileNav.can(it.view); }).slice(0, 4);
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
        btn.addEventListener('pointerdown', function () { btn.classList.add('is-pressing'); }, { passive: true });
        btn.addEventListener('pointerup', function () { setTimeout(function () { btn.classList.remove('is-pressing'); }, 150); }, { passive: true });
        btn.addEventListener('pointercancel', function () { btn.classList.remove('is-pressing'); }, { passive: true });
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
      }, 150);
    },
    openProfile: function () {
      var role = MobileNav.role();
      if (role === 'magang' && MobileNav.can('magang-self')) { MobileNav.goTab('magang-self', 'profil'); return; }
      if ((role === 'driver' || role === 'cso' || role === 'tad') && MobileNav.can('tad-self')) { MobileNav.goTab('tad-self', 'profil'); return; }
      var menu = document.getElementById('userMenu');
      if (menu) {
        menu.classList.toggle('is-open');
        return;
      }
      var chip = document.getElementById('userChip');
      if (chip) { chip.click(); return; }
      if (MobileNav.can('pengaturan')) MobileNav.go('pengaturan');
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
    openSheet: function () { MobileNav.renderSheet(); if (MobileNav.sheet) MobileNav.sheet.classList.add('is-open'); if (MobileNav.backdrop) MobileNav.backdrop.classList.add('is-open'); document.body.style.overflow = 'hidden'; },
    closeSheet: function () { if (MobileNav.sheet) MobileNav.sheet.classList.remove('is-open'); if (MobileNav.backdrop) MobileNav.backdrop.classList.remove('is-open'); if (!document.querySelector('.modal-backdrop.is-open,#mobileMenuSheet.is-open,.tour-tip')) document.body.style.overflow = ''; },
    updateActive: function () {
      var cur = window.Router && Router.current;
      Array.prototype.slice.call(document.querySelectorAll('.gesit-mobile-nav-btn,.gesit-mobile-menu-item')).forEach(function (el) {
        var v = el.getAttribute('data-view') || el.getAttribute('data-mview');
        var tab = el.getAttribute('data-tab-target') || '';
        var type = el.getAttribute('data-mnav');
        var on = v === cur && (!tab || tab === MobileNav.activeTab || MobileNav.activeTab === '');
        if (type === 'sheet' || type === 'profile') on = false;
        el.classList.toggle('is-active', !!on);
      });
    },
    escape: function (s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
    escapeAttr: function (s) { return MobileNav.escape(s); }
  };

  window.GESITMobileNav = MobileNav;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', MobileNav.init); else MobileNav.init();
})();
