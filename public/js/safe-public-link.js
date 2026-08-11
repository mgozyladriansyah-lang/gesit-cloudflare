/* GESIT V19 Safe Public Link + Mobile UX
   Mengganti modal Halaman Publik dengan panel ringan agar tidak freeze di mobile.
   Tidak memakai MutationObserver, setInterval, iframe, atau blocking modal.
*/
(function(){
  'use strict';
  var VER='2026.08.11.16';
  var MAP={
    dashboard:['checkin','checkin-bbm','lamaran-magang','presensi-magang','checkin-tad'],
    digitamu:['checkin'],
    kendaraan:['checkin-bbm'],
    magang:['lamaran-magang','presensi-magang'],
    tad:['checkin-tad']
  };
  var LABEL={
    checkin:{icon:'👥',title:'Check-in Tamu',desc:'Registrasi mandiri tamu tanpa login.'},
    'checkin-bbm':{icon:'⛽',title:'Input BBM Driver',desc:'Form pengisian BBM dari HP driver.'},
    'lamaran-magang':{icon:'🎓',title:'Lamaran Magang',desc:'Form lamaran magang publik dan unggah CV.'},
    'presensi-magang':{icon:'🕘',title:'Presensi Magang',desc:'Absen masuk/pulang peserta magang.'},
    'checkin-tad':{icon:'🛡️',title:'Presensi TAD',desc:'Absen tenaga alih daya tanpa login.'}
  };
  function byId(id){return document.getElementById(id);}
  function q(s,r){return (r||document).querySelector(s);}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function appBase(){
    var base='';
    try{ if(window.AppInfo && AppInfo.url) base=AppInfo.url; }catch(e){}
    if(!base) base=location.origin+location.pathname;
    return base;
  }
  function publicUrl(page){
    var base=appBase();
    return base + (base.indexOf('?')===-1 ? '?' : '&') + 'page=' + encodeURIComponent(page);
  }
  function closePanel(){
    var p=byId('gesitPublicLinkPanel');
    if(p) p.classList.remove('is-open');
    document.body.classList.remove('public-link-panel-open');
    document.body.style.overflow='';
  }
  function ensurePanel(){
    var p=byId('gesitPublicLinkPanel');
    if(p) return p;
    p=document.createElement('section');
    p.id='gesitPublicLinkPanel';
    p.className='gesit-public-link-panel';
    p.setAttribute('aria-label','Tautan halaman publik');
    p.innerHTML='<div class="gpl-scrim" data-gpl-close="1"></div><div class="gpl-card"><div class="gpl-handle"></div><div class="gpl-head"><div><div class="gpl-kicker">Halaman publik</div><h3>Tautan cepat tanpa login</h3><p>Pilih tautan yang ingin dibuka atau disalin. Panel ini dibuat ringan agar mobile tidak freeze.</p></div><button type="button" class="gpl-close" data-gpl-close="1">×</button></div><div class="gpl-list" id="gesitPublicLinkList"></div></div>';
    document.body.appendChild(p);
    p.addEventListener('click',function(e){
      var t=e.target;
      if(t && t.closest('[data-gpl-close]')){e.preventDefault(); closePanel(); return;}
      var copy=t && t.closest('[data-gpl-copy]');
      if(copy){
        e.preventDefault();
        var text=copy.getAttribute('data-gpl-copy')||'';
        copyText(text).then(function(ok){
          copy.textContent=ok?'Tersalin':'Salin manual';
          setTimeout(function(){copy.textContent='Salin';},1200);
        });
      }
    },true);
    return p;
  }
  function copyText(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(text).then(function(){return true;},function(){return fallbackCopy(text);});
    }
    return Promise.resolve(fallbackCopy(text));
  }
  function fallbackCopy(text){
    try{
      var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      var ok=document.execCommand('copy'); ta.remove(); return ok;
    }catch(e){return false;}
  }
  function render(view){
    var pages=MAP[view] || MAP.dashboard;
    var list=byId('gesitPublicLinkList'); if(!list) return;
    list.innerHTML=pages.map(function(page){
      var m=LABEL[page]||{icon:'🔗',title:page,desc:''};
      var url=publicUrl(page);
      return '<article class="gpl-item"><div class="gpl-ico">'+esc(m.icon)+'</div><div class="gpl-main"><strong>'+esc(m.title)+'</strong><span>'+esc(m.desc)+'</span><input readonly value="'+esc(url)+'"></div><div class="gpl-actions"><a class="gpl-open" target="_blank" rel="noopener" href="'+esc(url)+'">Buka</a><button type="button" data-gpl-copy="'+esc(url)+'">Salin</button></div></article>';
    }).join('');
  }
  function open(view){
    var panel=ensurePanel();
    render(view || 'dashboard');
    requestAnimationFrame(function(){
      document.body.classList.add('public-link-panel-open');
      panel.classList.add('is-open');
      document.body.style.overflow='hidden';
    });
  }
  function intercept(e){
    var btn=e.target && e.target.closest && e.target.closest('[data-publink]');
    if(!btn) return;
    e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    open(btn.getAttribute('data-publink')||'dashboard');
  }
  function patchPublicLink(){
    if(window.PublicLink){
      PublicLink.open=open;
      PublicLink.__safeV19=true;
    }
  }
  function init(){
    document.addEventListener('click',intercept,true);
    document.addEventListener('touchend',intercept,true);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') closePanel(); },true);
    patchPublicLink();
    setTimeout(patchPublicLink,200);
    window.GESIT_PUBLIC_LINK_SAFE={version:VER,open:open,close:closePanel};
    try{document.documentElement.setAttribute('data-gesit-public-link-safe',VER);}catch(e){}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
