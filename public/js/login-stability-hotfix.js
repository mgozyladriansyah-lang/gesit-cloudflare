(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function hardenLoginInputs() {
    var username = byId('loginUsername');
    var password = byId('loginPassword');

    if (username) {
      username.setAttribute('autocomplete', 'off');
      username.setAttribute('autocorrect', 'off');
      username.setAttribute('autocapitalize', 'off');
      username.setAttribute('spellcheck', 'false');
      username.setAttribute('name', 'gesit_login_user_' + Date.now());
      username.setAttribute('data-lpignore', 'true');
      username.setAttribute('data-1p-ignore', 'true');
    }

    if (password) {
      password.setAttribute('autocomplete', 'new-password');
      password.setAttribute('autocorrect', 'off');
      password.setAttribute('autocapitalize', 'off');
      password.setAttribute('spellcheck', 'false');
      password.setAttribute('name', 'gesit_login_pass_' + Date.now());
      password.setAttribute('data-lpignore', 'true');
      password.setAttribute('data-1p-ignore', 'true');
    }
  }

  function stabilizeLoginLayout() {
    var page = byId('loginPage');
    var card = byId('loginCard');
    if (!page || !card || page.classList.contains('is-hidden')) return;

    page.style.display = 'flex';
    page.style.alignItems = window.innerHeight < 720 ? 'flex-start' : 'center';
    page.style.justifyContent = 'center';
    page.style.overflowY = 'auto';
    page.style.overflowX = 'hidden';

    card.style.width = '400px';
    card.style.maxWidth = 'calc(100vw - 32px)';
    card.style.height = 'auto';
    card.style.maxHeight = 'none';
    card.style.overflow = 'visible';
    card.style.backdropFilter = 'none';
    card.style.webkitBackdropFilter = 'none';
    card.style.transform = 'none';
    card.style.contain = 'none';
  }

  function bindFocusGuards() {
    var page = byId('loginPage');
    var username = byId('loginUsername');
    var password = byId('loginPassword');
    if (!page) return;

    [username, password].forEach(function (input) {
      if (!input || input.__gesitFocusGuard) return;
      input.__gesitFocusGuard = true;
      input.addEventListener('focus', function () {
        setTimeout(stabilizeLoginLayout, 0);
        setTimeout(stabilizeLoginLayout, 80);
        setTimeout(stabilizeLoginLayout, 250);
      });
    });
  }

  function init() {
    hardenLoginInputs();
    stabilizeLoginLayout();
    bindFocusGuards();
    window.addEventListener('resize', stabilizeLoginLayout);
    window.addEventListener('orientationchange', function () { setTimeout(stabilizeLoginLayout, 150); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
