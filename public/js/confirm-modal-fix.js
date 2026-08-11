/* GESIT V11 Confirm Modal Click Fix */
(function(){
  'use strict';
  var VER='2026.08.11.08';
  var okCb=null, cancelCb=null, lastTitle='', lastText='';
  function q(s){return document.querySelector(s);}
  function byId(id){return document.getElementById(id);}
  function closeConfirm(){
    var m=byId('modalConfirm');
    if(m) m.classList.remove('is-open');
    document.body.classList.remove('confirm-modal-open','has-modal-open');
    if(!document.querySelector('.modal-backdrop.is-open,#mobileMenuSheet.is-open,.gesit-mobile-sheet.is-open')){
      document.body.style.overflow='';
      document.documentElement.style.overflowY='auto';
      document.body.style.overflowY='auto';
    }
  }
  function openConfirm(){
    var m=byId('modalConfirm');
    if(!m) return;
    m.classList.add('is-open');
    m.style.pointerEvents='auto';
    m.style.zIndex='2147483000';
    var modal=m.querySelector('.modal');
    if(modal){ modal.style.pointerEvents='auto'; modal.style.zIndex='2147483001'; }
    document.body.classList.add('confirm-modal-open','has-modal-open');
    document.body.style.overflow='hidden';
    var ok=byId('confirmOk'), cancel=byId('confirmCancel');
    if(ok){ ok.disabled=false; ok.style.pointerEvents='auto'; ok.style.zIndex='2147483002'; }
    if(cancel){ cancel.disabled=false; cancel.style.pointerEvents='auto'; cancel.style.zIndex='2147483002'; }
  }
  function runOk(e){
    if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    var fn=okCb; okCb=null; cancelCb=null; closeConfirm();
    if(typeof fn==='function') setTimeout(fn,0);
  }
  function runCancel(e){
    if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
    var fn=cancelCb; okCb=null; cancelCb=null; closeConfirm();
    if(typeof fn==='function') setTimeout(fn,0);
  }
  function bindButtons(){
    var ok=byId('confirmOk'), cancel=byId('confirmCancel');
    if(ok && !ok.__gesitConfirmV11){
      ok.__gesitConfirmV11=true;
      ['click','touchend','pointerup'].forEach(function(ev){ ok.addEventListener(ev,runOk,true); });
    }
    if(cancel && !cancel.__gesitConfirmV11){
      cancel.__gesitConfirmV11=true;
      ['click','touchend','pointerup'].forEach(function(ev){ cancel.addEventListener(ev,runCancel,true); });
    }
    var m=byId('modalConfirm');
    if(m && !m.__gesitConfirmV11){
      m.__gesitConfirmV11=true;
      m.addEventListener('click',function(e){ if(e.target===m) runCancel(e); },true);
    }
  }
  function patchConfirm(){
    bindButtons();
    if(window.Confirm && !window.Confirm.__gesitConfirmV11){
      window.Confirm.ask=function(title,text,onOk,onCancel){
        lastTitle=title||'Yakin?'; lastText=text||'';
        var t=byId('confirmTitle'), x=byId('confirmText');
        if(t) t.textContent=lastTitle;
        if(x) x.textContent=lastText;
        okCb=onOk||null; cancelCb=onCancel||null;
        openConfirm(); bindButtons();
      };
      window.Confirm.__gesitConfirmV11=true;
    }
  }
  function init(){
    patchConfirm();
    document.addEventListener('keydown',function(e){
      if(!byId('modalConfirm') || !byId('modalConfirm').classList.contains('is-open')) return;
      if(e.key==='Escape') runCancel(e);
      if(e.key==='Enter') runOk(e);
    },true);
    if(window.MutationObserver){
      new MutationObserver(function(){ patchConfirm(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    }
    setInterval(patchConfirm,800);
    try{document.documentElement.setAttribute('data-gesit-confirm-fix',VER);}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
