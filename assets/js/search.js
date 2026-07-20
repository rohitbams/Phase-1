/**
 * KlashOut Phase 1 Documentation - Full-Text Site Search
 *
 * Features:
 * - Fetches and indexes all documentation pages
 * - Full-text search across all page content
 * - Shows matching text snippets with context
 * - Highlights matching terms
 * - Keyboard navigation support
 */

class DocumentationSearch {
    constructor() {
        this.pages = [
            'index.html',
            'conflicts.html',
            'questions-for-lincoln.html',
            'design-decisions.html',
            'system-design.html',
            'epic-hierarchy.html',
            'data-model.html',
            'reference.html',
            'payment-tiers.html',
            'cost-optimization.html',
            'srs-updates-summary.html'
        ];
        this.searchIndex = [];
        this.indexBuilt = false;
        this.initializeUI();
        this.buildFullTextIndex();
    }

    async buildFullTextIndex() {
        const indexPromises = this.pages.map(async (page) => {
            try {
                const response = await fetch(page);
                const html = await response.text();

                // Parse HTML and extract text content
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Remove script and style tags
                doc.querySelectorAll('script, style, nav').forEach(el => el.remove());

                // Get page title
                const titleEl = doc.querySelector('.page-title');
                const title = titleEl ? titleEl.textContent.trim() : page;

                // Extract all text content from main content area
                const mainContent = doc.querySelector('.main-content, .content, main, body');
                const textContent = mainContent ? mainContent.textContent : doc.body.textContent;

                // Clean up whitespace
                const cleanText = textContent
                    .replace(/\s+/g, ' ')
                    .replace(/\n+/g, ' ')
                    .trim();

                // Extract sections for better context
                const sections = [];
                doc.querySelectorAll('h2, h3').forEach(heading => {
                    const headingText = heading.textContent.trim();
                    let content = '';
                    let sibling = heading.nextElementSibling;

                    while (sibling && !sibling.matches('h2, h3')) {
                        content += ' ' + sibling.textContent;
                        sibling = sibling.nextElementSibling;
                    }

                    if (headingText && content) {
                        sections.push({
                            heading: headingText,
                            content: content.replace(/\s+/g, ' ').trim()
                        });
                    }
                });

                return {
                    page,
                    title,
                    content: cleanText,
                    sections
                };
            } catch (error) {
                console.error(`Error indexing ${page}:`, error);
                return null;
            }
        });

        const results = await Promise.all(indexPromises);
        this.searchIndex = results.filter(r => r !== null);
        this.indexBuilt = true;
        console.log('Search index built:', this.searchIndex.length, 'pages indexed');
    }

    initializeUI() {
        // Create search container
        const searchHTML = `
            <div id="site-search-container">
                <div id="site-search-backdrop"></div>
                <div id="site-search-modal">
                    <div id="site-search-header">
                        <input
                            type="text"
                            id="site-search-input"
                            placeholder="Search documentation..."
                            autocomplete="off"
                        />
                        <button id="site-search-close">&times;</button>
                    </div>
                    <div id="site-search-results"></div>
                    <div id="site-search-footer">
                        <kbd>↑</kbd> <kbd>↓</kbd> Navigate • <kbd>Enter</kbd> Open • <kbd>Esc</kbd> Close
                    </div>
                </div>
            </div>
        `;

        // Inject into page
        document.body.insertAdjacentHTML('beforeend', searchHTML);

        // Add search trigger button to header
        this.addSearchButton();

        // Bind events
        this.bindEvents();
    }

    addSearchButton() {
        const headers = document.querySelectorAll('.header');
        if (headers.length > 0) {
            const searchButton = document.createElement('button');
            searchButton.id = 'open-search-btn';
            searchButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="8" cy="8" r="6"/>
                    <path d="M13 13l5 5"/>
                </svg>
                <span>Search</span>
                <kbd>Ctrl+K</kbd>
            `;
            searchButton.onclick = () => this.openSearch();
            headers[0].appendChild(searchButton);
        }
    }

    bindEvents() {
        const input = document.getElementById('site-search-input');
        const closeBtn = document.getElementById('site-search-close');
        const backdrop = document.getElementById('site-search-backdrop');
        const container = document.getElementById('site-search-container');

        // Input event
        input.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Close events
        closeBtn.addEventListener('click', () => this.closeSearch());
        backdrop.addEventListener('click', () => this.closeSearch());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to open
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearch();
            }

            // Escape to close
            if (e.key === 'Escape' && container.classList.contains('active')) {
                this.closeSearch();
            }

            // Arrow keys for navigation
            if (container.classList.contains('active')) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateResults(1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateResults(-1);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.selectResult();
                }
            }
        });
    }

    openSearch() {
        const container = document.getElementById('site-search-container');
        const input = document.getElementById('site-search-input');
        container.classList.add('active');
        input.focus();
    }

    closeSearch() {
        const container = document.getElementById('site-search-container');
        const input = document.getElementById('site-search-input');
        container.classList.remove('active');
        input.value = '';
        document.getElementById('site-search-results').innerHTML = '';
    }

    handleSearch(query) {
        const resultsContainer = document.getElementById('site-search-results');

        if (query.length < 2) {
            resultsContainer.innerHTML = '<div class="search-no-results">Type at least 2 characters to search...</div>';
            return;
        }

        if (!this.indexBuilt) {
            resultsContainer.innerHTML = '<div class="search-no-results">Building search index... please wait</div>';
            return;
        }

        const results = this.search(query);

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
            return;
        }

        const resultsHTML = results.slice(0, 10).map((result, index) => `
            <div class="search-result-item${index === 0 ? ' selected' : ''}" data-page="${result.page}">
                <div class="search-result-title">${this.highlightMatch(result.title, query)}</div>
                <div class="search-result-page">${result.page}</div>
                ${result.snippet ? `
                    <div class="search-result-snippet">...${this.highlightMatch(result.snippet, query)}...</div>
                ` : ''}
                ${result.section ? `
                    <div class="search-result-section">In: ${result.section}</div>
                ` : ''}
            </div>
        `).join('');

        resultsContainer.innerHTML = resultsHTML;

        // Bind click events
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = item.dataset.page;
            });
        });
    }

    search(query) {
        const queryLower = query.toLowerCase();
        const results = [];

        this.searchIndex.forEach(pageData => {
            const { page, title, content, sections } = pageData;
            let score = 0;
            let snippet = '';
            let matchedSection = '';

            // Search in title (highest priority)
            if (title.toLowerCase().includes(queryLower)) {
                score += 100;
            }

            // Search in sections (medium priority)
            sections.forEach(section => {
                const headingMatch = section.heading.toLowerCase().includes(queryLower);
                const contentMatch = section.content.toLowerCase().includes(queryLower);

                if (headingMatch) {
                    score += 50;
                    matchedSection = section.heading;
                }

                if (contentMatch) {
                    score += 10;
                    if (!matchedSection) {
                        matchedSection = section.heading;
                    }

                    // Extract snippet around the match
                    if (!snippet) {
                        snippet = this.extractSnippet(section.content, queryLower, 150);
                    }
                }
            });

            // Search in full content (lowest priority, if no section match)
            if (score === 0 && content.toLowerCase().includes(queryLower)) {
                score += 5;
                snippet = this.extractSnippet(content, queryLower, 150);
            }

            if (score > 0) {
                results.push({
                    page,
                    title,
                    score,
                    snippet,
                    section: matchedSection
                });
            }
        });

        // Sort by score (descending)
        return results.sort((a, b) => b.score - a.score);
    }

    extractSnippet(text, query, maxLength = 150) {
        const index = text.toLowerCase().indexOf(query);
        if (index === -1) return '';

        const start = Math.max(0, index - 60);
        const end = Math.min(text.length, index + query.length + 90);

        return text.substring(start, end);
    }

    highlightMatch(text, query) {
        if (!text) return '';
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    navigateResults(direction) {
        const results = document.querySelectorAll('.search-result-item');
        const currentIndex = Array.from(results).findIndex(r => r.classList.contains('selected'));

        if (results.length === 0) return;

        results[currentIndex]?.classList.remove('selected');

        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = results.length - 1;
        if (newIndex >= results.length) newIndex = 0;

        results[newIndex].classList.add('selected');
        results[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    selectResult() {
        const selected = document.querySelector('.search-result-item.selected');
        if (selected) {
            window.location.href = selected.dataset.page;
        }
    }
}

// Initialize search when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DocumentationSearch();
    });
} else {
    new DocumentationSearch();
}
