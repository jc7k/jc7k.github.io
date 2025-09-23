// Configuration Constants for Video-Poll Integration

// API Configuration - Use Railway backend for local testing
const API_BASE_URL = 'https://vid-poll-production.up.railway.app';  // Production Railway backend
// const API_BASE_URL = 'http://localhost:8000';  // Development (local testing)

// Video Configuration
const VIDEO_CONFIG = {
    // Default video settings
    DEFAULT_VIDEO_ID: 'f_N3PGvnVKg',  // User-requested video
    DEFAULT_POLL_ID: 'demo-poll-2024',

    // Timecode cue settings
    DEFAULT_CUES: [5, 15, 25, 35, 45, 55],  // Every 10 seconds for testing
    CUE_TOLERANCE: 0.5,  // Tolerance for cue triggering in seconds
    POLLING_INTERVAL: 300,  // Video time checking interval in milliseconds

    // Video player settings
    YOUTUBE_PLAYER_VARS: {
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        fs: 1
    }
};

// Poll Configuration
const POLL_CONFIG = {
    // Cache settings
    CACHE_DURATION: 300000,  // 5 minutes in milliseconds
    MAX_CACHE_SIZE: 50,  // Maximum number of cached poll configurations

    // Response settings
    RESPONSE_TIMEOUT: 10000,  // 10 seconds for API responses
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,  // Initial retry delay in milliseconds

    // Rate limiting
    MAX_REQUESTS_PER_MINUTE: 10,
    RATE_LIMIT_WINDOW: 60000,  // 1 minute in milliseconds

    // Validation
    MIN_POLL_ID_LENGTH: 1,
    MAX_POLL_ID_LENGTH: 100,
    MAX_COMMENT_LENGTH: 1000
};

// UI Configuration
const UI_CONFIG = {
    // Animation settings
    MODAL_FADE_DURATION: 1600,  // Modal fade animation duration
    RIPPLE_DURATION: 2000,  // Ripple effect duration
    TOAST_DURATION: 3000,  // Toast notification duration

    // Timing settings
    AUTO_RESUME_DELAY: 2000,  // Delay before auto-resuming video after poll
    DEBOUNCE_DELAY: 100,  // Debounce delay for rapid interactions

    // Accessibility
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)',
    FOCUS_TRAP_ENABLED: true,
    KEYBOARD_NAVIGATION: true
};

// Error Configuration
const ERROR_CONFIG = {
    // Error types
    TYPES: {
        NETWORK_ERROR: 'network_error',
        POLL_NOT_FOUND: 'poll_not_found',
        VALIDATION_ERROR: 'validation_error',
        RATE_LIMITED: 'rate_limited',
        VIDEO_API_ERROR: 'video_api_error',
        CACHE_ERROR: 'cache_error',
        TIMEOUT_ERROR: 'timeout_error'
    },

    // Error messages
    MESSAGES: {
        POLL_LOAD_FAILED: 'Unable to load poll configuration',
        SUBMISSION_FAILED: 'Failed to submit poll response',
        NETWORK_UNAVAILABLE: 'Network connection unavailable',
        RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait and try again.',
        INVALID_POLL_ID: 'Invalid poll identifier',
        VIDEO_LOAD_FAILED: 'Video player failed to load'
    },

    // Fallback behavior
    USE_FALLBACK_POLL: true,
    GRACEFUL_DEGRADATION: true
};

// Development and Debugging
const DEBUG_CONFIG = {
    // Logging levels
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    CONSOLE_LOGGING: true,
    PERFORMANCE_LOGGING: false,

    // Testing settings
    MOCK_API_RESPONSES: false,
    SIMULATE_NETWORK_DELAYS: false,
    TEST_MODE: false
};

// Feature Flags
const FEATURE_FLAGS = {
    // Core features
    DYNAMIC_POLLS: true,
    VIDEO_INTEGRATION: true,
    POLL_CACHING: true,
    USER_PREFERENCES: true,

    // Advanced features
    ANALYTICS_TRACKING: false,
    A_B_TESTING: false,
    OFFLINE_MODE: false,
    ADVANCED_ANIMATIONS: true,

    // Experimental features
    VOICE_COMMANDS: false,
    GESTURE_CONTROLS: false,
    MULTI_VIDEO_PLAYLISTS: false
};

// Performance Thresholds
const PERFORMANCE_CONFIG = {
    // Response time targets
    POLL_LOAD_TARGET: 200,  // milliseconds
    SUBMISSION_TARGET: 500,  // milliseconds
    VIDEO_INTEGRATION_TARGET: 100,  // milliseconds

    // Resource limits
    MAX_MEMORY_USAGE: 50 * 1024 * 1024,  // 50MB
    MAX_CACHE_MEMORY: 10 * 1024 * 1024,  // 10MB
    MAX_CONCURRENT_REQUESTS: 5,

    // Asset budgets
    MAX_TOTAL_BUNDLE_SIZE: 2 * 1024 * 1024,  // 2MB
    MAX_CRITICAL_CSS_SIZE: 50 * 1024,  // 50KB
    MAX_JAVASCRIPT_SIZE: 500 * 1024  // 500KB
};

// Session Management
const SESSION_CONFIG = {
    // Storage keys
    STORAGE_KEYS: {
        USER_PREFERENCES: 'pollPrefs',
        OPT_OUT_STATUS: 'pollOptOut',
        POLL_CACHE: 'pollCache',
        SESSION_ID: 'sessionId'
    },

    // Session settings
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,  // 24 hours
    CLEANUP_INTERVAL: 60 * 60 * 1000,  // 1 hour
    MAX_SESSION_DATA_SIZE: 1024 * 1024  // 1MB
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        VIDEO_CONFIG,
        POLL_CONFIG,
        UI_CONFIG,
        ERROR_CONFIG,
        DEBUG_CONFIG,
        FEATURE_FLAGS,
        PERFORMANCE_CONFIG,
        SESSION_CONFIG
    };
}

// Global configuration object for browser usage
window.VidPollConfig = {
    API_BASE_URL,
    VIDEO_CONFIG,
    POLL_CONFIG,
    UI_CONFIG,
    ERROR_CONFIG,
    DEBUG_CONFIG,
    FEATURE_FLAGS,
    PERFORMANCE_CONFIG,
    SESSION_CONFIG
};