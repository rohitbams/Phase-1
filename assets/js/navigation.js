/**
 * KlashOut Phase 1 Deliverables - Interactive Navigation
 * Author: Rohit Bamane
 * Date: July 2026
 */

document.addEventListener('DOMContentLoaded', function() {
    initCollapsibles();
    initSmoothScroll();
    initActiveNav();
    initProgressBars();
});

/**
 * Initialize collapsible sections
 */
function initCollapsibles() {
    const collapsibles = document.querySelectorAll('.collapsible-header');

    collapsibles.forEach(header => {
        header.addEventListener('click', function() {
            const collapsible = this.parentElement;
            const isActive = collapsible.classList.contains('active');

            // Close all other collapsibles in the same container (accordion behavior)
            const container = collapsible.parentElement;
            const siblings = container.querySelectorAll('.collapsible.active');
            siblings.forEach(sibling => {
                if (sibling !== collapsible) {
                    sibling.classList.remove('active');
                }
            });

            // Toggle current collapsible
            collapsible.classList.toggle('active');
        });
    });
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Highlight active navigation item based on current page
 */
function initActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-list a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}

/**
 * Animate progress bars on page load
 */
function initProgressBars() {
    const progressBars = document.querySelectorAll('.dashboard-card-progress-bar');

    // Delay animation slightly for visual effect
    setTimeout(() => {
        progressBars.forEach(bar => {
            const targetWidth = bar.getAttribute('data-progress') || '0';
            bar.style.width = targetWidth + '%';
        });
    }, 300);
}

/**
 * Expand all collapsibles (utility function for print/export)
 */
function expandAll() {
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(c => c.classList.add('active'));
}

/**
 * Collapse all collapsibles
 */
function collapseAll() {
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(c => c.classList.remove('active'));
}

/**
 * Filter table rows by MoSCoW priority
 */
function filterByPriority(priority) {
    const rows = document.querySelectorAll('tbody tr');

    rows.forEach(row => {
        if (priority === 'all') {
            row.style.display = '';
        } else {
            const badge = row.querySelector('.badge');
            if (badge && badge.textContent.toLowerCase().includes(priority.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

/**
 * Search functionality for requirements
 */
function searchRequirements(query) {
    const rows = document.querySelectorAll('tbody tr');
    const searchTerm = query.toLowerCase();

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

/**
 * Export current page as print-friendly version
 */
function printPage() {
    expandAll();
    setTimeout(() => {
        window.print();
    }, 100);
}
