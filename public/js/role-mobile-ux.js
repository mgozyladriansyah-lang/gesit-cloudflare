/* GESIT V14 Role-aware Mobile UI/UX */
(function(){
  'use strict';
  var VER='2026.08.11.11';
  var ROLE_LABELS={super_admin:'Super Admin',admin:'Admin',kabag:'Kabag',staff:'Staff',magang:'Magang',driver:'Driver',cso:'CSO',security:'Security',tad:'TAD'};
  var ROLE_COPY={
    super_admin:['Kontrol penuh','Pantau approval, pengguna, laporan, dan pengaturan inti.'],
    admin:['Operasional admin','Kelola layanan, pengguna, laporan, dan antrian keputusan.'],
    kabag:['Pusat keputusan','Fokus pada approval, monitoring layanan, dan tindak lanjut.'],
    staff:['Layanan harian','Akses cepat kendaraan, ruangan, ATK, tamu, dan Eco Office.'],
    magang:['Aktivitas magang','Presensi, logbook, izin, dan profil tersedia lebih dekat.'],
    driver:['Tugas lapangan','Presensi, izin, Eco Office, dan profil dibuat lebih cepat diakses.'],
    cso:['Layanan CSO','Presensi, izin, Eco Office, dan profil dibuat ringkas.'],
    tad:['Aktivitas TAD','Presensi, izin, Eco Office, dan profil tersedia di depan.'],
    security:['Pos keamanan','Patroli, tamu, insiden, dan Eco Office diprioritaskan.']
  };
  var ACTIONS={
    super_admin:[['approval','Approval','inbox'],['users','User','usercog'],['laporan','Laporan','chart'],['pengaturan','Setting','settings']],
    admin:[['approval','Approval','inbox'],['users','User','usercog'],['laporan','Laporan','chart'],['digitamu','Tamu','users']],
    kabag:[['approval','Approval','inbox'],['laporan','Laporan','chart'],['agenda','Agenda','calendar'],['dashboard','Beranda','dashboard']],
    staff:[['kendaraan','Kendaraan','car'],['ruangan','Ruangan','door'],['atk','ATK','box'],['digitamu','Tamu','users']],
    magang:[['magang-self#presensi','Presensi','clock'],['magang-self#logbook','Logbook','clipboard'],['magang-self#izin','Izin','calendar'],['magang-self#profil','Profil','user']],
    driver:[['tad-self#presensi','Presensi','clock'],['tad-self#izin','Izin','calendar'],['eco','Eco','leaf'],['tad-self#profil','Profil','user']],
    cso:[['tad-self#presensi','Presensi','clock'],['tad-self#izin','Izin','calendar'],['eco','Eco','leaf'],['tad-self#profil','Profil','user']],
    tad:[['tad-self#presensi','Presensi','clock'],['tad-self#izin','Izin','calendar'],['eco','Eco','leaf'],['tad-self#profil','Profil','user']],
    security:[['security','Patroli','shield'],['digitamu','Tamu','users'],['eco','Eco','leaf'],['security#insiden','Insiden','alert']]
  };
  function role(){ return String(window.Auth && Auth.user && Auth.user.role || '').toLowerCase(); }
  function name(){ return String(window.Auth && Auth.user && (Auth.user.nama || Auth.user.name || Auth.user.username) || '').trim(); }
  function mobile(){ return window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768; }
  function can(view){
    if(!view) return true;
    view=String(view).split('#')[0];
    if(window.Router && typeof Router.canAccess === 'function') return Router.canAccess(view);
    if(window.Router && Router.allowed && Router.allowed.indexOf(view)===-1) return false;
    return true;
  }
  function icon(name){ return (typeof window.iconSvg==='function') ? iconSvg(name) : ''; }
  function slugRole(r){ return String(r||'').replace(/_/g,'-'); }
  function setRoleClass(){
    var r=role();
    Array.prototype.slice.call(document.body.classList).forEach(function(c){ if(/^gesit-role-/.test(c)) document.body.classList.remove(c); });
    if(r) document.body.classList.add('gesit-role-'+slugRole(r));
    try{ document.documentElement.setAttribute('data-gesit-role',r||''); }catch(e){}
  }
  function go(target){
    var parts=String(target||'').split('#'); var view=parts[0], tab=parts[1]||'';
    if(view && window.Router && Router.go) Router.go(view);
    if(tab) setTimeout(function(){
      var panel=document.querySelector('[data-view-panel="'+view+'"]') || document.querySelector('#view-'+view) || document;
      var btn=panel.querySelector('.tab[data-tab="'+tab+'"], [data-tab="'+tab+'"]');
      if(btn) btn.click();
    },180);
  }
  function ensureHub(){
    var content=document.querySelector('.content');
    if(!content) return null;
    var hub=document.getElementById('gesitRoleMobileHub');
    if(!hub){ hub=document.createElement('section'); hub.id='gesitRoleMobileHub'; hub.setAttribute('aria-label','Pintasan role mobile'); }
    if(hub.parentNode!==content) content.insertBefore(hub, content.firstChild);
    return hub;
  }
  function renderHub(){
    setRoleClass();
    var hub=ensureHub(); if(!hub) return;
    if(!mobile() || !(window.Auth && Auth.user)){ hub.style.display='none'; return; }
    hub.style.display='block';
    var r=role()||'staff'; var copy=ROLE_COPY[r]||['Pintasan kerja','Akses cepat modul utama sesuai akun.'];
    var actions=(ACTIONS[r]||ACTIONS.staff).filter(function(a){ return can(a[0]); }).slice(0,4);
    var first=name() ? name().split(/\s+/)[0] : 'Pengguna';
    hub.innerHTML='<div class="gesit-role-hub-head"><div><div class="gesit-role-hub-kicker">Mode '+(ROLE_LABELS[r]||r)+'</div><div class="gesit-role-hub-title">'+escape(copy[0])+'</div><div class="gesit-role-hub-sub">'+escape(first)+' · '+escape(copy[1])+'</div></div><div class="gesit-role-hub-pill">Mobile</div></div><div class="gesit-role-actions">'+actions.map(function(a){ return '<button type="button" class="gesit-role-action" data-role-target="'+escape(a[0])+'">'+icon(a[2])+'<span>'+escape(a[1])+'</span></button>'; }).join('')+'</div>';
    Array.prototype.slice.call(hub.querySelectorAll('[data-role-target]')).forEach(function(btn){ btn.addEventListener('click',function(){ go(btn.getAttribute('data-role-target')); }); });
    if(typeof window.renderIcons==='function') renderIcons(hub);
  }
  function escape(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function patchMobileNav(){
    if(!window.MobileNav || MobileNav.__roleUxV14) return;
    var oldRefresh=MobileNav.refresh;
    if(typeof oldRefresh==='function') MobileNav.refresh=function(){ var r=oldRefresh.apply(MobileNav,arguments); setTimeout(renderHub,80); return r; };
    MobileNav.__roleUxV14=true;
  }
  function init(){
    patchMobileNav(); renderHub();
    if(window.MutationObserver){ var t=null; new MutationObserver(function(){ clearTimeout(t); t=setTimeout(function(){ patchMobileNav(); renderHub(); },120); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']}); }
    ['resize','orientationchange','hashchange','click','touchend'].forEach(function(ev){ window.addEventListener(ev,function(){ setTimeout(renderHub,120); },{passive:true,capture:true}); });
    setInterval(function(){ patchMobileNav(); renderHub(); },1600);
    window.GESIT_ROLE_MOBILE_UX={version:VER, refresh:renderHub};
    try{ document.documentElement.setAttribute('data-gesit-role-mobile-ux',VER); }catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
