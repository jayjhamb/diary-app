/**
 * Theme Manager for the Diary App
 * Handles theme switching and persistence
 */

class ThemeManager {
    constructor() {
        this.themes = {
            dark: 'theme-dark',
            light: 'theme-light',
            brown: 'theme-dark-brown'
        };
        
        this.defaultTheme = 'brown';
        this.storageKey = 'diary-theme';
        this.body = document.body;
        this.themeButtons = {};
        
        this.init();
    }

    /**
     * Initialize the theme manager
     */
    init() {
        this.cacheThemeButtons();
        this.loadSavedTheme();
        this.bindEvents();
        Utils.log('Theme Manager initialized', 'info');
    }

    /**
     * Cache theme button elements for better performance
     */
    cacheThemeButtons() {
        this.themeButtons = {
            dark: Utils.getElementById('theme-dark'),
            light: Utils.getElementById('theme-light'),
            brown: Utils.getElementById('theme-brown')
        };

        // Validate that all buttons exist
        Object.keys(this.themeButtons).forEach(key => {
            if (!this.themeButtons[key]) {
                Utils.log(`Theme button '${key}' not found`, 'warn');
            }
        });
    }

    /**
     * Bind event listeners to theme buttons
     */
    bindEvents() {
        Object.keys(this.themeButtons).forEach(themeKey => {
            const button = this.themeButtons[themeKey];
            if (button) {
                Utils.addEventListenerSafe(button, 'click', () => {
                    this.setTheme(themeKey);
                });

                // Add keyboard support
                Utils.addEventListenerSafe(button, 'keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.setTheme(themeKey);
                    }
                });
            }
        });

        // Listen for system theme changes
        if (window.matchMedia) {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            Utils.addEventListenerSafe(darkModeMediaQuery, 'change', (e) => {
                if (!this.getSavedTheme()) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /**
     * Set the current theme
     * @param {string} themeName - The theme to set ('dark', 'light', 'brown')
     */
    setTheme(themeName) {
        if (!this.themes[themeName]) {
            Utils.log(`Invalid theme name: ${themeName}`, 'warn');
            return;
        }

        try {
            // Remove all theme classes
            Object.values(this.themes).forEach(themeClass => {
                this.body.classList.remove(themeClass);
            });

            // Add the selected theme class
            this.body.classList.add(this.themes[themeName]);

            // Update active button state
            this.updateActiveButton(themeName);

            // Save theme preference
            this.saveTheme(themeName);

            // Dispatch custom event for theme change
            this.dispatchThemeChangeEvent(themeName);

            Utils.log(`Theme changed to: ${themeName}`, 'info');

        } catch (error) {
            Utils.log(`Error setting theme: ${error.message}`, 'error');
        }
    }

    /**
     * Update the active state of theme buttons
     * @param {string} activeTheme - The currently active theme
     */
    updateActiveButton(activeTheme) {
        Object.keys(this.themeButtons).forEach(themeKey => {
            const button = this.themeButtons[themeKey];
            if (button) {
                if (themeKey === activeTheme) {
                    button.classList.add('active');
                    button.setAttribute('aria-pressed', 'true');
                } else {
                    button.classList.remove('active');
                    button.setAttribute('aria-pressed', 'false');
                }
            }
        });
    }

    /**
     * Save theme preference to storage
     * @param {string} themeName - The theme to save
     */
    saveTheme(themeName) {
        try {
            // Note: In Claude.ai artifacts, we use a memory store instead of localStorage
            window.diaryAppTheme = themeName;
            Utils.log(`Theme '${themeName}' saved to memory`, 'info');
        } catch (error) {
            Utils.log(`Error saving theme: ${error.message}`, 'error');
        }
    }

    /**
     * Load saved theme from storage
     * @returns {string|null} The saved theme or null if none exists
     */
    getSavedTheme() {
        try {
            // Note: In Claude.ai artifacts, we use a memory store instead of localStorage
            return window.diaryAppTheme || null;
        } catch (error) {
            Utils.log(`Error loading saved theme: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Load and apply the saved theme or default theme
     */
    loadSavedTheme() {
        const savedTheme = this.getSavedTheme();
        const themeToApply = savedTheme || this.detectSystemTheme() || this.defaultTheme;
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.setTheme(themeToApply);
        }, 10);
    }

    /**
     * Detect system theme preference
     * @returns {string|null} The detected theme or null
     */
    detectSystemTheme() {
        if (!window.matchMedia) return null;

        try {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
        } catch (error) {
            Utils.log(`Error detecting system theme: ${error.message}`, 'error');
        }

        return null;
    }

    /**
     * Get the current active theme
     * @returns {string} The current theme name
     */
    getCurrentTheme() {
        for (const [themeName, themeClass] of Object.entries(this.themes)) {
            if (this.body.classList.contains(themeClass)) {
                return themeName;
            }
        }
        return this.defaultTheme;
    }

    /**
     * Dispatch a custom event when theme changes
     * @param {string} themeName - The new theme name
     */
    dispatchThemeChangeEvent(themeName) {
        try {
            const event = new CustomEvent('themeChanged', {
                detail: {
                    theme: themeName,
                    themeClass: this.themes[themeName]
                }
            });
            document.dispatchEvent(event);
        } catch (error) {
            Utils.log(`Error dispatching theme change event: ${error.message}`, 'error');
        }
    }

    /**
     * Toggle between dark and light themes
     */
    toggleDarkLight() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Cycle through all available themes
     */
    cycleThemes() {
        const themeKeys = Object.keys(this.themes);
        const currentTheme = this.getCurrentTheme();
        const currentIndex = themeKeys.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        const nextTheme = themeKeys[nextIndex];
        
        this.setTheme(nextTheme);
    }

    /**
     * Reset to default theme
     */
    resetToDefault() {
        this.setTheme(this.defaultTheme);
    }

    /**
     * Get theme information
     * @returns {Object} Object containing theme information
     */
    getThemeInfo() {
        return {
            current: this.getCurrentTheme(),
            available: Object.keys(this.themes),
            default: this.defaultTheme,
            saved: this.getSavedTheme()
        };
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM still loading, wait for DOMContentLoaded
} else {
    // DOM already loaded
    window.themeManager = new ThemeManager();
}