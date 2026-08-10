$ErrorActionPreference = "Stop"

# Patch sudah berisi file pada lokasi final. Script ini hanya membersihkan file eksperimen lama.
Remove-Item ".\public\css\login-final-fix.css" -Force -ErrorAction SilentlyContinue
Remove-Item ".\public\css\login-stability-hotfix.css" -Force -ErrorAction SilentlyContinue
Remove-Item ".\public\js\login-final-fix.js" -Force -ErrorAction SilentlyContinue
Remove-Item ".\public\js\login-stability-hotfix.js" -Force -ErrorAction SilentlyContinue
Remove-Item ".\apply-login-hotfix.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item ".\apply-final-login-cleanup.ps1" -Force -ErrorAction SilentlyContinue

Write-Host "[OK] File eksperimen lama dibersihkan. Lanjutkan verifikasi, git add -A, commit, push."
