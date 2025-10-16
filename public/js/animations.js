// Advanced Animation System for SPIDEY OFFICIAL
class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.scrollAnimations = [];
        this.init();
    }

    init() {
        this.setupLoadingAnimation();
        this.setupScrollAnimations();
        this.setupHoverAnimations();
        this.setupTypewriterEffects();
        this.setupCounterAnimations();
    }

    setupLoadingAnimation() {
        const loadingScreen = document.getElementById('loading-screen');
        
        // Simulate loading process
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                this.triggerEntranceAnimations();
            }, 500);
        }, 2000);
    }

    triggerEntranceAnimations() {
        // Stagger animation for feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;
            }, 500);
        });

        // Animate stats cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = `slideInLeft 0.6s ease ${index * 0.1}s both`;
            }, 800);
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    this.animateOnScroll(entry.target);
                }
            });
        }, observerOptions);

        // Observe all elements with reveal class
        document.querySelectorAll('.reveal').forEach(el => {
            observer.observe(el);
        });
    }

    animateOnScroll(element) {
        const animationType = element.dataset.animation || 'fadeInUp';
        element.style.animation = `${animationType} 0.8s ease both`;
    }

    setupHoverAnimations() {
        // Button hover effects
        const buttons = document.querySelectorAll('.download-btn, .action-btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                this.createRippleEffect(e);
            });
            
            button.addEventListener('click', (e) => {
                this.createClickEffect(e);
            });
        });

        // Card hover effects
        const cards = document.querySelectorAll('.feature-card, .stat-card, .media-item');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.enhanceCard(card);
            });
            
            card.addEventListener('mouseleave', () => {
                this.resetCard(card);
            });
        });
    }

    createRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    createClickEffect(event) {
        const element = event.currentTarget;
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }

    enhanceCard(card) {
        card.style.transform = 'translateY(-10px) scale(1.02)';
        card.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.7)';
    }

    resetCard(card) {
        card.style.transform = '';
        card.style.boxShadow = '';
    }

    setupTypewriterEffects() {
        const elements = document.querySelectorAll('.typewriter');
        elements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            element.style.borderRight = '2px solid var(--primary)';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                } else {
                    element.style.borderRight = 'none';
                }
            };
            
            setTimeout(typeWriter, 1000);
        });
    }

    setupCounterAnimations() {
        const counters = document.querySelectorAll('.stat-number');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.textContent);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 16);
    }

    // Advanced animation methods
    createParticleExplosion(x, y, color = '#ff3e6c') {
        for (let i = 0; i < 10; i++) {
            this.createParticle(x, y, color);
        }
    }

    createParticle(x, y, color) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 4px;
            height: 4px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(particle);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        let opacity = 1;
        const animate = () => {
            opacity -= 0.02;
            particle.style.opacity = opacity;
            particle.style.transform = `translate(${vx * 10}px, ${vy * 10}px) scale(${opacity})`;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        animate();
    }

    // Text animation effects
    textWave(element) {
        const text = element.textContent;
        element.textContent = '';
        
        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char;
            span.style.animation = `wave 0.5s ease ${index * 0.1}s both`;
            element.appendChild(span);
        });
    }

    // Background gradient animation
    animateBackground() {
        const colors = [
            'linear-gradient(135deg, #ff3e6c 0%, #6366f1 100%)',
            'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            'linear-gradient(135deg, #10b981 0%, #ff3e6c 100%)'
        ];
        
        let currentIndex = 0;
        
        setInterval(() => {
            document.body.style.background = colors[currentIndex];
            currentIndex = (currentIndex + 1) % colors.length;
        }, 5000);
    }
}

// CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes wave {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
`;
document.head.appendChild(style);

// Initialize animation manager
document.addEventListener('DOMContentLoaded', () => {
    window.animationManager = new AnimationManager();
});