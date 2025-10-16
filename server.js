const express = require('express');
const cors = require('cors');
const { igdl } = require("ruhend-scraper");
const path = require('path');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced Configuration
const CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET || 'Sp1d3y_0ff1c14l_$3cur3_K3y_2025!@#',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 100 * 1024 * 1024,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
    CLEANUP_INTERVAL: 10 * 60 * 1000,
    CACHE_DURATION: 30 * 60 * 1000,
    MAX_MEDIA_PER_REQUEST: 20
};

// Helper function to generate UUID
function generateUUID() {
    return crypto.randomBytes(16).toString('hex');
}

// Enhanced Storage Class
class EnhancedStorage {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
        this.downloadCache = new Map();
        this.analytics = new Map();
        this.requestTracker = new Map();
        this.loadData();
    }

    async loadData() {
        try {
            const data = await fs.readFile('./data/storage.json', 'utf8');
            const parsed = JSON.parse(data);
            this.users = new Map(parsed.users);
            console.log('✅ Storage data loaded successfully');
        } catch (error) {
            console.log('⚠️ No existing storage data found, starting fresh');
        }
    }

    async saveData() {
        try {
            await fs.mkdir('./data', { recursive: true });
            const data = {
                users: Array.from(this.users.entries()),
                timestamp: Date.now()
            };
            await fs.writeFile('./data/storage.json', JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('❌ Failed to save storage data:', error);
        }
    }

    async createUser(userData) {
        const user = {
            ...userData,
            id: generateUUID(),
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isVerified: true,
            downloadCount: 0,
            loginCount: 0,
            preferences: {
                theme: 'dark',
                language: 'en',
                autoDownload: false,
                quality: 'high',
                downloadFormat: 'original'
            }
        };
        this.users.set(userData.email, user);
        await this.saveData();
        return user;
    }

    async updateUser(email, updates) {
        const user = this.users.get(email);
        if (user) {
            Object.assign(user, updates);
            this.users.set(email, user);
            await this.saveData();
        }
        return user;
    }

    createSession(user, deviceInfo = {}) {
        const sessionId = generateUUID();
        const session = {
            id: sessionId,
            userId: user.email,
            userAgent: deviceInfo.userAgent,
            ip: deviceInfo.ip,
            createdAt: Date.now(),
            lastActive: Date.now(),
            isActive: true
        };
        this.sessions.set(sessionId, session);
        return sessionId;
    }

    updateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActive = Date.now();
        }
    }

    trackEvent(userId, eventType, metadata = {}) {
        const event = {
            id: generateUUID(),
            userId,
            eventType,
            timestamp: Date.now(),
            metadata
        };
        
        const userEvents = this.analytics.get(userId) || [];
        userEvents.push(event);
        this.analytics.set(userId, userEvents.slice(-1000));
    }

    setCache(key, data, ttl = CONFIG.CACHE_DURATION) {
        this.downloadCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    getCache(key) {
        const cached = this.downloadCache.get(key);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        this.downloadCache.delete(key);
        return null;
    }

    trackRequest(sessionId, url, userAgent) {
        const requestKey = `${sessionId}-${url}`;
        this.requestTracker.set(requestKey, {
            url,
            sessionId,
            userAgent,
            timestamp: Date.now()
        });
        return requestKey;
    }

    getRequestHistory(sessionId) {
        return Array.from(this.requestTracker.entries())
            .filter(([key, data]) => key.includes(sessionId))
            .map(([key, data]) => data)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50);
    }
}

// Initialize enhanced storage
const storage = new EnhancedStorage();

// Enhanced Email Transporter
class EnhancedTransporter {
    constructor() {
        this.transporter = null;
        this.init();
    }

    async init() {
        try {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER || 'gaminghatyar777@gmail.com',
                    pass: process.env.EMAIL_PASS || 'xvjxaszgbseqjwon'
                }
            });
            
            await this.transporter.verify();
            console.log('✅ Email transporter initialized successfully');
        } catch (error) {
            console.log('⚠️ Email transporter not available - running without email functionality');
            this.transporter = null;
        }
    }

    async sendEmail(to, subject, html, text = '') {
        if (!this.transporter) {
            throw new Error('Email transporter not available');
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@spideyofficial.com',
            to,
            subject: `SPIDEY OFFICIAL - ${subject}`,
            html,
            text
        };

        return await this.transporter.sendMail(mailOptions);
    }
}

const emailService = new EnhancedTransporter();

// Enhanced Rate Limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip + (req.user?.email || 'anonymous')
});

const rateLimiters = {
    auth: createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts'),
    api: createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'),
    download: createRateLimit(60 * 60 * 1000, 50, 'Download limit exceeded'),
    strict: createRateLimit(60 * 1000, 5, 'Too many requests, please slow down')
};

// Enhanced Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));

app.use(express.json({ limit: CONFIG.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public', {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Apply rate limiting
app.use('/api/auth/', rateLimiters.auth);
app.use('/api/download/', rateLimiters.download);
app.use('/api/admin/', rateLimiters.strict);
app.use('/api/', rateLimiters.api);

// Enhanced Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1] || req.cookies?.accessToken;

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, CONFIG.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        storage.updateSession(user.sessionId);
        next();
    });
}

// Device Info Middleware
function captureDeviceInfo(req, res, next) {
    req.deviceInfo = {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        acceptLanguage: req.get('Accept-Language'),
        timestamp: Date.now()
    };
    next();
}

app.use(captureDeviceInfo);

// Enhanced Media Processor using ruhend-scraper
class MediaProcessor {
    static async downloadInstagram(url, options = {}) {
        const cacheKey = `instagram:${url}`;
        const cached = storage.getCache(cacheKey);
        if (cached) {
            console.log('✅ Serving from cache:', url);
            return cached;
        }

        try {
            console.log('🔄 Downloading from Instagram:', url);
            
            const downloadData = await igdl(url);
            
            if (!downloadData?.data || !Array.isArray(downloadData.data) || downloadData.data.length === 0) {
                throw new Error('No media found at the provided URL');
            }

            const processedMedia = this.processMediaData(downloadData.data, url);
            storage.setCache(cacheKey, processedMedia);
            
            return processedMedia;
        } catch (error) {
            console.error('❌ Instagram download failed:', error);
            
            // Enhanced error handling with specific messages
            let errorMessage = 'Download failed';
            if (error.message.includes('timeout')) {
                errorMessage = 'Request timeout. Please try again.';
            } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('private') || error.message.includes('restricted')) {
                errorMessage = 'This content is private or restricted.';
            } else {
                errorMessage = `Download failed: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    static processMediaData(mediaData, originalUrl) {
        const uniqueMedia = [];
        const seenUrls = new Set();
        
        mediaData.forEach((media, index) => {
            if (!media?.url) return;
            
            const cleanUrl = media.url.split('?')[0].split('#')[0];
            if (seenUrls.has(cleanUrl)) return;
            
            seenUrls.add(cleanUrl);
            
            const mediaInfo = {
                id: `${Date.now()}-${index}`,
                url: media.url,
                cleanUrl,
                type: this.getMediaType(media.url),
                thumbnail: media.thumbnail || media.url,
                duration: media.duration,
                dimensions: media.dimensions,
                size: media.size,
                quality: this.detectQuality(media.url),
                timestamp: Date.now(),
                downloadUrl: this.generateDownloadUrl(media.url),
                filename: this.generateFilename(media.url, index)
            };
            
            uniqueMedia.push(mediaInfo);
        });
        
        return uniqueMedia.slice(0, CONFIG.MAX_MEDIA_PER_REQUEST);
    }

    static getMediaType(url) {
        if (!url) return 'image';
        
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp'];
        const videoPatterns = ['/video/', '_video_', 'video_'];
        
        const urlLower = url.toLowerCase();
        
        if (videoExtensions.some(ext => urlLower.includes(ext)) ||
            videoPatterns.some(pattern => urlLower.includes(pattern))) {
            return 'video';
        }
        
        return 'image';
    }

    static detectQuality(url) {
        const qualityPatterns = [
            { pattern: /(\d+)p/, quality: 'hd' },
            { pattern: /hd|high|720|1080|1440|2160/, quality: 'hd' },
            { pattern: /sd|low|480/, quality: 'sd' },
            { pattern: /thumb|small/, quality: 'low' }
        ];
        
        for (const { pattern, quality } of qualityPatterns) {
            if (pattern.test(url.toLowerCase())) {
                return quality;
            }
        }
        
        return 'standard';
    }

    static generateDownloadUrl(mediaUrl) {
        // Create a proxy download endpoint
        return `/api/download/media?url=${encodeURIComponent(mediaUrl)}`;
    }

    static generateFilename(url, index) {
        const extension = this.getMediaType(url) === 'video' ? 'mp4' : 'jpg';
        const timestamp = Date.now();
        return `spidey_${timestamp}_${index + 1}.${extension}`;
    }

    static isValidInstagramUrl(url) {
        if (!url || typeof url !== 'string') return false;
        
        const patterns = [
            /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories)\/[A-Za-z0-9_-]+\/?/i,
            /https?:\/\/(www\.)?instagr\.am\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/i,
            /https?:\/\/(www\.)?instagram\.com\/stories\/[A-Za-z0-9_-]+\/\d+\/?/i
        ];
        
        return patterns.some(pattern => pattern.test(url.trim()));
    }

    static extractCleanUrl(inputText) {
        const urlMatch = inputText.match(/(https?:\/\/[^\s]+)/);
        if (!urlMatch) return null;
        
        let url = urlMatch[0];
        url = url.split('?')[0].split('&')[0].split('#')[0];
        
        return this.isValidInstagramUrl(url) ? url : null;
    }
}

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required'
            });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }
        
        if (storage.users.has(email)) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await storage.createUser({
            email,
            password: hashedPassword,
            name
        });
        
        const sessionId = storage.createSession(user, req.deviceInfo);
        
        const accessToken = jwt.sign(
            { 
                email: user.email, 
                name: user.name,
                sessionId 
            },
            CONFIG.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        storage.trackEvent(user.email, 'register', {
            device: req.deviceInfo.userAgent,
            ip: req.deviceInfo.ip
        });
        
        console.log('✅ New user registered:', email);
        
        res.json({
            success: true,
            message: 'Registration successful!',
            user: {
                email: user.email,
                name: user.name,
                preferences: user.preferences
            },
            accessToken
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }
        
        const user = storage.users.get(email);
        
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email or password'
            });
        }
        
        await storage.updateUser(email, {
            lastLogin: new Date().toISOString(),
            loginCount: (user.loginCount || 0) + 1
        });
        
        const sessionId = storage.createSession(user, req.deviceInfo);
        
        const accessToken = jwt.sign(
            { 
                email: user.email, 
                name: user.name,
                sessionId 
            },
            CONFIG.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        storage.trackEvent(user.email, 'login', {
            device: req.deviceInfo.userAgent,
            ip: req.deviceInfo.ip
        });
        
        res.json({
            success: true,
            message: 'Login successful!',
            user: {
                email: user.email,
                name: user.name,
                preferences: user.preferences,
                stats: {
                    downloadCount: user.downloadCount || 0,
                    lastLogin: user.lastLogin
                }
            },
            accessToken
        });
        
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// Enhanced Download Endpoint (NO AUTH REQUIRED)
app.post('/api/download', async (req, res) => {
    try {
        const { url, sessionId = 'anonymous', quality = 'high' } = req.body;
        const user = req.user;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }
        
        const cleanUrl = MediaProcessor.extractCleanUrl(url);
        if (!cleanUrl || !MediaProcessor.isValidInstagramUrl(cleanUrl)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Instagram URL. Please provide a valid Instagram post, reel, or video link.'
            });
        }
        
        const requestId = generateUUID();
        storage.trackRequest(sessionId, cleanUrl, req.deviceInfo.userAgent);
        
        storage.trackEvent(user?.email || 'anonymous', 'download_request', {
            url: cleanUrl,
            quality,
            requestId,
            device: req.deviceInfo.userAgent
        });
        
        const mediaData = await MediaProcessor.downloadInstagram(cleanUrl, { quality });
        
        if (!mediaData.length) {
            throw new Error('No downloadable media found from this link.');
        }
        
        if (user) {
            await storage.updateUser(user.email, {
                downloadCount: (storage.users.get(user.email).downloadCount || 0) + 1,
                lastDownload: new Date().toISOString()
            });
            
            storage.trackEvent(user.email, 'download_success', {
                url: cleanUrl,
                mediaCount: mediaData.length,
                requestId
            });
        }
        
        res.json({
            success: true,
            media: mediaData,
            count: mediaData.length,
            originalUrl: cleanUrl,
            requestId,
            timestamp: Date.now(),
            userStats: user ? {
                downloadCount: storage.users.get(user.email).downloadCount
            } : null
        });
        
    } catch (error) {
        console.error('❌ Download error:', error);
        
        storage.trackEvent(req.user?.email || 'anonymous', 'download_failed', {
            url: req.body.url,
            error: error.message
        });
        
        res.status(500).json({
            success: false,
            error: error.message,
            suggestions: [
                'Check if the URL is correct and accessible',
                'Try again in a few minutes',
                'Ensure the content is public',
                'Contact support if issue persists'
            ]
        });
    }
});

// Media Download Proxy Endpoint
app.get('/api/download/media', async (req, res) => {
    try {
        const { url, filename } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'Media URL is required' });
        }
        
        const decodedUrl = decodeURIComponent(url);
        
        // Set appropriate headers for download
        const suggestedFilename = filename || `spidey_download_${Date.now()}.${MediaProcessor.getMediaType(decodedUrl) === 'video' ? 'mp4' : 'jpg'}`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${suggestedFilename}"`);
        res.setHeader('Content-Type', MediaProcessor.getMediaType(decodedUrl) === 'video' ? 'video/mp4' : 'image/jpeg');
        
        // For security, we'll redirect to the actual media URL
        // In production, you might want to proxy the content through your server
        res.redirect(decodedUrl);
        
    } catch (error) {
        console.error('❌ Media download error:', error);
        res.status(500).json({ error: 'Failed to download media' });
    }
});

// User Profile Management
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    try {
        const user = storage.users.get(req.user.email);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        const userSessions = Array.from(storage.sessions.values())
            .filter(session => session.userId === user.email)
            .map(session => ({
                id: session.id,
                userAgent: session.userAgent,
                ip: session.ip,
                createdAt: session.createdAt,
                lastActive: session.lastActive,
                isActive: session.isActive
            }));
        
        res.json({
            success: true,
            user: {
                email: user.email,
                name: user.name,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                preferences: user.preferences,
                stats: {
                    downloadCount: user.downloadCount || 0,
                    sessionCount: userSessions.length,
                    totalLogins: user.loginCount || 0
                },
                sessions: userSessions
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get profile'
        });
    }
});

// Batch Download Endpoint
app.post('/api/download/batch', authenticateToken, async (req, res) => {
    try {
        const { urls } = req.body;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'URLs array is required'
            });
        }
        
        if (urls.length > 5) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 5 URLs allowed per batch'
            });
        }
        
        const results = [];
        
        for (const url of urls) {
            try {
                const cleanUrl = MediaProcessor.extractCleanUrl(url);
                if (cleanUrl && MediaProcessor.isValidInstagramUrl(cleanUrl)) {
                    const mediaData = await MediaProcessor.downloadInstagram(cleanUrl);
                    results.push({
                        url: cleanUrl,
                        success: true,
                        media: mediaData,
                        count: mediaData.length
                    });
                } else {
                    results.push({
                        url,
                        success: false,
                        error: 'Invalid Instagram URL'
                    });
                }
            } catch (error) {
                results.push({
                    url,
                    success: false,
                    error: error.message
                });
            }
        }
        
        const successfulDownloads = results.filter(r => r.success).length;
        if (successfulDownloads > 0) {
            await storage.updateUser(req.user.email, {
                downloadCount: (storage.users.get(req.user.email).downloadCount || 0) + successfulDownloads
            });
        }
        
        storage.trackEvent(req.user.email, 'batch_download', {
            totalUrls: urls.length,
            successfulDownloads,
            failedDownloads: urls.length - successfulDownloads
        });
        
        res.json({
            success: true,
            results,
            summary: {
                total: urls.length,
                successful: successfulDownloads,
                failed: urls.length - successfulDownloads
            }
        });
        
    } catch (error) {
        console.error('Batch download error:', error);
        res.status(500).json({
            success: false,
            error: 'Batch download failed'
        });
    }
});

// Download History Endpoint
app.get('/api/history/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = storage.getRequestHistory(sessionId);
        
        res.json({
            success: true,
            history,
            count: history.length
        });
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get download history'
        });
    }
});

// Analytics Endpoint
app.get('/api/stats', (req, res) => {
    const totalUsers = storage.users.size;
    const totalSessions = storage.sessions.size;
    const totalDownloads = Array.from(storage.users.values())
        .reduce((sum, user) => sum + (user.downloadCount || 0), 0);
    
    const stats = {
        totalUsers,
        totalSessions,
        totalDownloads,
        cacheSize: storage.downloadCache.size,
        requestCount: storage.requestTracker.size,
        serverUptime: process.uptime(),
        activeUsers: Array.from(storage.sessions.values())
            .filter(session => Date.now() - session.lastActive < 15 * 60 * 1000).length
    };
    
    res.json(stats);
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0',
        storage: {
            users: storage.users.size,
            sessions: storage.sessions.size,
            cache: storage.downloadCache.size,
            requests: storage.requestTracker.size
        }
    });
});

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/verify-email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify-email.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Error Handling
app.use((error, req, res, next) => {
    console.error('❌ Server Error:', error);
    
    storage.trackEvent(req.user?.email || 'anonymous', 'server_error', {
        path: req.path,
        method: req.method,
        error: error.message
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Periodic Cleanup
setInterval(() => {
    const now = Date.now();
    
    // Clean up old sessions
    for (const [id, session] of storage.sessions.entries()) {
        if (now - session.lastActive > CONFIG.SESSION_TIMEOUT) {
            storage.sessions.delete(id);
        }
    }
    
    // Clean up old cache
    for (const [key, cache] of storage.downloadCache.entries()) {
        if (now - cache.timestamp > cache.ttl) {
            storage.downloadCache.delete(key);
        }
    }
    
    // Clean up old requests
    for (const [key, request] of storage.requestTracker.entries()) {
        if (now - request.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
            storage.requestTracker.delete(key);
        }
    }
    
    storage.saveData().catch(console.error);
    
}, CONFIG.CLEANUP_INTERVAL);

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Shutting down gracefully...');
    await storage.saveData();
    console.log('✅ Data saved. Goodbye!');
    process.exit(0);
});

// Start Server
app.listen(PORT, () => {
    console.log(`🕷️ SPIDEY OFFICIAL v2.0 running on port ${PORT}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
    console.log(`🔐 Enhanced authentication system: ACTIVE`);
    console.log(`📥 Advanced download features: ENABLED`);
    console.log(`💾 Storage: ${storage.users.size} users, ${storage.sessions.size} sessions`);
    console.log(`⚡ Features: Batch downloads, Analytics, Caching, Enhanced security`);
    console.log(`📦 Using: ruhend-scraper for reliable Instagram downloads`);
});