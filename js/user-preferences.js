// UserPreferences Class Implementation
// Manages user settings and opt-out status for polling system

/**
 * UserPreferences manages user settings, opt-out status, and preference persistence
 * Provides a consistent interface for user configuration across the application
 */
class UserPreferences {
    /**
     * Create a new UserPreferences instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            storageKey: options.storageKey || window.VidPollConfig?.SESSION_CONFIG?.STORAGE_KEYS?.USER_PREFERENCES || 'pollPrefs',
            optOutKey: options.optOutKey || window.VidPollConfig?.SESSION_CONFIG?.STORAGE_KEYS?.OPT_OUT_STATUS || 'pollOptOut',
            autoSave: options.autoSave !== false,
            debugMode: options.debugMode || false,
            useSessionStorage: options.useSessionStorage || false
        };

        // Storage interface
        this.storage = this.options.useSessionStorage ? sessionStorage : localStorage;

        // Internal preferences cache
        this.preferences = new Map();
        this.isOptedOutState = false;

        // Load existing preferences
        this.load();

        if (this.options.debugMode) {
            console.log('UserPreferences initialized with options:', this.options);
        }
    }

    /**
     * Get a preference value
     * @param {string} key - Preference key
     * @param {*} defaultValue - Default value if preference doesn't exist
     * @returns {*} Preference value or default
     */
    getPreference(key, defaultValue = null) {
        if (this.preferences.has(key)) {
            const value = this.preferences.get(key);

            if (this.options.debugMode) {
                console.log(`Preference retrieved: ${key} = ${value}`);
            }

            return value;
        }

        return defaultValue;
    }

    /**
     * Set a preference value
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    setPreference(key, value) {
        this.preferences.set(key, value);

        if (this.options.debugMode) {
            console.log(`Preference set: ${key} = ${value}`);
        }

        if (this.options.autoSave) {
            this.save();
        }
    }

    /**
     * Remove a preference
     * @param {string} key - Preference key
     * @returns {boolean} True if preference was removed
     */
    removePreference(key) {
        const existed = this.preferences.has(key);
        this.preferences.delete(key);

        if (existed) {
            if (this.options.debugMode) {
                console.log(`Preference removed: ${key}`);
            }

            if (this.options.autoSave) {
                this.save();
            }
        }

        return existed;
    }

    /**
     * Check if user has opted out of polls
     * @returns {boolean} True if opted out
     */
    isOptedOut() {
        return this.isOptedOutState;
    }

    /**
     * Set user opt-out status
     * @param {boolean} optedOut - Whether user has opted out
     */
    setOptOut(optedOut) {
        this.isOptedOutState = Boolean(optedOut);

        if (this.options.debugMode) {
            console.log(`Opt-out status set: ${this.isOptedOutState}`);
        }

        // Save opt-out status separately for quick access
        try {
            this.storage.setItem(this.options.optOutKey, JSON.stringify(this.isOptedOutState));
        } catch (error) {
            console.warn('Failed to save opt-out status:', error);
        }

        if (this.options.autoSave) {
            this.save();
        }
    }

    /**
     * Get all preferences as an object
     * @returns {Object} All preferences
     */
    getAllPreferences() {
        const prefs = {};
        for (const [key, value] of this.preferences) {
            prefs[key] = value;
        }
        return prefs;
    }

    /**
     * Set multiple preferences at once
     * @param {Object} preferences - Object containing preference key-value pairs
     */
    setMultiplePreferences(preferences) {
        if (typeof preferences !== 'object' || preferences === null) {
            console.warn('setMultiplePreferences expects an object');
            return;
        }

        Object.entries(preferences).forEach(([key, value]) => {
            this.preferences.set(key, value);
        });

        if (this.options.debugMode) {
            console.log('Multiple preferences set:', Object.keys(preferences));
        }

        if (this.options.autoSave) {
            this.save();
        }
    }

    /**
     * Clear all preferences
     */
    clearPreferences() {
        this.preferences.clear();

        if (this.options.debugMode) {
            console.log('All preferences cleared');
        }

        if (this.options.autoSave) {
            this.save();
        }
    }

    /**
     * Check if a preference exists
     * @param {string} key - Preference key
     * @returns {boolean} True if preference exists
     */
    hasPreference(key) {
        return this.preferences.has(key);
    }

    /**
     * Get preference keys
     * @returns {Array<string>} Array of preference keys
     */
    getPreferenceKeys() {
        return Array.from(this.preferences.keys());
    }

    /**
     * Get preference count
     * @returns {number} Number of stored preferences
     */
    getPreferenceCount() {
        return this.preferences.size;
    }

    /**
     * Save preferences to storage
     * @returns {boolean} True if save was successful
     */
    save() {
        try {
            const data = {
                preferences: this.getAllPreferences(),
                isOptedOut: this.isOptedOutState,
                timestamp: Date.now(),
                version: '1.0'
            };

            this.storage.setItem(this.options.storageKey, JSON.stringify(data));

            if (this.options.debugMode) {
                console.log('Preferences saved to storage');
            }

            return true;

        } catch (error) {
            console.error('Failed to save preferences:', error);
            return false;
        }
    }

    /**
     * Load preferences from storage
     * @returns {boolean} True if load was successful
     */
    load() {
        try {
            // Load main preferences
            const storedData = this.storage.getItem(this.options.storageKey);
            if (storedData) {
                const data = JSON.parse(storedData);

                if (data.preferences) {
                    this.preferences.clear();
                    Object.entries(data.preferences).forEach(([key, value]) => {
                        this.preferences.set(key, value);
                    });
                }

                if (data.isOptedOut !== undefined) {
                    this.isOptedOutState = Boolean(data.isOptedOut);
                }
            }

            // Load opt-out status separately (for backwards compatibility)
            const optOutData = this.storage.getItem(this.options.optOutKey);
            if (optOutData) {
                try {
                    this.isOptedOutState = JSON.parse(optOutData);
                } catch (e) {
                    // Handle legacy string values
                    this.isOptedOutState = optOutData === 'true';
                }
            }

            if (this.options.debugMode) {
                console.log('Preferences loaded from storage', {
                    preferenceCount: this.preferences.size,
                    isOptedOut: this.isOptedOutState
                });
            }

            return true;

        } catch (error) {
            console.error('Failed to load preferences:', error);
            return false;
        }
    }

    /**
     * Reset all preferences to defaults
     */
    reset() {
        this.preferences.clear();
        this.isOptedOutState = false;

        // Clear from storage
        try {
            this.storage.removeItem(this.options.storageKey);
            this.storage.removeItem(this.options.optOutKey);
        } catch (error) {
            console.warn('Failed to clear storage:', error);
        }

        if (this.options.debugMode) {
            console.log('Preferences reset to defaults');
        }
    }

    /**
     * Export preferences for backup or transfer
     * @returns {Object} Exportable preferences data
     */
    export() {
        return {
            preferences: this.getAllPreferences(),
            isOptedOut: this.isOptedOutState,
            exportedAt: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Import preferences from exported data
     * @param {Object} data - Exported preferences data
     * @returns {boolean} True if import was successful
     */
    import(data) {
        try {
            if (data.preferences) {
                this.setMultiplePreferences(data.preferences);
            }

            if (data.isOptedOut !== undefined) {
                this.setOptOut(data.isOptedOut);
            }

            if (this.options.debugMode) {
                console.log('Preferences imported successfully');
            }

            return true;

        } catch (error) {
            console.error('Failed to import preferences:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        try {
            const mainData = this.storage.getItem(this.options.storageKey) || '';
            const optOutData = this.storage.getItem(this.options.optOutKey) || '';

            return {
                mainDataSize: mainData.length,
                optOutDataSize: optOutData.length,
                totalSize: mainData.length + optOutData.length,
                preferenceCount: this.preferences.size,
                storageType: this.options.useSessionStorage ? 'sessionStorage' : 'localStorage'
            };

        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    /**
     * Validate current preferences
     * @returns {Object} Validation result
     */
    validate() {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Check storage availability
        try {
            const testKey = '_vidpoll_test_';
            this.storage.setItem(testKey, 'test');
            this.storage.removeItem(testKey);
        } catch (error) {
            result.isValid = false;
            result.errors.push('Storage not available');
        }

        // Check preference types
        for (const [key, value] of this.preferences) {
            if (typeof key !== 'string') {
                result.warnings.push(`Non-string preference key: ${key}`);
            }

            // Check if value is serializable
            try {
                JSON.stringify(value);
            } catch (error) {
                result.errors.push(`Non-serializable preference value for key: ${key}`);
                result.isValid = false;
            }
        }

        return result;
    }

    /**
     * Add event listener for preference changes
     * @param {Function} callback - Callback function
     */
    onPreferenceChange(callback) {
        if (typeof callback === 'function') {
            // Store original methods to wrap them
            const originalSet = this.setPreference.bind(this);
            const originalRemove = this.removePreference.bind(this);
            const originalClear = this.clearPreferences.bind(this);

            this.setPreference = (key, value) => {
                const oldValue = this.preferences.get(key);
                originalSet(key, value);
                callback('set', key, value, oldValue);
            };

            this.removePreference = (key) => {
                const oldValue = this.preferences.get(key);
                const result = originalRemove(key);
                if (result) {
                    callback('remove', key, undefined, oldValue);
                }
                return result;
            };

            this.clearPreferences = () => {
                const oldPrefs = this.getAllPreferences();
                originalClear();
                callback('clear', null, null, oldPrefs);
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserPreferences;
}