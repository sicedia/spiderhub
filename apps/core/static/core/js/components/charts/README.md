# Chart Components

Modular chart components following the BaseChart architecture.

## Active Components (Used in Analysis Dashboard)

These components are currently being used in the Analysis page:

### Network Visualizations
- **NetworkGraph.js** - Force-directed network graph for cross-sector collaboration visualization
  - Uses: vis-network library
  - Location: Analysis Dashboard (top section)

### Specialized Chart Components  
- **SDGRadarChart.js** - Radar chart for Sustainable Development Goals alignment
  - Extends: BaseChart
  - Uses: Chart.js radar type
  
- **BindingDonutChart.js** - Donut chart for legal bindingness distribution
  - Extends: BaseChart
  - Uses: Chart.js doughnut type

### Bar Chart Variants
- **CountriesBarChart.js** - Horizontal bar chart for leading countries (top 15)
  - Features: EU/LAC color differentiation by region, sorted by document count
- **ThemesBarChart.js** - Horizontal bar chart for thematic focus (with color categories)
- **ActorsBarChart.js** - Vertical bar chart for actor types (with category colors)
- **BeneficiariesBarChart.js** - Horizontal bar chart for beneficiary groups (top 10, sorted)

## Generic Base Components (Reusable)

These are general-purpose chart components available for use in other pages:

- **BarChart.js** - Generic configurable bar chart (horizontal/vertical)
- **RadarChart.js** - Generic radar/spider chart
- **PieChart.js** - Generic pie/donut chart
- **MapChart.js** - Generic geographical map visualization

## Architecture

All chart components:
1. Extend `BaseChart` from `../../core/base/BaseChart.js`
2. Follow the same lifecycle: `constructor` → `loadData()` → `render()` → `destroy()`
3. Emit events through the EventBus
4. Use design tokens for consistent styling
5. Include accessibility features

## Usage Example

```javascript
import { SDGRadarChart } from '../components/charts/SDGRadarChart.js';

const chart = new SDGRadarChart(canvasElement, {
  sdgData: dataCoordinator.getChartData('sdg')
});

await chart.init();
```

## CSS Styles

Each chart type has corresponding CSS in `apps/core/static/core/css/components/charts/`:
- `network-graph.css` - Network visualization styles
- `sdg-radar.css` - Radar chart styles
- `binding-donut.css` - Donut chart styles
- `bar-chart.css` - Generic bar chart styles (includes countries, themes, actors, beneficiaries legends)

