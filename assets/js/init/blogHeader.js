/**
 * Blog Header Controls
 * Handles font size controls and localStorage persistence
 */

class BlogHeader {
    constructor() {
        this.STORAGE_KEY = 'blog-font-size';
        this.DEFAULT_SIZE = 'medium';
        this.currentSize = this.DEFAULT_SIZE;
        
        this.init();
    }
    
    init() {
        // Load saved font size from localStorage
        this.loadFontSize();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Apply initial font size
        this.applyFontSize(this.currentSize);
        
        // Update button states
        this.updateButtonStates();
        
        // Header initialized
    }
    
    setupEventListeners() {
        // Font size buttons
        const fontSizeButtons = document.querySelectorAll('.font-size-btn');
        fontSizeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const size = button.getAttribute('data-size');
                this.setFontSize(size);
            });
        });
        
        // Keyboard shortcuts (optional)
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Plus/Minus for font size
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    this.increaseFontSize();
                } else if (e.key === '-') {
                    e.preventDefault();
                    this.decreaseFontSize();
                }
            }
        });
    }
    
    loadFontSize() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved && ['small', 'medium', 'large'].includes(saved)) {
                this.currentSize = saved;
            }
        } catch (error) {
            console.warn('Failed to load font size from localStorage:', error);
            this.currentSize = this.DEFAULT_SIZE;
        }
    }
    
    saveFontSize(size) {
        try {
            localStorage.setItem(this.STORAGE_KEY, size);
        } catch (error) {
            console.warn('Failed to save font size to localStorage:', error);
        }
    }
    
    setFontSize(size) {
        if (!['small', 'medium', 'large'].includes(size)) {
            console.warn('Invalid font size:', size);
            return;
        }
        
        this.currentSize = size;
        this.applyFontSize(size);
        this.updateButtonStates();
        this.saveFontSize(size);
        
        // Trigger custom event for other components
        document.dispatchEvent(new CustomEvent('fontSizeChanged', {
            detail: { size: size }
        }));
    }
    
    applyFontSize(size) {
        const body = document.body;
        const container = document.querySelector('.container-main');
        
        // Remove existing font size classes
        ['font-size-small', 'font-size-medium', 'font-size-large'].forEach(cls => {
            body.classList.remove(cls);
            if (container) container.classList.remove(cls);
        });
        
        // Add new font size class
        const newClass = `font-size-${size}`;
        body.classList.add(newClass);
        if (container) container.classList.add(newClass);
    }
    
    updateButtonStates() {
        const buttons = document.querySelectorAll('.font-size-btn');
        buttons.forEach(button => {
            const buttonSize = button.getAttribute('data-size');
            if (buttonSize === this.currentSize) {
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }
    
    increaseFontSize() {
        const sizes = ['small', 'medium', 'large'];
        const currentIndex = sizes.indexOf(this.currentSize);
        if (currentIndex < sizes.length - 1) {
            this.setFontSize(sizes[currentIndex + 1]);
        }
    }
    
    decreaseFontSize() {
        const sizes = ['small', 'medium', 'large'];
        const currentIndex = sizes.indexOf(this.currentSize);
        if (currentIndex > 0) {
            this.setFontSize(sizes[currentIndex - 1]);
        }
    }
    
    getCurrentSize() {
        return this.currentSize;
    }
    
    // Removed sticky and progress functionality
    
    // Public API
    static init() {
        // Only initialize on blog post pages
        if (document.querySelector('.blog-header')) {
            return new BlogHeader();
        }
        return null;
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        BlogHeader.init();
    });
} else {
    BlogHeader.init();
}

// Export for other modules
export default BlogHeader; 