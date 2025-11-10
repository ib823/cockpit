# Ant Design Modal Migration Guide

## Problem

Ant Design Modal components cause permanent page hangs due to complex focus trap and lifecycle management that blocks the main thread.

## Solution

Replace all Ant Design `Modal` components with `SimpleModal` - a lightweight alternative with the same API but no blocking behavior.

## Files Requiring Migration (22 files)

### High Priority (User-Facing Pages)

1. `src/components/gantt-tool/MissionControlModal.tsx`
2. `src/components/gantt-tool/ExportConfigModal.tsx`
3. `src/components/gantt-tool/TemplateLibraryModal.tsx`
4. `src/components/gantt-tool/BudgetManagementModal.tsx`
5. `src/components/gantt-tool/ProposalGenerationModal.tsx`
6. `src/components/gantt-tool/DuplicateCleanupModal.tsx`
7. `src/components/timeline/OptimizationModal.tsx`
8. `src/components/shared/CommandPalette.tsx`
9. `src/components/shared/KeyboardShortcutsHelp.tsx`
10. `src/components/organization/OrgStructureImport.tsx`

### Medium Priority (Admin/Configuration)

11. `src/components/admin/UserManagementClient.tsx`
12. `src/components/estimator/L3CatalogModal.tsx`
13. `src/components/dashboard/RateCardManager.tsx`
14. `src/components/estimation/FormPanel.tsx`
15. `src/components/estimation/IntegrationPanel.tsx`

### Low Priority (Utilities/Demos)

16. `src/components/common/LogoutButton.tsx`
17. `src/components/shared/ConfirmDialog.tsx`
18. `src/components/project-v2/modes/ResourcePanelAntD.tsx`
19. `src/app/dashboard-v2-demo/page.tsx`
20. `src/app/dashboard-demo/page.tsx`

### Documentation (No Code Changes)

21. `docs/developer/QUICK_START_GUIDE.md`
22. `docs/prompts/UIprompts.md`

## Migration Steps

### Step 1: Update Import Statement

**Before:**

```tsx
import { Modal } from "antd";
```

**After:**

```tsx
import { SimpleModal } from "@/components/common";
// OR
import { SimpleModal } from "@/components/common/SimpleModal";
```

### Step 2: Replace `<Modal>` with `<SimpleModal>`

**Before:**

```tsx
<Modal
  title="My Modal"
  open={isOpen}
  onCancel={() => setIsOpen(false)}
  onOk={handleOk}
  okText="Confirm"
>
  {children}
</Modal>
```

**After:**

```tsx
<SimpleModal
  title="My Modal"
  open={isOpen}
  onCancel={() => setIsOpen(false)}
  onOk={handleOk}
  okText="Confirm"
>
  {children}
</SimpleModal>
```

### Step 3: Replace `Modal.confirm()` with State-Based Modal

**Before:**

```tsx
Modal.confirm({
  title: "Are you sure?",
  content: "This action cannot be undone.",
  onOk: handleConfirm,
  onCancel: handleCancel,
});
```

**After:**

```tsx
// Add state
const [showConfirm, setShowConfirm] = useState(false);

// Trigger function
const triggerConfirm = () => setShowConfirm(true);

// Render
<SimpleModal
  open={showConfirm}
  title="Are you sure?"
  onOk={() => {
    handleConfirm();
    setShowConfirm(false);
  }}
  onCancel={() => {
    handleCancel?.();
    setShowConfirm(false);
  }}
>
  This action cannot be undone.
</SimpleModal>;
```

### Step 4: Handle Modal.destroyAll()

**Before:**

```tsx
Modal.destroyAll();
```

**After:**

```tsx
// Remove - SimpleModal doesn't need cleanup
// Just set state to false to close modals
setIsOpen(false);
```

## API Compatibility

SimpleModal supports the same props as Ant Design Modal:

| Prop           | Type                | Default  | Description                      |
| -------------- | ------------------- | -------- | -------------------------------- |
| `open`         | `boolean`           | -        | Whether modal is visible         |
| `onCancel`     | `() => void`        | -        | Close handler                    |
| `onOk`         | `() => void`        | -        | OK button handler                |
| `title`        | `ReactNode`         | -        | Modal title                      |
| `children`     | `ReactNode`         | -        | Modal content                    |
| `footer`       | `ReactNode \| null` | auto     | Custom footer (null = no footer) |
| `width`        | `number \| string`  | 520      | Modal width                      |
| `okText`       | `string`            | 'OK'     | OK button text                   |
| `cancelText`   | `string`            | 'Cancel' | Cancel button text               |
| `closable`     | `boolean`           | true     | Show close button                |
| `maskClosable` | `boolean`           | true     | Close on backdrop click          |
| `centered`     | `boolean`           | true     | Vertically center modal          |

## Testing Checklist

After migrating each file:

- [ ] Modal opens correctly
- [ ] Modal closes on Cancel/Close button
- [ ] Modal closes on backdrop click (if maskClosable)
- [ ] OK button triggers correct action
- [ ] No page hang when closing modal
- [ ] No console errors

## Benefits of SimpleModal

✅ **No Hangs** - Eliminates permanent page freeze issue
✅ **Faster** - No complex lifecycle or animations
✅ **Synchronous** - State updates happen immediately
✅ **Simple** - Easy to understand and debug
✅ **Compatible** - Same API as Ant Design Modal

## Already Migrated

✅ `src/app/organization-chart/page.tsx` (all 3 modals)

- Client Resource Modal
- Internal Resource Selection Modal
- Avatar Upload Modal
- Auto-Populate Confirmation

## Need Help?

If you encounter issues during migration:

1. Check the SimpleModal component source: `src/components/common/SimpleModal.tsx`
2. Reference the organization chart page for examples: `src/app/organization-chart/page.tsx`
3. SimpleModal is already exported from `@/components/common`
