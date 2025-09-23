// API Client Implementation
// Handles all backend API communication with error handling and retry logic

/**
 * APIClient manages communication with the backend polling API
 * Provides methods for fetching poll configurations and submitting responses
 */
class APIClient {
    /**
     * Create a new APIClient instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            baseURL: options.baseURL || window.VidPollConfig?.API_BASE_URL || 'https://vid-poll-production.up.railway.app',
            timeout: options.timeout || window.VidPollConfig?.POLL_CONFIG?.RESPONSE_TIMEOUT || 10000,
            retryAttempts: options.retryAttempts || window.VidPollConfig?.POLL_CONFIG?.RETRY_ATTEMPTS || 3,
            retryDelay: options.retryDelay || window.VidPollConfig?.POLL_CONFIG?.RETRY_DELAY || 1000,
            debugMode: options.debugMode || false,
            rateLimitEnabled: options.rateLimitEnabled !== false
        };

        // Rate limiting
        this.rateLimiter = {
            requests: new Map(), // timestamp -> count
            windowSize: window.VidPollConfig?.POLL_CONFIG?.RATE_LIMIT_WINDOW || 60000, // 1 minute
            maxRequests: window.VidPollConfig?.POLL_CONFIG?.MAX_REQUESTS_PER_MINUTE || 10
        };

        // Request tracking
        this.activeRequests = new Map();
        this.requestCounter = 0;

        // Statistics
        this.stats = {
            requests: 0,
            successes: 0,
            failures: 0,
            retries: 0,
            rateLimited: 0,
            timeouts: 0
        };

        if (this.options.debugMode) {
            console.log('APIClient initialized with options:', this.options);
        }
    }

    /**
     * Fetch poll configuration from the API
     * @param {string} pollId - Poll identifier
     * @returns {Promise<Object>} Poll configuration data
     */
    async fetchPollConfiguration(pollId) {
        if (!pollId) {
            throw new Error('Poll ID is required');
        }

        const endpoint = `/api/polls/${encodeURIComponent(pollId)}`;

        try {
            const response = await this._makeRequest('GET', endpoint);

            if (this.options.debugMode) {
                console.log(`Poll configuration fetched: ${pollId}`, response);
            }

            return response;

        } catch (error) {
            console.error(`Failed to fetch poll configuration for ${pollId}:`, error);
            throw error;
        }
    }

    /**
     * Submit a poll response to the API
     * @param {Object} responseData - Poll response data
     * @returns {Promise<Object>} Submission result
     */
    async submitPollResponse(responseData) {
        if (!responseData || !responseData.pollId) {
            throw new Error('Response data with poll ID is required');
        }

        const endpoint = '/api/polls/respond';

        // Validate response data
        const validatedData = this._validateResponseData(responseData);

        try {
            const response = await this._makeRequest('POST', endpoint, validatedData);

            if (this.options.debugMode) {
                console.log('Poll response submitted:', responseData.pollId, response);
            }

            return response;

        } catch (error) {
            console.error('Failed to submit poll response:', error);
            throw error;
        }
    }

    /**
     * Fetch poll statistics
     * @param {string} pollId - Poll identifier
     * @returns {Promise<Object>} Poll statistics
     */
    async fetchPollStats(pollId) {
        if (!pollId) {
            throw new Error('Poll ID is required');
        }

        const endpoint = `/api/polls/${encodeURIComponent(pollId)}/stats`;

        try {
            const response = await this._makeRequest('GET', endpoint);

            if (this.options.debugMode) {
                console.log(`Poll stats fetched: ${pollId}`, response);
            }

            return response;

        } catch (error) {
            console.error(`Failed to fetch poll stats for ${pollId}:`, error);
            throw error;
        }
    }

    /**
     * Health check endpoint
     * @returns {Promise<Object>} Health status
     */
    async healthCheck() {
        try {
            const response = await this._makeRequest('GET', '/health');

            if (this.options.debugMode) {
                console.log('Health check completed:', response);
            }

            return response;

        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    /**
     * Make HTTP request with retry logic and error handling
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data (for POST/PUT)
     * @returns {Promise<Object>} Response data
     * @private
     */
    async _makeRequest(method, endpoint, data = null) {
        // Check rate limiting
        if (this.options.rateLimitEnabled && this._isRateLimited()) {
            this.stats.rateLimited++;
            throw new Error('Rate limit exceeded. Please wait and try again.');
        }

        const requestId = ++this.requestCounter;
        this.stats.requests++;

        let lastError;

        for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
            try {
                if (attempt > 1) {
                    this.stats.retries++;
                    await this._delay(this.options.retryDelay * attempt);
                }

                const response = await this._executeRequest(requestId, method, endpoint, data);
                this.stats.successes++;
                this._updateRateLimit();

                return response;

            } catch (error) {
                lastError = error;

                if (this.options.debugMode) {
                    console.log(`Request attempt ${attempt} failed:`, error.message);
                }

                // Don't retry certain errors
                if (this._shouldNotRetry(error)) {
                    break;
                }
            }
        }

        this.stats.failures++;
        throw lastError;
    }

    /**
     * Execute HTTP request
     * @param {number} requestId - Request identifier
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise<Object>} Response data
     * @private
     */
    async _executeRequest(requestId, method, endpoint, data) {
        const url = `${this.options.baseURL}${endpoint}`;

        const requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (data) {
            requestOptions.body = JSON.stringify(data);
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.options.timeout);

        requestOptions.signal = controller.signal;

        try {
            // Track active request
            this.activeRequests.set(requestId, { url, method, startTime: Date.now() });

            const response = await fetch(url, requestOptions);

            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const responseData = await response.json();

            if (this.options.debugMode) {
                console.log(`API ${method} ${endpoint}:`, responseData);
            }

            return responseData;

        } catch (error) {
            clearTimeout(timeoutId);
            this.activeRequests.delete(requestId);

            if (error.name === 'AbortError') {
                this.stats.timeouts++;
                throw new Error('Request timeout');
            }

            throw error;
        }
    }

    /**
     * Check if request should not be retried
     * @param {Error} error - Error to check
     * @returns {boolean} True if should not retry
     * @private
     */
    _shouldNotRetry(error) {
        const message = error.message.toLowerCase();

        // Don't retry client errors (4xx)
        if (message.includes('http 4')) {
            return true;
        }

        // Don't retry rate limiting errors
        if (message.includes('rate limit')) {
            return true;
        }

        // Don't retry validation errors
        if (message.includes('validation') || message.includes('invalid')) {
            return true;
        }

        return false;
    }

    /**
     * Check if rate limited
     * @returns {boolean} True if rate limited
     * @private
     */
    _isRateLimited() {
        const now = Date.now();
        const windowStart = now - this.rateLimiter.windowSize;

        // Clean old entries
        for (const [timestamp] of this.rateLimiter.requests) {
            if (timestamp < windowStart) {
                this.rateLimiter.requests.delete(timestamp);
            }
        }

        // Count requests in current window
        let requestCount = 0;
        for (const timestamp of this.rateLimiter.requests.keys()) {
            if (timestamp >= windowStart) {
                requestCount++;
            }
        }

        return requestCount >= this.rateLimiter.maxRequests;
    }

    /**
     * Update rate limiter
     * @private
     */
    _updateRateLimit() {
        this.rateLimiter.requests.set(Date.now(), true);
    }

    /**
     * Validate response data before submission
     * @param {Object} responseData - Response data to validate
     * @returns {Object} Validated response data
     * @private
     */
    _validateResponseData(responseData) {
        const validated = {
            pollId: responseData.pollId,
            selectedOption: responseData.selectedOption,
            timestamp: Date.now()
        };

        // Optional fields
        if (responseData.comment) {
            validated.comment = String(responseData.comment).slice(0, 1000); // Limit comment length
        }

        if (responseData.videoId) {
            validated.videoId = responseData.videoId;
        }

        if (responseData.videoTimestamp !== undefined) {
            validated.videoTimestamp = Number(responseData.videoTimestamp);
        }

        if (responseData.sessionId) {
            validated.sessionId = responseData.sessionId;
        }

        return validated;
    }

    /**
     * Delay helper for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get API client statistics
     * @returns {Object} Client statistics
     */
    getStats() {
        const successRate = this.stats.requests > 0 ?
            (this.stats.successes / this.stats.requests) * 100 : 0;

        return {
            ...this.stats,
            successRate: Math.round(successRate * 100) / 100,
            activeRequests: this.activeRequests.size,
            rateLimitWindow: this.rateLimiter.windowSize,
            rateLimitMax: this.rateLimiter.maxRequests
        };
    }

    /**
     * Get active requests
     * @returns {Array<Object>} Active request information
     */
    getActiveRequests() {
        return Array.from(this.activeRequests.entries()).map(([id, request]) => ({
            id,
            url: request.url,
            method: request.method,
            duration: Date.now() - request.startTime
        }));
    }

    /**
     * Cancel all active requests
     * @returns {number} Number of requests cancelled
     */
    cancelAllRequests() {
        const count = this.activeRequests.size;

        // Note: We can't actually cancel fetch requests after they've started
        // This just clears our tracking
        this.activeRequests.clear();

        if (this.options.debugMode) {
            console.log(`Cancelled tracking for ${count} active requests`);
        }

        return count;
    }

    /**
     * Update client configuration
     * @param {Object} newOptions - New configuration options
     */
    configure(newOptions) {
        this.options = { ...this.options, ...newOptions };

        // Update rate limiter if settings changed
        if (newOptions.rateLimitWindow) {
            this.rateLimiter.windowSize = newOptions.rateLimitWindow;
        }

        if (newOptions.maxRequestsPerMinute) {
            this.rateLimiter.maxRequests = newOptions.maxRequestsPerMinute;
        }

        if (this.options.debugMode) {
            console.log('APIClient reconfigured:', this.options);
        }
    }

    /**
     * Test API connectivity
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        const startTime = Date.now();

        try {
            await this.healthCheck();

            return {
                success: true,
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Global function wrappers for backwards compatibility
if (typeof window !== 'undefined') {
    // Create default API client instance
    const defaultAPIClient = new APIClient();

    /**
     * Fetch poll configuration (global function)
     * @param {string} pollId - Poll identifier
     * @returns {Promise<Object>} Poll configuration
     */
    window.fetchPollConfiguration = function(pollId) {
        return defaultAPIClient.fetchPollConfiguration(pollId);
    };

    /**
     * Submit poll response (global function)
     * @param {Object} responseData - Response data
     * @returns {Promise<Object>} Submission result
     */
    window.submitPollResponse = function(responseData) {
        return defaultAPIClient.submitPollResponse(responseData);
    };

    /**
     * Get API stats (global function)
     * @returns {Object} API statistics
     */
    window.getAPIStats = function() {
        return defaultAPIClient.getStats();
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}