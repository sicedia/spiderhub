# Build Instructions for ES6 Module Support

## Overview

This project now includes proper ES6 module support with fallback mechanisms for older browsers. The build system uses Webpack to bundle ES6 modules and transpile them for broader browser compatibility.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build for Production

```bash
npm run build
```

### 3. Build for Development

```bash
npm run build:dev
```

### 4. Watch Mode (Development)

```bash
npm run build:watch
```

## Build Process

### What Gets Built

The build process creates the following files:

- `apps/core/static/core/js/analysis.bundle.js` - Bundled analysis page
- `apps/core/static/core/js/explore.bundle.js` - Bundled explore page
- `apps/core/static/core/js/vendors.bundle.js` - Third-party dependencies
- `apps/core/static/core/js/common.bundle.js` - Shared code

### Browser Support

The build targets browsers with:
- `> 1%` market share
- Last 2 versions of major browsers
- Excludes Internet Explorer 11 and below

### Transpilation

- ES6+ features are transpiled to ES5
- Polyfills are automatically added for missing features
- Code is minified in production mode

## File Structure

```
apps/core/static/core/js/
├── analysis.js                 # Original ES6 module
├── analysis-entry.js          # Entry point with fallback logic
├── analysis.bundle.js         # Bundled version (generated)
├── legacy-fallback.js         # Legacy browser fallback
├── pages/
│   └── AnalysisPageManager.js # ES6 module
├── services/
│   ├── ChartManager.js        # ES6 module
│   └── AnalysisDataService.js # ES6 module
└── components/
    ├── data/
    └── ui/
```

## Loading Strategy

### Modern Browsers (ES6 Module Support)

1. Load `analysis-entry.js` as ES6 module
2. Check for ES6 module support
3. Dynamically import `analysis.js`
4. Initialize modern components

### Older Browsers (No ES6 Module Support)

1. `nomodule` script loads `legacy-fallback.js`
2. Provides basic functionality without ES6 features
3. Fallback to bundled version if legacy fails

### Fallback Chain

```
ES6 Module → Legacy Fallback → Bundled Version → Basic Features
```

## Development Workflow

### 1. Development Mode

```bash
npm run build:watch
```

This will:
- Watch for file changes
- Rebuild automatically
- Generate source maps
- Keep files unminified

### 2. Testing

```bash
npm test
```

Tests run against the original ES6 modules using Babel transformation.

### 3. Production Build

```bash
npm run build
```

This will:
- Minify code
- Remove source maps
- Optimize bundle sizes
- Generate production-ready files

## Configuration Files

### webpack.config.js

Main Webpack configuration with:
- Entry points for analysis and explore pages
- Babel loader for ES6+ transpilation
- Code splitting for optimal loading
- UMD output format for compatibility

### babel.config.js

Babel configuration for:
- ES6+ to ES5 transpilation
- Browser compatibility targets
- Automatic polyfill injection

### package.json

Contains:
- Build scripts
- Development dependencies
- Jest configuration for testing

## Troubleshooting

### Build Fails

1. Check Node.js version (requires 14+)
2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Modules Not Loading

1. Ensure build has run: `npm run build`
2. Check browser console for errors
3. Verify file paths in HTML templates

### Legacy Browser Issues

1. Check if `legacy-fallback.js` is loading
2. Verify `nomodule` attribute is present
3. Test in older browser or use browser dev tools

## Performance Considerations

### Bundle Size

- Code splitting reduces initial load
- Vendor libraries are in separate bundle
- Common code is shared between pages

### Loading Strategy

- Modern browsers get optimized ES6 modules
- Older browsers get transpiled bundles
- Progressive enhancement ensures functionality

### Caching

- Bundles include content hashes for cache busting
- Static assets are versioned automatically
- CDN-friendly file structure

## Deployment

### Pre-deployment Checklist

1. Run production build: `npm run build`
2. Test in multiple browsers
3. Verify all functionality works
4. Check bundle sizes are reasonable

### Server Configuration

Ensure your web server:
- Serves `.js` files with correct MIME type
- Supports gzip compression
- Has proper cache headers

## Monitoring

### Browser Support

Monitor browser usage to adjust support targets:
- Update `browserslist` in package.json
- Adjust Babel targets in babel.config.js
- Consider dropping support for very old browsers

### Performance Metrics

Track:
- Bundle sizes
- Load times
- Error rates
- Browser compatibility issues

## Future Improvements

### Potential Enhancements

1. **Service Worker**: Add caching for better performance
2. **Tree Shaking**: Remove unused code more aggressively
3. **Dynamic Imports**: Load features on demand
4. **Web Components**: Use native browser components
5. **TypeScript**: Add type safety

### Migration Path

When ready to drop older browser support:
1. Remove legacy fallback code
2. Update build targets
3. Simplify loading strategy
4. Remove polyfills for modern features
