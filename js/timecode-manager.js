// TimecodeManager Class Implementation
// Manages video timecode cues and triggering logic

/**
 * TimecodeManager handles the collection of timecode cues and determines
 * when polls should be triggered based on video playback position
 */
class TimecodeManager {
    /**
     * Create a new TimecodeManager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Core collections
        this.cues = new Map(); // Map of cue ID -> TimecodeCue
        this.triggeredCues = new Set(); // Set of triggered cue IDs

        // Configuration
        this.options = {
            tolerance: options.tolerance || window.VidPollConfig?.VIDEO_CONFIG?.CUE_TOLERANCE || 0.5,
            debugMode: options.debugMode || false,
            autoSort: options.autoSort !== false // Auto-sort cues by timestamp
        };

        // Event handling
        this.eventListeners = new Map();

        // State tracking
        this.lastCheckTime = 0;
        this.isActive = true;

        if (this.options.debugMode) {
            console.log('TimecodeManager created with options:', this.options);
        }
    }

    /**
     * Add a timecode cue
     * @param {TimecodeCue|Object} cue - TimecodeCue instance or cue data
     * @returns {string} Cue ID
     */
    addCue(cue) {
        let cueInstance;

        if (cue instanceof TimecodeCue) {
            cueInstance = cue;
        } else {
            // Create TimecodeCue from data
            if (typeof TimecodeCue !== 'undefined') {
                cueInstance = new TimecodeCue(
                    cue.id || `cue-${cue.timestamp}-${Date.now()}`,
                    cue.timestamp,
                    cue.pollId,
                    { tolerance: this.options.tolerance, ...cue.options }
                );
            } else {
                // Fallback if TimecodeCue class not available
                cueInstance = {
                    id: cue.id || `cue-${cue.timestamp}-${Date.now()}`,
                    timestamp: cue.timestamp,
                    pollId: cue.pollId,
                    triggered: false,
                    shouldTrigger: (currentTime) => {
                        return !cueInstance.triggered &&
                               Math.abs(currentTime - cueInstance.timestamp) <= this.options.tolerance;
                    }
                };
            }
        }

        this.cues.set(cueInstance.id, cueInstance);

        if (this.options.debugMode) {
            console.log(`Cue added: ${cueInstance.id} at ${cueInstance.timestamp}s`);
        }

        this._dispatchEvent('cueAdded', { cue: cueInstance });
        return cueInstance.id;
    }

    /**
     * Remove a timecode cue
     * @param {string} cueId - Cue identifier
     * @returns {boolean} True if cue was removed
     */
    removeCue(cueId) {
        const cue = this.cues.get(cueId);
        if (cue) {
            this.cues.delete(cueId);
            this.triggeredCues.delete(cueId);

            if (this.options.debugMode) {
                console.log(`Cue removed: ${cueId}`);
            }

            this._dispatchEvent('cueRemoved', { cueId, cue });
            return true;
        }

        return false;
    }

    /**
     * Check for cues that should be triggered at the current time
     * @param {number} currentTime - Current video time in seconds
     * @returns {Array<Object>} Array of cues that should be triggered
     */
    checkCues(currentTime) {
        if (!this.isActive) {
            return [];
        }

        const triggeredCues = [];

        for (const [cueId, cue] of this.cues) {
            // Skip already triggered cues
            if (this.triggeredCues.has(cueId)) {
                continue;
            }

            // Check if cue should be triggered
            if (cue.shouldTrigger && cue.shouldTrigger(currentTime)) {
                triggeredCues.push({
                    id: cueId,
                    cue: cue,
                    timestamp: cue.timestamp,
                    pollId: cue.pollId,
                    currentTime: currentTime
                });

                // Mark as triggered
                this.triggeredCues.add(cueId);
                if (cue.triggered !== undefined) {
                    cue.triggered = true;
                }

                if (this.options.debugMode) {
                    console.log(`Cue triggered: ${cueId} at ${currentTime}s (target: ${cue.timestamp}s)`);
                }
            }
        }

        // Update last check time
        this.lastCheckTime = currentTime;

        // Dispatch events for triggered cues
        if (triggeredCues.length > 0) {
            this._dispatchEvent('cuesTriggered', { cues: triggeredCues, currentTime });

            triggeredCues.forEach(triggerData => {
                this._dispatchEvent('cueTriggered', triggerData);
            });
        }

        return triggeredCues;
    }

    /**
     * Clear all triggered cues (for replay scenarios)
     */
    clearTriggered() {
        this.triggeredCues.clear();

        // Reset triggered state on cue objects
        for (const cue of this.cues.values()) {
            if (cue.triggered !== undefined) {
                cue.triggered = false;
            }
        }

        if (this.options.debugMode) {
            console.log('All triggered cues cleared');
        }

        this._dispatchEvent('triggeredCleared', {});
    }

    /**
     * Get all cues sorted by timestamp
     * @returns {Array<Object>} Array of cue data objects
     */
    getSortedCues() {
        const cueArray = Array.from(this.cues.values());

        if (this.options.autoSort) {
            cueArray.sort((a, b) => a.timestamp - b.timestamp);
        }

        return cueArray.map(cue => ({
            id: cue.id,
            timestamp: cue.timestamp,
            pollId: cue.pollId,
            triggered: this.triggeredCues.has(cue.id)
        }));
    }

    /**
     * Get cues within a time range
     * @param {number} startTime - Start time in seconds
     * @param {number} endTime - End time in seconds
     * @returns {Array<Object>} Array of cues in the time range
     */
    getCuesInRange(startTime, endTime) {
        const cuesInRange = [];

        for (const cue of this.cues.values()) {
            if (cue.timestamp >= startTime && cue.timestamp <= endTime) {
                cuesInRange.push({
                    id: cue.id,
                    timestamp: cue.timestamp,
                    pollId: cue.pollId,
                    triggered: this.triggeredCues.has(cue.id)
                });
            }
        }

        if (this.options.autoSort) {
            cuesInRange.sort((a, b) => a.timestamp - b.timestamp);
        }

        return cuesInRange;
    }

    /**
     * Get the next untriggered cue after the current time
     * @param {number} currentTime - Current video time
     * @returns {Object|null} Next cue data or null
     */
    getNextCue(currentTime) {
        let nextCue = null;
        let minDistance = Infinity;

        for (const [cueId, cue] of this.cues) {
            if (!this.triggeredCues.has(cueId) && cue.timestamp > currentTime) {
                const distance = cue.timestamp - currentTime;
                if (distance < minDistance) {
                    minDistance = distance;
                    nextCue = {
                        id: cueId,
                        timestamp: cue.timestamp,
                        pollId: cue.pollId,
                        distance: distance
                    };
                }
            }
        }

        return nextCue;
    }

    /**
     * Get cue statistics
     * @returns {Object} Statistics about cues
     */
    getStats() {
        const totalCues = this.cues.size;
        const triggeredCount = this.triggeredCues.size;
        const remainingCount = totalCues - triggeredCount;

        const timestamps = Array.from(this.cues.values()).map(cue => cue.timestamp);
        const minTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : 0;
        const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;

        return {
            totalCues,
            triggeredCount,
            remainingCount,
            completionPercentage: totalCues > 0 ? (triggeredCount / totalCues) * 100 : 0,
            timeRange: {
                min: minTimestamp,
                max: maxTimestamp,
                duration: maxTimestamp - minTimestamp
            },
            isActive: this.isActive,
            lastCheckTime: this.lastCheckTime
        };
    }

    /**
     * Load cues from configuration data
     * @param {Array<Object>} cuesData - Array of cue configuration objects
     */
    loadCues(cuesData) {
        if (!Array.isArray(cuesData)) {
            console.warn('loadCues expects an array of cue data');
            return;
        }

        cuesData.forEach(cueData => {
            this.addCue(cueData);
        });

        if (this.options.debugMode) {
            console.log(`Loaded ${cuesData.length} cues`);
        }

        this._dispatchEvent('cuesLoaded', { count: cuesData.length });
    }

    /**
     * Set active state
     * @param {boolean} active - Whether manager should be active
     */
    setActive(active) {
        this.isActive = active;

        if (this.options.debugMode) {
            console.log(`TimecodeManager ${active ? 'activated' : 'deactivated'}`);
        }

        this._dispatchEvent('activeStateChanged', { active });
    }

    /**
     * Update tolerance for all cues
     * @param {number} tolerance - New tolerance value in seconds
     */
    setTolerance(tolerance) {
        this.options.tolerance = tolerance;

        // Update tolerance on existing cues
        for (const cue of this.cues.values()) {
            if (cue.options) {
                cue.options.tolerance = tolerance;
            }
        }

        if (this.options.debugMode) {
            console.log(`Tolerance updated to ${tolerance}s`);
        }

        this._dispatchEvent('toleranceChanged', { tolerance });
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
                    console.error(`Error in TimecodeManager ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Clear all cues and reset state
     */
    clear() {
        this.cues.clear();
        this.triggeredCues.clear();
        this.lastCheckTime = 0;

        if (this.options.debugMode) {
            console.log('TimecodeManager cleared');
        }

        this._dispatchEvent('cleared', {});
    }

    /**
     * Cleanup manager resources
     */
    destroy() {
        this.clear();
        this.eventListeners.clear();
        this.isActive = false;

        if (this.options.debugMode) {
            console.log('TimecodeManager destroyed');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimecodeManager;
}