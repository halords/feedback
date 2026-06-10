import { NextResponse } from 'next/server';
import { updateAIReport } from '@/lib/services/aiReportService';
import { withAuth } from '@/lib/auth/withAuth';

/**
 * PATCH /api/ai/reports/[id]
 * Updates an existing AI report's content.
 */
export const PATCH = withAuth(async (req, { params }) => {
  try {
    const { id } = await params;
    const { content } = await req.json();

    if (!id || !content) {
      return NextResponse.json({ error: 'Missing ID or content' }, { status: 400 });
    }

    await updateAIReport(id, content);

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully'
    });
  } catch (error: any) {
    console.error('❌ Update report error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}, { role: "superadmin" });
