/**
 * Analysis Page Manager - Simplified Version
 * Simplified version that focuses on basic chart rendering without complex dependencies
 * Uses @js/ alias for clean imports
 */

import { BaseComponent } from '../core/base/BaseComponent.js';
import { CONFIG, EVENTS } from '../core/constants/config.js';
import { DOMUtils } from '../core/utils/dom.js';

export class AnalysisPageManager extends BaseComponent {
  constructor(element = document.body, options = {}) {
    try {
      super(element, options);
      
      this.instanceId = Math.random().toString(36).substr(2, 9);
      this.state = {
        isLoading: false,
        analysisData: null,
        chartsInitialized: false
      };
      
      console.log('AnalysisPageManager: Simplified version initialized');
      
      // Initialize immediately
      this.init();
      
    } catch (error) {
      console.error('AnalysisPageManager: Constructor error:', error);
      throw error;
    }
  }

  getDefaultOptions() {
    return {
      autoInitialize: true,
      enableChartAnimations: true,
      enableDataGrid: false, // Disabled for now
      enableModals: false    // Disabled for now
    };
  }

  async init() {
    try {
      console.log('AnalysisPageManager: Starting initialization...');
      
      // Load analysis data
      await this.loadAnalysisData();
      
      // Initialize charts
      this.initializeCharts();
      
      // Animate summary cards
      this.animateSummaryCards();
      
      console.log('✅ AnalysisPageManager: Initialization completed');
      
    } catch (error) {
      console.error('❌ AnalysisPageManager: Initialization failed:', error);
    }
  }

  async loadAnalysisData() {
    try {
      // Try to get data from the page script tag
      const dataScript = document.getElementById('analysis-data');
      if (dataScript) {
        this.state.analysisData = JSON.parse(dataScript.textContent);
        console.log('Analysis data loaded from page:', this.state.analysisData);
      } else {
        // Fallback: create mock data for development
        this.state.analysisData = this.createMockData();
        console.log('Using mock analysis data');
      }
    } catch (error) {
      console.error('Error loading analysis data:', error);
      this.state.analysisData = this.createMockData();
    }
  }

  createMockData() {
    return {
      sdg_counts: {
        'SDG 1': 15, 'SDG 2': 8, 'SDG 3': 12, 'SDG 4': 25, 'SDG 5': 18,
        'SDG 6': 10, 'SDG 7': 20, 'SDG 8': 30, 'SDG 9': 35, 'SDG 10': 22,
        'SDG 11': 16, 'SDG 12': 14, 'SDG 13': 28, 'SDG 14': 6, 'SDG 15': 9,
        'SDG 16': 24, 'SDG 17': 32
      },
      binding_counts: {
        'Legally Binding': 45,
        'Politically Binding': 78,
        'Non-Binding': 32
      },
      country_counts: {
        'Spain': 25, 'Germany': 22, 'France': 20, 'Brazil': 18, 'Argentina': 15,
        'Mexico': 14, 'Colombia': 12, 'Chile': 10, 'Peru': 8, 'Ecuador': 6
      },
      theme_counts: {
        'Digital Economy': 45, 'Cybersecurity': 38, 'AI & Innovation': 32,
        'Digital Skills': 28, 'E-Government': 25, 'Digital Infrastructure': 22
      },
      actor_counts: {
        'Government': 85, 'Private Sector': 65, 'Academia': 45, 
        'Civil Society': 35, 'International Organizations': 25
      },
      beneficiary_counts: {
        'SMEs': 55, 'Citizens': 48, 'Researchers': 35, 'Startups': 28, 'NGOs': 20
      }
    };
  }

  initializeCharts() {
    console.log('Initializing charts...');
    
    // Initialize each chart type
    this.initializeSDGRadarChart();
    this.initializeLegalBindingPieChart();
    this.initializeCountryBarChart();
    this.initializeThemeBarChart();
    this.initializeActorBarChart();
    this.initializeBeneficiaryBarChart();
    
    // Initialize placeholder charts for complex visualizations
    this.initializePlaceholderCharts();
    
    this.state.chartsInitialized = true;
  }

  initializeSDGRadarChart() {
    const container = DOMUtils.getElement('#radar-chart');
    if (!container) return;

    const data = this.state.analysisData.sdg_counts;
    this.renderSimpleRadarChart(container, data, 'SDG Alignment Overview');
  }

  initializeLegalBindingPieChart() {
    const container = DOMUtils.getElement('#pie-chart');
    if (!container) return;

    const data = this.state.analysisData.binding_counts;
    this.renderSimplePieChart(container, data, 'Legal Bindingness Distribution');
  }

  initializeCountryBarChart() {
    const container = DOMUtils.getElement('#lead-countries-chart');
    if (!container) return;

    const data = this.state.analysisData.country_counts;
    this.renderSimpleBarChart(container, data, 'Lead Countries Analysis');
  }

  initializeThemeBarChart() {
    const container = DOMUtils.getElement('#theme-bar-chart');
    if (!container) return;

    const data = this.state.analysisData.theme_counts;
    this.renderSimpleBarChart(container, data, 'Digital Transformation Themes');
  }

  initializeActorBarChart() {
    const container = DOMUtils.getElement('#actor-bar-chart');
    if (!container) return;

    const data = this.state.analysisData.actor_counts;
    this.renderSimpleBarChart(container, data, 'Actor Type Distribution');
  }

  initializeBeneficiaryBarChart() {
    const container = DOMUtils.getElement('#beneficiary-bar-chart');
    if (!container) return;

    const data = this.state.analysisData.beneficiary_counts;
    this.renderSimpleBarChart(container, data, 'Beneficiary Groups Analysis');
  }

  initializePlaceholderCharts() {
    // Initialize remaining charts with placeholders
    const chartSelectors = [
      '#coverage-bar-chart',
      '#diversity-radar-chart', 
      '#initiative-treemap-chart',
      '#collaboration-network-chart'
    ];

    chartSelectors.forEach(selector => {
      const container = DOMUtils.getElement(selector);
      if (container) {
        this.renderPlaceholderChart(container, 'Advanced Visualization');
      }
    });
  }

  renderSimpleBarChart(container, data, title) {
    const entries = Object.entries(data);
    const maxValue = Math.max(...entries.map(([_, value]) => value));
    
    container.innerHTML = `
      <div class="simple-chart">
        <h4>${title}</h4>
        <div class="bar-chart">
          ${entries.map(([label, value]) => `
            <div class="bar-item">
              <div class="bar-label">${label}</div>
              <div class="bar-container">
                <div class="bar-fill" style="width: ${(value / maxValue) * 100}%; background-color: #094EB2;"></div>
                <span class="bar-value">${value}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Add CSS styles if not already present
    this.addChartStyles();
  }

  renderSimplePieChart(container, data, title) {
    const entries = Object.entries(data);
    const total = entries.reduce((sum, [_, value]) => sum + value, 0);
    const colors = ['#094EB2', '#34A853', '#FBBC04', '#EA4335', '#9C27B0'];
    
    container.innerHTML = `
      <div class="simple-chart">
        <h4>${title}</h4>
        <div class="pie-chart">
          <div class="pie-legend">
            ${entries.map(([label, value], index) => `
              <div class="legend-item">
                <span class="legend-color" style="background-color: ${colors[index % colors.length]};"></span>
                <span class="legend-label">${label}: ${value} (${Math.round((value / total) * 100)}%)</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.addChartStyles();
  }

  renderSimpleRadarChart(container, data, title) {
    const entries = Object.entries(data);
    
    container.innerHTML = `
      <div class="simple-chart">
        <h4>${title}</h4>
        <div class="radar-chart">
          <div class="radar-items">
            ${entries.map(([label, value]) => `
              <div class="radar-item">
                <span class="radar-label">${label}</span>
                <div class="radar-bar">
                  <div class="radar-fill" style="width: ${Math.min((value / 40) * 100, 100)}%; background-color: #094EB2;"></div>
                  <span class="radar-value">${value}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.addChartStyles();
  }

  renderPlaceholderChart(container, title) {
    container.innerHTML = `
      <div class="simple-chart">
        <h4>${title}</h4>
        <div class="chart-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">📊</div>
            <p>Advanced visualization coming soon</p>
            <small>This chart will be implemented with D3.js or Chart.js</small>
          </div>
        </div>
      </div>
    `;

    this.addChartStyles();
  }

  addChartStyles() {
    if (document.getElementById('analysis-chart-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'analysis-chart-styles';
    styles.textContent = `
      .simple-chart {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin: 10px 0;
      }
      
      .simple-chart h4 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
      }
      
      .bar-chart .bar-item {
        margin-bottom: 10px;
      }
      
      .bar-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .bar-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .bar-fill {
        height: 20px;
        border-radius: 4px;
        min-width: 20px;
        transition: width 0.3s ease;
      }
      
      .bar-value {
        font-size: 12px;
        font-weight: 600;
        color: #333;
        min-width: 30px;
      }
      
      .pie-legend .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      
      .legend-label {
        font-size: 12px;
        color: #333;
      }
      
      .radar-items .radar-item {
        margin-bottom: 8px;
      }
      
      .radar-label {
        display: inline-block;
        width: 80px;
        font-size: 11px;
        color: #666;
      }
      
      .radar-bar {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        width: calc(100% - 90px);
      }
      
      .radar-fill {
        height: 16px;
        border-radius: 3px;
        min-width: 10px;
        transition: width 0.3s ease;
      }
      
      .radar-value {
        font-size: 11px;
        font-weight: 600;
        color: #333;
        min-width: 25px;
      }
      
      .chart-placeholder {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        border: 2px dashed #ddd;
        border-radius: 8px;
      }
      
      .placeholder-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .placeholder-content p {
        margin: 0 0 8px 0;
        font-weight: 500;
      }
      
      .placeholder-content small {
        color: #999;
      }
    `;
    
    document.head.appendChild(styles);
  }

  animateSummaryCards() {
    const cards = document.querySelectorAll('.summary-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  // Public methods for backward compatibility
  getAnalysisData() {
    return this.state.analysisData;
  }

  getComponent(name) {
    console.warn(`Component "${name}" not available in simplified version`);
    return null;
  }
}
