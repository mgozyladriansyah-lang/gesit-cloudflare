$ErrorActionPreference = "Stop"

$root = Get-Location
$cssDir = Join-Path $root "public\css"
$jsDir = Join-Path $root "public\js"
$index = Join-Path $root "public\index.html"

if (!(Test-Path $index)) { throw "public\index.html tidak ditemukan. Jalankan script dari root project." }
if (!(Test-Path $cssDir)) { New-Item -ItemType Directory -Path $cssDir | Out-Null }
if (!(Test-Path $jsDir)) { New-Item -ItemType Directory -Path $jsDir | Out-Null }

Copy-Item -Force ".\public\css\login-stability-hotfix.css" (Join-Path $cssDir "login-stability-hotfix.css")
Copy-Item -Force ".\public\js\login-stability-hotfix.js" (Join-Path $jsDir "login-stability-hotfix.js")

$html = Get-Content -LiteralPath $index -Raw -Encoding UTF8

if ($html -notmatch 'login-stability-hotfix\.css') {
  $html = $html -replace '(<link rel="stylesheet" href="/css/pwa\.css"\s*>)', '$1' + "`r`n  <link rel=`"stylesheet`" href=`"/css/login-stability-hotfix.css?v=1`">"
}

if ($html -notmatch 'login-stability-hotfix\.js') {
  $html = $html -replace '(<script src="/js/pwa-install\.js"></script>)', '$1' + "`r`n  <script src=`"/js/login-stability-hotfix.js?v=1`"></script>"
}

Set-Content -LiteralPath $index -Value $html -Encoding UTF8
Write-Host "[OK] Login stability hotfix diterapkan ke public/index.html"
