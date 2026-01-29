// Mobile menu toggle
function toggleMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    const scrollTop = document.querySelector('.scroll-top');
    if (window.pageYOffset > 300) {
        scrollTop.classList.add('visible');
    } else {
        scrollTop.classList.remove('visible');
    }
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// Form submission
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // Show success message (in production, this would send to a server)
    alert('Thank you for your message! We will get back to you soon.');
    this.reset();
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile menu if open
            document.querySelector('.nav-links').classList.remove('active');
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.pageYOffset > 50) {
        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
    }
});

// ============================================
// Infinite Slider - Show 3, Slide by 1
// ============================================

class InfiniteSlider {
    constructor(containerId, trackId, dotsId, sliderType) {
        this.container = document.getElementById(containerId);
        this.track = document.getElementById(trackId);
        this.dotsContainer = document.getElementById(dotsId);
        this.sliderType = sliderType;
        
        this.originalCards = Array.from(this.track.children);
        this.totalOriginal = this.originalCards.length;
        this.visibleCount = 3; // Show 3 cards
        this.slideBy = 1; // Slide by 1
        
        this.currentIndex = 0;
        this.isDragging = false;
        this.startX = 0;
        this.currentTranslate = 0;
        this.prevTranslate = 0;
        this.animationID = null;
        this.startTime = 0;
        
        this.gap = 32; // 2rem gap
        this.cardWidth = 0;
        this.slideWidth = 0;
        
        this.init();
    }
    
    init() {
        this.setupInfiniteLoop();
        this.calculateDimensions();
        this.createDots();
        this.setupEventListeners();
        this.goToSlide(0, false);
        
        // Recalculate on resize
        window.addEventListener('resize', () => {
            this.calculateDimensions();
            this.updateVisibleCount();
            this.createDots();
            this.goToSlide(this.currentIndex, false);
        });
    }
    
    setupInfiniteLoop() {
        // Clone cards for infinite effect
        // Clone last few cards and prepend, clone first few cards and append
        const cloneCount = this.visibleCount + 1;
        
        // Clone and prepend last cards
        for (let i = this.totalOriginal - 1; i >= Math.max(0, this.totalOriginal - cloneCount); i--) {
            const clone = this.originalCards[i].cloneNode(true);
            clone.classList.add('clone');
            this.track.insertBefore(clone, this.track.firstChild);
        }
        
        // Clone and append first cards
        for (let i = 0; i < Math.min(cloneCount, this.totalOriginal); i++) {
            const clone = this.originalCards[i].cloneNode(true);
            clone.classList.add('clone');
            this.track.appendChild(clone);
        }
        
        this.allCards = Array.from(this.track.children);
        this.clonesBefore = Math.min(cloneCount, this.totalOriginal);
    }
    
    calculateDimensions() {
        const containerWidth = this.container.offsetWidth;
        this.updateVisibleCount();
        
        // Calculate card width based on container and visible count
        this.cardWidth = (containerWidth - (this.gap * (this.visibleCount - 1))) / this.visibleCount;
        this.slideWidth = this.cardWidth + this.gap;
        
        // Set card widths
        this.allCards.forEach(card => {
            card.style.minWidth = `${this.cardWidth}px`;
            card.style.width = `${this.cardWidth}px`;
        });
    }
    
    updateVisibleCount() {
        const containerWidth = this.container.offsetWidth;
        if (containerWidth < 600) {
            this.visibleCount = 1;
        } else if (containerWidth < 900) {
            this.visibleCount = 2;
        } else {
            this.visibleCount = 3;
        }
    }
    
    createDots() {
        this.dotsContainer.innerHTML = '';
        
        for (let i = 0; i < this.totalOriginal; i++) {
            const dot = document.createElement('button');
            dot.classList.add('slider-dot');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.addEventListener('click', () => this.goToSlide(i));
            this.dotsContainer.appendChild(dot);
        }
        
        this.updateDots();
    }
    
    setupEventListeners() {
        // Mouse events
        this.container.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Touch events
        this.container.addEventListener('touchstart', (e) => this.startDrag(e), { passive: true });
        this.container.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
        this.container.addEventListener('touchend', () => this.endDrag());
        
        // Arrow buttons
        const prevBtn = document.querySelector(`[data-slider="${this.sliderType}"].slider-prev`);
        const nextBtn = document.querySelector(`[data-slider="${this.sliderType}"].slider-next`);
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        
        // Prevent click during drag
        this.container.addEventListener('click', (e) => {
            if (this.wasDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.wasDragging = false;
        this.container.classList.add('dragging');
        
        this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        this.startTime = Date.now();
        this.prevTranslate = this.currentTranslate;
        
        cancelAnimationFrame(this.animationID);
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const diff = currentX - this.startX;
        
        if (Math.abs(diff) > 5) {
            this.wasDragging = true;
            if (e.cancelable) e.preventDefault();
        }
        
        this.currentTranslate = this.prevTranslate + diff;
        this.setTransform(this.currentTranslate);
    }
    
    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.container.classList.remove('dragging');
        
        const movedBy = this.currentTranslate - this.prevTranslate;
        const timeTaken = Date.now() - this.startTime;
        const velocity = Math.abs(movedBy / timeTaken);
        
        // Determine direction and whether to change slide
        const threshold = this.slideWidth * 0.2;
        const velocityThreshold = 0.3;
        
        let slideChange = 0;
        
        if (Math.abs(movedBy) > threshold || velocity > velocityThreshold) {
            if (movedBy < 0) {
                slideChange = this.slideBy; // Next
            } else {
                slideChange = -this.slideBy; // Previous
            }
        }
        
        this.goToSlide(this.currentIndex + slideChange);
    }
    
    setTransform(value) {
        this.track.style.transform = `translateX(${value}px)`;
    }
    
    goToSlide(index, animate = true) {
        // Handle infinite loop boundaries
        let targetIndex = index;
        
        if (index < 0) {
            targetIndex = this.totalOriginal - 1;
        } else if (index >= this.totalOriginal) {
            targetIndex = 0;
        }
        
        this.currentIndex = targetIndex;
        
        // Calculate position including clones offset
        const position = -((this.currentIndex + this.clonesBefore) * this.slideWidth);
        
        if (animate) {
            this.track.style.transition = 'transform 0.5s ease';
        } else {
            this.track.style.transition = 'none';
        }
        
        this.currentTranslate = position;
        this.setTransform(position);
        
        this.updateDots();
        
        // Reset transition after animation
        if (animate) {
            setTimeout(() => {
                this.track.style.transition = 'none';
            }, 500);
        }
    }
    
    next() {
        this.goToSlide(this.currentIndex + this.slideBy);
    }
    
    prev() {
        this.goToSlide(this.currentIndex - this.slideBy);
    }
    
    updateDots() {
        const dots = this.dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === this.currentIndex);
        });
    }
}

// Initialize sliders when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Services slider
    new InfiniteSlider('services-slider', 'services-track', 'services-dots', 'services');
    
    // Why Choose Us slider
    new InfiniteSlider('why-slider', 'why-track', 'why-dots', 'why');
});
