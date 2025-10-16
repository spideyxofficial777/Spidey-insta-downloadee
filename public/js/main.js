// Main Application Controller for SPIDEY OFFICIAL
class SpideyApp {
    constructor() {
        this.components = {};
        this.init();
    }

    init() {
        this.initializeComponents();
        this.setupGlobalEventListeners();
        this.setupServiceWorker();
        this.setupPerformanceMonitoring();
        this.setupErrorHandling();
        this.showWelcomeMessage();
    }

    initializeComponents() {
        // Initialize all components in order
        this.components = {
            animationManager: window.animationManager,
            uiEffects: window.uiEffects,
            downloadManager: window.downloadManager
        };

        console.log('🕷️ SPIDEY OFFICIAL initialized successfully!');
    }

    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('instagramUrl').focus();
            }
            
            // Escape to clear input or close modals
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });

        // Online/offline detection
        window.addEventListener('online', () => {
            window.uiEffects.showNotification('Connection restored!', 'success');
        });

        window.addEventListener('offline', () => {
            window.uiEffects.showNotification('You are currently offline', 'warning');
        });

        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Before unload confirmation
        window.addEventListener('beforeunload', (e) => {
            if (this.downloadManager?.stats.totalDownloads > 0) {
                e.preventDefault();
                e.returnValue = 'You have active downloads. Are you sure you want to leave?';
            }
        });
    }

    handleEscapeKey() {
        const urlInput = document.getElementById('instagramUrl');
        if (document.activeElement === urlInput && urlInput.value) {
            urlInput.value = '';
            window.uiEffects.showNotification('Input cleared', 'success');
        }
        
        // Close any open fullscreen overlays
        const overlays = document.querySelectorAll('.fullscreen-overlay');
        overlays.forEach(overlay => overlay.remove());
    }

    handlePageHidden() {
        // Pause any ongoing animations or videos
        document.querySelectorAll('video').forEach(video => {
            if (!video.paused) {
                video.dataset.wasPlaying = 'true';
                video.pause();
            }
        });
    }

    handlePageVisible() {
        // Resume paused media
        document.querySelectorAll('video[data-was-playing="true"]').forEach(video => {
            video.play().catch(console.error);
            delete video.dataset.wasPlaying;
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    setupPerformanceMonitoring() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.log(`${entry.name}: ${entry.value}`);
                    
                    // Log large layout shifts
                    if (entry.name === 'layout-shift' && entry.value > 0.1) {
                        console.warn('Large layout shift detected:', entry);
                    }
                }
            });

            observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift', 'first-input'] });
        }

        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                console.log(`Memory: ${Math.round(memory.usedJSHeapSize / 1048576)}MB / ${Math.round(memory.totalJSHeapSize / 1048576)}MB`);
            }, 30000);
        }
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.reportError(e.error);
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.reportError(e.reason);
            e.preventDefault();
        });

        // Network error monitoring
        this.setupNetworkErrorMonitoring();
    }

    setupNetworkErrorMonitoring() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    this.handleFetchError(response, args[0]);
                }
                
                return response;
            } catch (error) {
                this.handleFetchError(error, args[0]);
                throw error;
            }
        };
    }

    handleFetchError(error, url) {
        console.error('Fetch error for:', url, error);
        
        if (!navigator.onLine) {
            window.uiEffects.showNotification('Please check your internet connection', 'error');
        } else if (error.status === 429) {
            window.uiEffects.showNotification('Too many requests. Please wait a moment.', 'warning');
        } else if (error.status >= 500) {
            window.uiEffects.showNotification('Server error. Please try again later.', 'error');
        }
    }

    reportError(error) {
        // In a real application, you would send this to an error reporting service
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.log('Error reported:', errorInfo);
        
        // You can send this to your backend or error reporting service
        // fetch('/api/error-report', {
        //     method: 'POST',
        //     body: JSON.stringify(errorInfo)
        // });
    }

    showWelcomeMessage() {
        // Show welcome message on first visit
        const hasVisited = localStorage.getItem('spidey_has_visited');
        
        if (!hasVisited) {
            setTimeout(() => {
                window.uiEffects.showNotification(
                    'Welcome to SPIDEY OFFICIAL! 🕷️ Start by pasting an Instagram URL above.',
                    'success',
                    8000
                );
                localStorage.setItem('spidey_has_visited', 'true');
            }, 2000);
        }
    }

    // Utility methods
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Analytics
    trackEvent(category, action, label) {
        // In a real application, you would send this to your analytics service
        console.log('Event tracked:', { category, action, label, timestamp: new Date().toISOString() });
        
        // Example: Send to Google Analytics
        // if (typeof gtag !== 'undefined') {
        //     gtag('event', action, {
        //         event_category: category,
        //         event_label: label
        //     });
        // }
    }

    // Export functionality
    exportDownloadHistory() {
        const history = this.downloadManager.downloadHistory;
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `spidey_download_history_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        window.uiEffects.showNotification('Download history exported!', 'success');
    }

    // Import functionality
    importDownloadHistory(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const history = JSON.parse(e.target.result);
                this.downloadManager.downloadHistory = history;
                this.downloadManager.saveDownloadHistory();
                window.uiEffects.showNotification('Download history imported!', 'success');
            } catch (error) {
                window.uiEffects.showNotification('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Progressive Web App Features
class PWAFeatures {
    constructor() {
        this.init();
    }

    init() {
        this.setupInstallPrompt();
        this.setupOfflineSupport();
        this.setupBackgroundSync();
    }

    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            window.uiEffects.showNotification('SPIDEY OFFICIAL installed successfully!', 'success');
        });
    }

    showInstallPrompt() {
        // Create install button
        const installBtn = document.createElement('button');
        installBtn.className = 'install-prompt-btn';
        installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--gradient-primary);
            color: white;
            border: none;
            padding: 1rem 1.5rem;
            border-radius: 25px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: var(--shadow-lg);
            animation: pulse 2s infinite;
        `;
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                installBtn.remove();
            }
        });
        
        document.body.appendChild(installBtn);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.remove();
            }
        }, 10000);
    }

    setupOfflineSupport() {
        // Cache important resources
        if ('caches' in window) {
            caches.open('spidey-v1').then(cache => {
                return cache.addAll([
                    '/',
                    '/css/style.css',
                    '/css/animations.css',
                    '/css/responsive.css',
                    '/js/main.js',
                    '/js/downloader.js',
                    '/js/animations.js',
                    '/js/ui-effects.js',
                    '/js/particles.js'
                ]);
            });
        }
    }

    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                return registration.sync.register('download-sync');
            });
        }
    }
}

// Initialize the main application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize PWA features
    new PWAFeatures();
    
    // Initialize main app
    window.spideyApp = new SpideyApp();
    
    // Add global error boundary for React-like error handling
    window.addEventListener('error', (event) => {
        console.error('Application error:', event.error);
        
        // Show user-friendly error message
        if (window.uiEffects) {
            window.uiEffects.showNotification(
                'Something went wrong. Please refresh the page and try again.',
                'error'
            );
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpideyApp, PWAFeatures };
}