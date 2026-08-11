# GESIT V25 Final Mobile Baseline

Versi: 2026.08.11.25

## Isi
- `public/js/mobile-navigation.js`
- `public/js/mobile-card-ui.js`
- `public/js/mobile-user-ui.js`
- `public/js/pwa-update-quiet.js`
- `public/js/pwa-version.js`
- `public/css/mobile-card-ui.css`
- `public/pwa-changelog.json`
- `apply-v25-final-mobile-cleanup.ps1`

## Cara pakai
```powershell
powershell -ExecutionPolicy Bypass -File .pply-v25-final-mobile-cleanup.ps1
node --check public/js/mobile-navigation.js
node --check public/js/mobile-card-ui.js
node --check public/js/mobile-user-ui.js
node --check public/js/pwa-update-quiet.js
node --check public/js/pwa-version.js
Select-String -Path public/index.html -Pattern "mobile-card-ui|mobile-user-ui|pwa-update-quiet|mobile-priority-role-theme|role-theme-priority|FOKUS BERANDA|FOKUS FOKUS"
```

Yang boleh muncul: `mobile-card-ui`, `mobile-user-ui`, `pwa-update-quiet`. Yang tidak boleh muncul: `mobile-priority-role-theme`, `role-theme-priority`, `FOKUS BERANDA`, `FOKUS FOKUS`.
