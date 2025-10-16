import { NextRequest } from 'next/server';
import { generatePowerPoint } from '@/lib/exports/powerpoint-generator';
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
    if (!data.name || !data.totalMD || !data.durationMonths || !data.phases) {
      return Response.json(
        { error: 'Missing required fields: name, totalMD, durationMonths, phases' },
        { status: 400 }
      );
    }

    // Generate PowerPoint
    const pptx = await generatePowerPoint(data);

    // Return as downloadable file
    const filename = `SAP_Estimate_${data.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;

    return new Response(new Uint8Array(pptx), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pptx.length.toString(),
      },
    });
  } catch (error) {
    console.error('PowerPoint generation error:', error);
    return Response.json(
      { error: 'Failed to generate PowerPoint', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
