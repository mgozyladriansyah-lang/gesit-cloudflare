/* PATCH API — ALIAS REGISTRASI & TELEGRAM
   Pasang di Apps Script setelah Registrasi_Fase5.gs dan sebelum Patch_Server_Komunikasi.gs. */
(function daftarAksiRegistrasiTelegram_() {
  try {
    API_ACTIONS.publicRegisterUser = { handler: function (d) { return publicRegisterUser(d); }, auth: false };
    API_ACTIONS.publicCekTelegramLink = { handler: function (d) { return publicCekTelegramLink(d); }, auth: false };
    API_ACTIONS.publicResumeTelegramLink = { handler: function (d) { return publicResumeTelegramLink(d); }, auth: false };
    API_ACTIONS.getTelegramLinkSelf = { handler: function (d, u) { return getTelegramLinkSelf(u); }, auth: true };
    API_ACTIONS.pompaTelegram = { handler: function () { return pompaTelegram(); }, auth: false };
    API_ACTIONS.ensureTelegramDelivery = { handler: function (d, u) { return pastikanJalurTelegram(u, d && d.mode); }, auth: true, roles: ['admin', 'super_admin'] };
    API_ACTIONS.diagnosaTelegram = { handler: function (d, u) { return diagnosaTelegram(u); }, auth: true, roles: ['admin', 'super_admin'] };
    API_ACTIONS.getWebhookInfo = { handler: function (d, u) { return getTelegramWebhookInfo(u); }, auth: true, roles: ['admin', 'super_admin'] };
  } catch (e) { console.error('Patch_API_Telegram_Registrasi: gagal daftar aksi - ' + e.message); }
})();
