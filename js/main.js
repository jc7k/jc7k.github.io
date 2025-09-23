// Pulse Poll Frontend JavaScript

// API Configuration
const API_BASE_URL = 'https://vid-poll-production.up.railway.app';  // Production
// const API_BASE_URL = 'http://localhost:8000';  // Development

// Global poll configuration
let pollConfig = null;

// Form elements
const pollForm = document.getElementById('pollForm');
const thankYouSection = document.getElementById('thankYou');
const errorSection = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Generate a simple client fingerprint
function generateClientFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Client fingerprint', 2, 2);

    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL()
    ].join('|');

    return btoa(fingerprint).substring(0, 32);
}

// Get poll ID from URL parameters or default
function getPollId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('poll') || 'demo-poll-2024';
}

// Load poll configuration from API
async function loadPollConfig(pollId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}/config`);

        if (response.ok) {
            const config = await response.json();
            pollConfig = config;
            return config;
        } else if (response.status === 404) {
            throw new Error(`Poll '${pollId}' not found`);
        } else {
            throw new Error('Failed to load poll configuration');
        }
    } catch (error) {
        console.error('Error loading poll config:', error);
        throw error;
    }
}

// Update page content with poll configuration
function updatePageContent(config) {
    // Update page title
    document.title = `${config.title} - Pulse Poll`;

    // Update poll question
    const questionElement = document.querySelector('.poll-card h2');
    if (questionElement) {
        questionElement.textContent = config.title;
    }

    // Update description
    const descriptionElement = document.querySelector('.poll-description');
    if (descriptionElement) {
        descriptionElement.textContent = config.description || 'Your feedback helps us improve our services.';
    }

    // Update poll options
    const optionsContainer = document.querySelector('.options');
    if (optionsContainer && config.valid_choices) {
        optionsContainer.innerHTML = '';

        // Create option labels based on valid choices
        config.valid_choices.forEach((choice, index) => {
            const label = document.createElement('label');
            label.className = 'option';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'feedback';
            input.value = choice;

            const span = document.createElement('span');
            span.className = 'option-text';

            // Use choice as display text (you could enhance this with a mapping)
            const displayText = formatChoiceText(choice);
            span.textContent = displayText;

            label.appendChild(input);
            label.appendChild(span);
            optionsContainer.appendChild(label);
        });
    }

    // Check if poll is active
    if (!config.is_active) {
        showError(`This poll is currently ${config.status}. Please check back later.`);
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Poll Inactive';
        }
    }
}

// Format choice text for display (convert from API format to user-friendly)
function formatChoiceText(choice) {
    const choiceMap = {
        'love-it': '🚀 Love it!',
        'good': '👍 Pretty good',
        'okay': '😐 It\'s okay',
        'needs-work': '👎 Needs work',
        'excellent': '⭐ Excellent',
        'very-good': '👍 Very good',
        'good': '✅ Good',
        'fair': '😐 Fair',
        'poor': '👎 Poor'
    };

    return choiceMap[choice] || choice.charAt(0).toUpperCase() + choice.slice(1).replace(/-/g, ' ');
}

// Show success message
function showSuccess() {
    pollForm.style.display = 'none';
    errorSection.style.display = 'none';
    thankYouSection.style.display = 'block';
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    thankYouSection.style.display = 'none';
    errorSection.style.display = 'block';
}

// Submit poll response
async function submitPollResponse(formData) {
    const payload = {
        poll_id: pollConfig ? pollConfig.poll_id : getPollId(),
        choice: formData.get('feedback'),
        comment: formData.get('comment') || null,
        client_fingerprint: generateClientFingerprint(),
        honeypot_hp_email: formData.get('hp_email') || null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/polls/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Idempotency-Key': 'poll-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess();
        } else {
            throw new Error(result.detail || 'Server error occurred');
        }
    } catch (error) {
        console.error('Poll submission error:', error);

        if (error.message.includes('already voted')) {
            showError('You have already submitted feedback for this poll. Thank you!');
        } else if (error.message.includes('Rate limit')) {
            showError('Please wait a moment before submitting again.');
        } else if (error.message.includes('Bot detected')) {
            showError('Submission blocked. Please ensure you are not using automated tools.');
        } else {
            showError('Unable to submit feedback right now. Please try again later.');
        }
    }
}

// Form submission handler
pollForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(pollForm);
    const selectedOption = formData.get('feedback');

    if (!selectedOption) {
        showError('Please select a feedback option before submitting.');
        return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = pollForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        await submitPollResponse(formData);
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// Initialize poll configuration and page content
document.addEventListener('DOMContentLoaded', async () => {
    // Get poll ID from URL
    const pollId = getPollId();

    try {
        // Load poll configuration
        console.log(`Loading poll configuration for: ${pollId}`);
        const config = await loadPollConfig(pollId);
        console.log('Poll config loaded:', config);

        // Update page content with poll config
        updatePageContent(config);

        // Add animation classes after page load
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);

        // Add hover effects to option labels (after dynamic creation)
        setTimeout(() => {
            const options = document.querySelectorAll('.option');
            options.forEach(option => {
                option.addEventListener('mouseenter', () => {
                    option.style.transform = 'translateY(-2px)';
                });

                option.addEventListener('mouseleave', () => {
                    option.style.transform = 'translateY(0)';
                });
            });

            // Auto-focus on first option for accessibility
            const firstOption = document.querySelector('input[name="feedback"]');
            if (firstOption) {
                firstOption.focus();
            }
        }, 200);

    } catch (error) {
        console.error('Failed to load poll configuration:', error);
        showError(`Failed to load poll configuration: ${error.message}. Using default poll.`);

        // Fall back to hardcoded behavior
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);

        const options = document.querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('mouseenter', () => {
                option.style.transform = 'translateY(-2px)';
            });

            option.addEventListener('mouseleave', () => {
                option.style.transform = 'translateY(0)';
            });
        });
    }
});

// Add keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.type === 'radio') {
        // Allow form submission with Enter on radio buttons
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
        }
    }
});

// Console log for debugging
console.log('Pulse Poll frontend loaded. API base URL:', API_BASE_URL);