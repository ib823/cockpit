import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.name || !data.phases) {
      return Response.json(
        { error: 'Missing required fields: name, phases' },
        { status: 400 }
      );
    }

    // Generate CSV content
    const csvRows: string[][] = [];

    // Header
    csvRows.push(['SAP S/4HANA Implementation Estimate']);
    csvRows.push(['Project Name', data.name]);
    csvRows.push(['Generated', new Date().toISOString()]);
    csvRows.push([]); // Empty row

    // Summary
    csvRows.push(['SUMMARY']);
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Effort', `${data.totalMD?.toFixed(0) || 0} MD`]);
    csvRows.push(['Duration', `${data.durationMonths?.toFixed(1) || 0} months`]);
    csvRows.push(['PMO Effort', `${data.pmoMD?.toFixed(0) || 0} MD`]);
    if (data.startDate) {
      csvRows.push(['Start Date', new Date(data.startDate).toLocaleDateString()]);
    }
    csvRows.push([]); // Empty row

    // Phase Breakdown
    csvRows.push(['PHASE BREAKDOWN']);
    csvRows.push(['Phase', 'Effort (MD)', 'Duration (months)', '% of Total']);

    const totalMD = data.totalMD || 1;
    data.phases.forEach((phase: any) => {
      csvRows.push([
        phase.phaseName,
        phase.effortMD?.toFixed(1) || '0',
        phase.durationMonths?.toFixed(2) || '0',
        `${((phase.effortMD / totalMD) * 100).toFixed(1)}%`
      ]);
    });

    csvRows.push([]); // Empty row

    // Totals
    csvRows.push(['TOTALS']);
    csvRows.push([
      'Total',
      data.totalMD?.toFixed(0) || '0',
      data.durationMonths?.toFixed(1) || '0',
      '100%'
    ]);

    // Resources (if available)
    if (data.resources && data.resources.length > 0) {
      csvRows.push([]); // Empty row
      csvRows.push(['RESOURCE PLAN']);
      csvRows.push(['Role', 'FTE', 'Rate/Day', 'Total Cost']);

      data.resources.forEach((resource: any) => {
        csvRows.push([
          resource.role,
          resource.fte?.toFixed(1) || '0',
          `$${resource.ratePerDay || 0}`,
          `$${resource.totalCost?.toLocaleString() || '0'}`
        ]);
      });

      // Resource totals
      const totalFTE = data.resources.reduce((sum: number, r: any) => sum + (r.fte || 0), 0);
      const totalCost = data.resources.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0);
      csvRows.push([
        'TOTAL',
        totalFTE.toFixed(1),
        '',
        `$${totalCost.toLocaleString()}`
      ]);
    }

    // Coefficients (if available)
    if (data.coefficients) {
      csvRows.push([]); // Empty row
      csvRows.push(['COMPLEXITY FACTORS']);
      csvRows.push(['Factor', 'Value']);
      csvRows.push(['Scope Breadth (Sb)', data.coefficients.Sb?.toFixed(3) || '0']);
      csvRows.push(['Process Complexity (Pc)', data.coefficients.Pc?.toFixed(3) || '0']);
      csvRows.push(['Organizational Scale (Os)', data.coefficients.Os?.toFixed(3) || '0']);
    }

    // Convert to CSV string
    const csv = csvRows
      .map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
      .join('\n');

    const filename = `SAP_Estimate_${data.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('CSV generation error:', error);
    return Response.json(
      { error: 'Failed to generate CSV', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
