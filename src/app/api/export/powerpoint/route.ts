import { NextRequest } from 'next/server';
import { generatePowerPoint } from '@/lib/exports/powerpoint-generator';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/api-route-wrapper';
import { prisma } from '@/lib/db';

// Fixed: V-009 - CSRF protection on export endpoint
// Fixed: V-008 - Data ownership verification before export
export const POST = withCsrfProtection(async (req: NextRequest) => {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Fixed: V-008 - Verify user owns this project before allowing export
    if (data.projectId) {
      const project = await prisma.projects.findUnique({
        where: { id: data.projectId },
        select: { userId: true },
      });

      if (!project) {
        return Response.json({ error: 'Project not found' }, { status: 404 });
      }

      if (project.userId !== session.user.id) {
        console.warn('[SECURITY] Attempted unauthorized PowerPoint export', {
          userId: session.user.id,
          projectId: data.projectId,
          projectOwner: project.userId,
        });
        return Response.json(
          { error: 'Forbidden: You do not have access to this project' },
          { status: 403 }
        );
      }
    }

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
});
