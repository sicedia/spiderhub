# Chart Component Styles

Modular CSS styles for chart components following ITCSS architecture and BEM methodology.

## Files

### Active Chart Styles
- **network-graph.css** - Cross-Sector Collaboration Network visualization
  - Network container with gradient background
  - Metrics sidebar with KPI cards
  - Responsive: desktop (2-col), tablet/mobile (stack)
  
- **sdg-radar.css** - SDG Alignment radar chart
  - Centered canvas container
  - Optimized height for radar display (400px)
  
- **binding-donut.css** - Legal Framework donut chart
  - Donut chart container (320px)
  - Centered layout with legend spacing
  
- **bar-chart.css** - Generic bar chart styles
  - Supports both horizontal and vertical variants
  - Includes legends for countries, themes, actors, and beneficiaries
  - Color-coded items with responsive layouts

## Architecture

All chart styles:
- Use BEM naming convention (`.chart-card--radar`, `.chart-body--treemap`)
- Leverage design tokens (`var(--space-*)`, `var(--color-*)`)
- Include responsive breakpoints (768px, 992px)
- Implement accessibility features (`prefers-reduced-motion`, `prefers-contrast`)

## Integration

These styles are imported in `main.css`:

```css
/* Chart Components */
@import 'components/charts/network-graph.css';
@import 'components/charts/sdg-radar.css';
@import 'components/charts/binding-donut.css';
@import 'components/charts/bar-chart.css';
```

## Usage

Apply chart-specific modifiers to `.chart-card` elements:

```html
<!-- Radar Chart -->
<div class="chart-card chart-card--radar">
  <div class="chart-body chart-body--radar">
    <canvas id="sdg-chart"></canvas>
  </div>
</div>

<!-- Horizontal Bar Chart -->
<div class="chart-card">
  <div class="chart-body">
    <canvas id="countries-chart"></canvas>
  </div>
</div>
```

## Responsive Design

All chart styles include responsive adjustments:
- **Desktop** (>992px): Full dimensions
- **Tablet** (768px-992px): Reduced heights, adjusted padding
- **Mobile** (<768px): Minimum heights, compact spacing

