import { NextResponse } from 'next/server';
import { db, storage } from '@/lib/firebase/admin';
import { getDashboardMetrics } from '@/lib/services/metricsService';
import { getEffectiveOfficesForPeriod } from '@/lib/services/officeService';
import { withAuth } from '@/lib/auth/withAuth';

/**
 * POST /api/admin/archive
 * Triggers the snapshot archival of a specific month/year.
 * Restricted to Superadmins.
 */
export const POST = withAuth(async (req) => {
  try {
    const { month, year } = await req.clone().json();

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    console.log(`[Archive] Starting archival for ${month} ${year}...`);

    // 2. Fetch Metadata and Metrics
    const offices = await getEffectiveOfficesForPeriod(month, year);
    const officeIds = offices.map(o => o.id);
    const officeIdToNameMap = Object.fromEntries(offices.map(o => [o.id, o.name]));
    
    console.log(`[Archive] Archiving ${officeIds.length} offices...`);
    
    const metrics = await getDashboardMetrics(officeIds, month, year);

    // 3. Fetch Raw Responses Data
    const monthMap: Record<string, string> = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const startDateIso = `${year}-${monthMap[month]}-01`;
    const endDateIso = `${year}-${monthMap[month]}-31`;

    const responsesSnapshot = await db.collection('Responses')
      .where('date_iso', '>=', startDateIso)
      .where('date_iso', '<=', endDateIso)
      .get();

    const responses: any[] = [];
    
    responsesSnapshot.forEach(doc => {
      const data = doc.data();
      const officeId = data.officeId || data.Office;
      
      if (!officeIds.includes(officeId)) return;

      const currentName = officeIdToNameMap[officeId] || data.Office || officeId;

      responses.push({ 
        id: doc.id, 
        ...data, 
        officeId,
        Office: currentName
      });
    });

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Storage bucket name not configured.");
    }

    const bucket = storage.bucket(bucketName);
    const metricsPath = `archives/${year}/${month}/metrics.json`;
    const responsesPath = `archives/${year}/${month}/responses.json`;

    await bucket.file(metricsPath).save(JSON.stringify(metrics || [], null, 2), {
      contentType: 'application/json',
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    await bucket.file(responsesPath).save(JSON.stringify(responses || [], null, 2), {
      contentType: 'application/json',
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    return NextResponse.json({
      success: true,
      message: `Archived ${month} ${year} successfully.`,
      metricsPath,
      responsesPath,
      counts: {
        officesArchived: metrics?.length || 0,
        rawResponses: responses?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Archival critical error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}, { role: "superadmin" });

/**
 * GET /api/admin/archive
 * Checks status of archives or returns available years.
 */
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    if (mode === 'years') {
      const startYear = 2025;
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let y = currentYear; y >= startYear; y--) {
        years.push(y.toString());
      }
      return NextResponse.json({ years });
    }

    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const metricsPath = `archives/${year}/${month}/metrics.json`;
    const responsesPath = `archives/${year}/${month}/responses.json`;

    const [metricsExists] = await bucket.file(metricsPath).exists();
    const [responsesExists] = await bucket.file(responsesPath).exists();

    return NextResponse.json({
      archived: metricsExists && responsesExists,
      files: {
        metrics: metricsExists,
        responses: responsesExists
      }
    });
  } catch (error: any) {
    console.error('❌ Archive GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}, { role: "superadmin" });
