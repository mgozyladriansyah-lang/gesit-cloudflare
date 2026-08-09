# Patch Task 9 - Index untuk Cloudflare Pages

## Isi patch

- `public/index.html`
- `public/Index.html`

Keduanya berisi perubahan yang sama. File lowercase `index.html` disertakan karena Cloudflare Pages/static hosting umumnya mencari `index.html` sebagai entry file.

## Perubahan

Script lama Netlify:

```html
<script src="/js/scripts-1-inti-fase1.js"></script>
<script src="/js/netlify-adapter.js"></script>
```

diganti menjadi adapter Cloudflare:

```html
<script src="/js/scripts-1-inti-fase1.js"></script>
<script>
  window.GESIT_API_ENDPOINT = '/api';
</script>
<script src="/js/api-adapter.js"></script>
```

## Alasan

- `scripts-1-inti-fase1.js` membuat object `API`.
- `api-adapter.js` mengganti `API.call` agar memanggil Cloudflare Pages Function `/api`.
- `scripts-4-fase4-app.js` menjalankan `App.init()` dan `Auth.boot()`, jadi adapter harus dimuat sebelum file tersebut.

## Jangan lakukan

Jangan muat `netlify-adapter.js` dan `api-adapter.js` bersamaan, karena keduanya sama-sama mengganti `API.call`.

## Urutan script yang benar

```html
<script src="/js/scripts-1-inti-fase1.js"></script>
<script>
  window.GESIT_API_ENDPOINT = '/api';
</script>
<script src="/js/api-adapter.js"></script>
<script src="/js/scripts-2-helper-fase2.js"></script>
<script src="/js/scripts-3-fase3.js"></script>
<script src="/js/scripts-4-fase4-app.js"></script>
<script src="/js/scripts-5-registrasi.js"></script>
<script src="/js/scripts-6-tour.js"></script>
<script src="/js/realtime-notifications.js"></script>
<script src="/js/pwa-install.js"></script>
```
