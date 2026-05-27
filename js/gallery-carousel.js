// ============================================
// GALLERY CAROUSEL - Multi Photo Viewer
// Untuk halaman gallery.html
// ============================================

(function() {
    'use strict';
    
    // Cek apakah kita di halaman yang memiliki gallery
    if (!document.querySelector('.gallery-item.multi-photo')) return;
    
    // DOM Elements
    let carouselModal, carouselImage, carouselCaption, carouselIndex;
    let carouselThumbnails, carouselPrev, carouselNext, carouselClose;
    
    // State
    let currentPhotoSet = [];
    let currentCaptions = [];
    let currentIndex = 0;
    let currentTitle = '';
    
    // Create modal dynamically jika belum ada
    function createCarouselModal() {
        if (document.getElementById('carouselModal')) return;
        
        const modalHTML = `
            <div id="carouselModal" class="carousel-modal">
                <span class="carousel-close">&times;</span>
                <div class="carousel-container">
                    <div class="carousel-main">
                        <button class="carousel-btn carousel-prev">❮</button>
                        <img id="carouselImage" src="" alt="">
                        <button class="carousel-btn carousel-next">❯</button>
                        <div class="carousel-index" id="carouselIndex">1 / 0</div>
                        <div class="carousel-caption" id="carouselCaption"></div>
                    </div>
                    <div class="carousel-thumbnails" id="carouselThumbnails"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Get elements after modal created
    function getElements() {
        carouselModal = document.getElementById('carouselModal');
        carouselImage = document.getElementById('carouselImage');
        carouselCaption = document.getElementById('carouselCaption');
        carouselIndex = document.getElementById('carouselIndex');
        carouselThumbnails = document.getElementById('carouselThumbnails');
        carouselPrev = document.querySelector('.carousel-prev');
        carouselNext = document.querySelector('.carousel-next');
        carouselClose = document.querySelector('.carousel-close');
    }
    
    // Update carousel display
    function updateCarousel() {
        if (!currentPhotoSet.length) return;
        if (carouselImage) carouselImage.src = currentPhotoSet[currentIndex];
        if (carouselCaption) carouselCaption.innerHTML = currentCaptions[currentIndex] || currentTitle;
        if (carouselIndex) carouselIndex.innerHTML = `${currentIndex + 1} / ${currentPhotoSet.length}`;
        
        // Update thumbnails active state
        document.querySelectorAll('.carousel-thumbnails img').forEach((thumb, i) => {
            if (i === currentIndex) {
                thumb.classList.add('active-thumb');
            } else {
                thumb.classList.remove('active-thumb');
            }
        });
    }
    
    // Build thumbnails
    function buildThumbnails() {
        if (!carouselThumbnails) return;
        carouselThumbnails.innerHTML = '';
        currentPhotoSet.forEach((src, idx) => {
            const thumb = document.createElement('img');
            thumb.src = src;
            thumb.alt = `Thumbnail ${idx + 1}`;
            thumb.addEventListener('click', () => {
                currentIndex = idx;
                updateCarousel();
            });
            carouselThumbnails.appendChild(thumb);
        });
        updateCarousel();
    }
    
    // Open carousel
    function openCarousel(photos, captions, title, startIndex = 0) {
        if (!carouselModal) createCarouselModal();
        getElements();
        
        currentPhotoSet = photos;
        currentCaptions = captions;
        currentTitle = title;
        currentIndex = startIndex;
        buildThumbnails();
        carouselModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Close carousel
    function closeCarousel() {
        if (carouselModal) carouselModal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Navigation
    function nextPhoto() {
        if (!currentPhotoSet.length) return;
        currentIndex = (currentIndex + 1) % currentPhotoSet.length;
        updateCarousel();
    }
    
    function prevPhoto() {
        if (!currentPhotoSet.length) return;
        currentIndex = (currentIndex - 1 + currentPhotoSet.length) % currentPhotoSet.length;
        updateCarousel();
    }
    
    // Attach event listeners
    function attachEventListeners() {
        if (carouselPrev) carouselPrev.addEventListener('click', prevPhoto);
        if (carouselNext) carouselNext.addEventListener('click', nextPhoto);
        if (carouselClose) carouselClose.addEventListener('click', closeCarousel);
        if (carouselModal) {
            carouselModal.addEventListener('click', (e) => {
                if (e.target === carouselModal) closeCarousel();
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!carouselModal || !carouselModal.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') prevPhoto();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'Escape') closeCarousel();
        });
    }
    
    // Initialize: attach click handlers to gallery items
    function initGalleryCarousel() {
        const multiPhotoItems = document.querySelectorAll('.gallery-item.multi-photo');
        if (!multiPhotoItems.length) return;
        
        createCarouselModal();
        getElements();
        attachEventListeners();
        
        multiPhotoItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Prevent if clicking on badge
                if (e.target.classList && e.target.classList.contains('photo-count-badge')) return;
                
                const photosAttr = item.getAttribute('data-photos');
                const captionsAttr = item.getAttribute('data-captions');
                const title = item.getAttribute('data-title') || '';
                
                if (photosAttr) {
                    try {
                        const photos = JSON.parse(photosAttr);
                        const captions = captionsAttr ? JSON.parse(captionsAttr) : photos.map((_, i) => `Photo ${i + 1}`);
                        openCarousel(photos, captions, title);
                    } catch(e) {
                        console.error('Error parsing gallery data:', e);
                    }
                }
            });
        });
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGalleryCarousel);
    } else {
        initGalleryCarousel();
    }
    
})();