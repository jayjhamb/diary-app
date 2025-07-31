/**
 * Utility functions for the Diary App
 * Contains helper functions used across the application
 */

const Utils = {
    /**
     * Format date to a readable string
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDate(date = new Date()) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Get current date in ISO format
     * @returns {string} ISO date string
     */
    getCurrentDateISO() {
        return new Date().toISOString().split('T')[0];
    },

    /**
     * Count words in a text string
     * @param {string} text - The text to count words in
     * @returns {number} Number of words
     */
    countWords(text) {
        if (!text || text.trim() === '') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Count characters in a text string
     * @param {string} text - The text to count characters in
     * @returns {number} Number of characters
     */
    countCharacters(text) {
        return text ? text.length : 0;
    },

    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - The function to debounce
     * @param {number} wait - The delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Add event listener with error handling
     * @param {Element} element - The element to add listener to
     * @param {string} event - The event type
     * @param {Function} handler - The event handler
     * @param {Object} options - Event listener options
     */
    addEventListenerSafe(element, event, handler, options = {}) {
        if (!element || typeof handler !== 'function') {
            console.warn('Invalid element or handler provided to addEventListenerSafe');
            return;
        }
        
        try {
            element.addEventListener(event, handler, options);
        } catch (error) {
            console.error('Error adding event listener:', error);
        }
    },

    /**
     * Get element by ID with error handling
     * @param {string} id - The element ID
     * @returns {Element|null} The element or null if not found
     */
    getElementById(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found`);
        }
        return element;
    },

    /**
     * Get elements by class name with error handling
     * @param {string} className - The class name
     * @returns {NodeList} List of elements
     */
    getElementsByClassName(className) {
        const elements = document.getElementsByClassName(className);
        if (elements.length === 0) {
            console.warn(`No elements found with class '${className}'`);
        }
        return elements;
    },

    /**
     * Get elements by query selector with error handling
     * @param {string} selector - The CSS selector
     * @returns {NodeList} List of elements
     */
    querySelectorAll(selector) {
        try {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) {
                console.info(`No elements found with selector '${selector}'`);
            }
            return elements;
        } catch (error) {
            console.error('Error with querySelector:', error);
            return document.querySelectorAll(''); // Return empty NodeList
        }
    },

    /**
     * Check if device is touch-enabled
     * @returns {boolean} True if touch is supported
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * Check if user prefers reduced motion
     * @returns {boolean} True if reduced motion is preferred
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Get viewport width
     * @returns {number} Viewport width in pixels
     */
    getViewportWidth() {
        return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    },

    /**
     * Get viewport height
     * @returns {number} Viewport height in pixels
     */
    getViewportHeight() {
        return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    },

    /**
     * Check if element is in viewport
     * @param {Element} element - The element to check
     * @returns {boolean} True if element is visible in viewport
     */
    isElementInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Sanitize text input to prevent XSS
     * @param {string} text - The text to sanitize
     * @returns {string} Sanitized text
     */
    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Generate a unique ID
     * @param {string} prefix - Optional prefix for the ID
     * @returns {string} Unique ID
     */
    generateUniqueId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Show notification message (basic implementation)
     * @param {string} message - The message to show
     * @param {string} type - The type of notification (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // This is a basic implementation. In a real app, you might use a toast library
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => notification.style.opacity = '1', 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },

    /**
     * Log function with timestamp and level
     * @param {string} message - The message to log
     * @param {string} level - Log level (log, info, warn, error)
     */
    log(message, level = 'log') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        if (console[level]) {
            console[level](logMessage);
        } else {
            console.log(logMessage);
        }
    }
};

// Make Utils available globally
window.Utils = Utils;