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
            // Use the existing resume data that we know works
            this.loadRealData();
        }
    }

    loadRealData() {
        // Use the actual resume data from the project
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
                    "Senior Product Manager with 12+ years in education technology and emerging tech, delivering transformative AI/ML business results including 96% cost reduction and 71% operational efficiency gains.",
                    "Proven track record securing millions in strategic partnerships with NVIDIA, Microsoft, Intel, and AMD while leading cross-functional teams from product concept through production deployment.",
                    "Expert at translating emerging AI technologies into scalable products that maximize ROI and drive market expansion."
                ]
            },
            competencies: [
                {
                    emoji: "🎯",
                    title: "Product Management & Strategy",
                    description: "Product roadmap development, lifecycle management, go-to-market strategy, market expansion, cross-functional team leadership, stakeholder management"
                },
                {
                    emoji: "🤖",
                    title: "AI/ML Product Development",
                    description: "Machine learning productization, LLMs, Generative AI, Agentic AI systems, MLOps, RAG pipelines, edge compute AI"
                },
                {
                    emoji: "⚡",
                    title: "Technical Leadership",
                    description: "Agile methodology, software development lifecycle, technical documentation, process improvement, international coordination"
                },
                {
                    emoji: "🤝",
                    title: "Strategic Partnerships",
                    description: "Business development, market development funds, vendor management, alliance strategy, partnership negotiations"
                },
                {
                    emoji: "📊",
                    title: "Data-Driven Decision Making",
                    description: "Business intelligence, competitive analysis, market research, performance metrics, ROI optimization"
                },
                {
                    emoji: "🎓",
                    title: "Education Technology",
                    description: "EdTech solutions, curriculum development, learning analytics, academic partnerships, institutional sales"
                }
            ],
            experience: [
                {
                    company: "HP Inc, Worldwide Education",
                    position: "AI Technologist for Education",
                    period: "June 2023 – June 2025",
                    location: "San Diego, CA",
                    achievements: [
                        "Program Impact: Led CEO-sponsored NETA AI automation program from concept to production, achieving 96% cost savings and 71% time reduction",
                        "Technical Development: Co-developed scalable AI workflows using CrewAI, LangChain, and Agentic RAG frameworks",  
                        "Strategic Partnerships: Secured millions in Market Development Funds through partnerships with AMD, Intel, NVIDIA, and Microsoft",
                        "Research Leadership: Established partnerships with Columbia, Yale, Jackson State, and Florida International University"
                    ]
                },
                {
                    company: "HP Inc, Worldwide Education",
                    position: "Head of Higher Education Solutions",
                    period: "March 2021 – June 2023",
                    location: "San Diego, CA",
                    achievements: [
                        "Portfolio Transformation: Successfully transitioned HP portfolio focus from XR to AI strategic priority",
                        "Organizational Leadership: Led cross-functional teams through major organizational transformation",
                        "Market Expansion: Directed Future of Work Academy and other market expansion initiatives"
                    ]
                },
                {
                    company: "Marison Group",
                    position: "Senior Project Manager",
                    period: "August 2016 – March 2021",
                    location: "San Diego, CA",
                    achievements: [
                        "China K12 Platform: Led program management for HP Inc go-to-market strategy in China education segment",
                        "NVIDIA Partnership: Created and launched strategic NVIDIA-funded higher education data science program",
                        "Technical Integration: Managed Alibaba and Intel partnership for education notebooks"
                    ]
                }
            ],
            education: {
                academic: {
                    institution: "Carnegie Mellon University",
                    location: "Pittsburgh, PA",
                    degrees: [
                        { type: "Master of Science", field: "Electrical and Computer Engineering" },
                        { type: "Bachelor of Science", field: "Computer Engineering" }
                    ]
                },
                certifications: [
                    {
                        category: "Advanced AI/ML Specializations",
                        period: "(2024-2025)",
                        details: "Multi AI Agent Systems, Agentic RAG, LLM Post-Training, RLHF",
                        type: "ai-ml"
                    },
                    {
                        category: "Professional Development", 
                        period: "(2023-2025)",
                        details: "Claude Code 4, AI Agents for Product Leaders, Project Management with AI",
                        type: "professional"
                    },
                    {
                        category: "Technical Foundations",
                        details: "Neo4j Graph Data Science, Python Development, Azure ML Studio",
                        type: "technical"
                    }
                ],
                summary: {
                    count: "50+",
                    description: "Demonstrating commitment to staying current with emerging AI/ML technologies and industry best practices"
                }
            },
            achievements: [
                {
                    emoji: "📈",
                    title: "Program Scale",
                    description: "Led technical programs from startup initiatives to multi-million dollar enterprise partnerships across multiple business units",
                    color: "blue"
                },
                {
                    emoji: "💰",
                    title: "Financial Impact",
                    description: "Delivered 96% cost savings and 71% time savings through AI/ML program management, secured millions in strategic funding",
                    color: "green"
                },
                {
                    emoji: "🚀",
                    title: "Technical Delivery", 
                    description: "Successfully transitioned complex technology portfolios from prototype to production deployment using agile methodologies",
                    color: "purple"
                },
                {
                    emoji: "🤝",
                    title: "Strategic Partnerships",
                    description: "Secured partnerships with NVIDIA, AMD, Intel, Microsoft generating millions in market development funds",
                    color: "orange"
                }
            ],
            connect: {
                title: "Let's Connect",
                subtitle: "Ready to discuss AI strategy, product management, or strategic partnerships",
                links: [
                    {
                        emoji: "🔗",
                        title: "LinkedIn",
                        subtitle: "Connect professionally",
                        url: "https://www.linkedin.com/in/jeffchen"
                    },
                    {
                        emoji: "💻",
                        title: "GitHub",
                        subtitle: "View projects", 
                        url: "https://github.com/jc7k"
                    }
                ],
                resumes: [
                    {
                        emoji: "🤖",
                        title: "AI Technical Program Manager",
                        file: "./assets/md/Jeff Chen Resume - AI TPM.md"
                    },
                    {
                        emoji: "💼",
                        title: "Business Development",
                        file: "./assets/md/Jeff Chen Resume - BD.md"
                    },
                    {
                        emoji: "📢",
                        title: "Technology Evangelist", 
                        file: "./assets/md/Jeff Chen Resume - Evangelist.md"
                    }
                ]
            }
        };
        
        this.navigationStructure = {
            navigationStructure: {
                home: { 
                    id: "home", 
                    title: "Home", 
                    icon: "👋", 
                    description: "Professional introduction and contact" 
                },
                about: { 
                    id: "about", 
                    title: "About", 
                    icon: "👤", 
                    description: "Professional overview and core skills",
                    children: {
                        overview: { id: "overview", title: "Professional Overview" },
                        competencies: { id: "competencies", title: "Core Competencies" }
                    }
                },
                experience: { 
                    id: "experience", 
                    title: "Experience", 
                    icon: "💼", 
                    description: "Career journey and accomplishments" 
                },
                education: { 
                    id: "education", 
                    title: "Education", 
                    icon: "🎓", 
                    description: "Academic background and certifications",
                    children: {
                        academic: { id: "academic", title: "Academic Credentials" },
                        certifications: { id: "certifications", title: "Certifications" }
                    }
                },
                achievements: { 
                    id: "achievements", 
                    title: "Achievements", 
                    icon: "🏆", 
                    description: "Key accomplishments and recognition" 
                },
                connect: { 
                    id: "connect", 
                    title: "Connect", 
                    icon: "🤝", 
                    description: "Contact information and resources" 
                }
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
                <div class="sidebar-header">
                    <h1>${this.resumeData.personal.name}</h1>
                    <p>${this.resumeData.personal.title}</p>
                </div>
                
                <nav class="nav-section">
                    ${Object.values(nav).map(item => this.renderNavItem(item)).join('')}
                </nav>
            </aside>
        `;
    }

    renderNavItem(item) {
        const isActive = this.currentRoute === item.id;
        const hasChildren = item.children && Object.keys(item.children).length > 0;
        
        return `
            <div>
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
                <div id="content-area" class="content-section">
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
            
            <div class="grid grid-2 mb-lg">
                <div>
                    <div class="card mb-lg">
                        <h3 class="card-title">Professional Links</h3>
                        <div>
                            <a href="${this.resumeData.personal.contact.linkedin}" class="link" target="_blank">
                                🔗 LinkedIn Profile
                            </a>
                        </div>
                        <div class="mt-sm">
                            <a href="${this.resumeData.personal.contact.github}" class="link" target="_blank">
                                💻 GitHub Portfolio  
                            </a>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3 class="card-title">Quick Overview</h3>
                        <p class="text-sm">${this.resumeData.overview.description[0]}</p>
                    </div>
                </div>
                
                <div>
                    <div class="grid grid-3 mb-lg">
                        ${this.resumeData.overview.metrics.map(metric => `
                            <div class="metric-card">
                                <span class="metric-number">${metric.number}</span>
                                <span class="metric-label">${metric.label}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="card">
                        <h3 class="card-title">Navigation</h3>
                        <p class="text-sm mb-md">Explore my professional background using the sidebar navigation.</p>
                        <div class="grid grid-2 text-sm">
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
        
        return `
            <div class="section-header">
                <h1 class="section-title">Professional Overview</h1>
                <p class="section-subtitle">Experience and expertise summary</p>
            </div>
            
            <div class="grid grid-3 mb-lg">
                ${this.resumeData.overview.metrics.map(metric => `
                    <div class="metric-card">
                        <span class="metric-number">${metric.number}</span>
                        <span class="metric-label">${metric.label}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="card">
                ${this.resumeData.overview.description.map(paragraph => `
                    <p class="mb-md">${paragraph}</p>
                `).join('')}
            </div>
        `;
    }

    renderCompetencies() {
        return `
            <div class="section-header">
                <h1 class="section-title">Core Competencies</h1>
                <p class="section-subtitle">Technical and business expertise</p>
            </div>
            
            <div class="grid grid-2">
                ${this.resumeData.competencies.map(competency => `
                    <div class="card competency-card">
                        <div class="competency-header">
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
        return `
            <div class="section-header">
                <h1 class="section-title">Professional Experience</h1>
                <p class="section-subtitle">Career journey and key accomplishments</p>
            </div>
            
            <div class="grid">
                ${this.resumeData.experience.map(job => `
                    <div class="card experience-card">
                        <div class="card-header">
                            <h3 class="card-title">${job.company}</h3>
                            <p class="card-subtitle">${job.position}</p>
                            <p class="card-meta">${job.period} | ${job.location}</p>
                        </div>
                        <div class="achievement-list">
                            ${job.achievements.map(achievement => `
                                <div class="achievement-item">
                                    <div class="achievement-bullet"></div>
                                    <div>${achievement}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
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
            
            <div class="card">
                <h3 class="card-title">${this.resumeData.education.academic.institution}</h3>
                <p class="card-meta mb-lg">${this.resumeData.education.academic.location}</p>
                
                ${this.resumeData.education.academic.degrees.map(degree => `
                    <div class="mb-md">
                        <h4 class="font-semibold">${degree.type}</h4>
                        <p class="text-sm">${degree.field}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderCertifications() {
        return `
            <div class="section-header">
                <h1 class="section-title">Professional Certifications</h1>
                <p class="section-subtitle">Continuous learning and skill development</p>
            </div>
            
            <div class="grid">
                ${this.resumeData.education.certifications.map(cert => `
                    <div class="card">
                        <h3 class="card-title">${cert.category}</h3>
                        ${cert.period ? `<p class="card-meta mb-md">${cert.period}</p>` : ''}
                        <p class="text-sm">${cert.details}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="card mt-lg" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); border-color: #3b82f6;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span style="font-size: 2rem;">📚</span>
                    <div>
                        <h3 class="font-bold">${this.resumeData.education.summary.count} Technical Certifications</h3>
                        <p class="text-sm">${this.resumeData.education.summary.description}</p>
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
            
            <div class="grid grid-2">
                ${this.resumeData.achievements.map(achievement => `
                    <div class="card">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <span style="font-size: 2rem;">${achievement.emoji}</span>
                            <h3 class="card-title">${achievement.title}</h3>
                        </div>
                        <p class="text-sm">${achievement.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderConnect() {
        return `
            <div class="section-header">
                <h1 class="section-title">${this.resumeData.connect.title}</h1>
                <p class="section-subtitle">${this.resumeData.connect.subtitle}</p>
            </div>
            
            <div class="grid grid-2">
                <div class="card">
                    <h3 class="card-title">Professional Networks</h3>
                    ${this.resumeData.connect.links.map(link => `
                        <div class="mb-md">
                            <a href="${link.url}" class="link" target="_blank">
                                ${link.emoji} ${link.title}
                            </a>
                            <p class="text-sm">${link.subtitle}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="card">
                    <h3 class="card-title">Resume Downloads</h3>
                    ${this.resumeData.connect.resumes.map(resume => `
                        <div class="mb-sm">
                            <a href="${resume.file}" class="button button-secondary" style="width: 100%; justify-content: flex-start;">
                                ${resume.emoji} ${resume.title}
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
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
            contentArea.className = 'content-section';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading state
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
    
    window.app = new ModernResumeApp();
});