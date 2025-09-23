// Fallback Poll Configuration
// Provides default poll configurations when dynamic loading fails

/**
 * FallbackConfig provides static poll configurations and fallback behavior
 * when dynamic poll loading fails or network connectivity is unavailable
 */
class FallbackConfig {
    /**
     * Create a new FallbackConfig instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            debugMode: options.debugMode || window.VidPollConfig?.DEBUG_CONFIG?.CONSOLE_LOGGING || false,
            enableLocalStorage: options.enableLocalStorage !== false,
            storageKey: options.storageKey || 'vidpoll_fallback_configs'
        };

        // Built-in fallback configurations
        this.fallbackConfigs = new Map();

        // Initialize with default configurations
        this._initializeDefaultConfigs();

        if (this.options.debugMode) {
            console.log('📋 FallbackConfig initialized with', this.fallbackConfigs.size, 'configs');
        }
    }

    /**
     * Get fallback poll configuration
     * @param {string} pollId - Poll identifier
     * @param {string} videoId - Video identifier (for context-specific fallbacks)
     * @returns {Object} Fallback poll configuration
     */
    getFallbackPoll(pollId, videoId = null) {
        // Try specific poll ID first
        if (this.fallbackConfigs.has(pollId)) {
            const config = this.fallbackConfigs.get(pollId);

            if (this.options.debugMode) {
                console.log(`📋 Using specific fallback for poll: ${pollId}`);
            }

            return this._enrichConfig(config, pollId, videoId);
        }

        // Try video-specific fallback
        if (videoId && this.fallbackConfigs.has(`video-${videoId}`)) {
            const config = this.fallbackConfigs.get(`video-${videoId}`);

            if (this.options.debugMode) {
                console.log(`📋 Using video-specific fallback for: ${videoId}`);
            }

            return this._enrichConfig(config, pollId, videoId);
        }

        // Use default fallback
        const defaultConfig = this._getDefaultPollConfig();

        if (this.options.debugMode) {
            console.log(`📋 Using default fallback for poll: ${pollId}`);
        }

        return this._enrichConfig(defaultConfig, pollId, videoId);
    }

    /**
     * Add custom fallback configuration
     * @param {string} key - Configuration key (poll ID or video ID)
     * @param {Object} config - Poll configuration
     */
    addFallbackConfig(key, config) {
        this.fallbackConfigs.set(key, config);

        if (this.options.debugMode) {
            console.log(`📋 Added fallback config: ${key}`);
        }

        // Save to localStorage if enabled
        if (this.options.enableLocalStorage) {
            this._saveToStorage();
        }
    }

    /**
     * Get fallback cue configuration for video
     * @param {string} videoId - Video identifier
     * @returns {Array} Array of cue configurations
     */
    getFallbackCues(videoId) {
        // Video-specific cues
        const videoSpecificCues = this._getVideoSpecificCues(videoId);
        if (videoSpecificCues.length > 0) {
            return videoSpecificCues;
        }

        // Default cues from configuration
        const defaultCues = window.VidPollConfig?.VIDEO_CONFIG?.DEFAULT_CUES || [5, 15, 25, 35, 45, 55];

        return defaultCues.map((timestamp, index) => ({
            id: `fallback-cue-${index}`,
            timestamp: timestamp,
            pollId: 'demo-poll-2024',
            priority: 'normal',
            tolerance: window.VidPollConfig?.VIDEO_CONFIG?.CUE_TOLERANCE || 0.5
        }));
    }

    /**
     * Get emergency poll configuration (minimal viable poll)
     * @returns {Object} Emergency poll configuration
     */
    getEmergencyPoll() {
        return {
            poll_id: 'emergency-poll',
            title: 'Quick Feedback',
            description: 'We value your input! Please share your thoughts.',
            valid_choices: ['good', 'okay', 'needs-work'],
            is_active: true,
            status: 'active',
            fallback: true,
            emergency: true,
            cues: [{
                id: 'emergency-cue',
                timestamp: 30,
                pollId: 'emergency-poll'
            }]
        };
    }

    /**
     * Initialize default fallback configurations
     * @private
     */
    _initializeDefaultConfigs() {
        // General purpose feedback poll
        this.fallbackConfigs.set('demo-poll-2024', {
            title: 'How are we doing?',
            description: 'Your feedback helps us improve our content and experience.',
            valid_choices: ['excellent', 'very-good', 'good', 'fair', 'poor'],
            cues: [
                { timestamp: 15, id: 'intro-feedback' },
                { timestamp: 45, id: 'mid-feedback' },
                { timestamp: 90, id: 'end-feedback' }
            ]
        });

        // Educational content feedback
        this.fallbackConfigs.set('education-poll', {
            title: 'Learning Experience Check',
            description: 'Help us understand how well this content is working for you.',
            valid_choices: ['very-clear', 'clear', 'somewhat-clear', 'confusing'],
            cues: [
                { timestamp: 30, id: 'concept-check' },
                { timestamp: 60, id: 'understanding-check' }
            ]
        });

        // Product demo feedback
        this.fallbackConfigs.set('demo-poll', {
            title: 'Product Demo Feedback',
            description: 'What do you think of this product demonstration?',
            valid_choices: ['love-it', 'interested', 'neutral', 'not-interested'],
            cues: [
                { timestamp: 20, id: 'feature-demo' },
                { timestamp: 80, id: 'overall-demo' }
            ]
        });

        // Tutorial progress check
        this.fallbackConfigs.set('tutorial-poll', {
            title: 'Tutorial Progress',
            description: 'Are you following along okay?',
            valid_choices: ['keeping-up', 'going-slow', 'lost'],
            cues: [
                { timestamp: 25, id: 'progress-check-1' },
                { timestamp: 50, id: 'progress-check-2' },
                { timestamp: 75, id: 'progress-check-3' }
            ]
        });

        // Video-specific fallbacks
        this._initializeVideoSpecificConfigs();

        // Load saved configurations
        if (this.options.enableLocalStorage) {
            this._loadFromStorage();
        }
    }

    /**
     * Initialize video-specific configurations
     * @private
     */
    _initializeVideoSpecificConfigs() {
        // Google Cloud AI video (default video)
        this.fallbackConfigs.set('video-JnBy7Af_2e0', {
            title: 'AI Learning Experience',
            description: 'How is your experience learning about AI?',
            valid_choices: ['fascinating', 'interesting', 'okay', 'confusing'],
            cues: [
                { timestamp: 30, id: 'ai-intro-feedback' },
                { timestamp: 120, id: 'ai-concepts-feedback' },
                { timestamp: 240, id: 'ai-applications-feedback' }
            ]
        });

        // Add more video-specific configs here as needed
    }

    /**
     * Get video-specific cues
     * @param {string} videoId - Video identifier
     * @returns {Array} Video-specific cues
     * @private
     */
    _getVideoSpecificCues(videoId) {
        const videoSpecificMappings = {
            'JnBy7Af_2e0': [ // Google Cloud AI video
                { timestamp: 30, id: 'ai-intro', pollId: 'ai-intro-poll' },
                { timestamp: 120, id: 'ai-concepts', pollId: 'ai-concepts-poll' },
                { timestamp: 240, id: 'ai-applications', pollId: 'ai-applications-poll' }
            ],
            // Add more video-specific cue mappings here
        };

        return videoSpecificMappings[videoId] || [];
    }

    /**
     * Get default poll configuration
     * @returns {Object} Default poll configuration
     * @private
     */
    _getDefaultPollConfig() {
        return {
            title: 'Quick Feedback',
            description: 'Your thoughts help us improve. How are we doing?',
            valid_choices: ['excellent', 'good', 'okay', 'needs-work'],
            cues: [
                { timestamp: 30, id: 'default-cue-1', pollId: 'default-poll' },
                { timestamp: 60, id: 'default-cue-2', pollId: 'default-poll' }
            ]
        };
    }

    /**
     * Enrich configuration with runtime data
     * @param {Object} config - Base configuration
     * @param {string} pollId - Poll identifier
     * @param {string} videoId - Video identifier
     * @returns {Object} Enriched configuration
     * @private
     */
    _enrichConfig(config, pollId, videoId) {
        return {
            poll_id: pollId,
            ...config,
            is_active: true,
            status: 'active',
            fallback: true,
            video_id: videoId,
            created_at: new Date().toISOString(),
            cues: config.cues?.map(cue => ({
                ...cue,
                pollId: pollId,
                tolerance: window.VidPollConfig?.VIDEO_CONFIG?.CUE_TOLERANCE || 0.5
            })) || this.getFallbackCues(videoId)
        };
    }

    /**
     * Save configurations to localStorage
     * @private
     */
    _saveToStorage() {
        if (typeof localStorage === 'undefined') {
            return;
        }

        try {
            const data = {
                configs: Object.fromEntries(this.fallbackConfigs),
                timestamp: Date.now(),
                version: '1.0'
            };

            localStorage.setItem(this.options.storageKey, JSON.stringify(data));

            if (this.options.debugMode) {
                console.log('📋 Fallback configs saved to storage');
            }

        } catch (error) {
            console.warn('Failed to save fallback configs:', error);
        }
    }

    /**
     * Load configurations from localStorage
     * @private
     */
    _loadFromStorage() {
        if (typeof localStorage === 'undefined') {
            return;
        }

        try {
            const stored = localStorage.getItem(this.options.storageKey);
            if (!stored) {
                return;
            }

            const data = JSON.parse(stored);

            if (data.configs) {
                Object.entries(data.configs).forEach(([key, config]) => {
                    this.fallbackConfigs.set(key, config);
                });

                if (this.options.debugMode) {
                    console.log('📋 Fallback configs loaded from storage');
                }
            }

        } catch (error) {
            console.warn('Failed to load fallback configs:', error);
        }
    }

    /**
     * Check if poll ID should use fallback
     * @param {string} pollId - Poll identifier
     * @returns {boolean} True if should use fallback
     */
    shouldUseFallback(pollId) {
        // Always use fallback for these special poll IDs
        const alwaysFallback = [
            'demo-poll',
            'test-poll',
            'emergency-poll',
            'offline-poll'
        ];

        return alwaysFallback.some(id => pollId.includes(id));
    }

    /**
     * Get all available fallback configurations
     * @returns {Object} All fallback configurations
     */
    getAllConfigs() {
        return Object.fromEntries(this.fallbackConfigs);
    }

    /**
     * Remove fallback configuration
     * @param {string} key - Configuration key
     * @returns {boolean} True if removed
     */
    removeFallbackConfig(key) {
        const existed = this.fallbackConfigs.has(key);

        if (existed) {
            this.fallbackConfigs.delete(key);

            if (this.options.debugMode) {
                console.log(`📋 Removed fallback config: ${key}`);
            }

            // Update storage
            if (this.options.enableLocalStorage) {
                this._saveToStorage();
            }
        }

        return existed;
    }

    /**
     * Clear all custom configurations (keep defaults)
     */
    clearCustomConfigs() {
        const defaultKeys = [
            'demo-poll-2024',
            'education-poll',
            'demo-poll',
            'tutorial-poll'
        ];

        for (const [key] of this.fallbackConfigs) {
            if (!defaultKeys.includes(key) && !key.startsWith('video-')) {
                this.fallbackConfigs.delete(key);
            }
        }

        if (this.options.debugMode) {
            console.log('📋 Custom fallback configs cleared');
        }

        // Update storage
        if (this.options.enableLocalStorage) {
            this._saveToStorage();
        }
    }
}

// Create global fallback config instance
const globalFallbackConfig = new FallbackConfig({
    debugMode: window.VidPollConfig?.DEBUG_CONFIG?.CONSOLE_LOGGING || false
});

// Global functions for fallback configuration
window.getFallbackPoll = (pollId, videoId) => globalFallbackConfig.getFallbackPoll(pollId, videoId);
window.getFallbackCues = (videoId) => globalFallbackConfig.getFallbackCues(videoId);
window.getEmergencyPoll = () => globalFallbackConfig.getEmergencyPoll();
window.addFallbackConfig = (key, config) => globalFallbackConfig.addFallbackConfig(key, config);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FallbackConfig;
}

console.log('📋 Fallback configuration system loaded');