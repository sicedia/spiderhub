// Handler functions for the explore page
document.addEventListener('DOMContentLoaded', function() {
  // Add click event handlers to all "Ver Detalles" buttons in document cards
  const detailButtons = document.querySelectorAll('.document-card .btn, .document-table-actions .btn-secondary');
  
  detailButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      // Redirect to document detail page
      window.location.href = 'document_detail.html';
    });
  });
  
  // Add view toggle functionality
  const gridViewBtn = document.querySelector('.grid-view-btn');
  const tableViewBtn = document.querySelector('.table-view-btn');
  const resultsContainer = document.querySelector('.results-container');
  
  if (gridViewBtn && tableViewBtn && resultsContainer) {
    gridViewBtn.addEventListener('click', function() {
      resultsContainer.classList.remove('table-view');
      gridViewBtn.classList.add('active');
      tableViewBtn.classList.remove('active');
    });
    
    tableViewBtn.addEventListener('click', function() {
      resultsContainer.classList.add('table-view');
      tableViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
    });
  }
});