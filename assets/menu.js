'use strict';

(() => {
  const menu = document.querySelector('[data-mobile-menu]');
  const openButton = document.querySelector('[data-mobile-menu-open]');
  const closeButton = document.querySelector('[data-mobile-menu-close]');

  if (!menu || !openButton || !closeButton) {
    return;
  }

  let previouslyFocusedElement = null;

  const openMenu = () => {
    previouslyFocusedElement = document.activeElement;

    if (typeof menu.showModal === 'function') {
      menu.showModal();
    } else {
      menu.setAttribute('open', '');
    }

    document.body.classList.add('mobile-menu-open');

    closeButton.focus();
  };

  const closeMenu = () => {
    if (typeof menu.close === 'function') {
      menu.close();
    } else {
      menu.removeAttribute('open');
    }
  };

  openButton.addEventListener('click', openMenu);

  closeButton.addEventListener('click', closeMenu);

  menu.addEventListener('cancel', () => {
    document.body.classList.remove('mobile-menu-open');
  });

  menu.addEventListener('close', () => {
    document.body.classList.remove('mobile-menu-open');

    if (
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === 'function'
    ) {
      previouslyFocusedElement.focus();
    }
  });

  menu.addEventListener('click', (event) => {
    if (event.target === menu) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && menu.open) {
      closeMenu();
    }
  });
})();