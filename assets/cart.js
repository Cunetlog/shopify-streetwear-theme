'use strict';

const CART_SECTION_ID = 'cart-drawer';

let cartRequestInProgress = false;

document.addEventListener('submit', handleProductFormSubmit);
document.addEventListener('click', handleCartClick);
document.addEventListener('close', handleCartDialogClose, true);

function getShopifyRoot() {
  return window.Shopify?.routes?.root || '/';
}

async function handleProductFormSubmit(event) {
  const form = event.target.closest('[data-product-form]');

  if (!form) {
    return;
  }

  event.preventDefault();

  if (cartRequestInProgress) {
    return;
  }

  const addToCartButton = form.querySelector('[data-add-to-cart]');
  const addToCartText = form.querySelector('[data-add-to-cart-text]');

  if (!addToCartButton || addToCartButton.disabled) {
    return;
  }

  const originalButtonText = addToCartText?.textContent || 'ADD TO CART';

  setCartBusy(true);

  addToCartButton.disabled = true;

  if (addToCartText) {
    addToCartText.textContent = 'ADDING...';
  }

  try {
    const formData = new FormData(form);

    const response = await fetch(`${getShopifyRoot()}cart/add.js`, {
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.description ||
        data.message ||
        'Unable to add product to cart.'
      );
    }

    await refreshCartDrawer({
      open: true
    });

    await refreshCartCount();
  } catch (error) {
    console.error('Add to cart failed:', error);

    if (addToCartText) {
      addToCartText.textContent = 'TRY AGAIN';
    }

    window.setTimeout(() => {
      if (addToCartText) {
        addToCartText.textContent = originalButtonText;
      }

      addToCartButton.disabled = false;
    }, 1500);

    setCartBusy(false);

    return;
  }

  if (addToCartText) {
    addToCartText.textContent = originalButtonText;
  }

  addToCartButton.disabled = false;

  setCartBusy(false);
}

function handleCartClick(event) {
  const openButton = event.target.closest('[data-cart-open]');

  if (openButton) {
    event.preventDefault();
    openCartDrawer();
    return;
  }

  const closeButton = event.target.closest('[data-cart-close]');

  if (closeButton) {
    event.preventDefault();
    closeCartDrawer();
    return;
  }

  const increaseButton = event.target.closest('[data-cart-increase]');

  if (increaseButton) {
    event.preventDefault();

    changeCartItemQuantity(increaseButton, 1);
    return;
  }

  const decreaseButton = event.target.closest('[data-cart-decrease]');

  if (decreaseButton) {
    event.preventDefault();

    changeCartItemQuantity(decreaseButton, -1);
    return;
  }

  const removeButton = event.target.closest('[data-cart-remove]');

  if (removeButton) {
    event.preventDefault();

    removeCartItem(removeButton);
    return;
  }

  const drawer = event.target.closest('[data-cart-drawer]');

  if (
    drawer &&
    event.target === drawer &&
    drawer.open
  ) {
    closeCartDrawer();
  }
}

async function changeCartItemQuantity(button, amount) {
  if (cartRequestInProgress) {
    return;
  }

  const cartItem = button.closest('[data-cart-item]');
  const quantityElement = cartItem?.querySelector('[data-cart-quantity]');

  if (!cartItem || !quantityElement) {
    return;
  }

  const line = Number(cartItem.dataset.line);
  const currentQuantity = Number(quantityElement.textContent.trim());

  if (!line || Number.isNaN(currentQuantity)) {
    return;
  }

  const newQuantity = Math.max(0, currentQuantity + amount);

  await updateCartLine(line, newQuantity);
}

async function removeCartItem(button) {
  if (cartRequestInProgress) {
    return;
  }

  const cartItem = button.closest('[data-cart-item]');

  if (!cartItem) {
    return;
  }

  const line = Number(cartItem.dataset.line);

  if (!line) {
    return;
  }

  await updateCartLine(line, 0);
}

async function updateCartLine(line, quantity) {
  setCartBusy(true);

  try {
    const response = await fetch(`${getShopifyRoot()}cart/change.js`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        line,
        quantity
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.description ||
        data.message ||
        'Unable to update cart.'
      );
    }

    await refreshCartDrawer({
      open: true
    });

    updateCartCount(data.item_count);
  } catch (error) {
    console.error('Cart update failed:', error);
  }

  setCartBusy(false);
}

async function refreshCartDrawer({ open = false } = {}) {
  const response = await fetch(
    `${getShopifyRoot()}?sections=${CART_SECTION_ID}`,
    {
      headers: {
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Unable to refresh cart drawer.');
  }

  const sections = await response.json();
  const html = sections[CART_SECTION_ID];

  if (!html) {
    throw new Error('Cart drawer section was not returned.');
  }

  const parser = new DOMParser();
  const documentFragment = parser.parseFromString(
    html,
    'text/html'
  );

  const currentSection = document.querySelector(
    '#shopify-section-cart-drawer'
  );

  const newSection = documentFragment.querySelector(
    '#shopify-section-cart-drawer'
  );

  if (!currentSection || !newSection) {
    throw new Error('Cart drawer section could not be replaced.');
  }

  currentSection.replaceWith(newSection);

  if (open) {
    openCartDrawer();
  }
}

function openCartDrawer() {
  const drawer = document.querySelector('[data-cart-drawer]');

  if (!drawer || drawer.open) {
    return;
  }

  drawer.showModal();

  document.body.classList.add('cart-drawer-open');
}

function closeCartDrawer() {
  const drawer = document.querySelector('[data-cart-drawer]');

  if (!drawer || !drawer.open) {
    return;
  }

  drawer.close();

  document.body.classList.remove('cart-drawer-open');
}

function handleCartDialogClose(event) {
  if (!event.target.matches('[data-cart-drawer]')) {
    return;
  }

  document.body.classList.remove('cart-drawer-open');
}

async function refreshCartCount() {
  try {
    const response = await fetch(`${getShopifyRoot()}cart.js`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      return;
    }

    const cart = await response.json();

    updateCartCount(cart.item_count);
  } catch (error) {
    console.error('Unable to refresh cart count:', error);
  }
}

function updateCartCount(itemCount) {
  if (typeof itemCount !== 'number') {
    return;
  }

  const countElements = document.querySelectorAll('[data-cart-count]');

  countElements.forEach((element) => {
    element.textContent = itemCount;
  });
}

function setCartBusy(isBusy) {
  cartRequestInProgress = isBusy;

  const drawer = document.querySelector('[data-cart-drawer]');

  if (!drawer) {
    return;
  }

  if (isBusy) {
    drawer.setAttribute('aria-busy', 'true');
  } else {
    drawer.removeAttribute('aria-busy');
  }
}