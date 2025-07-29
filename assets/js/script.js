document.addEventListener("DOMContentLoaded", function() {
    let currentSection = 0;
    const totalSections = 7;
    const carouselWrapper = document.getElementById('carouselWrapper');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressDots = document.getElementById('progressDots');

    // Initialize progress dots
    function initProgressDots() {
        progressDots.innerHTML = '';
        for (let i = 0; i < totalSections; i++) {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (i === currentSection) {
                dot.classList.add('active');
            }
            dot.addEventListener('click', () => goToSection(i));
            progressDots.appendChild(dot);
        }
    }

    // Update carousel position
    function updateCarousel() {
        const translateX = -(currentSection * (100 / totalSections));
        carouselWrapper.style.transform = `translateX(${translateX}%)`;
        
        // Update progress dots
        const dots = progressDots.querySelectorAll('.progress-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSection);
        });
        
        // Update navigation buttons
        prevBtn.disabled = currentSection === 0;
        nextBtn.disabled = currentSection === totalSections - 1;
        
        // Save current position to localStorage
        localStorage.setItem('resumeCurrentSection', currentSection);
    }

    // Go to specific section
    function goToSection(sectionIndex) {
        if (sectionIndex >= 0 && sectionIndex < totalSections) {
            currentSection = sectionIndex;
            updateCarousel();
        }
    }

    // Navigate to next section
    window.nextSection = function() {
        if (currentSection < totalSections - 1) {
            currentSection++;
            updateCarousel();
        }
    };

    // Navigate to previous section
    window.prevSection = function() {
        if (currentSection > 0) {
            currentSection--;
            updateCarousel();
        }
    };

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            window.prevSection();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            window.nextSection();
        } else if (e.key >= '1' && e.key <= '7') {
            e.preventDefault();
            goToSection(parseInt(e.key) - 1);
        }
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carouselWrapper.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });

    carouselWrapper.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50; // Minimum distance for a swipe
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right - go to previous section
                window.prevSection();
            } else {
                // Swipe left - go to next section
                window.nextSection();
            }
        }
    }

    // Restore previous position if available
    const savedSection = localStorage.getItem('resumeCurrentSection');
    if (savedSection !== null) {
        currentSection = parseInt(savedSection);
        if (currentSection >= totalSections) {
            currentSection = 0;
        }
    }

    // Initialize the carousel
    initProgressDots();
    updateCarousel();

    // Add smooth scroll behavior for any anchor links within sections
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        });
    });

    // Add intersection observer for accessibility
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Announce section change for screen readers
                const sectionIndex = Array.from(entry.target.parentNode.children).indexOf(entry.target);
                if (sectionIndex !== -1) {
                    const announcement = document.createElement('div');
                    announcement.setAttribute('aria-live', 'polite');
                    announcement.setAttribute('aria-atomic', 'true');
                    announcement.className = 'sr-only';
                    announcement.textContent = `Section ${sectionIndex + 1} of ${totalSections}`;
                    document.body.appendChild(announcement);
                    
                    setTimeout(() => {
                        document.body.removeChild(announcement);
                    }, 1000);
                }
            }
        });
    }, {
        threshold: 0.5
    });

    // Observe all carousel sections
    document.querySelectorAll('.carousel-section').forEach(section => {
        sectionObserver.observe(section);
    });

    // Add resize handler to maintain carousel positioning
    window.addEventListener('resize', function() {
        updateCarousel();
    });

    // Preload next/previous sections for better performance
    function preloadSections() {
        const nextSection = currentSection + 1;
        const prevSection = currentSection - 1;
        
        // You could add image preloading or other optimizations here
        // For now, this is a placeholder for future enhancements
    }

    // Call preload when section changes
    preloadSections();

    // Add focus management for accessibility
    function manageFocus() {
        const currentCard = document.querySelectorAll('.carousel-section')[currentSection];
        if (currentCard) {
            const focusableElements = currentCard.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }
    }

    // Add ARIA attributes for better accessibility
    carouselWrapper.setAttribute('role', 'region');
    carouselWrapper.setAttribute('aria-label', 'Professional resume sections');
    
    document.querySelectorAll('.carousel-section').forEach((section, index) => {
        section.setAttribute('aria-label', `Section ${index + 1} of ${totalSections}`);
        section.setAttribute('role', 'tabpanel');
    });

    // Console log for debugging (remove in production)
    console.log('Professional Resume Carousel Initialized');
    console.log('Navigation: Arrow keys, number keys 1-7, touch swipe, or navigation buttons');
    console.log('Current section:', currentSection + 1, 'of', totalSections);
});

// Export functions for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        nextSection: window.nextSection,
        prevSection: window.prevSection
    };
}