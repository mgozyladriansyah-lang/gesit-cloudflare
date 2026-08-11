$ErrorActionPreference = "Stop"
$ver = "2026.08.11.25"
$index = "public\index.html"
if (!(Test-Path $index)) { if (Test-Path "public\Index.html") { Copy-Item "public\Index.html" $index -Force } else { throw "public\index.html tidak ditemukan." } }
Copy-Item $index "public\index.before-v25-final.html" -Force
$html = Get-Content $index -Raw -Encoding UTF8
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
  '(?im)^.*mobile-user-ui\.js.*?
?',
  '(?im)^.*pwa-update-quiet\.js.*?
?',
  '(?im)^.*mobile-navigation\.js.*?
?',
  '(?im)^.*pwa-version\.js.*?
?'
)
foreach ($p in $patterns) { $html = [regex]::Replace($html, $p, '') }
$html = [regex]::Replace($html, '(?is)<script[^>]*>[\s\S]*(FOKUS BERANDA|FOKUS FOKUS|mobile-priority|role-theme)[\s\S]*?</script>\s*', '')
$html = [regex]::Replace($html, '(?is)<style[^>]*>[\s\S]*(mobile-priority|role-theme)[\s\S]*?</style>\s*', '')
$css = '  <link rel="stylesheet" href="/css/mobile-card-ui.css?v=' + $ver + '">'
if ($html -notmatch 'mobile-card-ui\.css') { $html = $html -replace '</head>', ($css + "`r`n</head>") }
$scripts = @(
  '  <script src="/js/pwa-version.js?v=' + $ver + '"></script>',
  '  <script src="/js/mobile-navigation.js?v=' + $ver + '"></script>',
  '  <script src="/js/mobile-card-ui.js?v=' + $ver + '"></script>',
  '  <script src="/js/mobile-user-ui.js?v=' + $ver + '"></script>',
  '  <script src="/js/pwa-update-quiet.js?v=' + $ver + '"></script>'
) -join "`r`n"
if ($html -match '</body>') { $html = $html -replace '</body>', ($scripts + "`r`n</body>") } else { $html = $html + "`r`n" + $scripts }
Set-Content $index $html -Encoding UTF8
Write-Host "[OK] V25 final index cleanup selesai. Backup: public\index.before-v25-final.html"
