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

    // Determine the sort order based on the presence of facets or search query
    let sortOrder = 'date-desc';
    if (searchQuery || searchType || searchYear) {
        sortOrder = 'relevance-desc';
    } else {
        sortOrder = urlParams.get('order') || 'date-desc';
    }

    const currentPage = parseInt(urlParams.get('page')) || 1;
    const jsonData = './json/nijmegen.json';

    if (!cachedData) {
        fetch(jsonData)
            .then(response => response.json())
            .then(data => {
                cachedData = data;
                setupUI(data, searchQuery, sortOrder, currentPage);
            })
            .catch(error => console.error('Error loading the JSON data:', error));
    } else {
        setupUI(cachedData, searchQuery, sortOrder, currentPage);
    
    }
});


/**
 * Updates the URL parameters when a facet is selected or deselected.
 * @param {string} key - The key of the facet (type, year, search).
 * @param {string} value - The value of the facet.
 * @param {boolean} remove - Whether to remove the facet from the selection.
 */
function updateFacetSelection(key, value, remove = false) {
    const urlParams = new URLSearchParams(window.location.search);

    if (remove) {
        urlParams.delete(key === 'search' ? 'q' : key);
    } else {
        urlParams.set(key === 'search' ? 'q' : key, value);
    }

    // Reset page to 1 whenever a facet is selected or deselected
    urlParams.set('page', 1);

    // Update URL without reloading the page
    history.pushState(null, '', '?' + urlParams.toString());

    // Retrieve updated URL parameters
    const searchQuery = urlParams.get('q') || '';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';

    // Update the UI with filtered data immediately using cached data
    if (cachedData) {
        setupUI(cachedData, searchQuery, sortOrder, 1);
    }
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
    window.location.search = urlParams.toString();
}

function setupUI(data, searchQuery, sortOrder, currentPage) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const searchYear = urlParams.get('year') || '';
        const searchType = urlParams.get('type') || '';

        console.log('Calling filterDossiers with:', { data, searchQuery, sortOrder, searchYear, searchType });
        const { filteredDossiers, totalResults } = filterDossiers(data, searchQuery, sortOrder, searchYear, searchType);
        
        if (!Array.isArray(filteredDossiers)) {
            console.error('filteredDossiers is not an array:', filteredDossiers);
            throw new TypeError('filteredDossiers is not an array');
        }

        console.log('Setting up UI with filteredDossiers:', filteredDossiers);

        // Inject the entire structure into results_wrapper
        const resultsWrapper = document.querySelector('.results_wrapper');
        resultsWrapper.innerHTML = `
            <section class="search-results">
                <div class="search-results-header">
                    <h1>WOO Dossiers</h1>
                    <p itemprop="description" class="search-results__title"></p>
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
        displayDossiers(filteredDossiers, currentPage, searchQuery); // Pass searchQuery here
        updateResultsTitle(filteredDossiers, searchQuery, searchYear, searchType);
        setupFacets(filteredDossiers);
        setupSelectedFacets();
        renderPaginationControls(totalResults, currentPage);
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
    const searchBarHTML = `
        <button class="navbar__search-button" id="navbar-open-search">
            <span class="sr-only">Open zoekveld</span>
            <span class="mdi mdi-magnify" aria-hidden="true"></span>
        </button>
        <form id="search-form" class="autocomplete autocomplete__form" role="search">
            <input placeholder="Waar bent u naar op zoek?" id="suggest-search-query" autocomplete="off" aria-label="Zoekveld" class="autocomplete__input form-control form-text mb-3" type="text" name="q" value="${searchQuery}">
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

    // Update URL without reloading the page
    history.pushState(null, '', '?' + urlParams.toString());

    // Retrieve updated URL parameters
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';
    const currentPage = parseInt(urlParams.get('page')) || 1;

    // Update the UI with filtered data immediately using cached data
    if (cachedData) {
        setupUI(cachedData, searchQuery, sortOrder, currentPage);
    }
}

/**
 * Inserts ordering-related components into the DOM.
 * @param {string} sortOrder - The current sort order.
 */
function insertOrderingComponents(sortOrder) {
    const orderingHTML = `
        <div class="woo-ordering">
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

function displayDossiers(filteredDossiers, currentPage, searchQuery) {
    // Calculate start and end indices for the current page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedDossiers = filteredDossiers.slice(startIndex, endIndex);

    // Generating and displaying list items for each dossier
    const listItems = paginatedDossiers.map(dossier => {
        const detailUrl = `dossier.html?pid=${dossier.dc_identifier}`;
        const title = dossier.dc_title ? capitalizeFirstLetter(dossier.dc_title) : '';
        const description = dossier.dc_description ? truncateText(capitalizeFirstLetter(dossier.dc_description), 250) : '';

        // Generate matching files list if any
        let matchingFiles = '';
        if (dossier.foi_files && searchQuery) {
            const matchedFiles = dossier.foi_files.filter(file => {
                const fileTitle = file.dc_title || file.foi_fileName || '';
                return fileTitle.toLowerCase().includes(searchQuery.toLowerCase());
            });
            if (matchedFiles.length > 0) {
                const matchingFileItems = matchedFiles.map(file => {
                    const fileTitle = file.dc_title || file.foi_fileName || 'Naamloos bestand';
                    return `<li>${fileTitle}</li>`;
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
                                    <ul>${matchingFileItems}</ul>
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

/**
 * Changes the page and updates the URL parameters.
 * @param {number} newPage - The new page number to navigate to.
 */
function changePage(newPage) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', newPage);

    // Update URL without reloading the page
    history.pushState(null, '', '?' + urlParams.toString());

    // Retrieve updated URL parameters
    const searchQuery = urlParams.get('q') || '';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';

    // Update the UI with filtered data immediately using cached data
    if (cachedData) {
        setupUI(cachedData, searchQuery, sortOrder, newPage);
    }
}

function updateResultsTitle(filteredDossiers, searchQuery, searchYear, searchType) {
    let resultText = 'Alle dossiers';
    
    const hasFilters = searchQuery || searchYear || searchType;

    if (hasFilters) {
        if (filteredDossiers.length === 1) {
            resultText = `${filteredDossiers.length} dossier`;
        } else {
            resultText = `${filteredDossiers.length} dossiers`;
        }
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
        if (!data || !data.infobox || !Array.isArray(data.infobox.foi_dossiers)) {
            console.error('Invalid data structure:', data);
            throw new TypeError('data.infobox.foi_dossiers is not an array');
        }

        const filteredDossiers = data.infobox.foi_dossiers.filter(dossier => {
            const title = dossier.dc_title ? dossier.dc_title.toLowerCase() : '';
            const description = dossier.dc_description ? dossier.dc_description.toLowerCase() : '';

            let matchesQuery = !searchQuery || title.includes(searchQuery.toLowerCase()) || description.includes(searchQuery.toLowerCase());

            if (!matchesQuery && searchQuery) {
                matchesQuery = dossier.foi_files.some(file => file.dc_title && file.dc_title.toLowerCase().includes(searchQuery.toLowerCase()));
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
 * Creates and displays facets for filtering based on types, years, and topics from the dossier data.
 * @param {Array} filteredDossiers - The filtered array of dossiers.
 */
function setupFacets(filteredDossiers) {
    // Create a map to store counts of each facet
    const typeCounts = new Map();
    const yearCounts = new Map();
    const topicCounts = new Map();

    // Count occurrences of each type, year, and topic in the filtered dossiers
    filteredDossiers.forEach(dossier => {
        // Count types
        if (typeCounts.has(dossier.dc_type)) {
            typeCounts.set(dossier.dc_type, typeCounts.get(dossier.dc_type) + 1);
        } else {
            typeCounts.set(dossier.dc_type, 1);
        }

        // Count years
        if (yearCounts.has(dossier.dc_date_year)) {
            yearCounts.set(dossier.dc_date_year, yearCounts.get(dossier.dc_date_year) + 1);
        } else {
            yearCounts.set(dossier.dc_date_year, 1);
        }

        // Count topics
        const topic = dossier.tooiwl_topic || '';
        if (topic) {
            if (topicCounts.has(topic)) {
                topicCounts.set(topic, topicCounts.get(topic) + 1);
            } else {
                topicCounts.set(topic, 1);
            }
        }
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

    const topicFacetHtml = Array.from(topicCounts).map(([topic, count]) => `
        <li class="facets__item">
            <a class="facets__link" href="javascript:void(0)" onclick="updateFacetSelection('topic', '${topic}')">
                ${capitalizeFirstLetter(topic)} <span class="woogle-grey">(${count})</span>
            </a>
        </li>
    `).join('');

    // Update the DOM with the generated HTML
    document.querySelector('.facets__types .facets__list').innerHTML = typeFacetHtml;
    document.querySelector('.facets__years .facets__list').innerHTML = yearFacetHtml;
    document.querySelector('.facets__topics .facets__list').innerHTML = topicFacetHtml;
}


/**
 * Updates the query parameters in the URL when the sort order is changed.
 * @param {string} newOrder - The new sort order to apply.
 */
function updateQueryParams(newOrder) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('order', newOrder);
    urlParams.set('page', 1); // Reset to the first page whenever the sorting order is changed

    // Update URL without reloading the page
    history.pushState(null, '', '?' + urlParams.toString());

    // Retrieve updated URL parameters
    const searchQuery = urlParams.get('q') || '';
    const searchType = urlParams.get('type') || '';
    const searchYear = urlParams.get('year') || '';

    // Update the UI with filtered data immediately using cached data
    if (cachedData) {
        setupUI(cachedData, searchQuery, newOrder, 1);
    }
}