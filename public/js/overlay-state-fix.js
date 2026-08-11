/* GESIT V15 Overlay State and Auto Close Manager */
(function(){
  'use strict';
  var VER='2026.08.11.12';
  var LOCK=false;
  function byId(id){ return document.getElementById(id); }
  function q(s){ return document.querySelector(s); }
  function qa(s,root){ return Array.prototype.slice.call((root||document).querySelectorAll(s)); }
  function isOpen(el){ return !!(el && el.classList && el.classList.contains('is-open')); }
  function sheetOpen(){ return isOpen(byId('mobileMenuSheet')) || isOpen(byId('mobileMenuBackdrop')); }
  function modalOpen(){ return !!q('.modal-backdrop.is-open'); }
  function tourOpen(){ return !!q('.tour-tip'); }
  function userMenuOpen(){ return isOpen(byId('userMenu')) || !!q('.user-menu.is-open'); }
  function closeUserMenu(){
    qa('#userMenu.is-open,.user-menu.is-open').forEach(function(el){ el.classList.remove('is-open'); });
    document.body.classList.remove('user-menu-open');
  }
  function closeSheet(){
    var sheet=byId('mobileMenuSheet'), bd=byId('mobileMenuBackdrop');
    if(sheet) sheet.classList.remove('is-open');
    if(bd) bd.classList.remove('is-open');
    document.body.classList.remove('has-sheet-open');
    if(!modalOpen() && !tourOpen()){ document.body.style.overflow=''; document.documentElement.style.overflowY='auto'; document.body.style.overflowY='auto'; }
  }
  function closeTransient(reason){
    closeUserMenu();
    closeSheet();
    if(window.MobileNav && typeof MobileNav.closeSheet==='function'){ try{ MobileNav.closeSheet(); }catch(e){} }
    sync(reason||'closeTransient');
  }
  function sync(reason){
    var sheet=sheetOpen();
    var modal=modalOpen();
    var tour=tourOpen();
    document.body.classList.toggle('has-sheet-open', sheet);
    document.body.classList.toggle('has-modal-open', modal);
    document.body.classList.toggle('gesit-tour-active', tour);
    document.body.classList.toggle('user-menu-open', userMenuOpen());
    if(sheet && userMenuOpen()) closeUserMenu();
    if(!sheet && !modal && !tour){
      document.body.style.overflow='';
      document.documentElement.style.overflowY='auto';
      document.body.style.overflowY='auto';
    }
    if(sheet){ document.body.style.overflow='hidden'; }
  }
  function patchRouter(){
    if(!window.Router || Router.__overlayV15) return;
    var oldGo=Router.go;
    if(typeof oldGo==='function'){
      Router.go=function(){ closeTransient('Router.go'); return oldGo.apply(Router, arguments); };
    }
    Router.__overlayV15=true;
  }
  function patchMobileNav(){
    if(!window.MobileNav || MobileNav.__overlayV15) return;
    var oldOpenSheet=MobileNav.openSheet, oldCloseSheet=MobileNav.closeSheet, oldOpenProfile=MobileNav.openProfile;
    if(typeof oldOpenSheet==='function'){
      MobileNav.openSheet=function(){ closeUserMenu(); var r=oldOpenSheet.apply(MobileNav, arguments); setTimeout(function(){ sync('openSheet'); },0); return r; };
    }
    if(typeof oldCloseSheet==='function'){
      MobileNav.closeSheet=function(){ var r=oldCloseSheet.apply(MobileNav, arguments); setTimeout(function(){ sync('closeSheet'); },0); return r; };
    }
    if(typeof oldOpenProfile==='function'){
      MobileNav.openProfile=function(){ closeSheet(); var r=oldOpenProfile.apply(MobileNav, arguments); setTimeout(function(){ document.body.classList.toggle('user-menu-open', userMenuOpen()); sync('openProfile'); },0); return r; };
    }
    MobileNav.__overlayV15=true;
  }
  function bindAutoClose(){
    if(document.__overlayV15Bound) return;
    document.__overlayV15Bound=true;
    document.addEventListener('click', function(e){
      var t=e.target;
      var inUser=t.closest && (t.closest('#userMenu') || t.closest('.user-chip') || t.closest('[data-user-menu]'));
      var inSheet=t.closest && (t.closest('#mobileMenuSheet') || t.closest('#mobileBottomNav') || t.closest('#mobileMenuBackdrop'));
      var viewClick=t.closest && t.closest('[data-view], [data-tab], [data-tab-target], .tab, .gesit-mobile-menu-item, .gesit-role-action');
      if(viewClick && !t.closest('#userMenu')){
        setTimeout(function(){ closeTransient('viewClick'); }, 30);
        return;
      }
      if(userMenuOpen() && !inUser) closeUserMenu();
      if(sheetOpen() && !inSheet && !modalOpen()) closeSheet();
      sync('documentClick');
    }, true);
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeTransient('escape'); }, true);
    window.addEventListener('hashchange', function(){ closeTransient('hashchange'); }, true);
    window.addEventListener('popstate', function(){ closeTransient('popstate'); }, true);
  }
  function init(){
    patchRouter(); patchMobileNav(); bindAutoClose(); sync('init');
    if(window.MutationObserver){
      var timer=null;
      new MutationObserver(function(){ clearTimeout(timer); timer=setTimeout(function(){ patchRouter(); patchMobileNav(); sync('mutation'); },80); })
        .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    }
    ['resize','orientationchange','visibilitychange','touchend','pointerup'].forEach(function(ev){
      window.addEventListener(ev,function(){ setTimeout(function(){ patchRouter(); patchMobileNav(); sync(ev); },60); },{passive:true,capture:true});
    });
    setInterval(function(){ patchRouter(); patchMobileNav(); sync('interval'); },1000);
    window.GESIT_OVERLAY_STATE={version:VER, closeTransient:closeTransient, closeSheet:closeSheet, closeUserMenu:closeUserMenu, sync:sync};
    try{ document.documentElement.setAttribute('data-gesit-overlay-state',VER); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
