/* GESIT V18 Stable Interaction Recovery
   Emergency fix after browser "Halaman tidak merespons" on Keluar.
   Prinsip: tidak ada MutationObserver loop, tidak ada patch Router, tidak ada timer berulang.
*/
(function(){
  'use strict';
  var VER='2026.08.11.15';
  var lastLogoutAt=0;
  function byId(id){ return document.getElementById(id); }
  function q(s,root){ return (root||document).querySelector(s); }
  function has(el,c){ return !!(el && el.classList && el.classList.contains(c)); }
  function setClass(el,c,on){ if(!el || !el.classList) return; if(on && !el.classList.contains(c)) el.classList.add(c); if(!on && el.classList.contains(c)) el.classList.remove(c); }
  function closeUserMenu(){ setClass(byId('userMenu'),'is-open',false); setClass(document.body,'user-menu-open',false); }
  function closeSheet(){ setClass(byId('mobileMenuSheet'),'is-open',false); setClass(byId('mobileMenuBackdrop'),'is-open',false); setClass(document.body,'has-sheet-open',false); }
  function modalOpen(){ return !!q('.modal-backdrop.is-open'); }
  function tourOpen(){ return !!q('.tour-tip'); }
  function unlockIfSafe(){
    if(!modalOpen() && !has(byId('mobileMenuSheet'),'is-open') && !tourOpen()){
      document.body.style.overflow='';
      document.body.style.overflowY='auto';
      document.documentElement.style.overflow='';
      document.documentElement.style.overflowY='auto';
    }
  }
  function closeTransient(){ closeUserMenu(); closeSheet(); unlockIfSafe(); }
  function showLogoutNativeConfirm(){
    var now=Date.now();
    if(now-lastLogoutAt < 1200) return;
    lastLogoutAt=now;
    closeTransient();
    // Pakai native confirm untuk memutus rantai modal/observer custom yang menyebabkan hang.
    setTimeout(function(){
      var ok=false;
      try{ ok=window.confirm('Keluar dari aplikasi?\n\nAnda harus login kembali untuk mengakses GESIT.'); }catch(e){ ok=true; }
      if(ok && window.Auth && typeof Auth.logout==='function'){ Auth.logout(); }
    },30);
  }
  function markView(){
    var v=(window.Router && Router.current) || (q('.view.is-active') && q('.view.is-active').getAttribute('data-view-panel')) || '';
    if(v) document.body.setAttribute('data-current-view',v);
    var hub=byId('gesitRoleMobileHub');
    if(hub){
      var mobile=window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth<=768;
      var safe=!modalOpen() && !has(byId('mobileMenuSheet'),'is-open') && !tourOpen();
      hub.style.display=(mobile && v==='dashboard' && safe) ? 'block' : 'none';
    }
  }
  function delegate(e){
    var t=e.target;
    if(!t || !t.closest) return;
    var logout=t.closest('#menuLogout');
    if(logout){
      e.preventDefault();
      e.stopPropagation();
      if(e.stopImmediatePropagation) e.stopImmediatePropagation();
      showLogoutNativeConfirm();
      return;
    }
    var userChip=t.closest('#userChip,.user-chip');
    if(userChip){ closeSheet(); setTimeout(markView,20); return; }
    var route=t.closest('[data-view], [data-view-target], [data-tab-target], .sidebar-link, .tab, .gesit-mobile-menu-item, .gesit-role-action');
    if(route && !t.closest('#userMenu')){ setTimeout(function(){ closeTransient(); markView(); },40); return; }
    if(has(byId('userMenu'),'is-open') && !t.closest('#userMenu') && !userChip) closeUserMenu();
    if(has(byId('mobileMenuSheet'),'is-open') && !t.closest('#mobileMenuSheet,#mobileBottomNav,#mobileMenuBackdrop')) closeSheet();
    setTimeout(markView,20);
  }
  function bindOnce(){
    if(document.__gesitV18Bound) return;
    document.__gesitV18Bound=true;
    // Capture hanya click dan touchend. Tidak memakai pointerup untuk mencegah double-fire desktop devtools.
    document.addEventListener('click',delegate,true);
    document.addEventListener('touchend',delegate,true);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ closeTransient(); markView(); } },true);
    window.addEventListener('hashchange',function(){ closeTransient(); setTimeout(markView,30); },{passive:true});
    window.addEventListener('resize',function(){ setTimeout(markView,60); },{passive:true});
    document.addEventListener('visibilitychange',function(){ if(!document.hidden) setTimeout(markView,60); });
  }
  function init(){
    bindOnce(); closeTransient(); markView();
    window.GESIT_STABLE_INTERACTION={version:VER, closeTransient:closeTransient, logout:showLogoutNativeConfirm, markView:markView};
    try{ document.documentElement.setAttribute('data-gesit-stable-interaction',VER); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
