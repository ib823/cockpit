# Organization Chart Sub-Groups Feature Guide

## Overview

The organization chart now supports **hierarchical sub-groups** within groups, allowing you to create nested team structures like:

```
Level 3 - Core Delivery Teams
  └── Functional (Group)
      ├── Finance (Sub-Group)
      │   └── Resources assigned to Finance
      ├── Sales (Sub-Group)
      │   └── Resources assigned to Sales
      └── SCM (Sub-Group)
          └── Resources assigned to SCM
```

## Data Structure

```typescript
interface OrgChart {
  levels: OrgLevel[]
}

interface OrgLevel {
  id: string
  name: string
  groups: OrgGroup[]
}

interface OrgGroup {
  id: string
  name: string
  positions: OrgPosition[]        // Resources at group level (no sub-group)
  subGroups?: OrgSubGroup[]       // Optional sub-groups
}

interface OrgSubGroup {
  id: string
  name: string
  positions: OrgPosition[]        // Resources in this sub-group
}

interface OrgPosition {
  id: string
  resourceId?: string             // Reference to project resource
}
```

## Using Sub-Groups via API

### 1. **Add a Sub-Group to a Group**

```typescript
// Function signature
addSubGroup(levelId: string, groupId: string)

// Example: Add "Finance" sub-group to Functional group
// This is called automatically when you use the UI, but you can also
// manipulate the orgChart state directly:

setOrgChart(prev => ({
  levels: prev.levels.map(level =>
    level.id === '3' // Level 3 - Core Delivery Teams
      ? {
          ...level,
          groups: level.groups.map(group =>
            group.id === '3-1' // Functional group
              ? {
                  ...group,
                  subGroups: [
                    ...(group.subGroups || []),
                    {
                      id: 'unique-id',
                      name: 'Finance',
                      positions: [],
                    },
                  ],
                }
              : group
          ),
        }
      : level
  ),
}));
```

### 2. **Update Sub-Group Name**

```typescript
// Function signature
updateSubGroup(levelId: string, groupId: string, subGroupId: string, newName: string)

// Example
updateSubGroup('3', '3-1', '3-1-sg-1', 'Finance Team')
```

### 3. **Delete a Sub-Group**

```typescript
// Function signature
deleteSubGroup(levelId: string, groupId: string, subGroupId: string)

// Example
deleteSubGroup('3', '3-1', '3-1-sg-1')
```

### 4. **Assign Resource to Sub-Group**

```typescript
// Function signature
assignResourceToPosition(
  levelId: string,
  groupId: string,
  resourceId: string,
  subGroupId?: string,  // Specify this to assign to sub-group
  positionId?: string
)

// Example: Assign resource to Finance sub-group
assignResourceToPosition('3', '3-1', 'resource-id-123', '3-1-sg-1')
```

### 5. **Remove Resource from Sub-Group**

```typescript
// Function signature
removePosition(
  levelId: string,
  groupId: string,
  positionId: string,
  subGroupId?: string  // Specify this to remove from sub-group
)

// Example
removePosition('3', '3-1', 'position-id', '3-1-sg-1')
```

## Pre-Configured Example

The default org chart includes an example sub-group structure for the **Functional** group:

```typescript
{
  id: '3-1',
  name: 'Functional',
  positions: [],
  subGroups: [
    {
      id: '3-1-sg-1',
      name: 'Finance',
      positions: [],
    },
    {
      id: '3-1-sg-2',
      name: 'Sales',
      positions: [],
    },
    {
      id: '3-1-sg-3',
      name: 'SCM',
      positions: [],
    },
  ],
}
```

## How It Works

### Visualization

The ReactFlow visualization automatically detects sub-groups and renders them:

1. **Without Sub-Groups**: `Root → Group → Resources` (2 levels)
2. **With Sub-Groups**: `Root → Group → Sub-Groups → Resources` (3 levels)

**Visual Hierarchy:**
- **Group Nodes**: Gray background with group name
- **Sub-Group Nodes**: Indigo/purple background with sub-group name
- **Resource Nodes**: White background with resource details
- **Connections**:
  - Root to Group: Dark gray lines
  - Group to Sub-Group: Indigo lines
  - Sub-Group to Resource: Light gray lines

### Resource Assignment Flow

When assigning resources:

1. If a group has **NO sub-groups**:
   - Resources are assigned directly to `group.positions[]`
   - Modal shows: "Assign to [Group Name]"

2. If a group has **sub-groups**:
   - Resources are assigned to `subGroup.positions[]`
   - Modal shows: "Assign to [Sub-Group Name] under [Group Name]"
   - You specify the `subGroupId` parameter

### Auto-Populate Behavior

The `autoPopulateResources()` function:
- Assigns resources to **groups** (not sub-groups) by default
- Based on resource category mapping
- **After auto-populate**, you can manually move resources to sub-groups

## Adding Sub-Groups Programmatically

### Example 1: Add Technical Sub-Groups

```typescript
// Add "ABAP", "BTP", "Integration" sub-groups to Technical group
setOrgChart(prev => ({
  levels: prev.levels.map(level =>
    level.id === '3'
      ? {
          ...level,
          groups: level.groups.map(group =>
            group.id === '3-2' // Technical group
              ? {
                  ...group,
                  subGroups: [
                    { id: '3-2-sg-1', name: 'ABAP', positions: [] },
                    { id: '3-2-sg-2', name: 'BTP', positions: [] },
                    { id: '3-2-sg-3', name: 'Integration', positions: [] },
                  ],
                }
              : group
          ),
        }
      : level
  ),
}));
```

### Example 2: Create a Custom Level with Sub-Groups

```typescript
const newLevel = {
  id: '5',
  name: 'Level 5 - Regional Teams',
  groups: [
    {
      id: '5-1',
      name: 'Regional Operations',
      positions: [],
      subGroups: [
        { id: '5-1-sg-1', name: 'North America', positions: [] },
        { id: '5-1-sg-2', name: 'Europe', positions: [] },
        { id: '5-1-sg-3', name: 'Asia Pacific', positions: [] },
      ],
    },
  ],
};

setOrgChart(prev => ({
  levels: [...prev.levels, newLevel],
}));
```

## Working with the Resource Assignment Modal

### Filtering by Category

When assigning resources to sub-groups, the modal:
1. Detects the parent group's category mapping
2. Filters available resources by that category
3. Shows only matching resources

Example:
- **Functional group** → Shows only `functional` category resources
- **Technical group** → Shows only `technical` category resources

### Assigning to Sub-Groups

The `selectingResource` state includes `subGroupId`:

```typescript
// When opening modal for sub-group assignment
setSelectingResource({
  levelId: '3',
  groupId: '3-1',
  subGroupId: '3-1-sg-1', // Specify sub-group
});

// Resource assignment then uses this sub-group ID
assignResourceToPosition(
  selectingResource.levelId,
  selectingResource.groupId,
  resource.id,
  selectingResource.subGroupId // Passed to function
);
```

## Testing the Feature

### Step 1: Load the Org Chart Page
Navigate to `/organization-chart` in your application.

### Step 2: Verify Pre-Configured Sub-Groups
You should see the Functional group with 3 sub-groups:
- Finance
- Sales
- SCM

### Step 3: Assign Resources
1. Click "Auto-Populate" to assign all resources to groups
2. Resources with category `functional` will be assigned to the Functional group
3. Manually move them to specific sub-groups:
   - Use `addPosition()` with `subGroupId` parameter
   - Or use the assignment modal with sub-group selection

### Step 4: Visualize
The ReactFlow chart should display:
```
Root (Project)
  └── Functional (Group - Gray)
      ├── Finance (Sub-Group - Indigo)
      │   └── [Resources in Finance]
      ├── Sales (Sub-Group - Indigo)
      │   └── [Resources in Sales]
      └── SCM (Sub-Group - Indigo)
          └── [Resources in SCM]
```

## Migration Notes

### Backward Compatibility

The sub-groups feature is **fully backward compatible**:

1. **Existing data without sub-groups**: Works exactly as before
   - Resources in `group.positions[]` render directly under the group
   - No changes to existing org charts

2. **New data with sub-groups**: Uses the new hierarchy
   - Resources in `subGroup.positions[]` render under sub-groups
   - Existing group-level positions still work

### Database Schema

The `orgChart` field in the database stores the full JSON structure:

```json
{
  "levels": [
    {
      "id": "3",
      "name": "Level 3 - Core Delivery Teams",
      "groups": [
        {
          "id": "3-1",
          "name": "Functional",
          "positions": [],
          "subGroups": [
            {
              "id": "3-1-sg-1",
              "name": "Finance",
              "positions": [
                { "id": "pos-1", "resourceId": "res-123" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## API Endpoints

### Save Org Chart
```http
PATCH /api/gantt-tool/projects/{projectId}
Content-Type: application/json

{
  "orgChart": {
    "levels": [...]
  }
}
```

The entire org chart structure (including sub-groups) is saved atomically.

## Best Practices

1. **Use Sub-Groups for Specialization**
   - Functional → Finance, Sales, SCM
   - Technical → ABAP, BTP, Integration
   - QA → Functional Testing, Performance Testing

2. **Keep Hierarchy Shallow**
   - Maximum recommended: 3-4 levels (Root → Group → Sub-Group → Resource)
   - Avoid deep nesting for better visualization

3. **Consistent Naming**
   - Use clear, descriptive names for sub-groups
   - Avoid abbreviations unless widely understood

4. **Resource Distribution**
   - Distribute resources evenly across sub-groups
   - Avoid having too many resources in a single sub-group (>10)

## Troubleshooting

### Sub-Groups Not Appearing

**Check:**
1. Is `subGroups` array defined and not empty?
2. Do sub-groups have resources assigned?
3. Are resources filtered out by view mode?

### Resources Not Saving to Sub-Groups

**Check:**
1. Is `subGroupId` being passed to `assignResourceToPosition()`?
2. Is auto-save enabled? (Should trigger 2 seconds after change)
3. Check browser console for errors

### Visualization Layout Issues

**Check:**
1. Are there too many resources causing overflow?
2. Try zooming out (ReactFlow controls in bottom-left)
3. Clear browser cache and reload

## Future Enhancements

Potential improvements for the sub-group feature:

1. **Drag-and-drop**: Move resources between sub-groups
2. **Bulk operations**: Move multiple resources at once
3. **Sub-group templates**: Pre-defined sub-group structures
4. **Sub-group metrics**: Workload analysis per sub-group
5. **Deeper nesting**: Support for sub-sub-groups (if needed)

## Summary

The sub-groups feature provides:
- ✅ Hierarchical team structures
- ✅ Flexible resource organization
- ✅ Backward compatibility
- ✅ Automatic visualization
- ✅ Category-based filtering
- ✅ Full CRUD operations

Use it to organize teams by specialization, department, region, or any other logical grouping!
