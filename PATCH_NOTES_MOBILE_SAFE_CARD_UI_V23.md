# GESIT V23 Mobile Safe Card UI

Versi: 2026.08.11.23

## Fokus patch

- Tidak membuat banner penjelasan.
- Tidak mengubah warna tema role.
- Super Admin/Admin: bottom nav `Profil` diganti menjadi `User`.
- Mobile menggunakan card/list, bukan table desktop yang dipaksakan.
- Detail table pada mobile dibuka melalui safe drawer agar klik detail tidak memicu freeze modal desktop.
- Guard membuka stale scroll/modal lock jika tidak ada modal aktif yang benar-benar terlihat.

## File

```text
public/js/mobile-navigation.js
public/js/mobile-card-ui.js
public/js/pwa-version.js
public/css/mobile-card-ui.css
public/pwa-changelog.json
```

## Tambahkan di index.html jika belum ada

```html
<link rel="stylesheet" href="/css/mobile-card-ui.css?v=2026.08.11.23">
<script src="/js/mobile-navigation.js?v=2026.08.11.23"></script>
<script src="/js/mobile-card-ui.js?v=2026.08.11.23"></script>
<script src="/js/pwa-version.js?v=2026.08.11.23"></script>
```
