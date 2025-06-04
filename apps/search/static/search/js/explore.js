/**
 * debounce:
 *   Returns a debounced version of a function, so it only executes
 *   after `delay` ms have passed since the last call.
 */
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  }
}

// Cache DOM elements for performance
const searchBox       = document.getElementById('searchbox');
const suggestionsList = document.getElementById('suggestions-list');
const searchForm      = document.getElementById('search-form');
const searchResultsList   = document.getElementById('search-results-list');
const searchResultsCard   = document.getElementById('search-results-card');
const resultsCount   = document.getElementById('results-count');

/**
 * fetchSuggestions:
 *   Fetch autocomplete suggestions from /api/search/suggest/?q=<term>
 *   and populate the #suggestions-list <ul> with <li> items.
 */
async function fetchSuggestions(query) {
  // Hide suggestions if fewer than 2 characters
  if (!query || query.trim().length < 2) {
    suggestionsList.innerHTML = '';
    suggestionsList.classList.add('hidden');
    return;
  }

  try {
    const response = await fetch(`/api/search/suggest/?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    const titles = await response.json();

    // Clear existing suggestions
    suggestionsList.innerHTML = '';

    // If no suggestions, hide the list and return
    if (!titles.length) {
      suggestionsList.classList.add('hidden');
      return;
    }

    // Build <li> for each suggestion
    titles.forEach(title => {
      const li = document.createElement('li');
      li.textContent = title;
      li.className = 'px-4 py-2 hover:bg-gray-100';
      // On click, fill input and trigger search
      li.addEventListener('click', () => {
        searchBox.value = title;
        suggestionsList.innerHTML = '';
        suggestionsList.classList.add('hidden');
        performSearch();  // Auto-submit form
      });
      suggestionsList.appendChild(li);
    });
    // Show the dropdown
    suggestionsList.classList.remove('hidden');
  } catch (error) {
    console.error('Error fetching suggestions:', error);
  }
}

/**
 * performSearch:
 *   Serialize form inputs, call /api/search/documents/?... via AJAX,
 *   and render results in #search-results.
 */
async function performSearch() {
  const formData = new FormData(searchForm);
  const params = new URLSearchParams();

  // Append only non-empty values
  for (const [key, value] of formData.entries()) {
    if (value && value.trim().length) {
      params.append(key, value.trim());
    }
  }

  try {
    const response = await fetch(`/api/search/documents/?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    const data = await response.json();
    renderSearchResults(data);
  } catch (error) {
    console.error('Error performing search:', error);
  }
}

/**
 * renderSearchResults:
 *   Given { count, next, previous, results: [...] }, build HTML
 *   and inject into #search-results, including pagination controls.
 */
function renderSearchResults(data) {
  const { count, next, previous, results } = data;

  // Total results count
  resultsCount.innerHTML = `${count} documento(s) encontrado(s)`;

  // Display mode: grid of cards. Adjust classes según tu estructura
  let cardsHtml = '<div class="documents-grid">';
  results.forEach(doc => {
    cardsHtml += `
      <div class="document-card">
        <div class="document-header">
          <div class="document-title">${doc.title}</div>
          <div class="document-meta">
            <span class="document-date">${doc.event_date}</span>
            <span class="document-organization">${doc.country || ''}</span>
          </div>
        </div>
        <div class="document-body">
          <div class="document-tags">
            <span class="doc-tag location">${doc.country || 'N/A'}</span>
    `;
    for (const actor of doc.actors) {
      cardsHtml += `<span class="doc-tag actor">${actor}</span>`;
    }
    for (const theme of doc.themes) {
      cardsHtml += `<span class="doc-tag theme">${theme}</span>`;
    }
    cardsHtml += `
           </div>
             <p class="document-excerpt">${doc.executive_summary || ''}</p>
        </div>
        <div class="document-footer">
          <a onClick=showDetails(${doc.id}) class="btn btn-secondary">Ver Detalles</a>
          <button class="document-action">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  });
  cardsHtml += '</div>';

  // Inject into DOM
  searchResultsCard.innerHTML = cardsHtml;

  let listHtml = '<div class="documents-list"">';
  results.forEach(doc => {
    listHtml += `
      <div class="document-list-item">
        <div class="document-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="document-list-content">
          <div class="document-list-title">${doc.title}</div>
          <div class="document-list-meta">
            <span>${doc.event_date}</span>
          </div>
          <div class="document-list-tags">
            <span class="doc-tag location">${doc.country || 'N/A'}</span>
    `;
    for (const actor of doc.actors) {
      listHtml += `<span class="doc-tag actor">${actor}</span>`;
    }
    for (const theme of doc.themes) {
      listHtml += `<span class="doc-tag theme">${theme}</span>`;
    }
    listHtml += `
          </div>
          <p class="document-excerpt">${doc.executive_summary || ''}</p>
        </div>
        <div class="document-list-actions" >
          <a onClick=showDetails(${doc.id}) class="btn btn-secondary btn-sm">Ver Detalles</a>
        </div>
      </div>
        `;
  });
  listHtml += '</div>';
  searchResultsList.innerHTML = listHtml;


}

/**
 * fetchPage:
 *   Given a paginated URL (next/previous), fetch JSON and re-render.
 */
async function fetchPage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    const data = await response.json();
    renderSearchResults(data);
  } catch (error) {
    console.error('Error fetching page:', error);
  }
}

// Debounce fetchSuggestions by 250ms
const debouncedFetch = debounce(() => {
  fetchSuggestions(searchBox.value);
}, 250);

// 1) Autocomplete: listen to input events
searchBox.addEventListener('input', debouncedFetch);

// 2) Hide suggestions if click outside
document.addEventListener('click', event => {
  if (!searchBox.contains(event.target) && !suggestionsList.contains(event.target)) {
    suggestionsList.innerHTML = '';
    suggestionsList.classList.add('hidden');
  }
});

// 3) Intercept form submit to do AJAX search
searchForm.addEventListener('submit', event => {
  event.preventDefault();
  suggestionsList.innerHTML = '';
  suggestionsList.classList.add('hidden');
  performSearch();
});

// 4) On page load, if URL tiene parámetros, ejecutar búsqueda inicial
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('q') || urlParams.has('date_after')) {
    performSearch();
  }
});

function showDetails(docId) {
  // Redirect to the document details page
  // TODO: Implement the logic to pass the document ID if needed
  window.location.href = `/document_detail/`;
}