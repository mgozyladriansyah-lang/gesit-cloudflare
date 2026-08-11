/* GESIT V22 Mobile Card UI
   Purpose: mobile PWA gets card/list UI instead of desktop table clone.
   Safety: event based only, no MutationObserver, no setInterval, no Router monkey patch.
*/
(function(){
  'use strict';
  var VER='2026.08.11.19';
  function mobile(){ return window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768; }
  function qs(sel,root){ return (root||document).querySelector(sel); }
  function qsa(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function icon(name){
    if(typeof window.iconSvg==='function') return iconSvg(name);
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle></svg>';
  }
  function titleCase(s){ return String(s||'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim(); }
  function labelTables(root){
    if(!mobile()) return;
    qsa('table',root).forEach(function(table){
      if(table.classList.contains('no-mobile-card')) return;
      var heads=qsa('thead th',table).map(function(th){return titleCase(th.textContent);});
      if(!heads.length) return;
      table.classList.add('gesit-mobile-card-table');
      qsa('tbody tr',table).forEach(function(tr){
        tr.classList.add('gesit-mobile-row-card');
        qsa('td',tr).forEach(function(td,i){
          if(!td.getAttribute('data-label')) td.setAttribute('data-label',heads[i]||'Info');
          if(i===0) td.classList.add('is-primary-cell');
          if(/aksi|action/i.test(heads[i]||'')) td.classList.add('is-action-cell');
        });
      });
    });
  }
  function currentView(){ return (window.Router && Router.current) || (qs('.view.is-active,[data-view-panel].is-active')||{}).getAttribute && (qs('.view.is-active,[data-view-panel].is-active')||{}).getAttribute('data-view-panel') || ''; }
  function userRows(){ return qsa('#userTableBody tr'); }
  function ensureUserMobileTools(){
    if(!mobile()) return;
    var panel=qs('[data-view-panel="users"]'); if(!panel) return;
    var header=panel.querySelector('.page-header'); if(header) header.classList.add('mobile-action-header');
    var existing=qs('#mobileUserTools');
    if(!existing){
      existing=document.createElement('section');
      existing.id='mobileUserTools';
      existing.className='mobile-users-tools';
      existing.innerHTML='<div class="mut-title"><div class="mut-icon">'+icon('usercog')+'</div><div><strong>Manajemen User</strong><span>Kelola akun dengan tampilan kartu mobile.</span></div></div><div class="mut-search"><span>'+icon('search')+'</span><input id="mobileUserSearch" type="search" placeholder="Cari nama, username, role, bagian, status"></div><div class="mut-chips"><button type="button" data-user-filter="all" class="is-active">Semua <b id="mutCountAll">0</b></button><button type="button" data-user-filter="active">Aktif <b id="mutCountActive">0</b></button><button type="button" data-user-filter="inactive">Nonaktif <b id="mutCountInactive">0</b></button></div>';
      var card=panel.querySelector('.card');
      panel.insertBefore(existing,card || panel.firstChild);
      var search=existing.querySelector('#mobileUserSearch');
      if(search) search.addEventListener('input',filterUsers,{passive:true});
      existing.addEventListener('click',function(e){
        var btn=e.target && e.target.closest('[data-user-filter]'); if(!btn) return;
        qsa('[data-user-filter]',existing).forEach(function(x){x.classList.remove('is-active');});
        btn.classList.add('is-active');
        existing.setAttribute('data-filter',btn.getAttribute('data-user-filter')||'all');
        filterUsers();
      },true);
    }
    decorateUserRows();
    updateUserCounts();
  }
  function decorateUserRows(){
    userRows().forEach(function(tr){
      tr.classList.add('mobile-user-card');
      var first=tr.querySelector('td');
      if(first && !first.querySelector('.mobile-row-avatar')){
        var text=(first.textContent||'?').trim();
        var initials=text.split(/\s+/).map(function(x){return x.charAt(0);}).join('').slice(0,2).toUpperCase()||'?';
        var wrap=document.createElement('span');
        wrap.className='mobile-row-avatar';
        wrap.textContent=initials;
        first.insertBefore(wrap,first.firstChild);
      }
    });
  }
  function rowStatus(tr){
    var s=(tr.textContent||'').toLowerCase();
    if(/nonaktif|inactive|disable|blokir/.test(s)) return 'inactive';
    if(/aktif|active/.test(s)) return 'active';
    return 'all';
  }
  function filterUsers(){
    var tools=qs('#mobileUserTools'); if(!tools) return;
    var q=(qs('#mobileUserSearch')||{value:''}).value.toLowerCase().trim();
    var f=tools.getAttribute('data-filter') || 'all';
    userRows().forEach(function(tr){
      var text=(tr.textContent||'').toLowerCase();
      var okText=!q || text.indexOf(q)>-1;
      var st=rowStatus(tr);
      var okFilter=(f==='all') || (f===st);
      tr.style.display=(okText && okFilter)?'':'none';
    });
  }
  function updateUserCounts(){
    var rows=userRows();
    var active=0,inactive=0;
    rows.forEach(function(tr){ var st=rowStatus(tr); if(st==='active') active++; if(st==='inactive') inactive++; });
    var all=qs('#mutCountAll'), a=qs('#mutCountActive'), i=qs('#mutCountInactive');
    if(all) all.textContent=rows.length;
    if(a) a.textContent=active;
    if(i) i.textContent=inactive;
  }
  function improveMobilePanels(){
    if(!mobile()) return;
    labelTables(document);
    ensureUserMobileTools();
    qsa('.table-wrap').forEach(function(w){ w.classList.add('gesit-mobile-table-wrap'); });
    qsa('.page-header').forEach(function(h){ h.classList.add('gesit-mobile-page-header'); });
    try{ document.documentElement.setAttribute('data-gesit-mobile-card-ui',VER); }catch(e){}
  }
  function schedule(){ setTimeout(improveMobilePanels,40); setTimeout(improveMobilePanels,260); setTimeout(improveMobilePanels,900); }
  function init(){
    improveMobilePanels();
    ['click','touchend','hashchange','resize','orientationchange'].forEach(function(ev){ window.addEventListener(ev,schedule,{passive:true,capture:true}); });
    document.addEventListener('input',function(e){ if(e.target && e.target.id==='mobileUserSearch') filterUsers(); },true);
    window.GESIT_MOBILE_CARD_UI={version:VER,refresh:improveMobilePanels,filterUsers:filterUsers};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
