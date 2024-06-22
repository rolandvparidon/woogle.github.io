document.addEventListener("DOMContentLoaded", function() {
    fetchMunicipalities();
  
    function fetchMunicipalities() {
      fetch('http://localhost:3000/api/municipalities')
        .then(response => response.json())
        .then(data => {
          const municipalities = data.infobox;
          const municipalitySelect = document.getElementById('municipality');
          for (const key in municipalities) {
            const option = document.createElement('option');
            option.value = municipalities[key].foi_prefix;
            option.textContent = municipalities[key].dc_publisher_name;
            municipalitySelect.appendChild(option);
          }
        });
    }
  
    window.updatePublisher = function() {
      const selectedMunicipality = document.getElementById('municipality').value;
      localStorage.setItem('selectedMunicipality', selectedMunicipality);
    };
  
    window.generateFiles = function() {
      const selectedMunicipality = localStorage.getItem('selectedMunicipality');
      if (!selectedMunicipality) {
        alert("Please select a municipality");
        return;
      }
      // Generate search.html, dossier.html, woogle.css, and woogle.js
      generateSearchHtml(selectedMunicipality);
      generateDossierHtml(selectedMunicipality);
      generateWoogleJs(selectedMunicipality);
      generateWoogleCss();
    };
  
    function generateSearchHtml(municipality) {
      const searchHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Results</title>
    <link rel="stylesheet" href="woogle.css">
  </head>
  <body>
    <header>
      <h1>Search Results for Municipality</h1>
    </header>
    <main>
      <div id="search-bar" class="search-bar">
        <input type="text" id="query" placeholder="Search...">
        <button id="search-button">Search</button>
      </div>
      <div id="facet-search" class="facet-search">
        <!-- Facet search options go here -->
      </div>
      <div id="search-results" class="search-results">
        <!-- Search results will be populated here -->
      </div>
    </main>
    <script src="woogle.js"></script>
  </body>
  </html>
      `;
      downloadFile('search.html', searchHtml);
    }
  
    function generateDossierHtml(municipality) {
      const dossierHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dossier</title>
    <link rel="stylesheet" href="woogle.css">
  </head>
  <body>
    <header>
      <h1>Dossier for Municipality</h1>
    </header>
    <main>
      <div id="dossier-content">
        <!-- Dossier content will be populated here -->
      </div>
    </main>
    <script src="woogle.js"></script>
  </body>
  </html>
      `;
      downloadFile('dossier.html', dossierHtml);
    }
  
    function generateWoogleJs(municipality) {
      const woogleJs = `
  const urlParams = new URLSearchParams(window.location.search);
  const publisher = urlParams.get('publisher') || '${municipality}';
  
  window.onload = function() {
    document.querySelector('#search-button').onclick = function() {
      getResults();
    };
  
    document.body.onkeydown = function(e) {
      if (e.keyCode == 13) getResults();
    };
  
    function getResults() {
      const query = document.querySelector('#query').value;
      const apiUrl = \`https://pid.wooverheid.nl/?q=\${query}&publisher=\${publisher}\`;
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          const resultsContainer = document.querySelector('#search-results');
          resultsContainer.innerHTML = '';
          data.results.forEach(result => {
            const resultHtml = \`<div class='result-item'>\${result.title}</div>\`;
            resultsContainer.innerHTML += resultHtml;
          });
        });
    }
  };
      `;
      downloadFile('woogle.js', woogleJs);
    }
  
    function generateWoogleCss() {
      const woogleCss = `
  body {
    font-family: Arial, sans-serif; /* Customize as needed */
    color: #000; /* Default text color */
  }
  
  header {
    background-color: #0000ff; /* Primary color */
    color: #fff;
    padding: 10px;
    text-align: center;
  }
  
  .search-bar {
    margin: 20px;
    text-align: center;
  }
  
  .facet-search {
    background-color: #00ff00; /* Secondary color */
    padding: 10px;
  }
  
  .result-item {
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
      `;
      downloadFile('woogle.css', woogleCss);
    }
  
    function downloadFile(filename, content) {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  });