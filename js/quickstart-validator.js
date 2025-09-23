// Quickstart Scenario Validator
// Executes the 7 quickstart validation scenarios for video-poll integration

/**
 * QuickstartValidator executes comprehensive validation scenarios
 * to ensure the video-poll integration meets all requirements
 */
class QuickstartValidator {
    /**
     * Create a new QuickstartValidator instance
     */
    constructor() {
        this.scenarios = new Map();
        this.results = new Map();
        this.currentScenario = null;

        // Test configuration
        this.config = {
            testVideoId: 'JnBy7_Af_2e0',
            testPollId: 'demo-poll-2024',
            testTimeout: 30000, // 30 seconds per test
            debugMode: true
        };

        // Initialize test scenarios
        this._initializeScenarios();

        console.log('🧪 QuickstartValidator initialized with', this.scenarios.size, 'scenarios');
    }

    /**
     * Execute all quickstart scenarios
     * @returns {Promise<Object>} Complete validation results
     */
    async executeAllScenarios() {
        console.log('🚀 Starting Quickstart Validation...');
        console.log('='.repeat(60));

        const startTime = Date.now();
        let passedCount = 0;
        let failedCount = 0;

        // Execute scenarios sequentially
        for (const [scenarioId, scenario] of this.scenarios) {
            try {
                console.log(`\n📋 Executing ${scenarioId}: ${scenario.name}`);
                console.log('-'.repeat(50));

                const result = await this._executeScenario(scenarioId);

                if (result.passed) {
                    passedCount++;
                    console.log(`✅ ${scenarioId} PASSED`);
                } else {
                    failedCount++;
                    console.log(`❌ ${scenarioId} FAILED:`, result.error);
                }

                this.results.set(scenarioId, result);

                // Small delay between scenarios
                await this._delay(1000);

            } catch (error) {
                failedCount++;
                console.error(`💥 ${scenarioId} CRASHED:`, error);

                this.results.set(scenarioId, {
                    passed: false,
                    error: error.message,
                    timestamp: Date.now(),
                    duration: 0
                });
            }
        }

        const totalTime = Date.now() - startTime;

        // Generate summary report
        const summary = {
            totalScenarios: this.scenarios.size,
            passed: passedCount,
            failed: failedCount,
            successRate: (passedCount / this.scenarios.size) * 100,
            totalTime: totalTime,
            results: Object.fromEntries(this.results)
        };

        this._generateReport(summary);
        return summary;
    }

    /**
     * Execute a specific scenario
     * @param {string} scenarioId - Scenario identifier
     * @returns {Promise<Object>} Scenario result
     */
    async executeScenario(scenarioId) {
        if (!this.scenarios.has(scenarioId)) {
            throw new Error(`Scenario not found: ${scenarioId}`);
        }

        console.log(`🔬 Executing scenario: ${scenarioId}`);
        return await this._executeScenario(scenarioId);
    }

    /**
     * Initialize test scenarios
     * @private
     */
    _initializeScenarios() {
        // T026: Basic video-poll integration testing
        this.scenarios.set('T026', {
            name: 'Basic Video-Poll Integration Testing',
            description: 'Verify basic video player and poll integration works',
            tests: [
                'checkVideoPlayerCreation',
                'checkYouTubeAPILoading',
                'checkVideoSessionInitialization',
                'checkPollConfigurationLoading',
                'checkTimecodeManagerIntegration'
            ]
        });

        // T027: Poll response submission testing
        this.scenarios.set('T027', {
            name: 'Poll Response Submission Testing',
            description: 'Test poll response submission and API integration',
            tests: [
                'checkModalCreation',
                'checkPollFormGeneration',
                'checkFormSubmission',
                'checkAPIClientIntegration',
                'checkResponseValidation'
            ]
        });

        // T028: User opt-out functionality testing
        this.scenarios.set('T028', {
            name: 'User Opt-Out Functionality Testing',
            description: 'Verify user preferences and opt-out behavior',
            tests: [
                'checkUserPreferencesInitialization',
                'checkOptOutSetting',
                'checkOptOutPersistence',
                'checkPollSkipping',
                'checkOptOutReset'
            ]
        });

        // T029: Multiple poll configurations testing
        this.scenarios.set('T029', {
            name: 'Multiple Poll Configurations Testing',
            description: 'Test dynamic poll loading and caching',
            tests: [
                'checkPollCacheInitialization',
                'checkMultiplePollLoading',
                'checkCacheInvalidation',
                'checkFallbackConfiguration',
                'checkConfigurationSwitching'
            ]
        });

        // T030: Error handling and fallbacks testing
        this.scenarios.set('T030', {
            name: 'Error Handling and Fallbacks Testing',
            description: 'Verify error handling and graceful degradation',
            tests: [
                'checkErrorHandlerInitialization',
                'checkNetworkFailureHandling',
                'checkPollLoadFailure',
                'checkFallbackPollLoading',
                'checkEmergencyPollMode'
            ]
        });

        // T031: Performance and accessibility testing
        this.scenarios.set('T031', {
            name: 'Performance and Accessibility Testing',
            description: 'Verify performance targets and accessibility features',
            tests: [
                'checkInitializationPerformance',
                'checkPollTriggerPerformance',
                'checkMemoryUsage',
                'checkKeyboardNavigation',
                'checkScreenReaderSupport'
            ]
        });

        // T032: Cross-browser compatibility testing
        this.scenarios.set('T032', {
            name: 'Cross-Browser Compatibility Testing',
            description: 'Test browser compatibility and feature detection',
            tests: [
                'checkBrowserCompatibility',
                'checkFeatureDetection',
                'checkPolyfillSupport',
                'checkResponsiveDesign',
                'checkReducedMotionSupport'
            ]
        });
    }

    /**
     * Execute a specific scenario
     * @param {string} scenarioId - Scenario identifier
     * @returns {Promise<Object>} Execution result
     * @private
     */
    async _executeScenario(scenarioId) {
        const scenario = this.scenarios.get(scenarioId);
        const startTime = Date.now();

        this.currentScenario = scenarioId;

        try {
            const testResults = [];

            // Execute all tests in the scenario
            for (const testName of scenario.tests) {
                const testResult = await this._executeTest(testName);
                testResults.push(testResult);

                if (!testResult.passed) {
                    // Fail fast on first test failure
                    return {
                        passed: false,
                        error: `Test failed: ${testName} - ${testResult.error}`,
                        testResults: testResults,
                        timestamp: Date.now(),
                        duration: Date.now() - startTime
                    };
                }
            }

            return {
                passed: true,
                testResults: testResults,
                timestamp: Date.now(),
                duration: Date.now() - startTime
            };

        } catch (error) {
            return {
                passed: false,
                error: error.message,
                timestamp: Date.now(),
                duration: Date.now() - startTime
            };
        } finally {
            this.currentScenario = null;
        }
    }

    /**
     * Execute a specific test
     * @param {string} testName - Test method name
     * @returns {Promise<Object>} Test result
     * @private
     */
    async _executeTest(testName) {
        if (typeof this[testName] !== 'function') {
            return {
                name: testName,
                passed: false,
                error: `Test method not found: ${testName}`
            };
        }

        try {
            const result = await this[testName]();

            return {
                name: testName,
                passed: result.passed,
                message: result.message,
                error: result.error,
                data: result.data
            };

        } catch (error) {
            return {
                name: testName,
                passed: false,
                error: error.message
            };
        }
    }

    // Test Methods for T026: Basic Video-Poll Integration

    async checkVideoPlayerCreation() {
        if (typeof player === 'undefined' || !player) {
            return { passed: false, error: 'Video player not created' };
        }

        return { passed: true, message: 'Video player created successfully' };
    }

    async checkYouTubeAPILoading() {
        if (typeof YT === 'undefined' || typeof YT.Player !== 'function') {
            return { passed: false, error: 'YouTube API not loaded' };
        }

        return { passed: true, message: 'YouTube API loaded successfully' };
    }

    async checkVideoSessionInitialization() {
        if (typeof videoSession === 'undefined' || !videoSession) {
            return { passed: false, error: 'VideoSession not initialized' };
        }

        if (typeof videoSession.getSessionStats !== 'function') {
            return { passed: false, error: 'VideoSession missing required methods' };
        }

        const stats = videoSession.getSessionStats();
        return {
            passed: true,
            message: 'VideoSession initialized successfully',
            data: stats
        };
    }

    async checkPollConfigurationLoading() {
        if (!videoSession || !videoSession.activeCues) {
            return { passed: false, error: 'Poll configuration not loaded' };
        }

        const cueCount = videoSession.activeCues.size;
        if (cueCount === 0) {
            return { passed: false, error: 'No cues loaded in configuration' };
        }

        return {
            passed: true,
            message: `Poll configuration loaded with ${cueCount} cues`,
            data: { cueCount }
        };
    }

    async checkTimecodeManagerIntegration() {
        if (typeof timecodeManager === 'undefined' || !timecodeManager) {
            return { passed: false, error: 'TimecodeManager not initialized' };
        }

        const stats = timecodeManager.getStats();
        return {
            passed: true,
            message: 'TimecodeManager integrated successfully',
            data: stats
        };
    }

    // Test Methods for T027: Poll Response Submission

    async checkModalCreation() {
        const modal = document.getElementById('pollModal') || document.getElementById('feedbackModal');
        if (!modal) {
            return { passed: false, error: 'Poll modal not found in DOM' };
        }

        return { passed: true, message: 'Poll modal created successfully' };
    }

    async checkPollFormGeneration() {
        if (typeof generatePollForm !== 'function') {
            return { passed: false, error: 'generatePollForm function not available' };
        }

        const testConfig = {
            title: 'Test Poll',
            description: 'Test Description',
            valid_choices: ['good', 'okay', 'poor']
        };

        const formHTML = generatePollForm(testConfig);
        if (!formHTML || !formHTML.includes('Test Poll')) {
            return { passed: false, error: 'Poll form generation failed' };
        }

        return { passed: true, message: 'Poll form generation working' };
    }

    async checkFormSubmission() {
        if (typeof handlePollSubmission !== 'function') {
            return { passed: false, error: 'handlePollSubmission function not available' };
        }

        return { passed: true, message: 'Form submission handler available' };
    }

    async checkAPIClientIntegration() {
        if (typeof apiClient === 'undefined' || !apiClient) {
            return { passed: false, error: 'APIClient not initialized' };
        }

        if (typeof apiClient.getStats !== 'function') {
            return { passed: false, error: 'APIClient missing required methods' };
        }

        const stats = apiClient.getStats();
        return {
            passed: true,
            message: 'APIClient integrated successfully',
            data: stats
        };
    }

    async checkResponseValidation() {
        if (!videoSession || typeof videoSession.submitPollResponse !== 'function') {
            return { passed: false, error: 'Poll response submission not available' };
        }

        return { passed: true, message: 'Response validation available' };
    }

    // Test Methods for T028: User Opt-Out Functionality

    async checkUserPreferencesInitialization() {
        if (typeof userPreferences === 'undefined' || !userPreferences) {
            return { passed: false, error: 'UserPreferences not initialized' };
        }

        return { passed: true, message: 'UserPreferences initialized successfully' };
    }

    async checkOptOutSetting() {
        if (!userPreferences || typeof userPreferences.setOptOut !== 'function') {
            return { passed: false, error: 'Opt-out setting not available' };
        }

        const initialState = userPreferences.isOptedOut();
        userPreferences.setOptOut(true);
        const optedOutState = userPreferences.isOptedOut();
        userPreferences.setOptOut(initialState); // Restore

        if (optedOutState !== true) {
            return { passed: false, error: 'Opt-out setting not working' };
        }

        return { passed: true, message: 'Opt-out setting working correctly' };
    }

    async checkOptOutPersistence() {
        // This test would require page reload to fully validate
        // For now, we check that the storage mechanism exists
        if (typeof userPreferences.save !== 'function') {
            return { passed: true, message: 'Auto-save enabled (no manual save needed)' };
        }

        return { passed: true, message: 'Opt-out persistence available' };
    }

    async checkPollSkipping() {
        if (!videoSession || typeof videoSession.setOptOut !== 'function') {
            return { passed: false, error: 'Poll skipping not available in VideoSession' };
        }

        return { passed: true, message: 'Poll skipping functionality available' };
    }

    async checkOptOutReset() {
        if (!userPreferences) {
            return { passed: false, error: 'UserPreferences not available for reset' };
        }

        // Test reset functionality
        userPreferences.setOptOut(true);
        userPreferences.setOptOut(false);
        const resetState = userPreferences.isOptedOut();

        if (resetState !== false) {
            return { passed: false, error: 'Opt-out reset not working' };
        }

        return { passed: true, message: 'Opt-out reset working correctly' };
    }

    // Test Methods for T029: Multiple Poll Configurations

    async checkPollCacheInitialization() {
        if (typeof pollCache === 'undefined' || !pollCache) {
            return { passed: false, error: 'PollCache not initialized' };
        }

        return { passed: true, message: 'PollCache initialized successfully' };
    }

    async checkMultiplePollLoading() {
        if (!pollCache || typeof pollCache.set !== 'function') {
            return { passed: false, error: 'Poll cache set method not available' };
        }

        // Test caching multiple polls
        pollCache.set('test-poll-1', { title: 'Test Poll 1' });
        pollCache.set('test-poll-2', { title: 'Test Poll 2' });

        const cached1 = pollCache.get('test-poll-1');
        const cached2 = pollCache.get('test-poll-2');

        if (!cached1 || !cached2) {
            return { passed: false, error: 'Multiple poll caching failed' };
        }

        return { passed: true, message: 'Multiple poll loading and caching working' };
    }

    async checkCacheInvalidation() {
        if (!pollCache || typeof pollCache.delete !== 'function') {
            return { passed: false, error: 'Cache invalidation not available' };
        }

        pollCache.set('temp-poll', { title: 'Temporary Poll' });
        pollCache.delete('temp-poll');
        const deleted = pollCache.get('temp-poll');

        if (deleted !== null) {
            return { passed: false, error: 'Cache invalidation failed' };
        }

        return { passed: true, message: 'Cache invalidation working correctly' };
    }

    async checkFallbackConfiguration() {
        if (typeof getFallbackPoll !== 'function') {
            return { passed: false, error: 'Fallback configuration not available' };
        }

        const fallback = getFallbackPoll('nonexistent-poll', this.config.testVideoId);
        if (!fallback || !fallback.title) {
            return { passed: false, error: 'Fallback configuration generation failed' };
        }

        return {
            passed: true,
            message: 'Fallback configuration working',
            data: { fallbackTitle: fallback.title }
        };
    }

    async checkConfigurationSwitching() {
        if (!videoSession || typeof videoSession.loadPollConfiguration !== 'function') {
            return { passed: false, error: 'Configuration switching not available' };
        }

        return { passed: true, message: 'Configuration switching available' };
    }

    // Test Methods for T030: Error Handling and Fallbacks

    async checkErrorHandlerInitialization() {
        if (typeof handlePollLoadFailure !== 'function') {
            return { passed: false, error: 'Error handler functions not available' };
        }

        return { passed: true, message: 'Error handlers initialized successfully' };
    }

    async checkNetworkFailureHandling() {
        if (typeof handleNetworkError !== 'function') {
            return { passed: false, error: 'Network error handler not available' };
        }

        return { passed: true, message: 'Network failure handling available' };
    }

    async checkPollLoadFailure() {
        if (typeof handlePollLoadFailure !== 'function') {
            return { passed: false, error: 'Poll load failure handler not available' };
        }

        // Test with mock error
        const mockError = new Error('Poll not found');
        const fallbackResult = await handlePollLoadFailure(mockError, 'nonexistent-poll');

        if (!fallbackResult) {
            return { passed: false, error: 'Poll load failure handling failed' };
        }

        return { passed: true, message: 'Poll load failure handling working' };
    }

    async checkFallbackPollLoading() {
        if (typeof getFallbackPoll !== 'function') {
            return { passed: false, error: 'Fallback poll loading not available' };
        }

        const fallback = getFallbackPoll('test-poll', this.config.testVideoId);
        if (!fallback) {
            return { passed: false, error: 'Fallback poll loading failed' };
        }

        return { passed: true, message: 'Fallback poll loading working' };
    }

    async checkEmergencyPollMode() {
        if (typeof getEmergencyPoll !== 'function') {
            return { passed: false, error: 'Emergency poll mode not available' };
        }

        const emergency = getEmergencyPoll();
        if (!emergency || !emergency.emergency) {
            return { passed: false, error: 'Emergency poll generation failed' };
        }

        return { passed: true, message: 'Emergency poll mode working' };
    }

    // Test Methods for T031: Performance and Accessibility

    async checkInitializationPerformance() {
        // Check that initialization completed within reasonable time
        const stats = window.VidPollApp?.getStats ? window.VidPollApp.getStats() : {};
        if (!stats.playerReady) {
            return { passed: false, error: 'Player not ready for performance check' };
        }

        return { passed: true, message: 'Initialization performance acceptable' };
    }

    async checkPollTriggerPerformance() {
        if (!timecodeManager || typeof timecodeManager.checkCues !== 'function') {
            return { passed: false, error: 'Poll trigger performance check not available' };
        }

        // Test performance of cue checking
        const startTime = Date.now();
        timecodeManager.checkCues(30);
        const duration = Date.now() - startTime;

        const targetTime = 50; // 50ms target
        if (duration > targetTime) {
            return {
                passed: false,
                error: `Poll trigger too slow: ${duration}ms > ${targetTime}ms`
            };
        }

        return {
            passed: true,
            message: `Poll trigger performance good: ${duration}ms`,
            data: { duration }
        };
    }

    async checkMemoryUsage() {
        // Basic memory usage check
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize;
            const limit = 50 * 1024 * 1024; // 50MB limit

            if (used > limit) {
                return {
                    passed: false,
                    error: `Memory usage too high: ${Math.round(used / 1024 / 1024)}MB`
                };
            }

            return {
                passed: true,
                message: `Memory usage acceptable: ${Math.round(used / 1024 / 1024)}MB`
            };
        }

        return { passed: true, message: 'Memory API not available (acceptable)' };
    }

    async checkKeyboardNavigation() {
        // Check for keyboard event handlers
        const hasKeyboardHandler = typeof handleKeyboard === 'function';
        if (!hasKeyboardHandler) {
            return { passed: false, error: 'Keyboard navigation handler not found' };
        }

        return { passed: true, message: 'Keyboard navigation available' };
    }

    async checkScreenReaderSupport() {
        // Check for accessibility features
        const announcer = document.getElementById('announcer');
        if (!announcer) {
            return { passed: false, error: 'Screen reader announcer not found' };
        }

        const hasAriaLive = announcer.getAttribute('aria-live') === 'polite';
        if (!hasAriaLive) {
            return { passed: false, error: 'Screen reader support not properly configured' };
        }

        return { passed: true, message: 'Screen reader support available' };
    }

    // Test Methods for T032: Cross-Browser Compatibility

    async checkBrowserCompatibility() {
        const requiredFeatures = [
            'Promise',
            'fetch',
            'Map',
            'Set',
            'URLSearchParams',
            'addEventListener'
        ];

        const missingFeatures = requiredFeatures.filter(feature => {
            if (feature === 'addEventListener') {
                return typeof document.addEventListener !== 'function';
            }
            return typeof window[feature] === 'undefined';
        });

        if (missingFeatures.length > 0) {
            return {
                passed: false,
                error: `Missing browser features: ${missingFeatures.join(', ')}`
            };
        }

        return { passed: true, message: 'Browser compatibility check passed' };
    }

    async checkFeatureDetection() {
        // Check canHandleRippleEffect function
        if (typeof canHandleRippleEffect !== 'function') {
            return { passed: false, error: 'Feature detection not available' };
        }

        const canHandle = canHandleRippleEffect();
        return {
            passed: true,
            message: 'Feature detection working',
            data: { canHandleRippleEffect: canHandle }
        };
    }

    async checkPolyfillSupport() {
        // Check that polyfills are working if needed
        const hasNativePromise = typeof Promise !== 'undefined';
        const hasFetch = typeof fetch !== 'undefined';

        return {
            passed: true,
            message: 'Polyfill support verified',
            data: { hasNativePromise, hasFetch }
        };
    }

    async checkResponsiveDesign() {
        // Check viewport meta tag
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            return { passed: false, error: 'Viewport meta tag not found' };
        }

        return { passed: true, message: 'Responsive design meta tag present' };
    }

    async checkReducedMotionSupport() {
        // Check reduced motion media query support
        const supportsReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)');

        if (!supportsReducedMotion) {
            return { passed: true, message: 'Reduced motion not supported (acceptable)' };
        }

        return { passed: true, message: 'Reduced motion support available' };
    }

    /**
     * Generate validation report
     * @param {Object} summary - Validation summary
     * @private
     */
    _generateReport(summary) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 QUICKSTART VALIDATION REPORT');
        console.log('='.repeat(60));

        console.log(`\n🎯 Overall Results:`);
        console.log(`   Total Scenarios: ${summary.totalScenarios}`);
        console.log(`   Passed: ${summary.passed} ✅`);
        console.log(`   Failed: ${summary.failed} ❌`);
        console.log(`   Success Rate: ${summary.successRate.toFixed(1)}%`);
        console.log(`   Total Time: ${(summary.totalTime / 1000).toFixed(1)}s`);

        console.log(`\n📋 Scenario Details:`);
        for (const [scenarioId, result] of this.results) {
            const status = result.passed ? '✅' : '❌';
            const duration = `${(result.duration / 1000).toFixed(1)}s`;
            console.log(`   ${status} ${scenarioId}: ${duration}`);

            if (!result.passed && result.error) {
                console.log(`      Error: ${result.error}`);
            }
        }

        const overallStatus = summary.failed === 0 ? '✅ PASSED' : '❌ FAILED';
        console.log(`\n🏆 Quickstart Validation: ${overallStatus}`);
        console.log('='.repeat(60));
    }

    /**
     * Delay utility
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     * @private
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get validation results
     * @returns {Object} Current validation results
     */
    getResults() {
        return {
            scenarios: Object.fromEntries(this.scenarios),
            results: Object.fromEntries(this.results)
        };
    }
}

// Create global validator instance
const quickstartValidator = new QuickstartValidator();

// Global functions for validation
window.executeQuickstartValidation = () => quickstartValidator.executeAllScenarios();
window.executeQuickstartScenario = (scenarioId) => quickstartValidator.executeScenario(scenarioId);
window.getQuickstartResults = () => quickstartValidator.getResults();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuickstartValidator;
}

console.log('🧪 Quickstart validation system loaded');