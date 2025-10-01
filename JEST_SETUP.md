# Configuración de Jest para Tests Unitarios de JavaScript

## ✅ Configuración Completada

Jest ha sido configurado exitosamente en el proyecto SpiderHub Web para ejecutar tests unitarios de JavaScript.

### Archivos Creados/Modificados:

1. **`package.json`** - Configuración de Jest y scripts npm
2. **`babel.config.js`** - Configuración de Babel para transpilación
3. **`jest.setup.js`** - Configuración global de Jest y mocks
4. **`__tests__/`** - Directorio de tests con estructura organizada

### Dependencias Instaladas:

```bash
npm install --save-dev jest @babel/core @babel/preset-env babel-jest jest-environment-jsdom
```

### Scripts NPM Disponibles:

```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Ejecutar tests en modo watch
npm run test:coverage # Ejecutar tests con reporte de cobertura
```

## 🧪 Tests Creados

### 1. Tests de Utilidades (`__tests__/utils/utils.test.js`)
- Tests para el módulo `Utils` de `main.js`
- Cobertura de constantes, funciones de debounce, intersection observer
- Tests de responsividad y navegación móvil

### 2. Tests de Componentes (`__tests__/components/`)
- **`carousel.test.js`** - Tests para funcionalidad de carrusel
- **`cookie-manager.test.js`** - Tests básicos para gestión de cookies

### 3. Tests de Ejemplo (`__tests__/example.test.js`)
- Tests de demostración de configuración de Jest
- Ejemplos de tests async, mocks, y manipulación DOM

## 📊 Configuración de Jest

### Entorno de Testing:
- **jsdom**: Simula el DOM del navegador
- **Babel**: Transpila ES6+ a código compatible
- **Mocks automáticos**: Para APIs del navegador (IntersectionObserver, ResizeObserver, etc.)

### Cobertura de Código:
- Archivos cubiertos: `static/js/**/*.js`, `apps/**/static/**/*.js`
- Reportes generados en: `coverage/` (HTML, LCOV, texto)
- Archivos excluidos: `node_modules/`, `vendor/`

### Patrones de Tests:
- `**/__tests__/**/*.js`
- `**/?(*.)+(spec|test).js`

## 🚀 Ejecución de Tests

### Primera Ejecución:
```bash
npm test
```
**Resultado:** ✅ 35 tests pasaron, 4 suites de tests

### Con Cobertura:
```bash
npm run test:coverage
```
**Resultado:** Reporte de cobertura generado con métricas detalladas

## 📁 Estructura de Tests

```
__tests__/
├── utils/
│   └── utils.test.js          # Tests de utilidades
├── components/
│   ├── carousel.test.js       # Tests de carrusel
│   └── cookie-manager.test.js # Tests de gestión de cookies
├── example.test.js            # Tests de ejemplo
└── README.md                  # Documentación de tests
```

## 🔧 Características Técnicas

### Mocks Configurados:
- `IntersectionObserver`
- `ResizeObserver`
- `requestAnimationFrame`
- `window.matchMedia`
- `getComputedStyle`

### Soporte para:
- ES6+ (arrow functions, async/await, destructuring)
- Módulos ES6 (import/export)
- Manipulación DOM
- Tests asíncronos
- Mocks y spies

## 📈 Próximos Pasos

1. **Expandir Tests**: Agregar tests para otros archivos JavaScript del proyecto
2. **Integración CI/CD**: Configurar ejecución automática de tests en pipeline
3. **Tests E2E**: Considerar agregar tests end-to-end con herramientas como Cypress
4. **Cobertura**: Aumentar el porcentaje de cobertura de código

## 🎯 Estado Actual

- ✅ Jest configurado y funcionando
- ✅ 35 tests pasando
- ✅ Reportes de cobertura funcionando
- ✅ Estructura de tests organizada
- ✅ Documentación completa

El proyecto está listo para desarrollo de tests unitarios de JavaScript con Jest.

