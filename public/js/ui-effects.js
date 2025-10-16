// Advanced UI Effects and Interactions
class UIEffects {
    constructor() {
        this.notificationQueue = [];
        this.isShowingNotification = false;
        this.init();
    }

    init() {
        this.setupInputEffects();
        this.setupNotificationSystem();
        this.setupTooltips();
        this.setupParallaxEffects();
        this.setupCustomCursor();
        this.setupAudioEffects();
    }

    setupInputEffects() {
        const inputs = document.querySelectorAll('.url-input');
        
        inputs.forEach(input => {
            // Focus effect
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
                this.animateInputFocus(input);
            });
            
            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
            });
            
            // Input validation effect
            input.addEventListener('input', (e) => {
                this.validateInput(e.target);
            });
            
            // Paste effect
            input.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.animateInputPaste(input);
                }, 10);
            });
        });

        // Clear button effects
        const clearButtons = document.querySelectorAll('.clear-btn');
        clearButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.closest('.input-container').querySelector('.url-input');
                input.value = '';
                input.focus();
                this.animateInputClear(input);
            });
        });
    }

    animateInputFocus(input) {
        input.style.transform = 'scale(1.02)';
        setTimeout(() => {
            input.style.transform = '';
        }, 200);
    }

    animateInputPaste(input) {
        input.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        setTimeout(() => {
            input.style.backgroundColor = '';
        }, 1000);
    }

    animateInputClear(input) {
        input.style.transform = 'scale(0.98)';
        setTimeout(() => {
            input.style.transform = '';
        }, 150);
    }

    validateInput(input) {
        const value = input.value.trim();
        const isValid = value.includes('instagram.com') || value.includes('instagr.am');
        
        if (value && !isValid) {
            input.classList.add('error-state');
        } else {
            input.classList.remove('error-state');
        }
        
        if (isValid) {
            input.classList.add('success-state');
        } else {
            input.classList.remove('success-state');
        }
    }

    setupNotificationSystem() {
        this.notificationElement = document.getElementById('notification');
        this.notificationIcon = this.notificationElement.querySelector('.notification-icon');
        this.notificationMessage = this.notificationElement.querySelector('.notification-message');
        this.notificationClose = this.notificationElement.querySelector('.notification-close');
        
        this.notificationClose.addEventListener('click', () => {
            this.hideNotification();
        });
    }

    showNotification(message, type = 'success', duration = 5000) {
        const notification = { message, type, duration };
        this.notificationQueue.push(notification);
        
        if (!this.isShowingNotification) {
            this.processNotificationQueue();
        }
    }

    processNotificationQueue() {
        if (this.notificationQueue.length === 0) {
            this.isShowingNotification = false;
            return;
        }
        
        this.isShowingNotification = true;
        const { message, type, duration } = this.notificationQueue.shift();
        
        this.displayNotification(message, type);
        
        setTimeout(() => {
            this.hideNotification();
            setTimeout(() => this.processNotificationQueue(), 500);
        }, duration);
    }

    displayNotification(message, type) {
        this.notificationElement.className = `notification ${type} show`;
        this.notificationMessage.textContent = message;
        
        // Add appropriate icon
        const iconClass = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle'
        }[type];
        
        this.notificationIcon.className = `notification-icon ${iconClass}`;
    }

    hideNotification() {
        this.notificationElement.classList.remove('show');
    }

    setupTooltips() {
        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        document.body.appendChild(this.tooltip);
        
        // Add tooltips to elements with data-tooltip attribute
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => this.showTooltip(e));
            element.addEventListener('mouseleave', () => this.hideTooltip());
        });
    }

    showTooltip(event) {
        const element = event.currentTarget;
        const tooltipText = element.dataset.tooltip;
        
        this.tooltip.textContent = tooltipText;
        this.tooltip.style.display = 'block';
        
        const rect = element.getBoundingClientRect();
        this.tooltip.style.left = rect.left + (rect.width / 2) + 'px';
        this.tooltip.style.top = rect.top - 10 + 'px';
        this.tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    setupParallaxEffects() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax');
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    setupCustomCursor() {
        if (window.matchMedia('(pointer: fine)').matches) {
            const cursor = document.createElement('div');
            cursor.className = 'custom-cursor';
            document.body.appendChild(cursor);
            
            const follower = document.createElement('div');
            follower.className = 'cursor-follower';
            document.body.appendChild(follower);
            
            document.addEventListener('mousemove', (e) => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
                
                setTimeout(() => {
                    follower.style.left = e.clientX + 'px';
                    follower.style.top = e.clientY + 'px';
                }, 100);
            });
            
            // Change cursor on interactive elements
            const interactiveElements = document.querySelectorAll('button, a, .clickable');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    cursor.classList.add('hover');
                    follower.classList.add('hover');
                });
                
                el.addEventListener('mouseleave', () => {
                    cursor.classList.remove('hover');
                    follower.classList.remove('hover');
                });
            });
        }
    }

    setupAudioEffects() {
        // Create audio context for sound effects
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Preload click sound
        this.clickSound = this.createClickSound();
    }

    createClickSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        return { oscillator, gainNode };
    }

    playClickSound() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    // Advanced UI effects
    createConfetti() {
        const colors = ['#ff3e6c', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                this.createConfettiPiece(colors);
            }, i * 20);
        }
    }

    createConfettiPiece(colors) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -10px;
            left: ${Math.random() * 100}vw;
            border-radius: 2px;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(confetti);
        
        const animation = confetti.animate([
            { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 2000 + Math.random() * 1000,
            easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
        });
        
        animation.onfinish = () => confetti.remove();
    }

    // Text effect: Glitch text
    glitchText(element, duration = 1000) {
        const originalText = element.textContent;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let startTime = Date.now();
        
        const glitch = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                let glitchedText = '';
                for (let i = 0; i < originalText.length; i++) {
                    if (Math.random() < progress * 0.3) {
                        glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    } else {
                        glitchedText += originalText[i];
                    }
                }
                element.textContent = glitchedText;
                requestAnimationFrame(glitch);
            } else {
                element.textContent = originalText;
            }
        };
        
        glitch();
    }

    // Particle trail effect
    createParticleTrail(x, y) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createTrailParticle(x, y);
            }, i * 50);
        }
    }

    createTrailParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'trail-particle';
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 4px;
            height: 4px;
            background: #ff3e6c;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(particle);
        
        const animate = () => {
            particle.style.opacity -= 0.02;
            particle.style.transform = `scale(${particle.style.opacity})`;
            
            if (parseFloat(particle.style.opacity) > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        animate();
    }
}

// Add CSS for custom cursor and tooltips
const uiStyles = document.createElement('style');
uiStyles.textContent = `
    .tooltip {
        position: fixed;
        background: rgba(15, 23, 42, 0.95);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.8rem;
        white-space: nowrap;
        z-index: 1000;
        display: none;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: rgba(15, 23, 42, 0.95);
    }
    
    .custom-cursor {
        position: fixed;
        width: 8px;
        height: 8px;
        background: var(--primary);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        transition: transform 0.1s ease;
    }
    
    .cursor-follower {
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid var(--primary);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        transition: all 0.2s ease;
    }
    
    .custom-cursor.hover,
    .cursor-follower.hover {
        transform: translate(-50%, -50%) scale(1.5);
    }
    
    .confetti {
        animation: fall linear forwards;
    }
    
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(uiStyles);

// Initialize UI Effects
document.addEventListener('DOMContentLoaded', () => {
    window.uiEffects = new UIEffects();
});