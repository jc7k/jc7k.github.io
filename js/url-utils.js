// URL Parameter Utility Functions for Video-Poll Integration

/**
 * Extract URL parameters for video and poll configuration
 * @returns {Object} Configuration object with videoId and pollId
 */
function getVideoPollingConfig() {
    const urlParams = new URLSearchParams(window.location.search);

    return {
        videoId: urlParams.get('video') || 'JnBy7_Af_2e0', // Default video
        pollId: urlParams.get('poll') || 'demo-poll-2024', // Default poll
        autoplay: urlParams.get('autoplay') === 'true',
        startTime: parseInt(urlParams.get('t')) || 0 // Start time in seconds
    };
}

/**
 * Get poll ID from URL parameters or default
 * @returns {string} Poll identifier
 */
function getPollId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('poll') || 'demo-poll-2024';
}

/**
 * Get video ID from URL parameters or default
 * @returns {string} YouTube video identifier
 */
function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('video') || 'JnBy7_Af_2e0';
}

/**
 * Build URL with video and poll parameters
 * @param {string} videoId - YouTube video ID
 * @param {string} pollId - Poll configuration ID
 * @param {Object} options - Additional URL parameters
 * @returns {string} Complete URL with parameters
 */
function buildVideoPollingURL(videoId, pollId, options = {}) {
    const url = new URL(window.location.origin + window.location.pathname);

    if (videoId) url.searchParams.set('video', videoId);
    if (pollId) url.searchParams.set('poll', pollId);

    // Add optional parameters
    if (options.autoplay) url.searchParams.set('autoplay', 'true');
    if (options.startTime) url.searchParams.set('t', options.startTime.toString());

    return url.toString();
}

/**
 * Update current URL with new parameters without page reload
 * @param {string} videoId - YouTube video ID
 * @param {string} pollId - Poll configuration ID
 */
function updateURLParameters(videoId, pollId) {
    const newURL = buildVideoPollingURL(videoId, pollId);
    window.history.replaceState({}, '', newURL);
}

/**
 * Validate video ID format (YouTube video ID pattern)
 * @param {string} videoId - Video ID to validate
 * @returns {boolean} True if valid YouTube video ID format
 */
function isValidVideoId(videoId) {
    const youtubeVideoPattern = /^[a-zA-Z0-9_-]{11}$/;
    return youtubeVideoPattern.test(videoId);
}

/**
 * Validate poll ID format (alphanumeric with hyphens/underscores)
 * @param {string} pollId - Poll ID to validate
 * @returns {boolean} True if valid poll ID format
 */
function isValidPollId(pollId) {
    const pollIdPattern = /^[a-zA-Z0-9_-]+$/;
    return pollIdPattern.test(pollId) && pollId.length >= 1 && pollId.length <= 100;
}

/**
 * Parse timecode parameter (supports formats like 30, 1m30s, 1h30m)
 * @param {string} timeParam - Time parameter from URL
 * @returns {number} Time in seconds
 */
function parseTimeParameter(timeParam) {
    if (!timeParam) return 0;

    // Simple number (seconds)
    if (/^\d+$/.test(timeParam)) {
        return parseInt(timeParam);
    }

    // Complex format: 1h30m45s
    const timeRegex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/;
    const matches = timeParam.match(timeRegex);

    if (matches) {
        const hours = parseInt(matches[1]) || 0;
        const minutes = parseInt(matches[2]) || 0;
        const seconds = parseInt(matches[3]) || 0;

        return hours * 3600 + minutes * 60 + seconds;
    }

    return 0;
}

/**
 * Get configuration from URL with validation and defaults
 * @returns {Object} Validated configuration object
 */
function getValidatedVideoPollingConfig() {
    const config = getVideoPollingConfig();

    return {
        videoId: isValidVideoId(config.videoId) ? config.videoId : 'JnBy7_Af_2e0',
        pollId: isValidPollId(config.pollId) ? config.pollId : 'demo-poll-2024',
        autoplay: config.autoplay,
        startTime: Math.max(0, config.startTime)
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getVideoPollingConfig,
        getPollId,
        getVideoId,
        buildVideoPollingURL,
        updateURLParameters,
        isValidVideoId,
        isValidPollId,
        parseTimeParameter,
        getValidatedVideoPollingConfig
    };
}