// ============================================
// ENHANCED SEARCH WITH HIGHLIGHTING
// ============================================

class ProjectSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.projects = document.querySelectorAll('.project-card');
        this.searchHistory = this.loadSearchHistory();
        this.init();
    }
    
    init() {
        if (!this.searchInput) return;
        
        // Debounced search
        let debounceTimer;
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });
        
        // Add search suggestions
        this.addSearchSuggestions();
    }
    
    performSearch(query) {
        query = query.toLowerCase().trim();
        
        if (query.length > 2) {
            this.saveToHistory(query);
        }
        
        this.projects.forEach(project => {
            const text = project.innerText.toLowerCase();
            const matches = text.includes(query);
            
            if (query === '' || matches) {
                project.style.display = '';
                if (query && query.length > 2) {
                    this.highlightText(project, query);
                } else {
                    this.removeHighlights(project);
                }
            } else {
                project.style.display = 'none';
            }
        });
        
        this.updateSearchStats(query);
    }
    
    highlightText(element, query) {
        this.removeHighlights(element);
        
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentElement?.closest('.tags, .card-meta')) {
                        return NodeFilter.FILTER_SKIP;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const nodesToReplace = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.textContent.toLowerCase().includes(query)) {
                nodesToReplace.push(node);
            }
        }
        
        nodesToReplace.forEach(node => {
            const span = document.createElement('span');
            const regex = new RegExp(`(${query})`, 'gi');
            span.innerHTML = node.textContent.replace(regex, '<mark>$1</mark>');
            node.parentNode.replaceChild(span, node);
        });
    }
    
    removeHighlights(element) {
        const marks = element.querySelectorAll('mark');
        marks.forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }
    
    saveToHistory(query) {
        if (!this.searchHistory.includes(query) && query.length > 2) {
            this.searchHistory.unshift(query);
            this.searchHistory = this.searchHistory.slice(0, 10);
            localStorage.setItem('projectSearchHistory', JSON.stringify(this.searchHistory));
        }
    }
    
    loadSearchHistory() {
        const saved = localStorage.getItem('projectSearchHistory');
        return saved ? JSON.parse(saved) : [];
    }
    
    addSearchSuggestions() {
        const wrapper = this.searchInput.parentElement;
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'search-suggestions';
        suggestionsDiv.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            display: none;
        `;
        wrapper.style.position = 'relative';
        wrapper.appendChild(suggestionsDiv);
        
        this.searchInput.addEventListener('focus', () => {
            this.showSuggestions(suggestionsDiv);
        });
        
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                suggestionsDiv.style.display = 'none';
            }
        });
    }
    
    showSuggestions(div) {
        if (this.searchHistory.length === 0) return;
        
        div.innerHTML = `
            <div style="padding: 0.5rem;">
                <strong style="padding: 0.5rem; display: block;">Recent searches:</strong>
                ${this.searchHistory.map(term => `
                    <div class="suggestion-item" data-term="${term}" style="padding: 0.5rem; cursor: pointer; hover:background:#f0f0f0;">
                        🔍 ${term}
                    </div>
                `).join('')}
                <div class="clear-history" style="padding: 0.5rem; cursor: pointer; color: #dc3545; border-top: 1px solid #eee;">
                    Clear history
                </div>
            </div>
        `;
        
        div.style.display = 'block';
        
        div.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.searchInput.value = item.dataset.term;
                this.performSearch(item.dataset.term);
                div.style.display = 'none';
            });
        });
        
        const clearBtn = div.querySelector('.clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.searchHistory = [];
                localStorage.removeItem('projectSearchHistory');
                div.style.display = 'none';
            });
        }
    }
    
    updateSearchStats(query) {
        let visibleCount = 0;
        this.projects.forEach(p => {
            if (p.style.display !== 'none') visibleCount++;
        });
        
        let statsDiv = document.querySelector('.search-stats');
        if (!statsDiv && query) {
            statsDiv = document.createElement('div');
            statsDiv.className = 'search-stats';
            statsDiv.style.cssText = 'text-align: center; margin-top: 1rem; color: var(--text-light);';
            this.searchInput.parentElement.parentElement.appendChild(statsDiv);
        }
        
        if (statsDiv) {
            if (query) {
                statsDiv.innerHTML = `Found ${visibleCount} project${visibleCount !== 1 ? 's' : ''} matching "${query}"`;
            } else {
                statsDiv.innerHTML = '';
            }
        }
    }
}

// Initialize enhanced search
document.addEventListener('DOMContentLoaded', () => {
    new ProjectSearch();
});