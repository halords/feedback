import { NextResponse } from 'next/server';
import { saveAIReport } from '@/lib/services/aiReportService';
import { withAuth } from '@/lib/auth/withAuth';

/**
 * POST /api/ai/reports
 * Persists a new AI report to the database.
 */
export const POST = withAuth(async (req, context, user) => {
  try {
    const { content, year, timeScope, period, scope = 'organization', officeId = null } = await req.json();

    if (!content || !year || !timeScope || !period) {
      return NextResponse.json({ error: 'Missing report data' }, { status: 400 });
    }

    const reportId = await saveAIReport({
      userId: user.uid,
      scope,
      officeId,
      year,
      timeScope,
      period,
      title: content.title || 'Customer Feedback Analysis Report',
      content: content
    });

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Report saved successfully'
    });
  } catch (error: any) {
    console.error('❌ Save report error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}, { role: "superadmin" });
