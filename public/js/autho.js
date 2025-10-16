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
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.setupEventListeners();
        this.setupPasswordToggle();
        this.checkAuthStatus();
        this.isInitialized = true;
        console.log('✅ Advanced auth system initialized');
    }

    setupEventListeners() {
        // Auth button click handlers
        document.addEventListener('click', (e) => {
            this.handleAuthClicks(e);
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Close modals on outside click and escape key
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) {
                this.hideAllModals();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
                this.hideUserDropdown();
            }
        });

        // Batch mode toggle
        const batchMode = document.getElementById('batchMode');
        if (batchMode) {
            batchMode.addEventListener('change', (e) => {
                this.toggleBatchMode(e.target.checked);
            });
        }

        // Batch URLs counter
        const batchUrls = document.getElementById('batchUrls');
        if (batchUrls) {
            batchUrls.addEventListener('input', (e) => {
                this.updateUrlCount(e.target.value);
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    handleAuthClicks(e) {
        const target = e.target;
        
        // Login button
        if (target.id === 'loginBtn' || target.closest('#loginBtn')) {
            e.preventDefault();
            this.showModal('login');
        }
        
        // Register button
        if (target.id === 'registerBtn' || target.closest('#registerBtn')) {
            e.preventDefault();
            this.showModal('register');
        }
        
        // User avatar / dropdown
        if (target.id === 'userAvatar' || target.closest('#userAvatar')) {
            e.preventDefault();
            this.toggleUserDropdown();
        }
        
        // Profile button
        if (target.id === 'profileBtn' || target.closest('#profileBtn')) {
            e.preventDefault();
            this.showModal('profile');
        }
        
        // Close buttons
        if (target.classList.contains('close-auth') || target.closest('.close-auth')) {
            e.preventDefault();
            this.hideAllModals();
        }
        
        // Switch auth modals
        if (target.classList.contains('switch-auth') || target.closest('.switch-auth')) {
            e.preventDefault();
            const targetModal = target.dataset.target;
            this.showModal(targetModal);
        }
        
        // Forgot password
        if (target.classList.contains('forgot-password') || target.closest('.forgot-password')) {
            e.preventDefault();
            this.showToast('Password reset feature coming soon!', 'info');
        }
        
        // Logout buttons
        if (target.id === 'logoutBtn' || target.closest('#logoutBtn') || 
            target.id === 'dropdownLogoutBtn' || target.closest('#dropdownLogoutBtn')) {
            e.preventDefault();
            this.logout();
        }
        
        // Clear button
        if (target.id === 'clearBtn' || target.closest('#clearBtn')) {
            e.preventDefault();
            this.clearUrlInput();
        }
        
        // Example chips
        if (target.classList.contains('example-chip') || target.closest('.example-chip')) {
            e.preventDefault();
            const chip = target.classList.contains('example-chip') ? target : target.closest('.example-chip');
            const url = chip.dataset.url;
            this.fillExampleUrl(url);
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

    setupPasswordToggle() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('toggle-password') || e.target.closest('.toggle-password')) {
                const button = e.target.classList.contains('toggle-password') ? e.target : e.target.closest('.toggle-password');
                const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
                
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

    showModal(modalType) {
        console.log(`📱 Showing ${modalType} modal`);
        this.hideAllModals();
        this.hideUserDropdown();
        
        const modal = document.getElementById(`${modalType}Modal`);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    hideAllModals() {
        document.querySelectorAll('.auth-modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        document.body.style.overflow = '';
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

        // Basic validation
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        try {
            this.setLoadingState(submitBtn, true);

            // Demo login - Replace with actual API call
            if (email === 'demo@spidey.com' && password === 'password') {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                this.currentUser = {
                    id: '1',
                    name: 'Demo User',
                    email: email,
                    downloadCount: 42,
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    preferences: {
                        theme: 'dark',
                        quality: 'high'
                    }
                };
                
                this.token = 'demo_token_' + Date.now();
                localStorage.setItem('spidey_token', this.token);
                localStorage.setItem('spidey_user', JSON.stringify(this.currentUser));
                
                this.hideAllModals();
                this.updateUI();
                this.showToast(`Welcome back, ${this.currentUser.name}! 🎉`, 'success');
                form.reset();
            } else {
                throw new Error('Invalid email or password');
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

        if (!this.isValidEmail(email)) {
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

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.hideAllModals();
            this.showToast('Account created successfully! Welcome to SPIDEY OFFICIAL! 🎉', 'success');
            
            form.reset();
            
            // Auto switch to login
            setTimeout(() => {
                this.showModal('login');
            }, 2000);
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

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    checkAuthStatus() {
        const token = localStorage.getItem('spidey_token');
        const userData = localStorage.getItem('spidey_user');

        if (token && userData) {
            try {
                this.token = token;
                this.currentUser = JSON.parse(userData);
                this.updateUI();
                console.log('✅ User authenticated:', this.currentUser.name);
            } catch (error) {
                console.error('Auth data corrupted:', error);
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
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileDownloads = document.getElementById('profileDownloads');
        const profileMemberSince = document.getElementById('profileMemberSince');

        if (this.currentUser) {
            // User is logged in
            if (authButtons) authButtons.classList.add('hidden');
            if (userMenu) userMenu.classList.remove('hidden');
            if (userGreeting) userGreeting.textContent = this.currentUser.name.split(' ')[0];
            
            // Update profile modal
            if (profileName) profileName.textContent = this.currentUser.name;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;
            if (profileDownloads) profileDownloads.textContent = this.currentUser.downloadCount || '0';
            
            if (profileMemberSince && this.currentUser.createdAt) {
                const joinDate = new Date(this.currentUser.createdAt);
                const daysSince = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
                profileMemberSince.textContent = daysSince;
            }
        } else {
            // User is not logged in
            if (authButtons) authButtons.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('spidey_token');
        localStorage.removeItem('spidey_user');
        
        this.hideAllModals();
        this.hideUserDropdown();
        this.updateUI();
        
        this.showToast('Logged out successfully', 'success');
        console.log('🚪 User logged out');
    }

    // Download-related methods
    toggleBatchMode(enabled) {
        const batchInputs = document.getElementById('batchInputs');
        const urlInput = document.getElementById('instagramUrl');
        
        if (batchInputs) {
            if (enabled) {
                batchInputs.classList.remove('hidden');
                if (urlInput) urlInput.placeholder = "Or paste single URL here...";
            } else {
                batchInputs.classList.add('hidden');
                if (urlInput) urlInput.placeholder = "Paste Instagram URL here...";
            }
        }
    }

    updateUrlCount(text) {
        const urlCount = document.getElementById('urlCount');
        if (urlCount) {
            const urls = text.trim().split('\n').filter(url => url.trim().length > 0);
            urlCount.textContent = urls.length;
        }
    }

    clearUrlInput() {
        const urlInput = document.getElementById('instagramUrl');
        if (urlInput) {
            urlInput.value = '';
            urlInput.focus();
        }
    }

    fillExampleUrl(url) {
        const urlInput = document.getElementById('instagramUrl');
        if (urlInput) {
            urlInput.value = url;
            urlInput.focus();
            this.showToast('Example URL filled! Click Download to test.', 'info');
        }
    }

    showToast(message, type = 'success') {
        // Use existing toast system or create simple one
        if (window.toastSystem) {
            window.toastSystem.show(message, type);
        } else {
            // Simple fallback
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
            alert(message);
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
}

// Toast System
class ToastSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
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
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
    }

    removeToast(toast) {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
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

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize toast system
    window.toastSystem = new ToastSystem();
    
    // Initialize auth system
    window.authSystem = new AuthSystem();
    
    // Update current year
    const currentYear = document.getElementById('currentYear');
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
    
    console.log('🚀 SPIDEY OFFICIAL fully loaded!');
});

// Demo data for testing
window.demoAuth = {
    login: {
        email: 'demo@spidey.com',
        password: 'password'
    }
};