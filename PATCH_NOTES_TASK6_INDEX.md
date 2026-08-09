# Patch Task 6 - public/index.html

File yang diperbaiki:

- `public/index.html`

Masalah utama yang diperbaiki:

- Tiga tag script terakhir tidak tertutup dengan benar karena tanda kutip `src` hilang sebelum `</script>`.
- Akibatnya browser dapat gagal memuat file berikut:
  - `/js/scripts-6-tour.js`
  - `/js/realtime-notifications.js`
  - `/js/pwa-install.js`

Baris yang sudah benar:

```html
<script src="/js/scripts-6-tour.js"></script>
<script src="/js/realtime-notifications.js"></script>
<script src="/js/pwa-install.js"></script>
```

Setelah replace file, refresh browser dengan hard reload:

- Windows: `Ctrl + F5`
- atau buka DevTools lalu klik kanan tombol refresh dan pilih `Empty Cache and Hard Reload`
