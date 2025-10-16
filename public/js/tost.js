// Toast Notification System
class ToastSystem {
    constructor() {
        this.container = null;
        this.toasts = new Set();
        this.init();
    }

    init() {
        this.createContainer();
        window.showToast = this.show.bind(this);
    }

    createContainer() {
        // Remove existing container if any
        const existing = document.getElementById('toastContainer');
        if (existing) {
            existing.remove();
        }

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
        this.toasts.add(toast);

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
            const progress = toast.querySelector('.toast-progress');
            if (progress) progress.style.animationPlayState = 'paused';
        });

        toast.addEventListener('mouseleave', () => {
            const progress = toast.querySelector('.toast-progress');
            if (progress) progress.style.animationPlayState = 'running';
            setTimeout(() => this.removeToast(toast), duration);
        });

        return toast;
    }

    removeToast(toast) {
        if (!toast.parentNode) return;
        
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toast);
        }, 300);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    clearAll() {
        this.toasts.forEach(toast => {
            this.removeToast(toast);
        });
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.toastSystem = new ToastSystem();
    });
} else {
    window.toastSystem = new ToastSystem();
}