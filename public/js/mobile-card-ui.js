/* GESIT V25 Mobile Card UI */
(function () {
  'use strict';
  var VER = '2026.08.11.25';
  var busy = false;
  function isMobile() { return window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768; }
  function visible(el) { if (!el) return false; var cs=getComputedStyle(el), r=el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 10 && r.height > 10; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function activeRoot() { return document.querySelector('.view.is-active,[data-view-panel].is-active,.page.is-active') || document.querySelector('.content') || document.body; }
  function isUsersTable(table) { return !!table.closest('[data-view-panel="users"], #view-users, .users-view, [data-view="users"]'); }
  function headersFor(table) { return Array.prototype.map.call(table.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); }); }
  function labelCells(table) { var h=headersFor(table); if(!h.length) return; table.querySelectorAll('tbody tr').forEach(function(tr){ Array.prototype.forEach.call(tr.children,function(td,i){ if(!td.getAttribute('data-label')) td.setAttribute('data-label', h[i] || 'Info'); }); }); }
  function tableToCards(table) { if (!table || table.dataset.mobileCardReady === VER || isUsersTable(table)) return; labelCells(table); table.dataset.mobileCardReady = VER; table.classList.add('gesit-mobile-card-table'); }
  function refreshTables() { if (!isMobile()) return; activeRoot().querySelectorAll('table').forEach(function(t){ if(!t.closest('[data-no-mobile-card],.no-mobile-card')) tableToCards(t); }); }
  function unlockFreeze() { var modal=Array.prototype.some.call(document.querySelectorAll('.modal-backdrop.is-open,.modal.show,.modal[open]'), visible); var sheet=document.querySelector('#mobileMenuSheet.is-open'); var drawer=document.querySelector('#gesitMobileSafeDrawer.is-open'); if(!modal&&!sheet&&!drawer){ document.body.style.overflow=''; document.documentElement.style.overflow=''; document.body.classList.remove('modal-open','has-modal-open','approval-modal-open','confirm-modal-open','public-link-panel-open','has-sheet-open','user-menu-open'); } }
  function refresh(){ if(busy) return; busy=true; requestAnimationFrame(function(){ try{ refreshTables(); unlockFreeze(); } finally{ busy=false; } }); }
  function init(){ refresh(); document.addEventListener('click',function(){ setTimeout(unlockFreeze,900); },true); document.addEventListener('touchend',function(){ setTimeout(unlockFreeze,900); },true); window.addEventListener('resize',function(){ setTimeout(refresh,80);},{passive:true}); window.GESITMobileCardUI={version:VER,refresh:refresh,unlock:unlockFreeze}; try{document.documentElement.setAttribute('data-gesit-mobile-card-v25',VER);}catch(e){} }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
