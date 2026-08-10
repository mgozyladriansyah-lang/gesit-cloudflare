/* GESIT Scroll Root Unlock V8
   Hard restore for body/html/main/content scroll lock in PWA/mobile. */
(function(){
  'use strict';
  var VER = window.GESIT_PWA_VERSION || '2026.08.11.05';
  var MAJOR_OVERLAYS = '.modal-backdrop.is-open,.modal.is-open,#mobileMenuSheet.is-open,#mobileMenuBackdrop.is-open,.sidebar-overlay.is-visible,.tour-tip';

  function css(){
    if(document.getElementById('gesit-scroll-root-unlock-v8-css')) return;
    var st=document.createElement('style'); st.id='gesit-scroll-root-unlock-v8-css';
    st.textContent = `
html:not(.gesit-modal-lock),body:not(.gesit-modal-lock){height:auto!important;min-height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;}
body:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active),html:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active){position:static!important;inset:auto!important;}
body:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active) .app-shell.is-visible,body:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active) .main,body:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active) .content,body:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active) .view.is-active{height:auto!important;min-height:auto!important;max-height:none!important;overflow-y:visible!important;overflow-x:hidden!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch!important;}
#mobileMenuBackdrop:not(.is-open),.modal-backdrop:not(.is-open),.sidebar-overlay:not(.is-visible),.tour-blocker,.tour-spot{pointer-events:none!important;}body:not(.gesit-tour-active) .tour-blocker,body:not(.gesit-tour-active) .tour-spot{display:none!important;}
@media(max-width:768px),(display-mode:standalone){body:not(.has-modal-open):not(.has-sheet-open):not(.gesit-tour-active) .content{padding-bottom:calc(160px + env(safe-area-inset-bottom,0px))!important;}}
`;
    document.head.appendChild(st);
  }
  function visible(el){ if(!el) return false; var s=getComputedStyle(el); return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'; }
  function isActiveTour(){ var tip=document.querySelector('.tour-tip'); return !!(tip&&visible(tip)); }
  function isOpen(q){ return !!document.querySelector(q); }
  function markState(){
    var modal=isOpen('.modal-backdrop.is-open,.modal.is-open');
    var sheet=isOpen('#mobileMenuSheet.is-open,#mobileMenuBackdrop.is-open,.gesit-mobile-sheet.is-open,.gesit-mobile-sheet-backdrop.is-open');
    var tour=isActiveTour();
    document.body.classList.toggle('has-modal-open',modal);
    document.body.classList.toggle('has-sheet-open',sheet);
    document.body.classList.toggle('gesit-tour-active',tour);
    document.documentElement.classList.toggle('has-modal-open',modal);
    document.documentElement.classList.toggle('has-sheet-open',sheet);
    document.documentElement.classList.toggle('gesit-tour-active',tour);
    return {modal:modal,sheet:sheet,tour:tour,locked:modal||sheet||tour};
  }
  function clearInlineLock(el){
    if(!el) return;
    ['overflow','overflowY','height','maxHeight','position','top','left','right','bottom','touchAction'].forEach(function(k){
      var v=el.style[k];
      if(v && /hidden|fixed|100vh|100dvh|none|0px/.test(String(v))) el.style[k]='';
    });
  }
  function clearOverlayBlockers(){
    document.querySelectorAll('#mobileMenuBackdrop,.modal-backdrop,.sidebar-overlay,.tour-blocker,.tour-spot').forEach(function(el){
      var keep=(el.id==='mobileMenuBackdrop'&&el.classList.contains('is-open'))||el.classList.contains('is-open')||el.classList.contains('is-visible')||(el.classList.contains('tour-blocker')&&isActiveTour())||(el.classList.contains('tour-spot')&&isActiveTour());
      if(!keep){ el.style.pointerEvents='none'; if(el.classList.contains('tour-blocker')||el.classList.contains('tour-spot')){ try{el.remove();}catch(e){el.style.display='none';} } }
    });
  }
  function expandDocumentIfNeeded(){
    var active=document.querySelector('.view.is-active')||document.querySelector('.content')||document.querySelector('.main');
    if(!active) return;
    var rect=active.getBoundingClientRect();
    var bottom=window.scrollY+rect.bottom+180;
    var current=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
    if(bottom>current){ document.body.style.minHeight=Math.ceil(bottom)+'px'; }
  }
  function unlock(){
    css();
    var s=markState();
    if(!s.locked){
      clearInlineLock(document.documentElement); clearInlineLock(document.body);
      ['.app-shell.is-visible','.main','.content','.view.is-active'].forEach(function(q){document.querySelectorAll(q).forEach(clearInlineLock);});
      document.documentElement.style.overflowY='auto'; document.body.style.overflowY='auto';
      document.documentElement.style.touchAction='pan-y'; document.body.style.touchAction='pan-y';
      expandDocumentIfNeeded();
    }
    clearOverlayBlockers();
  }
  function patch(){
    if(window.GESITMobileNav && !GESITMobileNav.__scrollRootV8){
      ['openSheet','closeSheet','toggleSheet'].forEach(function(k){ if(typeof GESITMobileNav[k]==='function'){ var old=GESITMobileNav[k]; GESITMobileNav[k]=function(){var r=old.apply(GESITMobileNav,arguments); setTimeout(unlock,50); return r;}; }});
      GESITMobileNav.__scrollRootV8=true;
    }
  }
  function init(){
    css(); unlock(); patch();
    ['click','touchstart','touchend','scroll','resize','orientationchange'].forEach(function(ev){ window.addEventListener(ev,function(){setTimeout(unlock,40);setTimeout(patch,80);},{passive:true,capture:true}); });
    document.addEventListener('visibilitychange',function(){if(!document.hidden)unlock();});
    if(window.MutationObserver){ var t=null; new MutationObserver(function(){clearTimeout(t);t=setTimeout(function(){unlock();patch();},60);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','aria-hidden']}); }
    setInterval(function(){unlock();patch();},700);
    window.GESIT_FORCE_UNLOCK_SCROLL=unlock;
    try{document.documentElement.setAttribute('data-gesit-scroll-root-unlock',VER);}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
