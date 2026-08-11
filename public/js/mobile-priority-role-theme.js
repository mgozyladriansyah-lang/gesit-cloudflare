/* GESIT V20 Mobile Priority and Role Theme Controller
   Safe design controller: event based only, no MutationObserver, no setInterval, no Router patch.
*/
(function(){
  'use strict';
  var VER='2026.08.11.17';
  var ROLE_LABELS={super_admin:'Super Admin',admin:'Admin',kabag:'Kabag',staff:'Staff',magang:'Magang',driver:'Driver',cso:'CSO',security:'Security',tad:'TAD'};
  function role(){return String(window.Auth && Auth.user && Auth.user.role || '').toLowerCase();}
  function slug(v){return String(v||'').replace(/_/g,'-').replace(/[^a-z0-9-]/g,'');}
  function isMobile(){return window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth<=768;}
  function setRoleClass(){
    var r=role();
    Array.prototype.slice.call(document.body.classList).forEach(function(c){ if(/^gesit-theme-role-/.test(c)) document.body.classList.remove(c); });
    if(r) document.body.classList.add('gesit-theme-role-'+slug(r));
    document.body.setAttribute('data-role-theme',r||'');
  }
  function currentView(){return (window.Router && Router.current) || (document.querySelector('.view.is-active,[data-view-panel].is-active')||{}).getAttribute && (document.querySelector('.view.is-active,[data-view-panel].is-active')||{}).getAttribute('data-view-panel') || 'dashboard';}
  function priorityFromButton(btn){
    if(!btn) return '';
    var type=btn.getAttribute('data-mnav')||'';
    var view=btn.getAttribute('data-view')||'';
    var tab=btn.getAttribute('data-tab-target')||'';
    if(type==='sheet') return 'services';
    if(type==='profile') return 'profile';
    if(view==='approval') return 'approval';
    if(view==='laporan') return 'reports';
    if(tab==='profil') return 'profile';
    if(view==='dashboard') return 'home';
    return view || type || 'home';
  }
  function setPriority(p,label){
    if(!p) p='home';
    document.body.setAttribute('data-mobile-priority',p);
    ensureBanner(label || labelForPriority(p));
  }
  function labelForPriority(p){return {home:'Beranda',services:'Layanan',approval:'Approval',reports:'Laporan',profile:'Profil'}[p] || 'Fokus';}
  function ensureBanner(label){
    if(!isMobile()) return;
    var root=document.querySelector('.content'); if(!root) return;
    var b=document.getElementById('gesitMobilePriorityBanner');
    if(!b){ b=document.createElement('section'); b.id='gesitMobilePriorityBanner'; b.setAttribute('aria-label','Prioritas tampilan mobile'); root.insertBefore(b,root.firstChild); }
    var r=role(); var rl=ROLE_LABELS[r]||'GESIT'; var view=currentView();
    b.innerHTML='<div class="gmpb-icon">'+svgIcon(iconFor(view))+'</div><div><div class="gmpb-kicker">Fokus '+escape(label||'Beranda')+'</div><strong>'+escape(rl)+'</strong><span>Tampilan utama mengikuti bottom nav yang sedang dipilih.</span></div>';
  }
  function svgIcon(name){if(typeof window.iconSvg==='function') return iconSvg(name); return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle></svg>';}
  function iconFor(view){var m={dashboard:'dashboard',approval:'inbox',laporan:'chart',users:'usercog',pengaturan:'settings',digitamu:'users',kendaraan:'car',ruangan:'door',atk:'box',magang:'grad',tad:'clock',security:'shield',eco:'leaf'}; return m[view]||'dashboard';}
  function escape(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function onClick(e){
    var btn=e.target && e.target.closest && e.target.closest('#mobileBottomNav .gesit-mobile-nav-btn');
    if(btn){ setRoleClass(); setPriority(priorityFromButton(btn), (btn.textContent||'').trim()); setTimeout(function(){sync();},120); return; }
    var item=e.target && e.target.closest && e.target.closest('#mobileMenuSheet [data-mview]');
    if(item){ setRoleClass(); var label=(item.textContent||'').trim(); setPriority(item.getAttribute('data-mview')||'services',label); setTimeout(function(){sync();},160); }
  }
  function sync(){setRoleClass(); if(!document.body.getAttribute('data-mobile-priority')) setPriority(currentView()==='dashboard'?'home':currentView()); else ensureBanner(labelForPriority(document.body.getAttribute('data-mobile-priority'))); try{document.documentElement.setAttribute('data-gesit-mobile-priority',VER);}catch(e){} }
  function init(){setRoleClass(); sync(); document.addEventListener('click',onClick,true); document.addEventListener('touchend',onClick,true); window.addEventListener('hashchange',function(){setTimeout(sync,80);},{passive:true}); window.addEventListener('resize',function(){setTimeout(sync,80);},{passive:true}); window.GESIT_MOBILE_PRIORITY={version:VER,sync:sync,setPriority:setPriority};}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
