# Explore Page Refactor - Quick Reference

## 🎯 What Changed

### Visual Improvements
- ✨ Sticky search header with blur effect
- 🎨 Enhanced filter sidebar with smooth animations
- 📇 Better document cards with hover effects
- 📱 Improved mobile experience
- ♿ Full accessibility support

### New Components
1. **FilterAccordion** - Smooth, accessible filter groups
2. **ResultsList** - Enhanced results display
3. **DocumentCard** - Reusable card component

## 🔑 Key Files

### CSS
```
apps/core/static/core/css/
├── pages/explore.css (UPDATED - Main explore page styles)
└── components/document-card.css (NEW - Reusable card component)
```

### JavaScript
```
apps/core/static/core/js/
├── pages/ExplorePageManager.js (UPDATED - Main page manager)
├── components/
│   ├── filters/FilterAccordion.js (NEW - Filter accordion)
│   └── results/ResultsList.js (NEW - Results list)
└── core/constants/config.js (UPDATED - Added accordion events)
```

### HTML
```
apps/core/templates/core/explore.html (UPDATED - Enhanced structure)
```

## 🎨 CSS Classes Reference

### Explore Page
```css
.explore-page              /* Main container */
.explore-header            /* Sticky header with search */
.explore-content           /* Main content area */
.explore-sidebar           /* Filter sidebar */
.explore-results           /* Results container */
```

### Document Cards
```css
.document-card             /* Base card */
.document-card--list       /* List variant */
.document-card--grid       /* Grid variant */
.document-card--compact    /* Compact variant */
.document-card__header     /* Card header */
.document-card__title      /* Card title */
.document-card__tags       /* Tags container */
```

### States
```css
.explore-results__empty    /* Empty state */
.explore-results__loading  /* Loading state */
.document-card--loading    /* Loading card */
```

## 💻 JavaScript Usage

### FilterAccordion
```javascript
// Auto-initialized by ExplorePageManager
// Or manually:
import { FilterAccordion } from './components/filters/FilterAccordion.js';

const accordion = new FilterAccordion(element, {
  allowMultiple: true,
  defaultOpen: ['document_type'],
  saveState: true
});
```

### ResultsList
```javascript
import { ResultsList } from './components/results/ResultsList.js';

const list = new ResultsList(element, {
  emptyMessage: 'No documents found',
  enableVirtualization: false
});

list.renderResults(items);
```

## 🎯 Common Tasks

### Add a New Filter Group
1. Add HTML in `explore.html`:
```html
<div class="filter-group" data-filter-group="your-filter">
  <div class="filter-group__header">
    <h3 class="filter-group__title">Your Filter</h3>
  </div>
  <div class="filter-group__content">
    <!-- Filter options -->
  </div>
</div>
```

2. Update `defaultOpen` in ExplorePageManager if needed

### Customize Document Card
1. Use different variants:
```html
<article class="document-card document-card--list">
  <!-- For list view -->
</article>

<article class="document-card document-card--grid">
  <!-- For grid view -->
</article>
```

2. Add status:
```html
<span class="document-card__status document-card__status--new">
  New
</span>
```

### Style Customization
All using CSS variables:
```css
/* In your custom CSS */
.explore-header {
  --header-bg: rgba(255, 255, 255, 0.95);
  --header-blur: 10px;
}
```

## 📱 Responsive Breakpoints

```css
/* Desktop: Default styles apply */

@media (max-width: 992px) {
  /* Tablet: Sidebar collapses */
}

@media (max-width: 768px) {
  /* Mobile: Stacked layout */
}

@media (max-width: 480px) {
  /* Small mobile: Further optimizations */
}
```

## ♿ Accessibility Features

### Keyboard Shortcuts
- **Tab/Shift+Tab**: Navigate elements
- **Enter/Space**: Activate buttons
- **Arrow Keys**: Navigate accordion
- **Home/End**: Jump to first/last accordion

### ARIA Attributes
```html
<!-- Example accordion -->
<button 
  class="filter-group__header"
  aria-expanded="false"
  aria-controls="filter-content"
>

<!-- Example tab -->
<button
  role="tab"
  aria-selected="true"
  aria-controls="panel-id"
>
```

## 🔧 Debugging

### Common Issues

**Filters not working?**
```javascript
// Check FilterAccordion initialization
console.log(explorePageManager.components.filterAccordion);
```

**Styles not applying?**
```html
<!-- Ensure CSS is imported -->
{% static 'core/css/pages/explore.css' %}
{% static 'core/css/components/document-card.css' %}
```

**JavaScript errors?**
```javascript
// Check module imports
import { FilterAccordion } from '../components/filters/FilterAccordion.js';
```

### Browser DevTools

**Check filter state:**
```javascript
// In console
localStorage.getItem('explore-filter-accordion-state')
```

**Check component state:**
```javascript
// In console
explorePageManager.getState()
```

## 📊 Performance Tips

1. **Virtual Scrolling** (for 100+ items):
```javascript
const list = new ResultsList(element, {
  enableVirtualization: true,
  itemsPerPage: 20
});
```

2. **Lazy Loading Images**:
```html
<img loading="lazy" src="..." alt="...">
```

3. **Debounce Search**:
Already implemented in SearchBox component (300ms)

## 🎨 Theming

### CSS Variables Used
```css
--color-primary-500        /* Main brand color */
--color-bg-primary         /* Background */
--color-text-primary       /* Text */
--radius-lg                /* Border radius */
--shadow-sm                /* Box shadow */
--duration-base            /* Animation duration */
--ease-out                 /* Easing function */
```

### Customize Theme
```css
:root {
  --color-primary-500: #your-color;
  --radius-lg: 12px;
  /* etc. */
}
```

## 📋 Testing Checklist

Quick checks after deployment:

- [ ] Search bar works
- [ ] Filters open/close smoothly
- [ ] Filter selection updates results
- [ ] Pagination works
- [ ] Mobile sidebar toggles
- [ ] Keyboard navigation works
- [ ] No console errors

## 🚨 Rollback Plan

If issues occur:

1. **CSS Issues**: Remove import of `document-card.css`
2. **JS Issues**: Revert `ExplorePageManager.js` changes
3. **HTML Issues**: Revert `explore.html` template

All old code preserved, no breaking changes!

## 📚 Full Documentation

- **Complete Guide**: `docs/EXPLORE_PAGE_REFACTOR.md`
- **Test Results**: `docs/REFACTOR_TEST_RESULTS.md`
- **Summary**: `REFACTOR_SUMMARY.md`

## 💡 Tips

1. **Filter State**: Automatically saved to localStorage
2. **Accordion**: State persists across page reloads
3. **Mobile**: Filters collapse to save space
4. **Accessibility**: Full keyboard support built-in
5. **Performance**: Optimized for 60fps animations

## 🎉 Success!

Your explore page is now:
- ✅ More user-friendly
- ✅ Better organized
- ✅ Fully accessible
- ✅ Mobile-optimized
- ✅ Production-ready

---

**Quick Links**:
- [Full Documentation](docs/EXPLORE_PAGE_REFACTOR.md)
- [Test Results](docs/REFACTOR_TEST_RESULTS.md)
- [Summary](REFACTOR_SUMMARY.md)

