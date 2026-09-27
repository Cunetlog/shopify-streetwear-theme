(() => {
    const storageKey = 'qt8-theme';
    const root = document.documentElement;
    const toggles = document.querySelectorAll('[data-theme-toggle]');

    if (!toggles.length) {
        return;
    }

    const getTheme = () => {
        return root.dataset.theme === 'dark' ? 'dark' : 'light';
    };

    const updateToggleState = () => {
        const isDark = getTheme() === 'dark';

        toggles.forEach((toggle) => {
            toggle.setAttribute('aria-pressed', String(isDark));
            toggle.setAttribute(
                'aria-label',
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
            );
        });
    };

    const setTheme = (theme) => {
        root.dataset.theme = theme;

        try {
            localStorage.setItem(storageKey, theme);
        } catch (error) {
            // Theme still works even if localStorage is unavailable.
        }

        updateToggleState();
    };

    const toggleTheme = () => {
        const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    toggles.forEach((toggle) => {
        toggle.addEventListener('click', toggleTheme);
    });

    updateToggleState();
})();