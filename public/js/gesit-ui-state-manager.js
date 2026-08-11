/* GESIT V17 Consolidated UI State Manager
   Satu pintu untuk transient overlay: user menu, mobile sheet, confirm modal,
   modal biasa, tour, dan klik logout. Tidak menimpa module bisnis. */
(function(){
  'use strict';
  var VER='2026.08.11.14';
  var lastAction=0;
  function byId(id){ return document.getElementById(id); }
  function q(s,root){ return (root||document).querySelector(s); }
  function qa(s,root){ return Array.prototype.slice.call((root||document).querySelectorAll(s)); }
  function has(el,c){ return !!(el && el.classList && el.classList.contains(c)); }
  function view(){ return (window.Router && Router.current) || (q('.view.is-active') && q('.view.is-active').getAttribute('data-view-panel')) || 'dashboard'; }
  function markView(){ document.body.setAttribute('data-current-view', view() || 'dashboard'); }
  function modalOpen(){ return !!q('.modal-backdrop.is-open'); }
  function confirmOpen(){ return has(byId('modalConfirm'),'is-open'); }
  function sheetOpen(){ return has(byId('mobileMenuSheet'),'is-open') || has(byId('mobileMenuBackdrop'),'is-open'); }
  function userMenuOpen(){ return has(byId('userMenu'),'is-open'); }
  function tourOpen(){ return !!q('.tour-tip'); }
  function closeUserMenu(){ var m=byId('userMenu'); if(m) m.classList.remove('is-open'); document.body.classList.remove('user-menu-open'); }
  function closeSheet(){ var s=byId('mobileMenuSheet'), b=byId('mobileMenuBackdrop'); if(s) s.classList.remove('is-open'); if(b) b.classList.remove('is-open'); document.body.classList.remove('has-sheet-open'); }
  function closeTransient(except){
    if(except !== 'user') closeUserMenu();
    if(except !== 'sheet') closeSheet();
    sync('closeTransient');
  }
  function unlockIfSafe(){
    if(!modalOpen() && !sheetOpen() && !tourOpen()){
      document.body.style.overflow=''; document.documentElement.style.overflow=''; document.documentElement.style.overflowY='auto'; document.body.style.overflowY='auto';
    }
  }
  function sync(reason){
    markView();
    var sheet=sheetOpen(), um=userMenuOpen(), modal=modalOpen(), tour=tourOpen(), conf=confirmOpen();
    if(sheet && um) closeUserMenu();
    document.body.classList.toggle('has-sheet-open', sheetOpen());
    document.body.classList.toggle('user-menu-open', userMenuOpen());
    document.body.classList.toggle('has-modal-open', modalOpen());
    document.body.classList.toggle('confirm-modal-open', confirmOpen());
    document.body.classList.toggle('gesit-tour-active', tourOpen());
    if(sheetOpen()) document.body.style.overflow='hidden';
    unlockIfSafe();
    var hub=byId('gesitRoleMobileHub');
    if(hub){
      var mobile=window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth<=768;
      var shouldShow=mobile && view()==='dashboard' && !sheetOpen() && !modalOpen() && !tourOpen();
      hub.style.display=shouldShow ? 'block' : 'none';
    }
  }
  function askLogout(){
    var now=Date.now(); if(now-lastAction<700) return; lastAction=now;
    closeTransient();
    var ok=function(){ if(window.Auth && typeof Auth.logout==='function') Auth.logout(); };
    if(window.Confirm && typeof Confirm.ask==='function'){
      Confirm.ask('Keluar dari aplikasi?', 'Anda harus login kembali untuk mengakses GESIT.', ok);
      setTimeout(function(){
        var m=byId('modalConfirm');
        if(m){
          m.classList.add('is-open');
          m.style.display='flex'; m.style.pointerEvents='auto'; m.style.zIndex='2147483300';
          document.body.classList.add('has-modal-open','confirm-modal-open');
          var mo=m.querySelector('.modal'); if(mo){mo.style.pointerEvents='auto'; mo.style.zIndex='2147483301';}
        }
        sync('askLogout');
      },0);
    } else ok();
  }
  function patchRouter(){
    if(!window.Router || Router.__gesitV17State) return;
    var oldGo=Router.go;
    if(typeof oldGo==='function') Router.go=function(){ closeTransient(); var r=oldGo.apply(Router,arguments); setTimeout(sync,30); return r; };
    Router.__gesitV17State=true;
  }
  function patchMobileNav(){
    if(!window.MobileNav || MobileNav.__gesitV17State) return;
    var os=MobileNav.openSheet, cs=MobileNav.closeSheet, op=MobileNav.openProfile;
    if(typeof os==='function') MobileNav.openSheet=function(){ closeUserMenu(); var r=os.apply(MobileNav,arguments); setTimeout(sync,0); return r; };
    if(typeof cs==='function') MobileNav.closeSheet=function(){ var r=cs.apply(MobileNav,arguments); setTimeout(sync,0); return r; };
    if(typeof op==='function') MobileNav.openProfile=function(){ closeSheet(); var r=op.apply(MobileNav,arguments); setTimeout(sync,0); return r; };
    MobileNav.__gesitV17State=true;
  }
  function delegate(e){
    var t=e.target;
    if(!t || !t.closest) return;
    var logout=t.closest('#menuLogout');
    if(logout){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); askLogout(); return; }
    var userChip=t.closest('#userChip,.user-chip');
    if(userChip){ closeSheet(); setTimeout(sync,0); return; }
    var menuInside=t.closest('#userMenu');
    var sheetInside=t.closest('#mobileMenuSheet,#mobileBottomNav,#mobileMenuBackdrop');
    var routeTarget=t.closest('[data-view], [data-view-target], [data-tab-target], .gesit-mobile-menu-item, .gesit-role-action, .sidebar-link, .tab');
    if(routeTarget && !menuInside) setTimeout(function(){ closeTransient(); sync('routeTarget'); },40);
    else if(userMenuOpen() && !menuInside && !userChip) closeUserMenu();
    if(sheetOpen() && !sheetInside && !modalOpen()) closeSheet();
    setTimeout(sync,0);
  }
  function bindOnce(){
    if(document.__gesitV17Bound) return; document.__gesitV17Bound=true;
    ['click','pointerup','touchend'].forEach(function(ev){ document.addEventListener(ev, delegate, true); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeTransient(); },true);
    window.addEventListener('hashchange',function(){ closeTransient(); sync('hashchange'); },true);
    window.addEventListener('resize',function(){ setTimeout(sync,60); },{passive:true});
    window.addEventListener('orientationchange',function(){ setTimeout(sync,100); },{passive:true});
  }
  function init(){
    patchRouter(); patchMobileNav(); bindOnce(); sync('init');
    if(window.MutationObserver){ var timer=null; new MutationObserver(function(){ clearTimeout(timer); timer=setTimeout(function(){ patchRouter(); patchMobileNav(); sync('mutation'); },80); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']}); }
    setInterval(function(){ patchRouter(); patchMobileNav(); sync('interval'); },1200);
    window.GESIT_UI_STATE={version:VER, sync:sync, closeTransient:closeTransient, askLogout:askLogout};
    try{ document.documentElement.setAttribute('data-gesit-ui-state',VER); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
