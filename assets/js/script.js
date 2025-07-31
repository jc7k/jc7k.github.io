document.addEventListener("DOMContentLoaded", function() {
    let currentSection = 0;
    let totalSections = 7; // Will be updated when data loads
    let resumeData = null;
    const carouselWrapper = document.getElementById('carouselWrapper');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressDots = document.getElementById('progressDots');

    // Load resume data
    async function loadResumeData() {
        try {
            const response = await fetch('assets/data/resume-data.json');
            resumeData = await response.json();
            renderResume();
        } catch (error) {
            console.error('Failed to load resume data:', error);
            // Fallback to existing HTML structure
        }
    }

    // Render resume sections dynamically
    function renderResume() {
        if (!resumeData) return;

        carouselWrapper.innerHTML = `
            ${renderLandingSection()}
            ${renderOverviewSection()}
            ${renderCompetenciesSection()}
            ${renderExperienceSection()}
            ${renderEducationSection()}
            ${renderAchievementsSection()}
            ${renderConnectSection()}
        `;

        // Update total sections count
        totalSections = carouselWrapper.children.length;
        
        // Reinitialize progress dots and update carousel with new section count
        initProgressDots();
        updateCarousel();
    }

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
        if (prevBtn) prevBtn.disabled = currentSection === 0;
        if (nextBtn) nextBtn.disabled = currentSection === totalSections - 1;
        
        // Update active section class for animations
        const sections = document.querySelectorAll('.carousel-section');
        sections.forEach((section, index) => {
            section.classList.toggle('active', index === currentSection);
        });
        
        // Trigger animations for current section
        triggerSectionAnimations(currentSection);
        
        // Save current position to localStorage
        localStorage.setItem('resumeCurrentSection', currentSection);
    }

    // Trigger animations for section elements
    function triggerSectionAnimations(sectionIndex) {
        const currentSectionEl = document.querySelectorAll('.carousel-section')[sectionIndex];
        if (!currentSectionEl) return;

        // Add staggered animation delays
        const competencyItems = currentSectionEl.querySelectorAll('.competency-item');
        competencyItems.forEach((item, index) => {
            item.style.setProperty('--delay', index);
        });

        const metricItems = currentSectionEl.querySelectorAll('.metric-item');
        metricItems.forEach((item, index) => {
            item.style.setProperty('--delay', index);
        });

        const timelineItems = currentSectionEl.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.style.setProperty('--delay', index);
        });

        const contactItems = currentSectionEl.querySelectorAll('.contact-item');
        contactItems.forEach((item, index) => {
            item.style.setProperty('--delay', index);
        });

        // Trigger pulse animation for metrics after a delay
        setTimeout(() => {
            const metricNumbers = currentSectionEl.querySelectorAll('.metric-number');
            metricNumbers.forEach(number => {
                number.style.animation = 'none';
                number.offsetHeight; // Trigger reflow
                number.style.animation = 'pulse 2s infinite';
            });
        }, 800);
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

    // Render functions for each section
    function renderLandingSection() {
        return `
            <section class="carousel-section">
                <div class="professional-card text-center">
                    <h1 class="section-title">${resumeData.personal.name}</h1>
                    <p class="section-subtitle">${resumeData.personal.title}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-8">
                        <div>
                            <h3 class="font-semibold text-lg mb-2 text-gray-800">Contact Information</h3>
                            <p class="text-gray-600">${resumeData.personal.contact.description}</p>
                        </div>
                        <div>
                            <h3 class="font-semibold text-lg mb-2 text-gray-800">Professional Links</h3>
                            <p><a href="${resumeData.personal.contact.linkedin}" class="text-blue-600 hover:text-blue-800 transition-colors">LinkedIn Profile</a></p>
                            <p><a href="${resumeData.personal.contact.github}" class="text-blue-600 hover:text-blue-800 transition-colors">GitHub Portfolio</a></p>
                        </div>
                    </div>
                    
                </div>
            </section>
        `;
    }

    function renderOverviewSection() {
        return `
            <section class="carousel-section">
                <div class="professional-card">
                    <h2 class="section-title">Professional Overview</h2>
                    
                    <div class="metrics-container">
                        ${resumeData.overview.metrics.map(metric => `
                            <div class="metric-item">
                                <span class="metric-number">${metric.number}</span>
                                <span class="metric-label">${metric.label}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="mt-8 text-lg leading-relaxed">
                        ${resumeData.overview.description.map(paragraph => `
                            <p class="mt-4">${paragraph}</p>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    function renderCompetenciesSection() {
        return `
            <section class="carousel-section">
                <div class="professional-card">
                    <h2 class="section-title">Core Competencies</h2>
                    
                    <div class="scrollable-content">
                        <div class="competency-grid">
                            ${resumeData.competencies.map(competency => `
                                <div class="competency-item">
                                    <h3 class="font-semibold text-lg mb-2 flex items-center">
                                        <span class="mr-2 emoji">${competency.emoji}</span>
                                        ${competency.title}
                                    </h3>
                                    <p class="text-gray-600">${competency.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderExperienceSection() {
        return `
            <section class="carousel-section">
                <div class="professional-card">
                    <h2 class="section-title">Professional Experience</h2>
                    
                    <div class="scrollable-content">
                        <div class="experience-timeline">
                            ${resumeData.experience.map(job => `
                                <div class="timeline-item">
                                    <h3 class="font-bold text-xl mb-2">${job.company}</h3>
                                    <p class="text-blue-600 font-semibold mb-1">${job.position}</p>
                                    <p class="text-gray-500 mb-4">${job.period} | ${job.location}</p>
                                    
                                    <ul class="space-y-2 text-gray-700">
                                        ${job.achievements.map(achievement => `
                                            <li><strong>${achievement.split(':')[0]}:</strong>${achievement.split(':').slice(1).join(':')}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderEducationSection() {
        return `
            <section class="carousel-section">
                <div class="professional-card">
                    <h2 class="section-title">Education & Continuous Learning</h2>
                    
                    <div class="scrollable-content">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 class="education-section-header">Academic Credentials</h3>
                                <div class="education-card academic-card">
                                    <h4 class="education-institution">${resumeData.education.academic.institution}</h4>
                                    <p class="education-location">${resumeData.education.academic.location}</p>
                                    <div class="mt-3">
                                        ${resumeData.education.academic.degrees.map(degree => `
                                            <p class="education-degree mt-2">
                                                <span class="degree-type">${degree.type}</span><br>
                                                <span class="degree-field">${degree.field}</span>
                                            </p>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="education-section-header">Recent Certifications</h3>
                                <div class="space-y-3">
                                    ${resumeData.education.certifications.map(cert => `
                                        <div class="education-card certification-card ${cert.type}">
                                            <h4 class="certification-category">${cert.category}</h4>
                                            ${cert.period ? `<p class="certification-period">${cert.period}</p>` : ''}
                                            <p class="certification-details">${cert.details}</p>
                                        </div>
                                    `).join('')}
                                </div>
                                
                                <div class="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                                    <p class="text-sm font-semibold text-purple-800">
                                        <span class="text-lg">📚</span> <strong>${resumeData.education.summary.count} Technical Certifications</strong>
                                    </p>
                                    <p class="text-sm text-purple-700 mt-1">${resumeData.education.summary.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderAchievementsSection() {
        return `
            <section class="carousel-section">
                <div class="professional-card">
                    <h2 class="section-title">Key Achievements</h2>
                    
                    <div class="scrollable-content">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${resumeData.achievements.map(achievement => `
                                <div class="bg-${achievement.color}-50 p-6 rounded-lg border border-${achievement.color}-200">
                                    <div class="flex items-center mb-3">
                                        <span class="text-2xl mr-3 emoji">${achievement.emoji}</span>
                                        <h3 class="font-bold text-lg">${achievement.title}</h3>
                                    </div>
                                    <p>${achievement.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderConnectSection() {
        return `
            <section class="carousel-section">
                <div class="professional-card text-center">
                    <h2 class="section-title">${resumeData.connect.title}</h2>
                    <p class="section-subtitle">${resumeData.connect.subtitle}</p>
                    
                    <div class="contact-grid">
                        ${resumeData.connect.links.map(link => `
                            <a href="${link.url}" class="contact-item" target="_blank">
                                <span class="text-2xl emoji">${link.emoji}</span>
                                <div>
                                    <div class="font-semibold">${link.title}</div>
                                    <div class="text-sm opacity-75">${link.subtitle}</div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                    
                    <div class="mt-8">
                        <h3 class="font-semibold text-lg mb-4">Resume Versions</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            ${resumeData.connect.resumes.map(resume => `
                                <a href="${resume.file}" class="bg-gray-50 p-3 rounded border hover:bg-gray-100 transition-colors">
                                    <span class="emoji">${resume.emoji}</span> ${resume.title}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    // Add event listeners to navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', window.prevSection);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', window.nextSection);
    }

    // Initialize the carousel
    loadResumeData().then(() => {
        // Progress dots and carousel are now updated in renderResume()
    });

    // Fallback initialization if data loading fails
    setTimeout(() => {
        if (!resumeData) {
            initProgressDots();
            updateCarousel();
        }
    }, 1000);

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