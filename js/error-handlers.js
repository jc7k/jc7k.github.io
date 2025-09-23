// Error Handlers for Video-Poll Integration
// Provides graceful degradation for poll loading failures

/**
 * ErrorHandler manages application-wide error handling and graceful degradation
 * Provides fallback behavior when polls fail to load or network issues occur
 */
class ErrorHandler {
    /**
     * Create a new ErrorHandler instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            debugMode: options.debugMode || window.VidPollConfig?.DEBUG_CONFIG?.CONSOLE_LOGGING || false,
            showUserAlerts: options.showUserAlerts !== false,
            enableRetries: options.enableRetries !== false,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            gracefulDegradation: options.gracefulDegradation !== false
        };

        // Error tracking
        this.errorCounts = new Map();
        this.errorHistory = [];
        this.maxHistorySize = 100;

        // Retry tracking
        this.retryAttempts = new Map();

        // Error type definitions
        this.errorTypes = {
            NETWORK_ERROR: 'network_error',
            POLL_NOT_FOUND: 'poll_not_found',
            VALIDATION_ERROR: 'validation_error',
            RATE_LIMITED: 'rate_limited',
            VIDEO_API_ERROR: 'video_api_error',
            CACHE_ERROR: 'cache_error',
            TIMEOUT_ERROR: 'timeout_error',
            UNKNOWN_ERROR: 'unknown_error'
        };

        // Initialize error handlers
        this._setupGlobalErrorHandlers();

        if (this.options.debugMode) {
            console.log('🚨 ErrorHandler initialized with options:', this.options);
        }
    }

    /**
     * Handle poll loading failures
     * @param {Error} error - The error that occurred
     * @param {string} pollId - Poll ID that failed to load
     * @returns {Object} Fallback poll configuration or null
     */
    async handlePollLoadFailure(error, pollId) {
        const errorType = this._classifyError(error);
        this._recordError(errorType, error, { pollId });

        if (this.options.debugMode) {
            console.error(`🚨 Poll load failure: ${pollId}`, error);
        }

        // Try retry if enabled and appropriate
        if (this._shouldRetry(errorType, pollId)) {
            return await this._retryPollLoad(pollId);
        }

        // Provide fallback behavior
        return this._getFallbackPollConfig(pollId, errorType);
    }

    /**
     * Handle API request failures
     * @param {Error} error - The error that occurred
     * @param {string} endpoint - API endpoint that failed
     * @param {Object} options - Request options
     * @returns {Object} Error response or fallback data
     */
    async handleAPIFailure(error, endpoint, options = {}) {
        const errorType = this._classifyError(error);
        this._recordError(errorType, error, { endpoint, options });

        if (this.options.debugMode) {
            console.error(`🚨 API failure: ${endpoint}`, error);
        }

        // Handle specific error types
        switch (errorType) {
            case this.errorTypes.RATE_LIMITED:
                return this._handleRateLimitError(error, endpoint);

            case this.errorTypes.NETWORK_ERROR:
                return this._handleNetworkError(error, endpoint);

            case this.errorTypes.TIMEOUT_ERROR:
                return this._handleTimeoutError(error, endpoint);

            default:
                return this._handleGenericAPIError(error, endpoint);
        }
    }

    /**
     * Handle video player errors
     * @param {Error} error - The error that occurred
     * @param {Object} context - Video player context
     */
    handleVideoPlayerError(error, context = {}) {
        const errorType = this.errorTypes.VIDEO_API_ERROR;
        this._recordError(errorType, error, context);

        if (this.options.debugMode) {
            console.error('🚨 Video player error:', error, context);
        }

        // Show user-friendly message
        this._showUserMessage(
            'Video player encountered an issue. Polls may be affected.',
            'warning'
        );

        // Try to recover video player
        this._attemptVideoPlayerRecovery(context);
    }

    /**
     * Handle network connectivity issues
     * @param {Error} error - The network error
     * @param {Object} context - Additional context
     */
    handleNetworkError(error, context = {}) {
        const errorType = this.errorTypes.NETWORK_ERROR;
        this._recordError(errorType, error, context);

        if (this.options.debugMode) {
            console.error('🚨 Network error:', error, context);
        }

        // Check if we should enable offline mode
        if (this._isOffline()) {
            this._enableOfflineMode();
        } else {
            this._showUserMessage(
                'Network connection unavailable. Some features may not work.',
                'error'
            );
        }
    }

    /**
     * Handle validation errors
     * @param {Error} error - The validation error
     * @param {Object} data - Data that failed validation
     */
    handleValidationError(error, data = {}) {
        const errorType = this.errorTypes.VALIDATION_ERROR;
        this._recordError(errorType, error, { data });

        if (this.options.debugMode) {
            console.error('🚨 Validation error:', error, data);
        }

        // Show specific validation message
        const message = this._getValidationErrorMessage(error, data);
        this._showUserMessage(message, 'error');
    }

    /**
     * Classify error type based on error properties
     * @param {Error} error - Error to classify
     * @returns {string} Error type
     * @private
     */
    _classifyError(error) {
        const message = error.message?.toLowerCase() || '';

        if (message.includes('network') || message.includes('fetch')) {
            return this.errorTypes.NETWORK_ERROR;
        }

        if (message.includes('timeout')) {
            return this.errorTypes.TIMEOUT_ERROR;
        }

        if (message.includes('rate limit') || message.includes('429')) {
            return this.errorTypes.RATE_LIMITED;
        }

        if (message.includes('not found') || message.includes('404')) {
            return this.errorTypes.POLL_NOT_FOUND;
        }

        if (message.includes('validation') || message.includes('invalid')) {
            return this.errorTypes.VALIDATION_ERROR;
        }

        if (message.includes('youtube') || message.includes('video')) {
            return this.errorTypes.VIDEO_API_ERROR;
        }

        if (message.includes('cache')) {
            return this.errorTypes.CACHE_ERROR;
        }

        return this.errorTypes.UNKNOWN_ERROR;
    }

    /**
     * Record error for tracking and analysis
     * @param {string} errorType - Type of error
     * @param {Error} error - The error object
     * @param {Object} context - Additional context
     * @private
     */
    _recordError(errorType, error, context = {}) {
        // Update error counts
        const count = this.errorCounts.get(errorType) || 0;
        this.errorCounts.set(errorType, count + 1);

        // Add to history
        const errorRecord = {
            type: errorType,
            message: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };

        this.errorHistory.push(errorRecord);

        // Limit history size
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }

        // Report critical errors
        if (this._isCriticalError(errorType)) {
            this._reportCriticalError(errorRecord);
        }
    }

    /**
     * Check if error should be retried
     * @param {string} errorType - Type of error
     * @param {string} identifier - Unique identifier for retry tracking
     * @returns {boolean} True if should retry
     * @private
     */
    _shouldRetry(errorType, identifier) {
        if (!this.options.enableRetries) {
            return false;
        }

        // Don't retry validation or rate limit errors
        if (errorType === this.errorTypes.VALIDATION_ERROR ||
            errorType === this.errorTypes.RATE_LIMITED) {
            return false;
        }

        // Check retry count
        const attempts = this.retryAttempts.get(identifier) || 0;
        return attempts < this.options.maxRetries;
    }

    /**
     * Retry poll loading
     * @param {string} pollId - Poll ID to retry
     * @returns {Promise<Object>} Poll configuration or null
     * @private
     */
    async _retryPollLoad(pollId) {
        const attempts = this.retryAttempts.get(pollId) || 0;
        this.retryAttempts.set(pollId, attempts + 1);

        if (this.options.debugMode) {
            console.log(`🔄 Retrying poll load: ${pollId} (attempt ${attempts + 1})`);
        }

        // Wait before retry
        await this._delay(this.options.retryDelay * (attempts + 1));

        try {
            // Try to load poll again
            if (typeof fetchPollConfiguration === 'function') {
                return await fetchPollConfiguration(pollId);
            }
        } catch (error) {
            // If retry fails, handle as new error
            return this.handlePollLoadFailure(error, pollId);
        }

        return null;
    }

    /**
     * Get fallback poll configuration
     * @param {string} pollId - Poll ID that failed
     * @param {string} errorType - Type of error
     * @returns {Object} Fallback configuration
     * @private
     */
    _getFallbackPollConfig(pollId, errorType) {
        if (!this.options.gracefulDegradation) {
            return null;
        }

        // Load fallback configuration
        const fallbackConfig = {
            poll_id: pollId,
            title: 'Quick Feedback',
            description: 'Help us improve by sharing your thoughts.',
            valid_choices: ['excellent', 'good', 'okay', 'needs-work'],
            is_active: true,
            status: 'active',
            fallback: true,
            errorType: errorType,
            cues: this._getDefaultCues()
        };

        if (this.options.debugMode) {
            console.log(`📋 Using fallback config for: ${pollId}`, fallbackConfig);
        }

        return fallbackConfig;
    }

    /**
     * Get default cue configuration
     * @returns {Array} Default cues
     * @private
     */
    _getDefaultCues() {
        const defaultTimestamps = window.VidPollConfig?.VIDEO_CONFIG?.DEFAULT_CUES || [5, 15, 25, 35, 45, 55];

        return defaultTimestamps.map((timestamp, index) => ({
            id: `fallback-cue-${index}`,
            timestamp: timestamp,
            pollId: 'fallback-poll'
        }));
    }

    /**
     * Handle rate limit errors
     * @param {Error} error - Rate limit error
     * @param {string} endpoint - Affected endpoint
     * @returns {Object} Rate limit response
     * @private
     */
    _handleRateLimitError(error, endpoint) {
        this._showUserMessage(
            'Too many requests. Please wait a moment before trying again.',
            'warning'
        );

        return {
            error: true,
            type: 'rate_limited',
            message: 'Rate limit exceeded',
            retryAfter: 60000 // 1 minute
        };
    }

    /**
     * Handle network errors
     * @param {Error} error - Network error
     * @param {string} endpoint - Affected endpoint
     * @returns {Object} Network error response
     * @private
     */
    _handleNetworkError(error, endpoint) {
        this._showUserMessage(
            'Connection issue detected. Trying to reconnect...',
            'warning'
        );

        return {
            error: true,
            type: 'network_error',
            message: 'Network unavailable',
            offline: this._isOffline()
        };
    }

    /**
     * Handle timeout errors
     * @param {Error} error - Timeout error
     * @param {string} endpoint - Affected endpoint
     * @returns {Object} Timeout error response
     * @private
     */
    _handleTimeoutError(error, endpoint) {
        this._showUserMessage(
            'Request timed out. Please check your connection.',
            'warning'
        );

        return {
            error: true,
            type: 'timeout_error',
            message: 'Request timeout'
        };
    }

    /**
     * Handle generic API errors
     * @param {Error} error - Generic error
     * @param {string} endpoint - Affected endpoint
     * @returns {Object} Generic error response
     * @private
     */
    _handleGenericAPIError(error, endpoint) {
        this._showUserMessage(
            'Service temporarily unavailable. Please try again later.',
            'error'
        );

        return {
            error: true,
            type: 'api_error',
            message: error.message || 'Unknown API error'
        };
    }

    /**
     * Attempt video player recovery
     * @param {Object} context - Video player context
     * @private
     */
    _attemptVideoPlayerRecovery(context) {
        // Try to reinitialize video player after delay
        setTimeout(() => {
            if (typeof initializeVideoPlayer === 'function') {
                try {
                    initializeVideoPlayer();
                    this._showUserMessage('Video player recovered.', 'success');
                } catch (error) {
                    if (this.options.debugMode) {
                        console.error('🚨 Video player recovery failed:', error);
                    }
                }
            }
        }, 3000);
    }

    /**
     * Check if device is offline
     * @returns {boolean} True if offline
     * @private
     */
    _isOffline() {
        return !navigator.onLine;
    }

    /**
     * Enable offline mode
     * @private
     */
    _enableOfflineMode() {
        this._showUserMessage(
            'Working in offline mode. Some features may be limited.',
            'info'
        );

        // Set offline flag
        if (typeof window !== 'undefined') {
            window.VidPollOfflineMode = true;
        }
    }

    /**
     * Get validation error message
     * @param {Error} error - Validation error
     * @param {Object} data - Invalid data
     * @returns {string} User-friendly message
     * @private
     */
    _getValidationErrorMessage(error, data) {
        const message = error.message?.toLowerCase() || '';

        if (message.includes('poll id')) {
            return 'Invalid poll configuration. Using default poll.';
        }

        if (message.includes('video id')) {
            return 'Invalid video ID. Please check the URL.';
        }

        return 'Invalid data provided. Please check your input.';
    }

    /**
     * Show message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type (error, warning, info, success)
     * @private
     */
    _showUserMessage(message, type = 'info') {
        if (!this.options.showUserAlerts) {
            return;
        }

        // Try to show in UI first
        if (typeof showError === 'function' && type === 'error') {
            showError(message);
            return;
        }

        if (typeof announceMessage === 'function') {
            announceMessage(message);
            return;
        }

        // Fallback to console
        const prefix = {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        }[type] || 'ℹ️';

        console.log(`${prefix} ${message}`);
    }

    /**
     * Check if error is critical
     * @param {string} errorType - Error type
     * @returns {boolean} True if critical
     * @private
     */
    _isCriticalError(errorType) {
        const criticalErrors = [
            this.errorTypes.VIDEO_API_ERROR
        ];

        return criticalErrors.includes(errorType);
    }

    /**
     * Report critical error
     * @param {Object} errorRecord - Error record
     * @private
     */
    _reportCriticalError(errorRecord) {
        // In a real application, this would send to monitoring service
        if (this.options.debugMode) {
            console.error('🚨 CRITICAL ERROR:', errorRecord);
        }
    }

    /**
     * Setup global error handlers
     * @private
     */
    _setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleNetworkError(new Error(event.reason), { type: 'unhandled_rejection' });
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            const error = new Error(event.message);
            error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
            this._recordError(this.errorTypes.UNKNOWN_ERROR, error, {
                type: 'global_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
    }

    /**
     * Delay utility for retries
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            errorCounts: Object.fromEntries(this.errorCounts),
            totalErrors: this.errorHistory.length,
            recentErrors: this.errorHistory.slice(-10),
            retryAttempts: Object.fromEntries(this.retryAttempts)
        };
    }

    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorHistory = [];
        this.errorCounts.clear();
        this.retryAttempts.clear();

        if (this.options.debugMode) {
            console.log('🧹 Error history cleared');
        }
    }
}

// Create global error handler instance
const globalErrorHandler = new ErrorHandler({
    debugMode: window.VidPollConfig?.DEBUG_CONFIG?.CONSOLE_LOGGING || false,
    gracefulDegradation: window.VidPollConfig?.ERROR_CONFIG?.GRACEFUL_DEGRADATION !== false
});

// Global error handling functions
window.handlePollLoadFailure = (error, pollId) => globalErrorHandler.handlePollLoadFailure(error, pollId);
window.handleAPIFailure = (error, endpoint, options) => globalErrorHandler.handleAPIFailure(error, endpoint, options);
window.handleVideoPlayerError = (error, context) => globalErrorHandler.handleVideoPlayerError(error, context);
window.handleNetworkError = (error, context) => globalErrorHandler.handleNetworkError(error, context);
window.handleValidationError = (error, data) => globalErrorHandler.handleValidationError(error, data);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}

console.log('🚨 Error handling system loaded');