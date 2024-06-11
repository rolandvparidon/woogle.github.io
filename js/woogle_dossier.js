let cachedDossierData = null;

/**
 * Retrieves a query parameter value from the URL.
 * @param {string} param - The name of the query parameter.
 * @returns {string|null} The value of the query parameter or null if not found.
 */
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Fetches the JSON data from a given URL.
 * @param {string} url - The URL to fetch the JSON data from.
 * @returns {Promise<Object>} A promise that resolves to the JSON data.
 */
function fetchJsonData(url) {
    return fetch(url, { mode: 'cors' })
        .then(response => response.json())
        .catch(error => {
            console.error('Error loading JSON data:', error);
            throw error;
        });
}

/**
 * Updates the form action to include the dossier ID.
 * @param {string} dossierId - The dossier identifier.
 */
function updateFormAction(dossierId) {
    const searchForm = document.querySelector('.autocomplete__form');
    if (searchForm) {
        searchForm.action = `index.html?pid=${dossierId}`;
        const hiddenPidInput = searchForm.querySelector('input[name="pid"]');
        if (hiddenPidInput) {
            hiddenPidInput.value = dossierId;
        }
    }
}

/**
 * Generates the breadcrumb HTML content.
 * @param {string} dossierTitle - The title of the dossier.
 * @returns {string} The HTML content for the breadcrumb.
 */
function generateBreadcrumbHtml(dossierTitle) {
    return `
        <div class="container">
            <div class="row">
                <div class="col-md-12 ml-0 mr-0 pr-0 pl-0">
                    <ol class="breadcrumb pr-0 pl-0">
                        <li class="breadcrumb-item">
                            <a href="https://opendata.nijmegen.nl/">Home</a>
                        </li>
                        <li class="breadcrumb-item">
                            <a href="index.html">Woogle</a>
                        </li>
                        <li class="breadcrumb-item active">
                            <span>${dossierTitle}</span>
                        </li>
                    </ol>
                </div>
            </div>
        </div>`;
}

/**
 * Generates the main content HTML for the dossier page.
 * @param {Object} dossier - The dossier object.
 * @returns {string} The HTML content for the main content area.
 */
function generateMainContentHtml(dossier) {
    return `
        <div class="row">
            <h1 class="dataset-title">
                <span itemprop="name">${capitalizeFirstLetter(dossier.dc_title)}</span>
            </h1>
        </div>
        <div class="row mb-3">
            <p itemprop="description">${capitalizeFirstLetter(dossier.dc_description)}</p>
        </div>
        <div class="row mb-3">
            <a href="https://pid.wooverheid.nl/?pid=${dossier.dc_identifier}" target="_blank" rel="nofollow" data-toggle="tooltip" data-placement="top"
               title="Bekijk op Woogle" data-original-title="Bekijk op Woogle">
                <div class="chip waves-effect">
                    <img src="https://opendata.nijmegen.nl/themes/custom/odn_theme/images/overheid_nl.png" aria-hidden="true"
                         alt="data.overheid.nl logo">
                         Bekijk op Woogle
                </div>
            </a>
            <a href="https://pid.wooverheid.nl/?pid=${dossier.dc_identifier}&zip=true" target="_blank" title="Download volledig dossier"
               download="dossier-${dossier.dc_identifier}.zip" data-toggle="tooltip" data-placement="top" rel="noopener">
                <div class="chip waves-effect">
                    <span itemprop="keywords">📄 Download volledig dossier</span>
                </div>
            </a>
        </div>
        `;
}

/**
 * Generates the HTML content for file groups and tables.
 * @param {Object} dossier - The dossier object.
 * @param {Object} fileGroups - The grouped files by type.
 * @returns {string} The HTML content for the file groups and tables.
 */
function generateFileGroupsHtml(dossier, fileGroups) {
    let contentHtml = '';

    Object.keys(fileGroups).forEach(type => {
        if (fileGroups[type].length > 0) {
            contentHtml += `
                <div class="row mb-5">
                    <h2 class="h4">${capitalizeFirstLetter(type)} (${fileGroups[type].length})</h2>`;

            if (type === 'verzoek') {
                contentHtml += `<div itemprop="description" style="width: 100%;">${capitalizeFirstLetter(dossier.foi_requestText)}</div>`;
            } else if (type === 'besluit') {
                contentHtml += `<div itemprop="description" style="width: 100%;">${capitalizeFirstLetter(dossier.foi_decisionText)}</div>`;
            }

            contentHtml += `
                <table class="responsive-table complex-table">
                    <caption class="sr-only" aria-hidden="true">De beschikbare distributievormen van deze dataset.</caption>
                    <thead>
                        <tr>
                            <th>Documenten</th>
                            <th class="w-25">Opties</th>
                        </tr>
                    </thead>
                    <tbody>`;

            fileGroups[type].forEach(file => {
                const format = file.dc_format.replace('application/', ''); // Remove 'application/'
                const downloadUrl = `https://pid.wooverheid.nl/${file.dc_identifier}`;
                const pageText = file.foi_nrPages === 1 ? 'pagina' : 'pagina\'s'; // Handle pluralization of page count
                const fairiscore = getFairScore(file); // Use getFairScore function
                const fileName = (dossier.dc_type === '2i') ? file.foi_fileName : file.dc_title; // Use foi_fileName for type '2i', dc_title for others

                contentHtml += `
                    <tr itemprop="distribution" itemscope itemtype="https://schema.org/DataDownload">
                        <th>
                            <span itemprop="name">${fileName || 'Naamloos bestand'}</span>
                            <p class="font-weight-normal" itemprop="text">${file.dc_identifier}</p>
                            <p class="font-weight-normal">
                                <span class="badge badge-success mr-2">Fairiscore: ${fairiscore}</span>
                                <span class="badge badge-info mr-2">${format}</span>
                                <span class="badge badge-primary">${file.foi_nrPages} ${pageText}</span>
                            </p>
                        </th>
                        <td class="w-25 text-center">
                            <ul class="list-unstyled">
                                <li>
                                    <a itemprop="contentUrl" href="${downloadUrl}" target="_blank" class="font-weight-bold"
                                       title="Download de documenten">Download</a>
                                </li>
                            </ul>
                        </td>
                    </tr>`;
            });

            contentHtml += `</tbody></table></div>`;
        }
    });

    return contentHtml;
}

/**
 * Generates the HTML content for the side panel.
 * @param {Object} dossier - The dossier object.
 * @returns {string} The HTML content for the side panel.
 */
function generateSidePanelHtml(dossier) {
    const fairiscore = getFairScore(dossier); // Use getFairScore function
    const typeCode = dossier.dc_type;
    const typeDisplayName = getTypeName(typeCode); // Use getTypeName function
    return `
        <div class="row mb-3">
            <div class="col-12">
                <h2 class="h5">Algemeen</h2>
                <dl>
                    <dt>Aanbieder</dt>
                    <dd><span itemprop="creativeWorkStatus">${dossier.dc_publisher_name || 'Gemeente Nijmegen'}</span></dd>
                    <dt>Thema</dt>
                    <dd>${capitalizeFirstLetter(dossier.tooiwl_topic || 'Geen thema beschikbaar')}</dd>
                    <dt>Type</dt>
                    <dd>${typeDisplayName}</dd>
                </dl>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-12">
                <h2 class="h5">Data</h2>
                <dl>
                    <dt>Verzoekdatum</dt>
                    <dd>${safeValue(dossier.foi_requestDate)}</dd>
                    <dt>Besluitdatum</dt>
                    <dd>${safeValue(dossier.foi_decisionDate)}</dd>
                    <dt>Publicatiedatum</dt>
                    <dd>${safeValue(dossier.foi_publishedDate)}</dd>
                    <dt>Verkregen op</dt>
                    <dd>${safeValue(dossier.foi_retrievedDate)}</dd>
                    <dt>Jaar</dt>
                    <dd>${safeValue(dossier.dc_date_year)}</dd>
                </dl>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-12">
                <h2 class="h5">Documenten</h2>
                <dl>
                    <dt>Aantal documenten</dt>
                    <dd>${safeValue(dossier.foi_nrDocuments)}</dd>
                    <dt>Aantal paginas</dt>
                    <dd>${safeValue(dossier.foi_nrPagesInDossier)}</dd>
                    <dt>Fairiscore</dt>
                    <dd>${safeValue(fairiscore)}</dd>
                </dl>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-12">
                <h2 class="h5">Contactgegevens</h2>
                <dl>
                    <dt>Naam</dt>
                    <dd>WOO Nijmegen</dd>
                    <dt>E-mail</dt>
                    <dd>
                        <a href="mailto:woo@nijmegen.nl">
                            woo@nijmegen.nl
                        </a>
                    </dd>
                </dl>
            </div>
        </div>`;
}

document.addEventListener("DOMContentLoaded", function() {
    const dossierId = getQueryParam('pid');
    if (!dossierId) {
        console.error('Dossier ID not provided.');
        document.querySelector('.dataset-body').innerHTML = '<p>Dossier ID not provided.</p>';
        return;
    }

    const apiUrl = `https://pid.wooverheid.nl/?pid=${dossierId}&infobox=true`;

    fetchJsonData(apiUrl)
        .then(data => {
            cachedDossierData = data.infobox;
            renderDossierPage(data.infobox, dossierId);
        })
        .catch(error => {
            console.error('Error loading JSON data:', error);
            document.querySelector('.dataset-body').innerHTML = '<p>Error loading data.</p>';
        });
});

function renderDossierPage(data, dossierId) {
    const dossier = data;
    if (!dossier) {
        console.error('Dossier not found.');
        document.querySelector('.dataset-body').innerHTML = '<p>Dossier not found.</p>';
        return;
    }

    updateFormAction(dossierId);

    const breadcrumbHtml = generateBreadcrumbHtml(dossier.dc_title);
    document.getElementById('breadcrumb').innerHTML = breadcrumbHtml;

    const mainContentHtml = generateMainContentHtml(dossier);
    document.querySelector('.dataset-body').innerHTML = mainContentHtml;

    const fileGroups = {
        'verzoek': [],
        'besluit': [],
        'bijlage': [],
        'overige': []
    };

    dossier.foi_files.forEach(file => {
        if (fileGroups[file.dc_type]) {
            fileGroups[file.dc_type].push(file);
        } else {
            fileGroups['overige'].push(file);
        }
    });

    const fileGroupsHtml = generateFileGroupsHtml(dossier, fileGroups);
    document.querySelector('.dataset-body').insertAdjacentHTML('beforeend', fileGroupsHtml);

    const sidePanelHtml = generateSidePanelHtml(dossier);
    document.querySelector('.col-lg-3.col-md-3.col-xs-12.pr-0').innerHTML = sidePanelHtml;

    // Update the document title with the dc_title, truncated if necessary
    const maxTitleLength = 50;
    let truncatedTitle = dossier.dc_title;
    if (truncatedTitle.length > maxTitleLength) {
        truncatedTitle = truncatedTitle.substring(0, maxTitleLength) + '...';
    }
    document.title = `Dossier: ${truncatedTitle}`;
}