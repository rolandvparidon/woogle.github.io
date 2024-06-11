// old pagenumbering

/**
 * Changes the page and updates the URL parameters.
 * @param {number} newPage - The new page number to navigate to.
 */
function changePage(newPage) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', newPage);

    // Log the new URL for debugging
    console.log('New URL:', '?' + urlParams.toString());

    // Update URL without reloading the page
    history.pushState(null, '', '?' + urlParams.toString());

    // Fetch updated search results
    fetchSearchResults()
        .then(data => {
            const searchQuery = urlParams.get('q') || '*';
            const sortOrder = urlParams.get('order') || 'relevance-desc';
            setupUI(data, searchQuery, sortOrder, newPage);
        })
        .catch(error => {
            console.error('Error in changePage:', error);
        });
}

/**
 * Renders pagination controls based on the total number of results and the current page.
 * @param {number} totalResults - The total number of filtered results.
 * @param {number} currentPage - The current page for pagination.
 */
function renderPaginationControls(totalResults, currentPage) {
    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
    if (totalPages <= 1) return;

    const paginationContainer = document.querySelector('#pagination');
    paginationContainer.innerHTML = '';

    const maxVisiblePages = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First button
    const firstButton = document.createElement('li');
    firstButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    firstButton.innerHTML = `
        <a class="page-link" href="javascript:void(0)" onclick="changePage(1)" aria-label="First">
            <span aria-hidden="true">&laquo;&laquo;</span>
            <span class="sr-only">First</span>
        </a>
    `;
    paginationContainer.appendChild(firstButton);

    // Previous button
    const prevButton = document.createElement('li');
    prevButton.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevButton.innerHTML = `
        <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage - 1})" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
            <span class="sr-only">Previous</span>
        </a>
    `;
    paginationContainer.appendChild(prevButton);

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
        `;
        paginationContainer.appendChild(pageItem);
    }

    // Next button
    const nextButton = document.createElement('li');
    nextButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextButton.innerHTML = `
        <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage + 1})" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
            <span class="sr-only">Next</span>
        </a>
    `;
    paginationContainer.appendChild(nextButton);

    // Last button
    const lastButton = document.createElement('li');
    lastButton.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    lastButton.innerHTML = `
        <a class="page-link" href="javascript:void(0)" onclick="changePage(${totalPages})" aria-label="Last">
            <span aria-hidden="true">&raquo;&raquo;</span>
            <span class="sr-only">Last</span>
        </a>
    `;
    paginationContainer.appendChild(lastButton);
}