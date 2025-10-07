# Event Bus Migration Guide

## 📋 Overview

This guide explains how to migrate from the current event system (mix of CustomEvents, emit/on methods, and document.addEventListener) to the new centralized **EventBus**.

**Benefits:**
- ✅ Centralized event management
- ✅ Automatic memory leak prevention
- ✅ Better debugging with event history
- ✅ Type-safe event names
- ✅ Automatic cleanup on component destruction

---

## 🎯 Migration Steps

### 1. Import the EventBus

```javascript
// Old
import { EVENTS } from '../core/constants/config.js';

// New - Add EventBus import
import { EVENTS } from '../core/constants/config.js';
import { eventBus } from '../core/events/EventBus.js';
```

### 2. Update Event Emission

#### Pattern 1: From `this.emit()` (BaseComponent)

```javascript
// OLD - BaseComponent emit
this.emit('search:performed', { query });

// NEW - Use EventBus directly
eventBus.emit(EVENTS.SEARCH_PERFORMED, { query });

// OR keep using this.emit() (BaseComponent will be updated to use EventBus)
this.emit(EVENTS.SEARCH_PERFORMED, { query });
```

#### Pattern 2: From CustomEvent + dispatchEvent

```javascript
// OLD
const event = new CustomEvent('filterChanged', {
  detail: { filterName, filterValue }
});
document.dispatchEvent(event);

// NEW
eventBus.emit(EVENTS.FILTER_CHANGED, { 
  filterName, 
  filterValue 
});
```

### 3. Update Event Listening

#### Pattern 1: From `document.addEventListener`

```javascript
// OLD
document.addEventListener('filterToggle', (e) => {
  const { filterName, filterValue } = e.detail;
  // handle event
});

// NEW
const unsubscribe = eventBus.on(EVENTS.FILTER_TOGGLE, (data) => {
  const { filterName, filterValue } = data;
  // handle event
});

// Store unsubscribe function for cleanup
this.eventUnsubscribers.push(unsubscribe);
```

#### Pattern 2: From `this.on()` (BaseComponent)

```javascript
// OLD
this.on('search:performed', this.handleSearch);

// NEW - BaseComponent will be updated to use EventBus internally
this.on(EVENTS.SEARCH_PERFORMED, this.handleSearch);
```

### 4. Cleanup in Component Destruction

```javascript
class MyComponent extends BaseComponent {
  constructor() {
    super();
    this.eventUnsubscribers = [];
  }

  init() {
    // Subscribe to events
    this.eventUnsubscribers.push(
      eventBus.on(EVENTS.FILTER_CHANGED, this.handleFilterChange, this),
      eventBus.on(EVENTS.SEARCH_PERFORMED, this.handleSearch, this)
    );
  }

  destroy() {
    // Unsubscribe from all events
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    
    // OR use context-based cleanup (recommended)
    eventBus.offContext(this);
    
    super.destroy();
  }
}
```

---

## 📊 Migration Examples

### Example 1: SearchBox Component

#### Before:
```javascript
// SearchBox.js
performSearch(searchTerm) {
  this.emit('search:performed', { query: searchTerm });
}

clearSearch() {
  this.emit('search:cleared');
}
```

#### After:
```javascript
// SearchBox.js
import { eventBus } from '../../core/events/EventBus.js';
import { EVENTS } from '../../core/constants/config.js';

performSearch(searchTerm) {
  eventBus.emit(EVENTS.SEARCH_PERFORMED, { query: searchTerm });
}

clearSearch() {
  eventBus.emit(EVENTS.SEARCH_CLEARED);
}
```

### Example 2: FilterManager Component

#### Before:
```javascript
// FilterManager.js
bindEvents() {
  document.addEventListener('filterToggle', (e) => {
    const { filterName, filterValue, isChecked } = e.detail;
    this.handleFilterToggle(filterName, filterValue, isChecked);
  });
}
```

#### After:
```javascript
// FilterManager.js
import { eventBus } from '../../core/events/EventBus.js';
import { EVENTS } from '../../core/constants/config.js';

init() {
  // ... other initialization
  this.setupEventListeners();
}

setupEventListeners() {
  this.eventUnsubscribers = [
    eventBus.on(EVENTS.FILTER_TOGGLE, this.handleFilterToggle.bind(this), this),
    eventBus.on(EVENTS.FILTER_CHANGED, this.handleFilterChange.bind(this), this)
  ];
}

destroy() {
  // Automatic cleanup by context
  eventBus.offContext(this);
  super.destroy();
}
```

### Example 3: ExplorePageManager

#### Before:
```javascript
// ExplorePageManager.js
setupComponentCommunication() {
  // Listen for search events
  document.addEventListener('commitSearch', () => {
    this.performSearch();
  });
  
  // Listen for filter changes
  document.addEventListener('filtersChanged', () => {
    this.performSearch();
  });
}
```

#### After:
```javascript
// ExplorePageManager.js
import { eventBus } from '../core/events/EventBus.js';
import { EVENTS } from '../core/constants/config.js';

setupComponentCommunication() {
  this.eventUnsubscribers = [
    eventBus.on(EVENTS.SEARCH_COMMITTED, () => {
      this.performSearch();
    }, this),
    
    eventBus.on(EVENTS.FILTERS_CHANGED, () => {
      this.performSearch();
    }, this)
  ];
}

destroy() {
  eventBus.offContext(this);
  super.destroy();
}
```

---

## 🔧 BaseComponent Integration

Update `BaseComponent` to use EventBus internally:

```javascript
// BaseComponent.js
import { eventBus } from '../events/EventBus.js';

class BaseComponent {
  constructor(element, options = {}) {
    // ... existing code
    this.eventUnsubscribers = [];
  }

  /**
   * Emit an event using EventBus
   */
  emit(eventName, data = {}) {
    eventBus.emit(eventName, data);
  }

  /**
   * Listen to an event using EventBus
   */
  on(eventName, callback) {
    const unsubscribe = eventBus.on(eventName, callback, this);
    this.eventUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Listen to an event once
   */
  once(eventName, callback) {
    const unsubscribe = eventBus.once(eventName, callback, this);
    this.eventUnsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Clean up all event listeners
   */
  destroy() {
    // Cleanup using context
    eventBus.offContext(this);
    
    // Also unsubscribe individual listeners
    this.eventUnsubscribers.forEach(unsubscribe => unsubscribe());
    this.eventUnsubscribers = [];
    
    // ... rest of cleanup
  }
}
```

---

## 🐛 Debugging with EventBus

### View Event Statistics
```javascript
// In browser console
window.__eventBus.logStats();
```

### View Event History
```javascript
// Get last 100 events
const history = window.__eventBus.getHistory();
console.table(history);

// Get specific event history
const searchHistory = window.__eventBus.getHistory('search:performed');
console.table(searchHistory);
```

### Wait for an Event (Testing)
```javascript
// Wait for a specific event
await window.__eventBus.waitFor('search:performed', 5000);
```

### Monitor All Events (Debugging)
```javascript
// Add wildcard listener
window.__eventBus.on('*', ({ eventName, data }) => {
  console.log(`Event: ${eventName}`, data);
});
```

---

## ✅ Migration Checklist

### Components to Migrate:
- [ ] SearchBox.js
- [ ] SearchManager.js
- [ ] DocumentResults.js
- [ ] FilterManager.js
- [ ] FilterAccordion.js
- [ ] FilterChips.js
- [ ] FilterGroups.js
- [ ] SuggestionsBox.js
- [ ] ViewToggle.js
- [ ] MobileNav.js
- [ ] ExplorePageManager.js
- [ ] BaseComponent.js (core integration)

### Steps:
1. ✅ Create EventBus.js
2. ✅ Standardize event names in config.js
3. [ ] Update BaseComponent to use EventBus
4. [ ] Migrate one component as example (SearchBox)
5. [ ] Migrate filter components
6. [ ] Migrate search components
7. [ ] Migrate page managers
8. [ ] Test and verify no memory leaks
9. [ ] Remove old CustomEvent code

---

## 📈 Expected Benefits

### Before (Current):
```
❌ Events scattered across document.addEventListener
❌ Memory leaks from forgotten event cleanup
❌ Hard to debug event flow
❌ Inconsistent event naming
❌ Manual cleanup required
```

### After (With EventBus):
```
✅ Centralized event management
✅ Automatic memory leak prevention
✅ Event history for debugging
✅ Consistent, namespaced event names
✅ Automatic cleanup by context
✅ Better performance monitoring
```

---

## 🚨 Common Pitfalls

### 1. Forgetting to Cleanup
```javascript
// ❌ BAD - No cleanup
init() {
  eventBus.on(EVENTS.SEARCH_PERFORMED, this.handleSearch);
}

// ✅ GOOD - With cleanup
init() {
  eventBus.on(EVENTS.SEARCH_PERFORMED, this.handleSearch, this);
}

destroy() {
  eventBus.offContext(this);
}
```

### 2. Wrong Event Names
```javascript
// ❌ BAD - Hardcoded string
eventBus.emit('searchPerformed', { query });

// ✅ GOOD - Using constant
eventBus.emit(EVENTS.SEARCH_PERFORMED, { query });
```

### 3. Not Passing Context
```javascript
// ❌ BAD - No context for cleanup
eventBus.on(EVENTS.FILTER_CHANGED, this.handleFilter);

// ✅ GOOD - With context
eventBus.on(EVENTS.FILTER_CHANGED, this.handleFilter, this);
```

---

## 📚 Additional Resources

- `apps/core/static/core/js/core/events/EventBus.js` - EventBus implementation
- `apps/core/static/core/js/core/constants/config.js` - Event name constants
- `ARCHITECTURE_REVIEW.md` - Original architecture analysis

---

*Last Updated: October 7, 2025*
