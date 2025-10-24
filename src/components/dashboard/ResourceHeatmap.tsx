/**
 * Resource Allocation Heatmap
 *
 * Visual heatmap showing resource allocation by week:
 * - Green (0-5 days): Optimal/Under-utilized
 * - Yellow (6 days): Full but not over
 * - Red (7+ days): Over-allocated (Impossible)
 * - Grey (0 days): Unavailable/Bench
 */

'use client';

import { useMemo } from 'react';
import { Typography, Tooltip } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { GanttProject, Resource } from '@/types/gantt-tool';
import { differenceInDays, addDays, startOfWeek, format, parseISO } from 'date-fns';

const { Text } = Typography;

interface ResourceHeatmapProps {
  project: GanttProject;
}

interface WeekAllocation {
  weekStart: Date;
  weekLabel: string;
  allocatedDays: number;
}

interface ResourceRow {
  resource: Resource;
  weeks: WeekAllocation[];
  totalDays: number;
  overallocatedWeeks: number;
}

export function ResourceHeatmap({ project }: ResourceHeatmapProps) {
  const heatmapData = useMemo(() => {
    const resources = project.resources || [];
    if (resources.length === 0) return { rows: [], weeks: [] };

    // Find project date range
    const projectStart = parseISO(project.startDate);
    let projectEnd = projectStart;

    project.phases.forEach(phase => {
      const phaseEnd = parseISO(phase.endDate);
      if (phaseEnd > projectEnd) projectEnd = phaseEnd;
    });

    // Generate week buckets
    const weeks: Date[] = [];
    let currentWeek = startOfWeek(projectStart, { weekStartsOn: 1 }); // Monday
    const endWeek = startOfWeek(projectEnd, { weekStartsOn: 1 });

    while (currentWeek <= endWeek) {
      weeks.push(currentWeek);
      currentWeek = addDays(currentWeek, 7);
    }

    // Calculate allocation for each resource per week
    const rows: ResourceRow[] = resources.map(resource => {
      const weekAllocations: WeekAllocation[] = weeks.map(weekStart => {
        const weekEnd = addDays(weekStart, 6);
        let allocatedDays = 0;

        // Check phase assignments
        project.phases.forEach(phase => {
          const phaseStart = parseISO(phase.startDate);
          const phaseEnd = parseISO(phase.endDate);

          phase.phaseResourceAssignments?.forEach(assignment => {
            if (assignment.resourceId === resource.id) {
              // Calculate overlap between assignment and this week
              const overlapStart = phaseStart > weekStart ? phaseStart : weekStart;
              const overlapEnd = phaseEnd < weekEnd ? phaseEnd : weekEnd;

              if (overlapStart <= overlapEnd) {
                const overlapDays = Math.min(
                  differenceInDays(overlapEnd, overlapStart) + 1,
                  7
                );
                const allocatedPortion = (overlapDays * assignment.allocationPercentage) / 100;
                allocatedDays += allocatedPortion;
              }
            }
          });

          // Check task assignments
          phase.tasks.forEach(task => {
            const taskStart = parseISO(task.startDate);
            const taskEnd = parseISO(task.endDate);

            task.resourceAssignments?.forEach(assignment => {
              if (assignment.resourceId === resource.id) {
                const overlapStart = taskStart > weekStart ? taskStart : weekStart;
                const overlapEnd = taskEnd < weekEnd ? taskEnd : weekEnd;

                if (overlapStart <= overlapEnd) {
                  const overlapDays = Math.min(
                    differenceInDays(overlapEnd, overlapStart) + 1,
                    7
                  );
                  const allocatedPortion = (overlapDays * assignment.allocationPercentage) / 100;
                  allocatedDays += allocatedPortion;
                }
              }
            });
          });
        });

        return {
          weekStart,
          weekLabel: format(weekStart, 'MMM d'),
          allocatedDays: Math.round(allocatedDays * 10) / 10, // Round to 1 decimal
        };
      });

      const totalDays = weekAllocations.reduce((sum, week) => sum + week.allocatedDays, 0);
      const overallocatedWeeks = weekAllocations.filter(week => week.allocatedDays > 5.5).length;

      return {
        resource,
        weeks: weekAllocations,
        totalDays,
        overallocatedWeeks,
      };
    });

    return { rows, weeks };
  }, [project]);

  const getCellColor = (allocatedDays: number): string => {
    if (allocatedDays === 0) return '#F3F4F6'; // Grey - Unavailable
    if (allocatedDays <= 5) return '#D1FAE5'; // Green - Optimal
    if (allocatedDays <= 6) return '#FEF3C7'; // Yellow - Full
    return '#FEE2E2'; // Red - Over-allocated
  };

  const getCellBorderColor = (allocatedDays: number): string => {
    if (allocatedDays === 0) return '#E5E7EB';
    if (allocatedDays <= 5) return '#10B981';
    if (allocatedDays <= 6) return '#F59E0B';
    return '#EF4444';
  };

  if (heatmapData.rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
        <Text type="secondary">No resources assigned to this project</Text>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Legend */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 20, height: 20, background: '#D1FAE5', border: '2px solid #10B981', borderRadius: 4 }} />
          <Text style={{ fontSize: '13px' }}>0-5 days: Optimal</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 20, height: 20, background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: 4 }} />
          <Text style={{ fontSize: '13px' }}>6 days: Full</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 20, height: 20, background: '#FEE2E2', border: '2px solid #EF4444', borderRadius: 4 }} />
          <Text style={{ fontSize: '13px' }}>7+ days: Over-allocated</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 20, height: 20, background: '#F3F4F6', border: '2px solid #E5E7EB', borderRadius: 4 }} />
          <Text style={{ fontSize: '13px' }}>0 days: Bench</Text>
        </div>
      </div>

      {/* Heatmap Table */}
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px' }}>
        <thead>
          <tr>
            <th style={{
              textAlign: 'left',
              padding: '8px',
              background: '#F9FAFB',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              minWidth: '200px',
            }}>
              Resource
            </th>
            {heatmapData.weeks.map((week, idx) => (
              <th key={idx} style={{
                padding: '8px',
                background: '#F9FAFB',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                textAlign: 'center',
                minWidth: '60px',
              }}>
                {format(week, 'MMM d')}
              </th>
            ))}
            <th style={{
              padding: '8px',
              background: '#F9FAFB',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              textAlign: 'center',
              minWidth: '80px',
            }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {heatmapData.rows.map((row, rowIdx) => (
            <tr key={row.resource.id}>
              <td style={{
                padding: '8px',
                background: '#FFFFFF',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{row.resource.name}</span>
                  {row.overallocatedWeeks > 0 && (
                    <Tooltip title={`Over-allocated in ${row.overallocatedWeeks} week(s)`}>
                      <AlertTriangle size={14} color="#EF4444" />
                    </Tooltip>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280' }}>
                  {row.resource.designation}
                </div>
              </td>
              {row.weeks.map((week, weekIdx) => (
                <td key={weekIdx}>
                  <Tooltip title={`${week.allocatedDays} days allocated`}>
                    <div style={{
                      padding: '8px',
                      background: getCellColor(week.allocatedDays),
                      border: `2px solid ${getCellBorderColor(week.allocatedDays)}`,
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                      color: week.allocatedDays === 0 ? '#9CA3AF' : '#1F2937',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    >
                      {week.allocatedDays > 0 ? week.allocatedDays.toFixed(1) : '-'}
                    </div>
                  </Tooltip>
                </td>
              ))}
              <td style={{
                padding: '8px',
                background: '#FFFFFF',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                {row.totalDays.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
