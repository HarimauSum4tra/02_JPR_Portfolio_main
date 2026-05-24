// ============================================
// DARK MODE FUNCTIONALITY
// ============================================

class DarkMode {
    constructor() {
        this.toggleBtn = document.querySelector('.dark-mode-toggle');
        this.isDark = localStorage.getItem('darkMode') === 'true';
        this.init();
    }
    
    init() {
        if (this.isDark) {
            document.body.classList.add('dark-mode');
            this.updateIcon(true);
        }
        
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggle());
        }
    }
    
    toggle() {
        this.isDark = !this.isDark;
        document.body.classList.toggle('dark-mode', this.isDark);
        localStorage.setItem('darkMode', this.isDark);
        this.updateIcon(this.isDark);
        this.animateTransition();
    }
    
    updateIcon(isDark) {
        if (this.toggleBtn) {
            this.toggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }
    
    animateTransition() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.isDark ? '#1a1a2e' : '#f9fbfd'};
            pointer-events: none;
            z-index: 9999;
            animation: fadeOut 0.5s ease forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 1; }
                100% { opacity: 0; visibility: hidden; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 500);
    }
}

// Initialize dark mode
document.addEventListener('DOMContentLoaded', () => {
    new DarkMode();
});