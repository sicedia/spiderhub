(() => {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // 1) DOM References
  // ──────────────────────────────────────────────────────────
  const searchBox       = document.getElementById('searchbox');
  const searchButton    = document.getElementById('search-button');
  const suggestionsList = document.getElementById('suggestions-list');
  const applyBtn        = document.getElementById('apply-filters');
  const resetBtn        = document.getElementById('reset-filters');
  const resultsBox      = document.getElementById('search-results-list');
  const resultsCount    = document.getElementById('results-count');
  const pager           = document.getElementById('pagination');
  const dateFromInput   = document.getElementById('date-from');
  const dateToInput     = document.getElementById('date-to');

  // ──────────────────────────────────────────────────────────
  // 2) In-memory state
  // ──────────────────────────────────────────────────────────
  let currentState = {
    q: '',
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
    suggestionsList.classList.add('hidden');
    suggestionsList.innerHTML = '';
  }

  function renderSuggestions(items) {
    suggestionsList.innerHTML = '';
    if (!items || items.length === 0) {
      hideSuggestions();
      return;
    }
    suggestionsList.classList.remove('hidden');
    items.forEach(text => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.textContent = text;
      li.addEventListener('click', () => {
        searchBox.value = text;
        hideSuggestions();
        currentState.q = text;
        currentState.page = 1;
        requestData();
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
  // 4) SEARCH by text (Enter / Search button)
  // ──────────────────────────────────────────────────────────
  function commitSearch() {
    currentState.q = searchBox.value.trim();
    currentState.page = 1;
    hideSuggestions();
    requestData();
  }

  searchBox.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitSearch();
    }
  });

  searchButton.addEventListener('click', e => {
    e.preventDefault();
    commitSearch();
  });

  // ──────────────────────────────────────────────────────────
  // 5) GATHER filter values from DOM
  // ──────────────────────────────────────────────────────────
  function gatherFilters() {
    const multiKeys = [
      'document_type','legal_bindingness','coverage_scope','agreement_type',
      'country','actor','beneficiary','theme','sdg'
    ];
    multiKeys.forEach(key => {
      currentState[key] = Array.from(
        document.querySelectorAll(`input[name="${key}"]:checked`)
      ).map(cb => cb.value);
    });
    currentState.date_from = dateFromInput.value;
    currentState.date_to   = dateToInput.value;
    // page is managed separately
  }

  // ──────────────────────────────────────────────────────────
  // 6) APPLY & RESET buttons
  // ──────────────────────────────────────────────────────────
  applyBtn.addEventListener('click', e => {
    e.preventDefault();
    currentState.page = 1;
    gatherFilters();
    requestData();
  });

  resetBtn.addEventListener('click', e => {
    e.preventDefault();
    // reset in-memory state
    currentState = {
      q: '',
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
    // reset DOM controls
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    searchBox.value       = '';
    dateFromInput.value   = '';
    dateToInput.value     = '';
    hideSuggestions();
    requestData();
  });

  // ──────────────────────────────────────────────────────────
  // 7) Build query string from state
  // ──────────────────────────────────────────────────────────
  function buildParams(state) {
    const p = new URLSearchParams();
    if (state.q) p.append('search', state.q);

    const multiKeys = [
      'document_type','legal_bindingness', 'coverage_scope', 'agreement_type',
      'country','actor','beneficiary','theme','sdg'
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
    resultsCount.textContent = '';
  }

  function showError() {
    resultsBox.innerHTML   = '<p class="error">Error loading results.</p>';
    pager.innerHTML        = '';
    resultsCount.textContent = '';
  }

  function cardTpl(doc) {
    return `
      <article class="document-card">
        <header class="document-header">
          <div class="document-title">${doc.title}</div>
          <div class="document-meta">
            ${doc.country} · ${new Date(doc.event_date).getFullYear()}
          </div>
        </header>
        <div class="document-body">
          <p>${doc.executive_summary || ''}</p>
          <div class="doc-tags">
            ${doc.actors.map(a => `<span class="tag actor">${a}</span>`).join('')}
            ${doc.themes.map(t => `<span class="tag theme">${t}</span>`).join('')}
          </div>
        </div>
        <footer class="document-footer">
          <a href="/documents/${doc.id}/" class="btn btn-secondary">Details</a>
        </footer>
      </article>
    `;
  }

  function renderResults(data) {
    resultsCount.textContent = `${data.count} documents found`;
    resultsBox.innerHTML = data.results.length
      ? data.results.map(cardTpl).join('')
      : '<p class="no-results">No documents match your criteria.</p>';
  }

  function renderPager(data) {
    pager.innerHTML = '';
    const makeBtn = (label, pg, disabled=false) => {
      const btn = document.createElement('button');
      btn.textContent   = label;
      btn.disabled      = disabled;
      btn.className     = 'page-btn';
      btn.dataset.page  = pg;
      return btn;
    };

    // Prev button
    const prevPg = data.previous
      ? new URL(data.previous).searchParams.get('page')
      : null;
    pager.appendChild(makeBtn('« Prev', prevPg, !prevPg));

    // pages around current
    const total = Math.ceil(data.count / (data.results.length || 1));
    const curr  = currentState.page;
    const start = Math.max(1, curr - 1);
    const end   = Math.min(total, curr + 1);
    for (let i = start; i <= end; i++) {
      const btn = makeBtn(i, i);
      if (i === curr) btn.classList.add('active');
      pager.appendChild(btn);
    }

    // Next button
    const nextPg = data.next
      ? new URL(data.next).searchParams.get('page')
      : null;
    pager.appendChild(makeBtn('Next »', nextPg, !nextPg));
  }

  pager.addEventListener('click', e => {
    const btn = e.target.closest('.page-btn');
    if (btn && !btn.disabled) {
      currentState.page = Number(btn.dataset.page);
      requestData();
    }
  });

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
