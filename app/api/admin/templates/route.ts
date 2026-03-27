export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_template')
      .select('*')
      .order('category', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching notification templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Templates fetched:', data?.length);

    // Parse the available_variables json if needed, but it's already a text column formatted as json string
    const processed = data.map(t => ({
      ...t,
      available_variables: typeof t.available_variables === 'string' 
        ? JSON.parse(t.available_variables || '[]') 
        : t.available_variables
    }));

    return NextResponse.json({ templates: processed }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/admin/templates:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
