// Backend API Integration Test
// This file validates the backend API integration functionality

/**
 * Test backend API integration contract compliance
 * Tests must validate API client behavior and error handling
 */
function testBackendAPIContract() {
    console.log('🧪 Testing Backend API Integration...');

    const testResults = {
        apiClientExistsTest: false,
        fetchPollConfigTest: false,
        submitResponseTest: false,
        errorHandlingTest: false,
        rateLimitingTest: false,
        cachingTest: false,
        networkFailureTest: false
    };

    try {
        // Test 1: API client exists and is properly configured
        console.log('  ✓ Testing API client configuration...');

        // Check if API configuration is available
        const hasAPIConfig = typeof window.VidPollConfig !== 'undefined' &&
                            window.VidPollConfig.API_BASE_URL;

        // Check if API client class/functions exist
        const hasAPIClient = typeof APIClient !== 'undefined' ||
                            typeof fetchPollConfiguration !== 'undefined' ||
                            typeof submitPollResponse !== 'undefined';

        if (hasAPIConfig && hasAPIClient) {
            console.log('    ✅ API client properly configured');
            testResults.apiClientExistsTest = true;
        } else {
            console.error('    ❌ API client configuration missing');
        }

        // Test 2: Fetch poll configuration
        console.log('  ✓ Testing poll configuration fetching...');
        if (typeof fetchPollConfiguration === 'function') {
            // Mock test - we can't make real API calls in contract tests
            const testPollId = 'test-poll-contract';

            try {
                // This should return a Promise
                const result = fetchPollConfiguration(testPollId);

                if (result && typeof result.then === 'function') {
                    console.log('    ✅ fetchPollConfiguration returns Promise');
                    testResults.fetchPollConfigTest = true;
                } else {
                    console.error('    ❌ fetchPollConfiguration does not return Promise');
                }
            } catch (error) {
                console.error('    ❌ fetchPollConfiguration threw error:', error);
            }
        } else {
            console.error('    ❌ fetchPollConfiguration function missing');
        }

        // Test 3: Submit poll response
        console.log('  ✓ Testing poll response submission...');
        if (typeof submitPollResponse === 'function') {
            const mockResponse = {
                pollId: 'test-poll',
                selectedOption: 'option1',
                comment: 'Test response',
                videoId: 'test-video',
                timestamp: 30
            };

            try {
                const result = submitPollResponse(mockResponse);

                if (result && typeof result.then === 'function') {
                    console.log('    ✅ submitPollResponse returns Promise');
                    testResults.submitResponseTest = true;
                } else {
                    console.error('    ❌ submitPollResponse does not return Promise');
                }
            } catch (error) {
                console.error('    ❌ submitPollResponse threw error:', error);
            }
        } else {
            console.error('    ❌ submitPollResponse function missing');
        }

        // Test 4: Error handling mechanisms
        console.log('  ✓ Testing error handling...');

        // Check if error handling utilities exist
        const hasErrorHandler = typeof handleAPIError === 'function' ||
                              typeof APIError !== 'undefined' ||
                              typeof window.VidPollConfig.ERROR_CONFIG !== 'undefined';

        if (hasErrorHandler) {
            console.log('    ✅ Error handling mechanisms available');
            testResults.errorHandlingTest = true;
        } else {
            console.error('    ❌ Error handling mechanisms missing');
        }

        // Test 5: Rate limiting protection
        console.log('  ✓ Testing rate limiting...');

        // Check if rate limiting configuration exists
        const hasRateLimit = window.VidPollConfig &&
                           window.VidPollConfig.POLL_CONFIG &&
                           window.VidPollConfig.POLL_CONFIG.MAX_REQUESTS_PER_MINUTE;

        if (hasRateLimit) {
            console.log('    ✅ Rate limiting configuration present');
            testResults.rateLimitingTest = true;
        } else {
            console.error('    ❌ Rate limiting configuration missing');
        }

        // Test 6: Caching mechanisms
        console.log('  ✓ Testing caching mechanisms...');

        // Check if caching is configured
        const hasCaching = typeof PollCache !== 'undefined' ||
                         typeof window.VidPollConfig.POLL_CONFIG.CACHE_DURATION !== 'undefined' ||
                         typeof getCachedPoll === 'function';

        if (hasCaching) {
            console.log('    ✅ Caching mechanisms available');
            testResults.cachingTest = true;
        } else {
            console.error('    ❌ Caching mechanisms missing');
        }

        // Test 7: Network failure handling
        console.log('  ✓ Testing network failure handling...');

        // Check if retry and fallback mechanisms exist
        const hasRetryConfig = window.VidPollConfig &&
                             window.VidPollConfig.POLL_CONFIG &&
                             window.VidPollConfig.POLL_CONFIG.RETRY_ATTEMPTS;

        const hasFallback = window.VidPollConfig &&
                          window.VidPollConfig.ERROR_CONFIG &&
                          window.VidPollConfig.ERROR_CONFIG.USE_FALLBACK_POLL;

        if (hasRetryConfig && hasFallback) {
            console.log('    ✅ Network failure handling configured');
            testResults.networkFailureTest = true;
        } else {
            console.error('    ❌ Network failure handling incomplete');
        }

    } catch (error) {
        console.error('  ❌ Backend API integration validation failed:', error);
        return false;
    }

    // Summary
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;

    console.log(`📊 Backend API Integration: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('✅ Backend API integration validation PASSED');
        return true;
    } else {
        console.error('❌ Backend API integration validation FAILED');
        console.log('Failed tests:', Object.entries(testResults)
            .filter(([key, value]) => !value)
            .map(([key]) => key)
        );
        return false;
    }
}

/**
 * Test API endpoint connectivity (optional - for integration testing)
 * This function makes actual API calls and should only be used in integration scenarios
 */
async function testAPIConnectivity() {
    console.log('🌐 Testing API Connectivity (Integration Test)...');

    if (!window.VidPollConfig || !window.VidPollConfig.API_BASE_URL) {
        console.error('❌ API configuration not available');
        return false;
    }

    const baseURL = window.VidPollConfig.API_BASE_URL;

    try {
        // Test health endpoint
        const healthResponse = await fetch(`${baseURL}/health`);

        if (healthResponse.ok) {
            console.log('✅ API health check passed');
            return true;
        } else {
            console.error('❌ API health check failed:', healthResponse.status);
            return false;
        }
    } catch (error) {
        console.error('❌ API connectivity test failed:', error);
        return false;
    }
}

/**
 * Run backend API integration tests
 * This function validates the API integration contract
 */
function runBackendAPITests() {
    return testBackendAPIContract();
}

/**
 * Run full API integration tests including connectivity
 * Use this for integration testing scenarios
 */
async function runFullAPITests() {
    const contractPassed = testBackendAPIContract();

    if (contractPassed) {
        console.log('🔄 Running connectivity tests...');
        const connectivityPassed = await testAPIConnectivity();
        return contractPassed && connectivityPassed;
    }

    return false;
}

// Auto-run contract tests when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Delay to allow configuration to load
    setTimeout(() => {
        runBackendAPITests();
    }, 1000);
});

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testBackendAPIContract,
        testAPIConnectivity,
        runBackendAPITests,
        runFullAPITests
    };
}