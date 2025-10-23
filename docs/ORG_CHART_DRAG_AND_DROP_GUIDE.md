# Organization Chart Drag & Drop Guide

## Overview

The organization chart management panel now supports **drag and drop** functionality, allowing you to easily reorganize resources by dragging them between groups and sub-groups.

## How to Access

1. Navigate to `/organization-chart`
2. Click the **"Manage Structure"** button in the header
3. The management panel opens on the left side
4. You'll see a blue banner: "Drag & Drop Enabled"

## How to Use Drag & Drop

### **Visual Cues**

- **Drag Handle Icon** (⋮⋮): Appears on each resource card - click and hold to drag
- **Blue Dashed Border**: Appears on drop zones when you start dragging (shows where you can drop)
- **Green Highlighted Zone**: Appears when you hover over a valid drop target
- **Semi-transparent Card**: The resource being dragged becomes semi-transparent

### **Dragging Resources**

1. **Start Dragging**:
   - Click and hold the drag handle (⋮⋮) on any resource card
   - Or click and hold anywhere on the resource card

2. **While Dragging**:
   - The resource card becomes semi-transparent
   - Valid drop zones highlight with a blue dashed border
   - Invalid drop zones (different levels) remain unchanged

3. **Drop the Resource**:
   - Hover over a valid drop zone (it turns green)
   - Release the mouse button to drop
   - Success message: "Resource moved successfully"

### **Valid Drop Targets**

You can drag resources:

✅ **Within the Same Level**:
- Group → Another Group (same level)
- Sub-Group → Another Sub-Group (same group)
- Group → Sub-Group (same group)
- Sub-Group → Group (same group)

❌ **Restrictions**:
- Cannot drag between different levels (e.g., Level 2 → Level 3)
- Cannot drop on the source location (no-op)

## Example Workflows

### **Example 1: Moving a Resource Between Sub-Groups**

**Scenario**: Move "John Smith" from Finance to Sales sub-group

1. Open the management panel
2. Find "John Smith" in **Level 3 → Functional → Finance**
3. Click and hold the drag handle on "John Smith"
4. Drag to **Sales** sub-group (it highlights green)
5. Release - John is now in Sales!

### **Example 2: Moving from Group to Sub-Group**

**Scenario**: Move "Jane Doe" from Functional (group level) to SCM sub-group

1. Find "Jane Doe" in **Level 3 → Functional** (group level, not in a sub-group)
2. Drag her to the **SCM** sub-group drop zone
3. Release - Jane is now in SCM sub-group!

### **Example 3: Reorganizing Technical Team**

**Scenario**: You created sub-groups for Technical (ABAP, BTP, Integration) and want to organize developers

1. Use Auto-Populate to assign all technical resources to the Technical group
2. Create sub-groups: ABAP Team, BTP Team, Integration Team
3. Drag each developer from the group level to their respective sub-group:
   - ABAP developers → ABAP Team
   - BTP developers → BTP Team
   - Integration developers → Integration Team

## Drop Zone States

### **Empty Drop Zone**
```
┌─────────────────────────────────┐
│ Drop resources here             │ (gray italic text)
└─────────────────────────────────┘
```

### **Drop Zone with Resources**
```
┌─────────────────────────────────┐
│ ⋮⋮ John Smith            [X]    │
│ ⋮⋮ Jane Doe              [X]    │
│ ⋮⋮ Bob Johnson           [X]    │
└─────────────────────────────────┘
```

### **Drop Zone While Dragging (Can Drop)**
```
┌═══════════════════════════════════┐  ← Blue dashed border
║ Drop resources here               ║
└═══════════════════════════════════┘
```

### **Drop Zone While Hovering (Ready to Drop)**
```
┌═══════════════════════════════════┐  ← Green solid border + green bg
║ Drop resources here               ║
└═══════════════════════════════════┘
```

## Technical Details

### **Implementation**

- **Library**: `react-dnd` with HTML5 backend
- **Drag Item Type**: `RESOURCE`
- **State Management**: Updates `orgChart` state on drop
- **Auto-Save**: Triggers 2 seconds after drop
- **Validation**: Enforces same-level constraint

### **Data Structure Changes**

When you drag and drop:

1. Resource is **removed** from source:
   - `group.positions[]` (if source is group)
   - `subGroup.positions[]` (if source is sub-group)

2. Resource is **added** to target:
   - `group.positions[]` (if target is group)
   - `subGroup.positions[]` (if target is sub-group)

3. The `OrgPosition` object (with `id` and `resourceId`) is preserved

### **Performance**

- Deep clone on drop to ensure immutability
- O(n) complexity for move operation
- Minimal re-renders (only affected components)

## Keyboard Accessibility

Currently, drag and drop requires mouse/touch input. For keyboard users:
- Use the **+ icon** buttons to assign resources
- Use the **X icon** buttons to remove resources
- Repeat to "move" resources between locations

## Troubleshooting

### **Resource Not Dragging**

**Issue**: Can't drag a resource card

**Solutions**:
- Ensure you're clicking the drag handle (⋮⋮) or the card itself
- Check that you're in the management panel (not the visualization)
- Refresh the page if the drag handler stopped working

### **Can't Drop in Target Zone**

**Issue**: Drop zone doesn't highlight or accept the drop

**Solutions**:
- Verify source and target are in the **same level**
- Check that you're not trying to drop in the source location
- Ensure the target is a valid drop zone (group or sub-group)

### **Drop Doesn't Persist**

**Issue**: Resource moves back to original location after drop

**Solutions**:
- Wait for auto-save (2 seconds after drop)
- Click "Save" button manually to force save
- Check browser console for errors

### **Visual Feedback Not Showing**

**Issue**: No borders or highlights during drag

**Solutions**:
- Check if CSS classes are loading correctly
- Try zooming browser to 100% (sometimes helps with rendering)
- Clear browser cache and reload

## Best Practices

### **1. Organize Before Assigning**

Create all your sub-groups first, then use Auto-Populate and drag resources into sub-groups. This is faster than assigning one-by-one.

### **2. Use Consistent Naming**

Name sub-groups clearly so you know where to drag resources:
- ✅ "Finance Team", "Sales Team", "SCM Team"
- ❌ "Team 1", "Team 2", "Team 3"

### **3. Group by Specialization**

Organize resources based on their actual work:
- Functional → Finance, Sales, SCM
- Technical → ABAP, BTP, Integration
- QA → Functional Testing, Performance Testing

### **4. Leverage Drop Zone Hints**

Empty drop zones show "Drop resources here" - use these as visual cues for where resources can go.

### **5. Drag Multiple at Once**

While you can only drag one resource at a time, you can:
1. Drag first resource to target
2. Immediately drag next resource (no need to close/reopen)
3. Repeat for batch organization

## Future Enhancements

Potential improvements for the drag and drop feature:

- **Multi-select**: Select and drag multiple resources at once
- **Cross-level dragging**: Move resources between levels with confirmation
- **Undo/Redo**: Quickly undo accidental moves
- **Drag preview**: Show resource name in a tooltip while dragging
- **Keyboard support**: Arrow keys to move resources
- **Drag to reorder**: Change the order of resources within a group

## Tips & Tricks

### **Tip 1: Visual Scanning**

The color coding helps you scan quickly:
- **Gray boxes** = Group-level resources
- **Indigo boxes** = Sub-group resources
- **White boxes** = Individual resources

### **Tip 2: Quick Reorganization**

To quickly reorganize a group:
1. Click "Manage Structure"
2. Drag all resources from group level to appropriate sub-groups
3. Close management panel to see the updated visualization

### **Tip 3: Combining with Filters**

Use view filters (by phase/task) to see which resources are working on what, then organize them accordingly.

### **Tip 4: Export After Organizing**

After organizing your org chart with drag and drop:
1. Close the management panel
2. Click "Export" → PNG or PDF
3. Share the organized chart with stakeholders

## Summary

Drag and drop makes it easy to:
- ✅ Reorganize resources quickly
- ✅ Move resources between groups and sub-groups
- ✅ Visually organize your team structure
- ✅ Experiment with different org structures
- ✅ Save time compared to manual reassignment

**Remember**: You can only drag within the same level, and changes auto-save after 2 seconds!

Happy organizing! 🎯
