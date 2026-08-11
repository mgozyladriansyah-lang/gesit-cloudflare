/* GESIT V25 Mobile User UI
   Manajemen User mobile tidak lagi memakai tampilan table desktop.
*/
(function(){
  'use strict';
  var VER='2026.08.11.25';
  var busy=false;
  function isMobile(){return window.matchMedia?window.matchMedia('(max-width:768px)').matches:window.innerWidth<=768;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function norm(s){return String(s||'').toLowerCase().replace(/\s+/g,' ').trim();}
  function icon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19a6 6 0 0 0-12 0"></path><circle cx="9" cy="7" r="4"></circle><circle cx="17" cy="17" r="3"></circle><path d="M17 14v-2M17 22v-2M14.4 15.5l-1.7-1M21.3 20l-1.7-1M14.4 18.5l-1.7 1M21.3 14l-1.7 1"></path></svg>';}
  function usersRoot(){return document.querySelector('[data-view-panel="users"], #view-users, .users-view') || (document.body.getAttribute('data-current-view')==='users'?document.querySelector('.view.is-active'):null);}
  function tableOf(root){if(!root) return null; return root.querySelector('table');}
  function headers(table){return Array.prototype.map.call(table.querySelectorAll('thead th'),function(th){return norm(th.textContent);});}
  function valueByLabels(row, heads, labels){var cells=Array.prototype.slice.call(row.children); for(var i=0;i<heads.length;i++){for(var j=0;j<labels.length;j++){if(heads[i].indexOf(labels[j])>=0) return (cells[i]&&cells[i].textContent||'').trim();}} return '';}
  function actions(row){var last=row.children[row.children.length-1]; if(!last) return ''; var clone=last.cloneNode(true); clone.querySelectorAll('script,style').forEach(function(x){x.remove();}); return clone.innerHTML;}
  function render(){
    if(!isMobile()) return;
    var root=usersRoot(); if(!root) return;
    var table=tableOf(root); if(!table) return;
    var wrap=table.closest('.table-wrap,.table-responsive,.card, .data-table-wrap') || table.parentElement;
    var heads=headers(table);
    var rows=Array.prototype.slice.call(table.querySelectorAll('tbody tr')).filter(function(tr){return tr.children.length;});
    if(!rows.length) return;
    var list=root.querySelector('.gesit-mobile-user-list');
    if(!list){list=document.createElement('div'); list.className='gesit-mobile-user-list'; wrap.parentNode.insertBefore(list, wrap.nextSibling);}
    list.innerHTML=rows.map(function(row){
      var name=valueByLabels(row,heads,['nama','name']) || (row.children[0]&&row.children[0].textContent.trim()) || 'User';
      var username=valueByLabels(row,heads,['username','user']) || '';
      var role=valueByLabels(row,heads,['role','peran']) || '';
      var bagian=valueByLabels(row,heads,['bagian','department','unit']) || '';
      var status=valueByLabels(row,heads,['status']) || '';
      var last=valueByLabels(row,heads,['last','login','updated','dibuat','created']) || '';
      var initial=(name||username||'U').trim().slice(0,2).toUpperCase();
      var statusClass=/aktif|active/i.test(status)?'is-active':'is-muted';
      return '<article class="gesit-user-card">'+
        '<div class="guc-avatar">'+esc(initial)+'</div>'+
        '<div class="guc-main"><div class="guc-top"><strong>'+esc(name)+'</strong><span class="guc-status '+statusClass+'">'+esc(status||'Status')+'</span></div>'+
        '<div class="guc-sub">'+esc(username)+(bagian?' · '+esc(bagian):'')+'</div>'+
        '<div class="guc-meta">'+(role?'<span>'+esc(role)+'</span>':'')+(last?'<span>'+esc(last)+'</span>':'')+'</div>'+
        '<div class="guc-actions">'+actions(row)+'</div></div></article>';
    }).join('');
    table.classList.add('gesit-users-table-hidden-mobile');
  }
  function refresh(){if(busy)return;busy=true;requestAnimationFrame(function(){try{render();}finally{busy=false;}});}
  function init(){refresh();document.addEventListener('click',function(){setTimeout(refresh,250);},true);window.addEventListener('resize',function(){setTimeout(refresh,120);},{passive:true});window.GESITMobileUserUI={version:VER,refresh:refresh};}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
