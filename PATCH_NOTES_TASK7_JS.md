# Patch Task 7 - Frontend JavaScript

File yang diperbaiki:

- `public/js/netlify-adapter.js`
- `public/js/pwa-install.js`
- `public/js/realtime-notifications.js`

Hasil audit awal:

- 9 file JavaScript lolos `node --check`.
- Perbaikan tetap dibuat karena ada risiko runtime, terutama pada mode Netlify/PWA/realtime.

Perbaikan inti:

1. `netlify-adapter.js`
   - Menormalisasi URL publik agar tetap memakai domain Netlify, bukan URL Apps Script dari backend.
   - Menormalisasi response `getAppInfo` dan bundle boot `getModuleBundle({ module: 'boot' })`.
   - Menambahkan `credentials: 'same-origin'`.
   - Pesan error HTTP/JSON dibuat lebih jelas.

2. `pwa-install.js`
   - Service worker tetap didaftarkan walau script dimuat setelah event `load`.
   - Path `service-worker.js` lebih aman untuk deployment root maupun subfolder.
   - Banner update tetap kompatibel dengan ikon aplikasi.

3. `realtime-notifications.js`
   - Mencegah subscribe ganda saat `App.onUserReady()` terpanggil ulang.
   - Mengecek client Supabase sudah benar-benar berupa client realtime (`channel` tersedia).
   - Notifikasi difilter ke user/role yang sesuai, atau hanya broadcast yang eksplisit.
   - Audio play memakai `.catch()` agar tidak menimbulkan uncaught promise jika browser memblokir autoplay.
   - Fallback toast memakai `Toast.info`, bukan `Toast.success`, agar notifikasi baru tidak selalu tampak sebagai aksi berhasil.

Catatan pemasangan:

- Replace 3 file di atas pada folder `public/js/`.
- Pastikan `netlify-adapter.js` dimuat setelah `scripts-1-inti-fase1.js` dan sebelum aplikasi melakukan boot/`Auth.boot()`.
- Jika Supabase realtime dipakai, pastikan sudah ada inisialisasi client seperti `window.supabase = supabase.createClient(...)` sebelum `RealtimeNotif.init()` dipanggil.
