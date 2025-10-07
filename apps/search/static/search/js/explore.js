(() => {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // 1) DOM References
  // ──────────────────────────────────────────────────────────
  const searchBox       = document.getElementById('searchbox');
  const searchButton    = document.getElementById('search-button');
  const suggestionsList = document.getElementById('suggestions-list');
  const resultsBox      = document.getElementById('search-results-list');
  const resultsCountTop = document.getElementById('results-count-top');
  const pager           = document.getElementById('pagination');
  const dateFromInput   = document.getElementById('date_from');
  const dateToInput     = document.getElementById('date_to');
  const activeFilters   = document.getElementById('active-filters');

  // ──────────────────────────────────────────────────────────
  // 2) In-memory state
  // ──────────────────────────────────────────────────────────
  let currentState = {
    q: '',
    search: [],
    document_type: [],
    legal_bindingness: [],
    coverage_scope: [],
    agreement_type: [],
    country: [],
    actor: [],
    beneficiary: [],
    theme: [],
    sdg: [],
    date_from: '',
    date_to: '',
    page: 1
  };

  // debounce timer for autocomplete
  let debounceTimer = null;

  // ──────────────────────────────────────────────────────────
  // 3) AUTOCOMPLETE logic
  // ──────────────────────────────────────────────────────────
  function hideSuggestions() {
    suggestionsList.classList.remove('visible');
    suggestionsList.innerHTML = '';
  }

  function renderSuggestions(items) {
    suggestionsList.innerHTML = '';
    if (!items || items.length === 0) {
      hideSuggestions();
      return;
    }
    suggestionsList.classList.add('visible');
    items.forEach(text => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.textContent = text;
      li.addEventListener('click', () => {
        searchBox.value = text;
        hideSuggestions();
      });
      suggestionsList.appendChild(li);
    });
  }

  function fetchSuggestions(term) {
    fetch(`/api/search/suggest/?q=${encodeURIComponent(term)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(renderSuggestions)
      .catch(hideSuggestions);
  }

  searchBox.addEventListener('input', e => {
    const term = e.target.value.trim();
    if (term.length < 2) {
      hideSuggestions();
      return;
    }
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchSuggestions(term), 300);
  });

  document.addEventListener('click', e => {
    if (e.target !== searchBox && !suggestionsList.contains(e.target)) {
      hideSuggestions();
    }
  });

  // ──────────────────────────────────────────────────────────
  // 4) Commit search on 'commitSearch' event
  // ──────────────────────────────────────────────────────────
  function commitSearch() {
    currentState.q = searchBox.value.trim();
    currentState.page = 1;
    hideSuggestions();
    gatherFilters();
    requestData();
  }

  activeFilters.addEventListener('commitSearch', () => {
    commitSearch();
  });
  
  // Also listen for filterChange event from new filter system
  document.addEventListener('filterChange', () => {
    commitSearch();
  });

  // ──────────────────────────────────────────────────────────
  // 5) GATHER filter values from DOM
  // ──────────────────────────────────────────────────────────
  function gatherFilters() {

    // Reset currentState to default values
    currentState = {
      document_type: [],
      search: [],
      legal_bindingness: [],
      coverage_scope: [],
      agreement_type: [],
      country: [],
      actor: [],
      beneficiary: [],
      theme: [],
      sdg: [],
      date_from: '',
      date_to: '',
      page: 1
    };

    // 1) All filter chips in the active filters container
    const filterChips = activeFilters.querySelectorAll('.filter-chip');
    const activeFilterValues = Array.from(filterChips).map(chip => ({
      name:  chip.dataset.type,
      value: chip.dataset.value
    }));

    // 2) Group active filters by their type
    const grouped = activeFilterValues.reduce((acc, {name, value}) => {
      if (!acc[name]) acc[name] = [];
      acc[name].push(value);
      return acc;
    }, {});

    // 3) Assign grouped values to currentState
    Object.entries(grouped).forEach(([key, values]) => {
      currentState[key] = values;
      if (key.startsWith('date_')) {
        currentState[key] = values[0]; // One value per date
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // 7) Build query string from state
  // ──────────────────────────────────────────────────────────
  function buildParams(state) {
    const p = new URLSearchParams();

    const multiKeys = [
      'document_type','legal_bindingness', 'coverage_scope', 'agreement_type',
      'country','actor','beneficiary','theme','sdg', 'search'
    ];
    multiKeys.forEach(key => state[key].forEach(v => p.append(key, v)));

    if (state.date_from) p.append('event_date_after',  state.date_from);
    if (state.date_to)   p.append('event_date_before', state.date_to);

    p.append('page', state.page);
    return p.toString();
  }

  // ──────────────────────────────────────────────────────────
  // 8) Render Results & Pagination
  // ──────────────────────────────────────────────────────────
  function showLoading() {
    resultsBox.innerHTML   = '<p class="loading">Loading…</p>';
    pager.innerHTML        = '';
    if (resultsCountTop) resultsCountTop.textContent = '';
  }

  function showError() {
    resultsBox.innerHTML   = '<p class="error">Error loading results.</p>';
    pager.innerHTML        = '';
    if (resultsCountTop) resultsCountTop.textContent = '';
  }

  function cardTpl(doc) {
    // Helper: format "2022-03-15" → "March 2022"
    const formatDate = dateStr => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Build the meta string: "ORG • Month YYYY"
    const org      = doc.organization || '';
    const date     = doc.event_date ? formatDate(doc.event_date) : '';
    const metaText = [org, date].filter(Boolean).join(' • ');

    // Build tags: location + actors + themes
    const tags = [
      doc.event_country ? `<span class="doc-tag location">${doc.event_country}</span>` : '',
      ...(doc.actors || []).map(a => `<span class="doc-tag actor">${a}</span>`),
      ...(doc.themes || []).map(t => `<span class="doc-tag theme">${t}</span>`)
    ].join('');

    // Excerpt
    const excerpt = doc.executive_summary || '';

    return `
      <div class="document-list-item">
        <div class="document-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 
                    20C4 21.1 4.89 22 5.99 22H18C19.1 
                    22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 
                    14H8V12H16V14ZM13 9V3.5L18.5 9H13Z"
                  fill="currentColor"/>
          </svg>
        </div>
        <div class="document-list-content">
          <div class="document-list-title">${doc.title}</div>
          <div class="document-list-meta">
            <span>${metaText}</span>
          </div>
          <div class="document-list-tags">
            ${tags}
          </div>
          <p class="document-excerpt">${excerpt}</p>
        </div>
        <div class="document-list-actions">
          <a href="/document_detail/${doc.id}/" class="btn btn-secondary btn-sm">
            View Details
          </a>
        </div>
      </div>
    `;
  }

  const PAGINATION_WINDOW = 1;

  const SVG_PREV = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
            fill="currentColor"/>
    </svg>`;

  const SVG_NEXT = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
            fill="currentColor"/>
    </svg>`;

  function createBtn({ text = '', html = '', cls = '', disabled = false, onClick }) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${cls}`.trim();
    if (html) btn.innerHTML = html;
    else btn.textContent = text;
    btn.disabled = disabled;
    btn.addEventListener('click', onClick);
    pager.appendChild(btn);
    return btn;
  }

  function createEllipsis() {
    const span = document.createElement('span');
    span.className = 'pagination-ellipsis';
    span.textContent = '...';
    pager.appendChild(span);
    return span;
  }

  // 8.1) Render results with “Showing X–Y of Z documents”
  function renderResults(data) {
    const { count, page_size: pageSize, results } = data;
    const curr  = currentState.page;
    const start = (curr - 1) * pageSize + 1;
    const end   = Math.min(curr * pageSize, count);

    const countText = `Showing ${start}–${end} of ${count} documents`;
    if (resultsCountTop) resultsCountTop.textContent = countText;
    
    resultsBox.innerHTML     = results.length
      ? results.map(cardTpl).join('')
      : '<p class="no-results">No documents match your criteria.</p>';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 8.2) Render pagination with Prev, Next, ellipses & window
  function renderPager(data) {
    pager.innerHTML = '';

    const { count, page_size: pageSize } = data;
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const curr       = currentState.page;

    // Prev
    if (curr > 1) {
      createBtn({
        html: SVG_PREV,
        cls: 'prev-page',
        onClick: () => {
          currentState.page = curr - 1;
          requestData();
        }
      });
    }

    // First page + leading ellipsis
    const start = Math.max(1, curr - PAGINATION_WINDOW);
    const end   = Math.min(totalPages, curr + PAGINATION_WINDOW);

    if (start > 1) {
      createBtn({
        text: '1',
        onClick: () => {
          currentState.page = 1; requestData();
        }
      });
      if (start > 2) createEllipsis();
    }

    // Window of page numbers
    for (let i = start; i <= end; i++) {
      createBtn({
        text: i,
        cls: i === curr ? 'active' : '',
        disabled: i === curr,
        onClick: () => {
          currentState.page = i;
          requestData();
        }
      });
    }

    // Trailing ellipsis + last page
    if (end < totalPages) {
      if (end < totalPages - 1) createEllipsis();
      createBtn({
        text: totalPages,
        onClick: () => {
          currentState.page = totalPages; requestData();
        }
      });
    }

    // Next
    if (curr < totalPages) {
      createBtn({
        html: SVG_NEXT,
        cls: 'next-page',
        onClick: () => {
          currentState.page = curr + 1;
          requestData();
        }
      });
    }
  }


  // ──────────────────────────────────────────────────────────
  // 9) Fetch data from API
  // ──────────────────────────────────────────────────────────
  function requestData() {
    showLoading();
    fetch(`/api/search/documents/?${buildParams(currentState)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        renderResults(data);
        renderPager(data);
      })
      .catch(showError);
  }

  // ──────────────────────────────────────────────────────────
  // 10) Initial load
  // ──────────────────────────────────────────────────────────
  requestData();

})();
