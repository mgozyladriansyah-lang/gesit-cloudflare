(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function closeUserMenu() {
    var m = $('userMenu');
    if (m) m.classList.remove('is-open');
  }
  function closeSidebar() {
    var sb = $('sidebar');
    var ov = $('sidebarOverlay');
    if (sb) sb.classList.remove('is-open');
    if (ov) ov.classList.remove('is-visible');
  }
  function ensureConfirmVisible() {
    var bd = $('modalConfirm');
    if (!bd || !bd.classList.contains('is-open')) return;
    var modal = bd.querySelector('.modal');
    if (!modal) return;
    bd.style.display = 'flex';
    bd.style.alignItems = 'center';
    bd.style.justifyContent = 'center';
    modal.style.transform = 'none';
    modal.style.opacity = '1';
  }
  function clearStaleOverlay() {
    var openModal = document.querySelector('.modal-backdrop.is-open');
    var sidebarOpen = $('sidebar') && $('sidebar').classList.contains('is-open');
    var ov = $('sidebarOverlay');
    if (ov && ov.classList.contains('is-visible') && !sidebarOpen) {
      ov.classList.remove('is-visible');
    }
    if (!openModal && document.body.style.overflow === 'hidden') {
      document.body.style.overflow = '';
    }
  }
  function init() {
    var logout = $('menuLogout');
    if (logout && !logout.__gesitPwaGuard) {
      logout.__gesitPwaGuard = true;
      logout.addEventListener('click', function () {
        closeUserMenu();
        closeSidebar();
        setTimeout(ensureConfirmVisible, 0);
        setTimeout(ensureConfirmVisible, 120);
      }, true);
    }

    document.addEventListener('click', function () {
      setTimeout(function () {
        ensureConfirmVisible();
        clearStaleOverlay();
      }, 0);
    }, true);

    window.addEventListener('resize', function () {
      ensureConfirmVisible();
      clearStaleOverlay();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeUserMenu();
        closeSidebar();
        clearStaleOverlay();
      }
    });

    setInterval(clearStaleOverlay, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
