/* GESIT V12 Approval Modal Footer/Bottom Nav Fix */
(function(){
  'use strict';
  var VER='2026.08.11.09';
  var APPROVAL_IDS=['modalApproveKnd','modalApproveRng','modalApproveAtk','modalReject'];
  function byId(id){ return document.getElementById(id); }
  function anyApprovalOpen(){ return APPROVAL_IDS.some(function(id){ var m=byId(id); return !!(m && m.classList.contains('is-open')); }); }
  function sync(){
    var open=anyApprovalOpen();
    document.body.classList.toggle('approval-modal-open', open);
    document.body.classList.toggle('has-modal-open', !!document.querySelector('.modal-backdrop.is-open'));
    var nav=byId('mobileBottomNav');
    if(nav){
      if(open){ nav.style.display='none'; nav.style.pointerEvents='none'; nav.style.visibility='hidden'; }
      else { nav.style.display=''; nav.style.pointerEvents=''; nav.style.visibility=''; }
    }
    APPROVAL_IDS.forEach(function(id){
      var m=byId(id); if(!m) return;
      if(m.classList.contains('is-open')){
        m.style.zIndex='2147482100'; m.style.pointerEvents='auto';
        var modal=m.querySelector('.modal'); if(modal) modal.style.zIndex='2147482101';
        var footer=m.querySelector('.modal-footer'); if(footer){ footer.style.pointerEvents='auto'; footer.style.zIndex='2147482102'; }
      }
    });
  }
  function callSubmit(id){
    if(!(window.ApprovalModule)) return;
    if(id==='apkSubmit' && typeof ApprovalModule.submitKnd==='function') ApprovalModule.submitKnd();
    if(id==='aprSubmit' && typeof ApprovalModule.submitRng==='function') ApprovalModule.submitRng();
    if(id==='apaSubmit' && typeof ApprovalModule.submitAtk==='function') ApprovalModule.submitAtk();
  }
  function bind(){
    ['apkSubmit','aprSubmit','apaSubmit'].forEach(function(id){
      var b=byId(id);
      if(!b || b.__gesitApprovalV12) return;
      b.__gesitApprovalV12=true;
      ['pointerup','touchend'].forEach(function(ev){
        b.addEventListener(ev,function(e){
          e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
          if(b.disabled) return;
          callSubmit(id);
        },true);
      });
    });
  }
  function patchModal(){
    if(window.Modal && !Modal.__approvalV12){
      var oldOpen=Modal.open, oldClose=Modal.close, oldCloseAll=Modal.closeAll;
      Modal.open=function(id){ var r=oldOpen.apply(Modal,arguments); setTimeout(sync,0); setTimeout(bind,0); return r; };
      Modal.close=function(id){ var r=oldClose.apply(Modal,arguments); setTimeout(sync,0); return r; };
      Modal.closeAll=function(){ var r=oldCloseAll.apply(Modal,arguments); setTimeout(sync,0); return r; };
      Modal.__approvalV12=true;
    }
  }
  function init(){
    patchModal(); bind(); sync();
    if(window.MutationObserver){ new MutationObserver(function(){ patchModal(); bind(); sync(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']}); }
    ['resize','orientationchange','click','touchend'].forEach(function(ev){ window.addEventListener(ev,function(){ setTimeout(sync,40); bind(); },{passive:true,capture:true}); });
    setInterval(function(){ patchModal(); bind(); sync(); },1000);
    try{document.documentElement.setAttribute('data-gesit-approval-footer-fix',VER);}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
