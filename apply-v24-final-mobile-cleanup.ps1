$ErrorActionPreference = "Stop"
$ver = "2026.08.11.24"
$index = "public\index.html"
if (!(Test-Path $index)) {
  if (Test-Path "public\Index.html") { Copy-Item "public\Index.html" $index -Force }
  else { throw "public\index.html tidak ditemukan." }
}

$backup = "public\index.before-v24-final.html"
Copy-Item $index $backup -Force

$html = Get-Content $index -Raw -Encoding UTF8

# Hapus include lama yang membuat banner fokus, warna role, atau guard ganda.
$patterns = @(
  '(?im)^.*role-theme-priority\.css.*?
?',
  '(?im)^.*mobile-priority-role-theme\.js.*?
?',
  '(?im)^.*role-mobile-ux\.js.*?
?',
  '(?im)^.*mobile-freeze-guard\.js.*?
?',
  '(?im)^.*mobile-card-ui\.css.*?
?',
  '(?im)^.*mobile-card-ui\.js.*?
?',
  '(?im)^.*mobile-navigation\.js.*?
?',
  '(?im)^.*pwa-version\.js.*?
?'
)
foreach ($p in $patterns) { $html = [regex]::Replace($html, $p, '') }

# Bersihkan class/hook banner lama bila ada residual inline script/style.
$html = [regex]::Replace($html, '(?is)<script[^>]*>[^<]*(FOKUS BERANDA|FOKUS FOKUS|mobile-priority|role-theme)[\s\S]*?</script>\s*', '')
$html = [regex]::Replace($html, '(?is)<style[^>]*>[\s\S]*(mobile-priority|role-theme)[\s\S]*?</style>\s*', '')

$cssLink = '  <link rel="stylesheet" href="/css/mobile-card-ui.css?v=' + $ver + '">' 
if ($html -notmatch 'mobile-card-ui\.css') {
  if ($html -match '</head>') { $html = $html -replace '</head>', ($cssLink + "`r`n</head>") }
  else { $html = $cssLink + "`r`n" + $html }
}

$scripts = @(
  '  <script src="/js/pwa-version.js?v=' + $ver + '"></script>',
  '  <script src="/js/mobile-navigation.js?v=' + $ver + '"></script>',
  '  <script src="/js/mobile-card-ui.js?v=' + $ver + '"></script>'
) -join "`r`n"

if ($html -notmatch 'mobile-navigation\.js') {
  if ($html -match '</body>') { $html = $html -replace '</body>', ($scripts + "`r`n</body>") }
  else { $html = $html + "`r`n" + $scripts }
}

Set-Content $index $html -Encoding UTF8

Write-Host "[OK] index.html dibersihkan dan V24 final mobile baseline dipasang. Backup: $backup"
Write-Host "[OK] Jalankan verifikasi lalu commit/push."
