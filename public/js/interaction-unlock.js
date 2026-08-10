/* GESIT Interaction + Scroll Unlock V7
   Emergency guard for stale fixed overlays, body overflow lock, and mobile/PWA scroll freeze. */
(function(){
  'use strict';
  var VER = window.GESIT_PWA_VERSION || '2026.08.11.04';

  function injectCss(){
    if(document.getElementById('gesit-interaction-unlock-v7-css')) return;
    var st=document.createElement('style');
    st.id='gesit-interaction-unlock-v7-css';
    st.textContent = `
html,body{min-height:100%!important;height:auto!important;overflow-y:auto!important;touch-action:auto!important;}
body:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active){overflow-y:auto!important;}
#mobileMenuBackdrop:not(.is-open),#mobileMenuSheet:not(.is-open),#mobileMenuBackdrop[aria-hidden="true"],.modal-backdrop:not(.is-open),.pwa-update-banner.hidden,.pwa-version-box.hidden,.gesit-notify-panel:not(.is-open){pointer-events:none!important;}
#mobileMenuBackdrop:not(.is-open),.modal-backdrop:not(.is-open),.pwa-update-banner.hidden{display:none!important;}
.app-loading.is-hidden,.login-page.is-hidden{pointer-events:none!important;}
body:not(.gesit-tour-active) .tour-blocker,body:not(.gesit-tour-active) .tour-spot{pointer-events:none!important;display:none!important;}
body.gesit-mobile-shell .content,body.gesit-mobile-shell .view.is-active{padding-bottom:calc(150px + env(safe-area-inset-bottom,0px))!important;}
@media(max-width:768px){html,body{overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;}body.gesit-mobile-shell .main,body.gesit-mobile-shell .content,body.gesit-mobile-shell .view.is-active{height:auto!important;min-height:auto!important;overflow:visible!important;}.gesit-notify-fab{pointer-events:auto!important}.gesit-notify-panel.is-open{pointer-events:auto!important}}
`;
    document.head.appendChild(st);
  }

  function visible(el){
    if(!el) return false;
    var cs=getComputedStyle(el);
    return cs.display!=='none' && cs.visibility!=='hidden' && cs.opacity!=='0';
  }

  function hasOpenModal(){
    return !!document.querySelector('.modal-backdrop.is-open,.modal.is-open,.drawer.is-open');
  }

  function hasOpenSheet(){
    return !!document.querySelector('#mobileMenuSheet.is-open,#mobileMenuBackdrop.is-open,.gesit-mobile-sheet.is-open,.gesit-mobile-sheet-backdrop.is-open');
  }

  function hasTour(){
    var tip=document.querySelector('.tour-tip');
    return !!(tip && visible(tip));
  }

  function unlockBody(){
    var modal=hasOpenModal();
    var sheet=hasOpenSheet();
    var tour=hasTour();
    document.body.classList.toggle('has-modal-open', modal);
    document.body.classList.toggle('has-sheet-open', sheet);
    document.body.classList.toggle('gesit-tour-active', tour);

    if(!modal && !sheet && !tour){
      if(document.body.style.overflow==='hidden') document.body.style.overflow='';
      if(document.documentElement.style.overflow==='hidden') document.documentElement.style.overflow='';
      document.body.style.pointerEvents='';
      document.documentElement.style.pointerEvents='';
    }

    if(!tour){
      document.querySelectorAll('.tour-blocker,.tour-spot').forEach(function(el){
        if(!document.querySelector('.tour-tip')) {
          try{el.remove();}catch(e){el.style.display='none';el.style.pointerEvents='none';}
        }
      });
    }

    var mb=document.getElementById('mobileMenuBackdrop');
    var ms=document.getElementById('mobileMenuSheet');
    if(mb && !mb.classList.contains('is-open')){mb.style.pointerEvents='none';}
    if(ms && !ms.classList.contains('is-open')){ms.style.pointerEvents='none';}
    if(ms && ms.classList.contains('is-open')){ms.style.pointerEvents='auto';}
    if(mb && mb.classList.contains('is-open')){mb.style.pointerEvents='auto';}

    document.querySelectorAll('.modal-backdrop').forEach(function(el){
      if(!el.classList.contains('is-open')) el.style.pointerEvents='none';
      else el.style.pointerEvents='auto';
    });
  }

  function patchMobileNav(){
    if(!(window.GESITMobileNav && GESITMobileNav.closeSheet) || GESITMobileNav.__unlockV7) return;
    var oldOpen=GESITMobileNav.openSheet;
    var oldClose=GESITMobileNav.closeSheet;
    GESITMobileNav.openSheet=function(){
      var r=oldOpen.apply(GESITMobileNav,arguments);
      setTimeout(unlockBody,30);
      return r;
    };
    GESITMobileNav.closeSheet=function(){
      var r=oldClose.apply(GESITMobileNav,arguments);
      setTimeout(unlockBody,30);
      return r;
    };
    GESITMobileNav.__unlockV7=true;
  }

  function init(){
    injectCss();
    unlockBody();
    patchMobileNav();
    document.addEventListener('click',function(){setTimeout(unlockBody,40);setTimeout(patchMobileNav,80);},true);
    document.addEventListener('touchstart',function(){setTimeout(unlockBody,40);},true);
    window.addEventListener('resize',unlockBody);
    window.addEventListener('orientationchange',unlockBody);
    document.addEventListener('visibilitychange',function(){if(!document.hidden)unlockBody();});
    if(window.MutationObserver){
      var t=null;
      new MutationObserver(function(){clearTimeout(t);t=setTimeout(function(){unlockBody();patchMobileNav();},80);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
    }
    setInterval(unlockBody,1200);
    try{document.documentElement.setAttribute('data-gesit-interaction-guard',VER);}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
