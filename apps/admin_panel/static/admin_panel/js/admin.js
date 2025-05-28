document.addEventListener('DOMContentLoaded', function() {
  // Navigation handling
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remove active class from all nav items
      navItems.forEach(navItem => navItem.classList.remove('active'));
      
      // Add active class to clicked item
      this.classList.add('active');
      
      // Hide all sections
      sections.forEach(section => section.classList.remove('active'));
      
      // Show the section corresponding to the clicked nav item
      const targetSection = this.getAttribute('data-target');
      document.getElementById(targetSection).classList.add('active');
    });
  });
  
  // Multi-file upload handling
  const dropZone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-upload');
  const selectedFilesList = document.getElementById('selected-files-list');
  const filesCount = document.getElementById('files-count');
  const bulkProgressBar = document.querySelector('.bulk-progress-bar');
  const bulkProgressValue = document.querySelector('.bulk-progress-value');
  const bulkProgressInfo = document.querySelector('.bulk-progress-info');
  const bulkUploadProgress = document.querySelector('.bulk-upload-progress');
  const totalFilesIndicator = document.getElementById('total-files');
  const processedFilesIndicator = document.getElementById('processed-files');
  const batchStatusContainer = document.querySelector('.batch-status-container');
  
  let uploadedFiles = [];
  let failedUploads = 0;
  let successfulUploads = 0;
  let processingInProgress = false;
  
  if (dropZone && fileInput) {
    // Highlight drop area when dragging files over it
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
      e.preventDefault();
      this.classList.remove('active');
    });
    
    // Handle file drop
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('active');
      
      if (e.dataTransfer.files.length) {
        handleFilesSelection(e.dataTransfer.files);
      }
    });
    
    // Handle file selection through input
    fileInput.addEventListener('change', function() {
      if (this.files.length) {
        handleFilesSelection(this.files);
      }
    });
    
    // Handle the file selection (both drop and manual selection)
    function handleFilesSelection(files) {
      // If adding too many files, confirm with user
      if (files.length > 50) {
        if (!confirm(`Está a punto de agregar ${files.length} archivos. ¿Desea continuar?`)) {
          return;
        }
      }
      
      let invalidFiles = 0;
      let duplicateFiles = 0;
      
      // Add new files to the list
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check if file is PDF
        if (file.type !== 'application/pdf') {
          invalidFiles++;
          continue;
        }
        
        // Check if file is already in the list
        const isDuplicate = uploadedFiles.some(f => f.file.name === file.name && f.file.size === file.size);
        if (isDuplicate) {
          duplicateFiles++;
          continue;
        }
        
        // Add file to the array with an empty comment
        uploadedFiles.push({
          file: file,
          comment: '',
          status: 'ready',
          retry: 0
        });
        
        // Create file item element
        const fileItem = createFileItem(file, uploadedFiles.length - 1);
        
        // Add to the list
        if (selectedFilesList.querySelector('.empty-files-message')) {
          selectedFilesList.innerHTML = '';
        }
        selectedFilesList.appendChild(fileItem);
      }
      
      // Show notifications for invalid or duplicate files
      if (invalidFiles > 0) {
        showNotification(`${invalidFiles} ${invalidFiles === 1 ? 'archivo no es PDF' : 'archivos no son PDF'} y no ${invalidFiles === 1 ? 'fue agregado' : 'fueron agregados'}.`, 'warning');
      }
      
      if (duplicateFiles > 0) {
        showNotification(`${duplicateFiles} ${duplicateFiles === 1 ? 'archivo ya está' : 'archivos ya están'} en la lista.`, 'warning');
      }
      
      // Update files count and enable sorting
      updateFilesCount();
      
      // Enable/disable process button based on file count
      updateProcessButtonState();
      
      // If we're adding a large number of files, add sorting and filtering options
      if (uploadedFiles.length > 20) {
        showBatchControls();
      }
    }
    
    // Update files count with additional information
    function updateFilesCount() {
      filesCount.textContent = uploadedFiles.length;
      
      // Update the size counter if element exists
      const totalSizeElement = document.getElementById('total-size');
      if (totalSizeElement) {
        const totalSize = uploadedFiles.reduce((acc, fileObj) => acc + fileObj.file.size, 0);
        totalSizeElement.textContent = formatFileSize(totalSize);
      }
    }
    
    // Show batch controls for large number of files
    function showBatchControls() {
      if (!document.querySelector('.files-batch-controls')) {
        const batchControls = document.createElement('div');
        batchControls.className = 'files-batch-controls';
        batchControls.innerHTML = `
          <div class="batch-search-filter">
            <input type="text" placeholder="Buscar archivos..." class="batch-search">
            <div class="batch-status-filter">
              <select class="status-filter">
                <option value="all">Todos los estados</option>
                <option value="ready">Listos</option>
                <option value="processing">Procesando</option>
                <option value="success">Completados</option>
                <option value="error">Con error</option>
              </select>
            </div>
          </div>
        `;
        
        const selectedFilesContainer = document.getElementById('selected-files-container');
        selectedFilesContainer.insertBefore(batchControls, selectedFilesList);
        
        // Add search functionality
        const searchInput = batchControls.querySelector('.batch-search');
        searchInput.addEventListener('input', function() {
          const searchTerm = this.value.toLowerCase();
          const fileItems = selectedFilesList.querySelectorAll('.file-item');
          
          fileItems.forEach(item => {
            const fileName = item.querySelector('.file-name').textContent.toLowerCase();
            if (fileName.includes(searchTerm)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        });
        
        // Add status filtering
        const statusFilter = batchControls.querySelector('.status-filter');
        statusFilter.addEventListener('change', function() {
          const selectedStatus = this.value;
          const fileItems = selectedFilesList.querySelectorAll('.file-item');
          
          fileItems.forEach(item => {
            if (selectedStatus === 'all') {
              item.style.display = '';
            } else {
              const statusIcon = item.querySelector('.file-status-icon');
              if (statusIcon.classList.contains(selectedStatus)) {
                item.style.display = '';
              } else {
                item.style.display = 'none';
              }
            }
          });
        });
      }
    }
    
    // Enable/disable process button
    function updateProcessButtonState() {
      const processButton = document.getElementById('process-document');
      if (processButton) {
        processButton.disabled = uploadedFiles.length === 0 || processingInProgress;
      }
    }
    
    // Create file item element
    function createFileItem(file, fileIndex) {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      fileItem.setAttribute('data-file-name', file.name);
      fileItem.setAttribute('data-file-index', fileIndex);
      
      fileItem.innerHTML = `
        <div class="file-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
            <path d="M14 2V8H20L14 2Z" fill="currentColor" opacity="0.7"/>
          </svg>
        </div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
          <div class="file-comment-container">
            <textarea class="file-comment-input" placeholder="Añadir comentario (opcional)"></textarea>
          </div>
          <div class="file-progress">
            <div class="file-progress-bar"></div>
          </div>
        </div>
        <div class="file-status">
          <div class="file-status-icon ready">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div class="file-actions">
          <button class="file-remove" title="Eliminar archivo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      `;
      
      // Add event listener for comment input
      const commentInput = fileItem.querySelector('.file-comment-input');
      commentInput.addEventListener('input', function() {
        uploadedFiles[fileIndex].comment = this.value;
        
        // Auto-expand textarea as content grows
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
      
      // Initialize textarea height
      setTimeout(() => {
        commentInput.style.height = 'auto';
        commentInput.style.height = (commentInput.scrollHeight) + 'px';
      }, 0);
      
      // Add event listener to remove button
      const removeButton = fileItem.querySelector('.file-remove');
      removeButton.addEventListener('click', function() {
        // Remove from array
        uploadedFiles.splice(fileIndex, 1);
        
        // Remove from DOM
        fileItem.remove();
        
        // Update indexes for remaining files
        document.querySelectorAll('.file-item').forEach((item, idx) => {
          item.setAttribute('data-file-index', idx);
          
          // Update comment input event listener
          const input = item.querySelector('.file-comment-input');
          const newIndex = idx;
          
          // Remove old event listener (not possible directly, so just adding a new one that references the updated index)
          input.addEventListener('input', function() {
            uploadedFiles[newIndex].comment = this.value;
            
            // Auto-expand textarea as content grows
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
          });
        });
        
        // Update files count
        updateFilesCount();
        
        // Show empty message if no files
        if (uploadedFiles.length === 0) {
          selectedFilesList.innerHTML = '<div class="empty-files-message">No hay archivos seleccionados</div>';
          
          // Also remove batch controls if they exist
          const batchControls = document.querySelector('.files-batch-controls');
          if (batchControls) {
            batchControls.remove();
          }
          
          // Hide bulk upload progress
          if (bulkUploadProgress) {
            bulkUploadProgress.style.display = 'none';
          }
        }
        
        // Update process button state
        updateProcessButtonState();
      });
      
      return fileItem;
    }
    
    // Format file size to human-readable
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Process documents button
    const processButton = document.getElementById('process-document');
    if (processButton) {
      processButton.disabled = true; // Initially disabled until files are selected
      
      processButton.addEventListener('click', function() {
        if (uploadedFiles.length === 0) {
          showNotification('Por favor, selecciona al menos un archivo PDF para procesar.', 'warning');
          return;
        }
        
        // If processing many files, confirm with user
        if (uploadedFiles.length > 10 && !confirm(`Está a punto de procesar ${uploadedFiles.length} archivos. ¿Desea continuar?`)) {
          return;
        }
        
        // Disable the button and change text to show processing
        processingInProgress = true;
        this.disabled = true;
        this.innerHTML = `
          <span>Procesando documentos...</span>
          <div class="spinner"></div>
        `;
        
        // Show and initialize bulk upload progress
        if (bulkUploadProgress) {
          bulkUploadProgress.style.display = 'block';
          bulkProgressValue.style.width = '0%';
          
          if (totalFilesIndicator) {
            totalFilesIndicator.textContent = uploadedFiles.length;
          }
          if (processedFilesIndicator) {
            processedFilesIndicator.textContent = '0';
          }
        }
        
        // Initialize counters for batch status
        failedUploads = 0;
        successfulUploads = 0;
        
        // Use concurrency control for large batches
        const maxConcurrent = 5; // Process 5 files at a time
        const totalFiles = uploadedFiles.length;
        let completedFiles = 0;
        let currentIndex = 0;
        
        // Create queue processor
        function processQueue() {
          // Process files in batches until all are done
          while (currentIndex < totalFiles && (currentIndex - completedFiles) < maxConcurrent) {
            const fileIndex = currentIndex++;
            processFile(fileIndex);
          }
        }
        
        // Process individual file
        function processFile(fileIndex) {
          const fileObj = uploadedFiles[fileIndex];
          if (!fileObj) return; // Skip if file object doesn't exist
          
          // Find the file item in the DOM
          const fileItem = selectedFilesList.querySelector(`[data-file-index="${fileIndex}"]`);
          if (!fileItem) return;
          
          // Update status to processing
          fileObj.status = 'processing';
          
          // Disable comment input during processing
          const commentInput = fileItem.querySelector('.file-comment-input');
          commentInput.disabled = true;
          
          // Show progress bar
          const progressBar = fileItem.querySelector('.file-progress');
          const progressValue = fileItem.querySelector('.file-progress-bar');
          progressBar.style.display = 'block';
          
          // Update status icon to processing
          const statusIcon = fileItem.querySelector('.file-status-icon');
          statusIcon.className = 'file-status-icon processing';
          statusIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 11H16V13H10V7H12V11Z" fill="currentColor"/>
            </svg>
          `;
          
          // Simulate processing progress
          const duration = 2000 + Math.random() * 3000; // Random duration between 2-5 seconds
          const interval = 100;
          const steps = duration / interval;
          let currentStep = 0;
          
          const progressInterval = setInterval(() => {
            currentStep++;
            const progress = (currentStep / steps) * 100;
            progressValue.style.width = `${progress}%`;
            
            if (currentStep >= steps) {
              clearInterval(progressInterval);
              
              // Simulate occasional processing errors (5% chance of failure)
              const randomFail = Math.random();
              const isSuccess = randomFail > 0.05;
              
              if (isSuccess) {
                // Success case
                handleSuccessfulProcessing(fileObj, fileItem, fileIndex);
              } else {
                // Failure case
                handleFailedProcessing(fileObj, fileItem, fileIndex);
              }
              
              // Update completion counters
              completedFiles++;
              
              // Update bulk progress
              updateBulkProgress(completedFiles, totalFiles);
              
              // Continue processing the queue
              if (currentIndex < totalFiles) {
                processQueue();
              }
              
              // If all files completed, reset process button
              if (completedFiles >= totalFiles) {
                finalizeBatchProcessing();
              }
            }
          }, interval);
        }
        
        // Handle successful file processing
        function handleSuccessfulProcessing(fileObj, fileItem, fileIndex) {
          // Update status icon to success
          const statusIcon = fileItem.querySelector('.file-status-icon');
          statusIcon.className = 'file-status-icon success';
          statusIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
            </svg>
          `;
          fileObj.status = 'success';
          successfulUploads++;
          
          // Randomly determine confidence level (70-95%)
          const confidence = Math.round(70 + Math.random() * 25);
          
          // Add processing result to file table with comment
          addToProcessingTable(fileObj, confidence);
          
          // Add notification for successful processing
          addNotification(
            'success',
            'Procesamiento completo',
            `Documento "${fileObj.file.name}" procesado con ${confidence}% de confianza`,
            new Date()
          );
        }
        
        // Handle failed file processing
        function handleFailedProcessing(fileObj, fileItem, fileIndex) {
          // Update status icon to error
          const statusIcon = fileItem.querySelector('.file-status-icon');
          statusIcon.className = 'file-status-icon error';
          statusIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          `;
          fileObj.status = 'error';
          failedUploads++;
          
          // Enable retry option
          const fileActions = fileItem.querySelector('.file-actions');
          if (fileActions) {
            // Add retry button if it doesn't exist yet
            if (!fileItem.querySelector('.file-retry')) {
              const retryButton = document.createElement('button');
              retryButton.className = 'file-retry';
              retryButton.title = 'Reintentar procesamiento';
              retryButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
                </svg>
              `;
              fileActions.insertBefore(retryButton, fileItem.querySelector('.file-remove'));
              
              // Add retry handler
              retryButton.addEventListener('click', function() {
                // Re-enable file for processing
                fileObj.status = 'ready';
                fileObj.retry++;
                
                // Update status icon
                statusIcon.className = 'file-status-icon ready';
                statusIcon.innerHTML = `
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z" fill="currentColor"/>
                  </svg>
                `;
                
                // Remove progress
                const progressBar = fileItem.querySelector('.file-progress');
                progressBar.style.display = 'none';
                
                // Remove retry button (will be added again if it fails again)
                retryButton.remove();
                
                // Re-enable comment editing
                const commentInput = fileItem.querySelector('.file-comment-input');
                commentInput.disabled = false;
                
                // Show notification
                showNotification(`Archivo "${fileObj.file.name}" listo para reintentar procesamiento.`, 'success');
              });
            }
          }
          
          // Show notification for failed processing
          showNotification(`Error al procesar el archivo "${fileObj.file.name}". Puede reintentar el procesamiento.`, 'error');
          
          // Add notification to sidebar
          addNotification(
            'error',
            'Error de procesamiento',
            `Error al procesar el archivo "${fileObj.file.name}"`,
            new Date()
          );
        }
        
        // Update bulk progress indicators
        function updateBulkProgress(completed, total) {
          const percentage = Math.round((completed / total) * 100);
          
          // Update progress bar
          if (bulkProgressValue) {
            bulkProgressValue.style.width = `${percentage}%`;
          }
          
          // Update text counters
          if (processedFilesIndicator) {
            processedFilesIndicator.textContent = completed;
          }
          
          // Update batch status if exists
          if (batchStatusContainer) {
            batchStatusContainer.innerHTML = `
              <div class="batch-status-item">
                <span class="status-label">Completados:</span>
                <span class="status-value success">${successfulUploads}</span>
              </div>
              <div class="batch-status-item">
                <span class="status-label">Fallidos:</span>
                <span class="status-value error">${failedUploads}</span>
              </div>
            `;
          }
        }
        
        // Finalize the batch processing
        function finalizeBatchProcessing() {
          // Re-enable the process button and reset its text
          processingInProgress = false;
          processButton.disabled = false;
          processButton.innerHTML = `
            Procesar Documentos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="white"/>
            </svg>
          `;
          
          // Show completion notification with status summary
          const totalProcessed = successfulUploads + failedUploads;
          let message = `Se han procesado ${totalProcessed} documentos.`;
          
          if (failedUploads > 0) {
            message += ` ${failedUploads} ${failedUploads === 1 ? 'archivo falló' : 'archivos fallaron'} (${Math.round((failedUploads/totalProcessed)*100)}%).`;
            message += ' Puede reintentar el procesamiento de los archivos fallidos.';
            showNotification(message, 'warning');
          } else {
            showNotification(message, 'success');
          }
          
          // Add option to process only failed files if there are any
          if (failedUploads > 0) {
            // Add retry all failed button if it doesn't exist yet
            if (!document.querySelector('.retry-failed-btn')) {
              const retryAllButton = document.createElement('button');
              retryAllButton.className = 'btn btn-secondary retry-failed-btn';
              retryAllButton.innerHTML = `
                Reintentar Archivos Fallidos (${failedUploads})
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
                </svg>
              `;
              
              // Add retry all handler
              retryAllButton.addEventListener('click', function() {
                // Reset failed files to ready state
                const failedItems = selectedFilesList.querySelectorAll('.file-status-icon.error');
                if (failedItems.length > 0) {
                  failedItems.forEach(statusIcon => {
                    const fileItem = statusIcon.closest('.file-item');
                    const fileIndex = fileItem.getAttribute('data-file-index');
                    if (fileIndex !== null && uploadedFiles[fileIndex]) {
                      // Trigger the retry button click
                      const retryButton = fileItem.querySelector('.file-retry');
                      if (retryButton) {
                        retryButton.click();
                      }
                    }
                  });
                  
                  // Enable process button to continue with retries
                  processButton.disabled = false;
                  showNotification(`${failedItems.length} archivos listos para reintentar procesamiento.`, 'success');
                  
                  // Remove retry all button
                  this.remove();
                }
              });
              
              // Insert button after the process button
              processButton.parentNode.insertBefore(retryAllButton, processButton.nextSibling);
            }
            
            // Add clear failed button
            if (!document.querySelector('.clear-failed-btn')) {
              const clearFailedButton = document.createElement('button');
              clearFailedButton.className = 'btn btn-secondary clear-failed-btn';
              clearFailedButton.innerHTML = `
                Limpiar Archivos Fallidos (${failedUploads})
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                </svg>
              `;
              
              // Add clear failed handler
              clearFailedButton.addEventListener('click', function() {
                // Remove failed files
                const failedItems = selectedFilesList.querySelectorAll('.file-status-icon.error');
                if (failedItems.length > 0) {
                  if (confirm(`¿Está seguro que desea eliminar ${failedItems.length} archivos fallidos?`)) {
                    // First collect indexes to remove
                    const indexesToRemove = [];
                    failedItems.forEach(statusIcon => {
                      const fileItem = statusIcon.closest('.file-item');
                      const fileIndex = parseInt(fileItem.getAttribute('data-file-index'));
                      if (!isNaN(fileIndex)) {
                        indexesToRemove.push(fileIndex);
                      }
                    });
                    
                    // Sort in descending order to remove from end to start (to avoid index shifting)
                    indexesToRemove.sort((a, b) => b - a);
                    
                    // Remove files from array
                    indexesToRemove.forEach(index => {
                      uploadedFiles.splice(index, 1);
                    });
                    
                    // Remove DOM elements
                    failedItems.forEach(statusIcon => {
                      const fileItem = statusIcon.closest('.file-item');
                      fileItem.remove();
                    });
                    
                    // Update file count and failed count
                    updateFilesCount();
                    failedUploads = 0;
                    
                    // Update button state
                    updateProcessButtonState();
                    
                    // Remove the clear failed button
                    this.remove();
                    
                    // Remove the retry failed button if it exists
                    const retryButton = document.querySelector('.retry-failed-btn');
                    if (retryButton) {
                      retryButton.remove();
                    }
                    
                    // Show empty message if no files left
                    if (uploadedFiles.length === 0) {
                      selectedFilesList.innerHTML = '<div class="empty-files-message">No hay archivos seleccionados</div>';
                      
                      // Also remove batch controls if they exist
                      const batchControls = document.querySelector('.files-batch-controls');
                      if (batchControls) {
                        batchControls.remove();
                      }
                      
                      // Hide bulk upload progress
                      if (bulkUploadProgress) {
                        bulkUploadProgress.style.display = 'none';
                      }
                    } else {
                      // Re-index remaining files
                      document.querySelectorAll('.file-item').forEach((item, idx) => {
                        item.setAttribute('data-file-index', idx);
                      });
                      
                      // Update batch status if exists
                      if (batchStatusContainer) {
                        batchStatusContainer.innerHTML = `
                          <div class="batch-status-item">
                            <span class="status-label">Completados:</span>
                            <span class="status-value success">${successfulUploads}</span>
                          </div>
                          <div class="batch-status-item">
                            <span class="status-label">Fallidos:</span>
                            <span class="status-value error">0</span>
                          </div>
                        `;
                      }
                    }
                    
                    showNotification(`Se han eliminado ${failedItems.length} archivos fallidos.`, 'success');
                  }
                }
              });
              
              // Insert button after retry button or after process button
              const retryButton = document.querySelector('.retry-failed-btn');
              if (retryButton) {
                retryButton.parentNode.insertBefore(clearFailedButton, retryButton.nextSibling);
              } else {
                processButton.parentNode.insertBefore(clearFailedButton, processButton.nextSibling);
              }
            }
          }
          
          // Option to clear processed files
          if (successfulUploads > 0) {
            const clearSuccessfulButton = document.createElement('button');
            clearSuccessfulButton.className = 'btn btn-secondary clear-successful-btn';
            clearSuccessfulButton.innerHTML = `
              Limpiar Archivos Procesados (${successfulUploads})
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            `;
            
            // Add clear handler
            clearSuccessfulButton.addEventListener('click', function() {
              // Remove successful files
              const successItems = selectedFilesList.querySelectorAll('.file-status-icon.success');
              if (successItems.length > 0) {
                if (confirm(`¿Está seguro que desea eliminar ${successItems.length} archivos procesados correctamente?`)) {
                  // First collect indexes to remove
                  const indexesToRemove = [];
                  successItems.forEach(statusIcon => {
                    const fileItem = statusIcon.closest('.file-item');
                    const fileIndex = parseInt(fileItem.getAttribute('data-file-index'));
                    if (!isNaN(fileIndex)) {
                      indexesToRemove.push(fileIndex);
                    }
                  });
                  
                  // Sort in descending order to remove from end to start (to avoid index shifting)
                  indexesToRemove.sort((a, b) => b - a);
                  
                  // Remove files from array
                  indexesToRemove.forEach(index => {
                    uploadedFiles.splice(index, 1);
                  });
                  
                  // Remove DOM elements
                  successItems.forEach(statusIcon => {
                    const fileItem = statusIcon.closest('.file-item');
                    fileItem.remove();
                  });
                  
                  // Update file count and success count
                  updateFilesCount();
                  successfulUploads = 0;
                  
                  // Update button state
                  updateProcessButtonState();
                  
                  // Remove the clear button
                  this.remove();
                  
                  // Show empty message if no files left
                  if (uploadedFiles.length === 0) {
                    selectedFilesList.innerHTML = '<div class="empty-files-message">No hay archivos seleccionados</div>';
                    
                    // Also remove batch controls if they exist
                    const batchControls = document.querySelector('.files-batch-controls');
                    if (batchControls) {
                      batchControls.remove();
                    }
                    
                    // Hide bulk upload progress
                    if (bulkUploadProgress) {
                      bulkUploadProgress.style.display = 'none';
                    }
                    
                    // Remove retry button if it exists
                    const retryButton = document.querySelector('.retry-failed-btn');
                    if (retryButton) {
                      retryButton.remove();
                    }
                    
                    // Remove clear failed button if it exists
                    const clearFailedButton = document.querySelector('.clear-failed-btn');
                    if (clearFailedButton) {
                      clearFailedButton.remove();
                    }
                  } else {
                    // Re-index remaining files
                    document.querySelectorAll('.file-item').forEach((item, idx) => {
                      item.setAttribute('data-file-index', idx);
                    });
                    
                    // Update batch status if exists
                    if (batchStatusContainer) {
                      batchStatusContainer.innerHTML = `
                        <div class="batch-status-item">
                          <span class="status-label">Completados:</span>
                          <span class="status-value success">0</span>
                        </div>
                        <div class="batch-status-item">
                          <span class="status-label">Fallidos:</span>
                          <span class="status-value error">${failedUploads}</span>
                        </div>
                      `;
                    }
                  }
                  
                  showNotification(`Se han eliminado ${successItems.length} archivos procesados.`, 'success');
                }
              }
            });
            
            // Add the button if it doesn't exist yet
            if (!document.querySelector('.clear-successful-btn')) {
              // Add after other buttons if they exist
              const lastButton = document.querySelector('.clear-failed-btn') || 
                               document.querySelector('.retry-failed-btn') ||
                               processButton;
              
              lastButton.parentNode.insertBefore(clearSuccessfulButton, lastButton.nextSibling);
            }
          }
        }
        
        // Start processing queue
        processQueue();
      });
    }
    
    // Add processed file to the processing status table
    function addToProcessingTable(fileObj, confidence) {
      const statusTable = document.querySelector('.upload-status tbody');
      if (!statusTable) return;
      
      const now = new Date();
      const formattedDate = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()}`;
      
      // Create new table row
      const tr = document.createElement('tr');
      
      // Set status based on file status
      let statusBadge = '';
      let confidenceDisplay = '';
      
      if (fileObj.status === 'success') {
        statusBadge = `<span class="status-badge complete">Completado</span>`;
        confidenceDisplay = `${confidence}%`;
      } else if (fileObj.status === 'error') {
        statusBadge = `<span class="status-badge error">Error</span>`;
        confidenceDisplay = '--';
      } else if (fileObj.status === 'warning') {
        statusBadge = `<span class="status-badge review">Revisión</span>`;
        confidenceDisplay = `${confidence}%`;
      }
      
      // Create row content with comment
      tr.innerHTML = `
        <td>
          ${fileObj.file.name}
          ${fileObj.comment ? `<div class="file-comment-display">${fileObj.comment}</div>` : ''}
        </td>
        <td>${formattedDate}</td>
        <td>${statusBadge}</td>
        <td>${confidenceDisplay}</td>
        <td>
          <div class="action-buttons">
            ${fileObj.status !== 'error' ? `
              <button class="action-btn edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                </svg>
              </button>
            ` : ''}
            <button class="action-btn view">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </td>
      `;
      
      // Add event listeners to action buttons
      const editBtn = tr.querySelector('.action-btn.edit');
      if (editBtn) {
        editBtn.addEventListener('click', function() {
          const row = this.closest('tr');
          const documentName = row.querySelector('td:first-child').textContent.trim();
          
          // Switch to the metadata section and load the document for editing
          const metadataNavItem = document.querySelector('.admin-nav-item[data-target="metadata-section"]');
          if (metadataNavItem) {
            // Simulate clicking on the Metadata nav item
            metadataNavItem.click();
            
            // Show editing form with document details
            const editorForm = document.querySelector('.editor-form');
            const editorNote = document.querySelector('.editor-note');
            
            if (editorForm && editorNote) {
              editorNote.style.display = 'none';
              editorForm.style.display = 'block';
              
              // Set document title in form
              const titleInput = document.getElementById('edit-title');
              if (titleInput) {
                titleInput.value = documentName;
              }
              
              // Scroll to editor form
              editorForm.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Show notification
            showNotification(`Editando documento: ${documentName}`);
          }
        });
      }
      
      const viewBtn = tr.querySelector('.action-btn.view');
      if (viewBtn) {
        viewBtn.addEventListener('click', function() {
          const row = this.closest('tr');
          const documentCell = row.querySelector('td:first-child');
          const documentName = documentCell.firstChild.textContent.trim();
          
          // Get comment if exists
          let comment = '';
          const commentElement = documentCell.querySelector('.file-comment-display');
          if (commentElement) {
            comment = commentElement.textContent;
          }
          
          // Show preview modal with comment
          showDocumentPreview(documentName, comment);
        });
      }
      
      // Add to table
      statusTable.prepend(tr);
    }
  }
  
  // Function to show document preview modal
  function showDocumentPreview(documentName, comment = '') {
    // Check if a preview modal already exists and remove it
    const existingModal = document.getElementById('preview-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Vista previa: ${documentName}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${comment ? `
            <div class="document-comment">
              <h4>Comentario:</h4>
              <p>${comment}</p>
            </div>
          ` : ''}
          <div class="document-preview">
            <div class="document-preview-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#094EB2"/>
                <path d="M14 2V8H20L14 2Z" fill="#034092"/>
                <path d="M16 13H8V15H16V13Z" fill="#034092"/>
                <path d="M16 17H8V19H16V17Z" fill="#034092"/>
                <path d="M10 9H8V11H10V9Z" fill="#034092"/>
              </svg>
              <p>Vista previa no disponible</p>
            </div>
          </div>
          <div class="preview-actions">
            <button class="btn btn-secondary">Descargar</button>
            <button class="btn btn-primary">Ver en Detalle</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to the body
    document.body.appendChild(modal);
    
    // Show the modal
    setTimeout(() => {
      modal.style.display = 'flex';
    }, 10);
    
    // Close button functionality
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
        setTimeout(() => {
          modal.remove();
        }, 300);
      });
    }
    
    // Close when clicking outside the modal
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
        setTimeout(() => {
          modal.remove();
        }, 300);
      }
    });
    
    // Button actions
    const downloadButton = modal.querySelector('.preview-actions .btn-secondary');
    if (downloadButton) {
      downloadButton.addEventListener('click', function() {
        alert(`Descargando ${documentName}...`);
      });
    }
    
    const detailButton = modal.querySelector('.preview-actions .btn-primary');
    if (detailButton) {
      detailButton.addEventListener('click', function() {
        alert(`Redirigiendo a la página de detalles de ${documentName}...`);
        modal.style.display = 'none';
      });
    }
  }
  
  // Handle "Edit" button clicks in the metadata search section
  const editMetadataButtons = document.querySelectorAll('.edit-metadata-btn');
  editMetadataButtons.forEach(button => {
    button.addEventListener('click', function() {
      const documentName = this.dataset.document;
      openMetadataEditor(documentName);
    });
  });
  
  // Function to open the metadata editor with a specific document
  function openMetadataEditor(documentName) {
    // Navigate to the editor tab
    const editorNavItem = document.querySelector('.admin-nav-item[data-target="metadata-editor-section"]');
    if (editorNavItem) {
      editorNavItem.click();
      
      // Update document selector
      const documentSelect = document.getElementById('document-select');
      if (documentSelect) {
        // Find the option with the matching text
        for (let i = 0; i < documentSelect.options.length; i++) {
          if (documentSelect.options[i].text === documentName) {
            documentSelect.selectedIndex = i;
            break;
          }
        }
      }
      
      // Show the editor form and hide welcome message
      const editorWelcome = document.getElementById('editor-welcome');
      const editorForm = document.getElementById('editor-form');
      
      if (editorWelcome && editorForm) {
        editorWelcome.style.display = 'none';
        editorForm.style.display = 'block';
      }
      
      // Load document data (this would typically come from an API)
      loadDocumentData(documentName);
      
      // Show notification
      showNotification(`Editando documento: ${documentName}`);
    }
  }
  
  // Function to load document data
  function loadDocumentData(documentName) {
    // In a real app, this would fetch data from an API
    // For now, we'll just update the title field
    const titleInput = document.getElementById('edit-title');
    if (titleInput) {
      titleInput.value = documentName;
    }
    
    // Simulate loading data by showing a loading indicator
    const formPanels = document.querySelectorAll('.form-panel');
    formPanels.forEach(panel => {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = '<div class="spinner"></div>';
      panel.appendChild(loadingOverlay);
      
      // Remove loading overlay after a delay
      setTimeout(() => {
        loadingOverlay.remove();
      }, 800);
    });
  }
  
  // Handle document selector changes
  const documentSelect = document.getElementById('document-select');
  if (documentSelect) {
    documentSelect.addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex];
      if (selectedOption.value) {
        // Show the editor form and hide welcome message
        const editorWelcome = document.getElementById('editor-welcome');
        const editorForm = document.getElementById('editor-form');
        
        if (editorWelcome && editorForm) {
          editorWelcome.style.display = 'none';
          editorForm.style.display = 'block';
        }
        
        // Load document data
        loadDocumentData(selectedOption.text);
      } else {
        // Show welcome message if no document is selected
        const editorWelcome = document.getElementById('editor-welcome');
        const editorForm = document.getElementById('editor-form');
        
        if (editorWelcome && editorForm) {
          editorWelcome.style.display = 'flex';
          editorForm.style.display = 'none';
        }
      }
    });
  }
  
  // Handle "Go to Search" button click
  const gotoSearchBtn = document.querySelector('.goto-search-btn');
  if (gotoSearchBtn) {
    gotoSearchBtn.addEventListener('click', function() {
      const searchNavItem = document.querySelector('.admin-nav-item[data-target="metadata-section"]');
      if (searchNavItem) {
        searchNavItem.click();
      }
    });
  }
  
  // Tab navigation in the editor form
  const formTabs = document.querySelectorAll('.form-tab');
  formTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      formTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Show the corresponding panel
      const targetTab = this.dataset.tab;
      const panels = document.querySelectorAll('.form-panel');
      
      panels.forEach(panel => {
        panel.classList.remove('active');
      });
      
      document.getElementById(`${targetTab}-panel`).classList.add('active');
    });
  });
  
  // Handle save options dropdown
  const saveOptionsToggle = document.getElementById('save-options-toggle');
  const saveDropdown = document.getElementById('save-dropdown');
  
  if (saveOptionsToggle && saveDropdown) {
    saveOptionsToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      saveDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function() {
      if (saveDropdown.classList.contains('show')) {
        saveDropdown.classList.remove('show');
      }
    });
    
    // Prevent dropdown from closing when clicking inside it
    saveDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  // Handle save actions
  const saveButton = document.getElementById('save-metadata');
  const saveAndNextButton = document.getElementById('save-and-next');
  const saveAndReturnButton = document.getElementById('save-and-return');
  const cancelButton = document.getElementById('cancel-edit');
  
  if (saveButton) {
    saveButton.addEventListener('click', function() {
      saveMetadata();
    });
  }
  
  if (saveAndNextButton) {
    saveAndNextButton.addEventListener('click', function() {
      saveMetadata().then(() => {
        // Logic to load next document would go here
        showNotification('Cargando siguiente documento...', 'success');
        
        // Close dropdown
        if (saveDropdown) {
          saveDropdown.classList.remove('show');
        }
      });
    });
  }
  
  if (saveAndReturnButton) {
    saveAndReturnButton.addEventListener('click', function() {
      saveMetadata().then(() => {
        // Navigate back to search
        const searchNavItem = document.querySelector('.admin-nav-item[data-target="metadata-section"]');
        if (searchNavItem) {
          searchNavItem.click();
        }
        
        // Close dropdown
        if (saveDropdown) {
          saveDropdown.classList.remove('show');
        }
      });
    });
  }
  
  if (cancelButton) {
    cancelButton.addEventListener('click', function() {
      if (confirm('¿Estás seguro de que deseas cancelar? Los cambios no guardados se perderán.')) {
        // Reset form or navigate away
        const documentSelect = document.getElementById('document-select');
        if (documentSelect) {
          documentSelect.selectedIndex = 0;
          documentSelect.dispatchEvent(new Event('change'));
        }
      }
    });
  }
  
  // Function to save metadata
  function saveMetadata() {
    return new Promise((resolve) => {
      // Show saving indicator
      const saveButton = document.getElementById('save-metadata');
      const originalText = saveButton.textContent;
      saveButton.innerHTML = `
        <span>Guardando...</span>
        <div class="spinner-sm"></div>
      `;
      saveButton.disabled = true;
      
      // Simulate saving delay
      setTimeout(() => {
        // Reset button
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
        
        // Show success notification
        showNotification('Metadatos guardados correctamente', 'success');
        
        // Resolve promise
        resolve();
      }, 1200);
    });
  }
  
  // Preview document button
  const previewDocumentBtn = document.getElementById('preview-document');
  if (previewDocumentBtn) {
    previewDocumentBtn.addEventListener('click', function() {
      const documentSelect = document.getElementById('document-select');
      if (documentSelect && documentSelect.selectedIndex > 0) {
        const documentName = documentSelect.options[documentSelect.selectedIndex].text;
        
        // Get comment if available (in a real app, you'd gather all form data)
        let documentSummary = '';
        const summaryTextarea = document.getElementById('edit-summary');
        if (summaryTextarea) {
          documentSummary = summaryTextarea.value;
        }
        
        showDocumentPreview(documentName, documentSummary);
      } else {
        showNotification('Por favor, selecciona un documento primero', 'warning');
      }
    });
  }
  
  // Download document button
  const downloadDocumentBtn = document.getElementById('download-document');
  if (downloadDocumentBtn) {
    downloadDocumentBtn.addEventListener('click', function() {
      const documentSelect = document.getElementById('document-select');
      if (documentSelect && documentSelect.selectedIndex > 0) {
        const documentName = documentSelect.options[documentSelect.selectedIndex].text;
        
        // Simulate download
        showNotification(`Descargando "${documentName}"...`, 'success');
      } else {
        showNotification('Por favor, selecciona un documento primero', 'warning');
      }
    });
  }
  
  // Tags input functionality for all tag inputs
  const tagInputs = document.querySelectorAll('.tags-input');
  tagInputs.forEach(initializeTagInput);
  
  function initializeTagInput(container) {
    const input = container.querySelector('input');
    const existingTags = container.querySelectorAll('.tag');
    
    // Set up existing tag remove buttons
    existingTags.forEach(tag => {
      const removeBtn = tag.querySelector('.tag-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          tag.remove();
        });
      }
    });
    
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          
          const value = this.value.trim();
          if (value) {
            // Create new tag
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `${value}<span class="tag-remove">×</span>`;
            
            // Add remove functionality
            const removeBtn = tag.querySelector('.tag-remove');
            removeBtn.addEventListener('click', function() {
              tag.remove();
            });
            
            // Insert tag before input
            this.parentNode.insertBefore(tag, this);
            
            // Clear input
            this.value = '';
          }
        }
      });
    }
  }
  
  // Add new theme group functionality
  const addThemeBtn = document.querySelector('.add-theme-btn');
  if (addThemeBtn) {
    addThemeBtn.addEventListener('click', function() {
      // Create a modal to select theme
      const themes = ['Innovación', 'Educación Digital', 'Inclusión', 'Sostenibilidad', 'Comercio Digital'];
      let themeOptions = '';
      
      themes.forEach(theme => {
        themeOptions += `<option value="${theme}">${theme}</option>`;
      });
      
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h3>Añadir grupo de tema</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="new-theme-select">Seleccionar tema:</label>
              <select id="new-theme-select" style="width: 100%; padding: 0.8rem; margin-bottom: 1rem;">
                ${themeOptions}
              </select>
            </div>
            <div class="form-actions" style="justify-content: flex-end;">
              <button class="btn btn-secondary modal-cancel">Cancelar</button>
              <button class="btn btn-primary add-theme-confirm">Añadir</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Show modal
      setTimeout(() => {
        modal.style.display = 'flex';
      }, 10);
      
      // Set up event handlers
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.modal-cancel');
      const confirmBtn = modal.querySelector('.add-theme-confirm');
      
      [closeBtn, cancelBtn].forEach(btn => {
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          setTimeout(() => modal.remove(), 300);
        });
      });
      
      confirmBtn.addEventListener('click', () => {
        const select = modal.querySelector('#new-theme-select');
        const selectedTheme = select.value;
        
        if (selectedTheme) {
          // Add new theme group
          addThemeGroup(selectedTheme);
        }
        
        // Close modal
        modal.style.display = 'none';
        setTimeout(() => modal.remove(), 300);
      });
    });
  }
  
  // Function to add a new theme group
  function addThemeGroup(themeName) {
    const container = document.querySelector('.theme-tags-container');
    const addButton = document.querySelector('.add-theme-btn');
    
    if (container && addButton) {
      const themeGroup = document.createElement('div');
      themeGroup.className = 'theme-group';
      themeGroup.innerHTML = `
        <div class="theme-header">
          <div class="theme-name">${themeName}</div>
          <button class="theme-remove">×</button>
        </div>
        <div class="tags-input" id="theme-${themeName.toLowerCase().replace(/\s+/g, '-')}-tags">
          <input type="text" placeholder="Añadir etiqueta..." />
        </div>
      `;
      
      // Insert before add button
      container.insertBefore(themeGroup, addButton);
      
      // Initialize tags input
      initializeTagInput(themeGroup.querySelector('.tags-input'));
      
      // Set up remove button
      const removeBtn = themeGroup.querySelector('.theme-remove');
      removeBtn.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que deseas eliminar este grupo de tema?')) {
          themeGroup.remove();
        }
      });
      
      // Show notification
      showNotification(`Grupo de tema "${themeName}" añadido`, 'success');
    }
  }
  
  // Add new relation functionality
  const addRelationBtn = document.querySelector('.add-relation-btn');
  if (addRelationBtn) {
    addRelationBtn.addEventListener('click', function() {
      // Create a modal to select document
      const documents = [
        { title: 'Estrategia Digital Brasil 2024', meta: 'Brasil • 2022' },
        { title: 'Acuerdo Marco EU-LATAM', meta: 'Comisión Europea • 2023' },
        { title: 'Plan Nacional Colombia', meta: 'Colombia • 2021' }
      ];
      
      let documentOptions = '';
      documents.forEach((doc, index) => {
        documentOptions += `
          <div class="selectable-document" data-index="${index}">
            <div class="selectable-document-info">
              <div class="selectable-document-title">${doc.title}</div>
              <div class="selectable-document-meta">${doc.meta}</div>
            </div>
            <div class="selectable-document-checkbox">
              <input type="radio" name="selected-document" id="doc-${index}" value="${index}">
            </div>
          </div>
        `;
      });
      
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content" style="width: 600px;">
          <div class="modal-header">
            <h3>Añadir documento relacionado</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group" style="margin-bottom: 1rem;">
              <input type="text" placeholder="Buscar documento..." style="width: 100%; padding: 0.8rem;">
            </div>
            <div class="selectable-documents" style="max-height: 300px; overflow-y: auto; border: 1px solid #eee; border-radius: 6px;">
              ${documentOptions}
            </div>
            <div class="form-group" style="margin-top: 1rem;">
              <label for="relation-type-select">Tipo de relación:</label>
              <select id="relation-type-select" style="width: 100%; padding: 0.8rem;">
                <option value="references">Hace referencia a</option>
                <option value="builds-on">Se basa en</option>
                <option value="implements">Implementa</option>
                <option value="supersedes">Sustituye a</option>
              </select>
            </div>
            <div class="form-actions" style="justify-content: flex-end; margin-top: 1.5rem;">
              <button class="btn btn-secondary modal-cancel">Cancelar</button>
              <button class="btn btn-primary add-relation-confirm">Añadir</button>
            </div>
          </div>
        </div>
      `;
      
      // Add styles for selectable documents
      const style = document.createElement('style');
      style.textContent = `
        .selectable-document {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .selectable-document:hover {
          background-color: #f5f5f5;
        }
        .selectable-document:last-child {
          border-bottom: none;
        }
        .selectable-document-title {
          font-weight: 500;
          margin-bottom: 0.3rem;
        }
        .selectable-document-meta {
          font-size: 0.85rem;
          color: #666;
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(modal);
      
      // Show modal
      setTimeout(() => {
        modal.style.display = 'flex';
      }, 10);
      
      // Set up event handlers
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.modal-cancel');
      const confirmBtn = modal.querySelector('.add-relation-confirm');
      const selectableDocs = modal.querySelectorAll('.selectable-document');
      
      // Make entire row clickable
      selectableDocs.forEach(doc => {
        doc.addEventListener('click', function() {
          const radio = this.querySelector('input[type="radio"]');
          radio.checked = true;
        });
      });
      
      [closeBtn, cancelBtn].forEach(btn => {
        btn.addEventListener('click', () => {
          modal.style.display = 'none';
          setTimeout(() => {
            modal.remove();
            style.remove();
          }, 300);
        });
      });
      
      confirmBtn.addEventListener('click', () => {
        const selectedRadio = modal.querySelector('input[name="selected-document"]:checked');
        if (!selectedRadio) {
          alert('Por favor, selecciona un documento');
          return;
        }
        
        const index = parseInt(selectedRadio.value);
        const selectedDoc = documents[index];
        const relationType = modal.querySelector('#relation-type-select').value;
        
        // Add relation
        addDocumentRelation(selectedDoc, relationType);
        
        // Close modal
        modal.style.display = 'none';
        setTimeout(() => {
          modal.remove();
          style.remove();
        }, 300);
      });
    });
  }
  
  // Function to add a document relation
  function addDocumentRelation(document, relationType) {
    const container = document.querySelector('.related-documents-editor');
    const addButton = document.querySelector('.add-relation-btn');
    
    if (container && addButton) {
      const relationItem = document.createElement('div');
      relationItem.className = 'related-document-item';
      relationItem.innerHTML = `
        <div class="related-document-info">
          <div class="related-document-title">${document.title}</div>
          <div class="related-document-meta">${document.meta}</div>
        </div>
        <div class="relation-type">
          <select>
            <option value="references" ${relationType === 'references' ? 'selected' : ''}>Hace referencia a</option>
            <option value="builds-on" ${relationType === 'builds-on' ? 'selected' : ''}>Se basa en</option>
            <option value="implements" ${relationType === 'implements' ? 'selected' : ''}>Implementa</option>
            <option value="supersedes" ${relationType === 'supersedes' ? 'selected' : ''}>Sustituye a</option>
          </select>
        </div>
        <button class="relation-remove">×</button>
      `;
      
      // Insert before add button
      container.insertBefore(relationItem, addButton);
      
      // Set up remove button
      const removeBtn = relationItem.querySelector('.relation-remove');
      removeBtn.addEventListener('click', function() {
        relationItem.remove();
      });
      
      // Show notification
      showNotification(`Relación con "${document.title}" añadida`, 'success');
    }
  }
  
  // Global notification system
  let notifications = [];
  
  // Function to show notification
  function showNotification(message, type = 'success') {
    // Check if notifications container exists, if not create it
    let notificationsContainer = document.getElementById('admin-notifications-container');
    if (!notificationsContainer) {
      notificationsContainer = document.createElement('div');
      notificationsContainer.id = 'admin-notifications-container';
      notificationsContainer.className = 'admin-notifications-container';
      document.body.appendChild(notificationsContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    
    let iconSvg;
    if (type === 'success') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
      </svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
      </svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
      </svg>`;
    }
    
    notification.innerHTML = `
      <div class="notification-icon">${iconSvg}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">&times;</button>
    `;
    
    // Add notification to container
    notificationsContainer.appendChild(notification);
    
    // Add close button functionality
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        notification.classList.add('hiding');
        setTimeout(() => {
          notification.remove();
        }, 300);
      });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('hiding');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
  
  // Function to add notification to the sidebar
  function addNotification(type, title, content, timestamp) {
    // Create notification object
    const notification = {
      id: Date.now(),
      type,
      title,
      content,
      timestamp,
      read: false
    };
    
    // Add to notifications array
    notifications.unshift(notification);
    
    // Limit to 20 notifications
    if (notifications.length > 20) {
      notifications.pop();
    }
    
    // Update the notification panel
    updateNotificationPanel();
    
    // Update notification count badge
    updateNotificationBadge();
    
    return notification;
  }
  
  // Function to update the notification panel
  function updateNotificationPanel() {
    const notificationList = document.querySelector('.notification-list');
    if (!notificationList) return;
    
    // Clear existing notifications
    notificationList.innerHTML = '';
    
    // Check if there are any notifications
    if (notifications.length === 0) {
      notificationList.innerHTML = '<div class="notification-empty">No hay notificaciones</div>';
      return;
    }
    
    // Add notifications to the panel
    notifications.forEach(notification => {
      let iconSvg;
      if (notification.type === 'success') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor"/>
        </svg>`;
      } else if (notification.type === 'warning') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
        </svg>`;
      } else if (notification.type === 'error') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
        </svg>`;
      }
      
      // Format time
      const timeAgo = formatTimeAgo(notification.timestamp);
      
      // Create notification item
      const notificationItem = document.createElement('div');
      notificationItem.className = `notification-item${notification.read ? '' : ' unread'}`;
      notificationItem.setAttribute('data-id', notification.id);
      
      notificationItem.innerHTML = `
        <div class="notification-icon ${notification.type}">
          ${iconSvg}
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-desc">${notification.content}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
      `;
      
      // Add click event to mark as read
      notificationItem.addEventListener('click', function() {
        markNotificationAsRead(notification.id);
      });
      
      // Add to list
      notificationList.appendChild(notificationItem);
    });
    
    // Add mark all as read button and clear all button if there are unread notifications
    const hasUnread = notifications.some(notification => !notification.read);
    
    if (hasUnread || notifications.length > 0) {
      const notificationActions = document.createElement('div');
      notificationActions.className = 'notification-actions';
      
      if (hasUnread) {
        const markAllReadBtn = document.createElement('button');
        markAllReadBtn.className = 'notification-action-btn';
        markAllReadBtn.textContent = 'Marcar todo como leído';
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
        notificationActions.appendChild(markAllReadBtn);
      }
      
      if (notifications.length > 0) {
        const clearAllBtn = document.createElement('button');
        clearAllBtn.className = 'notification-action-btn';
        clearAllBtn.textContent = 'Limpiar todo';
        clearAllBtn.addEventListener('click', clearAllNotifications);
        notificationActions.appendChild(clearAllBtn);
      }
      
      notificationList.appendChild(notificationActions);
    }
  }
  
  // Function to update notification badge
  function updateNotificationBadge() {
    const unreadCount = notifications.filter(notification => !notification.read).length;
    const notificationHeader = document.querySelector('.notification-header h3');
    
    if (notificationHeader) {
      if (unreadCount > 0) {
        notificationHeader.innerHTML = `Notificaciones <span class="notification-badge">${unreadCount}</span>`;
      } else {
        notificationHeader.textContent = 'Notificaciones';
      }
    }
  }
  
  // Function to mark notification as read
  function markNotificationAsRead(id) {
    const index = notifications.findIndex(notification => notification.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      
      const notificationItem = document.querySelector(`.notification-item[data-id="${id}"]`);
      if (notificationItem) {
        notificationItem.classList.remove('unread');
      }
      
      updateNotificationBadge();
    }
  }
  
  // Function to mark all notifications as read
  function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
      notification.read = true;
    });
    
    document.querySelectorAll('.notification-item.unread').forEach(item => {
      item.classList.remove('unread');
    });
    
    updateNotificationBadge();
  }
  
  // Function to clear all notifications
  function clearAllNotifications() {
    if (confirm('¿Está seguro que desea eliminar todas las notificaciones?')) {
      notifications = [];
      updateNotificationPanel();
      updateNotificationBadge();
    }
  }
  
  // Format time ago function
  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Desconocido';
    
    const now = new Date();
    const date = new Date(timestamp);
    const secondsAgo = Math.floor((now - date) / 1000);
    
    if (secondsAgo < 60) {
      return 'Hace unos segundos';
    } else if (secondsAgo < 3600) {
      const minutesAgo = Math.floor(secondsAgo / 60);
      return `Hace ${minutesAgo} ${minutesAgo === 1 ? 'minuto' : 'minutos'}`;
    } else if (secondsAgo < 86400) {
      const hoursAgo = Math.floor(secondsAgo / 3600);
      return `Hace ${hoursAgo} ${hoursAgo === 1 ? 'hora' : 'horas'}`;
    } else {
      const daysAgo = Math.floor(secondsAgo / 86400);
      return `Hace ${daysAgo} ${daysAgo === 1 ? 'día' : 'días'}`;
    }
  }
  
  // Initialize the notifications system
  function initializeNotifications() {
    // Add initial notifications
    addNotification(
      'success',
      'Procesamiento completo',
      'Documento "Plan Digital 2025" procesado con 92% de confianza',
      new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    );
    
    addNotification(
      'warning',
      'Revisión recomendada',
      'Baja confianza (45%) en "Acuerdo Marco Chile"',
      new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    );
    
    // Add notification header events
    const notificationHeader = document.querySelector('.notification-header');
    if (notificationHeader) {
      notificationHeader.addEventListener('click', function() {
        const notificationList = document.querySelector('.notification-list');
        if (notificationList) {
          notificationList.classList.toggle('expanded');
        }
      });
    }
  }
  
  // Initialize action buttons
  initProcessingStatusActions();
  
  // Action buttons in the processing status table
  function initProcessingStatusActions() {
    // Edit button functionality
    const editButtons = document.querySelectorAll('.upload-status .action-btn.edit');
    editButtons.forEach(button => {
      button.addEventListener('click', function() {
        const row = this.closest('tr');
        const documentName = row.querySelector('td:first-child').textContent.trim();
        
        // Switch to the metadata section and load the document for editing
        const metadataNavItem = document.querySelector('.admin-nav-item[data-target="metadata-section"]');
        if (metadataNavItem) {
          // Simulate clicking on the Metadata nav item
          metadataNavItem.click();
          
          // Show editing form with document details
          const editorForm = document.querySelector('.editor-form');
          const editorNote = document.querySelector('.editor-note');
          
          if (editorForm && editorNote) {
            editorNote.style.display = 'none';
            editorForm.style.display = 'block';
            
            // Set document title in form
            const titleInput = document.getElementById('edit-title');
            if (titleInput) {
              titleInput.value = documentName;
            }
            
            // Scroll to editor form
            editorForm.scrollIntoView({ behavior: 'smooth' });
          }
          
          // Show notification
          showNotification(`Editando documento: ${documentName}`);
        }
      });
    });
    
    // View button functionality
    const viewButtons = document.querySelectorAll('.upload-status .action-btn.view');
    viewButtons.forEach(button => {
      button.addEventListener('click', function() {
        const row = this.closest('tr');
        const documentCell = row.querySelector('td:first-child');
        const documentName = documentCell.firstChild.textContent.trim();
        
        // Get comment if exists
        let comment = '';
        const commentElement = documentCell.querySelector('.file-comment-display');
        if (commentElement) {
          comment = commentElement.textContent;
        }
        
        // Show preview modal with comment
        showDocumentPreview(documentName, comment);
      });
    });
    
    // Cancel button functionality
    const cancelButtons = document.querySelectorAll('.upload-status .action-btn.cancel');
    cancelButtons.forEach(button => {
      button.addEventListener('click', function() {
        const row = this.closest('tr');
        const documentName = row.querySelector('td:first-child').textContent.trim();
        
        if (confirm(`¿Estás seguro de que deseas cancelar el procesamiento de "${documentName}"?`)) {
          // Simulate cancellation process
          showNotification(`Procesamiento cancelado: ${documentName}`, 'warning');
          
          // Add notification to sidebar
          addNotification(
            'warning',
            'Procesamiento cancelado',
            `Se ha cancelado el procesamiento de "${documentName}"`,
            new Date()
          );
          
          // Update status badge to show cancelled
          const statusCell = row.querySelector('td:nth-child(3)');
          if (statusCell) {
            statusCell.innerHTML = '<span class="status-badge error">Cancelado</span>';
          }
          
          // Change actions column to show only view option
          const actionsCell = row.querySelector('td:last-child');
          if (actionsCell) {
            actionsCell.innerHTML = `
              <div class="action-buttons">
                <button class="action-btn view">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            `;
            
            // Re-attach event listener to the new view button
            const newViewButton = actionsCell.querySelector('.action-btn.view');
            if (newViewButton) {
              newViewButton.addEventListener('click', function() {
                const documentName = row.querySelector('td:first-child').textContent.trim();
                showDocumentPreview(documentName);
              });
            }
          }
        }
      });
    })
  }
  
  // Initialize notifications on page load
  initializeNotifications();
});