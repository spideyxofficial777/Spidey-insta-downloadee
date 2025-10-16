// Advanced Authentication System for SPIDEY OFFICIAL
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.token = localStorage.getItem('spidey_token');
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('🔄 Initializing advanced authentication system...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.createAuthModals();
        this.setupEventListeners();
        this.checkAuthStatus();
        this.setupPasswordToggle();
        this.isInitialized = true;
        console.log('✅ Advanced auth system initialized');
    }

    createAuthModals() {
        // Create auth modals container
        const authModals = document.createElement('div');
        authModals.id = 'authModals';
        authModals.innerHTML = this.getAuthModalsHTML();
        document.body.appendChild(authModals);
    }

    getAuthModalsHTML() {
        return `
            <!-- Login Modal -->
            <div id="loginModal" class="auth-modal hidden">
                <div class="auth-container">
                    <div class="auth-header">
                        <h2>Welcome Back</h2>
                        <button class="close-auth">&times;</button>
                    </div>
                    <form id="loginForm" class="auth-form">
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="loginEmail" placeholder="Email Address" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="loginPassword" placeholder="Password" required>
                            <button type="button" class="toggle-password" data-target="loginPassword">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <button type="submit" class="auth-btn">
                            <span class="btn-text">SIGN IN</span>
                            <div class="btn-loader">
                                <div class="loader-dots">
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                </div>
                            </div>
                        </button>
                    </form>
                    <div class="auth-footer">
                        <p>Don't have an account? <a href="#" class="switch-auth" data-target="register">Sign Up</a></p>
                        <a href="#" class="forgot-password" data-target="forgot">Forgot Password?</a>
                    </div>
                </div>
            </div>

            <!-- Register Modal -->
            <div id="registerModal" class="auth-modal hidden">
                <div class="auth-container">
                    <div class="auth-header">
                        <h2>Join SPIDEY OFFICIAL</h2>
                        <button class="close-auth">&times;</button>
                    </div>
                    <form id="registerForm" class="auth-form">
                        <div class="input-group">
                            <i class="fas fa-user"></i>
                            <input type="text" id="registerName" placeholder="Full Name" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="registerEmail" placeholder="Email Address" required>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="registerPassword" placeholder="Password" required minlength="6">
                            <button type="button" class="toggle-password" data-target="registerPassword">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="input-group">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="registerConfirmPassword" placeholder="Confirm Password" required>
                        </div>
                        <div class="terms-agreement">
                            <input type="checkbox" id="agreeTerms" required>
                            <label for="agreeTerms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
                        </div>
                        <button type="submit" class="auth-btn">
                            <span class="btn-text">CREATE ACCOUNT</span>
                            <div class="btn-loader">
                                <div class="loader-dots">
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                </div>
                            </div>
                        </button>
                    </form>
                    <div class="auth-footer">
                        <p>Already have an account? <a href="#" class="switch-auth" data-target="login">Sign In</a></p>
                    </div>
                </div>
            </div>

            <!-- Profile Modal -->
            <div id="profileModal" class="auth-modal hidden">
                <div class="auth-container">
                    <div class="auth-header">
                        <h2>My Profile</h2>
                        <button class="close-auth">&times;</button>
                    </div>
                    <div class="profile-content">
                        <div class="profile-header">
                            <div class="profile-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="profile-info">
                                <h3 id="profileName">User Name</h3>
                                <p id="profileEmail">user@example.com</p>
                            </div>
                        </div>
                        <div class="profile-stats">
                            <div class="stat-item">
                                <span class="stat-number" id="profileDownloads">0</span>
                                <span class="stat-label">Downloads</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="profileMemberSince">0</span>
                                <span class="stat-label">Days</span>
                            </div>
                        </div>
                        <div class="profile-actions">
                            <button class="profile-action-btn" id="preferencesBtn">
                                <i class="fas fa-cog"></i> Preferences
                            </button>
                            <button class="profile-action-btn" id="historyBtn">
                                <i class="fas fa-history"></i> Download History
                            </button>
                            <button class="profile-action-btn logout" id="logoutBtn">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Global click handler for auth elements
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Input validation
        this.setupInputValidation();
    }

    handleGlobalClick(e) {
        const target = e.target;

        // Show login modal
        if (target.id === 'loginBtn' || target.closest('#loginBtn')) {
            e.preventDefault();
            this.showModal('login');
        }

        // Show register modal
        if (target.id === 'registerBtn' || target.closest('#registerBtn')) {
            e.preventDefault();
            this.showModal('register');
        }

        // Show profile modal
        if (target.id === 'userAvatar' || target.closest('#userAvatar') || 
            target.id === 'profileBtn' || target.closest('#profileBtn')) {
            e.preventDefault();
            this.showModal('profile');
        }

        // Close modals
        if (target.classList.contains('close-auth') || target.closest('.close-auth')) {
            e.preventDefault();
            this.hideAllModals();
        }

        // Switch between auth modals
        if (target.classList.contains('switch-auth') || target.closest('.switch-auth')) {
            e.preventDefault();
            const targetModal = target.dataset.target || target.closest('.switch-auth').dataset.target;
            this.showModal(targetModal);
        }

        // Forgot password
        if (target.classList.contains('forgot-password') || target.closest('.forgot-password')) {
            e.preventDefault();
            this.showToast('Password reset feature coming soon!', 'info');
        }

        // Logout
        if (target.id === 'logoutBtn' || target.closest('#logoutBtn') || 
            target.id === 'dropdownLogoutBtn' || target.closest('#dropdownLogoutBtn')) {
            e.preventDefault();
            this.logout();
        }

        // Close modal on outside click
        if (target.classList.contains('auth-modal')) {
            this.hideAllModals();
        }

        // User dropdown
        if (target.id === 'userAvatar' || target.closest('#userAvatar')) {
            e.preventDefault();
            this.toggleUserDropdown();
        }
    }

    handleFormSubmit(e) {
        if (e.target.id === 'loginForm') {
            e.preventDefault();
            this.handleLogin(e);
        }

        if (e.target.id === 'registerForm') {
            e.preventDefault();
            this.handleRegister(e);
        }
    }

    handleKeyboard(e) {
        // Close modals on Escape key
        if (e.key === 'Escape') {
            this.hideAllModals();
            this.hideUserDropdown();
        }
    }

    setupInputValidation() {
        // Real-time password confirmation validation
        const confirmPassword = document.getElementById('registerConfirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', (e) => {
                const password = document.getElementById('registerPassword').value;
                const confirm = e.target.value;
                
                if (confirm && password !== confirm) {
                    e.target.style.borderColor = 'var(--error)';
                } else {
                    e.target.style.borderColor = '';
                }
            });
        }

        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                this.validateEmail(e.target);
            });
        });
    }

    setupPasswordToggle() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-password') || e.target.closest('.toggle-password')) {
                const button = e.target.classList.contains('toggle-password') ? e.target : e.target.closest('.toggle-password');
                const targetId = button.dataset.target;
                const input = document.getElementById(targetId);
                
                if (input) {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                    
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
                    }
                }
            }
        });
    }

    validateEmail(input) {
        const email = input.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            input.style.borderColor = 'var(--error)';
            return false;
        } else {
            input.style.borderColor = '';
            return true;
        }
    }

    showModal(modalType) {
        this.hideAllModals();
        this.hideUserDropdown();
        
        const modal = document.getElementById(`${modalType}Modal`);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
            
            console.log(`📱 Showing ${modalType} modal`);
        }
    }

    hideAllModals() {
        document.querySelectorAll('.auth-modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = ''; // Restore scrolling
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    hideUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }

    async handleLogin(e) {
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Validation
        if (!this.validateEmail(document.getElementById('loginEmail'))) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        if (!password) {
            this.showToast('Please enter your password', 'error');
            return;
        }

        try {
            this.setLoadingState(submitBtn, true);

            // Simulate API call - Replace with actual API endpoint
            const response = await this.mockAPICall('/api/auth/login', { email, password });
            
            if (response.success) {
                this.token = response.accessToken;
                this.currentUser = response.user;
                
                // Store in localStorage
                localStorage.setItem('spidey_token', this.token);
                localStorage.setItem('spidey_user', JSON.stringify(this.currentUser));
                
                this.hideAllModals();
                this.updateUI();
                this.showToast(`Welcome back, ${this.currentUser.name}! 🎉`, 'success');
                
                // Reset form
                form.reset();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    async handleRegister(e) {
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!this.validateEmail(document.getElementById('registerEmail'))) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showToast('Please agree to the terms and conditions', 'error');
            return;
        }

        try {
            this.setLoadingState(submitBtn, true);

            // Simulate API call - Replace with actual API endpoint
            const response = await this.mockAPICall('/api/auth/register', { 
                name, email, password 
            });
            
            if (response.success) {
                this.hideAllModals();
                this.showToast('Account created successfully! Please check your email for verification.', 'success');
                
                // Reset form
                form.reset();
                
                // Auto-switch to login after successful registration
                setTimeout(() => {
                    this.showModal('login');
                }, 2000);
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('spidey_token');
        const userData = localStorage.getItem('spidey_user');

        if (token && userData) {
            try {
                // Verify token with backend
                const response = await this.mockAPICall('/api/auth/verify', { token });
                
                if (response.success) {
                    this.token = token;
                    this.currentUser = JSON.parse(userData);
                    this.updateUI();
                    console.log('✅ User authenticated:', this.currentUser.name);
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                this.logout();
            }
        } else {
            this.updateUI();
        }
    }

    updateUI() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userGreeting = document.getElementById('userGreetingName');

        if (this.currentUser) {
            // User is logged in
            if (authButtons) authButtons.classList.add('hidden');
            if (userMenu) userMenu.classList.remove('hidden');
            if (userGreeting) userGreeting.textContent = this.currentUser.name.split(' ')[0];

            // Update profile modal if open
            this.updateProfileModal();
        } else {
            // User is not logged in
            if (authButtons) authButtons.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
        }
    }

    updateProfileModal() {
        if (this.currentUser) {
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profileDownloads = document.getElementById('profileDownloads');
            const profileMemberSince = document.getElementById('profileMemberSince');

            if (profileName) profileName.textContent = this.currentUser.name;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;
            if (profileDownloads) profileDownloads.textContent = this.currentUser.downloadCount || '0';
            
            if (profileMemberSince && this.currentUser.createdAt) {
                const joinDate = new Date(this.currentUser.createdAt);
                const daysSince = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
                profileMemberSince.textContent = daysSince;
            }
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        
        // Clear storage
        localStorage.removeItem('spidey_token');
        localStorage.removeItem('spidey_user');
        
        this.hideAllModals();
        this.hideUserDropdown();
        this.updateUI();
        
        this.showToast('Logged out successfully', 'success');
        console.log('🚪 User logged out');
    }

    // Mock API call - Replace with actual fetch calls
    async mockAPICall(endpoint, data) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock responses based on endpoint
        switch (endpoint) {
            case '/api/auth/login':
                if (data.email === 'demo@spidey.com' && data.password === 'password') {
                    return {
                        success: true,
                        accessToken: 'mock_jwt_token_' + Date.now(),
                        user: {
                            id: '1',
                            name: 'Demo User',
                            email: data.email,
                            downloadCount: 42,
                            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                            preferences: {
                                theme: 'dark',
                                quality: 'high'
                            }
                        }
                    };
                } else {
                    return {
                        success: false,
                        error: 'Invalid email or password'
                    };
                }

            case '/api/auth/register':
                return {
                    success: true,
                    message: 'Registration successful! Please check your email for verification.'
                };

            case '/api/auth/verify':
                return { success: true };

            default:
                return { success: false, error: 'Unknown endpoint' };
        }
    }

    showToast(message, type = 'success') {
        // Use existing toast system or create simple one
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            // Fallback toast
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            alert(message); // Simple fallback
        }
    }

    // Public methods
    getUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    isAuthenticated() {
        return !!this.currentUser && !!this.token;
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            this.showModal('login');
            throw new Error('Authentication required');
        }
    }
}

// Enhanced Toast System
class ToastSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
        window.showToast = this.show.bind(this);
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'success', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-header">
                <div class="toast-title">
                    <i class="toast-icon ${icons[type]}"></i>
                    <span>${this.capitalize(type)}</span>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="toast-message">${message}</div>
            <div class="toast-progress"></div>
        `;

        this.container.appendChild(toast);

        // Add event listeners
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        // Auto remove
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Pause on hover
        toast.addEventListener('mouseenter', () => {
            clearTimeout(autoRemove);
            toast.querySelector('.toast-progress').style.animationPlayState = 'paused';
        });

        toast.addEventListener('mouseleave', () => {
            toast.querySelector('.toast-progress').style.animationPlayState = 'running';
            setTimeout(() => this.removeToast(toast), duration);
        });
    }

    removeToast(toast) {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize everything
function initializeAuthSystem() {
    // Initialize toast system first
    window.toastSystem = new ToastSystem();
    
    // Initialize auth system
    window.authSystem = new AuthSystem();
    
    console.log('🚀 Advanced authentication system ready!');
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthSystem);
} else {
    initializeAuthSystem();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthSystem, ToastSystem };
}