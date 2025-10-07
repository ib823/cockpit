# L3 Selector Enhancements

**Source:** UX_UI_AUDIT_COMPLETE.md (Section 2.2)
**Cross-ref:** Holistic_Redesign_V2.md (Tier 1 UX)
**Date:** 2025-10-06

---

## 🎯 CURRENT PROBLEMS

From audit (EstimatorPage, Lines 394-498):

1. ❌ **No search** - 200+ items, no filter
2. ❌ **No presets** - Missing industry shortcuts
3. ❌ **Visual density** - 3-column grid cramped on mobile
4. ❌ **No descriptions** - Users don't know what items do
5. ❌ **No keyboard nav** - Mouse-only interaction

---

## ✅ SOLUTION SPEC

### 1. Add Search/Filter

```typescript
// src/components/estimator/L3SelectorModal.tsx (MODIFY)

const [searchQuery, setSearchQuery] = useState('');
const [tierFilter, setTierFilter] = useState<number | null>(null);

const filteredModules = modules.map(module => ({
  module,
  items: l3CatalogComplete.getByModule(module).filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = tierFilter === null || item.tier === tierFilter;

    return matchesSearch && matchesTier;
  })
})).filter(m => m.items.length > 0);

// UI
<div className="p-4 border-b sticky top-0 bg-white z-10">
  <input
    type="text"
    placeholder="Search L3 items..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full px-4 py-2 border rounded-lg"
  />

  <div className="flex gap-2 mt-3">
    <button
      onClick={() => setTierFilter(null)}
      className={cn('px-3 py-1 rounded', tierFilter === null && 'bg-blue-100')}
    >
      All Tiers
    </button>
    {[1, 2, 3, 4].map(tier => (
      <button
        key={tier}
        onClick={() => setTierFilter(tier)}
        className={cn('px-3 py-1 rounded', tierFilter === tier && 'bg-blue-100')}
      >
        Tier {tier}
      </button>
    ))}
  </div>
</div>
```

### 2. Add Industry Presets

```typescript
const PRESETS = {
  manufacturing: {
    name: 'Manufacturing',
    items: ['PP-001', 'PP-002', 'QM-001', 'MM-001', 'PM-001'],
  },
  retail: {
    name: 'Retail & Distribution',
    items: ['SD-001', 'SD-002', 'MM-002', 'WM-001'],
  },
  finance: {
    name: 'Financial Services',
    items: ['FI-001', 'CO-001', 'TR-001', 'RE-001'],
  },
  utilities: {
    name: 'Utilities',
    items: ['IS-U-001', 'PM-002', 'CS-001'],
  },
};

// UI
<div className="p-4 border-b bg-gray-50">
  <p className="text-sm text-gray-600 mb-2">Quick Select by Industry:</p>
  <div className="flex flex-wrap gap-2">
    {Object.entries(PRESETS).map(([key, preset]) => (
      <button
        key={key}
        onClick={() => {
          const items = l3CatalogComplete.getByCodes(preset.items);
          setLocalSelected([...localSelected, ...items]);
        }}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        + {preset.name}
      </button>
    ))}
  </div>
</div>
```

### 3. Add Item Descriptions (Tooltip)

```typescript
import { Tooltip } from '@/components/common/Tooltip';

<Tooltip
  content={item.description || 'No description available'}
>
  <button className="...">
    <div className="font-mono text-xs text-gray-500">{item.code}</div>
    <div className="font-medium text-sm">{item.name}</div>
    <div className="text-xs text-gray-500">Tier {item.tier}</div>
  </button>
</Tooltip>
```

### 4. Responsive Grid

```typescript
// Change from fixed 3-column to responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
  {items.map(item => ...)}
</div>
```

### 5. Keyboard Navigation

```typescript
const [focusedIndex, setFocusedIndex] = useState(0);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      toggleItem(items[focusedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [focusedIndex, items]);
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Search filters items in real-time
- [ ] Tier filter works (All/1/2/3/4)
- [ ] Industry presets add multiple items at once
- [ ] Tooltips show item descriptions on hover
- [ ] Grid responsive (1/2/3 columns)
- [ ] Arrow keys navigate items
- [ ] Enter key toggles selection
- [ ] Escape key closes modal

---

**End of L3Selector Enhancements**
