/* GESIT Mobile App Shell Patch
   Bottom navigation + mobile menu sheet. Loaded last, after Router/Auth. */
(function () {
  'use strict';
  var MobileNav = {
    mq: null,
    ready: false,
    nav: null,
    sheet: null,
    backdrop: null,
    init: function () {
      if (MobileNav.ready) return;
      MobileNav.ready = true;
      MobileNav.mq = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
      MobileNav.ensureDom();
      MobileNav.patchRouter();
      MobileNav.bindResize();
      MobileNav.observeMenu();
      MobileNav.refresh();
      setTimeout(MobileNav.refresh, 400);
      setTimeout(MobileNav.refresh, 1200);
    },
    ensureDom: function () {
      var shell = document.getElementById('appShell') || document.body;
      if (!document.getElementById('mobileBottomNav')) {
        MobileNav.nav = document.createElement('nav');
        MobileNav.nav.id = 'mobileBottomNav';
        MobileNav.nav.className = 'gesit-mobile-bottom-nav';
        MobileNav.nav.setAttribute('aria-label', 'Navigasi utama mobile');
        shell.appendChild(MobileNav.nav);
      } else MobileNav.nav = document.getElementById('mobileBottomNav');
      if (!document.getElementById('mobileMenuBackdrop')) {
        MobileNav.backdrop = document.createElement('div');
        MobileNav.backdrop.id = 'mobileMenuBackdrop';
        MobileNav.backdrop.className = 'gesit-mobile-sheet-backdrop';
        document.body.appendChild(MobileNav.backdrop);
      } else MobileNav.backdrop = document.getElementById('mobileMenuBackdrop');
      if (!document.getElementById('mobileMenuSheet')) {
        MobileNav.sheet = document.createElement('section');
        MobileNav.sheet.id = 'mobileMenuSheet';
        MobileNav.sheet.className = 'gesit-mobile-sheet';
        MobileNav.sheet.setAttribute('aria-label', 'Daftar menu aplikasi');
        MobileNav.sheet.innerHTML =
          '<div class="gesit-mobile-sheet-head">' +
            '<div><div class="gesit-mobile-sheet-title">Menu GESIT</div>' +
            '<div class="gesit-mobile-sheet-sub">Pilih modul tanpa membuka sidebar panjang.</div></div>' +
            '<button type="button" class="gesit-mobile-close" id="mobileMenuClose" aria-label="Tutup menu"></button>' +
          '</div>' +
          '<div class="gesit-mobile-menu-grid" id="mobileMenuGrid"></div>';
        document.body.appendChild(MobileNav.sheet);
      } else MobileNav.sheet = document.getElementById('mobileMenuSheet');
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
      var mo = new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(MobileNav.renderSheet, 120);
      });
      mo.observe(nav, { attributes: true, subtree: true, childList: true, attributeFilter: ['class', 'style'] });
    },
    patchRouter: function () {
      if (!window.Router || Router.__mobilePatch) return;
      var oldGo = Router.go;
      Router.go = function (view) {
        var ret = oldGo.apply(Router, arguments);
        MobileNav.closeSheet();
        setTimeout(MobileNav.updateActive, 0);
        setTimeout(MobileNav.renderSheet, 80);
        return ret;
      };
      Router.__mobilePatch = true;
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
      if (typeof renderIcons === 'function') {
        renderIcons(MobileNav.nav);
        renderIcons(MobileNav.sheet);
      }
    },
    role: function () {
      return String(window.Auth && Auth.user && Auth.user.role || '').toLowerCase();
    },
    landing: function () {
      var role = MobileNav.role();
      if (window.ROLE_SCOPE && ROLE_SCOPE[role] && ROLE_SCOPE[role].landing) return ROLE_SCOPE[role].landing;
      if (window.Router && Router.allowed && Router.allowed.length) return Router.allowed[0];
      return 'dashboard';
    },
    labelFor: function (view) {
      var meta = window.VIEW_META && VIEW_META[view];
      return (meta && meta.title) || view;
    },
    iconFor: function (view) {
      var map = {
        dashboard: 'dashboard', digitamu: 'users', kendaraan: 'car', ruangan: 'door', atk: 'box',
        approval: 'inbox', magang: 'grad', 'magang-self': 'grad', tad: 'clock', 'tad-self': 'clock',
        security: 'shield', agenda: 'calendar', budaya: 'star', sosmed: 'megaphone', berita: 'news',
        eco: 'leaf', laporan: 'chart', users: 'usercog', pengaturan: 'settings'
      };
      return map[view] || 'info';
    },
    can: function (view) {
      return !!(window.Router && Router.canOpen && Router.canOpen(view));
    },
    secondaryView: function () {
      var role = MobileNav.role();
      if (role === 'magang' && MobileNav.can('eco')) return 'eco';
      if ((role === 'driver' || role === 'cso' || role === 'tad') && MobileNav.can('eco')) return 'eco';
      if (role === 'security' && MobileNav.can('digitamu')) return 'digitamu';
      if (MobileNav.can('approval')) return 'approval';
      if (MobileNav.can('digitamu')) return 'digitamu';
      if (MobileNav.can('eco')) return 'eco';
      return null;
    },
    renderBottom: function () {
      if (!MobileNav.nav) return;
      var home = MobileNav.landing();
      var second = MobileNav.secondaryView();
      var items = [
        { type: 'view', view: home, label: home === 'dashboard' ? 'Beranda' : 'Portal', icon: MobileNav.iconFor(home) },
        { type: 'sheet', label: 'Layanan', icon: 'menu' }
      ];
      if (second) items.push({ type: 'view', view: second, label: second === 'approval' ? 'Approval' : MobileNav.shortLabel(second), icon: MobileNav.iconFor(second) });
      items.push({ type: 'profile', label: 'Profil', icon: 'user' });
      MobileNav.nav.innerHTML = items.map(function (it) {
        var attr = it.view ? ' data-view="' + it.view + '"' : '';
        return '<button type="button" class="gesit-mobile-nav-btn" data-mnav="' + it.type + '"' + attr + '>' +
          (typeof iconSvg === 'function' ? iconSvg(it.icon) : '') + '<span>' + MobileNav.escape(it.label) + '</span></button>';
      }).join('');
      Array.prototype.slice.call(MobileNav.nav.querySelectorAll('button')).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var type = btn.getAttribute('data-mnav');
          if (type === 'view') MobileNav.go(btn.getAttribute('data-view'));
          else if (type === 'sheet') MobileNav.openSheet();
          else if (type === 'profile') MobileNav.openProfile();
        });
      });
      if (typeof renderIcons === 'function') renderIcons(MobileNav.nav);
    },
    shortLabel: function (view) {
      var label = MobileNav.labelFor(view);
      return label.replace('Pusat ', '').replace('Tenaga Alih Daya', 'TAD').replace('Kendaraan & BBM', 'Kendaraan').replace('Portal ', '');
    },
    renderSheet: function () {
      var grid = document.getElementById('mobileMenuGrid');
      if (!grid) return;
      var src = Array.prototype.slice.call(document.querySelectorAll('#sidebarNav .nav-item[data-view]'));
      var seen = {};
      var rows = [];
      src.forEach(function (node) {
        var view = node.getAttribute('data-view');
        if (!view || seen[view] || view === 'coming-soon') return;
        if (node.classList.contains('hidden') || node.classList.contains('is-locked')) return;
        if (!MobileNav.can(view)) return;
        seen[view] = true;
        var textEl = node.querySelector('span');
        var label = textEl ? textEl.textContent : MobileNav.labelFor(view);
        rows.push({ view: view, label: label, icon: MobileNav.iconFor(view) });
      });
      if (!rows.length) {
        var home = MobileNav.landing();
        rows.push({ view: home, label: MobileNav.labelFor(home), icon: MobileNav.iconFor(home) });
      }
      grid.innerHTML = rows.map(function (r) {
        return '<button type="button" class="gesit-mobile-menu-item" data-mview="' + MobileNav.escapeAttr(r.view) + '">' +
          (typeof iconSvg === 'function' ? iconSvg(r.icon) : '') + '<span>' + MobileNav.escape(r.label) + '</span></button>';
      }).join('');
      Array.prototype.slice.call(grid.querySelectorAll('[data-mview]')).forEach(function (btn) {
        btn.addEventListener('click', function () { MobileNav.go(btn.getAttribute('data-mview')); });
      });
      if (typeof renderIcons === 'function') renderIcons(grid);
      MobileNav.updateActive();
    },
    go: function (view) {
      if (!view || !window.Router || !Router.go) return;
      Router.go(view);
    },
    openProfile: function () {
      var chip = document.getElementById('userChip');
      if (chip) chip.click();
    },
    openSheet: function () {
      MobileNav.renderSheet();
      if (MobileNav.sheet) MobileNav.sheet.classList.add('is-open');
      if (MobileNav.backdrop) MobileNav.backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    },
    closeSheet: function () {
      if (MobileNav.sheet) MobileNav.sheet.classList.remove('is-open');
      if (MobileNav.backdrop) MobileNav.backdrop.classList.remove('is-open');
      if (!document.querySelector('.modal-backdrop.is-open')) document.body.style.overflow = '';
    },
    updateActive: function () {
      var cur = window.Router && Router.current;
      Array.prototype.slice.call(document.querySelectorAll('[data-view], [data-mview]')).forEach(function (el) {
        var v = el.getAttribute('data-view') || el.getAttribute('data-mview');
        if (el.classList.contains('gesit-mobile-nav-btn') || el.classList.contains('gesit-mobile-menu-item')) {
          el.classList.toggle('is-active', v === cur);
        }
      });
    },
    escape: function (s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    escapeAttr: function (s) { return MobileNav.escape(s); }
  };
  window.GESITMobileNav = MobileNav;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', MobileNav.init);
  else MobileNav.init();
})();
