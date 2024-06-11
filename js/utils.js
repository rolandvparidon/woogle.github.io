/**
 * Capitalizes the first letter of a given string.
 * @param {string} string - The string to capitalize.
 * @returns {string} The capitalized string.
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Returns a safe value or 'Onbekend' if the value is undefined or null.
 * @param {any} value - The value to check.
 * @returns {any} The original value or 'Onbekend'.
 */
function safeValue(value) {
    return (value === undefined || value === null) ? 'Onbekend' : value;
}

/**
 * Truncates a string to the specified length and adds an ellipsis if truncated.
 * @param {string} text - The text to truncate.
 * @param {number} maxLength - The maximum length of the truncated string.
 * @returns {string} The truncated string with ellipsis if applicable.
 */
function truncateText(text, maxLength) {
    if (text.length > maxLength) {
        return text.substring(0, maxLength) + '...';
    }
    return text;
}

// Mapping for type codes to names.
const typeNamesMap = {
    '2k': 'Beschikking',
    '2c': 'Vergaderstuk decentrale overheid',
    '2i': 'Dossier na Woo/Wob-verzoek',
    '1e': 'Bereikbaarheidsgegevens',
    '1e-i': 'Verwijsindex'
};

/**
 * Gets the name for a given type code.
 * @param {string} typeCode - The type code to get the name for.
 * @returns {string} The name corresponding to the type code.
 */
function getTypeName(typeCode) {
    return typeNamesMap[typeCode] || 'Onbekend';
}

/**
 * Retrieves the FAIR score from a dossier or file.
 * @param {Object} item - The dossier or file object.
 * @returns {string|number} The FAIR score (v2) or 'N/A' if not available.
 */
function getFairScore(item) {
    if (item.foi_fairiscore !== undefined) {
        return item.foi_fairiscore;
    }
    if (item.foi_fairiscoreVersions && item.foi_fairiscoreVersions.v2 !== undefined) {
        return item.foi_fairiscoreVersions.v2;
    }
    return 'N/A';
}

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
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.error('Error loading JSON data:', error);
            throw error;
        });
}