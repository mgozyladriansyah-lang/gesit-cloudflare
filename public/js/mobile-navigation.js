/* GESIT Mobile App Shell V3 Hotfix
   Self-contained mobile navigation: injects critical CSS from JS so HP and DevTools
   cannot diverge because of stale/missing pwa.css. */
(function () {
  'use strict';

  function injectCss() {
    if (document.getElementById('gesit-mobile-shell-critical-css')) return;
    var css = `
@media (max-width: 768px) {
  body.gesit-mobile-shell #appShell.is-visible { padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px)) !important; }
  body.gesit-mobile-shell .topbar {
    position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important;
    z-index: 11020 !important; min-height: calc(56px + env(safe-area-inset-top, 0px)) !important;
    padding: calc(7px + env(safe-area-inset-top, 0px)) 12px 8px !important;
    border-bottom: 1px solid rgba(15,118,110,.12) !important;
    background: rgba(255,255,255,.96) !important;
    box-shadow: 0 8px 24px rgba(15,23,42,.08) !important;
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  }
  body.gesit-mobile-shell .main { padding-top: calc(64px + env(safe-area-inset-top, 0px)) !important; }
  body.gesit-mobile-shell .content { padding-top: 12px !important; padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px)) !important; }
  body.gesit-mobile-shell .topbar-menu-btn, body.gesit-mobile-shell .topbar-now,
  body.gesit-mobile-shell .topbar-page-hint, body.gesit-mobile-shell .chip-label,
  body.gesit-mobile-shell .user-meta, body.gesit-mobile-shell .user-chip > svg[data-icon="chevron"] { display: none !important; }
  body.gesit-mobile-shell #topbarPageTitle { display:block; max-width:56vw; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14.5px; line-height:1.15; font-weight:800; }
}
#mobileBottomNav.gesit-mobile-bottom-nav {
  position: fixed !important; left: 10px !important; right: 10px !important;
  bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important; z-index: 11000 !important;
  display: none !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 6px !important; padding: 8px !important; margin: 0 !important;
  border: 1px solid rgba(15,118,110,.18) !important; border-radius: 24px !important;
  background: rgba(255,255,255,.94) !important;
  box-shadow: 0 18px 50px rgba(15,23,42,.18), inset 0 1px 0 rgba(255,255,255,.7) !important;
  overflow: visible !important; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
}
@media (max-width: 768px) { body.gesit-mobile-shell #appShell.is-visible #mobileBottomNav.gesit-mobile-bottom-nav { display: grid !important; } }
#mobileBottomNav .gesit-mobile-nav-btn {
  appearance:none !important; -webkit-appearance:none !important; border:0 !important;
  border-radius:18px !important; background:transparent !important; color:#64748b !important;
  min-width:0 !important; min-height:54px !important; height:54px !important; padding:6px 4px !important;
  display:grid !important; place-items:center !important; gap:3px !important;
  font:inherit !important; font-size:10.5px !important; font-weight:750 !important; line-height:1.1 !important;
  text-align:center !important; position:relative !important; isolation:isolate !important;
  transition:background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease !important;
}
#mobileBottomNav .gesit-mobile-nav-btn svg { width:20px !important; height:20px !important; max-width:20px !important; max-height:20px !important; stroke-width:2 !important; position:relative; z-index:1; }
#mobileBottomNav .gesit-mobile-nav-btn span { display:block !important; position:relative; z-index:1; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; max-width:100% !important; }
#mobileBottomNav .gesit-mobile-nav-btn.is-active {
  color:#0f766e !important; background:linear-gradient(180deg,#fff,#ecfeff) !important;
  box-shadow:0 10px 24px rgba(13,148,136,.18), inset 0 0 0 1px rgba(20,184,166,.30) !important;
  transform:translateY(-5px) !important;
}
#mobileBottomNav .gesit-mobile-nav-btn.is-active::before {
  content:""; position:absolute; left:50%; top:-12px; width:42px; height:5px; border-radius:999px;
  transform:translateX(-50%); background:linear-gradient(90deg,#14b8a6,#0d9488); box-shadow:0 8px 18px rgba(13,148,136,.34);
}
#mobileMenuBackdrop.gesit-mobile-sheet-backdrop { position:fixed !important; inset:0 !important; z-index:10980 !important; display:none !important; background:rgba(15,23,42,.28) !important; }
#mobileMenuBackdrop.gesit-mobile-sheet-backdrop.is-open { display:block !important; }
#mobileMenuSheet.gesit-mobile-sheet {
  position:fixed !important; left:0 !important; right:0 !important; bottom:0 !important; z-index:10990 !important;
  display:none !important; max-height:min(78dvh,620px) !important;
  padding:12px 14px calc(94px + env(safe-area-inset-bottom, 0px)) !important;
  border-radius:28px 28px 0 0 !important; background:#fff !important;
  box-shadow:0 -24px 70px rgba(15,23,42,.22) !important; overflow:auto !important; -webkit-overflow-scrolling:touch;
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
#mobileMenuSheet .gesit-mobile-menu-item svg { width:21px !important; height:21px !important; max-width:21px !important; max-height:21px !important; color:#0d9488; }
#mobileMenuSheet .gesit-mobile-menu-item span { display:block; font-size:12.5px; font-weight:800; line-height:1.2; }
#mobileMenuSheet .gesit-mobile-menu-item.is-active { border-color:rgba(13,148,136,.38) !important; background:#f0fdfa !important; }
@media (min-width: 769px) { #mobileBottomNav, #mobileMenuSheet, #mobileMenuBackdrop { display:none !important; } }
@media (max-width: 360px) { #mobileMenuSheet .gesit-mobile-menu-grid { grid-template-columns:minmax(0,1fr) !important; } }
`;
    var st = document.createElement('style');
    st.id = 'gesit-mobile-shell-critical-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  var MobileNav = {
    mq: null, ready: false, nav: null, sheet: null, backdrop: null, activeTab: '',
    init: function () {
      if (MobileNav.ready) return;
      MobileNav.ready = true;
      injectCss();
      MobileNav.mq = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
      MobileNav.ensureDom(); MobileNav.patchRouter(); MobileNav.bindResize(); MobileNav.observeMenu(); MobileNav.observeTabs();
      MobileNav.refresh(); setTimeout(MobileNav.refresh, 300); setTimeout(MobileNav.refresh, 1200);
    },
    ensureDom: function () {
      var shell = document.getElementById('appShell') || document.body;
      MobileNav.nav = document.getElementById('mobileBottomNav');
      if (!MobileNav.nav) { MobileNav.nav = document.createElement('nav'); MobileNav.nav.id = 'mobileBottomNav'; MobileNav.nav.className = 'gesit-mobile-bottom-nav'; MobileNav.nav.setAttribute('aria-label','Navigasi utama mobile'); shell.appendChild(MobileNav.nav); }
      MobileNav.backdrop = document.getElementById('mobileMenuBackdrop');
      if (!MobileNav.backdrop) { MobileNav.backdrop = document.createElement('div'); MobileNav.backdrop.id = 'mobileMenuBackdrop'; MobileNav.backdrop.className = 'gesit-mobile-sheet-backdrop'; document.body.appendChild(MobileNav.backdrop); }
      MobileNav.sheet = document.getElementById('mobileMenuSheet');
      if (!MobileNav.sheet) { MobileNav.sheet = document.createElement('section'); MobileNav.sheet.id = 'mobileMenuSheet'; MobileNav.sheet.className = 'gesit-mobile-sheet'; MobileNav.sheet.setAttribute('aria-label','Daftar menu aplikasi'); MobileNav.sheet.innerHTML = '<div class="gesit-mobile-sheet-head"><div><div class="gesit-mobile-sheet-title">Menu GESIT</div><div class="gesit-mobile-sheet-sub">Pilih modul tanpa membuka sidebar panjang.</div></div><button type="button" class="gesit-mobile-close" id="mobileMenuClose" aria-label="Tutup menu"></button></div><div class="gesit-mobile-menu-grid" id="mobileMenuGrid"></div>'; document.body.appendChild(MobileNav.sheet); }
      MobileNav.backdrop.onclick = MobileNav.closeSheet;
      var close = document.getElementById('mobileMenuClose'); if (close) close.onclick = MobileNav.closeSheet;
      if (typeof iconSvg === 'function' && close) close.innerHTML = iconSvg('x');
    },
    bindResize: function () {
      var fn = function () { MobileNav.applyMode(); MobileNav.updateActive(); };
      if (MobileNav.mq && MobileNav.mq.addEventListener) MobileNav.mq.addEventListener('change', fn); else if (MobileNav.mq && MobileNav.mq.addListener) MobileNav.mq.addListener(fn);
      window.addEventListener('resize', fn); window.addEventListener('orientationchange', fn); document.addEventListener('visibilitychange', function(){ if(!document.hidden) MobileNav.refresh(); });
    },
    observeMenu: function () { var nav = document.getElementById('sidebarNav'); if (!nav || !window.MutationObserver) return; var timer=null; new MutationObserver(function(){ clearTimeout(timer); timer=setTimeout(MobileNav.renderSheet,120); }).observe(nav,{attributes:true,subtree:true,childList:true,attributeFilter:['class','style']}); },
    observeTabs: function () { document.addEventListener('click', function(e){ var tab=e.target&&e.target.closest?e.target.closest('.tab[data-tab]'):null; if(!tab) return; MobileNav.activeTab=tab.getAttribute('data-tab')||''; setTimeout(MobileNav.updateActive,30); }, true); },
    patchRouter: function () { if (!window.Router || Router.__mobilePatchV3) return; var oldGo=Router.go; Router.go=function(view){ var ret=oldGo.apply(Router,arguments); MobileNav.closeSheet(); MobileNav.activeTab=''; setTimeout(MobileNav.updateActive,0); setTimeout(MobileNav.renderSheet,80); return ret; }; Router.__mobilePatchV3=true; },
    applyMode: function () { var active=!!(MobileNav.mq?MobileNav.mq.matches:window.innerWidth<=768); document.body.classList.toggle('gesit-mobile-shell',active); if(!active) MobileNav.closeSheet(); },
    refresh: function () { injectCss(); MobileNav.applyMode(); MobileNav.renderBottom(); MobileNav.renderSheet(); MobileNav.updateActive(); if(typeof renderIcons==='function'){renderIcons(MobileNav.nav); renderIcons(MobileNav.sheet);} },
    role: function () { return String(window.Auth && Auth.user && Auth.user.role || '').toLowerCase(); },
    can: function (view) { return !!(window.Router && Router.canOpen && Router.canOpen(view)); },
    landing: function () { var role=MobileNav.role(); if(window.ROLE_SCOPE&&ROLE_SCOPE[role]&&ROLE_SCOPE[role].landing) return ROLE_SCOPE[role].landing; if(window.Router&&Router.allowed&&Router.allowed.length) return Router.allowed[0]; return 'dashboard'; },
    iconFor: function (view) { var map={dashboard:'dashboard',digitamu:'users',kendaraan:'car',ruangan:'door',atk:'box',approval:'inbox',magang:'grad','magang-self':'grad',tad:'clock','tad-self':'clock',security:'shield',agenda:'calendar',budaya:'star',sosmed:'megaphone',berita:'news',eco:'leaf',laporan:'chart',users:'usercog',pengaturan:'settings'}; return map[view]||'info'; },
    labelFor: function (view) { var meta=window.VIEW_META&&VIEW_META[view]; return (meta&&meta.title)||view; },
    bottomItems: function () {
      var role=MobileNav.role();
      if(role==='magang') return [{type:'tab',view:'magang-self',tab:'presensi',label:'Presensi',icon:'clock'},{type:'tab',view:'magang-self',tab:'logbook',label:'Logbook',icon:'clipboard'},{type:'tab',view:'magang-self',tab:'tugas',label:'Tugas',icon:'star'},{type:'tab',view:'magang-self',tab:'profil',label:'Data Saya',icon:'user'}].filter(function(it){return MobileNav.can(it.view);});
      if(role==='driver'||role==='cso'||role==='tad') return [{type:'tab',view:'tad-self',tab:'presensi',label:'Presensi',icon:'clock'},{type:'tab',view:'tad-self',tab:'izin',label:'Izin',icon:'calendar'},{type:'view',view:'eco',label:'Eco',icon:'leaf'},{type:'tab',view:'tad-self',tab:'profil',label:'Data Saya',icon:'user'}].filter(function(it){return MobileNav.can(it.view);});
      if(role==='security') return [{type:'view',view:'security',label:'Security',icon:'shield'},{type:'view',view:'digitamu',label:'Tamu',icon:'users'},{type:'view',view:'eco',label:'Eco',icon:'leaf'},{type:'profile',label:'Profil',icon:'user'}].filter(function(it){return !it.view||MobileNav.can(it.view);});
      var items=[{type:'view',view:'dashboard',label:'Beranda',icon:'dashboard'},{type:'sheet',label:'Layanan',icon:'menu'}];
      if(MobileNav.can('approval')) items.push({type:'view',view:'approval',label:'Approval',icon:'inbox'}); else if(MobileNav.can('digitamu')) items.push({type:'view',view:'digitamu',label:'Tamu',icon:'users'}); else items.push({type:'view',view:MobileNav.landing(),label:'Portal',icon:MobileNav.iconFor(MobileNav.landing())});
      items.push({type:'profile',label:'Profil',icon:'user'}); return items.filter(function(it){return !it.view||MobileNav.can(it.view);}).slice(0,4);
    },
    renderBottom: function () { if(!MobileNav.nav) return; var items=MobileNav.bottomItems(); MobileNav.nav.innerHTML=items.map(function(it){ var a=it.view?' data-view="'+it.view+'"':''; var t=it.tab?' data-tab-target="'+it.tab+'"':''; return '<button type="button" class="gesit-mobile-nav-btn" data-mnav="'+it.type+'"'+a+t+'>'+ (typeof iconSvg==='function'?iconSvg(it.icon):'') + '<span>'+MobileNav.escape(it.label)+'</span></button>'; }).join(''); Array.prototype.slice.call(MobileNav.nav.querySelectorAll('button')).forEach(function(btn){ btn.addEventListener('click',function(){ var type=btn.getAttribute('data-mnav'); if(type==='view') MobileNav.go(btn.getAttribute('data-view')); else if(type==='tab') MobileNav.goTab(btn.getAttribute('data-view'),btn.getAttribute('data-tab-target')); else if(type==='sheet') MobileNav.openSheet(); else if(type==='profile') MobileNav.openProfile(); }); }); if(typeof renderIcons==='function') renderIcons(MobileNav.nav); },
    go: function(view){ if(view&&window.Router&&Router.go) Router.go(view); },
    goTab: function(view,tab){ if(!view) return; MobileNav.go(view); MobileNav.activeTab=tab||''; setTimeout(function(){ var panel=document.querySelector('[data-view-panel="'+view+'"]'); var btn=panel&&panel.querySelector('.tabs .tab[data-tab="'+tab+'"]'); if(btn) btn.click(); MobileNav.updateActive(); },140); },
    renderSheet: function(){ var grid=document.getElementById('mobileMenuGrid'); if(!grid) return; var src=Array.prototype.slice.call(document.querySelectorAll('#sidebarNav .nav-item[data-view]')); var seen={}, rows=[]; src.forEach(function(node){ var view=node.getAttribute('data-view'); if(!view||seen[view]||view==='coming-soon') return; if(node.classList.contains('hidden')||node.classList.contains('is-locked')) return; if(!MobileNav.can(view)) return; seen[view]=true; var span=node.querySelector('span'); rows.push({view:view,label:span?span.textContent:MobileNav.labelFor(view),icon:MobileNav.iconFor(view)}); }); grid.innerHTML=rows.map(function(r){ return '<button type="button" class="gesit-mobile-menu-item" data-mview="'+MobileNav.escapeAttr(r.view)+'">'+(typeof iconSvg==='function'?iconSvg(r.icon):'')+'<span>'+MobileNav.escape(r.label)+'</span></button>'; }).join(''); Array.prototype.slice.call(grid.querySelectorAll('[data-mview]')).forEach(function(btn){ btn.addEventListener('click',function(){ MobileNav.go(btn.getAttribute('data-mview')); }); }); if(typeof renderIcons==='function') renderIcons(grid); MobileNav.updateActive(); },
    openProfile: function(){ var chip=document.getElementById('userChip'); if(chip) chip.click(); },
    openSheet: function(){ MobileNav.renderSheet(); if(MobileNav.sheet) MobileNav.sheet.classList.add('is-open'); if(MobileNav.backdrop) MobileNav.backdrop.classList.add('is-open'); document.body.style.overflow='hidden'; },
    closeSheet: function(){ if(MobileNav.sheet) MobileNav.sheet.classList.remove('is-open'); if(MobileNav.backdrop) MobileNav.backdrop.classList.remove('is-open'); if(!document.querySelector('.modal-backdrop.is-open')) document.body.style.overflow=''; },
    updateActive: function(){ var cur=window.Router&&Router.current; Array.prototype.slice.call(document.querySelectorAll('.gesit-mobile-nav-btn,.gesit-mobile-menu-item')).forEach(function(el){ var v=el.getAttribute('data-view')||el.getAttribute('data-mview'); var tab=el.getAttribute('data-tab-target')||''; var on=v===cur&&(!tab||tab===MobileNav.activeTab||MobileNav.activeTab===''); if(el.getAttribute('data-mnav')==='sheet'||el.getAttribute('data-mnav')==='profile') on=false; el.classList.toggle('is-active',!!on); }); },
    escape: function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
    escapeAttr: function(s){ return MobileNav.escape(s); }
  };
  window.GESITMobileNav = MobileNav;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', MobileNav.init); else MobileNav.init();
})();
