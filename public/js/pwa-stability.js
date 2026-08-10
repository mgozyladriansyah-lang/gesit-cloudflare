/* GESIT PWA Mobile Stability V5
   Fixes: PWA installed stale UI, bottom safe scroll, tour buttons blocked by bottom nav. */
(function(){
  'use strict';
  var VER = (window.GESIT_PWA_VERSION || '2026.08.11.04');
  function inject(){
    if(document.getElementById('gesit-stability-v5-css')) return;
    var st=document.createElement('style');
    st.id='gesit-stability-v5-css';
    st.textContent = `
@media (max-width:768px){
  html,body{min-height:100%!important;height:auto!important;overflow-y:auto!important;}
  body.gesit-mobile-shell #appShell.is-visible{padding-bottom:calc(104px + env(safe-area-inset-bottom,0px))!important;}
  body.gesit-mobile-shell .main,body.gesit-mobile-shell .content,body.gesit-mobile-shell .view.is-active{min-height:auto!important;height:auto!important;overflow:visible!important;}
  body.gesit-mobile-shell .content{padding-bottom:calc(140px + env(safe-area-inset-bottom,0px))!important;}
  body.gesit-mobile-shell .view.is-active{padding-bottom:calc(128px + env(safe-area-inset-bottom,0px))!important;}
  body.gesit-tour-active #mobileBottomNav,body.gesit-tour-active #mobileMenuSheet,body.gesit-tour-active #mobileMenuBackdrop{display:none!important;pointer-events:none!important;}
  body.gesit-tour-active .tour-tip{left:12px!important;right:12px!important;bottom:calc(12px + env(safe-area-inset-bottom,0px))!important;top:auto!important;width:auto!important;max-width:none!important;max-height:calc(100dvh - 24px - env(safe-area-inset-bottom,0px))!important;overflow:auto!important;z-index:13002!important;}
  body.gesit-tour-active .tour-tip-actions{display:flex!important;flex-wrap:wrap!important;gap:8px!important;}
  body.gesit-tour-active .tour-tip-actions button{min-height:42px!important;touch-action:manipulation!important;}
}
body.gesit-tour-active .tour-blocker{z-index:13000!important;}body.gesit-tour-active .tour-spot{z-index:13001!important;}body.gesit-tour-active .tour-tip{z-index:13002!important;}
`;
    document.head.appendChild(st);
  }
  function syncTour(){
    var active=!!document.querySelector('.tour-tip,.tour-blocker,.tour-spot');
    document.body.classList.toggle('gesit-tour-active',active);
    if(active){
      var sheet=document.getElementById('mobileMenuSheet'); if(sheet) sheet.classList.remove('is-open');
      var back=document.getElementById('mobileMenuBackdrop'); if(back) back.classList.remove('is-open');
    }
  }
  function checkUpdate(){
    if(window.GESIT_PWA && GESIT_PWA.checkForUpdates) { try{GESIT_PWA.checkForUpdates();}catch(e){} }
    if('serviceWorker' in navigator){
      navigator.serviceWorker.getRegistration().then(function(reg){ if(reg) reg.update().catch(function(){}); });
    }
  }
  function init(){
    inject(); syncTour(); if(!document.querySelector('.tour-tip,.tour-blocker,.tour-spot,#mobileMenuSheet.is-open,.modal-backdrop.is-open')) document.body.style.overflow=''; checkUpdate();
    if(window.MutationObserver) new MutationObserver(syncTour).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',function(){setTimeout(syncTour,60);},true);
    window.addEventListener('focus',checkUpdate);
    document.addEventListener('visibilitychange',function(){ if(!document.hidden) checkUpdate(); });
    try{document.documentElement.setAttribute('data-gesit-pwa-version',VER);}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
