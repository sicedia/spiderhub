document.addEventListener('DOMContentLoaded', function() {
  // Make "Ver Detalles" buttons in related documents functional
  const relatedDocLinks = document.querySelectorAll('.related-document .btn');
  relatedDocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // In a real app, this would navigate to the specific document detail page
      const documentTitle = this.closest('.related-document').querySelector('.related-title').textContent;
      alert(`Navegando al documento: ${documentTitle}`);
    });
  });

  // Add click handler to document download button
  const downloadButton = document.querySelector('.document-download');
  if (downloadButton) {
    downloadButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Simulate download - in a real app this would be an actual file download
      alert('Iniciando descarga del documento...');
      
      // Optionally trigger analytics event for document download
      console.log('Document downloaded');
    });
  }
});