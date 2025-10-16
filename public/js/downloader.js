// Advanced Download Manager for SPIDEY OFFICIAL
class DownloadManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.downloadHistory = [];
        this.stats = {
            totalDownloads: 0,
            successfulDownloads: 0,
            failedDownloads: 0
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDownloadHistory();
        this.startStatsUpdater();
    }

    generateSessionId() {
        return 'spidey_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    setupEventListeners() {
        const downloadBtn = document.getElementById('downloadBtn');
        const urlInput = document.getElementById('instagramUrl');
        const clearBtn = document.getElementById('clearBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        const clearResultsBtn = document.getElementById('clearResultsBtn');
        const exampleChips = document.querySelectorAll('.example-chip');

        downloadBtn.addEventListener('click', () => this.handleDownload());
        
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleDownload();
            }
        });

        clearBtn.addEventListener('click', () => {
            urlInput.value = '';
            urlInput.focus();
        });

        downloadAllBtn.addEventListener('click', () => this.downloadAllMedia());
        clearResultsBtn.addEventListener('click', () => this.clearResults());

        exampleChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const url = chip.dataset.url;
                urlInput.value = url;
                this.handleDownload();
            });
        });
    }

    async handleDownload() {
        const urlInput = document.getElementById('instagramUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            window.uiEffects.showNotification('Please enter an Instagram URL', 'error');
            return;
        }

        if (!this.isValidInstagramUrl(url)) {
            window.uiEffects.showNotification('Please enter a valid Instagram URL', 'error');
            return;
        }

        this.showProgress();
        this.updateProgress(0, 'Starting download...');

        try {
            const response = await this.fetchMediaData(url);
            
            if (response.success) {
                this.updateProgress(50, 'Processing media...');
                await this.displayResults(response.media);
                this.updateProgress(100, 'Download complete!');
                this.stats.successfulDownloads++;
                
                window.uiEffects.showNotification(`Successfully downloaded ${response.media.length} media items!`, 'success');
                window.uiEffects.createConfetti();
                
                // Add to download history
                this.addToHistory(response);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Download error:', error);
            this.updateProgress(0, 'Download failed');
            this.stats.failedDownloads++;
            window.uiEffects.showNotification(error.message, 'error');
        } finally {
            this.hideProgress();
            this.updateStatsDisplay();
        }
    }

    async fetchMediaData(url) {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                sessionId: this.sessionId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Download failed');
        }

        return await response.json();
    }

    async displayResults(media) {
        const resultsSection = document.getElementById('resultsSection');
        const mediaGrid = document.getElementById('mediaGrid');
        
        resultsSection.classList.remove('hidden');
        mediaGrid.innerHTML = '';

        for (let i = 0; i < media.length; i++) {
            const mediaItem = media[i];
            await this.createMediaCard(mediaItem, i, media.length);
            
            // Update progress for each media item
            const progress = 50 + ((i + 1) / media.length) * 50;
            this.updateProgress(progress, `Processing media ${i + 1}/${media.length}`);
            
            // Small delay for smooth animation
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    async createMediaCard(media, index, total) {
        const mediaGrid = document.getElementById('mediaGrid');
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        mediaItem.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;

        const isVideo = media.type === 'video';
        const fileName = `spidey_${media.id || index + 1}.${isVideo ? 'mp4' : 'jpg'}`;

        mediaItem.innerHTML = `
            <div class="media-preview-container">
                ${isVideo ? 
                    `<video class="media-preview" controls>
                        <source src="${media.url}" type="video/mp4">
                        Your browser does not support the video tag.
                     </video>` :
                    `<img class="media-preview" src="${media.url}" alt="Instagram media ${index + 1}" loading="lazy">`
                }
                <div class="media-overlay">
                    <span class="media-type">${isVideo ? 'VIDEO' : 'IMAGE'}</span>
                    <button class="preview-fullscreen" data-media="${media.url}" data-type="${media.type}">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            <div class="media-info">
                <div class="media-meta">
                    <span class="media-index">Media ${index + 1}/${total}</span>
                    <span class="media-size">${this.formatFileSize(media.size)}</span>
                </div>
                <button class="download-media-btn" data-url="${media.url}" data-filename="${fileName}">
                    <i class="fas fa-download"></i>
                    Download ${isVideo ? 'Video' : 'Image'}
                </button>
            </div>
        `;

        mediaGrid.appendChild(mediaItem);

        // Add event listeners
        const downloadBtn = mediaItem.querySelector('.download-media-btn');
        const fullscreenBtn = mediaItem.querySelector('.preview-fullscreen');

        downloadBtn.addEventListener('click', () => this.downloadSingleMedia(media.url, fileName));
        fullscreenBtn.addEventListener('click', () => this.openFullscreen(media.url, media.type));
    }

    downloadSingleMedia(url, filename) {
        this.stats.totalDownloads++;
        this.updateStatsDisplay();
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.uiEffects.showNotification('Download started!', 'success');
        window.uiEffects.playClickSound();
    }

    async downloadAllMedia() {
        const downloadButtons = document.querySelectorAll('.download-media-btn');
        let successCount = 0;
        
        for (const button of downloadButtons) {
            try {
                const url = button.dataset.url;
                const filename = button.dataset.filename;
                
                await this.downloadWithDelay(url, filename);
                successCount++;
                
                // Visual feedback
                button.classList.add('success-state');
                button.innerHTML = '<i class="fas fa-check"></i> Downloaded';
                
            } catch (error) {
                console.error('Download failed:', error);
                button.classList.add('error-state');
                button.innerHTML = '<i class="fas fa-times"></i> Failed';
            }
            
            // Delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        window.uiEffects.showNotification(`Downloaded ${successCount}/${downloadButtons.length} files`, 'success');
    }

    downloadWithDelay(url, filename) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.downloadSingleMedia(url, filename);
                resolve();
            }, 100);
        });
    }

    openFullscreen(url, type) {
        const overlay = document.createElement('div');
        overlay.className = 'fullscreen-overlay';
        overlay.innerHTML = `
            <div class="fullscreen-content">
                ${type === 'video' ? 
                    `<video controls autoplay>
                        <source src="${url}" type="video/mp4">
                     </video>` :
                    `<img src="${url}" alt="Fullscreen preview">`
                }
                <button class="fullscreen-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        const closeBtn = overlay.querySelector('.fullscreen-close');
        closeBtn.addEventListener('click', () => overlay.remove());
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    showProgress() {
        const progressSection = document.getElementById('progressSection');
        const downloadBtn = document.getElementById('downloadBtn');
        
        progressSection.classList.remove('hidden');
        downloadBtn.disabled = true;
        downloadBtn.querySelector('.btn-text').style.display = 'none';
        downloadBtn.querySelector('.btn-loader').style.display = 'flex';
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        const downloadBtn = document.getElementById('downloadBtn');
        
        setTimeout(() => {
            progressSection.classList.add('hidden');
            downloadBtn.disabled = false;
            downloadBtn.querySelector('.btn-text').style.display = 'block';
            downloadBtn.querySelector('.btn-loader').style.display = 'none';
        }, 1000);
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const progressText = document.getElementById('progressText');
        const timeElapsed = document.getElementById('timeElapsed');
        
        progressFill.style.width = `${percentage}%`;
        progressPercentage.textContent = `${Math.round(percentage)}%`;
        progressText.textContent = text;
        
        // Update time elapsed
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        timeElapsed.textContent = this.formatTime(elapsed);
    }

    clearResults() {
        const mediaGrid = document.getElementById('mediaGrid');
        const resultsSection = document.getElementById('resultsSection');
        
        mediaGrid.innerHTML = '';
        resultsSection.classList.add('hidden');
        
        window.uiEffects.showNotification('Results cleared', 'success');
    }

    isValidInstagramUrl(url) {
        const patterns = [
            /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/[A-Za-z0-9_-]+\/?/i,
            /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/i,
            /https?:\/\/(www\.)?instagr\.am\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/i
        ];
        
        return patterns.some(pattern => pattern.test(url.trim()));
    }

    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    addToHistory(downloadData) {
        this.downloadHistory.unshift({
            ...downloadData,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 items
        if (this.downloadHistory.length > 50) {
            this.downloadHistory = this.downloadHistory.slice(0, 50);
        }
        
        this.saveDownloadHistory();
    }

    saveDownloadHistory() {
        localStorage.setItem('spidey_download_history', JSON.stringify(this.downloadHistory));
    }

    loadDownloadHistory() {
        try {
            const history = localStorage.getItem('spidey_download_history');
            if (history) {
                this.downloadHistory = JSON.parse(history);
            }
        } catch (error) {
            console.error('Error loading download history:', error);
        }
    }

    startStatsUpdater() {
        setInterval(() => {
            this.updateLiveStats();
        }, 5000);
        
        this.updateLiveStats();
    }

    async updateLiveStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            document.getElementById('totalDownloads').textContent = 
                (this.stats.totalDownloads + stats.totalRequests).toLocaleString();
            document.getElementById('activeUsers').textContent = stats.activeUsers.toLocaleString();
            document.getElementById('serverUptime').textContent = Math.floor(stats.serverUptime / 3600);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    updateStatsDisplay() {
        // Update any additional stats displays if needed
    }
}

// Add CSS for fullscreen overlay
const downloaderStyles = document.createElement('style');
downloaderStyles.textContent = `
    .fullscreen-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .fullscreen-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
    }
    
    .fullscreen-content img,
    .fullscreen-content video {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 10px;
    }
    
    .fullscreen-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .media-preview-container {
        position: relative;
        overflow: hidden;
    }
    
    .media-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 1rem;
        background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    
    .preview-fullscreen {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
    }
    
    .media-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        font-size: 0.8rem;
        color: var(--gray);
    }
`;
document.head.appendChild(downloaderStyles);

// Initialize Download Manager
document.addEventListener('DOMContentLoaded', () => {
    window.downloadManager = new DownloadManager();
});