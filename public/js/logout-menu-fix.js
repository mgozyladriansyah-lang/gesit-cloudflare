/* GESIT V16 Logout Menu Click Fix */
(function(){
  'use strict';
  var VER='2026.08.11.13';
  var BUSY=false;
  function byId(id){ return document.getElementById(id); }
  function closeMenus(){
    var user=byId('userMenu'); if(user) user.classList.remove('is-open');
    var sheet=byId('mobileMenuSheet'); if(sheet) sheet.classList.remove('is-open');
    var bd=byId('mobileMenuBackdrop'); if(bd) bd.classList.remove('is-open');
    document.body.classList.remove('has-sheet-open','user-menu-open');
    if(!document.querySelector('.modal-backdrop.is-open,.tour-tip')){ document.body.style.overflow=''; document.documentElement.style.overflowY='auto'; document.body.style.overflowY='auto'; }
  }
  function showConfirmLogout(){
    if(BUSY) return; BUSY=true; setTimeout(function(){ BUSY=false; },900);
    closeMenus();
    var ok=function(){ if(window.Auth && typeof Auth.logout==='function') Auth.logout(); };
    if(window.Confirm && typeof Confirm.ask==='function'){
      Confirm.ask('Keluar dari aplikasi?', 'Anda harus login kembali untuk mengakses GESIT.', ok);
      setTimeout(function(){
        var m=byId('modalConfirm');
        if(m){ m.classList.add('is-open'); m.style.zIndex='2147483300'; m.style.pointerEvents='auto'; document.body.classList.add('confirm-modal-open','has-modal-open'); }
      },20);
    } else { ok(); }
  }
  function bind(){
    var btn=byId('menuLogout');
    if(!btn || btn.__logoutV16) return;
    btn.__logoutV16=true;
    btn.setAttribute('type','button');
    ['pointerdown','touchstart'].forEach(function(ev){
      btn.addEventListener(ev,function(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); },true);
    });
    ['click','pointerup','touchend'].forEach(function(ev){
      btn.addEventListener(ev,function(e){
        e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        showConfirmLogout();
      },true);
    });
  }
  function patchUserMenu(){
    if(!window.UserMenu || UserMenu.__logoutV16) return;
    var oldClose=UserMenu.close;
    UserMenu.close=function(){
      var ae=document.activeElement;
      if(ae && ae.id==='menuLogout') return;
      return oldClose.apply(UserMenu,arguments);
    };
    UserMenu.__logoutV16=true;
  }
  function init(){
    bind(); patchUserMenu();
    if(window.MutationObserver) new MutationObserver(function(){ bind(); patchUserMenu(); }).observe(document.body,{childList:true,subtree:true});
    setInterval(function(){ bind(); patchUserMenu(); },1000);
    window.GESIT_LOGOUT_FIX={version:VER, ask:showConfirmLogout};
    try{ document.documentElement.setAttribute('data-gesit-logout-fix',VER); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
