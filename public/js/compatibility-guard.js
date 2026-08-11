/* GESIT V13 Compatibility Guard for V2-V12 patches */
(function(){
  'use strict';
  var VER='2026.08.11.10';
  var WRAPPED=false;
  var LAST={};
  function q(s){ return document.querySelector(s); }
  function byId(id){ return document.getElementById(id); }
  function openModalCount(){ return document.querySelectorAll('.modal-backdrop.is-open').length; }
  function approvalOpen(){ return !!q('#modalApproveKnd.is-open,#modalApproveRng.is-open,#modalApproveAtk.is-open,#modalReject.is-open'); }
  function confirmOpen(){ var m=byId('modalConfirm'); return !!(m && m.classList.contains('is-open')); }
  function tourOpen(){ return !!q('.tour-tip'); }
  function syncClasses(){
    var modal=openModalCount()>0;
    document.body.classList.toggle('has-modal-open', modal);
    document.body.classList.toggle('approval-modal-open', approvalOpen());
    document.body.classList.toggle('confirm-modal-open', confirmOpen());
    document.body.classList.toggle('gesit-tour-active', tourOpen());
    var nav=byId('mobileBottomNav');
    if(nav){
      if(modal || approvalOpen() || confirmOpen()){
        nav.style.display='none'; nav.style.visibility='hidden'; nav.style.pointerEvents='none';
      } else {
        nav.style.display=''; nav.style.visibility=''; nav.style.pointerEvents='';
      }
    }
  }
  function preventRepeat(key, ms){
    var now=Date.now();
    if(LAST[key] && now-LAST[key] < (ms||2500)) return false;
    LAST[key]=now; return true;
  }
  function wrapApproval(){
    if(!window.ApprovalModule || WRAPPED) return;
    [['submitKnd','apkSubmit'],['submitRng','aprSubmit'],['submitAtk','apaSubmit']].forEach(function(pair){
      var name=pair[0], bid=pair[1];
      if(typeof ApprovalModule[name] !== 'function' || ApprovalModule[name].__v13Guard) return;
      var old=ApprovalModule[name];
      var wrapped=function(){
        var btn=byId(bid);
        if(btn && btn.disabled) return;
        if(!preventRepeat(name, 2200)) return;
        return old.apply(ApprovalModule, arguments);
      };
      wrapped.__v13Guard=true;
      ApprovalModule[name]=wrapped;
    });
    WRAPPED=true;
  }
  function bindCriticalButtons(){
    [['apkSubmit','submitKnd'],['aprSubmit','submitRng'],['apaSubmit','submitAtk']].forEach(function(pair){
      var b=byId(pair[0]);
      if(!b || b.__v13CriticalBind) return;
      b.__v13CriticalBind=true;
      ['touchend','pointerup'].forEach(function(ev){
        b.addEventListener(ev,function(e){
          if(e){ e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); }
          if(!window.ApprovalModule || typeof ApprovalModule[pair[1]]!=='function') return;
          ApprovalModule[pair[1]]();
        }, true);
      });
    });
  }
  function patchModalOnce(){
    if(!window.Modal || Modal.__v13Compat) return;
    var oldOpen=Modal.open, oldClose=Modal.close, oldCloseAll=Modal.closeAll;
    Modal.open=function(){ var r=oldOpen.apply(Modal,arguments); setTimeout(run,0); return r; };
    Modal.close=function(){ var r=oldClose.apply(Modal,arguments); setTimeout(run,0); return r; };
    Modal.closeAll=function(){ var r=oldCloseAll.apply(Modal,arguments); setTimeout(run,0); return r; };
    Modal.__v13Compat=true;
  }
  function run(){ syncClasses(); wrapApproval(); bindCriticalButtons(); patchModalOnce(); }
  function init(){
    run();
    if(window.MutationObserver){ new MutationObserver(function(){ run(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']}); }
    ['click','touchend','pointerup','resize','orientationchange','scroll'].forEach(function(ev){ window.addEventListener(ev,function(){ setTimeout(run,30); },{passive:true,capture:true}); });
    setInterval(run,1000);
    window.GESIT_PATCH_COMPATIBILITY = { version: VER, sync: run, last: LAST };
    try{ document.documentElement.setAttribute('data-gesit-compat-guard',VER); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
