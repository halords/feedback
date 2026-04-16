import { NextRequest, NextResponse } from 'next/server';
import { verifySuperadmin } from '@/lib/auth/verifySession';
import { db, storage } from '@/lib/firebase/admin';
import { getDashboardMetrics } from '@/lib/services/metricsService';
import { getEffectiveOfficesForPeriod } from '@/lib/services/officeService';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization
    await verifySuperadmin();
    
    const { month, year } = await req.json();

    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    console.log(`[Archive] Starting archival for ${month} ${year}...`);

    // 2. Fetch Metadata and Metrics
    const offices = await getEffectiveOfficesForPeriod(month, year);
    const officeIds = offices.map(o => o.id);
    const officeIdToNameMap = Object.fromEntries(offices.map(o => [o.id, o.name]));
    
    console.log(`[Archive] Archiving ${officeIds.length} offices...`);
    
    // Pass IDs to metrics service
    const metrics = await getDashboardMetrics(officeIds, month, year);

    // 3. Fetch Raw Responses Data (Individual Table/PDF)
    // We fetch targeting the date range for performance
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
      const officeId = data.officeId || data.Office; // Support legacy and normalized
      
      // Filter by office ID
      if (!officeIds.includes(officeId)) return;

      // RESOLVE NAME SNAPSHOT: Preserve the current name for the history capsule
      const currentName = officeIdToNameMap[officeId] || data.Office || officeId;

      responses.push({ 
        id: doc.id, 
        ...data, 
        officeId,        // Ensure ID is present
        Office: currentName // SNAPSHOT: Use the resolved name at time of archive
      });
    });

    // 4. Upload to Firebase Storage
    // Structure: archives/{year}/{month}/...
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET;
    console.log(`[Archive] Using bucket: ${bucketName}`);
    
    if (!bucketName) {
      throw new Error("Storage bucket name not configured. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.");
    }

    const bucket = storage.bucket(bucketName);
    const metricsPath = `archives/${year}/${month}/metrics.json`;
    const responsesPath = `archives/${year}/${month}/responses.json`;

    console.log(`[Archive] Saving metrics to ${metricsPath} (${metrics?.length || 0} items)...`);
    await bucket.file(metricsPath).save(JSON.stringify(metrics || [], null, 2), {
      contentType: 'application/json',
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    console.log(`[Archive] Saving responses to ${responsesPath} (${responses?.length || 0} items)...`);
    await bucket.file(responsesPath).save(JSON.stringify(responses || [], null, 2), {
      contentType: 'application/json',
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    console.log(`[Archive] Upload complete for ${month} ${year}. Sending response...`);

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
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status });
  }
}


/**
 * GET requests can be used to check status of an archive
 */
export async function GET(req: NextRequest) {
  try {
    await verifySuperadmin();
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
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status });
  }

}
