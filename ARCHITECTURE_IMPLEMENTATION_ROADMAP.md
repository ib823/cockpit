# Architecture Tool - Implementation Roadmap
## Quick Wins → Full Transformation

Based on honest Jobs/Ive assessment: Current tool is functionally complete but experientially poor.

---

## Phase 1: Critical Fixes (Week 1) - P0

### 1.1 Add AS-IS vs TO-BE Mode ⭐ **HIGHEST IMPACT**

**Current:** No way to indicate if documenting existing or designing new system.

**Implementation:**

```typescript
// 1. Update types.ts
export interface ArchitectureMetadata {
  mode: 'as-is' | 'to-be';
  timestamp: string;
}

export interface ArchitectureData {
  metadata: ArchitectureMetadata; // Add this
  projectInfo: ProjectInfo;
  // ... rest unchanged
}

// 2. Create src/app/architecture/components/ModeSelector.tsx
'use client';

export function ModeSelector({ onSelect }: { onSelect: (mode: 'as-is' | 'to-be') => void }) {
  return (
    <div className="max-w-4xl mx-auto py-16">
      <h1 className="text-4xl font-bold text-center mb-4">
        SAP Architecture Documentation
      </h1>
      <p className="text-center text-gray-600 mb-12">
        What are you creating today?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AS-IS Card */}
        <button
          onClick={() => onSelect('as-is')}
          className="group p-8 bg-white rounded-xl border-2 border-gray-200
                     hover:border-blue-500 hover:shadow-lg transition-all text-left"
        >
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600">
            Document Existing System
          </h2>
          <p className="text-gray-600 mb-4">
            Capture your current architecture, integrations, and infrastructure.
          </p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>✓ AS-IS documentation</li>
            <li>✓ Current state assessment</li>
            <li>✓ Gap analysis ready</li>
          </ul>
        </button>

        {/* TO-BE Card */}
        <button
          onClick={() => onSelect('to-be')}
          className="group p-8 bg-white rounded-xl border-2 border-gray-200
                     hover:border-purple-500 hover:shadow-lg transition-all text-left"
        >
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-2xl font-semibold mb-3 group-hover:text-purple-600">
            Design New System
          </h2>
          <p className="text-gray-600 mb-4">
            Plan your future architecture, modules, and integrations.
          </p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>✓ TO-BE architecture</li>
            <li>✓ RFP documentation</li>
            <li>✓ Proposal ready</li>
          </ul>
        </button>
      </div>
    </div>
  );
}

// 3. Update DiagramWizard.tsx
export function DiagramWizard() {
  const { data, updateData, currentStep, setStep } = useArchitectureStore();
  const [showModeSelector, setShowModeSelector] = useState(!data.metadata?.mode);

  if (showModeSelector) {
    return (
      <ModeSelector
        onSelect={(mode) => {
          updateData({
            metadata: { mode, timestamp: new Date().toISOString() }
          });
          setShowModeSelector(false);
        }}
      />
    );
  }

  // ... rest of wizard
}

// 4. Update form labels based on mode
const labels = data.metadata?.mode === 'as-is'
  ? { users: 'Current Users', modules: 'Installed Modules' }
  : { users: 'Planned Users', modules: 'Proposed Modules' };
```

**Why it matters:**
- Users know exactly what to enter
- Different templates for each mode
- Export uses correct terminology
- Foundation for all other improvements

---

### 1.2 Fix Useless Preview ⭐ **USER-FACING**

**Current:** Shows "Source_0" → "Target_0" with "N/A | N/A | N/A"

**Implementation:**

```typescript
// Update DiagramPreview.tsx
export function DiagramPreview({ currentStep }: { currentStep: number }) {
  const { data } = useArchitectureStore();

  // Step 2: Integration Preview
  if (currentStep === 2) {
    const validInterfaces = (data.interfaces || []).filter(
      i => i.source && i.target && i.name
    );

    if (validInterfaces.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 min-h-[600px] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6 opacity-20">🔄</div>
            <h3 className="text-xl font-medium text-gray-700 mb-3">
              Your integration diagram will appear here
            </h3>
            <p className="text-gray-500">
              Add your first interface to see it visualized in real-time
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Integration Architecture</h3>
          <Button icon={<DownloadOutlined />}>Export</Button>
        </div>

        <svg width="100%" height="600" className="border rounded">
          {validInterfaces.map((iface, idx) => (
            <g key={iface.id} transform={`translate(50, ${100 + idx * 120})`}>
              {/* Source System */}
              <rect
                x="0"
                y="0"
                width="180"
                height="80"
                fill="#FEF3C7"
                stroke="#F59E0B"
                strokeWidth="2"
                rx="8"
              />
              <text x="90" y="35" textAnchor="middle" className="text-sm font-medium">
                {iface.source}
              </text>
              <text x="90" y="55" textAnchor="middle" className="text-xs fill-gray-500">
                Source
              </text>

              {/* Arrow with label */}
              <line
                x1="190"
                y1="40"
                x2="410"
                y2="40"
                stroke="#6B7280"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              <text x="300" y="30" textAnchor="middle" className="text-xs font-medium">
                {iface.name}
              </text>
              <text x="300" y="60" textAnchor="middle" className="text-xs fill-gray-500">
                {iface.method || 'Not specified'} • {iface.frequency || 'N/A'}
              </text>

              {/* Target System */}
              <rect
                x="420"
                y="0"
                width="180"
                height="80"
                fill="#DBEAFE"
                stroke="#3B82F6"
                strokeWidth="2"
                rx="8"
              />
              <text x="510" y="35" textAnchor="middle" className="text-sm font-medium">
                {iface.target}
              </text>
              <text x="510" y="55" textAnchor="middle" className="text-xs fill-gray-500">
                Target
              </text>
            </g>
          ))}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#6B7280" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  }

  // Similar improvements for other steps...
}
```

**Why it matters:**
- Preview becomes valuable immediately
- Users see their work visualized
- Encourages completion
- Professional output

---

### 1.3 Progressive Disclosure (Integration Form)

**Current:** 8 fields at once = overwhelming

**Implementation:**

```typescript
// Update IntegrationArchitectureForm.tsx
import { useState } from 'react';
import { Select, Radio, InputNumber } from 'antd';

const INTEGRATION_METHODS = [
  { value: 'rest-api', label: 'REST API', description: 'Modern, real-time HTTP APIs' },
  { value: 'soap', label: 'SOAP Web Service', description: 'Enterprise web services' },
  { value: 'idoc', label: 'IDoc', description: 'SAP standard intermediate document' },
  { value: 'rfc', label: 'RFC', description: 'Remote function call (legacy)' },
  { value: 'file', label: 'File Transfer', description: 'FTP/SFTP batch files' },
  { value: 'odata', label: 'OData', description: 'SAP Fiori/UI5 standard' },
  { value: 'custom', label: 'Custom', description: 'Other integration method' },
];

const FREQUENCIES = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'on-demand', label: 'On-demand' },
];

export function IntegrationArchitectureForm() {
  const { data, updateData } = useArchitectureStore();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const interfaces = data.interfaces || [];

  return (
    <div className="space-y-6">
      {/* ... header ... */}

      {interfaces.map((iface) => {
        const isExpanded = expandedCards.has(iface.id);

        return (
          <Card key={iface.id} size="small" className="border-2 border-orange-200">
            {/* Essential Fields - Always Visible */}
            <div className="space-y-4">
              <Input
                size="large"
                placeholder="e.g., Weighbridge Integration, Payment Gateway"
                value={iface.name}
                onChange={(e) => handleUpdateInterface(iface.id, { name: e.target.value })}
                className="font-medium"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Source System (e.g., Weighbridge)"
                  value={iface.source}
                  onChange={(e) => handleUpdateInterface(iface.id, { source: e.target.value })}
                />
                <Input
                  placeholder="Target System (e.g., SAP MM)"
                  value={iface.target}
                  onChange={(e) => handleUpdateInterface(iface.id, { target: e.target.value })}
                />
              </div>

              {/* Toggle Details */}
              {!isExpanded ? (
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => setExpandedCards(prev => new Set([...prev, iface.id]))}
                  className="px-0"
                >
                  Add technical details (method, frequency, volume)
                </Button>
              ) : (
                <>
                  {/* Expanded Details */}
                  <div className="pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Smart Select for Method */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Integration Method
                          <Tooltip title="How will systems communicate?">
                            <InfoCircleOutlined className="ml-2 text-gray-400" />
                          </Tooltip>
                        </label>
                        <Select
                          placeholder="Select method"
                          value={iface.method}
                          onChange={(value) => handleUpdateInterface(iface.id, { method: value })}
                          options={INTEGRATION_METHODS}
                          optionRender={(option) => (
                            <div>
                              <div className="font-medium">{option.data.label}</div>
                              <div className="text-xs text-gray-500">{option.data.description}</div>
                            </div>
                          )}
                        />
                      </div>

                      {/* Radio Group for Frequency */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Frequency</label>
                        <Radio.Group
                          value={iface.frequency}
                          onChange={(e) => handleUpdateInterface(iface.id, { frequency: e.target.value })}
                          options={FREQUENCIES}
                          optionType="button"
                          buttonStyle="solid"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Segmented Control for Direction */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Direction</label>
                        <Segmented
                          value={iface.direction}
                          onChange={(value) => handleUpdateInterface(iface.id, { direction: value as string })}
                          options={[
                            { label: '→ Inbound', value: 'inbound' },
                            { label: '← Outbound', value: 'outbound' },
                            { label: '↔ Both', value: 'bidirectional' },
                          ]}
                          block
                        />
                      </div>

                      {/* Number Input for Volume */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Volume</label>
                        <InputNumber
                          placeholder="e.g., 500"
                          value={iface.volume}
                          onChange={(value) => handleUpdateInterface(iface.id, { volume: value?.toString() })}
                          addonAfter={
                            <Select defaultValue="day" style={{ width: 80 }}>
                              <Select.Option value="hour">/hour</Select.Option>
                              <Select.Option value="day">/day</Select.Option>
                              <Select.Option value="month">/month</Select.Option>
                            </Select>
                          }
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    <Input
                      placeholder="Data Type (e.g., Goods Receipt, Payment Transaction)"
                      value={iface.dataType}
                      onChange={(e) => handleUpdateInterface(iface.id, { dataType: e.target.value })}
                    />
                  </div>

                  <Button
                    type="link"
                    icon={<MinusOutlined />}
                    onClick={() => {
                      const newSet = new Set(expandedCards);
                      newSet.delete(iface.id);
                      setExpandedCards(newSet);
                    }}
                    className="px-0"
                  >
                    Hide details
                  </Button>
                </>
              )}
            </div>

            {/* Delete button */}
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveInterface(iface.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

**Why it matters:**
- 3 fields → 60% faster initial entry
- Users add details only when needed
- Less cognitive load
- Professional workflow

---

## Phase 2: Templates & Automation (Week 2) - P1

### 2.1 SAP Module Templates

**Create: `src/app/architecture/data/templates.ts`**

```typescript
export const SAP_MODULE_TEMPLATES = {
  'fi-co-standard': {
    name: 'Finance & Controlling (Standard)',
    description: 'Core financial modules for most SAP implementations',
    area: 'Finance & Controlling',
    modules: [
      { code: 'FI', name: 'Financial Accounting', scope: 'GL, AP, AR, Bank Accounting' },
      { code: 'CO', name: 'Controlling', scope: 'Cost Center, Profit Center, Internal Orders' },
      { code: 'TR', name: 'Treasury', scope: 'Cash Management, Funds Management' },
      { code: 'AA', name: 'Asset Accounting', scope: 'Fixed Assets, Depreciation' },
    ],
  },

  'fi-co-extended': {
    name: 'Finance & Controlling (Extended)',
    description: 'Full financial suite with advanced features',
    area: 'Finance & Controlling',
    modules: [
      { code: 'FI', name: 'Financial Accounting', scope: 'GL, AP, AR, Bank Accounting' },
      { code: 'CO', name: 'Controlling', scope: 'Cost Center, Profit Center, Product Costing' },
      { code: 'TR', name: 'Treasury', scope: 'Cash, Liquidity, Risk Management' },
      { code: 'AA', name: 'Asset Accounting', scope: 'Fixed Assets, Leasing' },
      { code: 'PS', name: 'Project Systems', scope: 'Project Planning, Budget Control' },
      { code: 'IM', name: 'Investment Management', scope: 'Capital Investment, Appropriation' },
    ],
  },

  'sd-mm': {
    name: 'Sales & Materials Management',
    description: 'Supply chain core modules',
    area: 'Supply Chain',
    modules: [
      { code: 'SD', name: 'Sales & Distribution', scope: 'Sales Orders, Pricing, Shipping, Billing' },
      { code: 'MM', name: 'Materials Management', scope: 'Procurement, Inventory, Warehouse' },
      { code: 'LE', name: 'Logistics Execution', scope: 'WM, Transportation, Handling Units' },
    ],
  },

  'manufacturing': {
    name: 'Manufacturing Core',
    description: 'Production planning and execution',
    area: 'Manufacturing',
    modules: [
      { code: 'PP', name: 'Production Planning', scope: 'MRP, Production Orders, Capacity Planning' },
      { code: 'QM', name: 'Quality Management', scope: 'Quality Planning, Inspection, Certificates' },
      { code: 'PM', name: 'Plant Maintenance', scope: 'Maintenance Orders, Preventive Maintenance' },
    ],
  },

  'retail': {
    name: 'Retail Management',
    description: 'Retail-specific modules',
    area: 'Retail',
    modules: [
      { code: 'IS-R', name: 'Retail', scope: 'Merchandise, Assortment, POS Integration' },
      { code: 'SD', name: 'Sales & Distribution', scope: 'Sales, Returns, Customer Service' },
      { code: 'MM', name: 'Materials Management', scope: 'Store Inventory, Replenishment' },
    ],
  },
};

export const INTEGRATION_TEMPLATES = {
  'payment-gateway': {
    name: 'Payment Gateway Integration',
    source: 'Payment Gateway',
    target: 'SAP FI',
    method: 'rest-api',
    frequency: 'realtime',
    direction: 'bidirectional',
    dataType: 'Payment Transaction',
    volume: '10000',
    volumeUnit: 'day',
  },

  'weighbridge': {
    name: 'Weighbridge Interface',
    source: 'Weighbridge System',
    target: 'SAP MM',
    method: 'file',
    frequency: 'realtime',
    direction: 'inbound',
    dataType: 'Goods Receipt',
    volume: '500',
    volumeUnit: 'day',
  },

  'erp-to-erp': {
    name: 'ERP to ERP Integration',
    source: 'Legacy ERP',
    target: 'SAP S/4HANA',
    method: 'idoc',
    frequency: 'hourly',
    direction: 'bidirectional',
    dataType: 'Master Data, Transactions',
    volume: '5000',
    volumeUnit: 'hour',
  },

  'pos-integration': {
    name: 'Point of Sale Integration',
    source: 'POS System',
    target: 'SAP Retail',
    method: 'rest-api',
    frequency: 'realtime',
    direction: 'bidirectional',
    dataType: 'Sales Transactions, Inventory',
    volume: '50000',
    volumeUnit: 'day',
  },
};
```

**Update: `ModuleArchitectureForm.tsx`**

```typescript
import { SAP_MODULE_TEMPLATES } from '../../data/templates';

export function ModuleArchitectureForm() {
  // ... existing code ...

  const [showTemplates, setShowTemplates] = useState(false);

  const handleApplyTemplate = (templateKey: string) => {
    const template = SAP_MODULE_TEMPLATES[templateKey];
    const newArea: ModuleArea = {
      id: crypto.randomUUID(),
      area: template.area,
      modules: template.modules.map(m => ({ ...m, id: crypto.randomUUID() })),
    };
    updateData({ moduleAreas: [...moduleAreas, newArea] });
    setShowTemplates(false);
  };

  return (
    <div className="space-y-6">
      <Card
        title="Functional Areas & Modules"
        extra={
          <Space>
            <Button
              type="dashed"
              icon={<ThunderboltOutlined />}
              onClick={() => setShowTemplates(!showTemplates)}
            >
              Quick Add Templates
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddModuleArea}>
              Add Custom Area
            </Button>
          </Space>
        }
      >
        {showTemplates && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-3">📦 Quick Add Module Sets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(SAP_MODULE_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleApplyTemplate(key)}
                  className="text-left p-3 bg-white rounded border-2 border-gray-200
                           hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                  <div className="text-sm text-gray-500 mb-2">{template.description}</div>
                  <div className="text-xs text-blue-600">
                    {template.modules.length} modules: {template.modules.map(m => m.code).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rest of existing form... */}
      </Card>
    </div>
  );
}
```

**Why it matters:**
- Add 7 modules in 1 click instead of manual entry
- Reduces errors (pre-validated data)
- Professional, standardized output
- 80% time savings for common setups

---

### 2.2 Bulk Import from Spreadsheet

```typescript
// Add to IntegrationArchitectureForm.tsx
import { parseSpreadsheet } from '../../utils/spreadsheetParser';

const handlePasteFromExcel = async () => {
  try {
    const text = await navigator.clipboard.readText();
    const rows = text.split('\n').map(row => row.split('\t'));

    // Expected format: Name | Source | Target | Method | Frequency | DataType | Volume | Direction
    const newInterfaces = rows.slice(1).map(row => ({
      id: crypto.randomUUID(),
      name: row[0] || '',
      source: row[1] || '',
      target: row[2] || '',
      method: row[3] || '',
      frequency: row[4] || '',
      dataType: row[5] || '',
      volume: row[6] || '',
      direction: row[7] || '',
    }));

    updateData({ interfaces: [...interfaces, ...newInterfaces] });
  } catch (err) {
    message.error('Failed to parse clipboard data');
  }
};

// Add button in UI
<Button
  icon={<TableOutlined />}
  onClick={handlePasteFromExcel}
>
  Paste from Excel
</Button>
```

---

## Phase 3: Polish & Intelligence (Week 3) - P2

### 3.1 Smart Autocomplete

```typescript
// Create: src/app/architecture/hooks/useSmartAutocomplete.ts
export function useSmartAutocomplete() {
  const { data } = useArchitectureStore();

  const getSystemSuggestions = useCallback((type: 'source' | 'target') => {
    // Extract all previously entered systems
    const systems = new Set<string>();

    data.interfaces?.forEach(i => {
      if (i.source) systems.add(i.source);
      if (i.target) systems.add(i.target);
    });

    data.externalSystems?.forEach(s => {
      if (s.name) systems.add(s.name);
    });

    // Add common SAP modules
    const sapModules = ['SAP FI', 'SAP CO', 'SAP MM', 'SAP SD', 'SAP PP', 'SAP PM', 'SAP QM'];
    sapModules.forEach(m => systems.add(m));

    return Array.from(systems).sort();
  }, [data]);

  return { getSystemSuggestions };
}

// Use in form:
const { getSystemSuggestions } = useSmartAutocomplete();

<AutoComplete
  options={getSystemSuggestions('source').map(s => ({ value: s }))}
  placeholder="Source System"
  value={iface.source}
  onChange={(value) => handleUpdateInterface(iface.id, { source: value })}
  filterOption={(inputValue, option) =>
    option!.value.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
  }
/>
```

---

### 3.2 Contextual Help

```typescript
// Create: src/app/architecture/components/FieldHelp.tsx
export function FieldHelp({ field }: { field: string }) {
  const helpContent = {
    'integration-method': {
      title: 'Integration Method',
      description: 'Defines how systems communicate and exchange data.',
      examples: {
        'REST API': 'Modern, real-time HTTP-based integration',
        'IDoc': 'SAP standard intermediate document format',
        'RFC': 'Remote Function Call for synchronous SAP integration',
        'File Transfer': 'Batch file exchange via FTP/SFTP',
      },
      bestPractice: 'Use REST API for new integrations, IDoc for SAP-to-SAP.',
    },
    'frequency': {
      title: 'Integration Frequency',
      description: 'How often data is synchronized between systems.',
      examples: {
        'Real-time': 'Immediate sync (< 1 second)',
        'Hourly': 'Batch processing every hour',
        'Daily': 'End-of-day reconciliation',
      },
      bestPractice: 'Real-time for critical transactions, batch for reporting.',
    },
  };

  const content = helpContent[field];
  if (!content) return null;

  return (
    <Popover
      content={
        <div className="max-w-md">
          <h4 className="font-semibold mb-2">{content.title}</h4>
          <p className="text-sm text-gray-600 mb-3">{content.description}</p>

          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-2">Common Options:</div>
            {Object.entries(content.examples).map(([key, desc]) => (
              <div key={key} className="text-sm mb-1">
                <span className="font-medium">{key}:</span>{' '}
                <span className="text-gray-600">{desc}</span>
              </div>
            ))}
          </div>

          <div className="text-xs bg-blue-50 p-2 rounded">
            <span className="font-medium">💡 Best Practice:</span>{' '}
            {content.bestPractice}
          </div>
        </div>
      }
      trigger="click"
    >
      <InfoCircleOutlined className="ml-2 text-gray-400 cursor-help hover:text-blue-500" />
    </Popover>
  );
}
```

---

## Summary: Before & After

### Current Experience (Screenshot Analysis)
1. **Integration Form (Screenshot 1):**
   - 8 text fields
   - Generic placeholders
   - No smart inputs
   - Preview shows "Source_0" → useless
   - Time: ~5 min per interface
   - User feeling: "This is tedious"

2. **Module Form (Screenshot 2):**
   - 7 similar cards manually added
   - Repeated "e.g., FI, MM" hints
   - No bulk operations
   - Time: ~10 min for Finance & Controlling
   - User feeling: "Why can't I just select standard FI-CO?"

### After Implementation
1. **Integration Form:**
   - 3 essential fields first
   - Click to reveal 5 more
   - Dropdowns, radios, autocomplete
   - Preview shows actual diagram immediately
   - Templates for common patterns
   - Time: ~2 min per interface (60% faster)
   - User feeling: "This is actually helpful"

2. **Module Form:**
   - "📦 Add Standard FI-CO" button
   - 7 modules in 1 click
   - Bulk paste from Excel
   - Smart autocomplete
   - Time: ~2 min for Finance & Controlling (80% faster)
   - User feeling: "Wow, that was fast"

---

## Success Metrics

### Quantitative
- **Time to complete**: 45 min → 15 min (66% reduction)
- **User satisfaction**: 3/5 → 5/5
- **Error rate**: 30% → <5%
- **Template usage**: 0% → 80%

### Qualitative (Jobs Standard)
- **"It just works"** - No documentation needed
- **"Fast"** - Keyboard shortcuts, smart defaults
- **"Beautiful"** - Preview is valuable
- **"Smart"** - Learns from user, suggests options
- **"Professional"** - Output rivals consultant decks

---

## Implementation Order

**Week 1: Critical Fixes (P0)**
1. AS-IS vs TO-BE mode selector (Day 1-2)
2. Fix preview to show real data (Day 2-3)
3. Progressive disclosure (integration form) (Day 4-5)

**Week 2: Templates (P1)**
4. SAP module templates (Day 1-2)
5. Integration templates (Day 2-3)
6. Bulk paste from Excel (Day 4-5)

**Week 3: Intelligence (P2)**
7. Smart autocomplete (Day 1-2)
8. Contextual help tooltips (Day 2-3)
9. Keyboard shortcuts (Day 4-5)

---

## The Jobs Question

> "If you were an architect documenting a SAP implementation, would you want to use this tool?"

**Before:** "I have to use it" (required by company)
**After:** "I want to use it" (faster than PowerPoint, better output, actually helpful)

That's the bar.
