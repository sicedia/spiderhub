# JavaScript Unit Tests

Este directorio contiene las pruebas unitarias para los componentes JavaScript del proyecto SpiderHub Web.

## Estructura de Tests

```
__tests__/
├── utils/           # Tests para utilidades y funciones helper
├── components/      # Tests para componentes específicos
└── example.test.js  # Tests de ejemplo y configuración
```

## Ejecutar Tests

### Comandos disponibles:

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (se re-ejecutan al cambiar archivos)
npm run test:watch

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

## Configuración

- **Jest**: Framework de testing principal
- **Babel**: Para transpilación de ES6+ a código compatible
- **jsdom**: Entorno de DOM simulado para tests
- **Mocks**: Configuración automática de APIs del navegador

## Escribir Tests

### Estructura básica:

```javascript
describe('Nombre del Módulo', () => {
  beforeEach(() => {
    // Setup antes de cada test
  });

  afterEach(() => {
    // Cleanup después de cada test
  });

  test('debería hacer algo específico', () => {
    expect(resultado).toBe(valorEsperado);
  });
});
```

### Tests para utilidades:

```javascript
import { Utils } from '../../apps/core/static/core/js/main.js';

describe('Utils', () => {
  test('debería tener constantes correctas', () => {
    expect(Utils.ANIMATION_DURATION).toBe(2000);
  });
});
```

### Tests para DOM:

```javascript
test('debería manipular elementos DOM', () => {
  document.body.innerHTML = '<div id="test">Hello</div>';
  const element = document.getElementById('test');
  expect(element.textContent).toBe('Hello');
});
```

## Cobertura

Los tests generan reportes de cobertura que se guardan en el directorio `coverage/`. El reporte HTML se puede abrir en el navegador para ver detalles de cobertura por archivo.

## Archivos Cubiertos

- `static/js/**/*.js`
- `apps/**/static/**/*.js`

Los archivos en `node_modules/` y `vendor/` están excluidos automáticamente.

