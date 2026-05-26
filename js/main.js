// ============================================
// MAIN JAVASCRIPT - Portfolio Functionality
// ============================================

// DOM Elements
const filterButtons = document.querySelectorAll('.filter-btn');
const projects = document.querySelectorAll('.project-card');
const searchInput = document.getElementById('searchInput');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');

// State
let visibleProjects = 6;
let currentFilter = 'all';
let currentSearch = '';

// ============================================
// BURGER MENU (Mobile)
// ============================================
if (burger) {
    burger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        burger.classList.toggle('toggle');
    });
}

// ============================================
// FILTER FUNCTIONALITY
// ============================================
filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        // Update active class
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Get filter value
        currentFilter = this.getAttribute('data-filter');
        
        // Apply filters
        applyFiltersAndSearch();
    });
});

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase();
        applyFiltersAndSearch();
    });
}

// ============================================
// APPLY FILTERS AND SEARCH
// ============================================
function applyFiltersAndSearch() {
    let visibleCount = 0;
    
    projects.forEach((project, index) => {
        const category = project.getAttribute('data-category');
        const title = project.getAttribute('data-title') || 
                      project.querySelector('h3')?.innerText.toLowerCase() || '';
        const description = project.querySelector('p')?.innerText.toLowerCase() || '';
        
        // Check filter match
        const filterMatch = currentFilter === 'all' || 
                           (category && category.includes(currentFilter));
        
        // Check search match
        const searchMatch = currentSearch === '' || 
                           title.includes(currentSearch) || 
                           description.includes(currentSearch);
        
        // Show/hide based on both
        if (filterMatch && searchMatch) {
            project.style.display = 'block';
            visibleCount++;
        } else {
            project.style.display = 'none';
        }
    });
    
    // Update "No results" message
    const projectsGrid = document.getElementById('projectsGrid');
    let noResultsMsg = document.querySelector('.no-results');
    
    if (visibleCount === 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results';
            noResultsMsg.innerHTML = `
                <i class="fas fa-search"></i>
                <h3>No projects found</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button onclick="location.reload()">Clear Filters</button>
            `;
            projectsGrid.parentNode.appendChild(noResultsMsg);
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// ============================================
// LOAD MORE PROJECTS
// ============================================
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        const hiddenProjects = Array.from(projects).filter(
            p => p.style.display !== 'none' && 
                 p.style.display !== 'block' && 
                 p.offsetParent === null
        );
        
        let loaded = 0;
        for (let i = visibleProjects; i < projects.length && loaded < 3; i++) {
            if (projects[i].style.display !== 'none') {
                projects[i].style.display = 'block';
                loaded++;
            }
        }
        
        visibleProjects += loaded;
        
        // Hide button if no more projects
        const remaining = Array.from(projects).filter(
            p => p.style.display !== 'block' && p.style.display !== 'none'
        ).length;
        
        if (remaining === 0) {
            loadMoreBtn.style.display = 'none';
        }
    });
}

// ============================================
// SMOOTH SCROLLING
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// ============================================
// NEWSLETTER FORM SUBMISSION
// ============================================
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        // Here you would typically send to your backend or email service
        console.log('Newsletter subscription:', email);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'newsletter-success';
        successMsg.innerHTML = '✓ Thanks for subscribing! Check your email for confirmation.';
        successMsg.style.color = '#e9c46a';
        successMsg.style.marginTop = '1rem';
        
        newsletterForm.appendChild(successMsg);
        newsletterForm.reset();
        
        setTimeout(() => successMsg.remove(), 5000);
    });
}

// ============================================
// TOOLTIPS FOR TECH TAGS
// ============================================
document.querySelectorAll('.tech').forEach(tech => {
    tech.setAttribute('title', 'Technologies used in this project');
});

// ============================================
// PROJECT CARD ANIMATION ON SCROLL
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});

// ============================================
// COPY BIBTEX FUNCTION
// ============================================
const copyBtn = document.querySelector('.btn-copy');
if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const bibtex = `@misc{portfolio2024,
  author = {[Jarian Permana]},
  title = {Data & Ecological Specialist},
  year = {2026},
  howpublished = {\\url{https://harimausum4tra.github.io/02_JPR_Portfolio_main/}}
}`;
        
        navigator.clipboard.writeText(bibtex).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 2000);
        });
    });
}

// Export for use in other modules (if needed)
window.applyFiltersAndSearch = applyFiltersAndSearch;