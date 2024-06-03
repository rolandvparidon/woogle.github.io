// woogle.js

// Constants for pagination settings
const ITEMS_PER_PAGE = 10;


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

  /**
   * Initializes the application by fetching JSON data and setting up the UI.
   */
   document.addEventListener("DOMContentLoaded", function initApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q') || '';
    const sortOrder = urlParams.get('order') || 'relevance-desc';
    const currentPage = parseInt(urlParams.get('page')) || 1;
    const jsonData = './json/nijmegen.json';

    fetch(jsonData)
        .then(response => response.json())
        .then(data => setupUI(data, searchQuery, sortOrder, currentPage))
        .catch(error => console.error('Error loading the JSON data:', error));
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

    window.location.search = urlParams.toString();
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
            ${facet.key === 'type' ? 'Type: ' + '<strong>' + getTypeName(facet.value) + '</strong>' : capitalizeFirstLetter(facet.key) + ': ' + '<strong>' + facet.value + '</strong>'}
        </span>
        <a class="facets__link" href="javascript:void(0)" onclick="updateFacetSelection('${facet.key}', '${facet.value}', true)">
            <span class="remove-facet woogle-grey">x</span>
        </a>
    </li>
`).join('');

    const selectedFacetsContainer = document.querySelector('.facets__selected');
    const selectedFacetsList = selectedFacetsContainer.querySelector('.facets__list');

    selectedFacetsList.innerHTML = selectedFacetHtml;

    // Show or hide the selected facets section based on whether any facets are selected
    if (selectedFacets.length > 0) {
        selectedFacetsContainer.style.display = 'block';
    } else {
        selectedFacetsContainer.style.display = 'none';
    }
}

/**
 * Sets up the user interface with data obtained from the JSON fetch.
 * @param {Object} data - The JSON data containing dossiers.
 * @param {string} searchQuery - The search query to filter by.
 * @param {string} sortOrder - The sort order parameter.
 * @param {number} currentPage - The current page for pagination.
 */
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
        insertSearchComponents(searchQuery, sortOrder);
        insertOrderingComponents(sortOrder);
        displayDossiers(filteredDossiers, currentPage);
        updateResultsTitle(filteredDossiers, searchQuery, searchYear, searchType);
        setupFacets(filteredDossiers);
        setupSelectedFacets(); // Call the setupSelectedFacets function
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
    const searchBarHTML = `<div class="navbar__search">
      <button class="navbar__search-button" id="navbar-open-search">
        <span class="sr-only">Open zoekveld</span>
        <span class="mdi mdi-magnify" aria-hidden="true"></span>
      </button>
      <form action="index.html" method="get" class="autocomplete autocomplete__form" role="search">
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
    </div>`;
    document.querySelector('.results_wrapper').insertAdjacentHTML('afterbegin', searchBarHTML);
  }

/**
 * Inserts ordering-related components into the DOM.
 * @param {string} sortOrder - The current sort order.
 */
 function insertOrderingComponents(sortOrder) {
    const orderingHTML = `
        <div class="woo-ordering">
            <select class="woo-ordering-select form-select form-select-sm mb-3" id="order" onchange="updateQueryParams(this.value)">
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
    document.querySelector('.search-results-order').insertAdjacentHTML('afterbegin', orderingHTML);
}


/**
 * Displays the filtered and sorted dossiers in the UI.
 * @param {Array} filteredDossiers - Array of filtered and sorted dossiers.
 * @param {number} currentPage - The current page for pagination.
 */
function displayDossiers(filteredDossiers, currentPage) {
    // Calculate start and end indices for the current page
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedDossiers = filteredDossiers.slice(startIndex, endIndex);

    // Generating and displaying list items for each dossier
    const listItems = paginatedDossiers.map(dossier => {
        const detailUrl = `dossier.html?pid=${dossier.dc_identifier}`;
        const title = dossier.dc_title ? capitalizeFirstLetter(dossier.dc_title) : '';
        const description = dossier.dc_description ? truncateText(capitalizeFirstLetter(dossier.dc_description), 250) : '';
        const fileNames = dossier.foi_files && dossier.foi_files.length > 0
            ? dossier.foi_files.map(file => `<p>${file.foi_fileName}</p>`).join('')
            : '';

        return `<li class="search-results__item">
            <h2 class="search-results__item-title">
                <a href="${detailUrl}">${title}</a>
            </h2>
            <div class="search-results__item-body">
                <p>${description}</p>
                
            </div>
            <span class="badge badge-success mr-2" itemprop="encodingFormat">${capitalizeFirstLetter(dossier.tooiwl_topic || '')}</span>
            <span class="badge badge-info mr-2">${capitalizeFirstLetter(dossier.foi_valuation || '')}</span>
            <span class="badge badge-primary">Publicatie: ${dossier.foi_publishedDate || ''}</span>
        </li>`;
    }).join('');
    document.getElementById('search-results').innerHTML = listItems;
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
    window.location.search = urlParams.toString();
}

/**
 * Changes the page and updates the URL parameters.
 * @param {number} newPage - The new page number to navigate to.
 */
function changePage(newPage) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('page', newPage);
    window.location.search = urlParams.toString();
}

/**
 * Updates the results title based on the number of results and the search query.
 * @param {Array} filteredDossiers - Array of filtered and sorted dossiers.
 * @param {string} searchQuery - The search query used.
 */
function updateResultsTitle(filteredDossiers, searchQuery, searchYear, searchType) {
    console.log("Data Received:", searchQuery, searchYear, searchType);
    let resultText = 'Alle Dossiers';
    if (filteredDossiers.length === 1) {
        resultText = `${filteredDossiers.length} resultaat voor "${searchQuery}"`;
    } else {
        if (searchQuery) {
            resultText = `${filteredDossiers.length} resultaten voor "${searchQuery}"`;
        }
        if (searchYear) {
            resultText = `${filteredDossiers.length} resultaten voor het jaar "${searchYear}"`;
        }
        if (searchType) {
            const typeName = getTypeName(searchType) || capitalizeFirstLetter(searchType);
            resultText = `${filteredDossiers.length} resultaten voor type "${typeName}"`;
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

            // Exclude documents of type '1e' (Bereikbaarheidsgegevens)
            if (dossier.dc_type === '1e') {
                return false;
            }

            return (!searchQuery || title.includes(searchQuery.toLowerCase()) || description.includes(searchQuery.toLowerCase())) &&
                   (!searchYear || dossier.dc_date_year === parseInt(searchYear)) &&
                   (!searchType || dossier.dc_type === searchType);
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
    window.location.search = urlParams.toString();
  }
