const PUBLIC_PAGES = new Set([
  'checkin',
  'checkin-bbm',
  'checkin-tad',
  'checkin-magang',
  'lamaran-magang',
  'presensi-magang'
]);

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/\?+$/, '').replace(/\/+$/, '');
}

function htmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setupResponse(page) {
  const safePage = htmlEscape(page);
  return new Response(`<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Halaman publik belum dikonfigurasi</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}
    .card{max-width:560px;background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.28);border-radius:22px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.35)}
    h1{font-size:20px;margin:0 0 10px;color:#fff} p{line-height:1.6;color:#cbd5e1} code{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:2px 6px;color:#5eead4}.btn{display:inline-flex;margin-top:10px;padding:10px 14px;border-radius:12px;background:#0d9488;color:#fff;text-decoration:none;font-weight:700}
  </style>
</head>
<body>
  <main class="card">
    <h1>Halaman publik belum dikonfigurasi</h1>
    <p>Tautan publik <code>?page=${safePage}</code> sudah dikenali oleh Cloudflare, tetapi variabel environment <code>GAS_WEB_APP_URL</code> belum diisi atau belum terbaca.</p>
    <p>Isi <code>GAS_WEB_APP_URL</code> dengan URL Web App Apps Script aktif, format <code>https://script.google.com/macros/s/.../exec</code>, lalu redeploy Cloudflare Pages.</p>
    <a class="btn" href="/">Kembali ke GESIT</a>
  </main>
</body>
</html>`, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const page = url.searchParams.get('page');

  if (request.method === 'GET' && page && PUBLIC_PAGES.has(page)) {
    const gasBase = normalizeBaseUrl(context.env.GAS_WEB_APP_URL);
    if (!gasBase) return setupResponse(page);

    const target = new URL(gasBase);
    for (const [key, value] of url.searchParams.entries()) {
      target.searchParams.set(key, value);
    }

    return Response.redirect(target.toString(), 302);
  }

  return context.next();
}
