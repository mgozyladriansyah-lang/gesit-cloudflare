# GESIT V24 Final Clean Mobile Baseline

Versi: 2026.08.11.24

## Tujuan

Patch ini adalah baseline bersih setelah V22/V23 campur dengan beberapa file lama.

Yang dilakukan:

- Menghapus pemuatan banner fokus/prioritas.
- Menghapus pemuatan role color/theme override.
- Menjaga desain natural, konsisten, dan tidak berlebihan.
- Super Admin/Admin: bottom nav `Profil` diganti menjadi `User`.
- Desktop tetap table, mobile menjadi card/list.
- Detail table mobile memakai safe drawer untuk mengurangi risiko freeze.
- Menyediakan script apply otomatis untuk membersihkan `public/index.html`.

## File patch

```text
apply-v24-final-mobile-cleanup.ps1
public/js/mobile-navigation.js
public/js/mobile-card-ui.js
public/js/pwa-version.js
public/css/mobile-card-ui.css
public/pwa-changelog.json
```

## Cara pakai singkat

```powershell
powershell -ExecutionPolicy Bypass -File .pply-v24-final-mobile-cleanup.ps1
node --check public/js/mobile-navigation.js
node --check public/js/mobile-card-ui.js
node --check public/js/pwa-version.js
Select-String -Path public/index.html -Pattern "mobile-card-ui|mobile-navigation|role-theme-priority|mobile-priority-role-theme|role-mobile-ux|mobile-freeze-guard"

git add public/index.html public/css/mobile-card-ui.css public/js/mobile-navigation.js public/js/mobile-card-ui.js public/js/pwa-version.js public/pwa-changelog.json apply-v24-final-mobile-cleanup.ps1 AUDIT_MOBILE_FINAL_CLEANUP_V24.md PATCH_NOTES_MOBILE_FINAL_CLEANUP_V24.md

git commit -m "v24 final clean mobile baseline"
git push origin main
```

Setelah deploy, buka:

```text
https://gesit-cloudflare.pages.dev/?v=2026.08.11.24
```
