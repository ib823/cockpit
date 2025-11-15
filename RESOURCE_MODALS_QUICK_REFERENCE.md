# Resource Planning Modals - Quick Reference Card

## At a Glance

| Modal | File | Size | Key Feature | Lines Saved |
|-------|------|------|-------------|-------------|
| ResourcePlanningModal | `gantt-tool/ResourcePlanningModal.tsx` | xlarge | 3 tabs (roles/structure/costs) | ~60 |
| ResourcePlanningModalV2 | `gantt-tool/ResourcePlanningModalV2.tsx` | xlarge | Drag-drop team builder | ~65 |
| PhaseTaskResourceAllocationModal | `gantt-tool/PhaseTaskResourceAllocationModal.tsx` | xlarge | Allocation sliders | ~70 |
| ResourceManagerModal | `timeline/ResourceManagerModal.tsx` | xlarge | Strategic metrics | ~80 |

**Total Code Reduction:** ~275 lines

---

## Quick Usage

### ResourcePlanningModal
```tsx
import { ResourcePlanningModal } from "@/components/gantt-tool/ResourcePlanningModal";

<ResourcePlanningModal onClose={() => setOpen(false)} />
```

**What it does:**
- Define role templates with rates
- Create placeholder resources
- Calculate team costs
- 3 tabs: Roles | Structure | Costs

---

### ResourcePlanningModalV2
```tsx
import { ResourcePlanningModalV2 } from "@/components/gantt-tool/ResourcePlanningModalV2";

<ResourcePlanningModalV2 onClose={() => setOpen(false)} />
```

**What it does:**
- Drag roles from library
- Drop onto client departments
- Build aligned team structure
- Real-time cost tracking

**Key Interaction:** Drag-and-drop role assignment

---

### PhaseTaskResourceAllocationModal
```tsx
import { PhaseTaskResourceAllocationModal } from "@/components/gantt-tool/PhaseTaskResourceAllocationModal";

<PhaseTaskResourceAllocationModal
  itemId="phase-123"
  itemType="phase"
  onClose={() => setOpen(false)}
/>
```

**What it does:**
- Assign resources to phases or tasks
- Adjust allocation % with sliders
- Add assignment notes
- Validates assignment levels

**Key Interaction:** Horizontal slider for allocation %

---

### ResourceManagerModal
```tsx
import { ResourceManagerModal } from "@/components/timeline/ResourceManagerModal";

<ResourceManagerModal
  phase={currentPhase}
  onClose={() => setOpen(false)}
  onSave={(resources) => updatePhase(resources)}
/>
```

**What it does:**
- Add team members from role profiles
- Set allocation % and region
- View strategic metrics (quality score, cost, critical roles)
- Get smart recommendations

**Key Feature:** Quality scoring algorithm

---

## BaseModal Integration Pattern

All 4 modals follow this pattern:

```tsx
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";

export function MyResourceModal({ onClose }) {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Modal Title"
      subtitle="Context info"
      icon={<IconComponent className="w-5 h-5" />}
      size="xlarge"
      footer={
        <>
          <div style={{ marginRight: "auto" }}>Stats</div>
          <ModalButton onClick={onClose} variant="secondary">Cancel</ModalButton>
          <ModalButton onClick={handleSave} variant="primary">Save</ModalButton>
        </>
      }
    >
      {/* Content */}
    </BaseModal>
  );
}
```

---

## Common Patterns

### Pattern 1: Auto-Margin Footer Layout
```tsx
footer={
  <>
    <div style={{ marginRight: "auto" }}>Left-aligned stats</div>
    <ModalButton>Button 1</ModalButton>
    <ModalButton>Button 2</ModalButton>
  </>
}
```

### Pattern 2: Drag-Drop Handlers
```tsx
<div
  draggable
  onDragStart={(e) => {
    e.dataTransfer.setData("roleId", role.id);
  }}
  onDragOver={(e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "blue";
  }}
  onDrop={(e) => {
    e.preventDefault();
    const roleId = e.dataTransfer.getData("roleId");
    handleDrop(roleId);
  }}
>
  Draggable content
</div>
```

### Pattern 3: Range Slider with Sync Input
```tsx
const [value, setValue] = useState(80);

<input
  type="range"
  min="1"
  max="100"
  value={value}
  onChange={(e) => setValue(Number(e.target.value))}
/>
<input
  type="number"
  value={value}
  onChange={(e) => setValue(Number(e.target.value))}
/>
```

### Pattern 4: Cost Summary Banner
```tsx
<div style={{
  padding: "16px 24px",
  backgroundColor: "var(--color-blue-light)",
  borderRadius: "8px",
  marginBottom: "24px",
}}>
  <div style={{ fontSize: "11px", color: "var(--color-blue)" }}>
    Daily Burn Rate
  </div>
  <div style={{ fontSize: "28px", fontWeight: 700 }}>
    EUR {cost.toLocaleString()}
  </div>
</div>
```

---

## Calculations Reference

### Daily Cost (ResourcePlanningModal)
```typescript
const dailyCost = placeholders.reduce((total, placeholder) => {
  const template = roleTemplates.find(t => t.id === placeholder.roleTemplateId);
  return total + (template?.dailyRate || 0);
}, 0);
```

### Monthly Cost
```typescript
const monthlyCost = dailyCost * 20; // 20 working days
```

### Phase Cost (ResourceManagerModal)
```typescript
const phaseCost = resources.reduce((sum, resource) => {
  const hours = workingDays * 8 * (resource.allocation / 100);
  return sum + (hours * resource.hourlyRate);
}, 0);
```

### Quality Score
```typescript
const qualityScore =
  (hasArchitect && hasLead ? 100 : 70) +
  (criticalRoles * 10) -
  (isOverAllocated ? 20 : 0);
```

---

## Store Integration

### Phase/Task Resource Assignment
```typescript
// From PhaseTaskResourceAllocationModal
const {
  assignResourceToPhase,
  assignResourceToTask,
  updatePhaseResourceAssignment,
  updateTaskResourceAssignment
} = useGanttToolStoreV2();

// Assign to phase
assignResourceToPhase(phaseId, resourceId, notes, percentage);

// Assign to task
assignResourceToTask(taskId, phaseId, resourceId, notes, percentage);
```

### Resource Management
```typescript
// From ResourceManagerModal
const handleSave = () => {
  onSave(resources); // Callback with updated resources
  onClose();
};
```

---

## Troubleshooting

### Issue: Modal doesn't open
**Check:**
- `isOpen={true}` prop is set
- Component is imported correctly
- Parent component renders modal conditionally

### Issue: Drag-drop not working
**Check:**
- `draggable` attribute on source element
- `onDragStart` sets data with `e.dataTransfer.setData()`
- `onDragOver` calls `e.preventDefault()`
- `onDrop` calls `e.preventDefault()` and reads data

### Issue: Slider not updating
**Check:**
- State variable connected to `value` prop
- `onChange` handler updates state
- Number input (if present) uses same state variable

### Issue: Footer layout broken
**Check:**
- Use `marginRight: "auto"` or `marginLeft: "auto"` for spacing
- Wrap buttons in `<div style={{ display: "flex", gap: "12px" }}>`
- Don't use position: absolute

### Issue: Metrics not calculating
**Check:**
- useMemo dependencies include all relevant state
- Calculations use correct formula
- Data types (numbers vs strings)
- Handle divide-by-zero

---

## Performance Tips

1. **Use useMemo for expensive calculations**
   ```typescript
   const metrics = useMemo(() => {
     // Expensive calculations
     return { totalCost, quality, ... };
   }, [resources, phase]);
   ```

2. **Debounce rapid updates**
   ```typescript
   const debouncedUpdate = useMemo(
     () => debounce((value) => updateStore(value), 300),
     []
   );
   ```

3. **Optimize list rendering**
   ```typescript
   {resources.map((r) => (
     <ResourceCard key={r.id} resource={r} />
   ))}
   ```

4. **Avoid inline object creation in render**
   ```typescript
   // Bad
   style={{ color: "red", fontSize: "14px" }}

   // Good
   const cardStyle = { color: "red", fontSize: "14px" };
   style={cardStyle}
   ```

---

## Accessibility Checklist

- [ ] Modal has proper heading hierarchy (h2, h3)
- [ ] Close button has aria-label
- [ ] Form inputs have labels
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus visible on interactive elements
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Screen reader announces modal opening
- [ ] Drag-drop has keyboard alternative (if needed)

---

## File Locations

```
src/
├── components/
│   ├── gantt-tool/
│   │   ├── ResourcePlanningModal.tsx
│   │   ├── ResourcePlanningModalV2.tsx
│   │   └── PhaseTaskResourceAllocationModal.tsx
│   ├── timeline/
│   │   └── ResourceManagerModal.tsx
│   └── ui/
│       └── BaseModal.tsx
```

---

## Related Components

- **BaseModal**: Foundation for all modals
- **ModalButton**: Consistent button styling
- **GanttToolStoreV2**: State management for resources
- **Resource Types**: Defined in `types/gantt-tool.ts`

---

## Further Reading

- [BaseModal Documentation](./src/components/ui/BaseModal.tsx)
- [Apple HIG - Modals](https://developer.apple.com/design/human-interface-guidelines/modals)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Resource Planning Summary](./RESOURCE_PLANNING_MODALS_REFACTOR_SUMMARY.md)
- [Before/After Comparison](./RESOURCE_MODALS_BEFORE_AFTER.md)
- [Test Plan](./RESOURCE_MODALS_TEST_PLAN.md)

---

## Quick Commands

```bash
# Type check all modals
npx tsc --noEmit

# Find modal usage
grep -r "ResourcePlanningModal" src/

# Check imports
grep -n "import.*BaseModal" src/components/gantt-tool/*.tsx

# Run tests (when available)
npm test -- ResourceModal
```

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0
**Status:** Production Ready ✅
