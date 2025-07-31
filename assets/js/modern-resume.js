class ModernResumeApp {
    constructor() {
        this.resumeData = null;
        this.navigationStructure = null;
        this.currentRoute = 'home';
        this.currentSubRoute = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.render();
            this.setupEventListeners();
            this.updateRoute('home');
        } catch (error) {
            console.error('Failed to initialize resume app:', error);
        }
    }

    async loadData() {
        try {
            // Load resume data
            const resumeResponse = await fetch('./assets/data/resume-data.json');
            this.resumeData = await resumeResponse.json();
            
            // Load navigation structure
            const navResponse = await fetch('./assets/data/navigation-structure.json');
            this.navigationStructure = await navResponse.json();
        } catch (error) {
            console.error('Failed to load data:', error);
            // Fallback to inline data for testing
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        console.log('Using fallback data for testing');
        this.resumeData = {
            personal: {
                name: "Jeff Chen",
                title: "AI Product Leader & Technical Strategist",
                contact: {
                    description: "Available via professional networks",
                    linkedin: "https://www.linkedin.com/in/jeffchen",
                    github: "https://github.com/jc7k"
                }
            },
            overview: {
                metrics: [
                    { number: "12+", label: "Years Experience" },
                    { number: "96%", label: "Cost Reduction" },
                    { number: "71%", label: "Time Savings" }
                ],
                description: [
                    "Senior Product Manager with 12+ years in education technology and emerging tech, delivering transformative AI/ML business results."
                ]
            },
            competencies: [
                {
                    emoji: "🎯",
                    title: "Product Management & Strategy",
                    description: "Product roadmap development, lifecycle management, go-to-market strategy"
                }
            ],
            experience: [
                {
                    company: "HP Inc, Worldwide Education",
                    position: "AI Technologist for Education",
                    period: "June 2023 – June 2025",
                    location: "San Diego, CA",
                    achievements: ["Led CEO-sponsored NETA AI automation program"]
                }
            ],
            education: {
                academic: {
                    institution: "Carnegie Mellon University",
                    location: "Pittsburgh, PA",
                    degrees: [
                        { type: "Master of Science", field: "Electrical and Computer Engineering" }
                    ]
                },
                certifications: [
                    {
                        category: "AI/ML Specializations",
                        period: "(2024-2025)",
                        details: "Multi AI Agent Systems, Agentic RAG",
                        type: "ai-ml"
                    }
                ],
                summary: {
                    count: "50+",
                    description: "Technical certifications"
                }
            },
            achievements: [
                {
                    emoji: "📈",
                    title: "Program Scale",
                    description: "Led technical programs from startup initiatives to multi-million dollar partnerships",
                    color: "blue"
                }
            ],
            connect: {
                title: "Let's Connect",
                subtitle: "Ready to discuss AI strategy and partnerships",
                links: [
                    {
                        emoji: "🔗",
                        title: "LinkedIn",
                        subtitle: "Connect professionally",
                        url: "https://www.linkedin.com/in/jeffchen"
                    }
                ],
                resumes: [
                    {
                        emoji: "🤖",
                        title: "AI Technical Program Manager",
                        file: "./assets/md/Jeff Chen Resume - AI TPM.md"
                    }
                ]
            }
        };
        
        this.navigationStructure = {
            navigationStructure: {
                home: { id: "home", title: "Home", icon: "👋", description: "Professional introduction" },
                about: { 
                    id: "about", 
                    title: "About", 
                    icon: "👤", 
                    description: "Professional overview",
                    children: {
                        overview: { id: "overview", title: "Overview" },
                        competencies: { id: "competencies", title: "Competencies" }
                    }
                },
                experience: { id: "experience", title: "Experience", icon: "💼", description: "Work history" },
                education: { 
                    id: "education", 
                    title: "Education", 
                    icon: "🎓", 
                    description: "Academic background",
                    children: {
                        academic: { id: "academic", title: "Academic" },
                        certifications: { id: "certifications", title: "Certifications" }
                    }
                },
                achievements: { id: "achievements", title: "Achievements", icon: "🏆", description: "Key accomplishments" },
                connect: { id: "connect", title: "Connect", icon: "🤝", description: "Contact information" }
            }
        };
    }

    render() {
        document.body.innerHTML = `
            <div class="resume-app">
                ${this.renderSidebar()}
                ${this.renderMainContent()}
            </div>
        `;
    }

    renderSidebar() {
        const nav = this.navigationStructure.navigationStructure;
        
        return `
            <aside class="sidebar">
                <div class="mb-8">
                    <h1 class="text-2xl font-bold">${this.resumeData.personal.name}</h1>
                    <p class="text-sm text-muted-foreground">${this.resumeData.personal.title}</p>
                </div>
                
                <nav class="space-y-2">
                    ${Object.values(nav).map(item => this.renderNavItem(item)).join('')}
                </nav>
            </aside>
        `;
    }

    renderNavItem(item) {
        const isActive = this.currentRoute === item.id;
        const hasChildren = item.children && Object.keys(item.children).length > 0;
        
        return `
            <div class="nav-group">
                <div class="nav-item ${isActive ? 'active' : ''}" data-route="${item.id}">
                    <span class="nav-item-icon">${item.icon || '📄'}</span>
                    <div class="nav-item-content">
                        <div class="nav-item-title">${item.title}</div>
                        <div class="nav-item-description">${item.description}</div>
                    </div>
                </div>
                
                ${hasChildren && isActive ? `
                    <div class="nav-subitems">
                        ${Object.values(item.children).map(child => this.renderSubNavItem(child)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderSubNavItem(item) {
        const isActive = this.currentSubRoute === item.id;
        
        return `
            <div class="nav-subitem ${isActive ? 'active' : ''}" data-subroute="${item.id}">
                <div class="nav-subitem-title">${item.title}</div>
                ${item.period ? `<div class="nav-subitem-period">${item.period}</div>` : ''}
            </div>
        `;
    }

    renderMainContent() {
        return `
            <main class="main-content">
                <div id="content-area" class="content-section animate-fade-in">
                    ${this.renderCurrentContent()}
                </div>
            </main>
        `;
    }

    renderCurrentContent() {
        switch (this.currentRoute) {
            case 'home':
                return this.renderHome();
            case 'about':
                return this.renderAbout();
            case 'experience':
                return this.renderExperience();
            case 'education':
                return this.renderEducation();
            case 'achievements':
                return this.renderAchievements();
            case 'connect':
                return this.renderConnect();
            default:
                return this.renderHome();
        }
    }

    renderHome() {
        return `
            <div class="section-header">
                <h1 class="section-title">Welcome</h1>
                <p class="section-subtitle">AI Product Leader & Technical Strategist</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="space-y-6">
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Professional Links</h3>
                        <div class="space-y-3">
                            <a href="${this.resumeData.personal.contact.linkedin}" 
                               class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                               target="_blank">
                                <span class="text-xl">🔗</span>
                                <div>
                                    <div class="font-medium">LinkedIn</div>
                                    <div class="text-sm text-muted-foreground">Professional network</div>
                                </div>
                            </a>
                            <a href="${this.resumeData.personal.contact.github}" 
                               class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                               target="_blank">
                                <span class="text-xl">💻</span>
                                <div>
                                    <div class="font-medium">GitHub</div>
                                    <div class="text-sm text-muted-foreground">Code portfolio</div>
                                </div>
                            </a>
                        </div>
                    </div>
                    
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Quick Overview</h3>
                        <p class="text-sm text-muted-foreground">
                            ${this.resumeData.overview.description[0]}
                        </p>
                    </div>
                </div>
                
                <div class="space-y-6">
                    <div class="grid grid-cols-3 gap-4">
                        ${this.resumeData.overview.metrics.map(metric => `
                            <div class="metric-card">
                                <div class="metric-number">${metric.number}</div>
                                <div class="metric-label">${metric.label}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Navigation</h3>
                        <p class="text-sm text-muted-foreground mb-4">
                            Explore my professional background using the sidebar navigation.
                        </p>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div>👤 About & Skills</div>
                            <div>💼 Work Experience</div>
                            <div>🎓 Education</div>
                            <div>🏆 Achievements</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAbout() {
        if (this.currentSubRoute === 'competencies') {
            return this.renderCompetencies();
        }
        
        // Default to overview
        return `
            <div class="section-header">
                <h1 class="section-title">Professional Overview</h1>
                <p class="section-subtitle">Experience and expertise summary</p>
            </div>
            
            <div class="space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${this.resumeData.overview.metrics.map(metric => `
                        <div class="metric-card">
                            <div class="metric-number">${metric.number}</div>
                            <div class="metric-label">${metric.label}</div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="bg-card border border-border rounded-lg p-6">
                    <div class="space-y-4">
                        ${this.resumeData.overview.description.map(paragraph => `
                            <p class="text-muted-foreground leading-relaxed">${paragraph}</p>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderCompetencies() {
        return `
            <div class="section-header">
                <h1 class="section-title">Core Competencies</h1>
                <p class="section-subtitle">Technical and business expertise</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${this.resumeData.competencies.map(competency => `
                    <div class="competency-card">
                        <div class="flex items-center space-x-3 mb-3">
                            <span class="competency-icon">${competency.emoji}</span>
                            <h3 class="competency-title">${competency.title}</h3>
                        </div>
                        <p class="competency-description">${competency.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderExperience() {
        if (this.currentSubRoute) {
            return this.renderSpecificExperience(this.currentSubRoute);
        }
        
        return `
            <div class="section-header">
                <h1 class="section-title">Professional Experience</h1>
                <p class="section-subtitle">Career journey and key accomplishments</p>
            </div>
            
            <div class="space-y-6">
                ${this.resumeData.experience.map(job => `
                    <div class="experience-card cursor-pointer hover:shadow-lg transition-shadow" 
                         data-experience="${this.getExperienceId(job)}">
                        <div class="experience-header">
                            <h3 class="experience-company">${job.company}</h3>
                            <p class="experience-position">${job.position}</p>
                            <p class="experience-period">${job.period} | ${job.location}</p>
                        </div>
                        <div class="achievement-list">
                            ${job.achievements.slice(0, 2).map(achievement => `
                                <div class="achievement-item">
                                    <div class="achievement-bullet"></div>
                                    <p class="achievement-text">${achievement}</p>
                                </div>
                            `).join('')}
                            ${job.achievements.length > 2 ? `
                                <p class="text-sm text-muted-foreground mt-2">
                                    +${job.achievements.length - 2} more achievements...
                                </p>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSpecificExperience(experienceId) {
        const job = this.resumeData.experience.find(j => this.getExperienceId(j) === experienceId);
        if (!job) return this.renderExperience();
        
        return `
            <div class="section-header">
                <button class="text-sm text-muted-foreground hover:text-foreground mb-2" onclick="app.updateSubRoute(null)">
                    ← Back to all experience
                </button>
                <h1 class="section-title">${job.company}</h1>
                <p class="section-subtitle">${job.position} • ${job.period}</p>
            </div>
            
            <div class="experience-card">
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-semibold">${job.position}</h3>
                        <span class="text-sm text-muted-foreground">${job.location}</span>
                    </div>
                    
                    <div class="achievement-list">
                        ${job.achievements.map(achievement => `
                            <div class="achievement-item">
                                <div class="achievement-bullet"></div>
                                <p class="achievement-text">${achievement}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderEducation() {
        if (this.currentSubRoute === 'certifications') {
            return this.renderCertifications();
        }
        
        return `
            <div class="section-header">
                <h1 class="section-title">Academic Credentials</h1>
                <p class="section-subtitle">Formal education background</p>
            </div>
            
            <div class="bg-card border border-border rounded-lg p-6">
                <h3 class="text-xl font-semibold mb-4">${this.resumeData.education.academic.institution}</h3>
                <p class="text-muted-foreground mb-4">${this.resumeData.education.academic.location}</p>
                
                <div class="space-y-3">
                    ${this.resumeData.education.academic.degrees.map(degree => `
                        <div class="border-l-2 border-primary pl-4">
                            <h4 class="font-semibold">${degree.type}</h4>
                            <p class="text-muted-foreground">${degree.field}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderCertifications() {
        return `
            <div class="section-header">
                <h1 class="section-title">Professional Certifications</h1>
                <p class="section-subtitle">Continuous learning and skill development</p>
            </div>
            
            <div class="space-y-6">
                ${this.resumeData.education.certifications.map(cert => `
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-2">${cert.category}</h3>
                        ${cert.period ? `<p class="text-sm text-muted-foreground mb-3">${cert.period}</p>` : ''}
                        <p class="text-sm">${cert.details}</p>
                    </div>
                `).join('')}
                
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div class="flex items-center space-x-3">
                        <span class="text-2xl">📚</span>
                        <div>
                            <h3 class="font-semibold text-blue-900">${this.resumeData.education.summary.count} Technical Certifications</h3>
                            <p class="text-sm text-blue-700">${this.resumeData.education.summary.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAchievements() {
        return `
            <div class="section-header">
                <h1 class="section-title">Key Achievements</h1>
                <p class="section-subtitle">Notable accomplishments and recognition</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${this.resumeData.achievements.map(achievement => `
                    <div class="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div class="flex items-center space-x-3 mb-4">
                            <span class="text-2xl">${achievement.emoji}</span>
                            <h3 class="text-lg font-semibold">${achievement.title}</h3>
                        </div>
                        <p class="text-muted-foreground">${achievement.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderConnect() {
        return `
            <div class="section-header">
                <h1 class="section-title">Let's Connect</h1>
                <p class="section-subtitle">${this.resumeData.connect.subtitle}</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="space-y-6">
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Professional Networks</h3>
                        <div class="space-y-3">
                            ${this.resumeData.connect.links.map(link => `
                                <a href="${link.url}" 
                                   class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                                   target="_blank">
                                    <span class="text-xl">${link.emoji}</span>
                                    <div>
                                        <div class="font-medium">${link.title}</div>
                                        <div class="text-sm text-muted-foreground">${link.subtitle}</div>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="space-y-6">
                    <div class="bg-card border border-border rounded-lg p-6">
                        <h3 class="text-lg font-semibold mb-4">Resume Downloads</h3>
                        <div class="grid grid-cols-1 gap-2">
                            ${this.resumeData.connect.resumes.map(resume => `
                                <a href="${resume.file}" 
                                   class="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors border border-border">
                                    <span class="text-lg">${resume.emoji}</span>
                                    <span class="text-sm font-medium">${resume.title}</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getExperienceId(job) {
        return job.company.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + 
               job.position.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-route]');
            if (navItem) {
                const route = navItem.dataset.route;
                this.updateRoute(route);
                return;
            }
            
            const subNavItem = e.target.closest('[data-subroute]');
            if (subNavItem) {
                const subRoute = subNavItem.dataset.subroute;
                this.updateSubRoute(subRoute);
                return;
            }
            
            const experienceCard = e.target.closest('[data-experience]');
            if (experienceCard) {
                const experienceId = experienceCard.dataset.experience;
                this.updateRoute('experience');
                this.updateSubRoute(experienceId);
                return;
            }
        });
    }

    updateRoute(route) {
        this.currentRoute = route;
        this.currentSubRoute = null;
        this.refreshUI();
    }

    updateSubRoute(subRoute) {
        this.currentSubRoute = subRoute;
        this.refreshUI();
    }

    refreshUI() {
        // Update sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.innerHTML = this.renderSidebar().replace('<aside class="sidebar">', '').replace('</aside>', '');
        }
        
        // Update main content
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.innerHTML = this.renderCurrentContent();
            contentArea.classList.remove('animate-fade-in');
            setTimeout(() => contentArea.classList.add('animate-fade-in'), 10);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ModernResumeApp();
});