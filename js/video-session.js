// VideoSession Class Implementation
// Manages video playback state and poll integration

/**
 * VideoSession manages the relationship between video playback and poll triggers
 * Handles timecode monitoring, poll caching, and user preferences
 */
class VideoSession {
    /**
     * Create a new VideoSession
     * @param {string} videoId - YouTube video identifier
     * @param {string} pollId - Poll configuration identifier
     * @param {Object} options - Configuration options
     */
    constructor(videoId, pollId, options = {}) {
        // Core identifiers
        this.videoId = videoId;
        this.pollId = pollId;

        // Playback state
        this.currentTime = 0;
        this.isPlaying = false;
        this.isOptedOut = false;

        // Cue tracking
        this.triggeredCues = new Set();
        this.activeCues = new Map();

        // Configuration
        this.options = {
            tolerance: options.tolerance || window.VidPollConfig?.VIDEO_CONFIG?.CUE_TOLERANCE || 0.5,
            pollingInterval: options.pollingInterval || window.VidPollConfig?.VIDEO_CONFIG?.POLLING_INTERVAL || 300,
            autoResume: options.autoResume !== false,
            debugMode: options.debugMode || false
        };

        // Cache management
        this.pollCache = new Map();
        this.cacheTimeout = window.VidPollConfig?.POLL_CONFIG?.CACHE_DURATION || 300000; // 5 minutes

        // Event handling
        this.eventListeners = new Map();

        // Initialize session
        this._initializeSession();

        if (this.options.debugMode) {
            console.log(`VideoSession created: ${videoId} -> ${pollId}`, this.options);
        }
    }

    /**
     * Initialize session state and load user preferences
     * @private
     */
    _initializeSession() {
        // Load user preferences if available
        if (typeof UserPreferences !== 'undefined') {
            this.userPreferences = new UserPreferences();
            this.isOptedOut = this.userPreferences.isOptedOut();
        }

        // Load poll configuration
        this.loadPollConfiguration();
    }

    /**
     * Load poll configuration from cache or API
     * @returns {Promise<Object>} Poll configuration data
     */
    async loadPollConfiguration() {
        if (this.isOptedOut) {
            if (this.options.debugMode) {
                console.log('User opted out, skipping poll configuration load');
            }
            return null;
        }

        try {
            // Check cache first
            const cached = this._getCachedPoll(this.pollId);
            if (cached) {
                this._processPollConfiguration(cached);
                return cached;
            }

            // Fetch from API
            if (typeof fetchPollConfiguration === 'function') {
                const pollConfig = await fetchPollConfiguration(this.pollId);

                if (pollConfig) {
                    this._cachePoll(this.pollId, pollConfig);
                    this._processPollConfiguration(pollConfig);
                    return pollConfig;
                }
            }

            // Fallback to default configuration
            return this._loadFallbackConfiguration();

        } catch (error) {
            console.error('Failed to load poll configuration:', error);
            return this._loadFallbackConfiguration();
        }
    }

    /**
     * Process loaded poll configuration and set up cues
     * @param {Object} pollConfig - Poll configuration data
     * @private
     */
    _processPollConfiguration(pollConfig) {
        if (!pollConfig || !pollConfig.cues) {
            return;
        }

        // Clear existing cues
        this.activeCues.clear();

        // Add new cues
        pollConfig.cues.forEach(cueData => {
            if (typeof TimecodeCue !== 'undefined') {
                const cue = new TimecodeCue(
                    cueData.id || `cue-${cueData.timestamp}`,
                    cueData.timestamp,
                    cueData.pollId || this.pollId,
                    { tolerance: this.options.tolerance }
                );
                this.activeCues.set(cue.id, cue);
            }
        });

        if (this.options.debugMode) {
            console.log(`Loaded ${this.activeCues.size} cues for poll ${this.pollId}`);
        }

        this._dispatchEvent('pollConfigLoaded', { pollConfig, cueCount: this.activeCues.size });
    }

    /**
     * Load fallback poll configuration when API fails
     * @returns {Object} Fallback configuration
     * @private
     */
    _loadFallbackConfiguration() {
        const fallbackConfig = {
            id: this.pollId,
            title: 'Default Poll',
            description: 'A sample poll for this video',
            cues: window.VidPollConfig?.VIDEO_CONFIG?.DEFAULT_CUES?.map((timestamp, index) => ({
                id: `fallback-cue-${index}`,
                timestamp: timestamp,
                pollId: this.pollId
            })) || []
        };

        this._processPollConfiguration(fallbackConfig);
        return fallbackConfig;
    }

    /**
     * Check if a poll should be triggered at the current time
     * @param {number} currentTime - Current video time in seconds
     * @returns {boolean} True if poll should be triggered
     */
    shouldTriggerPoll(currentTime) {
        if (this.isOptedOut) {
            return false;
        }

        this.currentTime = currentTime;

        // Check all active cues
        for (const [cueId, cue] of this.activeCues) {
            if (!this.triggeredCues.has(cueId) && cue.shouldTrigger(currentTime)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Mark a cue as triggered
     * @param {number|string} cueIdOrTimestamp - Cue ID or timestamp
     */
    markCueTriggered(cueIdOrTimestamp) {
        // Handle both cue ID and timestamp
        let cueId;

        if (typeof cueIdOrTimestamp === 'string') {
            cueId = cueIdOrTimestamp;
        } else {
            // Find cue by timestamp
            for (const [id, cue] of this.activeCues) {
                if (Math.abs(cue.timestamp - cueIdOrTimestamp) <= this.options.tolerance) {
                    cueId = id;
                    break;
                }
            }
        }

        if (cueId) {
            this.triggeredCues.add(cueId);

            // Mark the cue object as triggered
            const cue = this.activeCues.get(cueId);
            if (cue) {
                cue.triggered = true;
            }

            if (this.options.debugMode) {
                console.log(`Cue triggered: ${cueId} at ${this.currentTime}s`);
            }

            this._dispatchEvent('cueTriggered', { cueId, timestamp: this.currentTime });
        }
    }

    /**
     * Submit a poll response with video context
     * @param {Object} responseData - Poll response data
     * @returns {Promise<Object>} Submission result
     */
    async submitPollResponse(responseData) {
        if (this.isOptedOut) {
            throw new Error('User has opted out of polls');
        }

        // Add video context to response
        const contextualResponse = {
            ...responseData,
            videoId: this.videoId,
            pollId: this.pollId,
            timestamp: this.currentTime,
            sessionId: this._getSessionId()
        };

        try {
            let result;

            if (typeof submitPollResponse === 'function') {
                result = await submitPollResponse(contextualResponse);
            } else {
                // Fallback submission method
                result = await this._fallbackSubmission(contextualResponse);
            }

            if (this.options.debugMode) {
                console.log('Poll response submitted successfully:', result);
            }

            this._dispatchEvent('responseSubmitted', { response: contextualResponse, result });
            return result;

        } catch (error) {
            console.error('Failed to submit poll response:', error);
            this._dispatchEvent('responseError', { error, response: contextualResponse });
            throw error;
        }
    }

    /**
     * Update video playback state
     * @param {number} currentTime - Current video time
     * @param {boolean} isPlaying - Whether video is playing
     */
    updatePlaybackState(currentTime, isPlaying) {
        this.currentTime = currentTime;
        this.isPlaying = isPlaying;

        this._dispatchEvent('playbackStateChanged', {
            currentTime,
            isPlaying,
            triggeredCues: Array.from(this.triggeredCues)
        });
    }

    /**
     * Set user opt-out status
     * @param {boolean} optedOut - Whether user has opted out
     */
    setOptOut(optedOut) {
        this.isOptedOut = optedOut;

        if (this.userPreferences) {
            this.userPreferences.setOptOut(optedOut);
        }

        this._dispatchEvent('optOutChanged', { optedOut });
    }

    /**
     * Get session statistics
     * @returns {Object} Session statistics
     */
    getSessionStats() {
        return {
            videoId: this.videoId,
            pollId: this.pollId,
            currentTime: this.currentTime,
            isPlaying: this.isPlaying,
            isOptedOut: this.isOptedOut,
            totalCues: this.activeCues.size,
            triggeredCues: this.triggeredCues.size,
            remainingCues: this.activeCues.size - this.triggeredCues.size,
            cacheSize: this.pollCache.size
        };
    }

    /**
     * Reset triggered cues (for replay scenarios)
     */
    resetTriggeredCues() {
        this.triggeredCues.clear();

        // Reset cue objects
        for (const cue of this.activeCues.values()) {
            cue.triggered = false;
        }

        this._dispatchEvent('cuesReset', {});
    }

    /**
     * Cache poll configuration
     * @param {string} pollId - Poll identifier
     * @param {Object} pollConfig - Poll configuration
     * @private
     */
    _cachePoll(pollId, pollConfig) {
        this.pollCache.set(pollId, {
            data: pollConfig,
            timestamp: Date.now()
        });

        // Cleanup old cache entries
        this._cleanupCache();
    }

    /**
     * Get cached poll configuration
     * @param {string} pollId - Poll identifier
     * @returns {Object|null} Cached poll configuration or null
     * @private
     */
    _getCachedPoll(pollId) {
        const cached = this.pollCache.get(pollId);

        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        return null;
    }

    /**
     * Cleanup expired cache entries
     * @private
     */
    _cleanupCache() {
        const now = Date.now();
        const maxSize = window.VidPollConfig?.POLL_CONFIG?.MAX_CACHE_SIZE || 50;

        // Remove expired entries
        for (const [pollId, cached] of this.pollCache) {
            if ((now - cached.timestamp) >= this.cacheTimeout) {
                this.pollCache.delete(pollId);
            }
        }

        // Limit cache size
        if (this.pollCache.size > maxSize) {
            const entries = Array.from(this.pollCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

            // Remove oldest entries
            const toRemove = entries.slice(0, this.pollCache.size - maxSize);
            toRemove.forEach(([pollId]) => this.pollCache.delete(pollId));
        }
    }

    /**
     * Get or generate session identifier
     * @returns {string} Session ID
     * @private
     */
    _getSessionId() {
        if (!this.sessionId) {
            this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        return this.sessionId;
    }

    /**
     * Fallback poll response submission
     * @param {Object} responseData - Response data
     * @returns {Promise<Object>} Submission result
     * @private
     */
    async _fallbackSubmission(responseData) {
        // Simple fallback - just log the response
        console.log('Fallback poll submission:', responseData);
        return { success: true, fallback: true, timestamp: Date.now() };
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    removeEventListener(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Dispatch custom event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     * @private
     */
    _dispatchEvent(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Cleanup session resources
     */
    destroy() {
        this.eventListeners.clear();
        this.pollCache.clear();
        this.activeCues.clear();
        this.triggeredCues.clear();

        if (this.options.debugMode) {
            console.log(`VideoSession destroyed: ${this.videoId}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoSession;
}