/* GESIT V25 Quiet PWA Update
   Mencegah notifikasi pembaruan berulang setelah user sudah melihat versi yang sama.
*/
(function(){
  'use strict';
  var VER=window.GESIT_PWA_VERSION || '2026.08.11.25';
  var KEY='gesit:pwa:update-seen:'+VER;
  function hide(){
    document.querySelectorAll('#pwaUpdateBanner,.pwa-update-banner,.update-banner,[data-pwa-update-banner]').forEach(function(el){
      if(!el.dataset.forceShow){el.style.display='none';el.classList.remove('show','is-visible','is-open');}
    });
  }
  function shouldShow(){return localStorage.getItem(KEY)!=='1';}
  window.GESIT_PWA_SILENCE_UPDATE=function(){localStorage.setItem(KEY,'1');hide();};
  window.GESIT_PWA_SHOW_UPDATE=function(){localStorage.removeItem(KEY);document.querySelectorAll('#pwaUpdateBanner,.pwa-update-banner,.update-banner,[data-pwa-update-banner]').forEach(function(el){el.dataset.forceShow='1';el.style.display='';el.classList.add('show','is-visible');});};
  function wrap(){
    if(!window.GESIT_PWA || window.GESIT_PWA.__quietV25) return;
    window.GESIT_PWA.__quietV25=true;
    ['showUpdateBanner','notifyUpdate','showUpdateToast'].forEach(function(name){
      if(typeof window.GESIT_PWA[name]==='function'){
        var old=window.GESIT_PWA[name];
        window.GESIT_PWA[name]=function(){ if(!shouldShow()) return; localStorage.setItem(KEY,'1'); return old.apply(this,arguments); };
      }
    });
  }
  function init(){wrap(); if(!shouldShow()) hide(); document.addEventListener('click',function(e){ if(e.target.closest('[data-pwa-update-dismiss], .pwa-update-dismiss, #pwaUpdateClose')) window.GESIT_PWA_SILENCE_UPDATE(); },true); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  setTimeout(init,800);
})();
