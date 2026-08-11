/* GESIT Scroll + Tour Recovery V10
   Non-destructive guard: never locks document scroll. */
(function(){
  'use strict';
  var VER = '2026.08.11.07';
  function q(s){ return document.querySelector(s); }
  function qa(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function visible(el){ if(!el) return false; var cs=getComputedStyle(el); return cs.display!=='none' && cs.visibility!=='hidden' && cs.opacity!=='0'; }
  function hasTour(){ return !!(q('.tour-tip') && visible(q('.tour-tip'))); }
  function hasModal(){ return !!q('.modal-backdrop.is-open,.modal.is-open'); }
  function hasSheet(){ return !!q('#mobileMenuSheet.is-open,#mobileMenuBackdrop.is-open,.gesit-mobile-sheet.is-open,.gesit-mobile-sheet-backdrop.is-open'); }
  function inject(){
    if(q('#gesit-scroll-tour-recovery-v10-css')) return;
    var st=document.createElement('style'); st.id='gesit-scroll-tour-recovery-v10-css';
    st.textContent = 'html,body{height:auto!important;min-height:100%!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important}.app-shell.is-visible,.main,.content,.view.is-active{height:auto!important;min-height:auto!important;max-height:none!important;overflow-y:visible!important;overflow-x:hidden!important;touch-action:pan-y!important}body.has-modal-open,body.has-sheet-open{overflow:hidden!important}body.gesit-tour-active,body.gesit-tour-active .main,body.gesit-tour-active .content,body.gesit-tour-active .view.is-active{overflow-y:auto!important;touch-action:pan-y!important}body.gesit-tour-active .tour-blocker{display:block!important;pointer-events:none!important}body.gesit-tour-active .tour-spot{display:block!important;visibility:visible!important;pointer-events:none!important}body.gesit-tour-active .tour-tip{display:block!important;visibility:visible!important;pointer-events:auto!important}body:not(.gesit-tour-active) .tour-blocker,body:not(.gesit-tour-active) .tour-spot{display:none!important;pointer-events:none!important}';
    document.head.appendChild(st);
  }
  function setState(){
    var modal=hasModal(), sheet=hasSheet(), tour=hasTour();
    document.body.classList.toggle('has-modal-open', modal);
    document.body.classList.toggle('has-sheet-open', sheet);
    document.body.classList.toggle('gesit-tour-active', tour);
    return {modal:modal, sheet:sheet, tour:tour};
  }
  function clearLock(){
    var st=setState();
    if(!st.modal && !st.sheet){
      document.documentElement.style.overflowY='auto';
      document.body.style.overflowY='auto';
      if(document.documentElement.style.overflow==='hidden') document.documentElement.style.overflow='';
      if(document.body.style.overflow==='hidden') document.body.style.overflow='';
    }
    qa('.app-shell.is-visible,.main,.content,.view.is-active').forEach(function(el){
      if(!el) return;
      if(el.style.overflow==='hidden') el.style.overflow='';
      if(el.style.overflowY==='hidden') el.style.overflowY='';
      if(el.style.height && /100vh|100dvh/.test(el.style.height)) el.style.height='';
      if(el.style.maxHeight && /100vh|100dvh/.test(el.style.maxHeight)) el.style.maxHeight='';
    });
    qa('#mobileMenuBackdrop,.modal-backdrop,.sidebar-overlay').forEach(function(el){
      var keep=el.classList.contains('is-open') || el.classList.contains('is-visible');
      if(!keep) el.style.pointerEvents='none';
    });
    if(!st.tour) qa('.tour-blocker,.tour-spot').forEach(function(el){ try{el.remove();}catch(e){el.style.display='none';} });
  }
  function patchTour(){
    if(!window.TourGuide || TourGuide.__recoveryV10) return;
    var oldStart=TourGuide.start, oldEnd=TourGuide.end, oldPlace=TourGuide._place;
    TourGuide.start=function(){ var r=oldStart.apply(TourGuide,arguments); document.body.classList.add('gesit-tour-active'); setTimeout(clearLock,60); return r; };
    TourGuide.end=function(){ var r=oldEnd.apply(TourGuide,arguments); document.body.classList.remove('gesit-tour-active'); setTimeout(clearLock,60); return r; };
    TourGuide._place=function(){ var r=oldPlace.apply(TourGuide,arguments); if(TourGuide.aktif) document.body.classList.add('gesit-tour-active'); return r; };
    TourGuide.__recoveryV10=true;
  }
  function init(){
    inject(); clearLock(); patchTour();
    ['click','touchstart','touchend','scroll','resize','orientationchange'].forEach(function(ev){
      window.addEventListener(ev,function(){ setTimeout(clearLock,40); setTimeout(patchTour,80); },{passive:true,capture:true});
    });
    if(window.MutationObserver){ var t=null; new MutationObserver(function(){ clearTimeout(t); t=setTimeout(function(){ clearLock(); patchTour(); },80); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']}); }
    setInterval(function(){ clearLock(); patchTour(); },1000);
    window.GESIT_FORCE_UNLOCK_SCROLL=clearLock;
    try{document.documentElement.setAttribute('data-gesit-scroll-tour-recovery',VER);}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
