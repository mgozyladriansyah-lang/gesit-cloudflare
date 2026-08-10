/* GESIT Notification Center V6
   In-app notification tools + sound + PWA/system notification triggers. */
(function(){
  'use strict';
  var Center = {
    ready:false, audio:null, audioReady:false, soundCandidates:[], items:[], unread:0, panel:null, fab:null, badge:null,
    init:function(){
      if(Center.ready) return; Center.ready=true;
      Center.injectCss(); Center.prepareAudio(); Center.unlockAudioOnGesture(); Center.ensureUi(); Center.restore(); Center.updateUi();
      document.addEventListener('visibilitychange', function(){ if(!document.hidden) Center.updateUi(); });
      setTimeout(Center.updateUi, 800);
    },
    injectCss:function(){
      if(document.getElementById('gesit-notify-center-css')) return;
      var st=document.createElement('style'); st.id='gesit-notify-center-css';
      st.textContent = `
.gesit-notify-fab{position:fixed;right:14px;bottom:calc(104px + env(safe-area-inset-bottom,0px));z-index:12010;width:48px;height:48px;border:0;border-radius:18px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;display:grid;place-items:center;box-shadow:0 16px 38px rgba(13,148,136,.32);cursor:pointer;-webkit-tap-highlight-color:transparent}.gesit-notify-fab svg{width:22px!important;height:22px!important}.gesit-notify-badge{position:absolute;right:-4px;top:-5px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#ef4444;color:#fff;font-size:11px;font-weight:900;display:none;place-items:center;box-shadow:0 6px 14px rgba(239,68,68,.35)}.gesit-notify-fab.has-unread .gesit-notify-badge{display:grid}.gesit-notify-panel{position:fixed;right:14px;bottom:calc(162px + env(safe-area-inset-bottom,0px));z-index:12020;width:min(420px,calc(100vw - 28px));max-height:min(74dvh,640px);overflow:auto;border:1px solid rgba(15,118,110,.16);border-radius:24px;background:#fff;box-shadow:0 24px 75px rgba(15,23,42,.22);padding:14px;display:none}.gesit-notify-panel.is-open{display:block}.gesit-notify-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.gesit-notify-title{font-size:16px;font-weight:950;color:#0f172a}.gesit-notify-sub{font-size:12px;color:#64748b;margin-top:3px;line-height:1.35}.gesit-notify-close{width:36px;height:36px;border:0;border-radius:13px;background:#f1f5f9;color:#334155;display:grid;place-items:center}.gesit-notify-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.gesit-notify-chip{border:1px solid #e2e8f0;border-radius:16px;padding:9px;background:#f8fafc}.gesit-notify-chip b{display:block;font-size:11px;color:#64748b}.gesit-notify-chip span{display:block;margin-top:3px;font-size:12px;font-weight:850;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gesit-notify-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.gesit-notify-actions button{min-height:40px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:850;font-size:12px;padding:8px 10px}.gesit-notify-actions .primary{background:#0d9488;border-color:#0d9488;color:#fff}.gesit-notify-actions .soft{background:#ecfeff;border-color:#99f6e4;color:#0f766e}.gesit-notify-log{display:grid;gap:8px;margin-top:10px}.gesit-notify-item{border:1px solid #e2e8f0;border-radius:16px;padding:10px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.04)}.gesit-notify-item b{display:block;font-size:12.5px;color:#0f172a}.gesit-notify-item p{margin:4px 0 0;font-size:12px;color:#475569;line-height:1.35}.gesit-notify-time{margin-top:5px;font-size:10.5px;color:#94a3b8;font-weight:750}.gesit-notify-empty{border:1px dashed #cbd5e1;border-radius:16px;padding:14px;text-align:center;color:#64748b;font-size:12px;background:#f8fafc}@media(max-width:768px){.gesit-notify-fab{right:14px;bottom:calc(104px + env(safe-area-inset-bottom,0px));width:46px;height:46px}.gesit-notify-panel{left:10px;right:10px;bottom:calc(158px + env(safe-area-inset-bottom,0px));width:auto;max-height:min(72dvh,620px)}body.gesit-tour-active .gesit-notify-fab,body.gesit-tour-active .gesit-notify-panel{display:none!important}}`;
      document.head.appendChild(st);
    },
    ensureUi:function(){
      if(Center.fab) return;
      Center.fab=document.createElement('button'); Center.fab.type='button'; Center.fab.id='gesitNotifyFab'; Center.fab.className='gesit-notify-fab'; Center.fab.setAttribute('aria-label','Buka pusat notifikasi');
      Center.fab.innerHTML=(window.iconSvg?iconSvg('bell'):'🔔')+'<span class="gesit-notify-badge" id="gesitNotifyBadge">0</span>';
      document.body.appendChild(Center.fab); Center.badge=document.getElementById('gesitNotifyBadge'); Center.fab.onclick=Center.toggle;
      Center.panel=document.createElement('section'); Center.panel.id='gesitNotifyPanel'; Center.panel.className='gesit-notify-panel'; Center.panel.setAttribute('aria-label','Pusat notifikasi dan pengujian');
      Center.panel.innerHTML='<div class="gesit-notify-head"><div><div class="gesit-notify-title">Pusat Notifikasi</div><div class="gesit-notify-sub">Aktifkan, uji, dan pantau pesan booking kendaraan, tamu, approval, serta layanan lain tanpa console.</div></div><button type="button" class="gesit-notify-close" id="gesitNotifyClose">'+(window.iconSvg?iconSvg('x'):'×')+'</button></div><div class="gesit-notify-status"><div class="gesit-notify-chip"><b>Izin</b><span id="gesitNotifyPerm">-</span></div><div class="gesit-notify-chip"><b>Suara</b><span id="gesitNotifySound">-</span></div><div class="gesit-notify-chip"><b>PWA</b><span id="gesitNotifyPwa">-</span></div></div><div class="gesit-notify-actions"><button class="primary" id="gesitNotifyEnable">Aktifkan Notifikasi</button><button class="soft" id="gesitNotifyTestAll">Tes Lengkap</button><button id="gesitNotifyTestSound">Tes Suara</button><button id="gesitNotifyTestSystem">Tes Sistem PWA</button><button id="gesitNotifyTestVehicle">Tes Kendaraan</button><button id="gesitNotifyTestGuest">Tes Tamu</button><button id="gesitNotifyTestService">Tes Layanan</button><button id="gesitNotifyClear">Bersihkan Log</button></div><div class="gesit-notify-log" id="gesitNotifyLog"></div>';
      document.body.appendChild(Center.panel);
      document.getElementById('gesitNotifyClose').onclick=Center.close;
      document.getElementById('gesitNotifyEnable').onclick=Center.enable;
      document.getElementById('gesitNotifyTestAll').onclick=function(){Center.test('all');};
      document.getElementById('gesitNotifyTestSound').onclick=Center.testSound;
      document.getElementById('gesitNotifyTestSystem').onclick=function(){Center.browserNotify({title:'Tes Notifikasi PWA',message:'Jika notifikasi perangkat aktif, pesan ini tampil sebagai notifikasi sistem.'});};
      document.getElementById('gesitNotifyTestVehicle').onclick=function(){Center.handle({type:'kendaraan',title:'Booking kendaraan baru',message:'Ada permintaan kendaraan yang perlu diproses.'},{test:true});};
      document.getElementById('gesitNotifyTestGuest').onclick=function(){Center.handle({type:'tamu',title:'Tamu baru',message:'Ada tamu masuk yang perlu ditindaklanjuti.'},{test:true});};
      document.getElementById('gesitNotifyTestService').onclick=function(){Center.handle({type:'layanan',title:'Permintaan layanan baru',message:'Ada permintaan layanan yang masuk.'},{test:true});};
      document.getElementById('gesitNotifyClear').onclick=function(){Center.items=[];Center.unread=0;Center.persist();Center.updateUi();};
      if(window.renderIcons){renderIcons(Center.fab); renderIcons(Center.panel);} 
    },
    open:function(){Center.ensureUi(); Center.panel.classList.add('is-open'); Center.unread=0; Center.persist(); Center.updateUi();},
    close:function(){if(Center.panel)Center.panel.classList.remove('is-open');},
    toggle:function(){Center.ensureUi(); if(Center.panel.classList.contains('is-open')) Center.close(); else Center.open();},
    isStandalone:function(){return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;},
    permission:function(){return ('Notification' in window)?Notification.permission:'unsupported';},
    enable:function(){
      Center.prepareAudio(); Center.playUnlock();
      if(!('Notification' in window)){Center.note('Notifikasi sistem tidak didukung','Browser/perangkat tidak menyediakan Notification API.'); Center.updateUi(); return Promise.resolve('unsupported');}
      return Notification.requestPermission().then(function(p){Center.note('Status izin notifikasi',p==='granted'?'Notifikasi sistem aktif.':'Izin belum aktif: '+p); Center.updateUi(); return p;}).catch(function(){Center.updateUi();});
    },
    prepareAudio:function(){
      Center.soundCandidates=[window.GESIT_NOTIFY_SOUND,'/notification/notify.mp3','/notifications/notify.mp3','/sound/notify.mp3','/sounds/notify.mp3','/audio/notify.mp3','/notif.mp3'].filter(Boolean);
      var i=0; function next(){ if(i>=Center.soundCandidates.length){Center.audioReady=false; Center.updateUi(); return;} var src=Center.soundCandidates[i++]; var a=new Audio(src); a.preload='auto'; a.volume=.85; a.addEventListener('canplaythrough',function(){Center.audio=a; Center.audioReady=true; Center.updateUi();},{once:true}); a.addEventListener('error',next,{once:true}); try{a.load();}catch(e){} Center.audio=a; }
      next();
    },
    unlockAudioOnGesture:function(){var f=function(){Center.playUnlock();document.removeEventListener('click',f,true);document.removeEventListener('touchstart',f,true);};document.addEventListener('click',f,true);document.addEventListener('touchstart',f,true);},
    playUnlock:function(){try{if(!Center.audio)Center.prepareAudio(); if(!Center.audio)return; var old=Center.audio.volume; Center.audio.volume=0; var p=Center.audio.play(); if(p&&p.then)p.then(function(){Center.audio.pause();Center.audio.currentTime=0;Center.audio.volume=old||.85;}).catch(function(){Center.audio.volume=old||.85;});}catch(e){}},
    play:function(){try{if(!Center.audio)Center.prepareAudio(); if(!Center.audio)return; Center.audio.volume=.85; Center.audio.currentTime=0; var p=Center.audio.play(); if(p&&p.catch)p.catch(function(){Center.note('Audio menunggu interaksi','Klik aplikasi sekali lalu tes suara lagi.');});}catch(e){}},
    testSound:function(){Center.play(); Center.toast('Tes suara notifikasi','Jika file notify.mp3 aktif, suara akan terdengar.','info'); Center.note('Tes suara dijalankan','Path utama: /notification/notify.mp3');},
    handle:function(notif,opts){
      opts=opts||{}; notif=Center.normalize(notif); Center.items.unshift({title:notif.title,message:notif.message,type:notif.type,time:Date.now(),test:!!opts.test}); Center.items=Center.items.slice(0,30); Center.unread++; Center.persist(); Center.updateUi(); Center.toast(notif.title,notif.message,'success'); Center.play(); Center.browserNotify(notif); return notif;
    },
    normalize:function(n){n=n||{}; var title=n.title||n.judul||n.subject||'Notifikasi GESIT'; var msg=n.message||n.pesan||n.body||n.deskripsi||'Ada pembaruan baru di aplikasi.'; var raw=String(n.type||n.module||n.view||n.kategori||title+' '+msg).toLowerCase(); var type='layanan'; if(/kendaraan|bbm|vehicle|mobil|booking/.test(raw))type='kendaraan'; else if(/tamu|digitamu|guest/.test(raw))type='tamu'; else if(/approval|persetujuan|setuju/.test(raw))type='approval'; else if(/atk|barang|stok/.test(raw))type='atk'; else if(/ruangan|room/.test(raw))type='ruangan'; return {title:title,message:msg,type:type,url:n.url||n.link||'/'};},
    browserNotify:function(n){
      if(!('Notification' in window) || Notification.permission!=='granted') return;
      var title=n.title||'GESIT'; var body=n.message||'Ada notifikasi baru.'; var data={url:n.url||'/',type:n.type||'gesit'};
      if('serviceWorker' in navigator){navigator.serviceWorker.ready.then(function(reg){reg.showNotification(title,{body:body,tag:'gesit-'+(n.type||'notif'),renotify:true,icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',data:data,vibrate:[80,40,80]}).catch(function(){try{new Notification(title,{body:body,icon:'/icons/icon-192.png',data:data});}catch(e){}});}); return;}
      try{new Notification(title,{body:body,icon:'/icons/icon-192.png',data:data});}catch(e){}
    },
    toast:function(t,m,type){if(window.Toast&&Toast[type||'info'])Toast[type||'info'](t,m);},
    note:function(t,m){Center.items.unshift({title:t,message:m,type:'tools',time:Date.now(),test:true}); Center.items=Center.items.slice(0,30); Center.persist(); Center.updateUi(); Center.toast(t,m,'info');},
    test:function(mode){Center.enable().then(function(){Center.handle({type:'kendaraan',title:'Tes Booking Kendaraan',message:'Simulasi permintaan kendaraan masuk.'},{test:true}); setTimeout(function(){Center.handle({type:'tamu',title:'Tes DIGITAMU',message:'Simulasi tamu baru masuk.'},{test:true});},450); setTimeout(function(){Center.handle({type:'layanan',title:'Tes Layanan',message:'Simulasi permintaan layanan baru.'},{test:true});},900);});},
    updateUi:function(){
      Center.ensureUi(); var p=Center.permission(); var perm=document.getElementById('gesitNotifyPerm'), snd=document.getElementById('gesitNotifySound'), pwa=document.getElementById('gesitNotifyPwa'), log=document.getElementById('gesitNotifyLog');
      if(perm)perm.textContent=p; if(snd)snd.textContent=Center.audioReady?'Siap':'Memuat'; if(pwa)pwa.textContent=Center.isStandalone()?'PWA':'Browser';
      if(Center.badge){Center.badge.textContent=Center.unread>99?'99+':String(Center.unread); Center.fab.classList.toggle('has-unread',Center.unread>0);} 
      if(log){ if(!Center.items.length) log.innerHTML='<div class="gesit-notify-empty">Belum ada notifikasi. Gunakan tombol tes di atas untuk pengujian.</div>'; else log.innerHTML=Center.items.map(function(x){return '<div class="gesit-notify-item"><b>'+Center.esc(x.title)+'</b><p>'+Center.esc(x.message)+'</p><div class="gesit-notify-time">'+Center.esc(Center.labelType(x.type))+' · '+new Date(x.time).toLocaleString('id-ID')+(x.test?' · Tes':'')+'</div></div>';}).join(''); }
    },
    labelType:function(t){return {kendaraan:'Kendaraan',tamu:'Tamu',approval:'Approval',atk:'ATK',ruangan:'Ruangan',layanan:'Layanan',tools:'Tools'}[t]||'GESIT';},
    persist:function(){try{localStorage.setItem('gesit_notify_items',JSON.stringify(Center.items));localStorage.setItem('gesit_notify_unread',String(Center.unread));}catch(e){}},
    restore:function(){try{Center.items=JSON.parse(localStorage.getItem('gesit_notify_items')||'[]');Center.unread=parseInt(localStorage.getItem('gesit_notify_unread')||'0',10)||0;}catch(e){Center.items=[];Center.unread=0;}},
    esc:function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  };
  window.GESIT_NOTIFY=Center;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',Center.init);else Center.init();
})();
