/**
 * Journal Entry Manager for the Diary App
 * Handles journal entry functionality, word counting, mood tracking, and entry management
 */

class JournalEntry {
    constructor() {
        this.textarea = null;
        this.wordCountElement = null;
        this.charCountElement = null;
        this.dateElement = null;
        this.submitButton = null;
        this.moodButtons = [];
        this.currentMood = null;
        this.currentEntry = {
            text: '',
            mood: null,
            date: null,
            wordCount: 0,
            charCount: 0
        };
        
        // Debounced functions for performance
        this.debouncedUpdateCounts = Utils.debounce(this.updateCounts.bind(this), 100);
        this.debouncedAutoSave = Utils.debounce(this.autoSave.bind(this), 2000);
        
        this.init();
    }

    /**
     * Initialize the journal entry manager
     */
    init() {
        this.cacheElements();
        this.setCurrentDate();
        this.bindEvents();
        this.loadDraftEntry();
        Utils.log('Journal Entry Manager initialized', 'info');
    }

    /**
     * Cache DOM elements for better performance
     */
    cacheElements() {
        this.textarea = Utils.getElementById('journal-textarea');
        this.wordCountElement = Utils.getElementById('word-count');
        this.charCountElement = Utils.getElementById('char-count');
        this.dateElement = Utils.getElementById('current-date');
        this.submitButton = document.querySelector('.submit-button');
        this.moodButtons = Array.from(Utils.querySelectorAll('.mood-btn'));

        // Validate required elements
        if (!this.textarea) {
            Utils.log('Journal textarea not found', 'error');
        }
        if (!this.wordCountElement) {
            Utils.log('Word count element not found', 'warn');
        }
        if (!this.charCountElement) {
            Utils.log('Character count element not found', 'warn');
        }
    }

    /**
     * Set the current date in the date element
     */
    setCurrentDate() {
        if (this.dateElement) {
            const currentDate = new Date();
            this.dateElement.textContent = Utils.formatDate(currentDate);
            this.dateElement.setAttribute('datetime', Utils.getCurrentDateISO());
            this.currentEntry.date = Utils.getCurrentDateISO();
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Textarea events
        if (this.textarea) {
            Utils.addEventListenerSafe(this.textarea, 'input', (e) => {
                this.handleTextInput(e);
            });

            Utils.addEventListenerSafe(this.textarea, 'keydown', (e) => {
                this.handleKeydown(e);
            });

            Utils.addEventListenerSafe(this.textarea, 'paste', (e) => {
                // Small delay to allow paste content to be processed
                setTimeout(() => this.handleTextInput(e), 10);
            });

            // Focus and blur events for better UX
            Utils.addEventListenerSafe(this.textarea, 'focus', () => {
                this.textarea.parentElement?.classList.add('focused');
            });

            Utils.addEventListenerSafe(this.textarea, 'blur', () => {
                this.textarea.parentElement?.classList.remove('focused');
                this.autoSave();
            });
        }

        // Mood button events
        this.moodButtons.forEach((button, index) => {
            Utils.addEventListenerSafe(button, 'click', () => {
                this.selectMood(button, index);
            });

            Utils.addEventListenerSafe(button, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectMood(button, index);
                }
            });
        });

        // Submit button event
        if (this.submitButton) {
            Utils.addEventListenerSafe(this.submitButton, 'click', (e) => {
                e.preventDefault();
                this.saveEntry();
            });
        }

        // Keyboard shortcuts
        Utils.addEventListenerSafe(document, 'keydown', (e) => {
            this.handleGlobalKeydown(e);
        });

        // Before unload warning for unsaved changes
        Utils.addEventListenerSafe(window, 'beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    /**
     * Handle text input in the textarea
     * @param {Event} e - The input event
     */
    handleTextInput(e) {
        const text = e.target.value;
        this.currentEntry.text = text;
        this.debouncedUpdateCounts();
        this.debouncedAutoSave();
        
        // Update submit button state
        this.updateSubmitButtonState();
    }

    /**
     * Handle keydown events in textarea
     * @param {Event} e - The keydown event
     */
    handleKeydown(e) {
        // Tab key - prevent default and insert spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            const spaces = '    '; // 4 spaces for tab
            
            this.textarea.value = this.textarea.value.substring(0, start) + 
                                 spaces + 
                                 this.textarea.value.substring(end);
            
            this.textarea.selectionStart = this.textarea.selectionEnd = start + spaces.length;
            this.handleTextInput(e);
        }
        
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveEntry();
        }
        
        // Ctrl/Cmd + Enter to save
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.saveEntry();
        }
    }

    /**
     * Handle global keyboard shortcuts
     * @param {Event} e - The keydown event
     */
    handleGlobalKeydown(e) {
        // Only handle shortcuts when textarea is not focused
        if (document.activeElement === this.textarea) {
            return;
        }
        
        // Focus textarea with Ctrl/Cmd + /
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.focusTextarea();
        }
        
        // Mood shortcuts (1, 2, 3)
        if (e.key >= '1' && e.key <= '3') {
            const moodIndex = parseInt(e.key) - 1;
            if (this.moodButtons[moodIndex]) {
                e.preventDefault();
                this.selectMood(this.moodButtons[moodIndex], moodIndex);
            }
        }
    }

    /**
     * Update word and character counts
     */
    updateCounts() {
        const text = this.currentEntry.text;
        const wordCount = Utils.countWords(text);
        const charCount = Utils.countCharacters(text);
        
        this.currentEntry.wordCount = wordCount;
        this.currentEntry.charCount = charCount;
        
        if (this.wordCountElement) {
            this.wordCountElement.textContent = wordCount;
        }
        
        if (this.charCountElement) {
            this.charCountElement.textContent = charCount;
        }
    }

    /**
     * Select a mood
     * @param {Element} button - The mood button element
     * @param {number} index - The mood index
     */
    selectMood(button, index) {
        // Remove active class from all mood buttons
        this.moodButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        // Add active class to selected button
        button.classList.add('active');
        button.setAttribute('aria-pressed', 'true');
        
        // Store selected mood
        const moodTypes = ['happy', 'neutral', 'sad'];
        this.currentMood = moodTypes[index] || button.dataset.mood;
        this.currentEntry.mood = this.currentMood;
        
        // Auto-save mood selection
        this.debouncedAutoSave();
        
        Utils.log(`Mood selected: ${this.currentMood}`, 'info');
    }

    /**
     * Focus the textarea
     */
    focusTextarea() {
        if (this.textarea) {
            this.textarea.focus();
            // Move cursor to end
            this.textarea.setSelectionRange(this.textarea.value.length, this.textarea.value.length);
        }
    }

    /**
     * Update submit button state based on content
     */
    updateSubmitButtonState() {
        if (!this.submitButton) return;
        
        const hasContent = this.currentEntry.text.trim().length > 0;
        
        if (hasContent) {
            this.submitButton.disabled = false;
            this.submitButton.style.opacity = '1';
            this.submitButton.style.cursor = 'pointer';
        } else {
            this.submitButton.disabled = true;
            this.submitButton.style.opacity = '0.6';
            this.submitButton.style.cursor = 'not-allowed';
        }
    }

    /**
     * Auto-save the current entry as draft
     */
    autoSave() {
        if (!this.currentEntry.text.trim()) {
            this.clearDraft();
            return;
        }
        
        try {
            const draftData = {
                ...this.currentEntry,
                savedAt: new Date().toISOString(),
                isDraft: true
            };
            
            // Store in memory (simulating localStorage for Claude.ai)
            window.diaryAppDraft = draftData;
            Utils.log('Draft auto-saved', 'info');
            
        } catch (error) {
            Utils.log(`Error auto-saving draft: ${error.message}`, 'error');
        }
    }

    /**
     * Load draft entry if it exists
     */
    loadDraftEntry() {
        try {
            // Load from memory (simulating localStorage for Claude.ai)
            const draftData = window.diaryAppDraft;
            
            if (draftData && draftData.isDraft) {
                const draftDate = draftData.date;
                const currentDate = Utils.getCurrentDateISO();
                
                // Only load draft if it's from today
                if (draftDate === currentDate) {
                    this.currentEntry = { ...draftData };
                    
                    if (this.textarea) {
                        this.textarea.value = this.currentEntry.text;
                    }
                    
                    // Restore mood selection
                    if (this.currentEntry.mood) {
                        this.restoreMoodSelection(this.currentEntry.mood);
                    }
                    
                    this.updateCounts();
                    this.updateSubmitButtonState();
                    
                    Utils.log('Draft loaded successfully', 'info');
                    Utils.showNotification('Draft restored from today', 'info');
                } else {
                    // Clear old draft
                    this.clearDraft();
                }
            }
            
        } catch (error) {
            Utils.log(`Error loading draft: ${error.message}`, 'error');
        }
    }

    /**
     * Restore mood selection from saved data
     * @param {string} mood - The mood to restore
     */
    restoreMoodSelection(mood) {
        const moodTypes = ['happy', 'neutral', 'sad'];
        const moodIndex = moodTypes.indexOf(mood);
        
        if (moodIndex !== -1 && this.moodButtons[moodIndex]) {
            this.selectMood(this.moodButtons[moodIndex], moodIndex);
        }
    }

    /**
     * Save the current entry
     */
    saveEntry() {
        if (!this.currentEntry.text.trim()) {
            Utils.showNotification('Please write something before saving', 'warning');
            this.focusTextarea();
            return;
        }
        
        try {
            const entryData = {
                ...this.currentEntry,
                savedAt: new Date().toISOString(),
                isDraft: false,
                id: Utils.generateUniqueId('entry')
            };
            
            // In a real app, this would save to a database
            // For now, we'll save to memory and show success message
            window.diaryAppLastSavedEntry = entryData;
            
            // Clear the draft
            this.clearDraft();
            
            // Reset the form
            this.resetForm();
            
            Utils.log('Entry saved successfully', 'info');
            Utils.showNotification('Entry saved successfully!', 'success');
            
            // Dispatch custom event for entry saved
            this.dispatchEntrySavedEvent(entryData);
            
        } catch (error) {
            Utils.log(`Error saving entry: ${error.message}`, 'error');
            Utils.showNotification('Error saving entry. Please try again.', 'error');
        }
    }

    /**
     * Reset the form to initial state
     */
    resetForm() {
        // Clear textarea
        if (this.textarea) {
            this.textarea.value = '';
        }
        
        // Reset current entry
        this.currentEntry = {
            text: '',
            mood: null,
            date: Utils.getCurrentDateISO(),
            wordCount: 0,
            charCount: 0
        };
        
        // Clear mood selection
        this.moodButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        this.currentMood = null;
        
        // Update counts and button state
        this.updateCounts();
        this.updateSubmitButtonState();
        
        // Update date (in case it's a new day)
        this.setCurrentDate();
    }

    /**
     * Clear draft from storage
     */
    clearDraft() {
        try {
            window.diaryAppDraft = null;
            Utils.log('Draft cleared', 'info');
        } catch (error) {
            Utils.log(`Error clearing draft: ${error.message}`, 'error');
        }
    }

    /**
     * Check if there are unsaved changes
     * @returns {boolean} True if there are unsaved changes
     */
    hasUnsavedChanges() {
        return this.currentEntry.text.trim().length > 0 && 
               (!window.diaryAppLastSavedEntry || 
                window.diaryAppLastSavedEntry.text !== this.currentEntry.text);
    }

    /**
     * Dispatch custom event when entry is saved
     * @param {Object} entryData - The saved entry data
     */
    dispatchEntrySavedEvent(entryData) {
        try {
            const event = new CustomEvent('entrySaved', {
                detail: entryData
            });
            document.dispatchEvent(event);
        } catch (error) {
            Utils.log(`Error dispatching entry saved event: ${error.message}`, 'error');
        }
    }

    /**
     * Get current entry data
     * @returns {Object} Current entry data
     */
    getCurrentEntry() {
        return { ...this.currentEntry };
    }

    /**
     * Set entry data (useful for editing existing entries)
     * @param {Object} entryData - The entry data to set
     */
    setEntry(entryData) {
        if (!entryData) return;
        
        this.currentEntry = { ...entryData };
        
        if (this.textarea) {
            this.textarea.value = this.currentEntry.text || '';
        }
        
        if (this.currentEntry.mood) {
            this.restoreMoodSelection(this.currentEntry.mood);
        }
        
        this.updateCounts();
        this.updateSubmitButtonState();
    }

    /**
     * Get entry statistics
     * @returns {Object} Entry statistics
     */
    getEntryStats() {
        const text = this.currentEntry.text;
        return {
            wordCount: Utils.countWords(text),
            charCount: Utils.countCharacters(text),
            charCountNoSpaces: text.replace(/\s/g, '').length,
            paragraphCount: text.split(/\n\s*\n/).filter(p => p.trim()).length,
            avgWordsPerParagraph: Math.round(Utils.countWords(text) / Math.max(1, text.split(/\n\s*\n/).filter(p => p.trim()).length)),
            mood: this.currentMood,
            hasContent: text.trim().length > 0
        };
    }

    /**
     * Export entry as text
     * @returns {string} Formatted entry text
     */
    exportAsText() {
        const entry = this.currentEntry;
        const stats = this.getEntryStats();
        
        let exportText = `Journal Entry - ${Utils.formatDate(new Date(entry.date))}\n`;
        exportText += `${'='.repeat(50)}\n\n`;
        
        if (entry.mood) {
            exportText += `Mood: ${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}\n\n`;
        }
        
        exportText += `${entry.text}\n\n`;
        exportText += `${'='.repeat(50)}\n`;
        exportText += `Words: ${stats.wordCount} | Characters: ${stats.charCount} | Paragraphs: ${stats.paragraphCount}`;
        
        return exportText;
    }

    /**
     * Print current entry
     */
    printEntry() {
        const printContent = this.exportAsText();
        const printWindow = window.open('', '_blank');
        
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Journal Entry</title>
                        <style>
                            body { font-family: 'Courier New', monospace; line-height: 1.6; margin: 40px; }
                            pre { white-space: pre-wrap; word-wrap: break-word; }
                        </style>
                    </head>
                    <body>
                        <pre>${printContent}</pre>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }
}

// Initialize journal entry manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.journalEntry = new JournalEntry();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM still loading, wait for DOMContentLoaded
} else {
    // DOM already loaded
    window.journalEntry = new JournalEntry();
}