# Tests End-to-End (E2E) con Playwright

Este directorio contiene los tests end-to-end para el proyecto SpiderHub Web usando Playwright.

## 📁 Estructura de Tests

```
e2e/
├── explore/
│   └── search-and-filters.spec.js    # Tests de búsqueda y filtros
├── analysis/
│   └── dashboard-loading.spec.js     # Tests del dashboard de análisis
├── navigation.spec.js                # Tests de navegación entre páginas
├── accessibility.spec.js             # Tests de accesibilidad
└── README.md                         # Esta documentación
```

## 🚀 Comandos Disponibles

### Ejecutar Tests

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con interfaz gráfica (recomendado para desarrollo)
npm run test:e2e:ui

# Ejecutar en modo headed (ver el navegador)
npm run test:e2e:headed

# Ejecutar en modo debug
npm run test:e2e:debug

# Ver reporte HTML
npm run test:e2e:report
```

### Tests Específicos

```bash
# Ejecutar solo tests de explore
npx playwright test explore/

# Ejecutar solo tests de analysis
npx playwright test analysis/

# Ejecutar solo tests de navegación
npx playwright test navigation.spec.js
```

## 🧪 Casos de Prueba Cubiertos

### 1. Página de Exploración (`/explore/`)

**Búsqueda y Filtros:**
- ✅ Carga de página con todos los elementos principales
- ✅ Búsqueda básica por texto
- ✅ Expansión/colapso de acordeones de filtros
- ✅ Aplicación de filtros (países, temas, fechas)
- ✅ Limpieza de filtros
- ✅ Filtros de rango de fechas con presets
- ✅ Búsqueda dentro de opciones de filtros
- ✅ Visualización de conteo de resultados
- ✅ Paginación de resultados
- ✅ Diseño responsivo en móviles

### 2. Dashboard de Análisis (`/analysis/`)

**Carga y Visualización:**
- ✅ Carga de página con todas las secciones principales
- ✅ Visualización de tarjetas de resumen con datos
- ✅ Carga y renderizado de gráficos
- ✅ Headers y descripciones de gráficos
- ✅ Tooltips en hover
- ✅ Sección de métricas adicionales
- ✅ Sección de ayuda
- ✅ Interacciones con gráficos
- ✅ Carga de datos desde backend
- ✅ Diseño responsivo
- ✅ Manejo de errores JavaScript

### 3. Navegación y Funcionalidad Cruzada

**Navegación:**
- ✅ Navegación entre páginas principales
- ✅ Mantenimiento del estado de navegación
- ✅ Botones atrás/adelante del navegador
- ✅ Diseño responsivo en múltiples pantallas
- ✅ Manejo de refresh de página
- ✅ Acceso directo por URL
- ✅ Manejo de errores 404
- ✅ Carga correcta de assets estáticos

### 4. Accesibilidad

**Estándares de Accesibilidad:**
- ✅ Jerarquía correcta de headings
- ✅ Labels y atributos ARIA en formularios
- ✅ Navegación por teclado
- ✅ Roles ARIA y landmarks
- ✅ Contraste de colores
- ✅ Manejo de foco
- ✅ Texto alternativo en imágenes
- ✅ Labels accesibles en botones
- ✅ Compatibilidad con lectores de pantalla
- ✅ Accesibilidad móvil

## 🎯 Navegadores Soportados

- **Chromium** (Chrome/Edge)
- **Firefox**
- **WebKit** (Safari)
- **Mobile Chrome** (Android)
- **Mobile Safari** (iOS)

## ⚙️ Configuración

### Variables de Entorno

```bash
# URL base de la aplicación (por defecto: http://localhost:8000)
BASE_URL=http://localhost:8000

# Modo CI/CD
CI=true
```

### Configuración de Servidor

Los tests configuran automáticamente el servidor Django:

```javascript
webServer: {
  command: 'python manage.py runserver',
  url: 'http://localhost:8000',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
  env: {
    DJANGO_SETTINGS_MODULE: 'config.settings.development',
  },
}
```

## 📊 Reportes

### Reportes HTML
Los tests generan reportes HTML detallados en `playwright-report/` con:
- Screenshots de fallos
- Videos de ejecución
- Traces de depuración
- Métricas de rendimiento

### Reportes JSON/XML
Para integración con CI/CD:
- `test-results/results.json`
- `test-results/results.xml`

## 🔧 Desarrollo y Debugging

### Modo UI (Recomendado)
```bash
npm run test:e2e:ui
```
- Interfaz gráfica para ejecutar tests
- Debugging visual
- Generación de código
- Inspección de elementos

### Modo Debug
```bash
npm run test:e2e:debug
```
- Pausa en breakpoints
- Inspección de variables
- Step-by-step execution

### Modo Headed
```bash
npm run test:e2e:headed
```
- Ver el navegador en acción
- Útil para debugging visual

## 🚨 Troubleshooting

### Tests Fracasan por Timeout
- Verificar que Django esté corriendo en puerto 8000
- Aumentar timeout en `playwright.config.js`
- Verificar conectividad de red

### Elementos No Encontrados
- Verificar que los selectores estén actualizados
- Usar `page.waitForSelector()` para elementos dinámicos
- Verificar que JavaScript esté habilitado

### Problemas de Responsive
- Verificar viewport sizes en tests
- Usar `page.setViewportSize()` para cambiar tamaño
- Verificar media queries en CSS

## 📈 Mejores Prácticas

1. **Selectores Robustos**: Usar roles ARIA y data-testid
2. **Esperas Explícitas**: Usar `waitForLoadState()` y `waitForSelector()`
3. **Tests Independientes**: Cada test debe poder ejecutarse solo
4. **Cleanup**: Limpiar estado entre tests
5. **Assertions Claras**: Usar assertions específicas y descriptivas

## 🔄 Integración CI/CD

### GitHub Actions
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
```

### Docker
```dockerfile
RUN npx playwright install --with-deps
CMD ["npm", "run", "test:e2e"]
```

## 📝 Agregar Nuevos Tests

1. Crear archivo `.spec.js` en directorio apropiado
2. Usar estructura de `test.describe()` y `test()`
3. Implementar setup/teardown apropiado
4. Usar selectores robustos y esperas explícitas
5. Documentar casos de prueba en este README
