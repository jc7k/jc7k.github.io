// VideoSession Contract Validation Tests
// This file validates the VideoSession class implementation against the contract specification

/**
 * Test VideoSession class contract compliance
 * Tests must validate ALL contract requirements from contracts/frontend-api.md
 */
function testVideoSessionContract() {
    console.log('🧪 Testing VideoSession Contract...');

    const testResults = {
        constructorTest: false,
        loadPollConfigurationTest: false,
        shouldTriggerPollTest: false,
        markCueTriggeredTest: false,
        submitPollResponseTest: false,
        propertiesTest: false,
        stateManagementTest: false
    };

    try {
        // Test 1: Constructor creates proper instance
        console.log('  ✓ Testing VideoSession constructor...');
        const session = new VideoSession('test-video', 'test-poll', { tolerance: 1.0 });

        // Validate required properties exist
        const requiredProperties = [
            'videoId', 'pollId', 'currentTime', 'triggeredCues',
            'isOptedOut', 'pollCache', 'options'
        ];

        let propertiesValid = true;
        requiredProperties.forEach(prop => {
            if (!(prop in session)) {
                console.error(`    ❌ Missing required property: ${prop}`);
                propertiesValid = false;
            }
        });

        if (propertiesValid) {
            console.log('    ✅ All required properties present');
            testResults.propertiesTest = true;
        }

        // Test property types and initial values
        if (session.videoId === 'test-video' &&
            session.pollId === 'test-poll' &&
            session.currentTime === 0 &&
            session.triggeredCues instanceof Set &&
            session.isOptedOut === false &&
            session.pollCache instanceof Map &&
            session.options.tolerance === 1.0) {

            console.log('    ✅ Constructor initializes properties correctly');
            testResults.constructorTest = true;
        } else {
            console.error('    ❌ Constructor property initialization failed');
        }

        // Test 2: loadPollConfiguration method
        console.log('  ✓ Testing loadPollConfiguration method...');
        if (typeof session.loadPollConfiguration === 'function') {
            console.log('    ✅ loadPollConfiguration method exists');
            testResults.loadPollConfigurationTest = true;
        } else {
            console.error('    ❌ loadPollConfiguration method missing');
        }

        // Test 3: shouldTriggerPoll method
        console.log('  ✓ Testing shouldTriggerPoll method...');
        if (typeof session.shouldTriggerPoll === 'function') {
            // Test with various states
            const result1 = session.shouldTriggerPoll(5);
            const result2 = session.shouldTriggerPoll(10);

            if (typeof result1 === 'boolean' && typeof result2 === 'boolean') {
                console.log('    ✅ shouldTriggerPoll method returns boolean');
                testResults.shouldTriggerPollTest = true;
            } else {
                console.error('    ❌ shouldTriggerPoll does not return boolean');
            }
        } else {
            console.error('    ❌ shouldTriggerPoll method missing');
        }

        // Test 4: markCueTriggered method
        console.log('  ✓ Testing markCueTriggered method...');
        if (typeof session.markCueTriggered === 'function') {
            const initialSize = session.triggeredCues.size;
            session.markCueTriggered(15);

            if (session.triggeredCues.has(15) && session.triggeredCues.size === initialSize + 1) {
                console.log('    ✅ markCueTriggered adds to triggeredCues Set');
                testResults.markCueTriggeredTest = true;
            } else {
                console.error('    ❌ markCueTriggered does not properly manage Set');
            }
        } else {
            console.error('    ❌ markCueTriggered method missing');
        }

        // Test 5: submitPollResponse method
        console.log('  ✓ Testing submitPollResponse method...');
        if (typeof session.submitPollResponse === 'function') {
            console.log('    ✅ submitPollResponse method exists');
            testResults.submitPollResponseTest = true;
        } else {
            console.error('    ❌ submitPollResponse method missing');
        }

        // Test 6: State management behavior
        console.log('  ✓ Testing state management...');
        session.isOptedOut = true;
        session.currentTime = 30;

        if (session.isOptedOut === true && session.currentTime === 30) {
            console.log('    ✅ State properties are mutable');
            testResults.stateManagementTest = true;
        } else {
            console.error('    ❌ State management failed');
        }

    } catch (error) {
        console.error('  ❌ VideoSession contract validation failed:', error);
        return false;
    }

    // Summary
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;

    console.log(`📊 VideoSession Contract: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('✅ VideoSession contract validation PASSED');
        return true;
    } else {
        console.error('❌ VideoSession contract validation FAILED');
        console.log('Failed tests:', Object.entries(testResults)
            .filter(([key, value]) => !value)
            .map(([key]) => key)
        );
        return false;
    }
}

/**
 * Run VideoSession contract tests
 * This function should be called after VideoSession class is loaded
 */
function runVideoSessionTests() {
    if (typeof VideoSession === 'undefined') {
        console.error('❌ VideoSession class not found. Load video-session.js first.');
        return false;
    }

    return testVideoSessionContract();
}

// Auto-run tests if VideoSession is available
document.addEventListener('DOMContentLoaded', () => {
    // Delay to allow other scripts to load
    setTimeout(() => {
        if (typeof VideoSession !== 'undefined') {
            runVideoSessionTests();
        } else {
            console.warn('⚠️ VideoSession tests ready. Call runVideoSessionTests() after loading VideoSession class.');
        }
    }, 1000);
});

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testVideoSessionContract,
        runVideoSessionTests
    };
}