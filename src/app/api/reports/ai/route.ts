import { NextResponse } from 'next/server';
import { generateAIReport } from '@/lib/reports/pdfGenerator';
import { withAuth } from '@/lib/auth/withAuth';

/**
 * POST /api/reports/ai
 * Generates a premium PDF for the AI analysis with embedded charts.
 */
export const POST = withAuth(async (req) => {
  try {
    const { content, images, period, year, preparedBy, position } = await req.json();

    if (!content || !period || !year) {
      return NextResponse.json({ error: 'Missing report data' }, { status: 400 });
    }

    const pdfBytes = await generateAIReport(content, images || [], period, year, preparedBy, position);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AI_Intelligence_Report_${period}_${year}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('❌ AI PDF Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}, { role: "superadmin" });
