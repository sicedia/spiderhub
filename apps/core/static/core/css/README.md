# CSS Architecture Documentation

## Overview

This project now uses a modern, maintainable CSS architecture following industry best practices. The CSS has been completely refactored using:

- **BEM (Block Element Modifier)** methodology for naming conventions
- **ITCSS (Inverted Triangle CSS)** architecture for file organization
- **Design System Tokens** for consistent styling
- **Component-based architecture** for modularity
- **Accessibility-first approach** with WCAG 2.1 AA compliance

## File Structure

```
css/
├── main.css                 # Main entry point (imports all modules)
├── tokens.css              # Design system tokens and CSS custom properties
├── reset.css               # Modern CSS reset
├── base/
│   ├── typography.css      # Base typography styles
│   └── layout.css          # Base layout patterns
├── components/
│   ├── button.css          # Button component
│   ├── card.css            # Card component
│   ├── navigation.css      # Header navigation
│   ├── form.css            # Form components
│   ├── tag.css             # Tag/badge component
│   ├── carousel.css        # Carousel component
│   ├── modal.css           # Modal component
│   └── footer.css          # Footer component
├── pages/
│   ├── home.css            # Home page specific styles
│   ├── explore.css         # Explore page specific styles
│   ├── analysis.css        # Analysis page specific styles
│   ├── document-detail.css # Document detail page styles
│   └── about.css           # About page specific styles
└── utilities.css           # Utility classes
```

## Architecture Layers (ITCSS)

1. **Settings** (`tokens.css`) - Design tokens and CSS custom properties
2. **Tools** - Mixins and functions (not needed for this project)
3. **Generic** (`reset.css`) - CSS reset and normalize
4. **Elements** (`base/`) - Base element styles
5. **Objects** - Layout patterns (integrated into base/)
6. **Components** (`components/`) - UI components
7. **Utilities** (`utilities.css`) - Helper classes

## BEM Naming Convention

### Block
The main component name:
```css
.button { }
.card { }
.navigation { }
```

### Element
Parts of a block, separated by double underscores:
```css
.button__icon { }
.card__header { }
.navigation__logo { }
```

### Modifier
Variations of blocks or elements, separated by double hyphens:
```css
.button--primary { }
.button--large { }
.card--elevated { }
.navigation__link--active { }
```

## Design System Tokens

All design values are centralized in `tokens.css`:

### Colors
- Primary: `--color-primary-500` (main brand color)
- Secondary: `--color-secondary-500`
- Semantic: `--color-accent-success`, `--color-accent-warning`, etc.
- Neutral: `--color-neutral-0` to `--color-neutral-900`

### Typography
- Font families: `--font-family-primary`, `--font-family-secondary`
- Font sizes: `--font-size-xs` to `--font-size-6xl`
- Font weights: `--font-weight-light` to `--font-weight-extrabold`
- Line heights: `--line-height-tight`, `--line-height-normal`, etc.

### Spacing
- Base unit: 8px
- Scale: `--space-1` (4px) to `--space-24` (96px)
- Semantic: `--space-xs`, `--space-sm`, `--space-md`, etc.

### Other Tokens
- Border radius: `--radius-sm` to `--radius-full`
- Shadows: `--shadow-xs` to `--shadow-xl`
- Transitions: `--duration-fast`, `--duration-base`, `--duration-slow`
- Z-index scale: `--z-index-base` to `--z-index-tooltip`

## Component Examples

### Button Component
```html
<!-- Primary button -->
<button class="button button--primary">Click me</button>

<!-- Secondary button with icon -->
<button class="button button--secondary button--large">
  <span class="button__icon">📄</span>
  <span class="button__text">Download</span>
</button>

<!-- Ghost button -->
<a href="#" class="button button--ghost">Learn more</a>
```

### Card Component
```html
<div class="card card--elevated">
  <div class="card__header">
    <h3 class="card__title">Card Title</h3>
    <p class="card__subtitle">Subtitle</p>
  </div>
  <div class="card__body">
    <p class="card__content">Card content goes here...</p>
  </div>
  <div class="card__footer">
    <div class="card__actions">
      <button class="button button--primary">Action</button>
    </div>
  </div>
</div>
```

### Tag Component
```html
<!-- Basic tags -->
<span class="tag tag--primary">Primary</span>
<span class="tag tag--success">Success</span>
<span class="tag tag--warning">Warning</span>

<!-- Solid variant -->
<span class="tag tag--primary tag--solid">Solid Primary</span>

<!-- With icon -->
<span class="tag tag--info">
  <span class="tag__icon">ℹ️</span>
  Information
</span>

<!-- Removable tag -->
<span class="tag tag--secondary tag--removable">
  Removable
  <button class="tag__remove" aria-label="Remove tag">×</button>
</span>
```

## Utility Classes

Utility classes follow the `u-` prefix convention:

### Layout
```css
.u-flex { display: flex; }
.u-grid { display: grid; }
.u-hidden { display: none; }
.u-justify-center { justify-content: center; }
.u-items-center { align-items: center; }
```

### Spacing
```css
.u-m-4 { margin: var(--space-4); }
.u-p-2 { padding: var(--space-2); }
.u-mt-8 { margin-top: var(--space-8); }
.u-mb-0 { margin-bottom: 0; }
```

### Typography
```css
.u-text-center { text-align: center; }
.u-text-lg { font-size: var(--font-size-lg); }
.u-font-bold { font-weight: var(--font-weight-bold); }
.u-text-primary { color: var(--color-text-primary); }
```

## Responsive Design

All components are mobile-first and responsive:

### Breakpoints
- `--breakpoint-sm`: 640px
- `--breakpoint-md`: 768px
- `--breakpoint-lg`: 1024px
- `--breakpoint-xl`: 1280px
- `--breakpoint-2xl`: 1536px

### Usage
```css
/* Mobile first */
.component {
  padding: var(--space-sm);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--space-lg);
  }
}
```

## Accessibility Features

- Focus management with visible focus rings
- High contrast mode support
- Reduced motion support
- Screen reader friendly markup
- Proper ARIA attributes
- Keyboard navigation support

## Browser Support

- Modern browsers (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)
- CSS Grid and Flexbox support required
- CSS Custom Properties support required

## Migration Guide

### Old vs New Class Names

| Old Class | New Class |
|-----------|-----------|
| `.btn` | `.button` |
| `.btn-primary` | `.button--primary` |
| `.btn-sm` | `.button--small` |
| `.hero` | `.home-hero` |
| `.hero-content` | `.home-hero__content` |
| `.navbar` | `.navigation` |
| `.nav-links` | `.navigation__list` |
| `.document-card` | `.card--document` |
| `.tag-primary` | `.tag--primary` |

### Template Updates

Templates have been updated to use the new BEM class names. Key changes:

1. **Base template**: Now imports `main.css` instead of individual files
2. **Navigation**: Uses `.navigation` block with proper BEM elements
3. **Buttons**: All `.btn` classes changed to `.button` with BEM modifiers
4. **Cards**: Document cards now use the generic `.card` component
5. **Tags**: Updated to use BEM modifier syntax

## Performance Optimizations

- Single CSS file reduces HTTP requests
- Efficient selector specificity
- Minimal CSS output through systematic approach
- Tree-shakeable utility classes
- Optimized for CSS compression

## Development Workflow

1. **Adding new components**: Create in `components/` directory
2. **Page-specific styles**: Add to appropriate file in `pages/`
3. **New design tokens**: Add to `tokens.css`
4. **Utility classes**: Add to `utilities.css`
5. **Import order**: Update `main.css` if adding new files

## Testing Checklist

- [ ] All pages load without CSS errors
- [ ] Navigation works on mobile and desktop
- [ ] Buttons have proper hover/focus states
- [ ] Cards display correctly
- [ ] Carousel functionality works
- [ ] Forms are properly styled
- [ ] Footer displays correctly
- [ ] Responsive behavior works across breakpoints
- [ ] Accessibility features function properly
- [ ] Print styles work correctly

## Maintenance

- Use design tokens instead of hardcoded values
- Follow BEM naming conventions for new classes
- Keep components modular and reusable
- Update documentation when adding new patterns
- Test across different devices and browsers
- Validate HTML and CSS regularly
