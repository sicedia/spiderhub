/**
 * Version Check Service
 * Verifica si hay una nueva versión de la aplicación disponible
 * y muestra un modal para actualizar limpiando todo el caché
 * ES6 Module Export
 */

const VERSION_STORAGE_KEY = 'spiderhub_app_version';
const VERSION_CHECK_INTERVAL = 300000; // 5 minutos
const API_VERSION_ENDPOINT = '/api/v1/app/version/';
const BROADCAST_CHANNEL_NAME = 'spiderhub_version_update';

class VersionCheckService {
  constructor() {
    this.currentVersion = null;
    this.checkInterval = null;
    this.isChecking = false;
    this.isReloading = false;
    this.broadcastChannel = null;
    
    // Inicializar comunicación entre pestañas
    this.initBroadcastChannel();
    
    // Escuchar eventos de otras pestañas
    this.setupCrossTabListeners();
  }

  /**
   * Inicializa BroadcastChannel para comunicación entre pestañas
   */
  initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      console.log('✅ BroadcastChannel initialized for cross-tab communication');
    } else {
      console.warn('⚠️ BroadcastChannel not supported, using localStorage fallback');
    }
  }

  /**
   * Configura listeners para comunicación entre pestañas
   */
  setupCrossTabListeners() {
    // Usar BroadcastChannel si está disponible
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'FORCE_RELOAD') {
          this.handleForceReload(event.data.version);
        }
      };
    }

    // Fallback: usar localStorage events (funciona en todos los navegadores)
    window.addEventListener('storage', (event) => {
      if (event.key === 'spiderhub_force_reload' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data && data.type === 'FORCE_RELOAD') {
            this.handleForceReload(data.version);
          }
        } catch (e) {
          console.warn('Failed to parse reload command:', e);
        }
      }
    });
  }

  /**
   * Inicializa el servicio de verificación de versión
   */
  init() {
    // Obtener versión actual del servidor
    this.checkVersion();
    
    // Verificar periódicamente
    this.checkInterval = setInterval(() => {
      this.checkVersion();
    }, VERSION_CHECK_INTERVAL);

    // Verificar cuando la ventana recupera el foco
    window.addEventListener('focus', () => {
      this.checkVersion();
    });

    // Verificar cuando la página se hace visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkVersion();
      }
    });

    console.log('✅ Version check service initialized');
  }

  /**
   * Verifica la versión actual del servidor
   */
  async checkVersion() {
    if (this.isChecking || this.isReloading) return;
    
    try {
      this.isChecking = true;
      const response = await fetch(API_VERSION_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const serverVersion = data.version;

      // Si es la primera vez, guardar la versión
      if (!this.currentVersion) {
        const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
        if (storedVersion) {
          this.currentVersion = storedVersion;
        } else {
          // Primera carga, guardar la versión actual
          this.currentVersion = serverVersion;
          localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
          return;
        }
      }

      // Comparar versiones
      if (serverVersion !== this.currentVersion && serverVersion !== 'unknown') {
        console.log(`🔄 New version detected: ${serverVersion} (current: ${this.currentVersion})`);
        this.showUpdateModal(serverVersion);
      }
    } catch (error) {
      console.warn('⚠️ Failed to check app version:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Muestra el modal de actualización
   */
  showUpdateModal(newVersion) {
    // Evitar múltiples modales
    if (document.getElementById('version-update-modal')) {
      return;
    }

    const modal = this.createUpdateModal(newVersion);
    document.body.appendChild(modal);
    
    // Mostrar con animación
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });
  }

  /**
   * Crea el modal de actualización
   */
  createUpdateModal(newVersion) {
    const modal = document.createElement('div');
    modal.id = 'version-update-modal';
    modal.className = 'version-update-modal';
    modal.innerHTML = `
      <div class="version-update-modal__overlay"></div>
      <div class="version-update-modal__content">
        <div class="version-update-modal__header">
          <h2 class="version-update-modal__title">Actualización Disponible</h2>
          <p class="version-update-modal__description">
            Hay una nueva versión de la aplicación disponible. 
            Por favor, actualiza para obtener las últimas mejoras y correcciones.
          </p>
        </div>
        <div class="version-update-modal__body">
          <div class="version-update-modal__info">
            <span class="version-update-modal__label">Versión actual:</span>
            <span class="version-update-modal__value">${this.currentVersion}</span>
          </div>
          <div class="version-update-modal__info">
            <span class="version-update-modal__label">Nueva versión:</span>
            <span class="version-update-modal__value version-update-modal__value--new">${newVersion}</span>
          </div>
        </div>
        <div class="version-update-modal__footer">
          <button class="version-update-modal__button version-update-modal__button--primary" id="update-button">
            Actualizar Ahora
          </button>
          <button class="version-update-modal__button version-update-modal__button--secondary" id="update-later-button">
            Más Tarde
          </button>
        </div>
      </div>
    `;

    // Estilos inline para el modal
    this.addModalStyles();

    // Event listeners
    const updateButton = modal.querySelector('#update-button');
    const laterButton = modal.querySelector('#update-later-button');
    const overlay = modal.querySelector('.version-update-modal__overlay');

    updateButton.addEventListener('click', () => this.handleUpdate(newVersion));
    laterButton.addEventListener('click', () => this.handleLater(modal));
    overlay.addEventListener('click', () => this.handleLater(modal));

    return modal;
  }

  /**
   * Maneja la actualización - limpia caché en TODAS las pestañas
   */
  handleUpdate(newVersion) {
    if (this.isReloading) return;
    
    this.isReloading = true;
    console.log('🔄 Starting cache clear and reload for ALL tabs...');
    
    // 1. Limpiar caché local (preservar preferencias importantes)
    this.clearLocalCache();

    // 2. Limpiar Service Worker cache si existe
    this.clearServiceWorkerCache().then(() => {
      // 3. Notificar a TODAS las pestañas para que se recarguen
      this.broadcastReloadToAllTabs(newVersion);

      // 4. Actualizar versión guardada
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);

      // 5. Recargar esta pestaña con múltiples técnicas
      this.forceReloadCurrentTab();
    }).catch(() => {
      // Continuar aunque falle la limpieza de Service Worker
      this.broadcastReloadToAllTabs(newVersion);
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);
      this.forceReloadCurrentTab();
    });
  }

  /**
   * Limpia el caché local preservando preferencias importantes
   */
  clearLocalCache() {
    const keysToKeep = ['language', 'theme', 'django_language'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key) && key !== VERSION_STORAGE_KEY) {
        localStorage.removeItem(key);
      }
    });

    // Limpiar sessionStorage (excepto datos críticos si los hay)
    sessionStorage.clear();

    console.log('✅ Local cache cleared');
  }

  /**
   * Limpia el caché de Service Workers
   */
  async clearServiceWorkerCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name => {
            console.log(`🗑️ Deleting cache: ${name}`);
            return caches.delete(name);
          })
        );
        console.log('✅ Service Worker caches cleared');
      } catch (error) {
        console.warn('⚠️ Failed to clear Service Worker cache:', error);
      }
    }

    // Desregistrar Service Workers si existen
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => {
            console.log('🗑️ Unregistering service worker');
            return registration.unregister();
          })
        );
        console.log('✅ Service Workers unregistered');
      } catch (error) {
        console.warn('⚠️ Failed to unregister Service Workers:', error);
      }
    }
  }

  /**
   * Notifica a TODAS las pestañas para que se recarguen
   */
  broadcastReloadToAllTabs(newVersion) {
    const reloadCommand = {
      type: 'FORCE_RELOAD',
      version: newVersion,
      timestamp: Date.now()
    };

    // Método 1: BroadcastChannel (más eficiente, navegadores modernos)
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(reloadCommand);
      console.log('📡 Broadcasted reload command via BroadcastChannel');
    }

    // Método 2: localStorage event (fallback para navegadores antiguos)
    // Nota: el evento 'storage' solo se dispara en OTRAS pestañas, no en la actual
    try {
      localStorage.setItem('spiderhub_force_reload', JSON.stringify(reloadCommand));
      // Limpiar inmediatamente para que el evento se dispare en la próxima escritura
      setTimeout(() => {
        localStorage.removeItem('spiderhub_force_reload');
      }, 100);
      console.log('📡 Broadcasted reload command via localStorage');
    } catch (e) {
      console.warn('⚠️ Failed to broadcast via localStorage:', e);
    }
  }

  /**
   * Maneja la recarga forzada cuando se recibe el comando
   */
  handleForceReload(newVersion) {
    if (this.isReloading) return;
    
    console.log('📨 Received force reload command, clearing cache...');
    this.isReloading = true;

    // Limpiar caché local
    this.clearLocalCache();
    
    // Limpiar Service Worker cache
    this.clearServiceWorkerCache().then(() => {
      // Actualizar versión
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);

      // Recargar esta pestaña
      this.forceReloadCurrentTab();
    }).catch(() => {
      // Continuar aunque falle
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);
      this.forceReloadCurrentTab();
    });
  }

  /**
   * Fuerza la recarga de la pestaña actual sin caché
   * Usa múltiples técnicas para máxima compatibilidad
   */
  forceReloadCurrentTab() {
    console.log('🔄 Force reloading current tab...');

    // Técnica 1: Agregar parámetro único a la URL (más confiable)
    const url = new URL(window.location.href);
    url.searchParams.set('_nocache', Date.now());
    url.searchParams.set('_reload', '1');

    // Técnica 2: Usar location.replace con timestamp
    // Esto evita que el usuario pueda volver atrás
    setTimeout(() => {
      window.location.replace(url.toString());
    }, 100);

    // Técnica 3: Fallback - reload forzado (si replace falla)
    setTimeout(() => {
      // Si después de 500ms aún estamos aquí, usar reload
      window.location.href = url.toString();
    }, 500);

    // Técnica 4: Último recurso - reload directo
    setTimeout(() => {
      // Forzar recarga incluso si las anteriores fallaron
      if (window.location.href === url.toString()) {
        window.location.reload();
      }
    }, 1000);
  }

  /**
   * Maneja "Más tarde"
   */
  handleLater(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
    
    // Volver a verificar en 5 minutos
    setTimeout(() => {
      this.checkVersion();
    }, 300000);
  }

  /**
   * Agrega los estilos CSS para el modal
   */
  addModalStyles() {
    if (document.getElementById('version-update-modal-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'version-update-modal-styles';
    style.textContent = `
      .version-update-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .version-update-modal.active {
        opacity: 1;
        pointer-events: all;
      }

      .version-update-modal__overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
      }

      .version-update-modal__content {
        position: relative;
        background: white;
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }

      .version-update-modal.active .version-update-modal__content {
        transform: scale(1);
      }

      .version-update-modal__header {
        margin-bottom: 24px;
      }

      .version-update-modal__title {
        font-size: 24px;
        font-weight: 700;
        color: #094eb2;
        margin: 0 0 12px 0;
      }

      .version-update-modal__description {
        font-size: 16px;
        color: #666;
        line-height: 1.5;
        margin: 0;
      }

      .version-update-modal__body {
        margin-bottom: 24px;
        padding: 16px;
        background: #f5f5f5;
        border-radius: 8px;
      }

      .version-update-modal__info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
      }

      .version-update-modal__label {
        font-size: 14px;
        color: #666;
        font-weight: 500;
      }

      .version-update-modal__value {
        font-size: 14px;
        color: #333;
        font-family: monospace;
        font-weight: 600;
      }

      .version-update-modal__value--new {
        color: #094eb2;
      }

      .version-update-modal__footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .version-update-modal__button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .version-update-modal__button--primary {
        background: #094eb2;
        color: white;
      }

      .version-update-modal__button--primary:hover {
        background: #073d8f;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(9, 78, 178, 0.3);
      }

      .version-update-modal__button--secondary {
        background: #f5f5f5;
        color: #666;
      }

      .version-update-modal__button--secondary:hover {
        background: #e0e0e0;
      }

      @media (max-width: 600px) {
        .version-update-modal__content {
          padding: 24px;
        }

        .version-update-modal__title {
          font-size: 20px;
        }

        .version-update-modal__footer {
          flex-direction: column;
        }

        .version-update-modal__button {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Limpia el servicio
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
  }
}

// Exportar instancia singleton
export const versionCheckService = new VersionCheckService();

