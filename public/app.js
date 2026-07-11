let slides = [];
let currentSlide = 0;
let totalSlides = 0;
let controlsTimeout = null;
let isControlsVisible = false;
let autoScrollInterval = null;

// DOM Elements
const slideContent = document.getElementById('slideContent');
const slideCounter = document.getElementById('slideCounter');
const slideTitle = document.getElementById('slideTitle');
const progressFill = document.getElementById('progressFill');
const slideDots = document.getElementById('slideDots');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const controlsOverlay = document.getElementById('controlsOverlay');
const hint = document.querySelector('.hint');

// Fetch slides
async function loadPresentation() {
    try {
        const response = await fetch('/api/slides/osi');
        const data = await response.json();
        
        slides = data.slides;
        totalSlides = data.totalSlides;
        
        if (slides.length === 0) {
            throw new Error('No slides found');
        }
        
        renderSlide(0);
        updateUI();
        showControls();
        startAutoHideTimer();
        
    } catch (error) {
        console.error('Error loading presentation:', error);
        slideContent.innerHTML = `
            <div style="text-align:center;color:#666;padding:40px;">
                <h2 style="color:#888;margin-bottom:1rem;">⚠️ خطا در بارگذاری</h2>
                <p>${error.message}</p>
                <p style="font-size:0.9rem;margin-top:1rem;opacity:0.6;">مطمئن شوید سرور در حال اجراست</p>
            </div>
        `;
    }
}

// Check if content is scrollable
function checkScrollable() {
    const isScrollable = slideContent.scrollHeight > slideContent.clientHeight;
    if (isScrollable) {
        slideContent.classList.add('scrollable');
    } else {
        slideContent.classList.remove('scrollable');
    }
    return isScrollable;
}

// Render a slide
function renderSlide(index) {
    if (!slides[index]) return;
    
    // Parse markdown to HTML
    const html = marked.parse(slides[index]);
    slideContent.innerHTML = html;
    
    // Reset scroll position to top
    slideContent.scrollTop = 0;
    
    // Extract title from first heading
    const firstHeading = slides[index].match(/^#+\s+(.+)$/m);
    if (firstHeading) {
        slideTitle.textContent = firstHeading[1].replace(/\*\*/g, '').replace(/_/g, '');
    } else {
        slideTitle.textContent = `اسلاید ${index + 1}`;
    }
    
    // Update counter
    slideCounter.textContent = `${index + 1} / ${totalSlides}`;
    
    // Update progress
    progressFill.style.width = `${((index + 1) / totalSlides) * 100}%`;
    
    // Update dots
    document.querySelectorAll('.slide-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    // Update buttons
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === totalSlides - 1;
    
    // Re-trigger animation
    slideContent.style.animation = 'none';
    requestAnimationFrame(() => {
        slideContent.style.animation = 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    
    // Check if scrollable after render
    setTimeout(() => {
        checkScrollable();
    }, 100);
    
    // Show controls on slide change
    showControls();
    startAutoHideTimer();
}

// Update UI elements
function updateUI() {
    // Create dots
    slideDots.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('button');
        dot.className = 'slide-dot';
        dot.dataset.index = i;
        dot.addEventListener('click', () => goToSlide(i));
        slideDots.appendChild(dot);
    }
}

// Navigation
function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    currentSlide = index;
    renderSlide(currentSlide);
}

function nextSlide() {
    // If content is scrollable and not at bottom, scroll first
    if (slideContent.classList.contains('scrollable')) {
        const isAtBottom = slideContent.scrollTop + slideContent.clientHeight >= slideContent.scrollHeight - 10;
        if (!isAtBottom) {
            slideContent.scrollTo({
                top: slideContent.scrollTop + slideContent.clientHeight * 0.7,
                behavior: 'smooth'
            });
            showControls();
            startAutoHideTimer();
            return;
        }
    }
    
    // Otherwise go to next slide
    if (currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
    }
}

function prevSlide() {
    // If scrolled down, scroll up first
    if (slideContent.scrollTop > 10) {
        slideContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        showControls();
        startAutoHideTimer();
        return;
    }
    
    // Otherwise go to previous slide
    if (currentSlide > 0) {
        goToSlide(currentSlide - 1);
    }
}

// Controls visibility
function showControls() {
    controlsOverlay.classList.add('visible');
    isControlsVisible = true;
    hint.classList.add('hidden');
    clearTimeout(controlsTimeout);
}

function hideControls() {
    controlsOverlay.classList.remove('visible');
    isControlsVisible = false;
    setTimeout(() => {
        hint.classList.remove('hidden');
    }, 500);
}

function startAutoHideTimer() {
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
        if (isControlsVisible) {
            hideControls();
        }
    }, 3000);
}

// Toggle controls on user interaction
function toggleControls() {
    if (isControlsVisible) {
        hideControls();
    } else {
        showControls();
        startAutoHideTimer();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
        showControls();
        startAutoHideTimer();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
        showControls();
        startAutoHideTimer();
    } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
    } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    } else if (e.key === 'Home') {
        goToSlide(0);
        showControls();
        startAutoHideTimer();
    } else if (e.key === 'End') {
        goToSlide(totalSlides - 1);
        showControls();
        startAutoHideTimer();
    }
});

// Mouse/Touch events for controls
document.addEventListener('mousemove', () => {
    showControls();
    startAutoHideTimer();
});

document.addEventListener('touchstart', () => {
    showControls();
    startAutoHideTimer();
});

// Click on slide content to toggle controls
slideContent.addEventListener('click', toggleControls);

// Progress bar click to navigate
document.querySelector('.progress-bar').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const targetSlide = Math.floor(percentage * totalSlides);
    goToSlide(Math.min(targetSlide, totalSlides - 1));
    showControls();
    startAutoHideTimer();
});

// Fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.textContent = '⛶';
    } else {
        document.exitFullscreen();
        fullscreenBtn.textContent = '⛶';
    }
}

fullscreenBtn.addEventListener('click', toggleFullscreen);

// Button events
prevBtn.addEventListener('click', () => {
    prevSlide();
    showControls();
    startAutoHideTimer();
});

nextBtn.addEventListener('click', () => {
    nextSlide();
    showControls();
    startAutoHideTimer();
});

// Touch support for mobile swipe
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Only trigger horizontal swipe if horizontal movement > vertical
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
            showControls();
            startAutoHideTimer();
        }
    }
});

// Mouse wheel for scrolling within slide
let wheelTimeout = null;
slideContent.addEventListener('wheel', (e) => {
    // If content is scrollable, let it scroll naturally
    if (slideContent.classList.contains('scrollable')) {
        // Check if at top or bottom to navigate slides
        const isAtTop = slideContent.scrollTop === 0;
        const isAtBottom = slideContent.scrollTop + slideContent.clientHeight >= slideContent.scrollHeight - 5;
        
        // Only navigate if at boundaries and wheel direction would go further
        if (isAtTop && e.deltaY < 0) {
            e.preventDefault();
            prevSlide();
        } else if (isAtBottom && e.deltaY > 0) {
            e.preventDefault();
            nextSlide();
        }
        
        showControls();
        startAutoHideTimer();
        
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            checkScrollable();
        }, 500);
    }
}, { passive: false });

// Check scrollable on resize
window.addEventListener('resize', () => {
    checkScrollable();
});

// Start
loadPresentation();