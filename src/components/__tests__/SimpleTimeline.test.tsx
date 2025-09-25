import { render, screen, fireEvent } from '@testing-library/react';
import SimpleTimeline from '../SimpleTimeline';
import { useTimelineStore } from '@/stores/simple-timeline-store';

// Mock the store
jest.mock('@/stores/simple-timeline-store');

describe('SimpleTimeline', () => {
  it('renders empty state when no phases exist', () => {
    (useTimelineStore as jest.Mock).mockReturnValue({
      phases: [],
      milestones: [],
      generateTimeline: jest.fn(),
    });
    
    render(<SimpleTimeline />);
    expect(screen.getByText('No Timeline Data')).toBeInTheDocument();
  });

  it('renders milestone markers for each type', () => {
    (useTimelineStore as jest.Mock).mockReturnValue({
      phases: [{ id: '1', name: 'Phase 1', startBusinessDay: 0, workingDays: 30, color: '#blue' }],
      milestones: [
        { id: '1', name: 'Test Deliverable', type: 'deliverable', businessDay: 15, status: 'pending' }
      ],
      selectMilestone: jest.fn(),
    });
    
    render(<SimpleTimeline />);
    expect(screen.getByLabelText('Deliverable milestone')).toBeInTheDocument();
  });
});
