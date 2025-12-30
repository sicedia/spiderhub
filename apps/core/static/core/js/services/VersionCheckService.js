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
      const serverVersion = data.version || 'unknown';
      
      // Obtener versión guardada del localStorage
      const storedVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      
      // Si no hay versión guardada, guardar la actual y salir
      if (!storedVersion) {
        this.currentVersion = serverVersion;
        localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
        console.log(`📦 First time - saved version: ${serverVersion}`);
        return;
      }
      
      // Si currentVersion no está inicializado, usar la guardada
      if (!this.currentVersion) {
        this.currentVersion = storedVersion;
      }

      // Comparar versiones - si son diferentes y la del servidor no es 'unknown'
      if (serverVersion !== this.currentVersion && serverVersion !== 'unknown' && serverVersion) {
        console.log(`🔄 New version detected! Server: ${serverVersion}, Current: ${this.currentVersion}`);
        this.showUpdateModal(serverVersion);
      } else if (serverVersion === this.currentVersion) {
        // Versiones coinciden, actualizar localStorage por si acaso
        localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
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
   * Maneja la recarga forzada cuando se recibe el comando desde otra pestaña
   * Esto se ejecuta en TODAS las pestañas abiertas (excepto la que inició la actualización)
   */
  handleForceReload(newVersion) {
    if (this.isReloading) return;
    
    console.log('📨 Received force reload command from another tab, clearing cache and reloading...');
    this.isReloading = true;

    // Limpiar caché local (en esta pestaña también)
    this.clearLocalCache();
    
    // Limpiar Service Worker cache
    this.clearServiceWorkerCache().then(() => {
      // Actualizar versión guardada
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);

      // Recargar esta pestaña con cache busting
      // Esto recargará la ruta actual (cualquiera que sea) con cache forzado
      this.forceReloadCurrentTab();
    }).catch(() => {
      // Continuar aunque falle la limpieza de Service Worker
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);
      this.forceReloadCurrentTab();
    });
  }

  /**
   * Fuerza la recarga de la pestaña actual sin caché
   * Usa múltiples técnicas para máxima compatibilidad y cache busting
   * Equivalente a Ctrl+Shift+R (hard reload)
   */
  forceReloadCurrentTab() {
    console.log('🔄 Force reloading current tab with cache busting...');

    // Limpiar cache del navegador antes de recargar
    // Esto incluye: HTTP cache, Service Workers, y localStorage (ya limpiado)
    
    // Técnica 1: Agregar parámetro único a la URL con timestamp
    const url = new URL(window.location.href);
    // Limpiar parámetros anteriores de cache busting
    url.searchParams.delete('_nocache');
    url.searchParams.delete('_reload');
    url.searchParams.delete('_v');
    // Agregar nuevos parámetros únicos
    const timestamp = Date.now();
    url.searchParams.set('_nocache', timestamp);
    url.searchParams.set('_reload', '1');
    url.searchParams.set('_v', timestamp);

    // Técnica 2: Intentar usar fetch con cache: 'no-store' antes de recargar
    // Esto ayuda a invalidar el cache HTTP
    fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }).catch(() => {
      // Ignorar errores, solo queremos invalidar el cache
    });

    // Técnica 3: Usar location.replace con timestamp (evita historial)
    // Esto fuerza al navegador a descargar todo desde el servidor
    setTimeout(() => {
      // Forzar recarga completa sin cache
      if ('serviceWorker' in navigator) {
        // Desactivar service workers temporalmente
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(reg => reg.unregister());
        });
      }
      
      // Usar replace para evitar que el usuario pueda volver atrás
      window.location.replace(url.toString());
    }, 150);

    // Técnica 4: Fallback - si replace no funciona, usar href
    setTimeout(() => {
      if (window.location.href === url.toString() || !document.hidden) {
        window.location.href = url.toString() + '&_force=' + Date.now();
      }
    }, 400);

    // Técnica 5: Último recurso - reload forzado con cache: 'reload'
    setTimeout(() => {
      // Si aún estamos aquí después de 800ms, forzar reload
      try {
        // Intentar usar reload con cache bypass
        if (window.location.reload) {
          // Algunos navegadores soportan location.reload(true) para hard reload
          // Pero está deprecado, así que usamos otra técnica
          window.location.href = window.location.href.split('?')[0] + '?_hard_reload=' + Date.now();
        }
      } catch (e) {
        console.warn('⚠️ Error forcing reload:', e);
      }
    }, 800);
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
   * Los estilos CSS están en version-update-modal.css
   * que se carga automáticamente con main.css
   * Ya no necesitamos agregar estilos inline
   */
  addModalStyles() {
    // Los estilos ya están cargados en main.css
    // No necesitamos hacer nada aquí
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

