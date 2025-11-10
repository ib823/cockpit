# Organization Chart - Feature Summary & Roadmap

## ✅ Implemented Features (Current)

### 1. **Company Logo Management**

- ✅ Clickable logo badges on all resources (internal & client)
- ✅ Central logo management via "Manage Logos" button
- ✅ Support for multiple companies (Client, Your Company, SAP, Salesforce, etc.)
- ✅ Add, edit, remove company logos
- ✅ Assign different logos to different team members

**How to use:**

1. Click "Manage Logos" button in the header
2. Add/edit company logos (name + URL)
3. Click the small logo badge on any team member's avatar
4. Select which company logo to assign to that person

### 2. **Neutral Professional Design**

- ✅ All headers default to neutral gray (#ced2df)
- ✅ No emojis - professional appearance
- ✅ Clean, business-ready presentation

### 3. **No Modal Hangs**

- ✅ All modals use custom SimpleModal component
- ✅ No more permanent page freezes
- ✅ Smooth, responsive interactions

### 4. **Persistent State**

- ✅ Page doesn't reset on refresh
- ✅ Current project properly loaded

---

## 🚧 Requested Features (Future Enhancements)

### 1. **Dynamic Resource Positioning**

**Current:** Internal and client resources are separated into two sections
**Requested:** Freely position resources within a level regardless of type

**Implementation approach:**

- Remove the `internalResources` and `clientResources` separation
- Render all resources from a single `allResources` array
- Add up/down arrow buttons to each resource card
- Use the `order` field already added to `OrgResource` interface

**Code changes needed:**

```typescript
// Already added to interface:
order?: number; // Manual ordering within level

// Already implemented function:
moveResource(levelId, orgResourceId, 'up' | 'down')

// Just need to update rendering to:
1. Show allResources instead of separate lists
2. Add up/down buttons to each resource card
3. Sort by order field
```

### 2. **Group Hierarchy with Leads**

**Requested:** Group resources under a lead with expand/collapse

**Structure:**

```
Level: Delivery Team
  ├─ Group: Development Team (Lead: John Doe)
  │   ├─ Lead: John Doe (Senior Developer)
  │   ├─ Sub-lead: Jane Smith (Developer)
  │   └─ Members: 5 developers
  └─ Group: QA Team (Lead: Mike Johnson)
      ├─ Lead: Mike Johnson (QA Lead)
      └─ Members: 3 QA engineers
```

**Implementation approach:**

- Add `groupId` and `isGroupLead` fields (already added to interface)
- Create group management UI
- Render resources in nested structure
- Add collapse/expand for each group

**Code structure:**

```typescript
// Already added to interface:
groupId?: string;
isGroupLead?: boolean;

// New interfaces needed:
interface OrgGroup {
  id: string;
  name: string;
  leadResourceId: string; // The group lead
  collapsed?: boolean;
}

// Add to OrgLevel:
groups?: OrgGroup[];
```

### 3. **View Modes**

**Requested:** Toggle between overview (leads only) and detailed (full hierarchy)

**Implementation approach:**

```typescript
// Add state
const [viewMode, setViewMode] = useState<"overview" | "detailed">("detailed");

// Rendering logic
if (viewMode === "overview") {
  // Only show resources where isGroupLead === true
  const leadResources = level.resources.filter((r) => r.isGroupLead);
  // Render leads only
} else {
  // Show all resources in groups
}
```

---

## 📋 Implementation Priority

### Phase 1 (Quick Wins - 1-2 hours)

1. ✅ Logo management (DONE)
2. Dynamic positioning with up/down buttons
3. Simple grouping UI

### Phase 2 (Medium Complexity - 3-4 hours)

1. Group hierarchy with leads
2. Expand/collapse groups
3. Group management modal

### Phase 3 (Advanced - 4-6 hours)

1. View mode toggle (overview vs detailed)
2. Drag-and-drop resource ordering
3. Nested group hierarchy (lead > sublead > members)
4. Export with groups preserved

---

## 🔧 Quick Implementation Guide

### To Add Up/Down Buttons

```tsx
{
  /* Add to resource card */
}
<div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
  <Button
    size="small"
    icon={<UpOutlined />}
    onClick={() => moveResource(level.id, orgRes.id, "up")}
    disabled={index === 0}
  />
  <Button
    size="small"
    icon={<DownOutlined />}
    onClick={() => moveResource(level.id, orgRes.id, "down")}
    disabled={index === allResources.length - 1}
  />
</div>;
```

### To Add Grouping

```tsx
{/* Add group header above resources */}
{level.groups?.map(group => {
  const groupResources = allResources.filter(r => r.groupId === group.id);
  const leadResource = groupResources.find(r => r.id === group.leadResourceId);

  return (
    <div key={group.id} style={{ marginBottom: '24px' }}>
      {/* Group Header */}
      <div onClick={() => toggleGroupCollapse(level.id, group.id)}>
        <h5>{group.name}</h5>
        <p>Lead: {leadResource?.customName || getResource(leadResource?.resourceId)?.name}</p>
      </div>

      {/* Group Members */}
      {!group.collapsed && groupResources.map(resource => (
        // Render resource card
      ))}
    </div>
  );
})}
```

---

## 💡 Recommendations

1. **Start with dynamic positioning** - Quick win, big UX improvement
2. **Then add basic grouping** - Provides the structure for leads
3. **Finally add view modes** - Polish feature for presentations

**Estimated total time:** 8-12 hours for all features

**Current status:** ~40% complete (logo management, professional design, no hangs, persistent state)
