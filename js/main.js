// Video-Poll Integration Main Controller
// Integrates VideoSession with YouTube player and dynamic poll loading

// Global state management
let player = null;
let videoSession = null;
let timecodeManager = null;
let userPreferences = null;
let apiClient = null;
let pollCache = null;

// Current state
let currentVideoId = null;
let currentPollId = null;
let isPlayerReady = false;
let pollingInterval = null;

// DOM elements
let modal = null;
let modalContent = null;
let rippleContainer = null;
let statusElement = null;
let toastElement = null;

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🎬 Initializing Video-Poll Integration...');

        // Initialize core components
        await initializeComponents();

        // Get configuration from URL parameters
        const config = getValidatedVideoPollingConfig();
        console.log('📋 Configuration loaded:', config);

        // Set current IDs
        currentVideoId = config.videoId;
        currentPollId = config.pollId;

        // Initialize DOM elements
        initializeDOMElements();

        // Load YouTube API if not already loaded
        console.log('🎬 Checking YouTube API status...');
        if (typeof YT === 'undefined') {
            console.log('📦 Loading YouTube API...');
            await loadYouTubeAPI();
        } else {
            console.log('✅ YouTube API already loaded, initializing player...');
            initializeVideoPlayer();
        }

        // Add page loaded class for animations
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);

        console.log('✅ Video-Poll Integration initialized successfully');

    } catch (error) {
        console.error('❌ Failed to initialize Video-Poll Integration:', error);
        showError(`Initialization failed: ${error.message}. Using fallback configuration.`);

        // Try fallback initialization
        initializeFallback();
    }
});

/**
 * Initialize core component classes
 */
async function initializeComponents() {
    // Initialize user preferences first
    userPreferences = new UserPreferences({
        debugMode: window.VidPollConfig?.DEBUG_CONFIG?.LOG_LEVEL === 'debug'
    });

    // Initialize API client
    apiClient = new APIClient({
        debugMode: userPreferences.getPreference('debugMode', false)
    });

    // Initialize poll cache
    pollCache = new PollCache({
        debugMode: userPreferences.getPreference('debugMode', false)
    });

    // Initialize timecode manager
    timecodeManager = new TimecodeManager({
        tolerance: window.VidPollConfig?.VIDEO_CONFIG?.CUE_TOLERANCE || 0.5,
        debugMode: userPreferences.getPreference('debugMode', false)
    });

    console.log('🔧 Core components initialized');
}

/**
 * Initialize DOM elements and event listeners
 */
function initializeDOMElements() {
    // Modal elements
    modal = document.getElementById('pollModal') || document.getElementById('feedbackModal');
    if (!modal) {
        createModalElements();
    }

    modalContent = modal?.querySelector('.modal-content') || modal?.querySelector('.card');
    rippleContainer = document.getElementById('rippleContainer');
    statusElement = document.getElementById('status');
    toastElement = document.getElementById('toast');

    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Add modal click handlers
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    console.log('🎭 DOM elements initialized');
}

/**
 * Create modal elements if they don't exist
 */
function createModalElements() {
    // Create modal structure
    modal = document.createElement('div');
    modal.id = 'pollModal';
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        inset: 0;
        display: none;
        place-items: center;
        background: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
        z-index: 9999;
        opacity: 0;
        transition: all 1.6s cubic-bezier(0.25, 0.1, 0.25, 1);
    `;

    const card = document.createElement('div');
    card.className = 'modal-content card';
    card.style.cssText = `
        background: white;
        padding: 2.5rem;
        max-width: 500px;
        width: 92%;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.4);
        border: 2px solid #d4af37;
        transform: scale(0.75) translateY(30px);
        transition: all 1.6s cubic-bezier(0.25, 0.1, 0.25, 1);
        opacity: 0;
        position: relative;
    `;

    card.innerHTML = `
        <div id="pollContent">
            <h2>Loading poll...</h2>
            <div id="status"></div>
        </div>
    `;

    modal.appendChild(card);
    document.body.appendChild(modal);

    modalContent = card;

    // Create ripple container if it doesn't exist
    if (!rippleContainer) {
        rippleContainer = document.createElement('div');
        rippleContainer.id = 'rippleContainer';
        rippleContainer.className = 'ripple-container';
        rippleContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(rippleContainer);
    }

    console.log('🏗️ Modal elements created');
}

/**
 * Load YouTube Iframe API
 */
function loadYouTubeAPI() {
    return new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }

        // Set global callback
        window.onYouTubeIframeAPIReady = () => {
            console.log('📺 YouTube API loaded');
            initializeVideoPlayer();
            resolve();
        };

        // Load API script
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onerror = () => reject(new Error('Failed to load YouTube API'));
        document.head.appendChild(script);

        // Timeout fallback
        setTimeout(() => {
            if (!window.YT) {
                reject(new Error('YouTube API load timeout'));
            }
        }, 10000);
    });
}

/**
 * Initialize YouTube player and video session
 */
function initializeVideoPlayer() {
    try {
        // Create video container if it doesn't exist
        let playerContainer = document.getElementById('yt-container') || document.getElementById('player');

        if (!playerContainer) {
            // Create video section
            const videoSection = document.createElement('section');
            videoSection.className = 'video-section';
            videoSection.innerHTML = `
                <div class="container">
                    <div class="video-container">
                        <div id="yt-container" style="width: 100%; aspect-ratio: 16/9;"></div>
                    </div>
                </div>
            `;

            // Insert after header or at beginning of body
            const header = document.querySelector('header');
            if (header) {
                header.insertAdjacentElement('afterend', videoSection);
            } else {
                document.body.insertBefore(videoSection, document.body.firstChild);
            }

            playerContainer = document.getElementById('yt-container');
        }

        // Initialize YouTube player with simplified configuration
        console.log('🎥 Creating YouTube player with video ID:', currentVideoId);
        console.log('🎥 Player container:', playerContainer);

        player = new YT.Player(playerContainer, {
            height: '390',
            width: '640',
            videoId: currentVideoId,
            playerVars: {
                autoplay: 1,
                rel: 0,
                modestbranding: 1,
                iv_load_policy: 3,
                fs: 1
            },
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError
            }
        });

        console.log(`🎥 YouTube player initialized with video: ${currentVideoId}`);

    } catch (error) {
        console.error('❌ Failed to initialize video player:', error);

        // Handle video player error
        if (typeof handleVideoPlayerError === 'function') {
            handleVideoPlayerError(error, { videoId: currentVideoId });
        }

        throw error;
    }
}

/**
 * Handle YouTube player ready event
 */
async function onPlayerReady() {
    try {
        isPlayerReady = true;
        console.log('🎬 YouTube player ready');

        // Initialize video session
        videoSession = new VideoSession(currentVideoId, currentPollId, {
            tolerance: window.VidPollConfig?.VIDEO_CONFIG?.CUE_TOLERANCE,
            pollingInterval: window.VidPollConfig?.VIDEO_CONFIG?.POLLING_INTERVAL,
            debugMode: userPreferences.getPreference('debugMode', false)
        });

        // Set up event listeners
        videoSession.addEventListener('cueTriggered', onCueTriggered);
        videoSession.addEventListener('pollConfigLoaded', onPollConfigLoaded);
        videoSession.addEventListener('responseSubmitted', onResponseSubmitted);
        videoSession.addEventListener('responseError', onResponseError);

        // Load poll configuration with fallback handling
        try {
            await videoSession.loadPollConfiguration();
        } catch (configError) {
            console.warn('⚠️ Poll configuration failed, using fallback:', configError);

            // Load fallback configuration
            if (typeof getFallbackPoll === 'function') {
                const fallbackConfig = getFallbackPoll(currentPollId, currentVideoId);
                if (fallbackConfig && videoSession._processPollConfiguration) {
                    videoSession._processPollConfiguration(fallbackConfig);
                }
            }
        }

        // Show opt-out status if user opted out
        if (userPreferences.isOptedOut()) {
            announceMessage("Feedback polls are disabled for this session");
        }

        console.log('✅ Video session initialized and ready');

    } catch (error) {
        console.error('❌ Failed to initialize video session:', error);
        showError('Video session initialization failed. Some features may not work.');
    }
}

/**
 * Handle YouTube player state changes
 */
function onPlayerStateChange(event) {
    try {
        const state = event.data;

        if (state === YT.PlayerState.PLAYING) {
            startVideoPolling();
        } else {
            stopVideoPolling();
        }

        // Update video session state
        if (videoSession && player) {
            const currentTime = player.getCurrentTime();
            const isPlaying = state === YT.PlayerState.PLAYING;
            videoSession.updatePlaybackState(currentTime, isPlaying);
        }

    } catch (error) {
        console.error('❌ Error handling player state change:', error);
    }
}

/**
 * Handle YouTube player errors
 */
function onPlayerError(event) {
    console.error('❌ YouTube player error:', event.data);

    // Error code meanings:
    // 2 - Invalid parameter
    // 5 - HTML5 player error
    // 100 - Video not found
    // 101/150 - Video not allowed in embedded players

    const errorMessages = {
        2: 'Invalid video parameter',
        5: 'HTML5 player error',
        100: 'Video not found or has been removed',
        101: 'Video cannot be played in embedded players',
        150: 'Video cannot be played in embedded players'
    };

    const message = errorMessages[event.data] || `Unknown error (${event.data})`;
    console.error(`❌ Video error: ${message}`);

    // Try to load fallback video
    if (event.data === 100 || event.data === 101 || event.data === 150) {
        console.log('🔄 Attempting to load fallback video...');
        loadFallbackVideo();
    }
}

/**
 * Load a fallback video when the primary video fails
 */
function loadFallbackVideo() {
    const fallbackVideoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
    console.log(`🔄 Loading fallback video: ${fallbackVideoId}`);

    if (player && player.loadVideoById) {
        player.loadVideoById(fallbackVideoId);
        currentVideoId = fallbackVideoId;
    }
}

/**
 * Start video time polling for cue detection
 */
function startVideoPolling() {
    if (pollingInterval || !player || !videoSession) {
        return;
    }

    const interval = window.VidPollConfig?.VIDEO_CONFIG?.POLLING_INTERVAL || 300;

    console.log('⏱️ Starting video polling');

    pollingInterval = setInterval(() => {
        try {
            if (!player || !videoSession) {
                stopVideoPolling();
                return;
            }

            const currentTime = player.getCurrentTime();

            // Check if any polls should be triggered
            if (videoSession.shouldTriggerPoll(currentTime)) {
                // Find which cues should trigger
                const triggeredCues = timecodeManager.checkCues(currentTime);

                triggeredCues.forEach(cueData => {
                    videoSession.markCueTriggered(cueData.id);
                });
            }

        } catch (error) {
            console.error('❌ Error in video polling:', error);
        }
    }, interval);
}

/**
 * Stop video time polling
 */
function stopVideoPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('⏹️ Video polling stopped');
    }
}

/**
 * Handle cue triggered event
 */
async function onCueTriggered(data) {
    try {
        console.log(`🎯 Cue triggered: ${data.cueId} at ${data.timestamp}s`);

        // Check if user opted out
        if (userPreferences.isOptedOut()) {
            console.log('⚠️ User opted out, skipping poll');
            return;
        }

        // Pause video
        if (player && player.pauseVideo) {
            player.pauseVideo();
        }

        // Show modal with poll
        await showModal(data);

    } catch (error) {
        console.error('❌ Error handling cue trigger:', error);
    }
}

/**
 * Handle poll configuration loaded event
 */
function onPollConfigLoaded(data) {
    console.log(`📊 Poll configuration loaded: ${data.cueCount} cues`);

    // Update timecode manager with cues from video session
    if (videoSession && videoSession.activeCues) {
        for (const [cueId, cue] of videoSession.activeCues) {
            timecodeManager.addCue(cue);
        }
    }
}

/**
 * Handle poll response submitted event
 */
function onResponseSubmitted(data) {
    console.log('✅ Poll response submitted successfully', data);
    showSuccessMessage();

    // Auto-resume video after delay
    setTimeout(() => {
        hideModal();
        if (player && player.playVideo) {
            player.playVideo();
        }
    }, window.VidPollConfig?.UI_CONFIG?.AUTO_RESUME_DELAY || 2000);
}

/**
 * Handle poll response error event
 */
function onResponseError(data) {
    console.error('❌ Poll response submission failed:', data.error);
    showError(`Failed to submit response: ${data.error.message}`);
}

/**
 * Show modal with poll content
 */
async function showModal(cueData) {
    try {
        // Show ripple effect first
        announceMessage(`Taking a moment for feedback at ${Math.round(cueData.timestamp)} seconds`);
        await showRippleEffect();

        // Load poll content dynamically
        await loadPollContent(cueData.cue?.pollId || currentPollId);

        // Show modal
        modal.style.display = 'grid';

        setTimeout(() => {
            modal.classList.add('show');
            if (modalContent) {
                modalContent.style.transform = 'scale(1) translateY(0)';
                modalContent.style.opacity = '1';
            }
        }, 100);

    } catch (error) {
        console.error('❌ Error showing modal:', error);
        showError('Failed to load poll content');
    }
}

/**
 * Hide modal
 */
function hideModal() {
    if (!modal) return;

    modal.classList.remove('show');

    if (modalContent) {
        modalContent.style.transform = 'scale(0.75) translateY(30px)';
        modalContent.style.opacity = '0';
    }

    setTimeout(() => {
        modal.style.display = 'none';
    }, 1600); // Match CSS transition duration
}

/**
 * Load poll content dynamically
 */
async function loadPollContent(pollId) {
    try {
        const pollContent = document.getElementById('pollContent');
        if (!pollContent) return;

        // Show loading state
        pollContent.innerHTML = `
            <h2>Loading poll...</h2>
            <div class="loading-spinner"></div>
        `;

        // Fetch poll configuration with error handling
        let pollConfig;
        try {
            pollConfig = await apiClient.fetchPollConfiguration(pollId);
        } catch (error) {
            // Handle poll loading failure with fallback
            if (typeof handlePollLoadFailure === 'function') {
                pollConfig = await handlePollLoadFailure(error, pollId);
            } else if (typeof getFallbackPoll === 'function') {
                pollConfig = getFallbackPoll(pollId, currentVideoId);
            }
        }

        if (!pollConfig) {
            throw new Error('No poll configuration received');
        }

        // Generate poll form HTML
        const formHTML = generatePollForm(pollConfig);
        pollContent.innerHTML = formHTML;

        // Add form submission handler
        const form = pollContent.querySelector('#dynamicPollForm');
        if (form) {
            form.addEventListener('submit', handlePollSubmission);
        }

        console.log(`📋 Poll content loaded for: ${pollId}`);

    } catch (error) {
        console.error('❌ Error loading poll content:', error);

        // Try emergency fallback poll
        let emergencyPoll = null;
        if (typeof getEmergencyPoll === 'function') {
            emergencyPoll = getEmergencyPoll();
        }

        const pollContent = document.getElementById('pollContent');
        if (pollContent) {
            if (emergencyPoll) {
                // Show emergency poll
                const formHTML = generatePollForm(emergencyPoll);
                pollContent.innerHTML = `
                    <div class="emergency-notice">⚠️ Using offline poll</div>
                    ${formHTML}
                `;

                const form = pollContent.querySelector('#dynamicPollForm');
                if (form) {
                    form.addEventListener('submit', handlePollSubmission);
                }
            } else {
                // Show error state
                pollContent.innerHTML = `
                    <h2>Poll Unavailable</h2>
                    <p>Unable to load poll content. Please try again later.</p>
                    <button onclick="hideModal(); if(player) player.playVideo();" class="submit-btn">
                        Continue Video
                    </button>
                `;
            }
        }
    }
}

/**
 * Generate poll form HTML from configuration
 */
function generatePollForm(pollConfig) {
    const title = pollConfig.title || 'Quick Feedback';
    const description = pollConfig.description || 'Your feedback helps us improve.';
    const choices = pollConfig.valid_choices || ['good', 'okay', 'needs-work'];

    let optionsHTML = '';
    choices.forEach((choice, index) => {
        const displayText = formatChoiceText(choice);
        optionsHTML += `
            <label class="option">
                <input type="radio" name="feedback" value="${choice}" required>
                <span class="option-text">${displayText}</span>
            </label>
        `;
    });

    return `
        <h2>${title}</h2>
        <p class="poll-description">${description}</p>
        <form id="dynamicPollForm">
            <div class="options">
                ${optionsHTML}
            </div>
            <div class="comment-section">
                <label for="comment">Additional comments (optional):</label>
                <textarea id="comment" name="comment" placeholder="Share any additional thoughts..."></textarea>
            </div>
            <div class="form-actions">
                <button type="button" onclick="hideModal(); if(player) player.playVideo();" class="secondary-btn">
                    Skip
                </button>
                <button type="submit" class="submit-btn">
                    Submit Feedback
                </button>
            </div>
            <div class="opt-out-section">
                <label class="opt-out-option">
                    <input type="checkbox" id="optOut" name="optOut">
                    <span>Don't show polls for this session</span>
                </label>
            </div>
        </form>
        <div id="pollStatus"></div>
    `;
}

/**
 * Handle poll form submission
 */
async function handlePollSubmission(event) {
    event.preventDefault();

    try {
        const form = event.target;
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.submit-btn');

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Check opt-out preference
        const optOut = formData.get('optOut') === 'on';
        if (optOut) {
            userPreferences.setOptOut(true);
            videoSession.setOptOut(true);
        }

        // Prepare response data
        const responseData = {
            pollId: currentPollId,
            selectedOption: formData.get('feedback'),
            comment: formData.get('comment') || null,
            videoTimestamp: player ? player.getCurrentTime() : null
        };

        // Submit through video session with error handling
        try {
            await videoSession.submitPollResponse(responseData);
        } catch (submissionError) {
            // Handle API failures
            if (typeof handleAPIFailure === 'function') {
                await handleAPIFailure(submissionError, '/api/polls/respond', responseData);
            }
            throw submissionError;
        }

    } catch (error) {
        console.error('❌ Poll submission failed:', error);

        // Show error in form
        const statusEl = document.getElementById('pollStatus');
        if (statusEl) {
            statusEl.innerHTML = `<div class="error">Failed to submit: ${error.message}</div>`;
        }

        // Re-enable submit button
        const submitBtn = event.target.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Feedback';
        }
    }
}

/**
 * Format choice text for display
 */
function formatChoiceText(choice) {
    const choiceMap = {
        'love-it': '🚀 Love it!',
        'good': '👍 Pretty good',
        'okay': '😐 It\'s okay',
        'needs-work': '👎 Needs work',
        'excellent': '⭐ Excellent',
        'very-good': '👍 Very good',
        'fair': '😐 Fair',
        'poor': '👎 Poor'
    };

    return choiceMap[choice] || choice.charAt(0).toUpperCase() + choice.slice(1).replace(/-/g, ' ');
}

/**
 * Show ripple effect
 */
function showRippleEffect() {
    return new Promise((resolve) => {
        if (!rippleContainer || !canHandleRippleEffect()) {
            resolve();
            return;
        }

        // Create ripple elements
        rippleContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.cssText = `
                position: absolute;
                border: 0.5px solid rgba(212, 175, 55, 0.8);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleExpand 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                animation-delay: ${i * 0.3}s;
                box-shadow: 0 0 0 0.5px rgba(244, 208, 63, 0.3);
            `;
            rippleContainer.appendChild(ripple);
        }

        rippleContainer.classList.add('active');
        rippleContainer.style.opacity = '1';

        setTimeout(() => {
            rippleContainer.classList.remove('active');
            rippleContainer.style.opacity = '0';
            resolve();
        }, 2000);
    });
}

/**
 * Check if device can handle ripple effects
 */
function canHandleRippleEffect() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }

    // Check for modern browser capabilities
    const hasModernBrowser = 'CSS' in window && 'supports' in window.CSS;
    const hasGoodPerformance = navigator.hardwareConcurrency >= 2 || navigator.deviceMemory >= 2;

    return hasModernBrowser && hasGoodPerformance;
}

/**
 * Show success message
 */
function showSuccessMessage() {
    const statusEl = document.getElementById('pollStatus') || document.getElementById('status');
    if (statusEl) {
        statusEl.innerHTML = `
            <div class="success">
                ✅ Thank you for your feedback! Resuming video...
            </div>
        `;
    }
}

/**
 * Show error message
 */
function showError(message) {
    console.error('UI Error:', message);

    // Try to show in modal first
    const statusEl = document.getElementById('pollStatus') || document.getElementById('status');
    if (statusEl) {
        statusEl.innerHTML = `<div class="error">${message}</div>`;
        return;
    }

    // Don't show alert for network-related errors, just log them
    if (message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('connection') ||
        message.toLowerCase().includes('initialization failed')) {
        console.warn('Network issue detected, continuing with fallback mode');
        return;
    }

    // Fallback to alert for critical errors only
    if (userPreferences?.getPreference('showAlerts', true)) {
        alert(message);
    }
}

/**
 * Announce message for accessibility
 */
function announceMessage(message) {
    console.log(`📢 ${message}`);

    // Create or update announcement element for screen readers
    let announcer = document.getElementById('announcer');
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(announcer);
    }

    announcer.textContent = message;
}

/**
 * Handle keyboard navigation
 */
function handleKeyboard(event) {
    // ESC to close modal
    if (event.key === 'Escape' && modal && modal.style.display !== 'none') {
        hideModal();
        if (player && player.playVideo) {
            player.playVideo();
        }
        return;
    }

    // Space to pause/play video (if modal not open)
    if (event.key === ' ' && modal && modal.style.display === 'none') {
        event.preventDefault();
        if (player) {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else if (state === YT.PlayerState.PAUSED) {
                player.playVideo();
            }
        }
        return;
    }

    // Enter on radio buttons to submit form
    if (event.key === 'Enter' && event.target.type === 'radio') {
        const form = event.target.closest('form');
        if (form) {
            const submitBtn = form.querySelector('.submit-btn');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.click();
            }
        }
    }
}

/**
 * Initialize fallback mode when main initialization fails
 */
function initializeFallback() {
    console.log('🔄 Initializing fallback mode...');

    // Create basic polling system without dynamic loading
    try {
        const config = getVideoPollingConfig();
        currentVideoId = config.videoId;
        currentPollId = config.pollId;

        // Try to initialize YouTube player with static configuration
        if (typeof YT !== 'undefined') {
            initializeVideoPlayer();
        } else {
            loadYouTubeAPI().catch(() => {
                showError('Video player unavailable. Please refresh the page.');
            });
        }

        console.log('✅ Fallback mode initialized');

    } catch (error) {
        console.error('❌ Fallback initialization failed:', error);
        showError('Application initialization failed. Please refresh the page.');
    }
}

// Global functions for backwards compatibility and external access
window.showModal = showModal;
window.hideModal = hideModal;
window.loadPollContent = loadPollContent;
window.submitPollResponse = async (responseData) => {
    if (videoSession) {
        return await videoSession.submitPollResponse(responseData);
    }
    throw new Error('Video session not initialized');
};

// Export for debugging
window.VidPollApp = {
    videoSession,
    timecodeManager,
    userPreferences,
    apiClient,
    pollCache,
    player,
    getStats: () => ({
        playerReady: isPlayerReady,
        videoId: currentVideoId,
        pollId: currentPollId,
        sessionStats: videoSession?.getSessionStats(),
        timecodeStats: timecodeManager?.getStats(),
        apiStats: apiClient?.getStats()
    })
};

console.log('📺 Video-Poll Integration Main Controller loaded');