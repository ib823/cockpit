// Test script to create sample milestones
// Run this in browser console on /timeline page

console.log('Creating test milestones...');

const store = window.__TIMELINE_STORE__;
if (!store) {
  console.error('Timeline store not found. Make sure you are on the /timeline page.');
} else {
  const { addMilestone } = store.getState();

  // Add sample milestones
  addMilestone({
    name: 'Requirements Sign-off',
    type: 'decision',
    businessDay: 15,
    description: 'Business requirements approval'
  });

  addMilestone({
    name: 'System Design Complete',
    type: 'deliverable', 
    businessDay: 45,
    description: 'Technical architecture finalized'
  });

  addMilestone({
    name: 'Go-Live Date',
    type: 'golive',
    businessDay: 120,
    description: 'Production system launch'
  });

  addMilestone({
    name: 'Post-Implementation Review',
    type: 'review',
    businessDay: 150,
    description: 'Project retrospective and lessons learned'
  });

  console.log('✅ Test milestones created successfully!');
  console.log('Expected markers:');
  console.log('🔺 Red triangle (Decision) at day 15');
  console.log('🔷 Green diamond (Deliverable) at day 45');
  console.log('⭕ Orange circle (Go-Live) at day 120');
  console.log('⬜ Purple square (Review) at day 150');
}
