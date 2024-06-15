window.onload = function(){
    /* User clicks search button */
    document.querySelector('#search-button').onclick = function() {
        getResults();
    }

    /* User clicks enter */
    document.body.onkeydown = function(e) {
        if (e.keyCode == 13)
            getResults();
    };

    try {
      document.querySelector('#order').onchange = function() {
          getResults();
      }
    } catch (error) {}

    try {
      document.querySelector('.overview-iframe').width = screen.width;
      document.querySelector('.overview-iframe').height = screen.height;

    } catch (error) {
    }

    try {
      href_value = href.searchParams.get('order') ? href.searchParams.get('order') : 'relevance-desc';
      const $select = document.querySelector('#order');
      $select.value = href_value;
    } catch (error) {}

    /* set background of current tab */
    let current_url = document.location;
    document.querySelectorAll(".navbar .nav-link").forEach(function(e){
       if(e.href == current_url){
          e.classList += " current";
       }
    });

    /* Change page */
  $('.woogle-pagination-nr').each(function() {
    $(this).click(function() {
        href.searchParams.set('page', this.value);
        window.location.href = href;
    })
    })

    /* Change page */
    $('.woo-facet-value').each(function() {
        $(this).click(function() {
            href.searchParams.set('page', 1);
            parameterToSet = this.className.split(" ")[1];
            href.searchParams.set(parameterToSet, this.value);
            window.location.href = href;
        })
    })

    /* Expand facets */
    $('.woo-expand').each(function() {
        $(this).click(function() {
            facetType = this.className.split(" ")[1];
            const collection = document.getElementsByClassName('facet-disabled ' + facetType)
            for (let i = 0; i < collection.length; i++) {
            collection[i].style.display = "block";
            }
            document.getElementsByClassName('woo-collapse ' + facetType)[0].style.display = 'block';
            this.style.display = 'none';
        })
    })

    /* Collapse facets */
    $('.woo-collapse').each(function() {
        $(this).click(function() {
            facetType = this.className.split(" ")[1];
            const collection = document.getElementsByClassName('facet-disabled ' + facetType)
            for (let i = 0; i < collection.length; i++) {
            collection[i].style.display = "none";
            }
            document.getElementsByClassName('woo-expand ' + facetType)[0].style.display = 'block';
            this.style.display = 'none';
        })
    })

    /* Expand page hits */
    $('.woogle-expand-hits').each(function() {
        $(this).click(function() {
            dossierId = this.className.split(" ")[1];
            const collection = document.getElementsByClassName('woogle-page-hits ' + dossierId);
            collection[0].style.display = 'block';
            document.getElementsByClassName('woogle-collapse-hits ' + dossierId)[0].style.display = 'block';
            this.style.display = 'none';
        })
    })

    /* Collapse page hits */
    $('.woogle-collapse-hits').each(function() {
        $(this).click(function() {
            dossierId = this.className.split(" ")[1];
            const collection = document.getElementsByClassName('woogle-page-hits ' + dossierId);
            collection[0].style.display = 'none';
            document.getElementsByClassName('woogle-expand-hits ' + dossierId)[0].style.display = 'block';
            this.style.display = 'none';
        })
    })

    $('.crumb').each(function() {
        $(this).click(function() {
            handleDeleteCrumb(this);
        })
    })

    $('.register-click').each(function() {
        $(this).click(function() {
            registerClick(this);
        })
    })

}

href = new URL(window.location.href);

function getDataListSelectedOption(txt_input, data_list_options) 
  {
  var shownVal = document.getElementById(txt_input).value;
  var docvalue = document.querySelector("#" + data_list_options + ' option[value="' + shownVal + '"]');
  if (docvalue == null) {
    return null;
  }
  var value2send = document.querySelector("#" + data_list_options + ' option[value="' + shownVal + '"]').dataset.value;
              return value2send;
  }

  function getResults() {
      queryvalue = document.querySelector('#query').value
      query = queryvalue.replace(/“|”/g, '"');
      publisher = getDataListSelectedOption('publisher', 'woo-creators');
      country = getDataListSelectedOption('country', 'woo-countries');
      year_min = document.querySelector('#year_min').value;
      year_max = document.querySelector('#year_max').value;
      publication_type = getDataListSelectedOption('type', 'woo-types');
      pid = document.querySelector('#pid').value;
      page = 1;

      try {
        order = document.querySelector('#order').value;
      } catch (error) { order = null; }

      href.pathname = "/search"
      if (query) {
        href.searchParams.set('q', query);
      }
      if (publisher) {
        href.searchParams.set('publisher', publisher);
      }
      if (year_min) {
        href.searchParams.set('year-min', year_min);
      }
      if (year_max) {
        href.searchParams.set('year-max', year_max);
      }
      if (publication_type) {
        href.searchParams.set('type', publication_type);
      }
      if (pid) {
        href.searchParams.set('pid', pid);
      }
      if (order) {
        href.searchParams.set('order', order);
      }
      if (page) {
        href.searchParams.set('page', page);
      }
      if (country) {
        href.searchParams.set('country', country);
      }


      window.location.href = href;
  }



  /* Register click */
  function registerClick(resource) {

    var click_data = {
      'resourceID': resource.getAttribute('data-resource'),
      'query': document.querySelector('#query').value,
      'publisher': getDataListSelectedOption('publisher', 'woo-creators'),
      'year_min': document.querySelector('#year_min').value,
      'year_max': document.querySelector('#year_max').value,
      'publication_type': getDataListSelectedOption('type', 'woo-types')
    };

    /* Send click data to server */
    $.ajax({
      url: '/register_click',
      type: 'POST',
      data: JSON.stringify(click_data),   // converts js value to JSON string
      contentType: 'application/json',  // sends json
      })
      .done(function(){     // on success get the return object from server
          return true     // do whatever with it. In this case see it in console
      })
  }

  function handleDeleteCrumb(element) {
     var crumb = element.getAttribute('data-crumb').split('_')[1];
     href.searchParams.delete(crumb);
     href.searchParams.set('page', 1);
     window.location.href = href;
  }

  function homepage(){	
    var query = '*';
    window.location.href = "/search?q=" + SchoolId;
  }

  window.addEventListener( "pageshow", function ( event ) {
  var historyTraversal = event.persisted || 
                         ( typeof window.performance != "undefined" && 
                              window.performance.navigation.type === 2 );
  if ( historyTraversal ) {
    // Handle page restore.
    window.location.reload();
  }

  var perfEntries = performance.getEntriesByType("navigation");

  if (perfEntries[0].type === "back_forward") {
      location.reload();
  }
});
