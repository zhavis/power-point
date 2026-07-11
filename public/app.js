// ============================================
// PRESENTATION VIEWER WITH URL NAVIGATION
// ============================================

let slides = [];
let currentSlide = 0;
let totalSlides = 0;
let controlsTimeout = null;
let isControlsVisible = false;
let currentPresentation = 'osi';
let availablePresentations = [];
let isNavigatingFromURL = false;
let isExporting = false;

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
const presentationSelector = document.getElementById('presentationSelector');
const presentationTitle = document.getElementById('presentationTitle');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const shareBtn = document.getElementById('shareBtn');

// ============================================
// URL MANAGEMENT
// ============================================

function updateURL(presentation, slide) {
    if (isNavigatingFromURL) return;
    
    const url = new URL(window.location);
    url.searchParams.set('p', presentation);
    url.searchParams.set('s', slide);
    window.history.pushState({ presentation, slide }, '', url);
}

function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        presentation: params.get('p') || 'osi',
        slide: parseInt(params.get('s')) || 0
    };
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    const state = event.state || getURLParams();
    isNavigatingFromURL = true;
    
    if (state.presentation && state.presentation !== currentPresentation) {
        currentPresentation = state.presentation;
        loadPresentation(currentPresentation, state.slide || 0);
    } else if (state.slide !== undefined && state.slide !== currentSlide) {
        goToSlide(state.slide);
    }
    
    setTimeout(() => {
        isNavigatingFromURL = false;
    }, 100);
});

// ============================================
// PRESENTATION LOADING
// ============================================

async function loadPresentationsList() {
    try {
        const response = await fetch('/api/presentations');
        const data = await response.json();
        availablePresentations = data.presentations || ['osi'];
        populateSelector();
        
        // Check URL for initial presentation
        const params = getURLParams();
        if (params.presentation && availablePresentations.includes(params.presentation)) {
            currentPresentation = params.presentation;
        } else if (availablePresentations.length > 0) {
            currentPresentation = availablePresentations[0];
        }
        
        // Load the presentation
        await loadPresentation(currentPresentation, params.slide || 0);
        
    } catch (error) {
        console.error('Error loading presentations list:', error);
        // Fallback to default
        await loadPresentation('osi', 0);
    }
}

function populateSelector() {
    if (!presentationSelector) return;
    
    presentationSelector.innerHTML = availablePresentations.map(name => 
        `<option value="${name}">${name.replace(/-/g, ' ').toUpperCase()}</option>`
    ).join('');
    
    presentationSelector.value = currentPresentation;
    presentationSelector.addEventListener('change', (e) => {
        const newPresentation = e.target.value;
        if (newPresentation !== currentPresentation) {
            currentPresentation = newPresentation;
            loadPresentation(currentPresentation, 0);
            updateURL(currentPresentation, 0);
        }
    });
}

async function loadPresentation(presentationName, slideIndex = 0) {
    try {
        const response = await fetch(`/api/slides/${presentationName}`);
        const data = await response.json();
        
        slides = data.slides;
        totalSlides = data.totalSlides;
        
        if (slides.length === 0) {
            throw new Error('No slides found');
        }
        
        // Ensure slide index is valid
        if (slideIndex >= totalSlides) {
            slideIndex = totalSlides - 1;
        }
        if (slideIndex < 0) {
            slideIndex = 0;
        }
        
        currentSlide = slideIndex;
        renderSlide(currentSlide);
        updateUI();
        showControls();
        startAutoHideTimer();
        
        // Update presentation title
        if (presentationTitle) {
            presentationTitle.textContent = presentationName.replace(/-/g, ' ').toUpperCase();
        }
        
        // Update selector
        if (presentationSelector) {
            presentationSelector.value = presentationName;
        }
        
        // Update URL
        updateURL(presentationName, currentSlide);
        
    } catch (error) {
        console.error('Error loading presentation:', error);
        slideContent.innerHTML = `
            <div style="text-align:center;color:#666;padding:40px;">
                <h2 style="color:#888;margin-bottom:1rem;">⚠️ Error Loading</h2>
                <p>${error.message}</p>
                <p style="font-size:0.9rem;margin-top:1rem;opacity:0.6;">Make sure server is running</p>
            </div>
        `;
    }
}

// ============================================
// SLIDE RENDERING
// ============================================

function checkScrollable() {
    const isScrollable = slideContent.scrollHeight > slideContent.clientHeight;
    if (isScrollable) {
        slideContent.classList.add('scrollable');
    } else {
        slideContent.classList.remove('scrollable');
    }
    return isScrollable;
}

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
        slideTitle.textContent = `Slide ${index + 1}`;
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
    
    // Update URL
    updateURL(currentPresentation, index);
    
    // Show controls on slide change
    showControls();
    startAutoHideTimer();
}

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

// ============================================
// NAVIGATION
// ============================================

function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    currentSlide = index;
    renderSlide(currentSlide);
    updateURL(currentPresentation, currentSlide);
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

function switchToNextPresentation() {
    const currentIndex = availablePresentations.indexOf(currentPresentation);
    if (currentIndex < availablePresentations.length - 1) {
        currentPresentation = availablePresentations[currentIndex + 1];
        loadPresentation(currentPresentation, 0);
        updateURL(currentPresentation, 0);
    }
}

function switchToPreviousPresentation() {
    const currentIndex = availablePresentations.indexOf(currentPresentation);
    if (currentIndex > 0) {
        currentPresentation = availablePresentations[currentIndex - 1];
        loadPresentation(currentPresentation, 0);
        updateURL(currentPresentation, 0);
    }
}

// ============================================
// CONTROLS VISIBILITY
// ============================================

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

function toggleControls() {
    if (isControlsVisible) {
        hideControls();
    } else {
        showControls();
        startAutoHideTimer();
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+Left/Right to switch presentations
    if (e.ctrlKey && e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        switchToNextPresentation();
        return;
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        switchToPreviousPresentation();
        return;
    }
    
    // Ctrl+Shift+P for PDF export
    if (e.ctrlKey && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        exportToPDF();
        return;
    }
    
    // Ctrl+Shift+C for share link
    if (e.ctrlKey && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        copyShareableLink();
        return;
    }
    
    // Number keys to jump to slides (1-9)
    if (e.key >= '1' && e.key <= '9') {
        const slideNum = parseInt(e.key) - 1;
        if (slideNum < totalSlides) {
            e.preventDefault();
            goToSlide(slideNum);
            showControls();
            startAutoHideTimer();
        }
        return;
    }
    
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
    } else if (e.key === 'r' || e.key === 'R') {
        // Reload current presentation
        loadPresentation(currentPresentation, currentSlide);
    }
});

// ============================================
// EVENT LISTENERS
// ============================================

// Mouse/Touch events for controls
document.addEventListener('mousemove', () => {
    showControls();
    startAutoHideTimer();
});

document.addEventListener('touchstart', () => {
    showControls();
    startAutoHideTimer();
});

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

// ============================================
// TOUCH SUPPORT
// ============================================

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

// ============================================
// MOUSE WHEEL
// ============================================

let wheelTimeout = null;
slideContent.addEventListener('wheel', (e) => {
    if (slideContent.classList.contains('scrollable')) {
        const isAtTop = slideContent.scrollTop === 0;
        const isAtBottom = slideContent.scrollTop + slideContent.clientHeight >= slideContent.scrollHeight - 5;
        
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

window.addEventListener('resize', () => {
    checkScrollable();
});

// ============================================
// PDF EXPORT FEATURE
// ============================================

// Show loading overlay
function showLoadingOverlay(message = 'Generating PDF...', progress = 0) {
    const overlay = document.getElementById('pdf-loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        const textEl = overlay.querySelector('.progress-text');
        if (textEl) textEl.textContent = message;
        const fillEl = overlay.querySelector('.progress-fill-bar');
        if (fillEl) fillEl.style.width = `${Math.min(progress, 100)}%`;
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('pdf-loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Export to PDF using jsPDF and html2canvas
async function exportToPDF() {
    if (isExporting) return;
    if (!slides || slides.length === 0) {
        alert('No slides to export!');
        return;
    }
    
    isExporting = true;
    const totalSlidesCount = slides.length;
    
    try {
        showLoadingOverlay('📄 Preparing slides...', 0);
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // Create a temporary container for rendering
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: ${contentWidth}mm;
            background: white;
            padding: 10mm;
            font-family: 'Vazirmatn', Arial, sans-serif;
            font-size: 12px;
            color: #333;
            line-height: 1.8;
            z-index: -1;
            direction: rtl;
        `;
        document.body.appendChild(tempContainer);
        
        // Title Page
        showLoadingOverlay('📄 Generating title page...', 5);
        
        tempContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;min-height:250mm;padding:20px;">
                <h1 style="font-size:28px;color:#1a1a2e;margin-bottom:15px;">${currentPresentation.replace(/-/g, ' ').toUpperCase()}</h1>
                <p style="font-size:16px;color:#666;">Presentation</p>
                <p style="font-size:12px;color:#999;margin-top:30px;">${totalSlidesCount} slides • ${new Date().toLocaleDateString()}</p>
            </div>
        `;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const titleCanvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight,
            logging: false
        });
        
        const titleImgData = titleCanvas.toDataURL('image/jpeg', 0.95);
        const titleImgWidth = contentWidth;
        const titleImgHeight = (titleCanvas.height / titleCanvas.width) * contentWidth;
        const titleYOffset = (pageHeight - titleImgHeight) / 2;
        
        pdf.addImage(titleImgData, 'JPEG', margin, titleYOffset, titleImgWidth, titleImgHeight);
        
        // Process each slide
        for (let i = 0; i < totalSlidesCount; i++) {
            const progress = ((i + 1) / (totalSlidesCount + 1)) * 100;
            showLoadingOverlay(`📄 Processing slide ${i + 1}/${totalSlidesCount}...`, progress);
            
            // Parse markdown
            const html = marked.parse(slides[i]);
            const titleMatch = slides[i].match(/^#+\s+(.+)$/m);
            const slideTitleText = titleMatch ? titleMatch[1].replace(/\*\*/g, '').replace(/_/g, '') : `Slide ${i + 1}`;
            
            // Build slide HTML
            tempContainer.innerHTML = `
                <div style="margin-bottom:15px;padding-bottom:10px;border-bottom:2px solid #4CAF50;">
                    <div style="font-size:10px;color:#999;font-weight:600;">SLIDE ${i + 1} / ${totalSlidesCount}</div>
                    <h2 style="font-size:20px;margin:5px 0 0 0;color:#1a1a2e;">${slideTitleText}</h2>
                </div>
                <div style="font-size:12px;line-height:1.8;">
                    ${html}
                </div>
                <div style="margin-top:20px;padding-top:10px;border-top:1px solid #eee;font-size:9px;color:#999;text-align:center;">
                    ${currentPresentation.replace(/-/g, ' ')} • Slide ${i + 1}/${totalSlidesCount}
                </div>
            `;
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: tempContainer.scrollWidth,
                height: tempContainer.scrollHeight,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Add new page
            pdf.addPage();
            
            // Calculate image dimensions
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height / canvas.width) * contentWidth;
            const yOffset = (pageHeight - imgHeight) / 2;
            
            pdf.addImage(imgData, 'JPEG', margin, yOffset, imgWidth, imgHeight);
            
            // Small delay between slides
            if (i % 3 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        // End Page
        showLoadingOverlay('📄 Adding end page...', 95);
        
        tempContainer.innerHTML = `
            <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;min-height:250mm;padding:20px;">
                <h2 style="font-size:26px;color:#1a1a2e;">Thank You</h2>
                <p style="font-size:16px;color:#666;margin-top:20px;">End of presentation</p>
                <p style="font-size:12px;color:#999;margin-top:30px;">${currentPresentation.replace(/-/g, ' ')} • ${totalSlidesCount} slides</p>
            </div>
        `;
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const endCanvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight,
            logging: false
        });
        
        const endImgData = endCanvas.toDataURL('image/jpeg', 0.95);
        const endImgWidth = contentWidth;
        const endImgHeight = (endCanvas.height / endCanvas.width) * contentWidth;
        const endYOffset = (pageHeight - endImgHeight) / 2;
        
        pdf.addPage();
        pdf.addImage(endImgData, 'JPEG', margin, endYOffset, endImgWidth, endImgHeight);
        
        // Clean up
        if (tempContainer.parentNode) {
            tempContainer.parentNode.removeChild(tempContainer);
        }
        
        showLoadingOverlay('📄 Saving PDF...', 98);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Save PDF
        pdf.save(`${currentPresentation}-presentation.pdf`);
        
        showLoadingOverlay('✅ PDF saved successfully!', 100);
        setTimeout(() => {
            hideLoadingOverlay();
        }, 1500);
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        hideLoadingOverlay();
        alert('❌ Error generating PDF: ' + error.message);
    } finally {
        isExporting = false;
    }
}

// ============================================
// SHAREABLE URL HELPERS
// ============================================

// Generate shareable link for current slide
function getShareableURL() {
    const url = new URL(window.location);
    url.searchParams.set('p', currentPresentation);
    url.searchParams.set('s', currentSlide);
    return url.toString();
}

// Copy shareable link to clipboard
function copyShareableLink() {
    const url = getShareableURL();
    navigator.clipboard.writeText(url).then(() => {
        // Show feedback
        const toast = document.createElement('div');
        toast.className = 'pdf-toast';
        toast.textContent = '📋 Link copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }).catch(() => {
        // Fallback
        alert(`Share this link:\n${url}`);
    });
}

// ============================================
// EXPORT BUTTON EVENTS
// ============================================

if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
}

if (shareBtn) {
    shareBtn.addEventListener('click', copyShareableLink);
}

// ============================================
// START APPLICATION
// ============================================

loadPresentationsList();

console.log('🎯 Presentation Viewer loaded!');
console.log('📌 Keyboard shortcuts:');
console.log('  ← →  : Navigate slides');
console.log('  1-9  : Jump to slide');
console.log('  Ctrl+Shift+← → : Switch presentations');
console.log('  Ctrl+Shift+C : Copy shareable link');
console.log('  Ctrl+Shift+P : Export as PDF');
console.log('  F     : Fullscreen');
console.log('  Home/End : First/Last slide');
console.log('  R     : Reload presentation');