# Strategic Cabinet Backend Logic Documentation

## Overview
This document describes the backend logic and data filtering strategy for the Strategic Cabinet Country-EU dashboard.

## Core Principle: Participation Types

All Strategic Cabinet endpoints use a **unified participation filter** that includes three types of country participation:

```python
Q(event_country__iso3=country_iso3) |    # Event host
Q(lead_country__iso3=country_iso3) |     # Leadership
Q(countries_involved__iso3=country_iso3) # Participation
```

This provides a **complete diplomatic presence view** of the focus country.

## Endpoints and Their Logic

### 1. `/api/cabinet/summary/` ✨ NEW
**Purpose:** Provide KPI metrics for dashboard cards

**Participation Filter:** `lead ∪ involved ∪ event`

**Returns:**
- `total_documents`: Total count of documents where country participates in any role
- `active_partnerships`: Distinct count of partner countries (excluding focus country)
- `thematic_areas`: Distinct count of themes across all documents
- `leadership_initiatives`: Count of documents where country acts as lead_country (measures proactive diplomacy)

**Calculation Logic:**
```python
# Collect all partner countries from three sources
partner_countries = set()
partner_countries.update(involved_countries - focus_country)
partner_countries.update(lead_countries - focus_country)
partner_countries.update(event_countries - focus_country)

active_partnerships = len(partner_countries)
```

**Justification:** Measures complete diplomatic footprint and ecosystem breadth.

---

### 2. `/api/cabinet/trends/`
**Purpose:** Show temporal evolution of cooperation

**Participation Filter:** `lead ∪ involved ∪ event`

**Returns:**
- `trends_by_bindingness`: Yearly document count by legal bindingness
- `trends_by_scope`: Yearly document count by coverage scope
- `total_documents`: Total documents in filtered period

**Justification:** Measures total diplomatic activity over time, regardless of role type.

---

### 3. `/api/cabinet/map/`
**Purpose:** Visualize cooperation network geography

**Participation Filter:** `lead ∪ involved ∪ event` for all nodes

**Returns:**
- `cooperation`: Array of partner countries with combined document counts
  ```json
  {
    "iso3": "ESP",
    "name": "Spain",
    "count": 15  // Combined from involved + lead + event
  }
  ```

**Calculation Logic:**
```python
country_map = {}

# Aggregate counts from three sources
for country in countries_involved:
    country_map[iso3]['count'] += count

for country in lead_countries:
    country_map[iso3]['count'] += count

for country in event_countries:
    country_map[iso3]['count'] += count
```

**Justification:** 
- **Comprehensive network view**: Shows all diplomatic connections
- **Combined intensity**: Larger markers = more cooperation touchpoints
- **Includes event hosts**: Countries hosting cooperation events are also relevant partners

---

### 4. `/api/cabinet/mix/`
**Purpose:** Show composition of cooperation instruments

**Participation Filter:** `lead ∪ involved ∪ event`

**Returns:**
- `bindingness`: Distribution by legal_bindingness (politically-binding, legally-binding, non-binding)
- `document_types`: Distribution by document type (agreements, dialogues, etc.)
- `coverage_scope`: Distribution by coverage scope (bilateral, multilateral, regional)

**Justification:** Analyzes the legal and diplomatic profile of the country's entire cooperation portfolio.

---

### 5. `/api/cabinet/top/`
**Purpose:** Identify strategic priorities and key actors

**Participation Filter:** `lead ∪ involved ∪ event`

**Returns:**
- `themes`: Top 10 thematic areas with document counts
- `actors`: Top 10 institutional actors with document counts
- `sdgs`: Top 10 SDGs with document counts

**Justification:** Shows where the country focuses its diplomatic efforts and who its main partners are.

---

## When to Use Different Filters

### ✅ Use `lead ∪ involved ∪ event` (CURRENT IMPLEMENTATION)
**For:** Measuring total diplomatic presence, ecosystem, and strategic positioning
- Summary metrics (KPIs)
- Cooperation trends over time
- Network mapping
- Document portfolio composition
- Strategic priorities analysis

**Rationale:** Provides the most complete picture of a country's international cooperation activities.

### 🎯 Use `lead_country` only
**For:** Measuring leadership initiative or direct responsibility
- Documents where country has primary control
- Own initiatives and proposals
- Direct leadership metrics

**Example use cases:**
- "How many cooperation initiatives does Ecuador lead?"
- "What is Ecuador's leadership footprint?"
- "Track country's proactive diplomacy"

### 📍 Use `event_country` only
**For:** Measuring visibility or hosting capacity
- Documents signed/events held in country
- Country as cooperation venue

**Rationale:** Gives context about diplomatic visibility, not alignment or leadership.

---

## Data Consistency

All endpoints follow these principles:

1. **Distinct documents:** Use `.distinct()` to avoid duplicates from M2M relationships
2. **Date filtering:** Apply `event_date` filters when provided
3. **Exclude self:** When counting partners, exclude the focus country itself
4. **Null handling:** Filter out null values before aggregation

## Frontend Integration

The frontend `CabinetDataCoordinator` fetches all five endpoints in parallel:

```javascript
const [summaryData, trendsData, mapData, mixData, topData] = await Promise.all([
  this.loadSummary(),   // KPIs
  this.loadTrends(),    // Timeline chart
  this.loadMap(),       // Geographic network
  this.loadMix(),       // Document composition
  this.loadTop()        // Strategic priorities
]);
```

## Performance Considerations

- All endpoints use optimized Django ORM queries
- Counts use `Count('id', distinct=True)` for accuracy
- Aggregations happen at database level
- Results cached in frontend coordinator
- Parallel API calls minimize load time

## Future Enhancements

To add leadership-specific analysis:
1. Create `/api/cabinet/leadership/` endpoint using only `lead_country`
2. Add "Leadership Initiatives" section to dashboard
3. Compare leadership vs participation metrics

---

**Last Updated:** October 13, 2025  
**Version:** 1.0  
**Maintainer:** SPIDERHUB Development Team

