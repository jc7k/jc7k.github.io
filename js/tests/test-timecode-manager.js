// TimecodeManager Contract Validation Tests
// This file validates the TimecodeManager class implementation against the contract specification

/**
 * Test TimecodeManager class contract compliance
 * Tests must validate ALL contract requirements from contracts/frontend-api.md
 */
function testTimecodeManagerContract() {
    console.log('🧪 Testing TimecodeManager Contract...');

    const testResults = {
        constructorTest: false,
        addCueTest: false,
        removeCueTest: false,
        checkCuesTest: false,
        clearTriggeredTest: false,
        propertiesTest: false,
        eventHandlingTest: false
    };

    try {
        // Test 1: Constructor creates proper instance
        console.log('  ✓ Testing TimecodeManager constructor...');
        const manager = new TimecodeManager({ tolerance: 0.5 });

        // Validate required properties exist
        const requiredProperties = [
            'cues', 'triggeredCues', 'options', 'eventListeners'
        ];

        let propertiesValid = true;
        requiredProperties.forEach(prop => {
            if (!(prop in manager)) {
                console.error(`    ❌ Missing required property: ${prop}`);
                propertiesValid = false;
            }
        });

        if (propertiesValid) {
            console.log('    ✅ All required properties present');
            testResults.propertiesTest = true;
        }

        // Test property types and initial values
        if (manager.cues instanceof Map &&
            manager.triggeredCues instanceof Set &&
            manager.options.tolerance === 0.5 &&
            manager.eventListeners instanceof Map) {

            console.log('    ✅ Constructor initializes properties correctly');
            testResults.constructorTest = true;
        } else {
            console.error('    ❌ Constructor property initialization failed');
        }

        // Test 2: addCue method
        console.log('  ✓ Testing addCue method...');
        if (typeof manager.addCue === 'function') {
            const cueId = 'test-cue-1';
            const timecodeCue = { id: cueId, timestamp: 30, pollId: 'test-poll' };

            manager.addCue(timecodeCue);

            if (manager.cues.has(cueId) && manager.cues.get(cueId) === timecodeCue) {
                console.log('    ✅ addCue method adds cues to Map');
                testResults.addCueTest = true;
            } else {
                console.error('    ❌ addCue does not properly manage Map');
            }
        } else {
            console.error('    ❌ addCue method missing');
        }

        // Test 3: removeCue method
        console.log('  ✓ Testing removeCue method...');
        if (typeof manager.removeCue === 'function') {
            const initialSize = manager.cues.size;
            manager.removeCue('test-cue-1');

            if (!manager.cues.has('test-cue-1') && manager.cues.size === initialSize - 1) {
                console.log('    ✅ removeCue method removes cues from Map');
                testResults.removeCueTest = true;
            } else {
                console.error('    ❌ removeCue does not properly manage Map');
            }
        } else {
            console.error('    ❌ removeCue method missing');
        }

        // Test 4: checkCues method
        console.log('  ✓ Testing checkCues method...');
        if (typeof manager.checkCues === 'function') {
            // Add test cue for checking
            manager.addCue({ id: 'test-cue-2', timestamp: 15, pollId: 'test-poll-2' });

            const result = manager.checkCues(15.2); // Within tolerance

            if (Array.isArray(result)) {
                console.log('    ✅ checkCues method returns array');
                testResults.checkCuesTest = true;
            } else {
                console.error('    ❌ checkCues does not return array');
            }
        } else {
            console.error('    ❌ checkCues method missing');
        }

        // Test 5: clearTriggered method
        console.log('  ✓ Testing clearTriggered method...');
        if (typeof manager.clearTriggered === 'function') {
            // Add some triggered cues first
            manager.triggeredCues.add('cue1');
            manager.triggeredCues.add('cue2');

            manager.clearTriggered();

            if (manager.triggeredCues.size === 0) {
                console.log('    ✅ clearTriggered method clears Set');
                testResults.clearTriggeredTest = true;
            } else {
                console.error('    ❌ clearTriggered does not clear Set');
            }
        } else {
            console.error('    ❌ clearTriggered method missing');
        }

        // Test 6: Event handling methods
        console.log('  ✓ Testing event handling...');
        if (typeof manager.addEventListener === 'function' &&
            typeof manager.removeEventListener === 'function' &&
            typeof manager.dispatchEvent === 'function') {

            console.log('    ✅ Event handling methods exist');
            testResults.eventHandlingTest = true;
        } else {
            console.error('    ❌ Event handling methods missing');
        }

    } catch (error) {
        console.error('  ❌ TimecodeManager contract validation failed:', error);
        return false;
    }

    // Summary
    const passedTests = Object.values(testResults).filter(result => result).length;
    const totalTests = Object.keys(testResults).length;

    console.log(`📊 TimecodeManager Contract: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('✅ TimecodeManager contract validation PASSED');
        return true;
    } else {
        console.error('❌ TimecodeManager contract validation FAILED');
        console.log('Failed tests:', Object.entries(testResults)
            .filter(([key, value]) => !value)
            .map(([key]) => key)
        );
        return false;
    }
}

/**
 * Run TimecodeManager contract tests
 * This function should be called after TimecodeManager class is loaded
 */
function runTimecodeManagerTests() {
    if (typeof TimecodeManager === 'undefined') {
        console.error('❌ TimecodeManager class not found. Load timecode-manager.js first.');
        return false;
    }

    return testTimecodeManagerContract();
}

// Auto-run tests if TimecodeManager is available
document.addEventListener('DOMContentLoaded', () => {
    // Delay to allow other scripts to load
    setTimeout(() => {
        if (typeof TimecodeManager !== 'undefined') {
            runTimecodeManagerTests();
        } else {
            console.warn('⚠️ TimecodeManager tests ready. Call runTimecodeManagerTests() after loading TimecodeManager class.');
        }
    }, 1000);
});

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testTimecodeManagerContract,
        runTimecodeManagerTests
    };
}