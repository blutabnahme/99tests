export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const secret = request.headers.get('x-cron-secret') ||
    new URL(request.url).searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Call the generate endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/admin/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
      body: JSON.stringify({}), // defaults to previous month
    });

    const data = await res.json();

    console.log(`[Cron] Invoice generation completed:`, data);

    return NextResponse.json({
      ...data,
      triggered_by: 'cron',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Invoice generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
