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
        console.log('📨 BroadcastChannel message received:', event.data);
        if (event.data && event.data.type === 'FORCE_RELOAD') {
          this.handleForceReload(event.data.version);
        }
      };
    }

    // Fallback: usar localStorage events (funciona en todos los navegadores)
    // El evento 'storage' solo se dispara en OTRAS pestañas, no en la actual
    window.addEventListener('storage', (event) => {
      if (event.key === 'spiderhub_force_reload' && event.newValue) {
        console.log('📨 localStorage storage event received');
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

    // Log para debugging - mostrar ruta actual
    console.log(`🔗 VersionCheckService listening on route: ${window.location.pathname}`);
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
      // También verificar si hay un comando de recarga pendiente (para móviles)
      this.checkPendingReload();
    });

    // Verificar cuando la página se hace visible (importante para móviles)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkVersion();
        // También verificar si hay un comando de recarga pendiente (para móviles)
        this.checkPendingReload();
      }
    });

    // pageshow se dispara cuando la página se muestra desde bfcache (navegación atrás/adelante)
    // Esto es especialmente importante en Safari iOS
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        console.log('📱 Page restored from bfcache, checking version...');
        this.checkVersion();
        this.checkPendingReload();
      }
    });

    console.log('✅ Version check service initialized');
  }

  /**
   * Verifica si hay un comando de recarga pendiente en localStorage
   * Útil para móviles donde la pestaña puede haber estado suspendida
   */
  checkPendingReload() {
    try {
      const pendingReload = localStorage.getItem('spiderhub_force_reload');
      if (pendingReload) {
        const data = JSON.parse(pendingReload);
        if (data && data.type === 'FORCE_RELOAD') {
          console.log('📱 Found pending reload command, executing...');
          // Limpiar el comando pendiente
          localStorage.removeItem('spiderhub_force_reload');
          // Ejecutar la recarga
          this.handleForceReload(data.version);
        }
      }
    } catch (e) {
      // Ignorar errores de parsing
    }
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
      
      // Si no hay versión guardada, mostrar modal para actualizar
      // Esto cubre casos donde el usuario borró el localStorage o es primera vez
      if (!storedVersion) {
        console.log(`📦 No version found in localStorage, prompting update to: ${serverVersion}`);
        if (serverVersion && serverVersion !== 'unknown') {
          // Mostrar modal para que el usuario actualice
          this.showUpdateModal(serverVersion);
        } else {
          // Si la versión del servidor es desconocida, guardar para evitar loops
          localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
        }
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
            ${this.currentVersion 
              ? 'Hay una nueva versión de la aplicación disponible. Por favor, actualiza para obtener las últimas mejoras y correcciones.'
              : 'Se requiere actualizar la aplicación para continuar. Esto asegurará que tengas la última versión con todas las mejoras y correcciones.'}
          </p>
        </div>
        <div class="version-update-modal__body">
          <div class="version-update-modal__info">
            <span class="version-update-modal__label">Versión actual:</span>
            <span class="version-update-modal__value">${this.currentVersion || 'No detectada'}</span>
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
  async handleUpdate(newVersion) {
    if (this.isReloading) return;
    
    this.isReloading = true;
    console.log('🔄 Starting cache clear and reload for ALL tabs...');
    
    // 1. Limpiar caché local (preservar preferencias importantes)
    this.clearLocalCache();

    // 2. Invalidar cache HTTP de archivos estáticos (CSS/JS)
    // Esto asegura que la próxima carga obtenga las últimas versiones
    await this.invalidateStaticAssetCache().catch(() => {
      console.warn('⚠️ Static asset cache invalidation failed, continuing...');
    });

    // 3. Limpiar Service Worker cache si existe
    this.clearServiceWorkerCache().then(() => {
      // 4. Notificar a TODAS las pestañas para que se recarguen
      this.broadcastReloadToAllTabs(newVersion);

      // 5. Actualizar versión guardada
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);

      // 6. Recargar esta pestaña con múltiples técnicas
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
   * Invalida el cache HTTP del navegador para archivos estáticos (CSS/JS)
   * Esto fuerza al navegador a revalidar los recursos con el servidor
   * Equivalente a lo que hace Ctrl+Shift+R para los archivos estáticos
   */
  async invalidateStaticAssetCache() {
    const assetsToInvalidate = [];
    
    // Recopilar todos los archivos CSS
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      if (link.href && !link.href.includes('fonts.googleapis.com')) {
        assetsToInvalidate.push(link.href);
      }
    });
    
    // Recopilar todos los archivos JS
    document.querySelectorAll('script[src]').forEach(script => {
      if (script.src && !script.src.includes('cdn.') && !script.src.includes('googleapis.com')) {
        assetsToInvalidate.push(script.src);
      }
    });
    
    console.log(`🔄 Invalidating HTTP cache for ${assetsToInvalidate.length} static assets...`);
    
    // Hacer fetch con cache: 'reload' para cada archivo
    // Esto fuerza al navegador a hacer una solicitud condicional al servidor
    const invalidationPromises = assetsToInvalidate.map(async (url) => {
      try {
        // Usar cache: 'reload' para forzar revalidación
        // Esto hace que el navegador verifique con el servidor si hay versión nueva
        await fetch(url, {
          method: 'HEAD', // Solo verificar headers, no descargar contenido
          cache: 'reload', // Forzar revalidación con el servidor
          credentials: 'same-origin'
        });
        return { url, success: true };
      } catch (error) {
        // Ignorar errores de CORS o red - no es crítico
        return { url, success: false, error };
      }
    });
    
    try {
      const results = await Promise.allSettled(invalidationPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`✅ HTTP cache invalidated for ${successful}/${assetsToInvalidate.length} assets`);
    } catch (error) {
      console.warn('⚠️ Some assets failed to invalidate:', error);
    }
  }

  /**
   * Notifica a TODAS las pestañas para que se recarguen
   */
  broadcastReloadToAllTabs(newVersion) {
    const reloadCommand = {
      type: 'FORCE_RELOAD',
      version: newVersion,
      timestamp: Date.now(),
      origin: window.location.pathname // Para debugging
    };

    console.log('📡 Broadcasting reload command to all tabs...');

    // Método 1: BroadcastChannel (más eficiente, navegadores modernos)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(reloadCommand);
        console.log('✅ Broadcasted via BroadcastChannel');
      } catch (e) {
        console.warn('⚠️ BroadcastChannel failed:', e);
      }
    }

    // Método 2: localStorage event (fallback universal y soporte para móviles)
    // El evento 'storage' se dispara en OTRAS pestañas cuando cambia un valor
    // En móviles, las pestañas suspendidas pueden revisar este valor cuando vuelvan a estar activas
    try {
      // Primero limpiar cualquier comando anterior
      localStorage.removeItem('spiderhub_force_reload');
      
      // Esperar un tick para asegurar que el evento anterior se procesó
      setTimeout(() => {
        localStorage.setItem('spiderhub_force_reload', JSON.stringify(reloadCommand));
        console.log('✅ Broadcasted via localStorage');
        
        // En móviles, las pestañas pueden estar suspendidas por más tiempo
        // Mantener el comando por 30 segundos para dar tiempo a que pestañas
        // suspendidas lo encuentren cuando vuelvan a estar activas
        setTimeout(() => {
          // Solo limpiar si el comando es el mismo (no uno más nuevo)
          try {
            const current = localStorage.getItem('spiderhub_force_reload');
            if (current) {
              const currentData = JSON.parse(current);
              if (currentData.timestamp === reloadCommand.timestamp) {
                localStorage.removeItem('spiderhub_force_reload');
                console.log('🧹 Cleaned up old reload command');
              }
            }
          } catch (e) {
            // Ignorar errores
          }
        }, 30000); // 30 segundos para móviles
      }, 10);
    } catch (e) {
      console.warn('⚠️ localStorage broadcast failed:', e);
    }
  }

  /**
   * Maneja la recarga forzada cuando se recibe el comando desde otra pestaña
   * Esto se ejecuta en TODAS las pestañas abiertas (excepto la que inició la actualización)
   */
  handleForceReload(newVersion) {
    // Verificar si ya estamos recargando
    if (this.isReloading) {
      console.log('⚠️ Already reloading, ignoring duplicate command');
      return;
    }
    
    const currentPath = window.location.pathname;
    console.log(`📨 Force reload command received on route: ${currentPath}`);
    console.log(`📦 Updating to version: ${newVersion}`);
    
    this.isReloading = true;

    // Actualizar versión guardada PRIMERO para evitar loops de detección
    try {
      localStorage.setItem(VERSION_STORAGE_KEY, newVersion);
    } catch (e) {
      console.warn('⚠️ Failed to save version to localStorage:', e);
    }

    // Limpiar caché local (en esta pestaña también)
    this.clearLocalCache();
    
    // Ejecutar limpieza en paralelo con timeout para no bloquear la recarga
    Promise.race([
      Promise.all([
        this.invalidateStaticAssetCache().catch(() => {}), // Invalidar CSS/JS
        this.clearServiceWorkerCache().catch(() => {})     // Limpiar SW cache
      ]),
      new Promise(resolve => setTimeout(resolve, 300)) // Timeout de 300ms
    ]).finally(() => {
      // Recargar esta pestaña con cache busting
      // Esto recargará la ruta actual (cualquiera que sea) con cache forzado
      this.forceReloadCurrentTab();
    });
  }

  /**
   * Fuerza la recarga de la pestaña actual sin caché
   * Usa múltiples técnicas para máxima compatibilidad y cache busting
   * Equivalente a Ctrl+Shift+R (hard reload)
   */
  forceReloadCurrentTab() {
    const currentPath = window.location.pathname;
    console.log(`🔄 Force reloading current tab: ${currentPath}`);

    // Marcar que ya iniciamos la recarga para evitar loops
    if (this._reloadInitiated) {
      console.log('⚠️ Reload already initiated, skipping...');
      return;
    }
    this._reloadInitiated = true;

    // Construir URL con cache busting
    const url = new URL(window.location.href);
    
    // Limpiar parámetros anteriores de cache busting
    url.searchParams.delete('_nocache');
    url.searchParams.delete('_reload');
    url.searchParams.delete('_v');
    url.searchParams.delete('_force');
    url.searchParams.delete('_hard_reload');
    
    // Agregar nuevo parámetro único con timestamp
    const timestamp = Date.now();
    url.searchParams.set('_v', timestamp);

    console.log(`🔗 Reloading to: ${url.toString()}`);

    // Desregistrar Service Workers primero
    const unregisterSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        } catch (e) {
          // Ignorar errores
        }
      }
    };

    // Ejecutar la recarga
    unregisterSW().finally(() => {
      // Usar location.replace para evitar agregar al historial
      // y forzar una recarga completa desde el servidor
      try {
        window.location.replace(url.toString());
      } catch (e) {
        // Fallback: usar href si replace falla
        window.location.href = url.toString();
      }
    });

    // Fallback de seguridad: si después de 500ms aún estamos aquí, forzar con href
    setTimeout(() => {
      if (!document.hidden) {
        console.log('⚠️ Fallback reload triggered');
        window.location.href = url.toString();
      }
    }, 500);
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

