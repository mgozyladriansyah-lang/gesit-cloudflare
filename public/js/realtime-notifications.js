'use strict';

var RealtimeNotif = {
  channel: null,
  audio: null,
  _ready: false,

  init: function () {
    if (RealtimeNotif._ready) return;
    if (!window.supabase || typeof window.supabase.channel !== 'function') {
      console.warn('Supabase realtime client belum tersedia atau belum diinisialisasi.');
      return;
    }

    RealtimeNotif._ready = true;
    try {
      RealtimeNotif.audio = new Audio((window.GESIT_ASSET_BASE || '') + '/sounds/notify.mp3');
      RealtimeNotif.audio.preload = 'auto';
    } catch (e) {
      RealtimeNotif.audio = null;
    }

    RealtimeNotif.channel = window.supabase
      .channel('gesit-realtime-' + (Auth.user && Auth.user.id ? Auth.user.id : 'global'))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'app_notifications'
      }, function (payload) {
        var notif = payload && payload.new ? payload.new : null;
        if (!notif || !RealtimeNotif.isForMe(notif)) return;
        RealtimeNotif.show(notif);
        RealtimeNotif.play();
      })
      .subscribe(function (status) {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime notification channel status:', status);
        }
      });
  },

  isForMe: function (notif) {
    if (!window.Auth || !Auth.user) return false;
    var meId = String(Auth.user.id || '');
    var meRole = String(Auth.user.role || '').toLowerCase();
    var targetUser = String(notif.user_id || notif.target_user_id || notif.recipient_id || '');
    var targetRole = String(notif.role || notif.target_role || '').toLowerCase();

    if (targetUser) return targetUser === meId;
    if (targetRole) return targetRole === meRole;
    if (notif.broadcast === true || notif.broadcast === '1') return true;
    return false;
  },

  play: function () {
    if (!RealtimeNotif.audio) return;
    try {
      RealtimeNotif.audio.currentTime = 0;
      var p = RealtimeNotif.audio.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  },

  show: function (notif) {
    var title = notif.title || notif.judul || 'Notifikasi baru';
    var message = notif.message || notif.pesan || '';
    if (window.Toast && Toast.info) {
      Toast.info(title, message);
      return;
    }
    alert(title + (message ? '\n\n' + message : ''));
  },

  stop: function () {
    if (RealtimeNotif.channel && window.supabase && typeof window.supabase.removeChannel === 'function') {
      try { window.supabase.removeChannel(RealtimeNotif.channel); } catch (e) {}
    }
    RealtimeNotif.channel = null;
    RealtimeNotif._ready = false;
  }
};

window.RealtimeNotif = RealtimeNotif;
