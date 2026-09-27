document.addEventListener('DOMContentLoaded', () => {
  const roots = document.querySelectorAll('[data-localization-root]');

  roots.forEach((root) => {
    const form = root.querySelector('form');

    const triggers = root.querySelectorAll('[data-localization-trigger]');
    const panels = root.querySelectorAll('[data-localization-panel]');

    const closeAll = () => {
      panels.forEach((panel) => {
        panel.hidden = true;
      });

      triggers.forEach((trigger) => {
        trigger.setAttribute('aria-expanded', 'false');
      });
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const type = trigger.dataset.localizationTrigger;
        const panel = root.querySelector(
          `[data-localization-panel="${type}"]`
        );

        const isOpen = !panel.hidden;

        closeAll();

        if (!isOpen) {
          panel.hidden = false;
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });

    root
      .querySelectorAll('[data-localization-country]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const input = root.querySelector(
            '[data-localization-country-input]'
          );

          input.value = button.dataset.localizationCountry;

          form.submit();
        });
      });

    root
      .querySelectorAll('[data-localization-language]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const input = root.querySelector(
            '[data-localization-language-input]'
          );

          input.value = button.dataset.localizationLanguage;

          form.submit();
        });
      });

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) {
        closeAll();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeAll();
      }
    });
  });
});