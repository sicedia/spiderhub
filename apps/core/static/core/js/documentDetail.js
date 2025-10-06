document.addEventListener('DOMContentLoaded', () => {
  // Initialize document detail page functionality
  initializeRelatedDocuments();
  initializeDownloadButton();
});

// Modern approach to handling related document links
function initializeRelatedDocuments() {
  const relatedDocLinks = document.querySelectorAll('.related-document .btn');
  
  relatedDocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const documentTitle = link.closest('.related-document')
        .querySelector('.related-title').textContent;
      
      // Enhanced user feedback
      showNotification(`Navigating to document: ${documentTitle}`);

      // Get the URL from the link
      const documentUrl = link.getAttribute('href');
      if (!documentUrl) {
        showNotification('Document link is not available', 'error');
        return;
      }
      // Navigate to the document URL
      window.location.href = documentUrl;
    });
  });
}

// Enhanced download functionality
function initializeDownloadButton() {
  const downloadButton = document.querySelector('.document-download');
  if (!downloadButton) return;
  
  downloadButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    
    // Simulate download process
    const originalText = downloadButton.innerHTML;
    downloadButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none" opacity="0.3"/>
        <path d="M12 6v6l4-4" stroke="white" stroke-width="2" fill="none"/>
      </svg>
      Downloading...
    `;
    downloadButton.disabled = true;

    // Get href for download
    const downloadUrl = downloadButton.getAttribute('href');
    if (!downloadUrl) {
      showNotification('Download link is not available', 'error');
      downloadButton.innerHTML = originalText;
      downloadButton.disabled = false;
      return;
    }
    // Start download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = downloadUrl.split('/').pop(); // Extract filename from URL
    document.body.appendChild(link);
    showNotification('Preparing your download...', 'info', 2000);
    link.click();
    showNotification('Document download started', 'info', 2000);
    link.remove();

    setTimeout(() => {
      // Reset button state after download
      downloadButton.innerHTML = originalText;
      downloadButton.disabled = false;
      showNotification('Download completed successfully', 'success');
    }, 1500);
  });
}

// Utility function for user notifications
function showNotification(message, type = 'info', duration = 3000) {
  // Check if notification system exists
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style notification
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: type === 'success' ? '#34A853' : '#094EB2',
    color: 'white',
    padding: '1rem 1.5rem',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '10000',
    animation: 'slideInRight 0.3s ease-out'
  });
  
  document.body.appendChild(notification);
  
  // Auto remove notification
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Add notification animations to document head if not present
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}