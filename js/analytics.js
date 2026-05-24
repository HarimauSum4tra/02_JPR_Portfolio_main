/**
 * ============================================================
 * PROFESSIONAL ANALYTICS MODULE - Jarian Permana Portfolio
 * Version: 2.0.0
 * License: MIT
 * Description: Privacy-focused analytics with engagement tracking
 * ============================================================
 */

class PortfolioAnalytics {
    constructor(config = {}) {
        this.config = {
            googleAnalyticsId: config.gaId || null,      // Optional: GA4 Measurement ID
            enableHeatmaps: config.heatmaps || false,     // Track clicks (privacy-first)
            trackDownloads: config.trackDownloads || true,
            trackOutboundLinks: config.trackOutboundLinks || true,
            sessionTimeout: config.sessionTimeout || 1800, // 30 minutes
            ...config
        };
        
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.userId = this.getOrCreateUserId();
        
        this.init();
    }
    
    /**
     * Initialize analytics system
     */
    init() {
        // Load Google Analytics if ID provided
        if (this.config.googleAnalyticsId) {
            this.loadGoogleAnalytics();
        }
        
        // Track page view
        this.trackPageView();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Track session duration
        this.trackSessionDuration();
        
        // Send initial data
        this.sendToEndpoint('/api/analytics/init', {
            sessionId: this.sessionId,
            userId: this.userId,
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || 'direct'
        });
        
        console.log('[Analytics] Initialized for portfolio');
    }
    
    /**
     * Load Google Analytics 4
     */
    loadGoogleAnalytics() {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.googleAnalyticsId}`;
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', this.config.googleAnalyticsId);
        
        console.log('[Analytics] Google Analytics loaded');
    }
    
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get or create persistent user ID (privacy-first, no cookies)
     */
    getOrCreateUserId() {
        let userId = localStorage.getItem('portfolio_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 16);
            localStorage.setItem('portfolio_user_id', userId);
        }
        return userId;
    }
    
    /**
     * Track page view with metadata
     */
    trackPageView() {
        const pageData = {
            page: window.location.pathname,
            title: document.title,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            referrer: document.referrer,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            scrollDepth: 0
        };
        
        this.events.push({ type: 'pageview', data: pageData });
        this.sendToEndpoint('/api/analytics/pageview', pageData);
        
        // Track scroll depth
        this.trackScrollDepth();
    }
    
    /**
     * Track how far users scroll
     */
    trackScrollDepth() {
        const thresholds = [25, 50, 75, 100];
        const tracked = new Set();
        
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            thresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !tracked.has(threshold)) {
                    tracked.add(threshold);
                    this.trackEvent('scroll_depth', { percent: threshold });
                }
            });
        });
    }
    
    /**
     * Track custom events (clicks, interactions)
     */
    trackEvent(eventName, eventData = {}) {
        const event = {
            type: 'event',
            name: eventName,
            data: eventData,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            page: window.location.pathname
        };
        
        this.events.push(event);
        this.sendToEndpoint('/api/analytics/event', event);
        
        // Also send to GA if configured
        if (window.gtag && this.config.googleAnalyticsId) {
            gtag('event', eventName, eventData);
        }
        
        console.log(`[Analytics] Event: ${eventName}`, eventData);
    }
    
    /**
     * Track project interactions
     */
    trackProjectInteraction(projectName, action, metadata = {}) {
        this.trackEvent('project_interaction', {
            project: projectName,
            action: action, // 'view', 'click_code', 'click_demo', 'download_pdf'
            ...metadata
        });
    }
    
    /**
     * Track filter usage
     */
    trackFilterUsage(filterName) {
        this.trackEvent('filter_used', { filter: filterName });
    }
    
    /**
     * Track search queries (anonymized)
     */
    trackSearchQuery(query) {
        // Anonymize query (remove exact phrasing for privacy)
        const anonymized = query.length > 3 ? query.substring(0, 3) + '***' : '***';
        this.trackEvent('search', { query_length: query.length, query_prefix: anonymized });
    }
    
    /**
     * Track outbound link clicks
     */
    trackOutboundLink(url, linkText) {
        const domain = new URL(url).hostname;
        this.trackEvent('outbound_link', {
            url: url,
            domain: domain,
            link_text: linkText,
            page: window.location.pathname
        });
    }
    
    /**
     * Track file downloads (PDF, CSV, etc.)
     */
    trackDownload(fileUrl, fileType) {
        this.trackEvent('download', {
            file: fileUrl.split('/').pop(),
            type: fileType,
            page: window.location.pathname
        });
    }
    
    /**
     * Track time spent on each project card (hover)
     */
    setupProjectTracking() {
        const projectCards = document.querySelectorAll('.project-card');
        let hoverTimer = null;
        let currentProject = null;
        
        projectCards.forEach(card => {
            const projectName = card.querySelector('h3')?.innerText || 'Unknown';
            
            card.addEventListener('mouseenter', () => {
                currentProject = projectName;
                hoverTimer = setTimeout(() => {
                    this.trackEvent('project_hover', {
                        project: projectName,
                        duration: 3 // seconds
                    });
                }, 3000);
            });
            
            card.addEventListener('mouseleave', () => {
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                    hoverTimer = null;
                }
                currentProject = null;
            });
            
            // Track clicks on project links
            const links = card.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    const action = link.innerText.includes('Code') ? 'click_code' :
                                  link.innerText.includes('Demo') ? 'click_demo' :
                                  link.innerText.includes('PDF') ? 'download_pdf' : 'click_link';
                    
                    this.trackProjectInteraction(projectName, action, {
                        link_href: link.href
                    });
                });
            });
        });
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Track outbound links
        if (this.config.trackOutboundLinks) {
            document.querySelectorAll('a[href^="http"]').forEach(link => {
                if (!link.href.includes(window.location.hostname)) {
                    link.addEventListener('click', (e) => {
                        this.trackOutboundLink(link.href, link.innerText);
                    });
                }
            });
        }
        
        // Track downloads
        if (this.config.trackDownloads) {
            document.querySelectorAll('a[href$=".pdf"], a[href$=".csv"], a[href$=".zip"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    const fileType = link.href.split('.').pop();
                    this.trackDownload(link.href, fileType);
                });
            });
        }
        
        // Track filter usage
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filterValue = btn.getAttribute('data-filter');
                this.trackFilterUsage(filterValue);
            });
        });
        
        // Track search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (e.target.value.length > 2) {
                        this.trackSearchQuery(e.target.value);
                    }
                }, 1000);
            });
        }
        
        // Track dark mode toggles
        const darkModeToggle = document.querySelector('.dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                const isDark = document.body.classList.contains('dark-mode');
                this.trackEvent('theme_toggle', { theme: isDark ? 'dark' : 'light' });
            });
        }
        
        // Track project interactions
        this.setupProjectTracking();
    }
    
    /**
     * Track session duration (send when user leaves)
     */
    trackSessionDuration() {
        window.addEventListener('beforeunload', () => {
            const duration = Math.floor((Date.now() - this.startTime) / 1000);
            this.sendToEndpoint('/api/analytics/session_end', {
                sessionId: this.sessionId,
                duration_seconds: duration,
                event_count: this.events.length
            });
        });
    }
    
    /**
     * Send data to analytics endpoint (can be disabled in production)
     */
    sendToEndpoint(endpoint, data) {
        // In production, replace with actual API endpoint
        // For now, store in localStorage for debugging
        
        const analyticsLog = JSON.parse(localStorage.getItem('portfolio_analytics_log') || '[]');
        analyticsLog.push({
            endpoint: endpoint,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 events
        if (analyticsLog.length > 100) analyticsLog.shift();
        localStorage.setItem('portfolio_analytics_log', JSON.stringify(analyticsLog));
        
        // If you have a real backend, uncomment below:
        /*
        if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, JSON.stringify(data));
        } else {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                keepalive: true
            }).catch(err => console.warn('[Analytics] Failed to send:', err));
        }
        */
    }
    
    /**
     * Get analytics summary (for debugging)
     */
    getSummary() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            sessionDuration: Math.floor((Date.now() - this.startTime) / 1000),
            eventsTracked: this.events.length,
            page: window.location.pathname
        };
    }
    
    /**
     * Export analytics data (for your own records)
     */
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            sessionId: this.sessionId,
            userId: this.userId,
            events: this.events,
            userMetadata: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                screenResolution: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_export_${this.sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.trackEvent('analytics_export');
    }
}

// Initialize analytics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with your Google Analytics ID (optional)
    // Get your GA4 ID from: https://analytics.google.com/
    const GA_MEASUREMENT_ID = null; // Set to 'G-XXXXXXXXXX' to enable
    
    window.portfolioAnalytics = new PortfolioAnalytics({
        googleAnalyticsId: GA_MEASUREMENT_ID,
        enableHeatmaps: false,  // Set to true for heatmap tracking
        trackDownloads: true,
        trackOutboundLinks: true,
        sessionTimeout: 1800
    });
    
    // Expose analytics globally for debugging (remove in production)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.debugAnalytics = window.portfolioAnalytics;
        console.log('[Analytics] Debug mode: use window.debugAnalytics');
    }
});

// Export for module usage (if using build system)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioAnalytics;
}