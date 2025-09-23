// TimecodeCue Class Implementation
// Represents a single timecode-triggered poll cue

/**
 * TimecodeCue represents a single point in video time where a poll should be triggered
 * Handles timing logic, trigger state, and poll association
 */
class TimecodeCue {
    /**
     * Create a new TimecodeCue
     * @param {string} id - Unique identifier for this cue
     * @param {number} timestamp - Time in seconds when cue should trigger
     * @param {string} pollId - Associated poll identifier
     * @param {Object} options - Configuration options
     */
    constructor(id, timestamp, pollId, options = {}) {
        // Validate required parameters
        if (!id || typeof id !== 'string') {
            throw new Error('TimecodeCue requires a valid string ID');
        }

        if (typeof timestamp !== 'number' || timestamp < 0) {
            throw new Error('TimecodeCue requires a valid timestamp (>= 0)');
        }

        if (!pollId || typeof pollId !== 'string') {
            throw new Error('TimecodeCue requires a valid poll ID');
        }

        // Core properties
        this.id = id;
        this.timestamp = timestamp;
        this.pollId = pollId;
        this.triggered = false;

        // Configuration
        this.options = {
            tolerance: options.tolerance || window.VidPollConfig?.VIDEO_CONFIG?.CUE_TOLERANCE || 0.5,
            priority: options.priority || 'normal', // 'low', 'normal', 'high'
            allowRetrigger: options.allowRetrigger || false,
            metadata: options.metadata || {},
            debugMode: options.debugMode || false
        };

        // State tracking
        this.lastCheckTime = -1;
        this.triggerCount = 0;
        this.createdAt = Date.now();

        if (this.options.debugMode) {
            console.log(`TimecodeCue created: ${id} at ${timestamp}s for poll ${pollId}`);
        }
    }

    /**
     * Check if this cue is currently triggered
     * @returns {boolean} True if cue has been triggered
     */
    isTriggered() {
        return this.triggered;
    }

    /**
     * Check if this cue should trigger at the given time
     * @param {number} currentTime - Current video time in seconds
     * @returns {boolean} True if cue should trigger
     */
    shouldTrigger(currentTime) {
        // Don't trigger if already triggered (unless retrigger is allowed)
        if (this.triggered && !this.options.allowRetrigger) {
            return false;
        }

        // Check if within tolerance range
        const timeDifference = Math.abs(currentTime - this.timestamp);
        const withinTolerance = timeDifference <= this.options.tolerance;

        // Prevent rapid re-triggering by checking if we've moved forward in time
        const timeProgressed = currentTime > this.lastCheckTime;
        this.lastCheckTime = currentTime;

        if (this.options.debugMode && withinTolerance) {
            console.log(`Cue ${this.id}: currentTime=${currentTime}, target=${this.timestamp}, diff=${timeDifference}, tolerance=${this.options.tolerance}`);
        }

        return withinTolerance && (timeProgressed || this.options.allowRetrigger);
    }

    /**
     * Mark this cue as triggered
     * @param {number} actualTime - Actual time when trigger occurred
     * @returns {Object} Trigger result information
     */
    trigger(actualTime = null) {
        if (this.triggered && !this.options.allowRetrigger) {
            return {
                success: false,
                reason: 'already_triggered',
                triggerCount: this.triggerCount
            };
        }

        this.triggered = true;
        this.triggerCount++;

        const triggerResult = {
            success: true,
            cueId: this.id,
            targetTime: this.timestamp,
            actualTime: actualTime || this.lastCheckTime,
            accuracy: actualTime ? Math.abs(actualTime - this.timestamp) : null,
            triggerCount: this.triggerCount,
            triggeredAt: Date.now()
        };

        if (this.options.debugMode) {
            console.log(`Cue triggered: ${this.id}`, triggerResult);
        }

        return triggerResult;
    }

    /**
     * Reset the trigger state of this cue
     */
    reset() {
        this.triggered = false;
        this.lastCheckTime = -1;

        if (this.options.debugMode) {
            console.log(`Cue reset: ${this.id}`);
        }
    }

    /**
     * Get the time remaining until this cue should trigger
     * @param {number} currentTime - Current video time
     * @returns {number} Seconds until trigger (negative if past)
     */
    getTimeRemaining(currentTime) {
        return this.timestamp - currentTime;
    }

    /**
     * Check if the current time is within the trigger window
     * @param {number} currentTime - Current video time
     * @returns {boolean} True if within trigger window
     */
    isInTriggerWindow(currentTime) {
        return Math.abs(currentTime - this.timestamp) <= this.options.tolerance;
    }

    /**
     * Get detailed cue information
     * @returns {Object} Detailed cue data
     */
    getInfo() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            pollId: this.pollId,
            triggered: this.triggered,
            triggerCount: this.triggerCount,
            options: { ...this.options },
            state: {
                lastCheckTime: this.lastCheckTime,
                createdAt: this.createdAt,
                age: Date.now() - this.createdAt
            }
        };
    }

    /**
     * Validate cue configuration
     * @returns {boolean} True if cue is valid
     */
    isValid() {
        const validId = this.id && typeof this.id === 'string' && this.id.length > 0;
        const validTimestamp = typeof this.timestamp === 'number' && this.timestamp >= 0;
        const validPollId = this.pollId && typeof this.pollId === 'string' && this.pollId.length > 0;
        const validTolerance = typeof this.options.tolerance === 'number' && this.options.tolerance >= 0;

        return validId && validTimestamp && validPollId && validTolerance;
    }

    /**
     * Compare this cue with another cue for sorting
     * @param {TimecodeCue} other - Other cue to compare with
     * @returns {number} Comparison result (-1, 0, 1)
     */
    compareTo(other) {
        if (!(other instanceof TimecodeCue)) {
            throw new Error('Can only compare with another TimecodeCue');
        }

        // Primary sort by timestamp
        if (this.timestamp < other.timestamp) return -1;
        if (this.timestamp > other.timestamp) return 1;

        // Secondary sort by priority
        const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
        const thisPriority = priorityOrder[this.options.priority] || 2;
        const otherPriority = priorityOrder[other.options.priority] || 2;

        if (thisPriority > otherPriority) return -1;
        if (thisPriority < otherPriority) return 1;

        // Tertiary sort by ID
        return this.id.localeCompare(other.id);
    }

    /**
     * Create a copy of this cue with optional property overrides
     * @param {Object} overrides - Properties to override in the copy
     * @returns {TimecodeCue} New cue instance
     */
    clone(overrides = {}) {
        const newOptions = { ...this.options, ...overrides.options };

        return new TimecodeCue(
            overrides.id || `${this.id}-copy`,
            overrides.timestamp !== undefined ? overrides.timestamp : this.timestamp,
            overrides.pollId || this.pollId,
            newOptions
        );
    }

    /**
     * Export cue data for serialization
     * @returns {Object} Serializable cue data
     */
    toJSON() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            pollId: this.pollId,
            triggered: this.triggered,
            triggerCount: this.triggerCount,
            options: this.options,
            createdAt: this.createdAt
        };
    }

    /**
     * Create TimecodeCue from serialized data
     * @param {Object} data - Serialized cue data
     * @returns {TimecodeCue} New cue instance
     * @static
     */
    static fromJSON(data) {
        const cue = new TimecodeCue(data.id, data.timestamp, data.pollId, data.options);

        if (data.triggered) {
            cue.triggered = data.triggered;
        }

        if (data.triggerCount) {
            cue.triggerCount = data.triggerCount;
        }

        if (data.createdAt) {
            cue.createdAt = data.createdAt;
        }

        return cue;
    }

    /**
     * String representation of the cue
     * @returns {string} String representation
     */
    toString() {
        const status = this.triggered ? 'TRIGGERED' : 'PENDING';
        return `TimecodeCue[${this.id}@${this.timestamp}s->poll:${this.pollId}](${status})`;
    }

    /**
     * Update cue options
     * @param {Object} newOptions - New options to merge
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };

        if (this.options.debugMode) {
            console.log(`Cue options updated: ${this.id}`, this.options);
        }
    }

    /**
     * Get cue priority level
     * @returns {string} Priority level
     */
    getPriority() {
        return this.options.priority;
    }

    /**
     * Set cue priority level
     * @param {string} priority - Priority level ('low', 'normal', 'high')
     */
    setPriority(priority) {
        const validPriorities = ['low', 'normal', 'high'];
        if (validPriorities.includes(priority)) {
            this.options.priority = priority;

            if (this.options.debugMode) {
                console.log(`Cue priority set to ${priority}: ${this.id}`);
            }
        } else {
            console.warn(`Invalid priority: ${priority}. Valid options: ${validPriorities.join(', ')}`);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimecodeCue;
}