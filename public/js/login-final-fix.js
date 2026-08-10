(function () {
  'use strict';

  function byId(id) { return document.getElementById(id); }

  function hardenInput(el, attrs) {
    if (!el) return;
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
  }

  function normalizeLoginDom() {
    var loginError = byId('loginError');
    if (loginError) {
      var existing = document.querySelectorAll('#loginPage .login-autofill-trap');
      for (var i = 0; i < existing.length; i++) existing[i].remove();

      var trapUser = document.createElement('input');
      trapUser.className = 'login-autofill-trap';
      trapUser.type = 'text';
      trapUser.name = 'username';
      trapUser.autocomplete = 'username';
      trapUser.tabIndex = -1;
      trapUser.setAttribute('aria-hidden', 'true');

      var trapPass = document.createElement('input');
      trapPass.className = 'login-autofill-trap';
      trapPass.type = 'password';
      trapPass.name = 'password';
      trapPass.autocomplete = 'current-password';
      trapPass.tabIndex = -1;
      trapPass.setAttribute('aria-hidden', 'true');

      loginError.insertAdjacentElement('afterend', trapPass);
      loginError.insertAdjacentElement('afterend', trapUser);
    }

    hardenInput(byId('loginUsername'), {
      name: 'gesit_login_username',
      autocomplete: 'one-time-code',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      'data-lpignore': 'true',
      'data-1p-ignore': 'true'
    });

    hardenInput(byId('loginPassword'), {
      name: 'gesit_login_password',
      autocomplete: 'new-password',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      'data-lpignore': 'true',
      'data-1p-ignore': 'true'
    });
  }

  function stabilizeLoginLayout() {
    var page = byId('loginPage');
    var card = byId('loginCard');
    if (!page || !card || page.classList.contains('is-hidden')) return;

    page.style.display = 'flex';
    page.style.justifyContent = 'center';
    page.style.alignItems = window.innerHeight <= 720 ? 'flex-start' : 'center';
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

  function init() {
    normalizeLoginDom();
    stabilizeLoginLayout();
    ['focusin', 'resize', 'orientationchange'].forEach(function (eventName) {
      window.addEventListener(eventName, function () {
        stabilizeLoginLayout();
        setTimeout(stabilizeLoginLayout, 80);
        setTimeout(stabilizeLoginLayout, 250);
      }, true);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
