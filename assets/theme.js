'use strict';

document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  const productSections = document.querySelectorAll('[data-product-section]');

  productSections.forEach((section) => {
    initProductSection(section);
  });
});

function initProductSection(section) {
  const productJsonElement = section.querySelector('[data-product-json]');
  const optionInputs = section.querySelectorAll('[data-option-value]');
  const variantIdInput = section.querySelector('[data-variant-id]');
  const currentPriceElement = section.querySelector('[data-product-current-price]');
  const comparePriceElement = section.querySelector('[data-product-compare-price]');
  const availabilityElement = section.querySelector('[data-product-availability]');
  const addToCartButton = section.querySelector('[data-add-to-cart]');
  const addToCartText = section.querySelector('[data-add-to-cart-text]');

  if (!productJsonElement || !variantIdInput || !addToCartButton) {
    return;
  }

  let product;

  try {
    product = JSON.parse(productJsonElement.textContent);
  } catch (error) {
    console.error('Unable to parse product JSON.', error);
    return;
  }

  if (!Array.isArray(product.variants)) {
    return;
  }

  optionInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const selectedOptions = getSelectedOptions(section);
      const variant = findMatchingVariant(product.variants, selectedOptions);

      if (!variant) {
        updateUnavailableState({
          variantIdInput,
          availabilityElement,
          addToCartButton,
          addToCartText
        });

        return;
      }

      updateVariantState({
        variant,
        variantIdInput,
        currentPriceElement,
        comparePriceElement,
        availabilityElement,
        addToCartButton,
        addToCartText
      });

      updateProductUrl(section, variant.id);
    });
  });
}

function getSelectedOptions(section) {
  const optionGroups = section.querySelectorAll('[data-product-option]');

  return Array.from(optionGroups).map((group) => {
    const checkedInput = group.querySelector('[data-option-value]:checked');

    return checkedInput ? checkedInput.value : null;
  });
}

function findMatchingVariant(variants, selectedOptions) {
  return variants.find((variant) => {
    return selectedOptions.every((selectedValue, index) => {
      return variant.options[index] === selectedValue;
    });
  });
}

function updateVariantState({
  variant,
  variantIdInput,
  currentPriceElement,
  comparePriceElement,
  availabilityElement,
  addToCartButton,
  addToCartText
}) {
  variantIdInput.value = variant.id;

  if (currentPriceElement) {
    currentPriceElement.textContent = formatMoney(variant.price);
  }

  if (comparePriceElement) {
    const hasComparePrice =
      variant.compare_at_price &&
      variant.compare_at_price > variant.price;

    comparePriceElement.hidden = !hasComparePrice;
    comparePriceElement.textContent = hasComparePrice
      ? formatMoney(variant.compare_at_price)
      : '';
  }

  if (availabilityElement) {
    availabilityElement.textContent = variant.available
      ? 'IN STOCK'
      : 'SOLD OUT';
  }

  addToCartButton.disabled = !variant.available;

  if (addToCartText) {
    addToCartText.textContent = variant.available
      ? 'ADD TO CART'
      : 'SOLD OUT';
  }
}

function updateUnavailableState({
  variantIdInput,
  availabilityElement,
  addToCartButton,
  addToCartText
}) {
  variantIdInput.value = '';

  if (availabilityElement) {
    availabilityElement.textContent = 'UNAVAILABLE';
  }

  addToCartButton.disabled = true;

  if (addToCartText) {
    addToCartText.textContent = 'UNAVAILABLE';
  }
}

function updateProductUrl(section, variantId) {
  const productUrl = section.dataset.productUrl;

  if (!productUrl || !variantId) {
    return;
  }

  const url = new URL(productUrl, window.location.origin);

  url.searchParams.set('variant', variantId);

  window.history.replaceState({}, '', url);
}

function formatMoney(cents) {
  if (typeof cents !== 'number') {
    return '';
  }

  const currency =
    document.documentElement.dataset.currency ||
    window.Shopify?.currency?.active ||
    'EUR';

  return new Intl.NumberFormat(document.documentElement.lang || 'en', {
    style: 'currency',
    currency
  }).format(cents / 100);
}