// Pulse Poll Frontend JavaScript

// API Configuration
const API_ENDPOINT = 'http://localhost:8000/api/polls/respond';  // Development
// const API_ENDPOINT = '/api/polls/respond';  // Production (same domain)
// const API_ENDPOINT = 'https://your-backend.railway.app/api/polls/respond';  // Production (different domain)

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
        poll_id: 'demo-poll-2024',
        choice: formData.get('feedback'),
        comment: formData.get('comment') || null,
        client_fingerprint: generateClientFingerprint(),
        honeypot_hp_email: formData.get('hp_email') || null
    };

    try {
        const response = await fetch(API_ENDPOINT, {
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

// Add smooth scrolling and enhanced UX
document.addEventListener('DOMContentLoaded', () => {
    // Add animation classes after page load
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Add hover effects to option labels
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
console.log('Pulse Poll frontend loaded. API endpoint:', API_ENDPOINT);