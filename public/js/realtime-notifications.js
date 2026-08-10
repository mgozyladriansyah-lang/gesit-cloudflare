'use strict';

var RealtimeNotif = {
  channel: null,
  audio: null,
  audioReady: false,
  soundCandidates: [],

  init: function () {
    RealtimeNotif.soundCandidates = [
      window.GESIT_NOTIFY_SOUND,
      '/notification/notify.mp3',
      '/notifications/notify.mp3',
      '/sound/notify.mp3',
      '/sounds/notify.mp3',
      '/audio/notify.mp3',
      '/notif.mp3'
    ].filter(Boolean);

    RealtimeNotif.prepareAudio();
    RealtimeNotif.unlockOnGesture();

    if (!window.supabase) {
      console.warn('Supabase realtime client belum tersedia atau belum diinisialisasi.');
      return;
    }

    if (RealtimeNotif.channel) return;

    RealtimeNotif.channel = window.supabase
      .channel('gesit-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_notifications' }, function (payload) {
        var notif = payload.new || {};
        console.log('REALTIME NOTIFICATION', notif);
        RealtimeNotif.show(notif);
        if (!(window.GESIT_NOTIFY && GESIT_NOTIFY.handle)) RealtimeNotif.play();
      })
      .subscribe();
  },

  prepareAudio: function () {
    var i = 0;
    function next() {
      if (i >= RealtimeNotif.soundCandidates.length) return;
      var src = RealtimeNotif.soundCandidates[i++];
      var a = new Audio(src);
      a.preload = 'auto';
      a.volume = 0.85;
      a.addEventListener('canplaythrough', function () {
        RealtimeNotif.audio = a;
        RealtimeNotif.audioReady = true;
        console.log('[NOTIF] Sound siap:', src);
      }, { once: true });
      a.addEventListener('error', next, { once: true });
      try { a.load(); } catch (e) {}
      RealtimeNotif.audio = a;
    }
    next();
  },

  unlockOnGesture: function () {
    var unlock = function () {
      if (!RealtimeNotif.audio) RealtimeNotif.prepareAudio();
      if (!RealtimeNotif.audio) return;
      try {
        var old = RealtimeNotif.audio.volume;
        RealtimeNotif.audio.volume = 0;
        var p = RealtimeNotif.audio.play();
        if (p && p.then) {
          p.then(function () {
            RealtimeNotif.audio.pause();
            RealtimeNotif.audio.currentTime = 0;
            RealtimeNotif.audio.volume = old || 0.85;
          }).catch(function () {
            RealtimeNotif.audio.volume = old || 0.85;
          });
        }
      } catch (e) {}
      document.removeEventListener('click', unlock, true);
      document.removeEventListener('touchstart', unlock, true);
    };
    document.addEventListener('click', unlock, true);
    document.addEventListener('touchstart', unlock, true);
  },

  play: function () {
    try {
      if (!RealtimeNotif.audio) RealtimeNotif.prepareAudio();
      if (!RealtimeNotif.audio) return;
      RealtimeNotif.audio.volume = 0.85;
      RealtimeNotif.audio.currentTime = 0;
      var p = RealtimeNotif.audio.play();
      if (p && p.catch) p.catch(function (e) {
        console.warn('[NOTIF] Audio belum boleh diputar sampai ada interaksi user:', e && e.message);
      });
    } catch (e) {
      console.error(e);
    }
  },

  show: function (notif) {
    if (window.GESIT_NOTIFY && GESIT_NOTIFY.handle) {
      GESIT_NOTIFY.handle(notif);
      return;
    }
    if (window.Toast) {
      Toast.success(notif.title || 'Notifikasi', notif.message || 'Ada notifikasi baru.');
      return;
    }
    alert((notif.title || 'Notifikasi') + '\n\n' + (notif.message || 'Ada notifikasi baru.'));
  },

  testSound: function () {
    RealtimeNotif.play();
    if (window.Toast) Toast.info('Tes suara notifikasi', 'Jika file MP3 berada di /notification/notify.mp3, suara akan terdengar.');
  }
};

window.RealtimeNotif = RealtimeNotif;
window.GESIT_SOUND_TEST = function () {
  if (window.GESIT_NOTIFY && GESIT_NOTIFY.testSound) return GESIT_NOTIFY.testSound();
  if (!RealtimeNotif.audio) RealtimeNotif.prepareAudio();
  RealtimeNotif.testSound();
};
