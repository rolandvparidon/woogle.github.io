// woogle.js

// Constants for pagination settings
const ITEMS_PER_PAGE = 10;

const facetDisplayNames = {
    'type': 'Type',
    'year': 'Jaar',
    'q': 'Zoek term'
};

/**
 * Sorts an array of dossiers based on a specified sortOrder parameter.
 * @param {Array} dossiers - The array of dossier objects to sort.
 * @param {string} sortOrder - The order by which to sort the dossiers.
 * @returns {Array} The sorted array of dossiers.
 */
function sortDossiers(dossiers, sortOrder) {
    return dossiers.sort((a, b) => {
        switch (sortOrder) {
            case 'date-desc':
                return new Date(b.foi_publishedDate) - new Date(a.foi_publishedDate);
            case 'date-asc':
                return new Date(a.foi_publishedDate) - new Date(b.foi_publishedDate);
            case 'title-desc':
                return b.dc_title.localeCompare(a.dc_title);
            case 'title-asc':
                return a.dc_title.localeCompare(b.dc_title);
            default:
                return 0;
        }
    });
}

let cachedData = null;

/**
 * Initializes the application by fetching JSON data and setting up the UI.
 */
document.addEventListener("DOMContentLoaded", function initApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || '';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || (searchQuery || searchType || searchYear ? 'relevance-desc' : 'date-desc');
    const currentPage = parseInt(urlParams.get('page')) || 1;

    fetchSearchResults(searchQuery, searchType, searchYear, sortOrder, currentPage);
});

function fetchSearchResults(searchQuery, searchType, searchYear, sortOrder, currentPage) {
    let apiUrl = `https://woogle.wooverheid.nl/search?q=${encodeURIComponent(searchQuery)}&publisher=gm0268&order=${sortOrder}&country=nl&infobox=true&page=${currentPage}`;

    if (searchType) {
        apiUrl += `&type=${searchType}`;
    }
    if (searchYear) {
        apiUrl += `&year=${searchYear}`;
    }

    console.log('Fetching from API URL:', apiUrl); // Debugging line

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            setupUI(data, searchQuery, sortOrder, currentPage);
        })
        .catch(error => console.error('Error fetching search results:', error));
}

function updateFacetSelection(key, value, remove = false) {
    const urlParams = new URLSearchParams(window.location.search);

    if (remove) {
        urlParams.delete(key === 'search' ? 'q' : key);
    } else {
        urlParams.set(key === 'search' ? 'q' : key, value);
    }

    urlParams.set('page', 1);
    history.pushState(null, '', '?' + urlParams.toString());

    const searchQuery = urlParams.get('q') || '';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';
    const currentPage = 1;

    fetchSearchResults(searchQuery, searchType, searchYear, sortOrder, currentPage);
}


/**
 * Updates the URL parameters when a facet is selected or deselected and fetches new data.
 * @param {string} key - The key of the facet (type, year, publisher).
 * @param {string} value - The value of the facet.
 * @param {boolean} remove - Whether to remove the facet from the selection.
 */
function updateFacetSelection(key, value, remove = false) {
    const urlParams = new URLSearchParams(window.location.search);

    if (remove) {
        urlParams.delete(key);
    } else {
        urlParams.set(key, value);
    }

    // Reset page to 1 whenever a facet is selected or deselected
    urlParams.set('page', 1);

    // Construct the new query URL
    const searchQuery = urlParams.get('q') || '*';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';
    const publisher = urlParams.get('publisher') || 'gm0268';
    const country = urlParams.get('country') || 'nl';
    const infobox = 'true';

    const apiUrl = `https://woogle.wooverheid.nl/search?q=${encodeURIComponent(searchQuery)}&publisher=${publisher}&order=${sortOrder}&country=${country}&infobox=${infobox}&type=${searchType}&year=${searchYear}`;

    // Fetch the data from the Woogle API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Cache the new data
            cachedData = data;

            // Update the URL without reloading the page
            history.pushState(null, '', '?' + urlParams.toString());

            // Update the UI with the new data
            setupUI(data, searchQuery, sortOrder, 1);
        })
        .catch(error => console.error('Error fetching the JSON data:', error));
}

/**
 * Sets up the selected facets display and adds event listeners for deselecting facets.
 */
function setupSelectedFacets() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedFacets = [];

    if (urlParams.get('type')) {
        selectedFacets.push({ key: 'type', value: urlParams.get('type') });
    }
    if (urlParams.get('year')) {
        selectedFacets.push({ key: 'year', value: urlParams.get('year') });
    }
    if (urlParams.get('q')) {
        selectedFacets.push({ key: 'q', value: urlParams.get('q') });
    }

    const selectedFacetHtml = selectedFacets.map(facet => `
        <li class="facets__item">
            <span class="facet-text">
                ${facet.key === 'type' ? facetDisplayNames[facet.key] + ': ' + '<strong>' + getTypeName(facet.value) + '</strong>' : facetDisplayNames[facet.key] + ': ' + '<strong>' + facet.value + '</strong>'}
            </span>
            <a class="facets__link" href="javascript:void(0)" onclick="updateFacetSelection('${facet.key}', '${facet.value}', true)">
                <span class="remove-facet woogle-grey">x</span>
            </a>
        </li>
    `).join('');

    const removeAllFiltersHtml = `
        <li class="facets__item">
            <a class="facets__link" href="javascript:void(0)" onclick="removeAllFilters()">
                Wis alle filters
            </a>
        </li>
    `;

    const selectedFacetsContainer = document.querySelector('.facets__selected');
    const selectedFacetsList = selectedFacetsContainer.querySelector('.facets__list');

    selectedFacetsList.innerHTML = selectedFacets.length > 0 ? selectedFacetHtml + removeAllFiltersHtml : selectedFacetHtml;

    // Show or hide the selected facets section based on whether any facets are selected
    if (selectedFacets.length > 0) {
        selectedFacetsContainer.style.display = 'block';
    } else {
        selectedFacetsContainer.style.display = 'none';
    }
}

/**
 * Removes all filters by resetting the URL parameters.
 */
function removeAllFilters() {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.delete('type');
    urlParams.delete('year');
    urlParams.delete('q');
    urlParams.delete('page');
    history.pushState(null, '', '?' + urlParams.toString());

    const searchQuery = urlParams.get('q') || '';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';
    const currentPage = 1;

    fetchSearchResults(searchQuery, searchType, searchYear, sortOrder, currentPage);
}

/**
 * Sets up the UI with the provided data, search query, sort order, and current page.
 * @param {Object} data - The fetched data from the API.
 * @param {string} searchQuery - The current search query.
 * @param {string} sortOrder - The current sort order.
 * @param {number} currentPage - The current page number.
 */
function setupUI(data, searchQuery, sortOrder, currentPage) {
    try {
        const dossiers = data.hits || [];
        const totalResults = data.total_hits || 0;
        const totalPages = data.total_pages || 0;

        console.log('Setting up UI with filteredDossiers:', dossiers);

        // Inject the entire structure into results_wrapper
        const resultsWrapper = document.querySelector('.results_wrapper');
        resultsWrapper.innerHTML = `
            <section class="search-results">
                <div class="search-results-header">
                    <h1>WOO Dossiers</h1>
                    <p itemprop="description" class="search-results__title">${totalResults} dossiers gevonden</p>
                    <div class="search-results-order">
                        <!-- Sorting buttons will be inserted here -->
                    </div>
                </div>
                <div class="navbar__search">
                    <!-- Search bar will be inserted here -->
                </div>
                <ul id="search-results" class="search-results__list">
                    <!-- Dynamic list items will be inserted here -->
                </ul>
                <div class="search-results__pagination">
                    <nav aria-label="Page navigation">
                        <ul class="pagination" id="pagination">
                        </ul>
                    </nav>
                </div>
            </section>
        `;

        insertSearchComponents(searchQuery, sortOrder);
        insertOrderingComponents(sortOrder);
        displayDossiers(dossiers, currentPage, searchQuery); // Pass searchQuery here
        updateResultsTitle(dossiers, totalResults, searchQuery, '', ''); // Pass totalResults here
        setupFacets(data.facets);
        setupSelectedFacets();
        renderPaginationControls(totalPages, currentPage);
        setupBreadcrumbNavigation();
    } catch (error) {
        console.error('Error in setupUI:', error);
    }
}



/**
 * Inserts search-related components into the DOM.
 * @param {string} searchQuery - The current search query.
 * @param {string} sortOrder - The current sort order.
 */
function insertSearchComponents(searchQuery, sortOrder) {
    const displayQuery = searchQuery === '*' ? '' : searchQuery;
    const searchBarHTML = `
        <button class="navbar__search-button" id="navbar-open-search">
            <span class="sr-only">Open zoekveld</span>
            <span class="mdi mdi-magnify" aria-hidden="true"></span>
        </button>
        <form id="search-form" class="autocomplete autocomplete__form" role="search">
            <input placeholder="Waar bent u naar op zoek?" id="suggest-search-query" autocomplete="off" aria-label="Zoekveld" class="autocomplete__input form-control form-text mb-3" type="text" name="q" value="${displayQuery}">
            <input type="hidden" name="order" value="${sortOrder}">
            <input type="hidden" name="country" value="nl">
            <input type="hidden" name="publisher" value="gm0268">
            <button aria-label="Search button" type="submit" id="odn-search-button" class="autocomplete__search-button form-submit js-form-submit">
                <span class="mdi mdi-magnify" aria-hidden="true"></span>
            </button>
            <button aria-label="Clear input" title="Clear input" type="button" class="autocomplete__clear-button autocomplete__button--hide">
                <span class="mdi mdi-close" aria-hidden="true"></span>
            </button>
        </form>
        <button class="navbar__search-close-button" id="navbar-close-search" aria-label="Sluit zoekveld">
            Close
        </button>
    `;
    document.querySelector('.navbar__search').innerHTML = searchBarHTML;

    // Add event listener to the search form
    document.getElementById('search-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const searchQuery = document.getElementById('suggest-search-query').value;
        updateSearchQuery(searchQuery);
    });
}

/**
 * Updates the search query parameter and triggers UI update.
 * @param {string} searchQuery - The new search query.
 */
function updateSearchQuery(searchQuery) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('q', searchQuery);
    urlParams.set('page', 1); // Reset to page 1 for new search

    // Retrieve updated URL parameters
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';
    const publisher = urlParams.get('publisher') || 'gm0268';
    const country = urlParams.get('country') || 'nl';
    const infobox = 'true';

    const apiUrl = `https://woogle.wooverheid.nl/search?q=${encodeURIComponent(searchQuery)}&publisher=${publisher}&order=${sortOrder}&country=${country}&infobox=${infobox}&type=${searchType}&year=${searchYear}`;

    // Fetch the data from the Woogle API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Cache the new data
            cachedData = data;

            // Update the URL without reloading the page
            history.pushState(null, '', '?' + urlParams.toString());

            // Update the UI with the new data
            setupUI(data, searchQuery, sortOrder, 1);
        })
        .catch(error => console.error('Error fetching the JSON data:', error));
}

/**
 * Inserts ordering-related components into the DOM.
 * @param {string} sortOrder - The current sort order.
 */
function insertOrderingComponents(sortOrder) {
    const orderingHTML = `
    <div class="woo-ordering">
    <label for="order" class="sr-only">Sorteren op</label>
    <select class="woo-ordering-select form-select form-select-sm" id="order" onchange="updateQueryParams(this.value)">
        <option value="relevance-desc" ${sortOrder === 'relevance-desc' ? 'selected' : ''}>Relevantie ↓</option>
        <option value="relevance-asc" ${sortOrder === 'relevance-asc' ? 'selected' : ''}>Relevantie ↑</option>
        <option value="date-desc" ${sortOrder === 'date-desc' ? 'selected' : ''}>Datum ↓</option>
        <option value="date-asc" ${sortOrder === 'date-asc' ? 'selected' : ''}>Datum ↑</option>
        <option value="type-desc" ${sortOrder === 'type-desc' ? 'selected' : ''}>Type ↓</option>
        <option value="type-asc" ${sortOrder === 'type-asc' ? 'selected' : ''}>Type ↑</option>
        <option value="title-desc" ${sortOrder === 'title-desc' ? 'selected' : ''}>Titel ↓</option>
        <option value="title-asc" ${sortOrder === 'title-asc' ? 'selected' : ''}>Titel ↑</option>
    </select>
</div>`;
    document.querySelector('.search-results-order').innerHTML = orderingHTML;
}


/**
 * Displays the filtered and sorted dossiers in the UI.
 * @param {Array} filteredDossiers - Array of filtered and sorted dossiers.
 * @param {number} currentPage - The current page for pagination.
 */
let uniqueIdCounter = 0;

/**
 * Displays the filtered and sorted dossiers in the UI.
 * @param {Array} dossiers - Array of filtered and sorted dossiers.
 * @param {number} currentPage - The current page for pagination.
 * @param {string} searchQuery - The current search query.
 */
function displayDossiers(dossiers, currentPage, searchQuery) {
    // Log the page and dossiers for debugging
    console.log('Displaying dossiers for page:', currentPage);
    console.log('Paginated dossiers:', dossiers);

    // Generating and displaying list items for each dossier
    const listItems = dossiers.map(dossier => {
        const detailUrl = `dossier.html?pid=${dossier.dc_identifier}`;
        const title = dossier.dc_title ? capitalizeFirstLetter(dossier.dc_title) : '';
        const description = dossier.dc_description ? truncateText(capitalizeFirstLetter(dossier.dc_description), 250) : '';

        // Generate matching files list if any
        let matchingFiles = '';
        if (dossier.foi_pagehits) {
            const pageHits = Object.values(dossier.foi_pagehits);
            if (pageHits.length > 0) {
                const matchingFileItems = pageHits.map(hit => {
                    const docTitle = hit.dc_docTitle || '';
                    let highlight = hit.foi_highlight || '';
                    const pageNumber = hit.foi_pageNumber || '';
                    const dcSource = hit.dc_source.replace('https://pid.wooverheid.nl/?pid=', 'dossier.html?pid=');

                    // Remove characters before the first significant word
                    const highlightText = highlight.replace(/<em>pagina<\/em>\s*\d+\n\s*/, '');

                    return `
                        <div class="search-results__item">
                            <h4>${docTitle}</h4>
                            <p><a href="${dcSource}">${highlightText}</a></p>
                            <span class="badge badge-primary">Pagina ${pageNumber}</span>
                        </div>`;
                }).join('');
                const uniqueId = `collapse-${uniqueIdCounter++}`;
                matchingFiles = `
                    <div class="accordion" id="accordion-${uniqueId}">
                        <div class="card">
                            <div class="card-header" id="heading-${uniqueId}">
                                <h3 class="card-title mb-0">
                                    <button class="accordion__button collapsed" data-toggle="collapse" data-parent="#accordion-${uniqueId}" data-target="#${uniqueId}" aria-controls="${uniqueId}" aria-expanded="false">
                                        Gevonden bestanden
                                    </button>
                                </h3>
                            </div>
                            <div id="${uniqueId}" role="tabpanel" aria-labelledby="heading-${uniqueId}" class="collapse">
                                <div class="card-block">
                                    ${matchingFileItems}
                                </div>
                            </div>
                        </div>
                    </div>`;
            }
        }

        return `<li class="search-results__item">
            <h2 class="search-results__item-title">
                <a href="${detailUrl}">${title}</a>
            </h2>
            <div class="search-results__item-body">
                <p>${description}</p>
            </div>
            <div class="search-results__item-body">
            <span class="badge badge-success mr-2" itemprop="encodingFormat">${capitalizeFirstLetter(dossier.tooiwl_topic || '')}</span>
            <span class="badge badge-info mr-2">${capitalizeFirstLetter(dossier.foi_valuation || '')}</span>
            <span class="badge badge-primary">Publicatie: ${dossier.foi_publishedDate || ''}</span>
            </div>
            ${matchingFiles} <!-- Add matching files accordion here -->
        </li>`;
    }).join('');
    document.getElementById('search-results').innerHTML = listItems;

    // Reinitialize Bootstrap tooltips and accordions
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(acc => {
        const buttons = acc.querySelectorAll('button[data-toggle="collapse"]');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                const target = document.querySelector(button.dataset.target);
                if (target.classList.contains('show')) {
                    target.classList.remove('show');
                } else {
                    target.classList.add('show');
                }
            });
        });
    });

    console.log('Dossiers displayed successfully.');
}





/**
 * Updates the search results title with the number of total results.
 * @param {Array} filteredDossiers - Array of filtered and sorted dossiers.
 * @param {number} totalResults - The total number of results.
 * @param {string} searchQuery - The current search query.
 * @param {string} searchYear - The current search year.
 * @param {string} searchType - The current search type.
 */
function updateResultsTitle(filteredDossiers, totalResults, searchQuery, searchYear, searchType) {
    let resultText = 'Alle dossiers';
    
    const hasFilters = searchQuery || searchYear || searchType;

    if (hasFilters) {
        resultText = `${totalResults} dossiers gevonden`;
    }

    document.querySelector('.search-results__title').innerText = resultText;
}


/**
 * Filters dossiers based on URL parameters such as search query, year, and type.
 * @param {Object} data - The data object containing all dossiers.
 * @param {string} searchQuery - The search query to filter by.
 * @param {string} sortOrder - The sort order parameter.
 * @param {string} searchYear - The year to filter by.
 * @param {string} searchType - The type to filter by.
 * @returns {Object} An object containing the filtered dossiers and the total count.
 */
function filterDossiers(data, searchQuery, sortOrder, searchYear, searchType) {
    try {
        if (!data.hits || !Array.isArray(data.hits)) {
            console.error('Invalid data structure:', data);
            throw new TypeError('data.hits is not an array');
        }

        const filteredDossiers = data.hits.filter(dossier => {
            if (dossier.dc_type === '1e-i') {
                return false; // Exclude dossiers with dc_type of '1e-i'
            }

            const title = dossier.dc_title ? dossier.dc_title.toLowerCase() : '';
            const description = dossier.dc_description ? dossier.dc_description.toLowerCase() : '';

            let matchesQuery = !searchQuery || title.includes(searchQuery.toLowerCase()) || description.includes(searchQuery.toLowerCase());

            if (!matchesQuery && searchQuery) {
                matchesQuery = dossier.foi_documents.some(file => file.dc_title && file.dc_title.toLowerCase().includes(searchQuery.toLowerCase()));
            }

            const matchesYear = !searchYear || dossier.dc_date_year === parseInt(searchYear);
            const matchesType = !searchType || dossier.dc_type === searchType;

            if (matchesQuery && matchesYear && matchesType) {
                console.log('Matched Dossier:', dossier);
            }

            return matchesQuery && matchesYear && matchesType;
        });

        const sortedDossiers = sortDossiers(filteredDossiers, sortOrder);

        console.log('Filtered Dossiers:', sortedDossiers);
        return { filteredDossiers: sortedDossiers, totalResults: sortedDossiers.length };
    } catch (error) {
        console.error('Error in filterDossiers:', error);
        return { filteredDossiers: [], totalResults: 0 };
    }
}

  /**
   * Sets up breadcrumb navigation in the UI.
   */
   function setupBreadcrumbNavigation() {
    // Displaying breadcrumb navigation as in your original script
    let breadcrumbHtml = `
      <div class="container">
        <div class="row">
          <div class="col-md-12 ml-0 mr-0 pr-0 pl-0">
            <ol class="breadcrumb pr-0 pl-0">
              <li class="breadcrumb-item">
                <a href="https://opendata.nijmegen.nl/">Home</a>
              </li>
              <li class="breadcrumb-item active">
                <a href="index.html">Woogle</a>
              </li>
            </ol>
          </div>
        </div>
      </div>`;
    document.getElementById('breadcrumb').innerHTML = breadcrumbHtml;
  }

/**
 * Renders pagination controls based on the total number of results and the current page.
 * @param {number} totalPages - The total number of pages.
 * @param {number} currentPage - The current page for pagination.
 */
function renderPaginationControls(totalPages, currentPage) {
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

    // Retrieve updated URL parameters
    const searchQuery = urlParams.get('q') || '*';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';
    const currentPage = parseInt(urlParams.get('page')) || 1;

    // Fetch updated search results
    fetchSearchResults(searchQuery, searchType, searchYear, sortOrder, currentPage);
}

/**
 * Creates and displays facets for filtering based on types, years, and topics from the dossier data.
 * @param {Array} filteredDossiers - The filtered array of dossiers.
 */
function setupFacets(facets) {
    // Create a map to store counts of each facet
    const typeCounts = new Map();
    const yearCounts = new Map();
    const publisherCounts = new Map();

    // Iterate over the facets to populate the maps
    facets.forEach(facetGroup => {
        Object.keys(facetGroup).forEach(facetKey => {
            const facet = facetGroup[facetKey];
            const facetName = facet.facet_name;
            const facetValue = facet.value;

            // Check if the facetKey is a year (e.g., 2024, 2023, etc.)
            if (!isNaN(facetKey)) {
                yearCounts.set(facetKey, facetValue);
            } else if (facetKey.startsWith('gm')) {
                publisherCounts.set(facetName, facetValue);
            } else {
                typeCounts.set(facetKey, facetValue);
            }
        });
    });

    // Generate HTML for facets with greyed out count
    const typeFacetHtml = Array.from(typeCounts).map(([type, count]) => `
        <li class="facets__item">
            <a class="facets__link" href="javascript:void(0)" onclick="updateFacetSelection('type', '${type}')">
                ${getTypeName(type)} <span class="woogle-grey">(${count})</span>
            </a>
        </li>
    `).join('');

    const yearFacetHtml = Array.from(yearCounts).map(([year, count]) => `
        <li class="facets__item">
            <a class="facets__link" href="javascript:void(0)" onclick="updateFacetSelection('year', '${year}')">
                ${year} <span class="woogle-grey">(${count})</span>
            </a>
        </li>
    `).join('');

    const publisherFacetHtml = Array.from(publisherCounts).map(([publisher, count]) => `
        <li class="facets__item">
            <a class="facets__link" href="javascript:void(0)" onclick="updateFacetSelection('publisher', '${publisher}')">
                ${publisher} <span class="woogle-grey">(${count})</span>
            </a>
        </li>
    `).join('');

    // Update the DOM with the generated HTML
    document.querySelector('.facets__types .facets__list').innerHTML = typeFacetHtml;
    document.querySelector('.facets__years .facets__list').innerHTML = yearFacetHtml;
    document.querySelector('.facets__publishers .facets__list').innerHTML = publisherFacetHtml;
}


/**
 * Updates the query parameters in the URL when the sort order is changed.
 * @param {string} newOrder - The new sort order to apply.
 */
/**
 * Updates the query parameters in the URL when the sort order is changed.
 * @param {string} newOrder - The new sort order to apply.
 */
function updateQueryParams(newOrder) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('order', newOrder);
    urlParams.set('page', 1); // Reset to the first page whenever the sorting order is changed

    // Retrieve updated URL parameters
    const searchQuery = urlParams.get('q') || '*';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = newOrder;
    const currentPage = 1;

    fetchSearchResults(searchQuery, searchType, searchYear, sortOrder, currentPage);
}